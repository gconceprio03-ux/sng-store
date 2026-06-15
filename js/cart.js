/* ============================================================================
   SNG — CART STATE
   Headless cart: state + persistence only. No DOM here — the drawer/checkout
   UI lives in main.js and listens to the "sng:cart" event.

   Item shape:
     { key, kind: "account"|"boost", title, subtitle, price, qty, unique }
   - key     : stable id (account id, or a generated boost key)
   - unique  : true => qty is capped at 1 (you can't buy the same account twice)
   ========================================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "sng_cart_v1";

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* storage full / disabled — cart simply won't persist */
    }
  }

  let items = load();

  function emit(detail) {
    save(items);
    window.dispatchEvent(new CustomEvent("sng:cart", { detail: detail || {} }));
  }

  const Cart = {
    get items() {
      return items.slice();
    },

    count() {
      return items.reduce((n, it) => n + it.qty, 0);
    },

    subtotal() {
      return items.reduce((s, it) => s + it.price * it.qty, 0);
    },

    has(key) {
      return items.some((it) => it.key === key);
    },

    add(item) {
      const existing = items.find((it) => it.key === item.key);
      if (existing) {
        if (existing.unique) {
          emit({ type: "duplicate", key: item.key });
          return false;
        }
        existing.qty += item.qty || 1;
      } else {
        items.push({
          key: item.key,
          kind: item.kind || "account",
          title: item.title,
          subtitle: item.subtitle || "",
          price: Number(item.price) || 0,
          qty: item.qty || 1,
          unique: item.unique !== false, // default unique
          meta: item.meta || null,
        });
      }
      emit({ type: "add", key: item.key });
      return true;
    },

    setQty(key, qty) {
      const it = items.find((x) => x.key === key);
      if (!it) return;
      it.qty = Math.max(1, Math.min(99, Math.round(qty)));
      if (it.unique) it.qty = 1;
      emit({ type: "qty", key: key });
    },

    remove(key) {
      const before = items.length;
      items = items.filter((it) => it.key !== key);
      if (items.length !== before) emit({ type: "remove", key: key });
    },

    clear() {
      items = [];
      emit({ type: "clear" });
    },
  };

  window.SNGCart = Cart;
})();
