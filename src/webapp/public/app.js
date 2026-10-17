/**
 * ClaimCheck Operator Web Portal Client Application
 * Zero-bloat, accessible vanilla JS implementation.
 * Inspired by Lucien (https://www.lucien.com/)
 */

(function () {
  'use strict';

  // Client State (CC-05: default role is Junior Operator)
  const state = {
    presets: {},
    activePreset: null,
    currentCheck: null,
    operatorRole: 'JUNIOR_OPERATOR',
    queueItems: [],
    auditEvents: [],
    timerIntervalId: null,
  };

  // DOM Elements
  const elements = {
    adCopyInput: document.getElementById('adCopyInput'),
    skuSelect: document.getElementById('skuSelect'),
    simulationModeSelect: document.getElementById('simulationModeSelect'),
    operatorRoleSelect: document.getElementById('operatorRoleSelect'),
    charCount: document.getElementById('charCount'),
    checkForm: document.getElementById('checkForm'),
    btnRunCheck: document.getElementById('btnRunCheck'),
    btnReset: document.getElementById('btnReset'),
    studioEmptyState: document.getElementById('studioEmptyState'),
    studioLoadingState: document.getElementById('studioLoadingState'),
    studioErrorState: document.getElementById('studioErrorState'),
    studioErrorMessage: document.getElementById('studioErrorMessage'),
    btnStudioRetry: document.getElementById('btnStudioRetry'),
    verdictBanner: document.getElementById('verdictBanner'),
    productFactCard: document.getElementById('productFactCard'),
    factProductCategory: document.getElementById('factProductCategory'),
    factProductTitle: document.getElementById('factProductTitle'),
    factProductSku: document.getElementById('factProductSku'),
    factPrice: document.getElementById('factPrice'),
    factDiscount: document.getElementById('factDiscount'),
    factStock: document.getElementById('factStock'),
    factShipping: document.getElementById('factShipping'),
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
    networkErrorBanner: document.getElementById('networkErrorBanner'),
    networkErrorMessage: document.getElementById('networkErrorMessage'),
    btnDismissNetworkError: document.getElementById('btnDismissNetworkError'),
    amdStatusText: document.getElementById('amdStatusText'),
    amdStatusDot: document.getElementById('amdStatusDot'),
    throughputText: document.getElementById('throughputText'),
    btnHeroAudit: document.getElementById('btnHeroAudit'),
  };

  /**
   * Network Error Boundary Display (Observability & Test Contract)
   */
  function showNetworkErrorBanner(message) {
    if (elements.networkErrorBanner && elements.networkErrorMessage) {
      elements.networkErrorMessage.textContent = message;
      elements.networkErrorBanner.classList.remove('hidden');
    }
  }

  function hideNetworkErrorBanner() {
    if (elements.networkErrorBanner) {
      elements.networkErrorBanner.classList.add('hidden');
    }
  }

  /**
   * Studio Evaluation 5-State Manager (CC-01 neutral empty state, loading, error, success)
   */
  function showStudioState(stateName, errorMsg = '') {
    if (elements.studioEmptyState) elements.studioEmptyState.classList.add('hidden');
    if (elements.studioLoadingState) elements.studioLoadingState.classList.add('hidden');
    if (elements.studioErrorState) elements.studioErrorState.classList.add('hidden');
    if (elements.verdictBanner) elements.verdictBanner.classList.add('hidden');
    if (elements.productFactCard) elements.productFactCard.classList.add('hidden');
    if (elements.highlightedCopyContainer) elements.highlightedCopyContainer.classList.add('hidden');
    if (elements.claimsContainer) elements.claimsContainer.classList.add('hidden');

    if (stateName === 'empty') {
      if (elements.studioEmptyState) elements.studioEmptyState.classList.remove('hidden');
    } else if (stateName === 'loading') {
      if (elements.studioLoadingState) elements.studioLoadingState.classList.remove('hidden');
    } else if (stateName === 'error') {
      if (elements.studioErrorState) {
        elements.studioErrorState.classList.remove('hidden');
        if (elements.studioErrorMessage) {
          elements.studioErrorMessage.textContent = errorMsg || 'Service unreachable or network connection dropped.';
        }
      }
    } else if (stateName === 'success') {
      if (elements.verdictBanner) elements.verdictBanner.classList.remove('hidden');
      if (elements.productFactCard) elements.productFactCard.classList.remove('hidden');
      if (elements.highlightedCopyContainer) elements.highlightedCopyContainer.classList.remove('hidden');
      if (elements.claimsContainer) elements.claimsContainer.classList.remove('hidden');
    }
  }

  /**
   * Client-side PII, credential, and secret sanitizer (Phase 03 WCAG & Security)
   */
  function sanitizeInputText(text) {
    if (!text) return '';
    return text
      .replace(/(?:bearer\s+)?[a-zA-Z0-9_\-\.]{24,}/gi, '[REDACTED_SECRET]')
      .replace(/sk-[a-zA-Z0-9]{20,}/gi, '[REDACTED_SECRET]')
      .replace(/ghp_[a-zA-Z0-9]{20,}/gi, '[REDACTED_SECRET]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
      .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_PAYMENT_CARD]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
      .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
  }

  /**
   * Initialize Application
   */
  async function init() {
    // CC-01: Initialize Studio to neutral empty state immediately
    showStudioState('empty');

    // CC-08: Global offline / online connectivity listeners
    window.addEventListener('offline', () => {
      showNetworkErrorBanner('Network connection dropped. Attempting to reconnect...');
    });
    window.addEventListener('online', () => {
      hideNetworkErrorBanner();
    });

    setupEventListeners();
    setupFaqAccordion();
    await loadPresets();
    await refreshQueue();
    await refreshAuditStream();
    await refreshTelemetry();

    // Start SLA Countdown clock (updates every second)
    state.timerIntervalId = setInterval(updateSlaCountdowns, 1000);

    // Periodic telemetry refresh
    setInterval(refreshTelemetry, 5000);

    // Lucien Hero, Nav Scroll Spy, Stat Rotator, Contact Dialog & Solution Diagram
    setupHeaderScrollAndSpy();
    setupStatRotator();
    setupContactDialog();
    setupSolutionDiagram();
  }

  /**
   * Attach DOM Event Listeners
   */
  function setupEventListeners() {
    // Character Counter & Reset Active Preset on Custom Typing
    if (elements.adCopyInput && elements.charCount) {
      elements.adCopyInput.addEventListener('input', () => {
        const len = elements.adCopyInput.value.length;
        elements.charCount.textContent = `${len} / 2000`;
        state.activePreset = null;
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active-preset'));
      });

      // Keyboard Shortcut (Ctrl/Cmd + Enter)
      elements.adCopyInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          elements.checkForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
    }

    // Role Selector Change
    if (elements.operatorRoleSelect) {
      elements.operatorRoleSelect.addEventListener('change', (e) => {
        state.operatorRole = e.target.value;
        const roleText = e.target.options[e.target.selectedIndex].text.split(' (')[0];
        if (elements.activeRoleLabel) elements.activeRoleLabel.textContent = roleText;
        renderQueue(); // Re-render to enforce role buttons
      });
    }

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        loadPresetIntoForm(presetKey);
      });
    });

    // Form Submit
    if (elements.checkForm) {
      elements.checkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await runVerificationCheck();
      });
    }

    // Form Reset
    if (elements.btnReset) {
      elements.btnReset.addEventListener('click', resetForm);
    }

    // Tabs Navigation
    if (elements.tabReview) elements.tabReview.addEventListener('click', () => switchTab('review'));
    if (elements.tabAudit) elements.tabAudit.addEventListener('click', () => switchTab('audit'));
    if (elements.tabTelemetry) elements.tabTelemetry.addEventListener('click', () => switchTab('telemetry'));

    // Hero Audit CTA
    if (elements.btnHeroAudit) {
      elements.btnHeroAudit.addEventListener('click', () => {
        switchTab('audit');
      });
    }

    // Refresh Buttons
    if (elements.btnRefreshQueue) elements.btnRefreshQueue.addEventListener('click', refreshQueue);
    if (elements.btnRefreshAudit) elements.btnRefreshAudit.addEventListener('click', refreshAuditStream);

    // Retry button on studio error state
    if (elements.btnStudioRetry) {
      elements.btnStudioRetry.addEventListener('click', async () => {
        await runVerificationCheck();
      });
    }

    // Deep-link Ops items via data-ops-tab (NV-02)
    document.querySelectorAll('[data-ops-tab]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const tab = link.getAttribute('data-ops-tab');
        if (tab) {
          switchTab(tab);
        }
      });
    });

    // Mobile Navigation Menu Toggle (NV-01: focus trap, esc, inert)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileMenuBtn && mobileNav) {
      function openMobileNav() {
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileNav.classList.remove('hidden');
        mobileNav.removeAttribute('aria-hidden');
        mobileNav.removeAttribute('inert');
      }

      function closeMobileNav() {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileNav.classList.add('hidden');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileNav.setAttribute('inert', '');
      }

      mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          closeMobileNav();
        } else {
          openMobileNav();
        }
      });

      // Close mobile drawer when link clicked
      mobileNav.querySelectorAll('.mobile-nav-item, a').forEach((link) => {
        link.addEventListener('click', () => {
          closeMobileNav();
        });
      });

      // Mobile drawer close button
      const btnCloseMobileNav = document.getElementById('btnCloseMobileNav');
      if (btnCloseMobileNav) {
        btnCloseMobileNav.addEventListener('click', () => {
          closeMobileNav();
        });
      }

      // Escape key closes mobile nav
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileNav.classList.contains('hidden')) {
          closeMobileNav();
        }
      });
    }

    // Network Error Boundary Dismiss
    if (elements.btnDismissNetworkError) {
      elements.btnDismissNetworkError.addEventListener('click', hideNetworkErrorBanner);
    }
  }

  /**
   * Header Scroll State & Scroll-Spy (Section 4)
   */
  function setupHeaderScrollAndSpy() {
    const header = document.querySelector('.app-header');
    const navItems = document.querySelectorAll('.header-nav-left .nav-item');
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const allNavLinks = document.querySelectorAll('.header-nav-left .nav-item, .mobile-nav-links .mobile-nav-item');

    const sections = [
      { id: 'heroSection', el: document.getElementById('heroSection') },
      { id: 'howItWorksSection', el: document.getElementById('howItWorksSection') },
      { id: 'studioSection', el: document.getElementById('studioSection') },
      { id: 'opsSection', el: document.getElementById('opsSection') },
    ].filter((s) => Boolean(s.el));

    // Check URL hash on initial load for deep tab links (NV-02)
    if (window.location.hash) {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('tab=audit') || hash === '#viewaudit') {
        switchTab('audit');
      } else if (hash.includes('tab=telemetry') || hash === '#viewtelemetry') {
        switchTab('telemetry');
      } else if (hash.includes('tab=review') || hash === '#viewreview') {
        switchTab('review');
      }
    }

    allNavLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.getElementById(href.slice(1));
          if (target) {
            e.preventDefault();
            const headerOffset = 96;
            const currentScrollY = window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
            const targetPos = target.getBoundingClientRect().top + currentScrollY - headerOffset;
            window.scrollTo({
              top: Math.max(0, targetPos),
              behavior: 'smooth'
            });
            history.pushState(null, '', href);
            navItems.forEach((item) => {
              if (item.getAttribute('href') === href) {
                item.classList.add('active');
              } else {
                item.classList.remove('active');
              }
            });
            if (mobileNav && !mobileNav.classList.contains('hidden')) {
              mobileNav.classList.add('hidden');
              mobileNav.setAttribute('aria-hidden', 'true');
              mobileNav.setAttribute('inert', '');
              if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
          }
        }
      });
    });

    function onScroll() {
      const currentScrollY = window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
      if (header) {
        if (currentScrollY > 24) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }

      // Scroll spy logic: dynamic sort by document Y position
      const scrollPos = currentScrollY + 140;
      const candidates = sections
        .filter((s) => s.el)
        .map((s) => ({
          id: s.id,
          top: s.el.getBoundingClientRect().top + currentScrollY,
          bottom: s.el.getBoundingClientRect().top + currentScrollY + s.el.offsetHeight
        }))
        .sort((a, b) => a.top - b.top);

      let currentSectionId = candidates[0]?.id || 'heroSection';
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (candidates[i].top <= scrollPos) {
          currentSectionId = candidates[i].id;
          break;
        }
      }

      allNavLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${currentSectionId}` || ((currentSectionId === 'howItWorksSection' || currentSectionId === 'architectureSection') && (href === '#howItWorksSection' || href === '#architectureSection'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    let isScrollTicking = false;
    function handleScrollOptimized() {
      if (!isScrollTicking) {
        window.requestAnimationFrame(() => {
          onScroll();
          isScrollTicking = false;
        });
        isScrollTicking = true;
      }
    }

    window.addEventListener('scroll', handleScrollOptimized, { passive: true });
    onScroll();
  }

  /**
   * Bottom-Right Stat Line Cycler with 3.5s interval (Section 5.2)
   */
  function setupStatRotator() {
    const statTextEl = document.getElementById('heroStatText');
    if (!statTextEl) return;

    const facts = [
      'Targets AMD Instinct™ MI300X with CPU fallback',
      '< 5ms deterministic policy SLA',
      'SHA-256 Merkle audit chain',
      'FTC 16 CFR § 233 compliance gate',
    ];

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      statTextEl.textContent = facts[0];
      return;
    }

    let currentIndex = 0;
    setInterval(() => {
      statTextEl.classList.add('fading');
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % facts.length;
        statTextEl.textContent = facts[currentIndex];
        statTextEl.classList.remove('fading');
      }, 250);
    }, 3500);
  }

  /**
   * PhantomDeps Contact Dialog (Section 6)
   */
  function setupContactDialog() {
    const dialog = document.getElementById('contactDialog');
    const btnNav = document.getElementById('btnNavContact');
    const btnMobile = document.getElementById('btnMobileContact');
    const btnClose = document.getElementById('btnCloseContact');
    const membersList = document.getElementById('dialogMembersList');
    const teamLinks = document.getElementById('dialogTeamLinks');

    if (!dialog) return;

    // Resolve TEAM config
    const teamData = (typeof window !== 'undefined' && window.TEAM) ? window.TEAM : {
      name: "PhantomDeps",
      description: "TypeScript fail-closed BLOCK / WARN / ALLOW engine with NDJSON audit logs.",
      event: "AMD Developer Hackathon: ACT III · lablab.ai",
      email: "contact@phantomdeps.ai",
      repo: "https://github.com/narayan-nkj/claimcheck-retail-media",
      members: [
        {
          name: "Narayan Kumar Jha",
          role: "AMD Model Serving & Structured Extraction",
          email: "narayan@phantomdeps.ai",
          github: "https://github.com/narayan-nkj",
          linkedin: "https://linkedin.com/in/narayanjha",
        },
        {
          name: "Adi",
          role: "Deterministic Policy Engine & Audit Chain",
          email: "",
          github: "",
          linkedin: "",
        },
        {
          name: "Roshan",
          role: "Web Application & Validation Workflow",
          email: "",
          github: "",
          linkedin: "",
        },
      ],
    };

    // Render Members (only render non-empty fields per section 6.3)
    if (membersList && Array.isArray(teamData.members)) {
      membersList.innerHTML = '';
      teamData.members.forEach((m) => {
        const row = document.createElement('div');
        row.className = 'member-row';
        row.setAttribute('role', 'listitem');

        let linksHtml = '';
        if (m.email) {
          linksHtml += `
            <button type="button" class="btn-copy-email" data-email="${escapeHtml(m.email)}" title="Copy email">
              Copy email
            </button>
          `;
        }
        if (m.github) {
          linksHtml += `
            <a href="${escapeHtml(m.github)}" class="member-icon-link" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(m.name)} GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </a>
          `;
        }
        if (m.linkedin) {
          linksHtml += `
            <a href="${escapeHtml(m.linkedin)}" class="member-icon-link" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(m.name)} LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          `;
        }

        row.innerHTML = `
          <div class="member-info">
            <span class="member-name">${escapeHtml(m.name)}</span>
            ${m.role ? `<span class="member-role">${escapeHtml(m.role)}</span>` : ''}
          </div>
          <div class="member-links">
            ${linksHtml}
          </div>
        `;

        // Wire Copy email button
        const copyBtn = row.querySelector('.btn-copy-email');
        if (copyBtn) {
          copyBtn.addEventListener('click', async () => {
            const email = copyBtn.getAttribute('data-email');
            try {
              if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(email);
              } else {
                const ta = document.createElement('textarea');
                ta.value = email;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
              }
              const originalText = copyBtn.textContent;
              copyBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyBtn.textContent = originalText;
              }, 1500);
            } catch {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 1500);
            }
          });
        }

        membersList.appendChild(row);
      });
    }

    // Render Team Links
    if (teamLinks) {
      teamLinks.innerHTML = '';
      if (teamData.email) {
        teamLinks.innerHTML += `<a href="mailto:${escapeHtml(teamData.email)}" class="btn-dialog-mail">Send Email</a>`;
      }
      if (teamData.repo) {
        teamLinks.innerHTML += `<a href="${escapeHtml(teamData.repo)}" class="btn-dialog-repo" target="_blank" rel="noopener noreferrer">View Repository</a>`;
      }
    }

    let lastFocusedElement = null;

    function openDialog() {
      lastFocusedElement = document.activeElement;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      document.body.style.overflow = 'hidden';
      if (btnClose) btnClose.focus();
    }

    function closeDialog() {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    const btnFooterContact = document.getElementById('btnFooterContact');
    if (btnNav) btnNav.addEventListener('click', openDialog);
    if (btnFooterContact) btnFooterContact.addEventListener('click', openDialog);
    if (btnMobile) {
      btnMobile.addEventListener('click', () => {
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav) mobileNav.classList.add('hidden');
        openDialog();
      });
    }
    if (btnClose) btnClose.addEventListener('click', closeDialog);

    // Click backdrop to close
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeDialog();
      }
    });

    // Escape key
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog();
      }
    });
  }

  /**
   * Solution Architecture Diagram Motion Engine
   * Intact static paths with flowing luminous dots only.
   * Diagram is non-clickable with all descriptions removed.
   */
  function setupSolutionDiagram() {
    const nodeOutAllow = document.getElementById('nodeOutAllow');
    const nodeOutBlock = document.getElementById('nodeOutBlock');
    const nodeOutReview = document.getElementById('nodeOutReview');
    const nodeOutAudit = document.getElementById('nodeOutAudit');

    // Real-time verification hook (triggered from Verification Studio)
    window.triggerDiagramVerification = function({ verdict }) {
      const v = (verdict || 'ALLOW').toUpperCase();
      let targetNode = nodeOutAllow;
      if (v === 'BLOCK') targetNode = nodeOutBlock;
      else if (v === 'REVIEW') targetNode = nodeOutReview;

      if (targetNode) {
        targetNode.classList.add('is-active-stage');
        setTimeout(() => {
          targetNode.classList.remove('is-active-stage');
        }, 3500);
      }
    };

    // Sequential Discrete Cycle (3-Section Internal Transmitting):
    // Stage 1: 4 dots arrive from input feeds and disappear inside Sanitizer
    // Stage 2: Pause inside Sanitizer (processing)
    // Stage 3: Dot leaves Sanitizer, travels to Evidence Gate, and disappears inside
    // Stage 4: Transmitting through Evidence Gate (tiles active sequentially)
    // Stage 5: Dot leaves Evidence Gate, travels to Seal, and disappears inside
    // Stage 6: Pause inside Seal (signing)
    // Stage 7: 4 dots leave Seal and split to the 4 verdict outputs
    // Stage 8: Brief quiet pause, then repeat
    const svg = document.getElementById('solutionDiagramSvg');
    if (!svg) return;

    const pathIn0 = document.getElementById('curveIn0');
    const pathIn1 = document.getElementById('curveIn1');
    const pathIn2 = document.getElementById('curveIn2');
    const pathIn3 = document.getElementById('curveIn3');
    const pathLink0 = document.getElementById('curveLink0');
    const pathLink1 = document.getElementById('curveLink1');
    const pathOut0 = document.getElementById('curveOut0');
    const pathOut1 = document.getElementById('curveOut1');
    const pathOut2 = document.getElementById('curveOut2');
    const pathOut3 = document.getElementById('curveOut3');

    const dotIn0 = document.getElementById('dotIn0');
    const dotIn1 = document.getElementById('dotIn1');
    const dotIn2 = document.getElementById('dotIn2');
    const dotIn3 = document.getElementById('dotIn3');
    const dotCenter = document.getElementById('dotCenter');
    const dotOut0 = document.getElementById('dotOut0');
    const dotOut1 = document.getElementById('dotOut1');
    const dotOut2 = document.getElementById('dotOut2');
    const dotOut3 = document.getElementById('dotOut3');

    const tileExtraction = document.getElementById('tileExtraction');
    const tileCorroboration = document.getElementById('tileCorroboration');
    const tilePolicy = document.getElementById('tilePolicy');

    if (!pathIn0 || !pathLink0 || !pathLink1 || !pathOut0 || !dotIn0 || !dotCenter || !dotOut0) return;

    const pathsIn = [pathIn0, pathIn1, pathIn2, pathIn3];
    const dotsIn = [dotIn0, dotIn1, dotIn2, dotIn3];
    const pathsOut = [pathOut0, pathOut1, pathOut2, pathOut3];
    const dotsOut = [dotOut0, dotOut1, dotOut2, dotOut3];

    let lensIn = [];
    let lenLink0 = 0;
    let lenLink1 = 0;
    let lensOut = [];

    try {
      lensIn = pathsIn.map(p => p.getTotalLength());
      lenLink0 = pathLink0.getTotalLength();
      lenLink1 = pathLink1.getTotalLength();
      lensOut = pathsOut.map(p => p.getTotalLength());
    } catch (_) {
      return;
    }

    const CYCLE = 5600;
    const S1_END = 1200; // 0..1200ms: 4 dots entering Sanitizer & disappearing inside
    const S2_END = 1700; // 1200..1700ms: inside Sanitizer
    const S3_END = 2400; // 1700..2400ms: dot leaves Sanitizer -> enters Evidence Gate & disappears inside
    const S4_END = 3200; // 2400..3200ms: transmitting inside Evidence Gate
    const S5_END = 3900; // 3200..3900ms: dot leaves Evidence Gate -> enters Seal & disappears inside
    const S6_END = 4300; // 3900..4300ms: inside Seal
    const S7_END = 5300; // 4300..5300ms: 4 dots leave Seal and split to outputs
    // 5300..5600ms: quiet pause

    function clearTransmittingTiles() {
      if (tileExtraction) tileExtraction.style.borderColor = '';
      if (tileCorroboration) tileCorroboration.style.borderColor = '';
      if (tilePolicy) tilePolicy.style.borderColor = '';
    }

    function renderDiagramMotion(now) {
      const elapsed = now % CYCLE;

      if (elapsed < S1_END) {
        // Stage 1: 4 dots coming from inputs to Sanitizer, disappearing as they enter
        const rawFrac = elapsed / S1_END;
        const frac = 0.5 - 0.5 * Math.cos(Math.PI * rawFrac);
        let op = 1;
        if (rawFrac < 0.1) op = rawFrac / 0.1;
        else if (rawFrac > 0.8) op = (1 - rawFrac) / 0.2; // disappears on entering Sanitizer

        for (let i = 0; i < 4; i++) {
          const pt = pathsIn[i].getPointAtLength(frac * lensIn[i]);
          dotsIn[i].setAttribute('cx', pt.x.toFixed(2));
          dotsIn[i].setAttribute('cy', pt.y.toFixed(2));
          dotsIn[i].style.opacity = Math.max(0, op).toFixed(3);
        }

        dotCenter.style.opacity = '0';
        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';
        clearTransmittingTiles();

      } else if (elapsed < S2_END) {
        // Stage 2: Inside Sanitizer (dots disappeared inside, brief pause)
        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';
        dotCenter.style.opacity = '0';
        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';
        clearTransmittingTiles();

      } else if (elapsed < S3_END) {
        // Stage 3: Leaves Sanitizer -> Enters Evidence Gate and disappears inside
        const rawFrac = (elapsed - S2_END) / (S3_END - S2_END);
        const frac = 0.5 - 0.5 * Math.cos(Math.PI * rawFrac);
        let op = 1;
        if (rawFrac < 0.15) op = rawFrac / 0.15;
        else if (rawFrac > 0.8) op = (1 - rawFrac) / 0.2; // disappears on entering Evidence Gate

        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';

        const pt = pathLink0.getPointAtLength(frac * lenLink0);
        dotCenter.setAttribute('cx', pt.x.toFixed(2));
        dotCenter.setAttribute('cy', pt.y.toFixed(2));
        dotCenter.style.opacity = Math.max(0, op).toFixed(3);

        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';
        clearTransmittingTiles();

      } else if (elapsed < S4_END) {
        // Stage 4: Transmitting inside Evidence Gate
        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';
        dotCenter.style.opacity = '0';
        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';

        const tSub = elapsed - S3_END;
        if (tSub < 260) {
          if (tileExtraction) tileExtraction.style.borderColor = '#70DFFF';
          if (tileCorroboration) tileCorroboration.style.borderColor = '';
          if (tilePolicy) tilePolicy.style.borderColor = '';
        } else if (tSub < 520) {
          if (tileExtraction) tileExtraction.style.borderColor = '';
          if (tileCorroboration) tileCorroboration.style.borderColor = '#70DFFF';
          if (tilePolicy) tilePolicy.style.borderColor = '';
        } else {
          if (tileExtraction) tileExtraction.style.borderColor = '';
          if (tileCorroboration) tileCorroboration.style.borderColor = '';
          if (tilePolicy) tilePolicy.style.borderColor = '#70DFFF';
        }

      } else if (elapsed < S5_END) {
        // Stage 5: Leaves Evidence Gate -> Enters Seal and disappears inside
        clearTransmittingTiles();
        const rawFrac = (elapsed - S4_END) / (S5_END - S4_END);
        const frac = 0.5 - 0.5 * Math.cos(Math.PI * rawFrac);
        let op = 1;
        if (rawFrac < 0.15) op = rawFrac / 0.15;
        else if (rawFrac > 0.8) op = (1 - rawFrac) / 0.2; // disappears on entering Seal

        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';

        const pt = pathLink1.getPointAtLength(frac * lenLink1);
        dotCenter.setAttribute('cx', pt.x.toFixed(2));
        dotCenter.setAttribute('cy', pt.y.toFixed(2));
        dotCenter.style.opacity = Math.max(0, op).toFixed(3);

        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';

      } else if (elapsed < S6_END) {
        // Stage 6: Inside Seal (brief pause)
        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';
        dotCenter.style.opacity = '0';
        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';
        clearTransmittingTiles();

      } else if (elapsed < S7_END) {
        // Stage 7: 4 dots leave Seal and split to outputs
        clearTransmittingTiles();
        const rawFrac = (elapsed - S6_END) / (S7_END - S6_END);
        const frac = 0.5 - 0.5 * Math.cos(Math.PI * rawFrac);
        let op = 1;
        if (rawFrac < 0.1) op = rawFrac / 0.1;
        else if (rawFrac > 0.88) op = (1 - rawFrac) / 0.12;

        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';
        dotCenter.style.opacity = '0';

        for (let i = 0; i < 4; i++) {
          const pt = pathsOut[i].getPointAtLength(frac * lensOut[i]);
          dotsOut[i].setAttribute('cx', pt.x.toFixed(2));
          dotsOut[i].setAttribute('cy', pt.y.toFixed(2));
          dotsOut[i].style.opacity = Math.max(0, op).toFixed(3);
        }

      } else {
        // Stage 8: Quiet pause before reset
        for (let i = 0; i < 4; i++) dotsIn[i].style.opacity = '0';
        dotCenter.style.opacity = '0';
        for (let i = 0; i < 4; i++) dotsOut[i].style.opacity = '0';
        clearTransmittingTiles();
      }

      requestAnimationFrame(renderDiagramMotion);
    }

    requestAnimationFrame(renderDiagramMotion);
  }

  /**
   * Setup FAQ Accordion Interaction
   */
  function setupFaqAccordion() {
    const toggles = document.querySelectorAll('[data-accordion="toggle"]');
    toggles.forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('active');

        // Close other items
        document.querySelectorAll('.faq-item').forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            const otherBtn = other.querySelector('[data-accordion="toggle"]');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /**
   * Switch Active Tab
   */
  function switchTab(tabKey) {
    if (!elements.tabReview || !elements.tabAudit || !elements.tabTelemetry) return;

    elements.tabReview.classList.remove('active');
    elements.tabReview.setAttribute('aria-selected', 'false');
    elements.tabAudit.classList.remove('active');
    elements.tabAudit.setAttribute('aria-selected', 'false');
    elements.tabTelemetry.classList.remove('active');
    elements.tabTelemetry.setAttribute('aria-selected', 'false');

    if (elements.viewReview) elements.viewReview.classList.add('hidden');
    if (elements.viewAudit) elements.viewAudit.classList.add('hidden');
    if (elements.viewTelemetry) elements.viewTelemetry.classList.add('hidden');

    if (tabKey === 'review') {
      elements.tabReview.classList.add('active');
      elements.tabReview.setAttribute('aria-selected', 'true');
      if (elements.viewReview) elements.viewReview.classList.remove('hidden');
    } else if (tabKey === 'audit') {
      elements.tabAudit.classList.add('active');
      elements.tabAudit.setAttribute('aria-selected', 'true');
      if (elements.viewAudit) elements.viewAudit.classList.remove('hidden');
    } else if (tabKey === 'telemetry') {
      elements.tabTelemetry.classList.add('active');
      elements.tabTelemetry.setAttribute('aria-selected', 'true');
      if (elements.viewTelemetry) elements.viewTelemetry.classList.remove('hidden');
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
        // Add Universal Ad preset demo
        state.presets['universal_demo'] = {
          id: 'universal_demo',
          name: 'Universal Ad',
          tagline: 'Multi-Claim Footwear Campaign (Auto-Detected)',
          expectedVerdict: 'ALLOW',
          expectedReason: 'MATCHES_APPROVED_FACTS',
          sku: 'UNIVERSAL_AUTO',
          adCopyText: 'Nike Air Zoom Pegasus 40 running shoes now $129.99 (save 25%)! In stock now with Free Next-Day Delivery.',
          explanation: 'Universal Ad Mode automatically identifies product brand (Nike), category (Apparel & Footwear), extracts all 4 claim classes, and synthesizes fresh corroborating evidence.',
        };
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
    if (elements.adCopyInput) elements.adCopyInput.value = preset.adCopyText;
    if (elements.skuSelect) elements.skuSelect.value = preset.sku;
    if (elements.charCount) elements.charCount.textContent = `${preset.adCopyText.length} / 2000`;

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
    if (!elements.adCopyInput) return;
    const rawText = elements.adCopyInput.value.trim();
    if (!rawText) {
      elements.adCopyInput.focus();
      return;
    }

    const sanitized = sanitizeInputText(rawText);
    const sku = elements.skuSelect ? elements.skuSelect.value : 'UNIVERSAL_AUTO';
    const simulationMode = elements.simulationModeSelect ? elements.simulationModeSelect.value : 'COMPLIANT';
    const presetId = state.activePreset;

    showStudioState('loading');

    if (elements.btnRunCheck) {
      elements.btnRunCheck.disabled = true;
      const btnText = elements.btnRunCheck.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Evaluating Deterministic Policy...';
    }

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adCopyText: sanitized,
          sku,
          presetId,
          simulationMode,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        showStudioState('error', `Verification Error: ${result.error}`);
        return;
      }

      state.currentCheck = result;
      showStudioState('success');
      renderCheckResult(result);
      await refreshQueue();
      await refreshAuditStream();
      await refreshTelemetry();
    } catch (err) {
      showStudioState('error', `Verification Check Failed: ${err.message}. Connection dropped or server unreachable.`);
      showNetworkErrorBanner(`Verification Check Failed: ${err.message}. Connection dropped or server unreachable.`);
    } finally {
      if (elements.btnRunCheck) {
        elements.btnRunCheck.disabled = false;
        const btnText = elements.btnRunCheck.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Verify Ad Copy with Evidence Gate';
      }
    }
  }

  /**
   * Render Check Result in UI
   */
  function renderCheckResult(result) {
    const verdict = result.verdict;
    const status = verdict.compositeStatus; // 'ALLOW', 'REVIEW', 'BLOCK'

    // Trigger coordinated verification run on solution architecture diagram if visible
    if (typeof window.triggerDiagramVerification === 'function') {
      try {
        window.triggerDiagramVerification({
          verdict: status,
          presetId: result.presetId
        });
      } catch (err) {
        console.warn('Diagram verification trigger error:', err);
      }
    }

    // 1. Update Verdict Banner
    if (elements.verdictBanner) {
      elements.verdictBanner.className = `verdict-banner status-${status.toLowerCase()}`;
      elements.verdictBanner.classList.remove('hidden');
    }

    if (elements.verdictBadge) elements.verdictBadge.textContent = status;
    const primaryReason = verdict.claimVerdicts[0]?.primaryReason || 'UNKNOWN';
    if (elements.verdictReasonBadge) elements.verdictReasonBadge.textContent = primaryReason;
    if (elements.verdictCheckId) elements.verdictCheckId.textContent = result.checkId;
    if (elements.verdictSummary) elements.verdictSummary.textContent = verdict.summary;

    if (elements.verdictIcon) {
      if (status === 'ALLOW') {
        elements.verdictIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
      } else if (status === 'BLOCK') {
        elements.verdictIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      } else {
        elements.verdictIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      }
    }

    if (elements.metaLatency) elements.metaLatency.textContent = `${result.latencyMs}ms`;
    if (elements.metaClaimCount) elements.metaClaimCount.textContent = result.extractedClaims.length;

    // 1.5 Update Ground Truth Product Fact Card
    if (elements.productFactCard && result.catalogItem) {
      const cat = result.catalogItem;
      if (elements.factProductCategory) elements.factProductCategory.textContent = cat.category || 'Retail Product';
      if (elements.factProductTitle) elements.factProductTitle.textContent = cat.title || 'Product Item';
      if (elements.factProductSku) elements.factProductSku.textContent = cat.sku || 'SKU-AUTO';
      if (elements.factPrice) elements.factPrice.textContent = `${cat.pricing.currency || 'USD'} $${cat.pricing.amount.toFixed(2)}`;
      if (elements.factDiscount) {
        elements.factDiscount.textContent = cat.pricing.discountPercentage
          ? `${cat.pricing.discountPercentage}% Active Promo`
          : 'Regular Price';
      }
      if (elements.factStock) {
        elements.factStock.textContent = `${cat.inventory.stockStatus} (${cat.inventory.availableQuantity} units)`;
      }
      if (elements.factShipping) {
        const ship = cat.shipping[0];
        elements.factShipping.textContent = ship
          ? `${ship.isFreeShipping ? 'Free ' : ''}${ship.minTransitDays}-Day Transit`
          : 'Standard Logistics';
      }
      elements.productFactCard.classList.remove('hidden');
    }

    // 2. Render Highlighted Spans
    renderHighlightedSpans(result.adCopyText, result.extractedClaims);

    // 3. Render Claims Breakdown Grid
    renderClaimsGrid(result.extractedClaims, verdict.claimVerdicts);
  }

  /**
   * Render Highlighted Spans in Raw Ad Copy Text
   */
  function renderHighlightedSpans(fullText, claims) {
    if (!elements.highlightedCopyContainer || !elements.highlightedText) return;
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
    if (!elements.claimsContainer || !elements.claimsGrid) return;
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
    if (!elements.queueDepthBadge || !elements.tabQueueBadge || !elements.queueEmptyState || !elements.queueItemsList) return;
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
      if (!res.ok || !data.success) {
        alert(`Access Control Barrier: ${data.error || 'Authorization refused by compliance policy.'}`);
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
        el.classList.add('is-expired');
        el.style.background = '';
        return;
      }
      el.classList.remove('is-expired');

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
    if (!elements.auditEmptyState || !elements.auditStreamList) return;
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
        if (elements.auditReplayResultBanner) elements.auditReplayResultBanner.classList.remove('hidden');
        if (elements.replayDetailsText) {
          if (r.isReproducible) {
            elements.replayDetailsText.textContent = `✓ Bit-for-bit match verified for ${r.auditId}. Stored status "${r.originalCompositeStatus}" equals replayed status "${r.replayedCompositeStatus}". Zero logic drift.`;
          } else {
            elements.replayDetailsText.textContent = `⚠️ Discrepancy detected: ${r.discrepancies.join('; ')}`;
          }
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

      if (!healthRes.ok) throw new Error(`Health check returned status ${healthRes.status}`);

      const health = await healthRes.json();
      const rawMetrics = await metricsRes.text();

      // Clear network drop warning if health check recovered
      hideNetworkErrorBanner();

      if (elements.amdStatusText && elements.amdStatusDot) {
        const isHardware = Boolean(health.amdInference?.rocmAvailable && health.amdInference?.deviceProof?.verified && !health.fallbackActive);
        if (isHardware) {
          elements.amdStatusText.textContent = 'AMD Instinct™ MI300X connected';
          elements.amdStatusDot.className = 'status-dot pulse active';
        } else {
          elements.amdStatusText.textContent = 'CPU fallback adapter active';
          elements.amdStatusDot.className = 'status-dot pulse fallback';
        }
      }

      if (health.metrics) {
        if (elements.metricTotalChecks) elements.metricTotalChecks.textContent = health.metrics.totalChecks;
        if (elements.metricTotalPasses) elements.metricTotalPasses.textContent = health.metrics.totalPasses;
        if (elements.metricTotalBlocks) elements.metricTotalBlocks.textContent = health.metrics.totalBlocks;
        if (elements.metricTotalOverrides) elements.metricTotalOverrides.textContent = health.metrics.totalOverrides;
        if (elements.queueDepthBadge) elements.queueDepthBadge.textContent = health.metrics.queueDepth;
        if (elements.tabQueueBadge) elements.tabQueueBadge.textContent = health.metrics.queueDepth;

        // Update real-time throughput and p95 latency
        const total = health.metrics.totalChecks || 0;
        if (elements.throughputText) {
          elements.throughputText.textContent = total > 0 ? `${total} checks` : 'Active';
        }
        if (health.metrics.avgLatencyMs && elements.p95LatencyText) {
          elements.p95LatencyText.textContent = `${health.metrics.avgLatencyMs.toFixed(2)}ms`;
        }
      }

      if (elements.telemetryRawDisplay) {
        elements.telemetryRawDisplay.textContent = rawMetrics;
      }
    } catch (err) {
      console.warn('Telemetry refresh warning:', err);
      if (elements.amdStatusText) elements.amdStatusText.textContent = 'Disconnected (Offline)';
      if (elements.amdStatusDot) elements.amdStatusDot.className = 'status-dot offline';
      if (elements.telemetryRawDisplay) {
        elements.telemetryRawDisplay.textContent = 'Prometheus exposition metrics currently unavailable. Backend service unreachable.';
      }
      showNetworkErrorBanner('Operational Telemetry Offline: Backend service unreachable. Background reconnection in progress...');
    }
  }

  /**
   * Reset Form to Clean Baseline
   */
  function resetForm() {
    if (elements.adCopyInput) elements.adCopyInput.value = '';
    if (elements.charCount) elements.charCount.textContent = '0 / 2000';
    if (elements.skuSelect) elements.skuSelect.value = 'UNIVERSAL_AUTO';
    if (elements.simulationModeSelect) elements.simulationModeSelect.value = 'COMPLIANT';
    if (elements.productFactCard) elements.productFactCard.classList.add('hidden');
    state.activePreset = null;
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active-preset'));
    if (elements.verdictBanner) elements.verdictBanner.classList.add('hidden');
    if (elements.highlightedCopyContainer) elements.highlightedCopyContainer.classList.add('hidden');
    if (elements.claimsContainer) elements.claimsContainer.classList.add('hidden');
    showStudioState('empty');
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
