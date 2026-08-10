/* ============================================================
   PreuveIA — Moteur de codes de badge
   Format : PIA-XXXX-XXXX-XXXX
   - Alphabet sans ambiguïté (exclut I, O, 0, 1)
   - 3e groupe = checksum dérivé des 8 premiers caractères
   - validCode(generateCode()) doit TOUJOURS être true (testé)
   ============================================================ */
(function (global) {
  'use strict';

  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 caractères
  var PREFIX = 'PIA';
  var GROUP_LEN = 4;
  var REGEX = /^PIA-([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})$/;

  function randInt(max) {
    // max < 2^32 ; préfère crypto quand disponible
    if (typeof global.crypto !== 'undefined' && global.crypto.getRandomValues) {
      var buf = new Uint32Array(1);
      global.crypto.getRandomValues(buf);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function randGroup() {
    var out = '';
    for (var i = 0; i < GROUP_LEN; i++) out += ALPHABET[randInt(ALPHABET.length)];
    return out;
  }

  /** Checksum FNV-1a 32 bits → 4 caractères (5 bits chacun). */
  function checksum(parts) {
    var h = 0x811c9dc5;
    for (var i = 0; i < parts.length; i++) {
      h ^= parts.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h = h >>> 0;
    var out = '';
    for (var j = 0; j < GROUP_LEN; j++) {
      out += ALPHABET[(h >>> (j * 5)) & 31];
    }
    return out;
  }

  var Badge = {
    ALPHABET: ALPHABET,
    REGEX_SOURCE: REGEX.source,

    /** Génère un code valide : PIA-XXXX-XXXX-XXXX. */
    generateCode: function () {
      var g1 = randGroup();
      var g2 = randGroup();
      var g3 = checksum(g1 + g2);
      return PREFIX + '-' + g1 + '-' + g2 + '-' + g3;
    },

    /** Valide format + checksum. */
    validCode: function (code) {
      if (typeof code !== 'string') return false;
      var m = REGEX.exec(code.trim().toUpperCase());
      if (!m) return false;
      return checksum(m[1] + m[2]) === m[3];
    },

    /** URL publique de vérification pour un code. */
    verificationUrl: function (code, base) {
      base = base || '';
      return base + 'verification.html?code=' + encodeURIComponent(code);
    },

    /** SVG du badge « Authenticité vérifiée ». */
    svg: function (opts) {
      opts = opts || {};
      var code = (opts.code || 'PIA-XXXX-XXXX-XXXX').toUpperCase();
      var owner = opts.owner || '';
      var title = opts.title || '';
      var w = 300, h = 128;
      var esc = function (s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      };
      var lines = [];
      lines.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Badge Authenticité vérifiée PreuveIA">');
      lines.push('  <defs><linearGradient id="pv-bg" x1="0" y1="0" x2="1" y2="1">');
      lines.push('    <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef1f6"/>');
      lines.push('  </linearGradient></defs>');
      lines.push('  <rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="18" fill="url(#pv-bg)" stroke="#d7dce4" stroke-width="2"/>');
      // bouclier
      lines.push('  <path d="M52 28 L92 40 V72 C92 96 74 106 52 112 C30 106 12 96 12 72 V40 Z" fill="#0e9f6e"/>');
      lines.push('  <path d="M36 70 L48 82 L70 56" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>');
      // textes
      lines.push('  <text x="108" y="44" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#111827">Authenticité vérifiée</text>');
      lines.push('  <text x="108" y="64" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#5b6472">' + esc(title || 'Formation') + (owner ? ' — ' + esc(owner) : '') + '</text>');
      lines.push('  <text x="108" y="86" font-family="Courier New, monospace" font-size="12" font-weight="bold" letter-spacing="1.5" fill="#1649c4">' + esc(code) + '</text>');
      lines.push('  <text x="108" y="104" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#5b6472">Vérifié par PreuveIA — preuveia.fr</text>');
      lines.push('</svg>');
      return lines.join('\n');
    }
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Badge = Badge;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Badge;
  }
})(typeof window !== 'undefined' ? window : globalThis);
