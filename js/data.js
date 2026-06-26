/* ============================================================================
   SNG — DATA LAYER
   Pure content + pricing logic. No visual decisions here.
   Exposed as a global (window.SNG) so it works with classic <script> tags
   (no ES modules) and therefore also when opened via file://.

   >> EVERYTHING below (accounts, prices, reviews) is SAMPLE data.
   >> Swap real listings/prices before going live. Search "SAMPLE".
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Currency -----------------------------------------------------------
     One place to change it. EUR by default (European audience).
     To switch: set symbol + code, the whole site follows.                    */
  const CURRENCY = { symbol: "$", code: "USD", position: "prefix" }; // matches Eldorado (USD)

  /* ---- Discord (single source of truth) -----------------------------------
     Every "Discord" link on the site reads from here (main.js wires it to all
     [data-discord] elements). Swap this ONE value to update the whole site. */
  const DISCORD = "https://discord.gg/wcSxmUcRqq"; // SNG store server (permanent invite)

  function price(n) {
    const num = Number(n) || 0;
    const s = (Math.round(num * 100) % 100 === 0)
      ? num.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return CURRENCY.position === "prefix" ? CURRENCY.symbol + s : s + CURRENCY.symbol;
  }

  /* ---- R6 Ranked 2.0 ladder ----------------------------------------------
     Canonical order, Copper -> Champion. Divisions V..I (5..1) per tier,
     Champion is a single apex rank. Colors here are the in-game RANK colors
     (content), independent from the site's neon palette (theme).            */
  const TIERS = [
    { key: "copper",    name: "Copper",    color: "#B06A3B", divisions: 5 },
    { key: "bronze",    name: "Bronze",    color: "#C77B43", divisions: 5 },
    { key: "silver",    name: "Silver",    color: "#9FB1C2", divisions: 5 },
    { key: "gold",      name: "Gold",      color: "#E8B84B", divisions: 5 },
    { key: "platinum",  name: "Platinum",  color: "#2BB6D0", divisions: 5 },
    { key: "emerald",   name: "Emerald",   color: "#20C9E0", divisions: 5 },
    { key: "diamond",   name: "Diamond",   color: "#34E3FF", divisions: 5 },
    { key: "champion",  name: "Champion",  color: "#FF4D6D", divisions: 1 },
  ];

  // Per-division boost price (in CURRENCY units). Rises steeply with tier:
  // higher elo = harder = pricier per division. Champion is a flat apex jump.
  const PER_DIVISION = {
    copper: 1, bronze: 2, silver: 3, gold: 4,
    platinum: 6, emerald: 9, diamond: 14, champion: 45,
  };

  // Build a flat, ordered list of rank "steps" so the calculator can measure
  // distance between any two ranks. Each step carries the cost to ENTER it.
  // e.g. ["Copper V","Copper IV",...,"Diamond I","Champion"]
  const ROMAN = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
  const STEPS = [];
  TIERS.forEach((tier, ti) => {
    if (tier.key === "champion") {
      STEPS.push({
        id: STEPS.length,
        tier: tier.key,
        tierName: tier.name,
        color: tier.color,
        division: 0,
        label: "Champion",
        short: "CHAMP",
        enterCost: PER_DIVISION.champion,
      });
      return;
    }
    for (let d = tier.divisions; d >= 1; d--) {
      STEPS.push({
        id: STEPS.length,
        tier: tier.key,
        tierName: tier.name,
        color: tier.color,
        division: d,
        label: tier.name + " " + ROMAN[d],
        short: tier.name.slice(0, 4).toUpperCase() + " " + ROMAN[d],
        enterCost: PER_DIVISION[tier.key],
      });
    }
  });

  /* ---- Boosting calculator ------------------------------------------------
     basePrice(fromId, toId) = sum of enterCost for every step you climb.
     Then add-ons apply as multipliers / flats on top.                        */
  const BOOST_OPTIONS = [
    {
      id: "duo",
      label: "Duo / play with you",
      hint: "Booster queues alongside you instead of solo.",
      type: "mult", value: 0.45,
    },
    {
      id: "priority",
      label: "Priority — express delivery",
      hint: "Your order jumps the queue, finished ASAP.",
      type: "mult", value: 0.25,
    },
    {
      id: "stream",
      label: "Live stream of your boost",
      hint: "Watch every match on a private stream link.",
      type: "mult", value: 0.10,
    },
    {
      id: "vpn",
      label: "VPN / offline appear-offline",
      hint: "Booster stays invisible to your friends list.",
      type: "flat", value: 9,
    },
  ];

  // Compute a boost quote. Returns null if target isn't above current.
  function boostQuote(fromId, toId, optionIds) {
    if (toId <= fromId) return null;
    let base = 0;
    for (let i = fromId + 1; i <= toId; i++) base += STEPS[i].enterCost;

    let total = base;
    let multAdd = 0;
    let flatAdd = 0;
    const applied = [];
    (optionIds || []).forEach((oid) => {
      const opt = BOOST_OPTIONS.find((o) => o.id === oid);
      if (!opt) return;
      applied.push(opt);
      if (opt.type === "mult") multAdd += opt.value;
      else flatAdd += opt.value;
    });
    total = base * (1 + multAdd) + flatAdd;

    // Rough ETA: ~0.9 divisions/day, faster with priority.
    const divisions = toId - fromId;
    let days = Math.max(1, Math.ceil(divisions / 0.9));
    if (optionIds && optionIds.indexOf("priority") !== -1)
      days = Math.max(1, Math.round(days * 0.6));

    return {
      from: STEPS[fromId],
      to: STEPS[toId],
      divisions,
      base: Math.round(base),
      total: Math.round(total),
      etaDays: days,
      applied,
    };
  }

  /* ---- Accounts catalog — MIRRORED FROM ELDORADO (seller SNG_Gnesa) --------
     Real listings. `eldorado` deep-links to the live listing (real checkout +
     TradeShield). blackIce null = present, count not stated. Refresh when stock
     changes. Prices in USD to match Eldorado.                                  */
  const EL = "https://www.eldorado.gg/en/rainbow-six-siege-accounts/oa/";
  const ACCOUNTS = [
    { id: "326a6f2f", tag: "ICEBREAKER", rankLabel: "Ranked Ready", tierKey: "platinum",
      price: 50, level: 145, blackIce: 21, universals: 0, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "RARE", featured: false,
      perks: ["21× Black Ice", "Full access", "Original email", "10-day warranty"],
      eldorado: EL + "326a6f2f-ed7c-43ef-c34f-08dec868ca2f" },

    { id: "1f4f9f77", tag: "SIXSHOT", rankLabel: "Ranked Ready", tierKey: "emerald",
      price: 67.89, level: 164, blackIce: 15, universals: 6, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "RARE", featured: false,
      perks: ["15× Black Ice", "6 Universals", "Full access", "Original email"],
      eldorado: EL + "1f4f9f77-703f-4935-f1b0-08dec87a97bf" },

    { id: "66f99966", tag: "ROOKIE", rankLabel: "Ranked Ready", tierKey: "gold",
      price: 30, level: 78, blackIce: 1, universals: 1, elites: 0, operators: "32",
      delivery: "Instant", region: "PC", badge: "VALUE", featured: false,
      perks: ["1 Universal", "1 Seasonal", "Full access", "Original email"],
      eldorado: EL + "66f99966-1635-4a30-e4cb-08dec868cb06" },

    { id: "f4cc805d", tag: "WHITEOUT", rankLabel: "Ranked Ready", tierKey: "platinum",
      price: 50, level: 157, blackIce: 14, universals: 0, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "VALUE", featured: false,
      perks: ["14× Black Ice", "Full access", "Original email", "10-day warranty"],
      eldorado: EL + "f4cc805d-bef8-418e-a3ce-08decaac4263" },

    { id: "d9311845", tag: "AVALANCHE", rankLabel: "Ranked Ready", tierKey: "emerald",
      price: 70, level: 180, blackIce: 34, universals: 3, elites: 1, operators: "50+",
      delivery: "Instant", region: "PC", badge: "ELITE", featured: false,
      perks: ["34× Black Ice", "3 Universals", "1 Elite", "Full access"],
      eldorado: EL + "d9311845-8ad1-4396-71f7-08dec86aed0a" },

    { id: "ce468a73", tag: "WARDEN", rankLabel: "Platinum", tierKey: "platinum",
      price: 70, level: 278, blackIce: 35, universals: 16, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "ELITE", featured: false,
      perks: ["35× Black Ice", "16 Universals", "Rare skins", "Full email access"],
      eldorado: EL + "ce468a73-c9c5-48a0-d286-08dec7866007" },

    { id: "848655a6", tag: "FROSTBYTE", rankLabel: "Ranked Ready", tierKey: "platinum",
      price: 45, level: 138, blackIce: 12, universals: 1, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "VALUE", featured: false,
      perks: ["12× Black Ice", "1 Universal", "2 Seasonals", "Full access"],
      eldorado: EL + "848655a6-43e0-46d8-390e-08dec868c63a" },

    { id: "522fb074", tag: "WARLORD", rankLabel: "Ranked Ready", tierKey: "platinum",
      price: 50, level: 173, blackIce: 19, universals: 1, elites: 8, operators: "50+",
      delivery: "Instant", region: "PC", badge: "RARE", featured: false,
      perks: ["19× Black Ice", "8 Elites", "1 Universal", "Full access"],
      eldorado: EL + "522fb074-1227-467b-a416-08decaac424b" },

    { id: "3a653f7c", tag: "OVERLORD", rankLabel: "Diamond", tierKey: "diamond",
      price: 110, level: 599, blackIce: 24, universals: 8, elites: 0, operators: "50+",
      delivery: "Instant", region: "PC", badge: "ELITE", featured: false,
      perks: ["Diamond ×1", "24× Black Ice", "8 Universals", "5 Old Pro League sets"],
      eldorado: EL + "3a653f7c-1d69-402b-80db-08dec87a97c0" },

    { id: "0f11b4fb", tag: "GLACIER", rankLabel: "Platinum", tierKey: "platinum",
      price: 105, level: 363, blackIce: 64, universals: 4, elites: 14, operators: "50+",
      delivery: "Instant", region: "PC", badge: "ELITE", featured: false,
      perks: ["64× Black Ice", "14 Elites", "4 Universals", "28 Seasonals"],
      eldorado: EL + "0f11b4fb-bbab-4d7e-c01a-08dec868c63a" },

    { id: "9b9746d1", tag: "ELDORADO", rankLabel: "Ranked Ready", tierKey: "emerald",
      price: 80, level: 120, blackIce: 12, universals: 0, elites: 0, operators: "50+",
      delivery: "1 day", region: "PC", badge: "RARE", featured: false,
      perks: ["Obsidian", "Blue Nebula", "El Dorado", "12× Black Ice", "Full access"],
      eldorado: EL + "9b9746d1-b31b-4447-2bbe-08deb7d2263f" },

    { id: "8784497c", tag: "APEX", rankLabel: "Champion", tierKey: "champion",
      price: 100, level: 172, blackIce: null, universals: 0, elites: 0, operators: "73",
      delivery: "1 day", region: "PC", badge: "ELITE", featured: false,
      perks: ["Champion", "Triple Helix", "73 Operators", "Full access"],
      eldorado: EL + "8784497c-1595-4739-f91b-08deb7d222b2" },

    { id: "f1d15013", tag: "ARSENAL", rankLabel: "Ranked Ready", tierKey: "emerald",
      price: 80, level: 258, blackIce: 28, universals: 0, elites: 7, operators: "50+",
      delivery: "1 day", region: "PC", badge: "ELITE", featured: false,
      perks: ["452+ skins", "Sanguine Arsenic", "28× Black Ice", "7 Elites"],
      eldorado: EL + "f1d15013-2551-4eee-93a5-08deb7d22420" },

    { id: "cc1c9902", tag: "SOVEREIGN", rankLabel: "Diamond ×5", tierKey: "diamond",
      price: 180, level: 283, blackIce: 30, universals: 0, elites: 20, operators: "50+",
      delivery: "1 day", region: "PC", badge: "ELITE", featured: true,
      perks: ["Diamond ×5", "Obsidian", "Blue Nebula", "Aki No Tsuru", "20 Elites", "30× Black Ice"],
      eldorado: EL + "cc1c9902-f379-42b9-563c-08deb7d221b3" },
  ];

  /* ---- DMA — R6S (FLAGSHIP) ----------------------------------------------
     We don't sell hardware — we sell the SNG DMA access for R6S as a license
     KEY. Time-based plans; the key is delivered on payment. This is the
     headline product (top precedence on the page).
     >> Edit plans/prices/build here. Prices in USD.                          */
  const DMA = {
    name: "SNG // DMA",
    game: "Rainbow Six Siege",
    status: "UNDETECTED",          // status pill copy
    build: "Y10S2",                // currently-supported game build
    updatedDays: 0,                // 0 = today (drives "updated" line)
    plans: [
      { id: "dma-1d",   label: "1 DAY",    days: 1,   price: 5,   tag: null },
      { id: "dma-7d",   label: "7 DAYS",   days: 7,   price: 15,  tag: "POPULAR" },
      { id: "dma-30d",  label: "30 DAYS",  days: 30,  price: 30,  tag: "BEST VALUE" },
    ],
    // marketing spec bullets shown in the feature matrix (label · detail)
    features: [
      { k: "Player ESP",     v: "operators · skeletons · health" },
      { k: "Gadget intel",   v: "cams · traps · drones · reinforcements" },
      { k: "2D radar",       v: "full-map live positions" },
      { k: "Aim assist",     v: "smoothed · humanized" },
      { k: "Stream-proof",   v: "clean on OBS / Discord" },
      { k: "Key-locked",     v: "one key · one rig" },
      { k: "Instant key",    v: "delivered the moment you pay" },
      { k: "External read",  v: "second-PC DMA · zero injection" },
    ],
  };
  // Per-day reference price (for the "/day" tag on plan cards). Lifetime omits it.
  DMA.plans.forEach(function (p) { p.perDay = p.days ? p.price / p.days : null; });

  /* ---- "Why us" feature pillars ------------------------------------------ */
  const FEATURES = [
    { icon: "bolt", title: "Instant delivery", text: "Accounts dropped to your inbox in minutes, not days." },
    { icon: "shield", title: "Replacement warranty", text: "Full email access on every account — replaced or refunded if access fails on arrival." },
    { icon: "ghost", title: "100% private", text: "Stealth boosting, VPN-matched, never linked to you." },
    { icon: "headset", title: "24/7 support", text: "Real humans on Discord, average reply under 4 minutes." },
  ];

  /* ---- Live stat counters (SAMPLE) --------------------------------------- */
  const STATS = [
    { value: 11200, suffix: "+", label: "orders completed" },
    { value: 4.9, suffix: "/5", label: "rating over 2,300 reviews", decimals: 1 },
    { value: 38, suffix: "k", label: "divisions boosted" },
    { value: 9, suffix: "min", label: "avg. delivery time" },
  ];

  window.SNG = {
    CURRENCY, price, DISCORD,
    TIERS, STEPS,
    BOOST_OPTIONS, boostQuote,
    DMA, ACCOUNTS, FEATURES, STATS,
  };
})();
