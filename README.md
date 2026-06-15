# SNG — R6 Ranked Accounts & Boosting

Sito vetrina + checkout in stile **neon cyber / glitch** per la vendita di account Rainbow Six Siege e servizi di boosting. Single-page, animazioni pesanti (smooth-scroll, cursore reticolo, effetto *breach* su canvas, emblemi di rank procedurali, calcolatore boost interattivo).

Brand: **SNG** · Tagline: *Rank is a system. We breach it.*

---

## Come aprirlo

**Modo veloce:** doppio clic su `index.html` (si apre nel browser).

**Modo consigliato (animazioni 100% fluide):** servilo da un piccolo server locale, così le librerie e i font caricano senza limiti di `file://`:

```bash
# dentro la cartella sng-store
python -m http.server 5173
# poi apri  http://localhost:5173
```

> Serve connessione internet: GSAP, Lenis e i Google Fonts arrivano da CDN. Se vuoi farlo girare offline, scarica quei file in `js/lib/` e cambia i `<script>`/`<link>` in `index.html`.

---

## Struttura

```
index.html        markup di tutte le 14 sezioni
css/styles.css    sistema neon completo (palette, glow, scanline, componenti)
js/
  data.js         catalogo account, scala rank R6, motore prezzi boost  ← QUI cambi i prezzi
  cart.js         stato carrello + persistenza localStorage
  emblem.js       emblema di rank procedurale (SVG) usato ovunque
  main.js         tutto il comportamento (boot, cursore, calc, checkout, breach FX)
assets/           favicon.svg, og.svg
```

## Cosa modificare per andare live

1. **Prezzi e catalogo** → `js/data.js`
   - `ACCOUNTS` = gli account in vendita (cerca `SAMPLE`, sono di esempio).
   - `PER_DIVISION` = prezzo per divisione del boosting per ogni tier.
   - `BOOST_OPTIONS` = add-on (duo, priority, ecc.).
   - `CURRENCY` = valuta (default `€`). Cambi simbolo/codice in un punto solo.

2. **Valuta**: è impostata su EUR. Per CHF/USD cambia l'oggetto `CURRENCY` in cima a `data.js`.

3. **Pagamento reale** — **importante**: il checkout attuale è un **flusso DEMO** (nessun addebito vero). Per incassare davvero devi collegare un gateway. Nella funzione `co-confirm` (`js/main.js`) sostituisci la chiamata locale con la redirect/SDK del provider (es. checkout crypto, Stripe, ecc.). ⚠️ Nota onesta: la vendita di account e il boosting violano i ToS di Ubisoft, e i processori "mainstream" (Stripe/PayPal) di norma **vietano** questa categoria e possono chiudere l'account. Realisticamente userai un gateway crypto o un funnel manuale. Codici sconto demo: `BREACH10`, `SNG20`, `CLUTCH`.

4. **Link reali**: Discord/TikTok/Instagram nel footer e nella schermata di successo sono segnaposto (`href="#"`).

5. **Testi/claim**: warranty, "instant delivery" ecc. sono copy di marketing — adattali a ciò che garantisci davvero.

## Deploy (gratis)

- **Netlify Drop**: trascina la cartella su https://app.netlify.com/drop → online in 30s.
- **Vercel** / **Cloudflare Pages**: collega la cartella, build command vuoto, output = root.
- **GitHub Pages**: push su un repo, Settings → Pages → branch root.

## Accessibilità & performance

- Rispetta `prefers-reduced-motion` (disattiva glitch, matrix-rain, cursore custom, breach → fade).
- Focus da tastiera visibile, contenuti visibili anche se il JS non carica.
- Matrix-rain limitato a ~14fps; emblemi SVG cache-friendly.

## Calibrazione effetti

Stile attuale: **premium / professionale**, motion discreto. Tutto si disattiva con `prefers-reduced-motion` e si dosa da pochi punti:

| Effetto | Dove | Note |
|---|---|---|
| Spina dorsale (elica full-screen che ruota su scroll) | `css/styles.css` → `.spine` | `opacity` 0.17 + `mask` gutter centrale |
| Velocità rotazione spina | `js/main.js` → `initSpine`, `Math.PI * 12` | più basso = ruota meno |
| Sfondo shader plasma WebGL | `js/shaderbg.js` → `col *= 0.46` | più basso = più scuro |
| Alone hero | `css/styles.css` → `.hero-halo` (`opacity` 0.55) | — |
| Breach reveal (add al carrello / acquisto) | `js/main.js` → `runBreach` | pulito: bagliore + anelli + emblema |
| Card 3D tilt + spotlight | `js/main.js` (accountCard) / classe `.spot` | micro-interazione hover |
| Audio UI | tasto ♪ nell'HUD | OFF di default |
| Easter egg | Konami ↑↑↓↓←→←→ B A | sblocca promo `GODMODE` |

**Rimossi per un look professionale:** sparatoria nel preloader, HUD radar/telemetria, badge rotante, toast "acquisto live", pioggia matrix, scanline CRT, glitch lampeggiante, skew della pagina. Palette viola/ciano, magenta solo per Champion.

---

*Generato come progetto standalone, separato da ALPAW. Rainbow Six Siege è un marchio di Ubisoft Entertainment; SNG non è affiliato a Ubisoft.*
