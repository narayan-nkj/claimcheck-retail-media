/**
 * ClaimCheck Operator Web Portal Client Application
 * Zero-bloat, accessible vanilla JS implementation.
 */

(function () {
  'use strict';

  // Client State
  const state = {
    presets: {},
    activePreset: null,
    currentCheck: null,
    operatorRole: 'SENIOR_COMPLIANCE_OFFICER',
    queueItems: [],
    auditEvents: [],
    timerIntervalId: null,
  };

  // DOM Elements
  const elements = {
    adCopyInput: document.getElementById('adCopyInput'),
    skuSelect: document.getElementById('skuSelect'),
    operatorRoleSelect: document.getElementById('operatorRoleSelect'),
    charCount: document.getElementById('charCount'),
    checkForm: document.getElementById('checkForm'),
    btnRunCheck: document.getElementById('btnRunCheck'),
    btnReset: document.getElementById('btnReset'),
    verdictBanner: document.getElementById('verdictBanner'),
    verdictBadge: document.getElementById('verdictBadge'),
    verdictReasonBadge: document.getElementById('verdictReasonBadge'),
    verdictCheckId: document.getElementById('verdictCheckId'),
    verdictSummary: document.getElementById('verdictSummary'),
    verdictIcon: document.getElementById('verdictIcon'),
    metaLatency: document.getElementById('metaLatency'),
    metaClaimCount: document.getElementById('metaClaimCount'),
    highlightedCopyContainer: document.getElementById('highlightedCopyContainer'),
    highlightedText: document.getElementById('highlightedText'),
    claimsContainer: document.getElementById('claimsContainer'),
    claimsGrid: document.getElementById('claimsGrid'),
    queueEmptyState: document.getElementById('queueEmptyState'),
    queueItemsList: document.getElementById('queueItemsList'),
    auditEmptyState: document.getElementById('auditEmptyState'),
    auditStreamList: document.getElementById('auditStreamList'),
    auditReplayResultBanner: document.getElementById('auditReplayResultBanner'),
    replayDetailsText: document.getElementById('replayDetailsText'),
    queueDepthBadge: document.getElementById('queueDepthBadge'),
    tabQueueBadge: document.getElementById('tabQueueBadge'),
    activeRoleLabel: document.getElementById('activeRoleLabel'),
    p95LatencyText: document.getElementById('p95LatencyText'),
    metricTotalChecks: document.getElementById('metricTotalChecks'),
    metricTotalPasses: document.getElementById('metricTotalPasses'),
    metricTotalBlocks: document.getElementById('metricTotalBlocks'),
    metricTotalOverrides: document.getElementById('metricTotalOverrides'),
    telemetryRawDisplay: document.getElementById('telemetryRawDisplay'),
    tabReview: document.getElementById('tabReview'),
    tabAudit: document.getElementById('tabAudit'),
    tabTelemetry: document.getElementById('tabTelemetry'),
    viewReview: document.getElementById('viewReview'),
    viewAudit: document.getElementById('viewAudit'),
    viewTelemetry: document.getElementById('viewTelemetry'),
    btnRefreshQueue: document.getElementById('btnRefreshQueue'),
    btnRefreshAudit: document.getElementById('btnRefreshAudit'),
  };

  /**
   * Client-side PII and credential sanitizer (Phase 03 requirement)
   */
  function sanitizeInputText(text) {
    if (!text) return '';
    return text
      .replace(/(?:bearer\s+)?[a-zA-Z0-9_\-]{24,}/gi, '[REDACTED_TOKEN]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
      .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_PAYMENT_CARD]');
  }

  /**
   * Initialize Application
   */
  async function init() {
    setupEventListeners();
    await loadPresets();
    await refreshQueue();
    await refreshAuditStream();
    await refreshTelemetry();

    // Start SLA Countdown clock (updates every second)
    state.timerIntervalId = setInterval(updateSlaCountdowns, 1000);

    // Periodic telemetry refresh
    setInterval(refreshTelemetry, 5000);
  }

  /**
   * Attach DOM Event Listeners
   */
  function setupEventListeners() {
    // Character Counter
    elements.adCopyInput.addEventListener('input', () => {
      const len = elements.adCopyInput.value.length;
      elements.charCount.textContent = `${len} / 2000`;
    });

    // Keyboard Shortcut (Ctrl/Cmd + Enter)
    elements.adCopyInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        elements.checkForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    // Role Selector Change
    elements.operatorRoleSelect.addEventListener('change', (e) => {
      state.operatorRole = e.target.value;
      const roleText = e.target.options[e.target.selectedIndex].text.split(' (')[0];
      elements.activeRoleLabel.textContent = roleText;
      renderQueue(); // Re-render to enforce role buttons
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        loadPresetIntoForm(presetKey);
      });
    });

    // Form Submit
    elements.checkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await runVerificationCheck();
    });

    // Form Reset
    elements.btnReset.addEventListener('click', resetForm);

    // Tabs Navigation
    elements.tabReview.addEventListener('click', () => switchTab('review'));
    elements.tabAudit.addEventListener('click', () => switchTab('audit'));
    elements.tabTelemetry.addEventListener('click', () => switchTab('telemetry'));

    // Refresh Buttons
    elements.btnRefreshQueue.addEventListener('click', refreshQueue);
    elements.btnRefreshAudit.addEventListener('click', refreshAuditStream);
  }

  /**
   * Switch Active Tab
   */
  function switchTab(tabKey) {
    elements.tabReview.classList.remove('active');
    elements.tabReview.setAttribute('aria-selected', 'false');
    elements.tabAudit.classList.remove('active');
    elements.tabAudit.setAttribute('aria-selected', 'false');
    elements.tabTelemetry.classList.remove('active');
    elements.tabTelemetry.setAttribute('aria-selected', 'false');

    elements.viewReview.classList.add('hidden');
    elements.viewAudit.classList.add('hidden');
    elements.viewTelemetry.classList.add('hidden');

    if (tabKey === 'review') {
      elements.tabReview.classList.add('active');
      elements.tabReview.setAttribute('aria-selected', 'true');
      elements.viewReview.classList.remove('hidden');
    } else if (tabKey === 'audit') {
      elements.tabAudit.classList.add('active');
      elements.tabAudit.setAttribute('aria-selected', 'true');
      elements.viewAudit.classList.remove('hidden');
    } else if (tabKey === 'telemetry') {
      elements.tabTelemetry.classList.add('active');
      elements.tabTelemetry.setAttribute('aria-selected', 'true');
      elements.viewTelemetry.classList.remove('hidden');
    }
  }

  /**
   * Load Presets from Backend API
   */
  async function loadPresets() {
    try {
      const res = await fetch('/api/presets');
      const data = await res.json();
      if (data.success && data.presets) {
        data.presets.forEach((p) => {
          state.presets[p.id] = p;
        });
      }
    } catch (err) {
      console.warn('Could not fetch presets:', err);
    }
  }

  /**
   * Populate Form with Preset Data
   */
  function loadPresetIntoForm(presetKey) {
    const preset = state.presets[presetKey];
    if (!preset) return;

    state.activePreset = presetKey;
    elements.adCopyInput.value = preset.adCopyText;
    elements.skuSelect.value = preset.sku;
    elements.charCount.textContent = `${preset.adCopyText.length} / 2000`;

    // Highlight active preset button visually
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active-preset'));
    const activeBtn = document.querySelector(`[data-preset="${presetKey}"]`);
    if (activeBtn) activeBtn.classList.add('active-preset');

    // Automatically execute the check for immediate feedback
    runVerificationCheck();
  }

  /**
   * Run Ad Copy Verification Check
   */
  async function runVerificationCheck() {
    const rawText = elements.adCopyInput.value.trim();
    if (!rawText) {
      elements.adCopyInput.focus();
      return;
    }

    const sanitized = sanitizeInputText(rawText);
    const sku = elements.skuSelect.value;
    const presetId = state.activePreset;

    elements.btnRunCheck.disabled = true;
    elements.btnRunCheck.querySelector('.btn-text').textContent = 'Evaluating Deterministic Policy...';

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adCopyText: sanitized,
          sku,
          presetId,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(`Verification Error: ${result.error}`);
        return;
      }

      state.currentCheck = result;
      renderCheckResult(result);
      await refreshQueue();
      await refreshAuditStream();
      await refreshTelemetry();
    } catch (err) {
      alert(`Network Error: ${err.message}`);
    } finally {
      elements.btnRunCheck.disabled = false;
      elements.btnRunCheck.querySelector('.btn-text').textContent = 'Verify Ad Copy with Evidence Gate';
    }
  }

  /**
   * Render Check Result in UI
   */
  function renderCheckResult(result) {
    const verdict = result.verdict;
    const status = verdict.compositeStatus; // 'ALLOW', 'REVIEW', 'BLOCK'

    // 1. Update Verdict Banner
    elements.verdictBanner.className = `verdict-banner status-${status.toLowerCase()}`;
    elements.verdictBanner.classList.remove('hidden');

    elements.verdictBadge.textContent = status;
    const primaryReason = verdict.claimVerdicts[0]?.primaryReason || 'UNKNOWN';
    elements.verdictReasonBadge.textContent = primaryReason;
    elements.verdictCheckId.textContent = result.checkId;
    elements.verdictSummary.textContent = verdict.summary;

    if (status === 'ALLOW') {
      elements.verdictIcon.textContent = '🛡️';
    } else if (status === 'BLOCK') {
      elements.verdictIcon.textContent = '⛔';
    } else {
      elements.verdictIcon.textContent = '⚠️';
    }

    elements.metaLatency.textContent = `${result.latencyMs}ms`;
    elements.metaClaimCount.textContent = result.extractedClaims.length;

    // 2. Render Highlighted Spans
    renderHighlightedSpans(result.adCopyText, result.extractedClaims);

    // 3. Render Claims Breakdown Grid
    renderClaimsGrid(result.extractedClaims, verdict.claimVerdicts);
  }

  /**
   * Render Highlighted Spans in Raw Ad Copy Text
   */
  function renderHighlightedSpans(fullText, claims) {
    elements.highlightedCopyContainer.classList.remove('hidden');

    if (!claims || claims.length === 0) {
      elements.highlightedText.textContent = fullText;
      return;
    }

    // Sort claims by start index
    const sorted = [...claims].sort((a, b) => a.rawSpan.startIndex - b.rawSpan.startIndex);
    let html = '';
    let lastIndex = 0;

    sorted.forEach((claim) => {
      const start = Math.max(0, Math.min(claim.rawSpan.startIndex, fullText.length));
      const end = Math.max(start, Math.min(claim.rawSpan.endIndex, fullText.length));

      // Append preceding unhighlighted text
      if (start > lastIndex) {
        html += escapeHtml(fullText.substring(lastIndex, start));
      }

      // Span class
      let spanClass = 'span-price';
      if (claim.claimClass === 'AVAILABILITY') spanClass = 'span-avail';
      else if (claim.claimClass === 'SHIPPING_PROMISE') spanClass = 'span-ship';
      else if (claim.claimClass === 'PRODUCT_ATTRIBUTE') spanClass = 'span-attr';

      const spanText = fullText.substring(start, end);
      html += `<mark class="claim-span ${spanClass}" title="${claim.claimClass}: ${escapeHtml(claim.normalizedStatement)}">${escapeHtml(spanText)}</mark>`;
      lastIndex = end;
    });

    if (lastIndex < fullText.length) {
      html += escapeHtml(fullText.substring(lastIndex));
    }

    elements.highlightedText.innerHTML = html;
  }

  /**
   * Render Claims Breakdown Cards
   */
  function renderClaimsGrid(claims, claimVerdicts) {
    elements.claimsContainer.classList.remove('hidden');
    elements.claimsGrid.innerHTML = '';

    if (!claims || claims.length === 0) {
      elements.claimsGrid.innerHTML = '<p class="empty-text">No structured commerce claims extracted.</p>';
      return;
    }

    claims.forEach((claim) => {
      const vrd = claimVerdicts.find((v) => v.claimId === claim.claimId);
      const status = vrd ? vrd.status : 'REVIEW';
      const reason = vrd ? vrd.primaryReason : 'PENDING';
      const detail = vrd ? vrd.detail : '';

      const card = document.createElement('div');
      card.className = 'claim-card';
      card.innerHTML = `
        <div class="claim-card-header">
          <span class="claim-class-tag">${escapeHtml(claim.claimClass)}</span>
          <span class="claim-status-pill pill-${status.toLowerCase()}">${status}: ${escapeHtml(reason)}</span>
        </div>
        <div class="claim-statement">"${escapeHtml(claim.normalizedStatement)}"</div>
        <div class="claim-detail-text">${escapeHtml(detail)}</div>
      `;
      elements.claimsGrid.appendChild(card);
    });
  }

  /**
   * Refresh Review Queue from Backend
   */
  async function refreshQueue() {
    try {
      const res = await fetch('/api/review/queue');
      const data = await res.json();
      if (data.success) {
        state.queueItems = data.items || [];
        renderQueue();
      }
    } catch (err) {
      console.warn('Failed to refresh queue:', err);
    }
  }

  /**
   * Render Review Queue List
   */
  function renderQueue() {
    const activeItems = state.queueItems.filter((item) => item.status !== 'RESOLVED');
    elements.queueDepthBadge.textContent = activeItems.length;
    elements.tabQueueBadge.textContent = activeItems.length;

    if (activeItems.length === 0) {
      elements.queueEmptyState.classList.remove('hidden');
      elements.queueItemsList.innerHTML = '';
      return;
    }

    elements.queueEmptyState.classList.add('hidden');
    elements.queueItemsList.innerHTML = '';

    activeItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'queue-item-card';

      // Check role authorization for override action
      const isJunior = state.operatorRole === 'JUNIOR_OPERATOR';
      const isBlock = item.compositeStatus === 'BLOCK';
      const overrideDisabled = isJunior && isBlock;

      card.innerHTML = `
        <div class="queue-item-header">
          <div>
            <div class="queue-item-title">${escapeHtml(item.queueId)}</div>
            <div class="claim-detail-text">Flagged: ${escapeHtml(item.flaggedReasons.join(', '))}</div>
          </div>
          <span class="sla-countdown" data-deadline="${escapeHtml(item.slaDeadline)}">Calculating...</span>
        </div>
        <div class="queue-item-copy">"${escapeHtml(item.adCopyText)}"</div>
        <div class="queue-actions-row">
          <button type="button" class="btn btn-sm btn-confirm-block" data-action="CONFIRMED_BLOCK" data-queue-id="${escapeHtml(item.queueId)}">
            Confirm Block
          </button>
          <button type="button" class="btn btn-sm btn-reextract" data-action="RE_EXTRACT_REQUESTED" data-queue-id="${escapeHtml(item.queueId)}">
            Re-Extract
          </button>
          <button type="button" class="btn btn-sm btn-override" data-action="APPROVED_OVERRIDE" data-queue-id="${escapeHtml(item.queueId)}" ${overrideDisabled ? 'disabled title="Junior Operators cannot override factual BLOCKs (DEC-010)"' : ''}>
            Approve Override
          </button>
        </div>
        ${overrideDisabled ? '<span class="role-restriction-note">⚠️ Senior Compliance Officer required to override factual block (DEC-010).</span>' : ''}
      `;

      // Action Handlers
      card.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const action = btn.getAttribute('data-action');
          const queueId = btn.getAttribute('data-queue-id');
          await resolveQueueItem(queueId, action);
        });
      });

      elements.queueItemsList.appendChild(card);
    });

    updateSlaCountdowns();
  }

  /**
   * Resolve an Item in the Review Queue
   */
  async function resolveQueueItem(queueId, action) {
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId,
          action,
          operatorRole: state.operatorRole,
          rationale: `Action executed via Web Portal by ${state.operatorRole}`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(`Authorization Blocked: ${data.error}`);
        return;
      }

      await refreshQueue();
      await refreshAuditStream();
      await refreshTelemetry();
    } catch (err) {
      alert(`Review Action Error: ${err.message}`);
    }
  }

  /**
   * Update SLA countdown timers
   */
  function updateSlaCountdowns() {
    document.querySelectorAll('.sla-countdown').forEach((el) => {
      const deadlineStr = el.getAttribute('data-deadline');
      if (!deadlineStr) return;

      const diffMs = new Date(deadlineStr).getTime() - Date.now();
      if (diffMs <= 0) {
        el.textContent = 'SLA EXPIRED';
        el.style.background = 'rgba(239, 68, 68, 0.4)';
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      el.textContent = `${mins}m ${secs < 10 ? '0' : ''}${secs}s SLA`;
    });
  }

  /**
   * Refresh Audit Stream from Backend
   */
  async function refreshAuditStream() {
    try {
      const res = await fetch('/api/audit/stream');
      const data = await res.json();
      if (data.success) {
        state.auditEvents = data.events || [];
        renderAuditStream();
      }
    } catch (err) {
      console.warn('Failed to refresh audit stream:', err);
    }
  }

  /**
   * Render Chained Audit Stream
   */
  function renderAuditStream() {
    if (state.auditEvents.length === 0) {
      elements.auditEmptyState.classList.remove('hidden');
      elements.auditStreamList.innerHTML = '';
      return;
    }

    elements.auditEmptyState.classList.add('hidden');
    elements.auditStreamList.innerHTML = '';

    // Render in reverse chronological order
    const reversed = [...state.auditEvents].reverse();

    reversed.forEach((ev) => {
      const card = document.createElement('div');
      card.className = 'audit-card';
      card.innerHTML = `
        <div class="audit-card-header">
          <span class="seq-num">Block #${ev.sequenceNumber}</span>
          <span>${escapeHtml(new Date(ev.timestamp).toLocaleTimeString())}</span>
        </div>
        <div class="hash-row">
          <span class="hash-label">Chain Digest (SHA-256 Linkage):</span>
          <span class="hash-value">${escapeHtml(ev.chainDigest)}</span>
        </div>
        <div class="hash-row">
          <span class="hash-label">Replay Digest (Payload Hash):</span>
          <span class="hash-value">${escapeHtml(ev.replayDigest)}</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary btn-replay" data-audit-id="${escapeHtml(ev.auditId)}">
          ⚡ 1-Click Historical Replay
        </button>
      `;

      card.querySelector('.btn-replay').addEventListener('click', async () => {
        await runHistoricalReplay(ev.auditId);
      });

      elements.auditStreamList.appendChild(card);
    });
  }

  /**
   * 1-Click Historical Replay Verification
   */
  async function runHistoricalReplay(auditId) {
    try {
      const res = await fetch('/api/audit/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId }),
      });

      const data = await res.json();
      if (data.success && data.replayResult) {
        const r = data.replayResult;
        elements.auditReplayResultBanner.classList.remove('hidden');
        if (r.isReproducible) {
          elements.replayDetailsText.textContent = `✓ Bit-for-bit match verified for ${r.auditId}. Stored status "${r.originalCompositeStatus}" equals replayed status "${r.replayedCompositeStatus}". Zero logic drift.`;
        } else {
          elements.replayDetailsText.textContent = `⚠️ Discrepancy detected: ${r.discrepancies.join('; ')}`;
        }
      }
    } catch (err) {
      alert(`Replay failed: ${err.message}`);
    }
  }

  /**
   * Refresh Live Telemetry Metrics
   */
  async function refreshTelemetry() {
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/metrics'),
      ]);

      const health = await healthRes.json();
      const rawMetrics = await metricsRes.text();

      if (health.metrics) {
        elements.metricTotalChecks.textContent = health.metrics.totalChecks;
        elements.metricTotalPasses.textContent = health.metrics.totalPasses;
        elements.metricTotalBlocks.textContent = health.metrics.totalBlocks;
        elements.metricTotalOverrides.textContent = health.metrics.totalOverrides;
        elements.queueDepthBadge.textContent = health.metrics.queueDepth;
      }

      elements.telemetryRawDisplay.textContent = rawMetrics;
    } catch (err) {
      console.warn('Telemetry refresh warning:', err);
    }
  }

  /**
   * Reset Form to Clean Baseline
   */
  function resetForm() {
    elements.adCopyInput.value = '';
    elements.charCount.textContent = '0 / 2000';
    state.activePreset = null;
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active-preset'));
    elements.verdictBanner.classList.add('hidden');
    elements.highlightedCopyContainer.classList.add('hidden');
    elements.claimsContainer.classList.add('hidden');
  }

  /**
   * Safe HTML Escaping utility
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
