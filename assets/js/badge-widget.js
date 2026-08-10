/* ============================================================
   PreuveIA — Widget de badge autonome (intégrable sur tout site)
   Usage :
     <div class="preuveia-badge"
          data-code="PIA-XXXX-XXXX-XXXX"
          data-titre="Ma formation"
          data-proprietaire="Claire Fontaine"
          data-base="https://preuveia.fr/"></div>
     <script src="badge-widget.js"></script>
   Aucune dépendance. Le rendu est un SVG + un lien de vérification.
   ============================================================ */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function svg(opts) {
    var code = String(opts.code || 'PIA-XXXX-XXXX-XXXX').toUpperCase();
    var titre = opts.titre || '';
    var owner = opts.proprietaire || '';
    var w = 300, h = 128;
    var L = [];
    L.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Badge Authenticité vérifiée PreuveIA">');
    L.push('<defs><linearGradient id="pvw-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef1f6"/></linearGradient></defs>');
    L.push('<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="18" fill="url(#pvw-bg)" stroke="#d7dce4" stroke-width="2"/>');
    L.push('<path d="M52 28 L92 40 V72 C92 96 74 106 52 112 C30 106 12 96 12 72 V40 Z" fill="#0e9f6e"/>');
    L.push('<path d="M36 70 L48 82 L70 56" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>');
    L.push('<text x="108" y="44" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#111827">Authenticité vérifiée</text>');
    L.push('<text x="108" y="64" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#5b6472">' + esc(titre) + (owner ? ' — ' + esc(owner) : '') + '</text>');
    L.push('<text x="108" y="86" font-family="Courier New, monospace" font-size="12" font-weight="bold" letter-spacing="1.5" fill="#1649c4">' + esc(code) + '</text>');
    L.push('<text x="108" y="104" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#5b6472">Vérifié par PreuveIA — preuveia.fr</text>');
    L.push('</svg>');
    return L.join('\n');
  }

  function render(opts) {
    var base = opts.base || '';
    var url = base + 'verification.html?code=' + encodeURIComponent(opts.code);
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener" title="Vérifier ce badge sur PreuveIA" style="text-decoration:none;display:inline-block">' +
      svg(opts) + '</a>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    var nodes = document.querySelectorAll('.preuveia-badge');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var opts = {
        code: n.getAttribute('data-code'),
        titre: n.getAttribute('data-titre'),
        proprietaire: n.getAttribute('data-proprietaire'),
        base: n.getAttribute('data-base') || ''
      };
      if (!opts.code) continue;
      var wrap = document.createElement('span');
      wrap.innerHTML = render(opts);
      n.parentNode.replaceChild(wrap.firstChild, n);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  global.PreuveBadge = { render: render, svg: svg, init: init };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { render: render, svg: svg };
  }
})(typeof window !== 'undefined' ? window : globalThis);
