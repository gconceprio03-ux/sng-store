/* ============================================================================
   SNG — MAIN
   Boot · custom cursor · smooth scroll · reactor · account grid · boost
   calculator · rank ladder · cart drawer · checkout · success · breach FX.
   All third-party libs (GSAP, ScrollTrigger, Lenis) are optional & guarded.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.SNG, Emblem = window.SNGEmblem, Cart = window.SNGCart;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!window.gsap;

  // tier -> reactor hue (HSL)
  var TIER_HUE = { copper: 24, bronze: 30, silver: 212, gold: 46, platinum: 189, emerald: 193, diamond: 190, champion: 352 };
  function setReactorHue(tierKey) {
    var h = TIER_HUE[tierKey];
    if (h != null) document.documentElement.style.setProperty("--reactor-hue", h);
  }

  var appState = { discount: 0, promo: "", payment: "card" };
  var PROMOS = { BREACH10: 0.10, SNG20: 0.20, CLUTCH: 0.15 };

  document.documentElement.classList.add("js-ready");
  document.addEventListener("DOMContentLoaded", init);

  // run each initializer in isolation: one failure never cascades
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error("[SNG]", (fn.name || "init"), e); } }

  function init() {
    safe(function () { $("#year").textContent = new Date().getFullYear(); });
    safe(wireDiscordLinks);
    [
      buildHudSigil, boot, initCursor, initMagnetic, initReveal, initScramble,
      initMarquees, initOpsTicker, initHeroParallax, initReactor,
      initSmoothScroll, initSpotlight, buildTrustStats,
      buildDeliveries, buildDMA, buildAccounts, buildFeatured, buildFeatures, buildCalculator, buildLadder,
      initFaq, initCartUI, initCheckout, initSuccess, initOverlayKeys,
      initKonami, initSound,
      initShaderBG, initShards, initSpine, initParallax
    ].forEach(safe);
    window.addEventListener("sng:cart", onCartChange);
    safe(onCartChange);
  }

  /* ---------------- discord links (one source of truth) ---------------- */
  function wireDiscordLinks() {
    var url = (D && D.DISCORD) || "#";
    $$("[data-discord]").forEach(function (a) { a.setAttribute("href", url); });
  }

  /* ---------------- boot sequence ---------------- */
  function boot() {
    var bootEl = $("#boot"), log = $("#boot-log"), pct = $("#boot-pct"), bar = $("#boot-bar"),
        emb = $("#boot-emblem"), wipe = $("#boot-wipe"), skip = $("#boot-skip");
    if (!bootEl) return;
    if (emb) emb.innerHTML = Emblem.draw("diamond", { size: 116, energy: 1 });
    var finished = false;
    function done() {
      if (finished) return; finished = true;
      if (wipe) wipe.classList.add("fire");
      setTimeout(function () { bootEl.classList.add("done"); }, 360);
    }
    if (skip) skip.addEventListener("click", done);
    if (reduced) { if (pct) pct.textContent = "100"; if (bar) bar.style.width = "100%"; done(); return; }

    var lines = [
      "> sng.kernel :: init",
      "> mounting blacksite node ……… OK",
      "> uplink handshake …………… SECURE",
      "> dma // r6s …………………… UNDETECTED",
      "> rank reactor …………………… ONLINE",
      "> 312 accounts indexed",
      "> breach protocols armed",
    ];
    var li = 0, dur = 2100, start = performance.now();
    (function frame(t) {
      var p = Math.min(1, ((t || performance.now()) - start) / dur);
      var e = 1 - Math.pow(1 - p, 2), v = Math.floor(e * 100);
      if (pct) pct.textContent = (v < 10 ? "0" : "") + v;
      if (bar) bar.style.width = v + "%";
      var want = Math.floor(e * lines.length);
      while (li < want && li < lines.length) { log.textContent += (li ? "\n" : "") + lines[li]; li++; }
      if (p < 1) requestAnimationFrame(frame);
      else {
        while (li < lines.length) { log.textContent += (li ? "\n" : "") + lines[li]; li++; }
        if (pct) pct.textContent = "100";
        log.textContent += "\n> ACCESS GRANTED_";
        setTimeout(done, 380);
      }
    })(performance.now());

    // safety net: rAF is paused in background tabs — make sure the preloader
    // never becomes a dead-end. setTimeout still fires when hidden.
    setTimeout(done, 3600);

    // skip on first interaction
    ["wheel", "touchstart", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, done, { once: true, passive: true });
    });
  }

  /* ---------------- custom cursor ---------------- */
  function initCursor() {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
    var ret = $("#reticle"), tr = $("#trailer");
    if (!ret || !tr) return;
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, tx = mx, ty = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      ret.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      var t = e.target.closest && e.target.closest('[data-cursor="lock"], a, button, input, .magnetic, .acard, .lnode');
      ret.classList.toggle("lock", !!t);
    });
    (function raf() {
      tx += (mx - tx) * 0.18; ty += (my - ty) * 0.18;
      tr.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
      requestAnimationFrame(raf);
    })();
  }

  /* ---------------- magnetic buttons ---------------- */
  function initMagnetic() {
    if (reduced) return;
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
        dx = Math.max(-12, Math.min(12, dx)); dy = Math.max(-10, Math.min(10, dy));
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealIO = null, revealReady = false;
  function initReveal() {
    revealReady = true;
    if (reduced || !("IntersectionObserver" in window)) { revealScan(); return; }
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          var bar = en.target.querySelector(".acard-bar i");
          if (bar && bar.dataset.w) bar.style.width = bar.dataset.w;
          if (en.target.classList.contains("lnode")) en.target.classList.add("lit");
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealScan();

    // Belt-and-suspenders: on scroll, reveal any .reveal whose top is near the
    // viewport. Guarantees cards show even if an IO callback is missed, and works
    // with Lenis (which emits scroll events). Coalesced to one check per frame.
    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () {
        queued = false;
        var vh = window.innerHeight;
        $$(".reveal:not(.is-visible)").forEach(function (el) {
          if (el.getBoundingClientRect().top < vh * 1.15) {
            el.classList.add("is-visible");
            var b = el.querySelector(".acard-bar i"); if (b && b.dataset.w) b.style.width = b.dataset.w;
            if (el.classList.contains("lnode")) el.classList.add("lit");
          }
        });
      });
    }, { passive: true });
  }
  // Observe any not-yet-revealed .reveal element. MUST be called after injecting
  // dynamic content (cards/nodes built after init), or those stay at opacity:0.
  function revealScan() {
    if (!revealReady) return;
    var els = $$(".reveal:not(.is-visible)");
    if (!revealIO) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
        var b = el.querySelector(".acard-bar i"); if (b && b.dataset.w) b.style.width = b.dataset.w;
      });
      return;
    }
    els.forEach(function (el) { revealIO.observe(el); });
  }

  function observeOnce(el, cb) {
    if (reduced || !("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { cb(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
  }

  /* ---------------- marquees ---------------- */
  function fillTrack(track, phrase, minLen) {
    var unit = phrase;
    while (unit.length < (minLen || 60)) unit += phrase;
    track.innerHTML = "<span>" + unit + "</span><span>" + unit + "</span>";
  }
  function initMarquees() {
    $$("[data-marquee]").forEach(function (t) { fillTrack(t, t.dataset.marquee, 80); });
  }

  function initOpsTicker() {
    var t = $("#ops-ticker");
    if (!t) return;
    var items = [
      "▣ DMA // R6S — status UNDETECTED",
      "▣ key #SNG-DMA-7E03 // delivered 0m06s",
      "▣ order #SNG-4417 // DIAMOND boost deployed",
      "▣ account ZERO-CHAMP // delivered 0m18s",
      "▣ 312 accounts in stock",
      "▣ avg reply 3m41s",
      "▣ replacement guarantee active",
    ];
    var s = items.join("    ·    ") + "    ·    ";
    t.innerHTML = "<span>" + s + "</span><span>" + s + "</span>";
  }

  /* ---------------- hero matrix rain ---------------- */
  function initHeroRain() {
    var cv = $("#hero-rain"), hero = $("#hero");
    if (!cv || reduced) return;
    var ctx = cv.getContext("2d");
    var chars = "01░▒▓<>/\\[]{}=+*ABCDEF#".split("");
    var cols, drops, fontSize = 14, last = 0, W = 0, H = 0, running = true, rt;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(W / fontSize));
      drops = []; for (var i = 0; i < cols; i++) drops[i] = Math.floor(Math.random() * -40);
    }
    resize();
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(function (e) { running = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { running = !document.hidden; });
    function frame(ts) {
      requestAnimationFrame(frame);
      if (!running || document.hidden) return; // pause when off-screen / backgrounded
      if (ts - last < 70) return; // ~14fps, light
      last = ts;
      ctx.fillStyle = "rgba(7,5,16,0.22)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = fontSize + "px monospace";
      for (var i = 0; i < cols; i++) {
        ctx.fillStyle = Math.random() > 0.985 ? "rgba(255,39,64,0.5)" : "rgba(52,227,255,0.34)";
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- reactor dock + hero orb shrink ---------------- */
  function initReactor() {
    var reactor = $("#reactor"), orb = $("#hero-orb"), hero = $("#hero");
    if (!reactor) return;
    setReactorHue("diamond");
    var heroH = hero ? hero.offsetHeight : 800, vh = window.innerHeight || 800, ticking = false;
    window.addEventListener("resize", function () { if (hero) heroH = hero.offsetHeight; vh = window.innerHeight || 800; }, { passive: true });
    var prog = $("#scrollprog");
    function apply() {
      ticking = false;
      var y = window.scrollY;
      reactor.classList.toggle("on", y > heroH * 0.7);
      if (orb && !reduced) orb.style.opacity = String(0.9 * (1 - Math.min(1, y / vh)));
      if (prog) { var max = document.documentElement.scrollHeight - vh; prog.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + "%"; }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
  }

  /* ---------------- smooth scroll (Lenis) ---------------- */
  var lenis = null;
  function barOffset() {
    var hud = $("#hud"), tick = $(".ops-ticker");
    return -((hud ? hud.offsetHeight : 56) + (tick ? tick.offsetHeight : 24) + 8);
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) { lenis.scrollTo(el, { offset: barOffset() }); return; }
    var y = el.getBoundingClientRect().top + window.scrollY + barOffset();
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  }
  function initSmoothScroll() {
    if (!reduced && window.Lenis) {
      try {
        lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
        if (hasGSAP && window.ScrollTrigger) lenis.on("scroll", window.ScrollTrigger.update);
      } catch (e) { lenis = null; }
    }
    // anchor links — wired even without Lenis (native smooth + scroll-margin-top)
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var tgt = $(id);
        if (!tgt) return;
        e.preventDefault();
        scrollToEl(tgt);
      });
    });
  }

  /* ---------------- HUD + footer sigils ---------------- */
  function buildHudSigil() {
    var svg = Emblem.draw("diamond", { size: 26, energy: 0.9 });
    var h = $("#hud-sigil"); if (h) h.innerHTML = svg;
    var f = $("#footer-sigil"); if (f) f.innerHTML = Emblem.draw("diamond", { size: 40, energy: 1 });
  }

  /* ---------------- trust stats ---------------- */
  function buildTrustStats() {
    var wrap = $("#trust-stats"); if (!wrap) return;
    D.STATS.forEach(function (s) {
      var el = document.createElement("div");
      el.className = "trust-stat";
      el.innerHTML = '<span class="trust-stat-v"><b data-v="' + s.value + '" data-dec="' + (s.decimals || 0) + '">0</b>' + (s.suffix || "") + '</span><span class="trust-stat-l">' + s.label + "</span>";
      wrap.appendChild(el);
    });
    observeOnce(wrap, function () {
      $$("b[data-v]", wrap).forEach(function (b) { countTo(b, parseFloat(b.dataset.v), parseInt(b.dataset.dec, 10)); });
    });
  }
  function countTo(el, target, dec) {
    if (reduced) { el.textContent = dec ? target.toFixed(dec) : Math.round(target).toLocaleString("en-US"); return; }
    var start = performance.now(), dur = 1400;
    function step(t) {
      var p = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = target * e;
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function buildDeliveries() {
    var t = $("#deliveries-track"); if (!t) return;
    var ranks = ["Diamond", "Emerald", "Platinum", "Champion", "Gold"];
    var tags = ["kr1sp", "m1lo", "fern", "taz1k", "v0id", "nyx", "sh4dow", "echo"];
    var out = "";
    for (var i = 0; i < 10; i++) {
      out += "<span><b>▣ delivered</b> · @" + tags[i % tags.length] + " → " + ranks[i % ranks.length] + "</span>";
    }
    t.innerHTML = "<span style='display:inline-flex'>" + out + "</span><span style='display:inline-flex'>" + out + "</span>";
  }

  /* ---------------- why SNG (guarantees) ---------------- */
  var ICONS = {
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
    ghost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V10a7 7 0 0 1 14 0v11l-2.3-1.8-2 1.8-2-1.8-2 1.8-2-1.8z"/><path d="M9.5 10h.01M14.5 10h.01"/></svg>',
    headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2z"/><path d="M20 13a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2z"/><path d="M20 17v1a4 4 0 0 1-4 4h-3"/></svg>'
  };
  function buildFeatures() {
    var grid = $("#why-grid"); if (!grid || !D.FEATURES) return;
    D.FEATURES.forEach(function (f) {
      var el = document.createElement("article");
      el.className = "why-card reveal spot";
      el.innerHTML = '<div class="why-icon">' + (ICONS[f.icon] || "") + '</div><h3>' + f.title + '</h3><p>' + f.text + '</p>';
      grid.appendChild(el);
    });
    revealScan();
  }

  /* ---------------- account grid ---------------- */
  function accountCard(acc) {
    var bi = acc.blackIce == null ? "✓" : acc.blackIce;
    var hi = acc.universals > 0 ? { l: "UNIV", v: acc.universals }
      : acc.elites > 0 ? { l: "ELITE", v: acc.elites }
      : { l: "ACCESS", v: "FULL" };
    var strength = Math.min(1, (acc.level / 600) * 0.5 + ((acc.blackIce || 10) / 64) * 0.5);
    var el = document.createElement("article");
    el.className = "acard reveal spot";
    el.setAttribute("data-tier", acc.tierKey);
    el.setAttribute("data-id", acc.id);
    el.innerHTML =
      '<div class="acard-art">' + (window.SNGArt ? SNGArt.scene(acc.tierKey, acc.id) : Emblem.draw(acc.tierKey, { size: 104, energy: 1 })) + '</div>' +
      '<span class="acard-sheen" aria-hidden="true"></span>' +
      '<div class="acard-top"><span class="acard-badge" data-b="' + acc.badge + '">' + acc.badge + '</span>' +
      '<span class="acard-region mono">' + acc.region + ' · ' + acc.delivery + '</span></div>' +
      '<div class="acard-rank">' + acc.rankLabel + '</div>' +
      '<div class="acard-tag mono">// ' + acc.tag + ' · LVL ' + acc.level + '</div>' +
      '<div class="acard-stats">' +
        '<div class="acard-stat mono"><span>LVL</span> <b>' + acc.level + '</b></div>' +
        '<div class="acard-stat mono"><span>B.ICE</span> <b>' + bi + '</b></div>' +
        '<div class="acard-stat mono"><span>OPS</span> <b>' + acc.operators + '</b></div>' +
        '<div class="acard-stat mono"><span>' + hi.l + '</span> <b>' + hi.v + '</b></div>' +
      '</div>' +
      '<div class="acard-bar"><i data-w="' + Math.round(strength * 100) + '%"></i></div>' +
      '<div class="acard-perks mono">' + acc.perks.slice(0, 3).map(function (p) { return "<span>" + p + "</span>"; }).join("") + '</div>' +
      '<div class="acard-foot"><span class="acard-price">' + D.price(acc.price) + '</span>' +
      '<a class="acard-add" href="' + acc.eldorado + '" target="_blank" rel="noopener" data-cursor="lock">[ SECURE BUY ▸ ]</a></div>';

    el.addEventListener("mouseenter", function () { setReactorHue(acc.tierKey); });
    if (!reduced) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -6, ry = (px - 0.5) * 6;
        el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-6px)";
        el.style.setProperty("--sx", (px * 100) + "%");
        el.style.setProperty("--sy", (py * 100) + "%");
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    }
    // buy = breach flourish, then the listing opens on Eldorado (real checkout + TradeShield)
    el.querySelector(".acard-add").addEventListener("click", function () {
      var r = el.getBoundingClientRect();
      runBreach(r.left + r.width / 2, r.top + r.height / 2, acc.tierKey);
    });
    return el;
  }
  function buildAccounts() {
    var grid = $("#vault-grid"); if (!grid) return;
    D.ACCOUNTS.forEach(function (acc) { grid.appendChild(accountCard(acc)); });
    revealScan(); // cards are built after initReveal — register them now
    // filters
    $$(".filter").forEach(function (f) {
      f.addEventListener("click", function () {
        $$(".filter").forEach(function (x) { x.classList.remove("is-on"); });
        f.classList.add("is-on");
        var key = f.dataset.filter;
        $$(".acard", grid).forEach(function (c) {
          c.classList.toggle("is-hidden", key !== "all" && c.dataset.tier !== key);
        });
      });
    });
  }

  /* ---------------- DMA key forge (flagship) ---------------- */
  function buildDMA() {
    var DMA = D.DMA; if (!DMA) return;
    var plansWrap = $("#dma-plans"), featWrap = $("#dma-features"), keyEl = $("#dma-key");
    if (!plansWrap) return;

    // status / build line
    var bEl = $("#dma-build"); if (bEl) bEl.textContent = DMA.build;
    var uEl = $("#dma-updated"); if (uEl) uEl.textContent = DMA.updatedDays > 0 ? DMA.updatedDays + "d ago" : "today";
    var sEl = $("#dma-status"); if (sEl) sEl.textContent = DMA.status;

    // feature matrix
    if (featWrap) {
      featWrap.innerHTML = DMA.features.map(function (f) {
        return '<div class="dma-feat"><span class="tick">▸</span><span><b>' + f.k + '</b><small>' + f.v + '</small></span></div>';
      }).join("");
    }

    // plan cards (default to the POPULAR / 2nd plan)
    var current = DMA.plans[1] || DMA.plans[0];
    DMA.plans.forEach(function (p) {
      var per = p.perDay ? D.price(Math.round(p.perDay * 100) / 100) + " /day" : "one-time";
      var btn = document.createElement("button");
      btn.className = "dma-plan" + (p === current ? " is-on" : "");
      btn.setAttribute("data-plan", p.id);
      btn.setAttribute("data-cursor", "lock");
      btn.setAttribute("aria-pressed", p === current ? "true" : "false");
      btn.innerHTML =
        (p.tag ? '<span class="dma-plan-tag">' + p.tag + '</span>' : '') +
        '<div class="dma-plan-label">' + p.label + '</div>' +
        '<div class="dma-plan-price">' + D.price(p.price) + '</div>' +
        '<div class="dma-plan-per mono">' + per + '</div>';
      btn.addEventListener("click", function () { select(p, true); });
      plansWrap.appendChild(btn);
    });

    function select(p, animateKey) {
      current = p;
      $$(".dma-plan", plansWrap).forEach(function (el) {
        var on = el.dataset.plan === p.id;
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var nm = $("#dma-plan-name"); if (nm) nm.textContent = p.label;
      var ex = $("#dma-expires"); if (ex) ex.textContent = p.days ? "+" + p.days + "d" : "PERMANENT";
      var priceEl = $("#dma-price");
      if (priceEl) { priceEl.textContent = D.price(p.price); priceEl.classList.remove("roll"); void priceEl.offsetWidth; priceEl.classList.add("roll"); }
      setReactorHue("champion"); // crimson reactor — flagship
      setKey(animateKey);
    }

    // license-key forge: a clean key is always shown; the scramble->lock decode
    // only plays when asked (plan change / section reveal). If rAF is throttled
    // mid-animation, the displayed key stays a valid clean key, never junk.
    var HEX = "0123456789ABCDEF", decodeRAF = null;
    function group(n) { var s = ""; for (var i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)]; return s; }
    function finalKey() { return "SNG-DMA-" + group(4) + "-" + group(4) + "-" + group(4); }
    function render(str, locked) {
      return locked ? str.replace(/([0-9A-F]{4})$/i, '<span class="grp-lock">$1</span>') : str;
    }
    function setKey(animate) {
      if (!keyEl) return;
      var target = finalKey(), len = target.length;
      if (decodeRAF) { cancelAnimationFrame(decodeRAF); decodeRAF = null; }
      if (!animate || reduced) { keyEl.innerHTML = render(target, true); return; }
      var start = performance.now(), dur = 620;
      (function step(t) {
        var p = Math.min(1, (t - start) / dur), reveal = Math.floor(p * len), out = "";
        for (var i = 0; i < len; i++) {
          var ch = target[i];
          out += (ch === "-" || i < reveal) ? ch : HEX[Math.floor(Math.random() * 16)];
        }
        keyEl.innerHTML = render(out, false);
        if (p < 1) decodeRAF = requestAnimationFrame(step);
        else { keyEl.innerHTML = render(target, true); decodeRAF = null; }
      })(performance.now());
    }

    // GET KEY -> manifest (reuses cart + crimson breach FX)
    var getBtn = $("#dma-get");
    if (getBtn) getBtn.addEventListener("click", function () {
      var p = current;
      var ok = Cart.add({
        key: "dma-" + p.id, kind: "dma",
        title: "DMA KEY · " + p.label, subtitle: "R6S · instant key delivery",
        price: p.price, unique: true, meta: { tier: "champion" },
      });
      var r = getBtn.getBoundingClientRect();
      if (ok) {
        runBreach(window.innerWidth / 2, r.top + r.height / 2, "champion", true);
        setTimeout(openCart, reduced ? 200 : 760);
      } else { flashCart(); }
    });

    select(current, false);                     // clean key on load (no animation)
    observeOnce($("#dma"), function () { setKey(true); }); // forge it when scrolled in
  }

  /* ---------------- featured high-roller ---------------- */
  function buildFeatured() {
    var host = $("#featured-card"); if (!host) return;
    var acc = D.ACCOUNTS.filter(function (a) { return a.featured; })[0] ||
      D.ACCOUNTS.slice().sort(function (a, b) { return b.price - a.price; })[0];
    host.innerHTML =
      '<span class="featured-tear" id="featured-tear"></span>' +
      '<div class="featured-emblem" id="featured-emblem">' + Emblem.draw(acc.tierKey, { size: 220, energy: 1 }) + '</div>' +
      '<div class="featured-info">' +
        '<p class="featured-eyebrow mono">★ HIGH-ROLLER // FEATURED</p>' +
        '<h3>' + acc.tag + ' · LVL ' + acc.level + '</h3>' +
        '<p class="featured-sub mono">' + acc.rankLabel + ' · ' + acc.region + ' · ' + acc.delivery + ' delivery</p>' +
        '<ul class="featured-perks">' + acc.perks.map(function (p) { return "<li>" + p + "</li>"; }).join("") + '</ul>' +
        '<div class="featured-buy"><span class="featured-price">' + D.price(acc.price) + '</span>' +
        '<a class="btn btn--ghost magnetic" data-cursor="lock" id="featured-add" href="' + acc.eldorado + '" target="_blank" rel="noopener">[ SECURE BUY ON ELDORADO &#9656; ]</a></div>' +
      '</div>';
    setReactorHue(acc.tierKey);
    $("#featured-add").addEventListener("click", function () {
      var r = host.getBoundingClientRect();
      runBreach(r.left + r.width / 2, r.top + r.height / 2, acc.tierKey);
    });
    // 3D tilt
    var emblem = $("#featured-emblem svg"), tear = $("#featured-tear");
    if (emblem && !reduced) {
      host.addEventListener("mousemove", function (e) {
        var r = host.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -14;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 14;
        emblem.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      host.addEventListener("mouseleave", function () { emblem.style.transform = ""; });
      // periodic tear (paused when tab hidden)
      setInterval(function () {
        if (!tear || document.hidden) return;
        tear.style.opacity = "1"; tear.style.top = (Math.random() * 90) + "%";
        setTimeout(function () { tear.style.opacity = "0"; }, 90);
      }, 2600);
    }
  }

  /* ---------------- boost calculator ---------------- */
  function buildCalculator() {
    var sf = $("#slider-from"), st = $("#slider-to");
    if (!sf || !st) return;
    var max = D.STEPS.length - 1;
    sf.max = max; st.max = max;
    var fromI = 12, toI = 31; // Silver III -> Diamond IV
    sf.value = fromI; st.value = toI;

    // options
    var optWrap = $("#calc-options");
    D.BOOST_OPTIONS.forEach(function (o) {
      var add = o.type === "mult" ? "+" + Math.round(o.value * 100) + "%" : "+" + D.price(o.value);
      var el = document.createElement("button");
      el.className = "copt"; el.setAttribute("data-opt", o.id); el.setAttribute("data-cursor", "lock");
      el.innerHTML = '<span class="copt-box"></span><span class="copt-tx">' + o.label + '<small>' + o.hint + '</small></span><span class="copt-add">' + add + '</span>';
      el.addEventListener("click", function () { el.classList.toggle("is-on"); update(); });
      optWrap.appendChild(el);
    });

    function selectedOpts() { return $$(".copt.is-on", optWrap).map(function (e) { return e.dataset.opt; }); }

    function update(rolled) {
      fromI = parseInt(sf.value, 10); toI = parseInt(st.value, 10);
      if (toI <= fromI) {
        // keep current < target with at least one division between them
        if (rolled === "to") {
          fromI = toI - 1;
          if (fromI < 0) { fromI = 0; toI = 1; }
        } else {
          toI = fromI + 1;
          if (toI > max) { toI = max; fromI = max - 1; }
        }
        sf.value = fromI; st.value = toI;
      }
      var from = D.STEPS[fromI], to = D.STEPS[toI];
      $("#calc-emblem-from").innerHTML = Emblem.draw(from.tier, { size: 132, energy: 0.55 });
      $("#calc-emblem-to").innerHTML = Emblem.draw(to.tier, { size: 132, energy: 0.95 });
      $("#calc-label-from").textContent = from.label;
      $("#calc-label-to").textContent = to.label;
      setReactorHue(to.tier);
      var q = D.boostQuote(fromI, toI, selectedOpts());
      if (q) {
        $("#calc-div").textContent = q.divisions;
        $("#calc-eta").textContent = "~" + q.etaDays + (q.etaDays === 1 ? " day" : " days");
        var priceEl = $("#calc-price");
        priceEl.textContent = D.price(q.total);
        priceEl.classList.remove("roll"); void priceEl.offsetWidth; priceEl.classList.add("roll");
        calcQuote = q;
      }
    }
    var calcQuote = null;

    sf.addEventListener("input", function () { update("from"); });
    st.addEventListener("input", function () { update("to"); });

    $("#deploy-boost").addEventListener("click", function () {
      if (!calcQuote) return;
      var to = calcQuote.to, from = calcQuote.from;
      var opts = selectedOpts();
      var key = "boost-" + from.id + "-" + to.id + "-" + opts.sort().join("");
      var sub = from.label + " → " + to.label + (opts.length ? " · " + opts.length + " add-on" + (opts.length > 1 ? "s" : "") : "");
      var ok = Cart.add({ key: key, kind: "boost", title: "BOOST · " + to.label, subtitle: sub, price: calcQuote.total, unique: true, meta: { tier: to.tier } });
      var r = $("#deploy-boost").getBoundingClientRect();
      if (ok) {
        runBreach(window.innerWidth / 2, r.top + r.height / 2, to.tier);
        setTimeout(openCart, reduced ? 200 : 760);
      } else { flashCart(); }
    });

    update();
    window.SNG_setCalc = function (ci, ti) { sf.value = ci; st.value = ti; update(); scrollToEl($("#calc")); };
  }

  /* ---------------- rank ladder ---------------- */
  function buildLadder() {
    var track = $("#ladder-track"); if (!track) return;
    D.TIERS.forEach(function (tier, idx) {
      // representative step index = first step of this tier
      var stepI = D.STEPS.findIndex(function (s) { return s.tier === tier.key; });
      var node = document.createElement("button");
      node.className = "lnode reveal spot"; node.setAttribute("data-cursor", "lock");
      node.innerHTML = '<div class="lnode-emblem">' + Emblem.draw(tier.key, { size: 90, energy: 0.5 + idx * 0.06 }) + '</div>' +
        '<div class="lnode-name">' + tier.name + '</div>' +
        '<div class="lnode-i mono">TIER ' + (idx + 1) + '/8</div>';
      node.addEventListener("mouseenter", function () { setReactorHue(tier.key); });
      node.addEventListener("click", function () {
        // prefill calc: current = one tier lower start, target = this tier top
        var targetI = D.STEPS.reduce(function (acc, s, i) { return s.tier === tier.key ? i : acc; }, stepI);
        var curI = Math.max(0, stepI - 3);
        if (window.SNG_setCalc) window.SNG_setCalc(curI, Math.max(curI + 1, targetI));
      });
      track.appendChild(node);
    });
    revealScan();
  }

  /* ---------------- FAQ ---------------- */
  function initFaq() {
    var items = $$(".faq-item");
    items.forEach(function (item, idx) {
      var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a"), x = item.querySelector(".faq-x");
      if (a && !a.id) a.id = "faq-a-" + idx;
      q.setAttribute("aria-expanded", "false");
      if (a) q.setAttribute("aria-controls", a.id);
      if (x) x.setAttribute("aria-hidden", "true");
      q.addEventListener("click", function () {
        var willOpen = !item.classList.contains("open");
        items.forEach(function (z) { z.classList.remove("open"); });
        if (willOpen) item.classList.add("open");
        items.forEach(function (z) { z.querySelector(".faq-q").setAttribute("aria-expanded", z.classList.contains("open") ? "true" : "false"); });
      });
    });
  }

  /* ---------------- cart UI ---------------- */
  var lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $("#drawer").classList.add("on"); $("#drawer-backdrop").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false");
    var c = $("#close-cart"); if (c) c.focus();
  }
  function closeCart() {
    $("#drawer").classList.remove("on"); $("#drawer-backdrop").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function flashCart() { var c = $(".hud-cart"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }

  // Escape closes the top-most overlay (success > checkout > drawer)
  function initOverlayKeys() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if ($("#success").classList.contains("on")) $("#success-close").click();
      else if ($("#checkout").classList.contains("on")) closeCheckout();
      else if ($("#drawer").classList.contains("on")) closeCart();
    });
  }

  function initCartUI() {
    $("#open-cart").addEventListener("click", openCart);
    $("#close-cart").addEventListener("click", closeCart);
    $("#drawer-backdrop").addEventListener("click", closeCart);
    $("#to-checkout").addEventListener("click", function () {
      if (Cart.count() === 0) { flashCart(); return; }
      closeCart(); openCheckout();
    });
    $("#promo-apply").addEventListener("click", applyPromo);
    $("#promo-input").addEventListener("keydown", function (e) { if (e.key === "Enter") applyPromo(); });
  }

  function applyPromo() {
    var v = ($("#promo-input").value || "").trim().toUpperCase();
    var msg = $("#promo-msg");
    if (PROMOS[v]) {
      appState.discount = PROMOS[v]; appState.promo = v;
      msg.className = "promo-msg mono ok"; msg.textContent = "✓ " + v + " applied · -" + Math.round(PROMOS[v] * 100) + "%";
    } else {
      appState.discount = 0; appState.promo = "";
      msg.className = "promo-msg mono bad"; msg.textContent = "✗ invalid cheat code";
    }
    onCartChange();
  }

  function totalAfterDiscount() { return Math.round(Cart.subtotal() * (1 - appState.discount)); }

  function onCartChange(e) {
    var n = Cart.count();
    $("#cart-count").textContent = n;
    if (e && e.detail && (e.detail.type === "add")) flashCart();
    if (e && e.detail && e.detail.type === "duplicate") { flashCart(); }

    // render line items
    var body = $("#drawer-body"), empty = $("#drawer-empty"), foot = $("#drawer-foot");
    var items = Cart.items;
    body.innerHTML = "";
    if (items.length === 0) {
      empty.style.display = "block"; foot.style.display = "none";
    } else {
      empty.style.display = "none"; foot.style.display = "block";
      items.forEach(function (it) {
        var tier = (it.meta && it.meta.tier) || "platinum";
        var row = document.createElement("div");
        row.className = "litem";
        row.innerHTML =
          '<div class="litem-emblem">' + Emblem.draw(tier, { size: 44, energy: 0.7 }) + '</div>' +
          '<div class="litem-info"><div class="litem-title">' + it.title + '</div><div class="litem-sub">' + it.subtitle + '</div></div>' +
          '<div class="litem-right"><div class="litem-price">' + D.price(it.price) + '</div><button class="litem-rm" data-cursor="lock">remove</button></div>';
        row.querySelector(".litem-rm").addEventListener("click", function () { Cart.remove(it.key); });
        body.appendChild(row);
      });
    }
    $("#drawer-subtotal").textContent = D.price(totalAfterDiscount());
  }

  /* ---------------- checkout ---------------- */
  var coStep = 1;
  function openCheckout() {
    lastFocus = document.activeElement;
    gotoStep(1); $("#checkout").classList.add("on"); $("#checkout").setAttribute("aria-hidden", "false");
    var em = $("#co-email"); if (em) em.focus();
  }
  function closeCheckout() {
    $("#checkout").classList.remove("on"); $("#checkout").setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function gotoStep(n) {
    coStep = n;
    $$(".co-step").forEach(function (s) { s.hidden = parseInt(s.dataset.step, 10) !== n; });
    $("#co-bar").style.width = (n / 3 * 100) + "%";
    $("#co-stepname").textContent = ["", "01 // CONTACT", "02 // PAYMENT", "03 // CONFIRM"][n];
    if (n === 3) renderSummary();
  }
  function renderSummary() {
    var box = $("#co-summary"); box.innerHTML = "";
    Cart.items.forEach(function (it) {
      var l = document.createElement("div"); l.className = "co-sline";
      l.innerHTML = "<span>" + it.title + "</span><span>" + D.price(it.price) + "</span>";
      box.appendChild(l);
    });
    if (appState.discount) {
      var d = document.createElement("div"); d.className = "co-sline";
      d.innerHTML = "<span>promo " + appState.promo + "</span><span>-" + Math.round(appState.discount * 100) + "%</span>";
      box.appendChild(d);
    }
    $("#co-total").textContent = D.price(totalAfterDiscount());
  }
  function initCheckout() {
    $("#close-checkout").addEventListener("click", closeCheckout);
    $("#co-next-1").addEventListener("click", function () {
      var email = $("#co-email").value.trim(), handle = $("#co-handle").value.trim();
      var err = $("#co-err-1");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "> enter a valid email"; return; }
      if (handle.length < 2) { err.textContent = "> enter your discord / in-game name"; return; }
      err.textContent = ""; gotoStep(2);
    });
    $("#co-back-2").addEventListener("click", function () { gotoStep(1); });
    $("#co-next-2").addEventListener("click", function () {
      var err = $("#co-err-2");
      if (appState.payment === "card") {
        var num = ($("#co-cardnum").value || "").replace(/\s/g, "");
        if (num.length < 12) { err.textContent = "> enter a card number (demo: 4242 4242 4242 4242)"; return; }
      }
      err.textContent = ""; gotoStep(3);
    });
    $("#co-back-3").addEventListener("click", function () { gotoStep(2); });
    $$(".co-pay").forEach(function (p) {
      p.addEventListener("click", function () {
        $$(".co-pay").forEach(function (x) { x.classList.remove("is-on"); });
        p.classList.add("is-on"); appState.payment = p.dataset.pay;
        $("#co-card-fields").style.display = appState.payment === "card" ? "block" : "none";
      });
    });
    $("#co-confirm").addEventListener("click", function () {
      var tier = topTier();
      closeCheckout();
      runBreach(window.innerWidth / 2, window.innerHeight / 2, tier, true);
      setTimeout(function () { showSuccess(tier); }, reduced ? 200 : 720);
    });
  }
  function topTier() {
    var best = null, bestP = -1;
    Cart.items.forEach(function (it) {
      if (it.price > bestP) { bestP = it.price; best = (it.meta && it.meta.tier) || "diamond"; }
    });
    return best || "diamond";
  }

  /* ---------------- success ---------------- */
  function initSuccess() {
    $("#success-close").addEventListener("click", function () { $("#success").classList.remove("on"); $("#success").setAttribute("aria-hidden", "true"); });
  }
  function showSuccess(tier) {
    var ov = $("#success");
    $("#success-emblem").innerHTML = Emblem.draw(tier, { size: 180, energy: 1 });
    var id = "SNG-" + String(Date.now()).slice(-6);
    $("#success-order").textContent = id;
    ov.classList.add("on"); ov.setAttribute("aria-hidden", "false");
    var log = $("#success-log"); log.textContent = "";
    var lines = ["> PAYMENT CONFIRMED", "> ASSETS DEPLOYING ……… OK", "> RANK SECURED // " + tier.toUpperCase()];
    if (reduced) { log.textContent = lines.join("\n"); }
    else {
      var i = 0;
      (function nl() { if (i >= lines.length) return; log.textContent += (i ? "\n" : "") + lines[i]; i++; setTimeout(nl, 360); })();
    }
    appState.discount = 0; appState.promo = "";
    Cart.clear();
  }

  /* ---------------- breach FX ---------------- */
  function runBreach(cx, cy, tierKey, fullscreen) {
    flashCart();
    if (reduced) return;
    var color = Emblem.RAMP[tierKey] || "#34e3ff";
    var ov = document.createElement("div"); ov.id = "breach-overlay";
    ov.style.left = "0"; ov.style.top = "0"; ov.style.width = "100vw"; ov.style.height = "100vh";
    var cv = document.createElement("canvas");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    cv.style.width = "100%"; cv.style.height = "100%";
    ov.appendChild(cv); document.body.appendChild(ov);
    var ctx = cv.getContext("2d");

    function hexToRgba(hex, a) {
      var c = hex.replace("#", ""); if (c.length === 3) c = c.replace(/(.)/g, "$1$1");
      var n = parseInt(c, 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    var start = performance.now(), DUR = 600, maxR = fullscreen ? 260 : 180;
    function frame(t) {
      var p = Math.min(1, (t - start) / DUR);
      ctx.clearRect(0, 0, cv.width, cv.height);

      // soft central glow rises then settles
      var glowA = Math.sin(Math.min(1, p / 0.55) * Math.PI) * 0.5;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      g.addColorStop(0, "rgba(255,255,255," + (glowA * 0.45) + ")");
      g.addColorStop(0.35, hexToRgba(color, glowA * 0.55));
      g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, 6.2832); ctx.fill();

      // two clean expanding rings
      for (var ri = 0; ri < 2; ri++) {
        var rp = p - ri * 0.18; if (rp <= 0) continue;
        var rr = rp * maxR * 1.25, ra = Math.max(0, 1 - rp) * 0.7;
        ctx.strokeStyle = ri ? hexToRgba("#00e5ff", ra) : hexToRgba(color, ra);
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke();
      }

      if (p < 1) requestAnimationFrame(frame);
      else {
        // emblem + line
        var em = document.createElement("div"); em.className = "breach-emblem";
        em.style.left = cx + "px"; em.style.top = cy + "px";
        em.innerHTML = Emblem.draw(tierKey, { size: fullscreen ? 160 : 120, energy: 1 });
        document.body.appendChild(em);
        var line = document.createElement("div"); line.className = "breach-line";
        line.style.left = cx + "px"; line.style.top = (cy + (fullscreen ? 100 : 78)) + "px";
        document.body.appendChild(line);
        if (hasGSAP) window.gsap.fromTo(em, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" });
        else { em.style.opacity = "1"; em.style.transform = "translate(-50%,-50%) scale(1)"; }
        var txt = "> ACCESS GRANTED // " + tierKey.toUpperCase(), j = 0;
        (function tp() { if (j > txt.length) { cleanup(); return; } line.textContent = txt.slice(0, j); j++; setTimeout(tp, 24); })();
        function cleanup() {
          setTimeout(function () {
            [ov, em, line].forEach(function (n) { n.style.transition = "opacity 0.4s"; n.style.opacity = "0"; });
            setTimeout(function () { [ov, em, line].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); }, 420);
          }, 520);
        }
      }
    }
    requestAnimationFrame(frame);
  }

  /* ════════════════ EXTRA WOW LAYER ════════════════ */

  /* section titles decode/scramble on enter */
  function initScramble() {
    if (reduced || !("IntersectionObserver" in window)) return;
    var glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>*".split("");
    function scramble(el) {
      // Preserve any inner markup (e.g. the DMA title's crimson <span>) — animate
      // on textContent, then restore the original innerHTML on completion.
      var html = el.getAttribute("data-final-html");
      if (html == null) { html = el.innerHTML; el.setAttribute("data-final-html", html); }
      var fin = el.getAttribute("data-final");
      if (fin == null) { fin = el.textContent; el.setAttribute("data-final", fin); }
      var hasMarkup = el.children.length > 0;
      var len = fin.length, start = performance.now(), dur = 720;
      (function step(t) {
        var p = Math.min(1, (t - start) / dur), reveal = Math.floor(p * len), out = "";
        for (var i = 0; i < len; i++) {
          var ch = fin[i];
          out += (ch === " " || i < reveal) ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else if (hasMarkup) el.innerHTML = html;   // restore the crimson span etc.
        else el.textContent = fin;
      })(performance.now());
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { scramble(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    $$(".sec-title").forEach(function (el) { io.observe(el); });
  }

  /* hero mouse parallax (orb keeps its own drift; we move type + rain) */
  function initHeroParallax() {
    if (reduced) return;
    var hero = $("#hero"), wm = $(".hero .wordmark"), head = $(".hero-head"), rain = $("#hero-rain");
    if (!hero) return;
    hero.addEventListener("mousemove", function (e) {
      var cx = e.clientX / window.innerWidth - 0.5, cy = e.clientY / window.innerHeight - 0.5;
      if (wm) wm.style.transform = "translate(" + (cx * 22) + "px," + (cy * 12) + "px)";
      if (head) head.style.transform = "translate(" + (cx * 12) + "px," + (cy * 7) + "px)";
      if (rain) rain.style.transform = "translate(" + (cx * -16) + "px," + (cy * -9) + "px)";
    });
    hero.addEventListener("mouseleave", function () {
      [wm, head, rain].forEach(function (n) { if (n) n.style.transform = ""; });
    });
  }

  /* scroll-velocity skew on the page body (awwwards signature) */
  function initVelocitySkew() {
    if (reduced) return;
    var main = $("main"); if (!main) return;
    var cur = 0, target = 0, lastY = window.scrollY, raf = false;
    function loop() {
      cur += (target - cur) * 0.1; target *= 0.86;
      if (Math.abs(cur) < 0.01) cur = 0;
      main.style.transform = "skewY(" + cur.toFixed(3) + "deg)";
      if (Math.abs(cur) > 0.01 || Math.abs(target) > 0.01) requestAnimationFrame(loop); else { raf = false; main.style.transform = ""; }
    }
    function kick(v) { target = Math.max(-2.4, Math.min(2.4, v)); if (!raf) { raf = true; requestAnimationFrame(loop); } }
    if (lenis) lenis.on("scroll", function (e) { kick((e.velocity || 0) * 0.5); });
    else window.addEventListener("scroll", function () { var y = window.scrollY; kick((y - lastY) * 0.04); lastY = y; }, { passive: true });
  }

  /* cursor spotlight glow on .spot panels */
  function initSpotlight() {
    if (reduced) return;
    $$(".calc-console, .vouch, .how-step").forEach(function (e) { e.classList.add("spot"); });
    document.addEventListener("mousemove", function (e) {
      var el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    }, { passive: true });
  }

  /* live "recent purchase" social-proof toasts */
  function initLiveProof() {
    var host = $("#liveproof"); if (!host || reduced) return;
    var names = ["kr1sp", "m1lo", "fern_ow", "taz1k", "v0id", "nyx", "sh4dow", "echo", "r1ven", "jolt", "apex_", "wraith"];
    var evs = [
      { t: "secured a", r: "Diamond III account", tier: "diamond" },
      { t: "boosted to", r: "Champion", tier: "champion" },
      { t: "secured a", r: "Platinum II account", tier: "platinum" },
      { t: "boosted to", r: "Emerald IV", tier: "emerald" },
      { t: "secured a", r: "Champion account", tier: "champion" },
      { t: "boosted to", r: "Diamond I", tier: "diamond" }
    ];
    function show() {
      if (document.hidden) { schedule(); return; }
      var nm = names[Math.floor(Math.random() * names.length)];
      var ev = evs[Math.floor(Math.random() * evs.length)];
      var mins = 1 + Math.floor(Math.random() * 9);
      var toast = document.createElement("div");
      toast.className = "lp-toast spot";
      toast.innerHTML = '<span class="lp-em">' + Emblem.draw(ev.tier, { size: 34, energy: 0.8 }) + '</span>' +
        '<span class="lp-tx"><b>@' + nm + '</b> ' + ev.t + ' <i>' + ev.r + '</i><small>' + mins + ' min ago · verified</small></span>';
      host.appendChild(toast);
      requestAnimationFrame(function () { toast.classList.add("in"); });
      setTimeout(function () {
        toast.classList.remove("in");
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 500);
      }, 4200);
      schedule();
    }
    function schedule() { setTimeout(show, 7000 + Math.random() * 7000); }
    setTimeout(show, 4500);
  }

  /* Konami easter egg -> GOD MODE */
  function initKonami() {
    var seq = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"], pos = 0;
    document.addEventListener("keydown", function (e) {
      var k = e.key.toLowerCase();
      if (k === seq[pos]) { pos++; if (pos === seq.length) { pos = 0; godmode(); } }
      else { pos = (k === seq[0]) ? 1 : 0; }
    });
    function godmode() {
      PROMOS.GODMODE = 0.5;
      document.body.classList.add("godmode");
      runBreach(window.innerWidth / 2, window.innerHeight / 2, "champion", true);
      var n = document.createElement("div"); n.className = "godmode-banner mono";
      n.innerHTML = "&gt; GOD MODE UNLOCKED // cheat code <b>GODMODE</b> = -50%";
      document.body.appendChild(n);
      setTimeout(function () { document.body.classList.remove("godmode"); }, 1500);
      setTimeout(function () { n.classList.add("out"); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 600); }, 4400);
    }
  }

  /* optional WebAudio UI blips (off by default) */
  function initSound() {
    var btn = $("#sound-toggle"); if (!btn) return;
    var on = false, ac = null;
    function ensure() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; }
    function blip(freq, dur, type, gain) {
      if (!on) return; var a = ensure(); if (!a) return;
      if (a.state === "suspended") a.resume();
      var o = a.createOscillator(), g = a.createGain();
      o.type = type || "square"; o.frequency.value = freq; g.gain.value = gain || 0.04;
      o.connect(g); g.connect(a.destination);
      var t = a.currentTime; o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.06)); o.stop(t + (dur || 0.06));
    }
    btn.addEventListener("click", function () {
      on = !on; btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) { ensure(); blip(660, 0.08, "square", 0.05); }
    });
    document.addEventListener("mouseover", function (e) {
      if (on && e.target.closest && e.target.closest('[data-cursor="lock"], a, button, .acard, .lnode')) blip(880, 0.03, "square", 0.02);
    });
    document.addEventListener("click", function (e) {
      if (on && e.target.closest && e.target.closest("button, a, .acard-add, .filter")) blip(420, 0.07, "sawtooth", 0.04);
    });
  }

  /* ════════════════ STUN LAYER ════════════════ */

  /* WebGL shader background (graceful fallback to CSS orb) */
  function initShaderBG() {
    if (reduced) return;
    var cv = $("#shaderbg");
    if (cv && window.SNGShaderBG && window.SNGShaderBG.start(cv)) cv.classList.add("on");
  }

  /* drifting background rank shards */
  function initShards() {
    var host = $("#shards"); if (!host || reduced) return;
    [["champion", "sh1"], ["diamond", "sh2"], ["emerald", "sh3"]].forEach(function (s) {
      var d = document.createElement("div"); d.className = "shard " + s[1];
      d.innerHTML = Emblem.draw(s[0], { size: 260, energy: 0.5 });
      host.appendChild(d);
    });
  }

  /* hero orbiting emblem ring */
  function initHeroOrbit() {
    var host = $("#hero-orbit"); if (!host) return;
    var tiers = Emblem.ORDER, n = tiers.length, R = 46;
    tiers.forEach(function (tk, i) {
      var ang = (i / n) * Math.PI * 2;
      var d = document.createElement("div"); d.className = "orb-em";
      d.style.left = (50 + Math.cos(ang) * R) + "%";
      d.style.top = (50 + Math.sin(ang) * R) + "%";
      d.innerHTML = Emblem.draw(tk, { size: 50, energy: 0.5 });
      host.appendChild(d);
    });
  }

  /* rotating circular badge */
  function initSpinBadge() {
    var host = $("#spin-badge"); if (!host) return;
    host.innerHTML =
      '<svg viewBox="0 0 100 100"><defs><path id="sngCirc" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>' +
      '<text class="spin-tx"><textPath href="#sngCirc" startOffset="0">SNG ✦ RANK IS A SYSTEM ✦ WE BREACH IT ✦ </textPath></text></svg>' +
      '<span class="spin-mid">▼</span>';
  }

  /* rotating DNA spine — the helix spins as you scroll down (scroll = rotation) */
  function initSpine() {
    var cv = $("#spine"); if (!cv || reduced) return;
    var ctx = cv.getContext("2d"); if (!ctx) return;
    var W, H, dpr, rt, rot = 0, target = 0, running = true, needDraw = true;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needDraw = true;
    }
    resize(); window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); onScroll(); }, 150); });
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      target = (max > 0 ? window.scrollY / max : 0) * Math.PI * 12; // ~6 turns top -> bottom
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    document.addEventListener("visibilitychange", function () { running = !document.hidden; needDraw = true; });

    function node(x, y, depth, rgb) {
      ctx.fillStyle = "rgba(" + rgb + "," + (0.3 + depth * 0.7) + ")";
      ctx.beginPath(); ctx.arc(x, y, 1 + depth * 2.6, 0, 6.2832); ctx.fill();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var cxc = W * 0.5, radius = Math.min(W * 0.16, 230), turns = 4.0, N = Math.min(110, Math.max(40, Math.floor(H / 8)));
      var prev = [null, null];
      for (var i = 0; i <= N; i++) {
        var y = (i / N) * H, a0 = rot + (i / N) * turns * Math.PI * 2;
        for (var s = 0; s < 2; s++) {
          var a = a0 + s * Math.PI;
          var x = cxc + Math.cos(a) * radius, z = Math.sin(a), depth = (z + 1) / 2;
          if (prev[s]) {
            // strand 0 = ice, strand 1 = crimson (disciplined two-tone helix)
            ctx.strokeStyle = (s ? "rgba(255,39,64," : "rgba(52,227,255,") + (0.12 + depth * 0.6) + ")";
            ctx.lineWidth = 1 + depth * 2.6; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(prev[s][0], prev[s][1]); ctx.lineTo(x, y); ctx.stroke();
          }
          prev[s] = [x, y];
        }
        if (i % 3 === 0) {
          var ax = cxc + Math.cos(a0) * radius, bx = cxc + Math.cos(a0 + Math.PI) * radius;
          ctx.strokeStyle = "rgba(138,151,180,0.13)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(bx, y); ctx.stroke();
          node(ax, y, (Math.sin(a0) + 1) / 2, "52,227,255");
          node(bx, y, (Math.sin(a0 + Math.PI) + 1) / 2, "255,39,64");
        }
      }
    }
    function frame() {
      requestAnimationFrame(frame);
      if (!running) return;
      var d = target - rot; rot += d * 0.08;
      if (needDraw || Math.abs(d) > 0.0008) { draw(); needDraw = false; }
    }
    requestAnimationFrame(frame);
  }

  /* multi-layer parallax — background depths drift at different scroll rates */
  function initParallax() {
    if (reduced) return;
    var shards = $("#shards"); if (!shards) return;
    var ticking = false;
    // Only the shards drift — the fixed full-screen shader stays put (translating it
    // would lift its bottom edge and expose a seam on long pages).
    function apply() {
      ticking = false;
      shards.style.transform = "translate3d(0," + (window.scrollY * -0.04) + "px,0)";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
  }

  /* viewport HUD telemetry readout */
  function initViewportHud() {
    var t = $("#vh-telem"); if (!t) return;
    function pad(n) { return ("00" + n).slice(-3); }
    function upd() {
      if (document.hidden) return;
      t.textContent = "LAT " + (8 + Math.floor(Math.random() * 9)) + "ms · SEC · " + pad(Math.floor(Math.random() * 999)) + ":" + pad(Math.floor(Math.random() * 999));
    }
    upd(); setInterval(upd, 1900);
  }

  /* preloader combat FX — Rainbow Six-style operator firing + breach finale */
  function bootFX(cv) {
    var ctx = cv.getContext("2d"); if (!ctx) return null;
    var W, H, dpr, rt, rafId = 0, running = true, frameN = 0;
    var tracers = [], flashes = [], shells = [], sparks = [], shock = null;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function onResize() { clearTimeout(rt); rt = setTimeout(resize, 150); }
    resize(); window.addEventListener("resize", onResize);
    function opr() { return { x: W * 0.5 - 26, y: H * 0.84 }; }
    function muzzlePt() { var o = opr(); return { x: o.x + 60, y: o.y - 42 }; }
    function fire() {
      var m = muzzlePt();
      var ang = -Math.PI * 0.32 + (Math.random() - 0.5) * 0.5; // tight up-right cone
      var sp = 17 + Math.random() * 12;
      var col = Math.random() < 0.5 ? "#eaffff" : (Math.random() < 0.5 ? "#34e3ff" : "#ff2740");
      tracers.push({ x: m.x, y: m.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col: col, trail: [] });
      flashes.push({ x: m.x, y: m.y, life: 1 });
      shells.push({ x: m.x - 12, y: m.y + 4, vx: -(1 + Math.random() * 2), vy: -(2 + Math.random() * 2), rot: 0, life: 1 });
    }
    function drawOperator() {
      var o = opr(), m = muzzlePt();
      // crouched body
      ctx.fillStyle = "#06040f"; ctx.strokeStyle = "rgba(0,229,255,0.5)"; ctx.lineWidth = 2; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(o.x - 22, o.y + 30); ctx.lineTo(o.x - 13, o.y - 6);
      ctx.quadraticCurveTo(o.x - 4, o.y - 26, o.x + 12, o.y - 22);
      ctx.lineTo(o.x + 20, o.y - 4); ctx.lineTo(o.x + 16, o.y + 30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // helmeted head + visor glow
      ctx.beginPath(); ctx.arc(o.x + 6, o.y - 34, 11, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(0,229,255,0.9)"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(o.x + 1, o.y - 37); ctx.lineTo(o.x + 13, o.y - 33); ctx.stroke();
      // rifle
      ctx.strokeStyle = "#0a0818"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(o.x + 4, o.y - 8); ctx.lineTo(m.x, m.y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,39,64,0.7)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x + 4, o.y - 8); ctx.lineTo(m.x, m.y); ctx.stroke();
    }
    function frame() {
      if (!running) return;          // stop() ends the loop (no re-arm) — no immortal rAF
      rafId = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);
      frameN++;
      if (frameN % 4 === 0) fire();
      drawOperator();
      // tracers
      for (var i = tracers.length - 1; i >= 0; i--) {
        var t = tracers[i];
        t.trail.push([t.x, t.y]); if (t.trail.length > 8) t.trail.shift();
        t.x += t.vx; t.y += t.vy; t.life -= 0.02;
        if (t.life <= 0 || t.y < -20 || t.x > W + 20) {
          for (var z = 0; z < 4; z++) sparks.push({ x: t.x, y: Math.max(0, t.y), vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 1, col: t.col });
          tracers.splice(i, 1); continue;
        }
        ctx.strokeStyle = t.col; ctx.lineWidth = 2; ctx.lineCap = "round";
        ctx.beginPath();
        for (var j = 0; j < t.trail.length; j++) { var p = t.trail[j]; if (j === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
        ctx.lineTo(t.x, t.y); ctx.stroke();
        ctx.fillStyle = t.col; ctx.beginPath(); ctx.arc(t.x, t.y, 2, 0, 6.2832); ctx.fill();
      }
      // muzzle flashes
      for (var k = flashes.length - 1; k >= 0; k--) {
        var f = flashes[k]; f.life -= 0.22; if (f.life <= 0) { flashes.splice(k, 1); continue; }
        var r = (1 - f.life) * 22 + 5;
        var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, "rgba(255,255,255," + (f.life * 0.8) + ")");
        g.addColorStop(0.4, "rgba(0,229,255," + (f.life * 0.4) + ")");
        g.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 6.2832); ctx.fill();
      }
      // ejected shells
      for (var s = shells.length - 1; s >= 0; s--) {
        var sh = shells[s]; sh.vy += 0.35; sh.x += sh.vx; sh.y += sh.vy; sh.rot += 0.3; sh.life -= 0.02;
        if (sh.life <= 0 || sh.y > H) { shells.splice(s, 1); continue; }
        ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
        ctx.fillStyle = "rgba(200,162,74," + sh.life + ")"; ctx.fillRect(-2, -1, 4, 2); ctx.restore();
      }
      // impact sparks
      for (var q = sparks.length - 1; q >= 0; q--) {
        var s2 = sparks[q]; s2.x += s2.vx; s2.y += s2.vy; s2.life -= 0.06;
        if (s2.life <= 0) { sparks.splice(q, 1); continue; }
        ctx.globalAlpha = s2.life; ctx.fillStyle = s2.col; ctx.fillRect(s2.x, s2.y, 2, 2); ctx.globalAlpha = 1;
      }
      // breach shockwave finale (cyan / white)
      if (shock) {
        shock.r += 26; shock.life -= 0.022;
        ctx.strokeStyle = "rgba(255,255,255," + Math.max(0, shock.life) + ")"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(shock.x, shock.y, shock.r, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = "rgba(0,229,255," + Math.max(0, shock.life * 0.8) + ")"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(shock.x, shock.y, Math.max(0, shock.r - 10), 0, 6.2832); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255," + Math.max(0, shock.life * 0.22) + ")"; ctx.fillRect(0, 0, W, H);
        if (shock.life <= 0) shock = null;
      }
    }
    rafId = requestAnimationFrame(frame);
    return {
      finale: function () { shock = { x: W * 0.5, y: H * 0.5, r: 6, life: 1 }; for (var n = 0; n < 22; n++) fire(); },
      stop: function () { running = false; if (rafId) cancelAnimationFrame(rafId); window.removeEventListener("resize", onResize); }
    };
  }

})();
