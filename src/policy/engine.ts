import type { CatalogItem } from '../contracts/v1/catalog.ts';
import type { ClaimExtraction } from '../contracts/v1/claim.ts';
import type { EvidenceReference } from '../contracts/v1/evidence.ts';
import type { ClaimVerdict, OverallCheckVerdict, VerdictStatus, VerdictReasonCode } from '../contracts/v1/verdict.ts';
import { determineCompositeVerdict } from '../contracts/v1/verdict.ts';
import { resolveEvidenceForClaim } from '../evidence/resolver.ts';
import { DEFAULT_POLICY_VERSION } from '../contracts/v1/index.ts';

/**
 * Deterministically evaluates a single extracted claim against catalog facts and corroborating evidence.
 * The generative model never approves claims; evaluation is strictly deterministic and fail-closed.
 */
export function evaluateClaimAgainstEvidence(
  claim: ClaimExtraction,
  catalog: CatalogItem,
  evidenceList: readonly EvidenceReference[],
  options?: { asOf?: Date | string }
): ClaimVerdict {
  const evaluatedAt = options?.asOf ? new Date(options.asOf).toISOString() : new Date().toISOString();

  // Route OUT_OF_SCOPE claims immediately to REVIEW (fail-closed)
  if (claim.claimClass === 'OUT_OF_SCOPE') {
    return {
      claimId: claim.claimId,
      claimClass: 'OUT_OF_SCOPE',
      status: 'REVIEW',
      primaryReason: 'OUT_OF_SCOPE_CLAIM',
      detail: `Claim "${claim.normalizedStatement}" is subjective or falls outside the 4 verifiable commerce claim classes. Requires human review.`,
      evidenceReferences: [],
      evaluatedAt,
    };
  }

  // Filter evidence candidates for this specific claim
  const claimEvidence = evidenceList.filter((ev) => ev.claimId === claim.claimId);
  const resolution = resolveEvidenceForClaim(claimEvidence, options);

  // If evidence resolution detected staleness, contradiction, or missing evidence, fail-closed
  if (resolution.status !== 'ALLOW' && resolution.status !== undefined) {
    return {
      claimId: claim.claimId,
      claimClass: claim.claimClass,
      status: resolution.status,
      primaryReason: resolution.reasonCode,
      detail: resolution.detail,
      evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
      evaluatedAt,
    };
  }

  // Evaluate class-specific deterministic factual rules
  switch (claim.claimClass) {
    case 'PRICE_DISCOUNT': {
      const activePrice = catalog.pricing.amount;
      const statedPrice = claim.extractedParameters.statedPrice;

      if (statedPrice !== undefined) {
        if (statedPrice < activePrice) {
          return {
            claimId: claim.claimId,
            claimClass: 'PRICE_DISCOUNT',
            status: 'BLOCK',
            primaryReason: 'PRICE_MISMATCH',
            detail: `Advertised price ($${statedPrice}) is lower than the active merchant catalog price ($${activePrice}).`,
            evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
            evaluatedAt,
          };
        }
        if (statedPrice > activePrice) {
          return {
            claimId: claim.claimId,
            claimClass: 'PRICE_DISCOUNT',
            status: 'REVIEW',
            primaryReason: 'PRICE_MISMATCH',
            detail: `Advertised price ($${statedPrice}) is higher than the active price ($${activePrice}). Possible copy discrepancy.`,
            evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
            evaluatedAt,
          };
        }
      }

      const statedDiscount = claim.extractedParameters.statedDiscountPercent;
      const actualDiscount = catalog.pricing.discountPercentage ?? 0;

      if (statedDiscount !== undefined && statedDiscount > actualDiscount) {
        return {
          claimId: claim.claimId,
          claimClass: 'PRICE_DISCOUNT',
          status: 'BLOCK',
          primaryReason: 'DISCOUNT_UNSUPPORTED',
          detail: `Advertised discount (${statedDiscount}%) exceeds approved catalog discount (${actualDiscount}%).`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      return {
        claimId: claim.claimId,
        claimClass: 'PRICE_DISCOUNT',
        status: 'ALLOW',
        primaryReason: 'MATCHES_APPROVED_FACTS',
        detail: `Price and discount claims fully corroborated by approved pricing record.`,
        evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
        evaluatedAt,
      };
    }

    case 'AVAILABILITY': {
      const stockStatus = catalog.inventory.stockStatus;
      const availableQty = catalog.inventory.availableQuantity;

      if (stockStatus === 'OUT_OF_STOCK' || availableQty === 0) {
        return {
          claimId: claim.claimId,
          claimClass: 'AVAILABILITY',
          status: 'BLOCK',
          primaryReason: 'PRODUCT_OUT_OF_STOCK',
          detail: `Ad copy claims product is in stock, but inventory feed confirms stockStatus is ${stockStatus} (quantity: ${availableQty}).`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      if (stockStatus === 'BACKORDER' || stockStatus === 'LOW_STOCK') {
        return {
          claimId: claim.claimId,
          claimClass: 'AVAILABILITY',
          status: 'REVIEW',
          primaryReason: 'AMBIGUOUS_CLAIM',
          detail: `Product availability status is ${stockStatus} (${availableQty} units remaining). Copy requires qualification before publication.`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      return {
        claimId: claim.claimId,
        claimClass: 'AVAILABILITY',
        status: 'ALLOW',
        primaryReason: 'MATCHES_APPROVED_FACTS',
        detail: `Availability claim confirmed: ${availableQty} units currently in stock.`,
        evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
        evaluatedAt,
      };
    }

    case 'SHIPPING_PROMISE': {
      const shippingPolicies = catalog.shipping;
      const statedDays = claim.extractedParameters.statedDeliveryWindowDays;

      // Check delivery speed claim against available shipping tiers
      if (statedDays !== undefined) {
        const fastestTier = Math.min(...shippingPolicies.map((s) => s.maxTransitDays));
        if (statedDays < fastestTier) {
          return {
            claimId: claim.claimId,
            claimClass: 'SHIPPING_PROMISE',
            status: 'BLOCK',
            primaryReason: 'SHIPPING_TIMELINE_UNSUPPORTED',
            detail: `Promised delivery timeline (${statedDays} days) cannot be met by any active carrier tier (fastest tier is ${fastestTier} days).`,
            evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
            evaluatedAt,
          };
        }
      }

      // Check free shipping claims if mentioned
      const claimsFreeShipping = /free\s+shipping|free\s+delivery/i.test(claim.normalizedStatement);
      if (claimsFreeShipping) {
        const hasUnconditionalFreeShipping = shippingPolicies.some(
          (s) => s.isFreeShipping && (!s.minSpendThreshold || s.minSpendThreshold <= catalog.pricing.amount)
        );

        if (!hasUnconditionalFreeShipping) {
          return {
            claimId: claim.claimId,
            claimClass: 'SHIPPING_PROMISE',
            status: 'BLOCK',
            primaryReason: 'SHIPPING_TIMELINE_UNSUPPORTED',
            detail: `Copy claims free shipping, but product price ($${catalog.pricing.amount}) does not meet shipping tier thresholds.`,
            evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
            evaluatedAt,
          };
        }
      }

      return {
        claimId: claim.claimId,
        claimClass: 'SHIPPING_PROMISE',
        status: 'ALLOW',
        primaryReason: 'MATCHES_APPROVED_FACTS',
        detail: `Shipping promise verified against active carrier policies.`,
        evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
        evaluatedAt,
      };
    }

    case 'PRODUCT_ATTRIBUTE': {
      const statedKey = claim.extractedParameters.statedAttributeKey?.toLowerCase();
      const statedVal = claim.extractedParameters.statedAttributeValue?.toLowerCase();

      if (!statedKey) {
        return {
          claimId: claim.claimId,
          claimClass: 'PRODUCT_ATTRIBUTE',
          status: 'REVIEW',
          primaryReason: 'AMBIGUOUS_CLAIM',
          detail: `Product attribute key could not be cleanly identified from copy span. Requires operator review.`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      const matchingAttr = catalog.attributes.find(
        (attr) => attr.key.toLowerCase() === statedKey || attr.standardizedValue?.toLowerCase() === statedKey
      );

      if (!matchingAttr) {
        return {
          claimId: claim.claimId,
          claimClass: 'PRODUCT_ATTRIBUTE',
          status: 'REVIEW',
          primaryReason: 'MISSING_EVIDENCE',
          detail: `Claimed attribute "${statedKey}" is not listed in approved product catalog specifications.`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      if (statedVal && !matchingAttr.value.toLowerCase().includes(statedVal)) {
        return {
          claimId: claim.claimId,
          claimClass: 'PRODUCT_ATTRIBUTE',
          status: 'BLOCK',
          primaryReason: 'ATTRIBUTE_CONTRADICTED',
          detail: `Claimed attribute value ("${statedVal}") contradicts approved specification ("${matchingAttr.value}").`,
          evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
          evaluatedAt,
        };
      }

      return {
        claimId: claim.claimId,
        claimClass: 'PRODUCT_ATTRIBUTE',
        status: 'ALLOW',
        primaryReason: 'MATCHES_APPROVED_FACTS',
        detail: `Attribute "${statedKey}: ${matchingAttr.value}" verified against product specification.`,
        evidenceReferences: resolution.selectedEvidence ? [resolution.selectedEvidence] : [],
        evaluatedAt,
      };
    }

    default:
      return {
        claimId: claim.claimId,
        claimClass: 'OUT_OF_SCOPE',
        status: 'REVIEW',
        primaryReason: 'UNSUPPORTED_CLAIM_CLASS',
        detail: `Unsupported claim class encountered. Fail-closed to human review.`,
        evidenceReferences: [],
        evaluatedAt,
      };
  }
}

/**
 * Top-level Policy Engine entrypoint evaluating entire ad copy submission
 */
export function evaluateAdCopyPolicy(params: {
  checkId: string;
  copyText: string;
  catalog: CatalogItem;
  claims: readonly ClaimExtraction[];
  evidenceList: readonly EvidenceReference[];
  options?: { asOf?: Date | string; policyVersion?: string };
}): OverallCheckVerdict {
  const evaluatedAt = params.options?.asOf
    ? new Date(params.options.asOf).toISOString()
    : new Date().toISOString();
  const policyVersion = params.options?.policyVersion ?? DEFAULT_POLICY_VERSION;

  const claimVerdicts = params.claims.map((claim) =>
    evaluateClaimAgainstEvidence(claim, params.catalog, params.evidenceList, params.options)
  );

  const compositeStatus = determineCompositeVerdict(claimVerdicts);

  let summary: string;
  if (compositeStatus === 'ALLOW') {
    summary = `All ${claimVerdicts.length} claim(s) substantiated by fresh, unambiguous merchant evidence. Publication cleared.`;
  } else if (compositeStatus === 'BLOCK') {
    const blockCount = claimVerdicts.filter((v) => v.status === 'BLOCK').length;
    summary = `Publication blocked: ${blockCount} claim(s) contradict approved merchant facts or inventory.`;
  } else {
    const reviewCount = claimVerdicts.filter((v) => v.status === 'REVIEW').length;
    summary = `Routed to operator review queue: ${reviewCount} claim(s) require human verification (ambiguous, near-expiry, or missing evidence).`;
  }

  return {
    verdictId: `vrd-${params.checkId}`,
    checkId: params.checkId,
    compositeStatus,
    claimVerdicts,
    summary,
    evaluatedAt,
    policyVersion,
  };
}
