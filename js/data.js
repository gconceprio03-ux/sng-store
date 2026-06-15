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
  const CURRENCY = { symbol: "€", code: "EUR", position: "prefix" };

  function price(n) {
    const v = Math.round(Number(n));
    const s = v.toLocaleString("en-US");
    return CURRENCY.position === "prefix"
      ? CURRENCY.symbol + s
      : s + CURRENCY.symbol;
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
    { key: "platinum",  name: "Platinum",  color: "#37C3B8", divisions: 5 },
    { key: "emerald",   name: "Emerald",   color: "#2ED17A", divisions: 5 },
    { key: "diamond",   name: "Diamond",   color: "#6FD3FF", divisions: 5 },
    { key: "champion",  name: "Champion",  color: "#FF4D6D", divisions: 1 },
  ];

  // Per-division boost price (in CURRENCY units). Rises steeply with tier:
  // higher elo = harder = pricier per division. Champion is a flat apex jump.
  const PER_DIVISION = {
    copper: 2, bronze: 3, silver: 4, gold: 6,
    platinum: 9, emerald: 14, diamond: 22, champion: 70,
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

  /* ---- Accounts catalog (SAMPLE) ------------------------------------------
     Replace with your real stock. `rankId` references STEPS[].label.          */
  const ACCOUNTS = [
    {
      id: "acc-dia-01", tag: "PHANTOM-DIA", rankLabel: "Diamond III",
      tierKey: "diamond", price: 79, level: 312, kd: 1.84,
      region: "EU", operators: 68, alphaPacks: 12, mmr: 4120,
      badge: "RARE", featured: true,
      perks: ["Full email access", "Original owner", "Rare Black Ice", "No bans"],
    },
    {
      id: "acc-champ-01", tag: "APEX-CHAMP", rankLabel: "Champion",
      tierKey: "champion", price: 159, level: 540, kd: 2.31,
      region: "EU", operators: 74, alphaPacks: 31, mmr: 5340,
      badge: "ELITE", featured: true,
      perks: ["Full email access", "Champion charm Y6", "20+ Elites", "No bans"],
    },
    {
      id: "acc-plat-01", tag: "GHOST-PLAT", rankLabel: "Platinum II",
      tierKey: "platinum", price: 45, level: 207, kd: 1.42,
      region: "EU", operators: 61, alphaPacks: 6, mmr: 3450,
      badge: "VALUE", featured: true,
      perks: ["Full email access", "Original owner", "5 Elites", "No bans"],
    },
    {
      id: "acc-emer-01", tag: "VIPER-EMER", rankLabel: "Emerald IV",
      tierKey: "emerald", price: 65, level: 254, kd: 1.61,
      region: "NA", operators: 64, alphaPacks: 9, mmr: 3780,
      badge: "RARE", featured: false,
      perks: ["Full email access", "Original owner", "Rare seasonals", "No bans"],
    },
    {
      id: "acc-dia-02", tag: "ONYX-DIA", rankLabel: "Diamond I",
      tierKey: "diamond", price: 89, level: 388, kd: 1.97,
      region: "EU", operators: 70, alphaPacks: 17, mmr: 4480,
      badge: "RARE", featured: false,
      perks: ["Full email access", "Pro League sets", "10+ Elites", "No bans"],
    },
    {
      id: "acc-gold-01", tag: "RECON-GOLD", rankLabel: "Gold I",
      tierKey: "gold", price: 25, level: 142, kd: 1.18,
      region: "EU", operators: 55, alphaPacks: 3, mmr: 3050,
      badge: "VALUE", featured: false,
      perks: ["Full email access", "Original owner", "Starter Elites", "No bans"],
    },
    {
      id: "acc-plat-02", tag: "FROST-PLAT", rankLabel: "Platinum IV",
      tierKey: "platinum", price: 39, level: 176, kd: 1.33,
      region: "NA", operators: 58, alphaPacks: 4, mmr: 3260,
      badge: "VALUE", featured: false,
      perks: ["Full email access", "Original owner", "3 Elites", "No bans"],
    },
    {
      id: "acc-champ-02", tag: "ZERO-CHAMP", rankLabel: "Champion",
      tierKey: "champion", price: 179, level: 612, kd: 2.55,
      region: "EU", operators: 74, alphaPacks: 44, mmr: 5610,
      badge: "ELITE", featured: false,
      perks: ["Full email access", "Top-500 history", "30+ Elites", "No bans"],
    },
    {
      id: "acc-emer-02", tag: "NOVA-EMER", rankLabel: "Emerald II",
      tierKey: "emerald", price: 69, level: 281, kd: 1.72,
      region: "EU", operators: 66, alphaPacks: 11, mmr: 3920,
      badge: "RARE", featured: false,
      perks: ["Full email access", "Original owner", "Black Ice x2", "No bans"],
    },
  ];

  /* ---- "Why us" feature pillars ------------------------------------------ */
  const FEATURES = [
    { icon: "bolt", title: "Instant delivery", text: "Accounts dropped to your inbox in minutes, not days." },
    { icon: "shield", title: "Lifetime warranty", text: "Full email access on every account, or your money back." },
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
    CURRENCY, price,
    TIERS, STEPS,
    BOOST_OPTIONS, boostQuote,
    ACCOUNTS, FEATURES, STATS,
  };
})();
