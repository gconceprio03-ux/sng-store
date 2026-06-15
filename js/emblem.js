/* ============================================================================
   SNG — PROCEDURAL RANK EMBLEM
   One function renders every rank sigil on the site (cards, calculator, ladder,
   success screen). Faceted hexagonal gem + power-ring + neon bloom.
   Higher tiers = brighter rim, fuller ring, hotter hue.

   API:  SNGEmblem.draw(tierKey, { size, energy(0..1), ring(0..1), color })
         -> SVG markup string
   ========================================================================== */
(function () {
  "use strict";

  // Metal-hue ramp keyed to tier (Copper warm -> Diamond cyan -> Champion magenta)
  const RAMP = {
    copper:   "#B8703A",
    bronze:   "#CD7F45",
    silver:   "#AEB9C7",
    gold:     "#F0C24B",
    platinum: "#37C3B8",
    emerald:  "#2ED17A",
    diamond:  "#00E5FF",
    champion: "#FF2D6E",
  };
  const ORDER = ["copper","bronze","silver","gold","platinum","emerald","diamond","champion"];

  let _uid = 0;

  function hexPoints(cx, cy, r) {
    // pointy-top hexagon, first vertex straight up
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (-90 + i * 60);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }
  function toStr(pts) {
    return pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
  }
  function shade(hex, amt) {
    // amt > 0 lighten toward white, amt < 0 darken toward black
    const c = hex.replace("#", "");
    const n = parseInt(c.length === 3 ? c.replace(/(.)/g, "$1$1") : c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { const k = 1 + amt; r *= k; g *= k; b *= k; }
    return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
  }

  function draw(tierKey, opts) {
    opts = opts || {};
    const color = opts.color || RAMP[tierKey] || RAMP.copper;
    const idx = Math.max(0, ORDER.indexOf(tierKey));
    const size = opts.size || 120;
    const energy = opts.energy == null ? 0.7 : Math.max(0, Math.min(1, opts.energy));
    const ringFill = opts.ring == null ? (0.32 + idx * 0.095) : Math.max(0, Math.min(1, opts.ring));
    const uid = "em" + (_uid++);
    const blur = (1.1 + energy * 4.6).toFixed(2);

    const cx = 50, cy = 52;
    const outer = hexPoints(cx, cy, 44);
    const inner = hexPoints(cx, cy, 27);
    const core = hexPoints(cx, cy, 15);

    // Beveled gem facets between outer and inner ring (alternating lit/dark)
    let facets = "";
    for (let i = 0; i < 6; i++) {
      const a = outer[i], b = outer[(i + 1) % 6], c = inner[(i + 1) % 6], d = inner[i];
      const lit = i % 2 === 0;
      const fill = lit ? shade(color, 0.16 + energy * 0.12) : shade(color, -0.46);
      facets += '<polygon points="' + toStr([a, b, c, d]) +
        '" fill="' + fill + '" stroke="' + shade(color, -0.62) + '" stroke-width="0.5"/>';
    }

    // For higher tiers, add fine inner facet edges (more "cut" complexity)
    let edges = "";
    if (idx >= 3) {
      for (let i = 0; i < 6; i++) {
        edges += '<line x1="' + inner[i][0].toFixed(2) + '" y1="' + inner[i][1].toFixed(2) +
          '" x2="' + core[i][0].toFixed(2) + '" y2="' + core[i][1].toFixed(2) +
          '" stroke="' + shade(color, 0.35) + '" stroke-width="0.5" opacity="0.55"/>';
      }
    }

    const r = 48.5, circ = 2 * Math.PI * r;
    const ringDash = circ.toFixed(2);
    const ringOff = (circ * (1 - ringFill)).toFixed(2);

    return (
      '<svg viewBox="0 0 100 108" width="' + size + '" height="' + Math.round(size * 1.08) +
      '" class="emblem" data-tier="' + tierKey + '" role="img" aria-label="' + tierKey + ' rank emblem" focusable="false">' +
        "<defs>" +
          '<radialGradient id="' + uid + '-glow" cx="50%" cy="46%" r="62%">' +
            '<stop offset="0%" stop-color="' + color + '" stop-opacity="' + (0.55 + energy * 0.4).toFixed(2) + '"/>' +
            '<stop offset="55%" stop-color="' + color + '" stop-opacity="0.14"/>' +
            '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
          "</radialGradient>" +
          '<linearGradient id="' + uid + '-metal" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="' + shade(color, 0.42) + '"/>' +
            '<stop offset="50%" stop-color="' + color + '"/>' +
            '<stop offset="100%" stop-color="' + shade(color, -0.52) + '"/>' +
          "</linearGradient>" +
          '<filter id="' + uid + '-bloom" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="' + blur + '" result="b"/>' +
            "<feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge>" +
          "</filter>" +
        "</defs>" +
        '<circle cx="50" cy="52" r="47" fill="url(#' + uid + '-glow)" opacity="' + (0.5 + energy * 0.5).toFixed(2) + '"/>' +
        '<g filter="url(#' + uid + '-bloom)">' +
          // power ring (track + fill)
          '<circle cx="50" cy="52" r="' + r + '" fill="none" stroke="' + shade(color, -0.58) + '" stroke-width="1.4" opacity="0.45"/>' +
          '<circle cx="50" cy="52" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"' +
            ' stroke-dasharray="' + ringDash + '" stroke-dashoffset="' + ringOff + '" transform="rotate(-90 50 52)"/>' +
          // body
          '<polygon points="' + toStr(outer) + '" fill="url(#' + uid + '-metal)" stroke="' + shade(color, 0.45) + '" stroke-width="1.1"/>' +
          facets +
          edges +
          // core + R6-style double chevron
          '<polygon points="' + toStr(core) + '" fill="' + shade(color, -0.32) + '" stroke="' + shade(color, 0.5) + '" stroke-width="0.8"/>' +
          '<path d="M42,48 L50,54 L58,48" fill="none" stroke="' + shade(color, 0.62) + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M42,42 L50,48 L58,42" fill="none" stroke="' + shade(color, 0.3) + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>' +
          // top specular highlight
          '<polygon points="' + toStr([outer[5], outer[0], inner[0], inner[5]]) + '" fill="#ffffff" opacity="' + (0.08 + energy * 0.08).toFixed(2) + '"/>' +
        "</g>" +
      "</svg>"
    );
  }

  window.SNGEmblem = { draw: draw, RAMP: RAMP, ORDER: ORDER, shade: shade };
})();
