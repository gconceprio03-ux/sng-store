/* ============================================================================
   SNG — ACCOUNT ARTWORK
   Original, procedurally-composed neon "tactical scene" per account card.
   No third-party / Ubisoft assets — all generated SVG (glow, perspective grid,
   smoke, the procedural rank emblem, embers, a targeting reticle). Tier-colored,
   seeded per account so every card looks different.

   API:  SNGArt.scene(tierKey, seed) -> SVG markup string
   ========================================================================== */
(function () {
  "use strict";

  function hash(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function rgba(hex, a) {
    var c = hex.replace("#", ""); if (c.length === 3) c = c.replace(/(.)/g, "$1$1");
    var n = parseInt(c, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function scene(tierKey, seed) {
    var color = (window.SNGEmblem && SNGEmblem.RAMP[tierKey]) || "#00e5ff";
    var rnd = rng(hash(String(seed || tierKey)));
    var uid = "art" + Math.floor(rnd() * 1e6);

    // perspective grid floor (vanishing point near top-center)
    var vpx = 160, vpy = 48, grid = "";
    for (var x = -60; x <= 380; x += 38)
      grid += '<line x1="' + x + '" y1="150" x2="' + vpx + '" y2="' + vpy + '" stroke="' + rgba("#00e5ff", 0.10) + '" stroke-width="0.6"/>';
    var ys = [150, 129, 112, 98, 87, 79, 73];
    for (var i = 0; i < ys.length; i++)
      grid += '<line x1="0" y1="' + ys[i] + '" x2="320" y2="' + ys[i] + '" stroke="' + rgba("#00e5ff", 0.07) + '" stroke-width="0.6"/>';

    // drifting smoke (tier / violet / cyan)
    var smoke = "", pal = [color, "#b026ff", "#00e5ff"];
    for (var s = 0; s < 3; s++) {
      var sx = (30 + rnd() * 260).toFixed(0), sy = (18 + rnd() * 92).toFixed(0), sr = 40 + rnd() * 48;
      smoke += '<ellipse cx="' + sx + '" cy="' + sy + '" rx="' + sr.toFixed(0) + '" ry="' + (sr * 0.66).toFixed(0) +
        '" fill="' + rgba(pal[s % 3], 0.16) + '" filter="url(#' + uid + '-b)"/>';
    }

    // embers
    var embers = "";
    for (var e = 0; e < 11; e++)
      embers += '<circle cx="' + (rnd() * 320).toFixed(0) + '" cy="' + (16 + rnd() * 124).toFixed(0) +
        '" r="' + (0.6 + rnd() * 1.7).toFixed(1) + '" fill="' + rgba(color, 0.45 + rnd() * 0.45) + '"/>';

    // targeting reticle (left or right)
    var rx = rnd() < 0.5 ? 42 : 278, ry = 36;
    var ret = '<g stroke="' + rgba("#00e5ff", 0.5) + '" stroke-width="1" fill="none">' +
      '<circle cx="' + rx + '" cy="' + ry + '" r="11"/>' +
      '<line x1="' + (rx - 16) + '" y1="' + ry + '" x2="' + (rx - 5) + '" y2="' + ry + '"/>' +
      '<line x1="' + (rx + 5) + '" y1="' + ry + '" x2="' + (rx + 16) + '" y2="' + ry + '"/>' +
      '<line x1="' + rx + '" y1="' + (ry - 16) + '" x2="' + rx + '" y2="' + (ry - 5) + '"/>' +
      '<line x1="' + rx + '" y1="' + (ry + 5) + '" x2="' + rx + '" y2="' + (ry + 16) + '"/></g>';

    // emblem focal (reuse the procedural rank emblem)
    var emblem = window.SNGEmblem ? '<g transform="translate(108,14)">' + SNGEmblem.draw(tierKey, { size: 104, energy: 1 }) + "</g>" : "";

    // corner brackets
    var br = '<g stroke="' + rgba(color, 0.6) + '" stroke-width="1.4" fill="none">' +
      '<path d="M8,8 h14 M8,8 v14"/><path d="M312,142 h-14 M312,142 v-14"/></g>';

    return '<svg class="art-svg" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<radialGradient id="' + uid + '-glow" cx="50%" cy="42%" r="62%">' +
      '<stop offset="0%" stop-color="' + rgba(color, 0.42) + '"/>' +
      '<stop offset="60%" stop-color="' + rgba(color, 0.08) + '"/>' +
      '<stop offset="100%" stop-color="' + rgba(color, 0) + '"/></radialGradient>' +
      '<filter id="' + uid + '-b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>' +
      "</defs>" +
      '<rect width="320" height="150" fill="#08061a"/>' +
      '<rect width="320" height="150" fill="url(#' + uid + '-glow)"/>' +
      grid + smoke + embers + ret + emblem + br +
      "</svg>";
  }

  window.SNGArt = { scene: scene };
})();
