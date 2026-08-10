/* ============================================================
   PreuveIA — Mini-générateur PDF (vanilla, zéro dépendance)
   PDF 1.4, police Helvetica (WinAnsiEncoding / CP1252).
   PRINCIPE : chaque objet est ajouté dans un tableau `parts` ;
   les offsets xref sont calculés sur les longueurs cumulées des
   parties (1 caractère = 1 octet en Latin-1), donc
   startxref === indexOf('xref\n') sur le fichier final (testé).
   ============================================================ */
(function (global) {
  'use strict';

  // Correspondances CP1252 pour les caractères français courants
  var CP1252 = {
    '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85,
    '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A,
    '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92,
    '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
    '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C,
    '\u017E': 0x9E, '\u0178': 0x9F,
    '\u00A0': 0xA0, '\u00A1': 0xA1, '\u00A2': 0xA2, '\u00A3': 0xA3, '\u00A4': 0xA4,
    '\u00A5': 0xA5, '\u00A6': 0xA6, '\u00A7': 0xA7, '\u00A8': 0xA8, '\u00A9': 0xA9,
    '\u00AA': 0xAA, '\u00AB': 0xAB, '\u00AC': 0xAC, '\u00AD': 0xAD, '\u00AE': 0xAE,
    '\u00AF': 0xAF, '\u00B0': 0xB0, '\u00B1': 0xB1, '\u00B2': 0xB2, '\u00B3': 0xB3,
    '\u00B4': 0xB4, '\u00B5': 0xB5, '\u00B6': 0xB6, '\u00B7': 0xB7, '\u00B8': 0xB8,
    '\u00B9': 0xB9, '\u00BA': 0xBA, '\u00BB': 0xBB, '\u00BC': 0xBC, '\u00BD': 0xBD,
    '\u00BE': 0xBE, '\u00BF': 0xBF,
    '\u00C0': 0xC0, '\u00C1': 0xC1, '\u00C2': 0xC2, '\u00C3': 0xC3, '\u00C4': 0xC4,
    '\u00C5': 0xC5, '\u00C6': 0xC6, '\u00C7': 0xC7, '\u00C8': 0xC8, '\u00C9': 0xC9,
    '\u00CA': 0xCA, '\u00CB': 0xCB, '\u00CC': 0xCC, '\u00CD': 0xCD, '\u00CE': 0xCE,
    '\u00CF': 0xCF, '\u00D0': 0xD0, '\u00D1': 0xD1, '\u00D2': 0xD2, '\u00D3': 0xD3,
    '\u00D4': 0xD4, '\u00D5': 0xD5, '\u00D6': 0xD6, '\u00D7': 0xD7, '\u00D8': 0xD8,
    '\u00D9': 0xD9, '\u00DA': 0xDA, '\u00DB': 0xDB, '\u00DC': 0xDC, '\u00DD': 0xDD,
    '\u00DE': 0xDE, '\u00DF': 0xDF,
    '\u00E0': 0xE0, '\u00E1': 0xE1, '\u00E2': 0xE2, '\u00E3': 0xE3, '\u00E4': 0xE4,
    '\u00E5': 0xE5, '\u00E6': 0xE6, '\u00E7': 0xE7, '\u00E8': 0xE8, '\u00E9': 0xE9,
    '\u00EA': 0xEA, '\u00EB': 0xEB, '\u00EC': 0xEC, '\u00ED': 0xED, '\u00EE': 0xEE,
    '\u00EF': 0xEF, '\u00F0': 0xF0, '\u00F1': 0xF1, '\u00F2': 0xF2, '\u00F3': 0xF3,
    '\u00F4': 0xF4, '\u00F5': 0xF5, '\u00F6': 0xF6, '\u00F7': 0xF7, '\u00F8': 0xF8,
    '\u00F9': 0xF9, '\u00FA': 0xFA, '\u00FB': 0xFB, '\u00FC': 0xFC, '\u00FD': 0xFD,
    '\u00FE': 0xFE, '\u00FF': 0xFF
  };

  function latin1Char(ch) {
    var c = ch.charCodeAt(0);
    if (c < 0x80) return ch;
    var b = CP1252[ch];
    if (b === undefined) return '?';
    return String.fromCharCode(b);
  }

  /** Convertit une chaîne Unicode en chaîne Latin-1 (1 char = 1 octet). */
  function latin1(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) out += latin1Char(s.charAt(i));
    return out;
  }

  /** Échappe une chaîne pour un littéral PDF entre parenthèses. */
  function esc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  var W = 595.28, H = 841.89, M = 50;

  var COULEURS = {
    green: '0.055 0.624 0.431',
    blue: '0.086 0.286 0.769',
    amber: '0.706 0.325 0.035',
    red: '0.725 0.110 0.110',
    ink: '0.067 0.094 0.153',
    muted: '0.357 0.392 0.447',
    track: '0.902 0.890 0.863'
  };

  function contentStream(opts) {
    var L = [];
    var y = H - M - 40;

    // En-tête
    L.push("BT /F2 22 Tf 0.067 0.094 0.153 rg 50 " + y.toFixed(2) + " Td (PreuveIA - Rapport d\\'authenticité) Tj ET");
    y -= 26;
    L.push('BT /F1 10 Tf 0.357 0.392 0.447 rg 50 ' + y.toFixed(2) + ' Td (' + esc(opts.dateLabel || '') + '  |  Document généré automatiquement) Tj ET');
    y -= 40;

    // Bloc contenu analysé
    L.push('BT /F2 13 Tf 0.067 0.094 0.153 rg 50 ' + y.toFixed(2) + ' Td (Contenu analysé) Tj ET');
    y -= 20;
    L.push('BT /F1 11 Tf 0.067 0.094 0.153 rg 50 ' + y.toFixed(2) + ' Td (Titre : ' + esc(opts.titre || '—') + ') Tj ET');
    y -= 17;
    L.push('BT /F1 11 Tf 0.067 0.094 0.153 rg 50 ' + y.toFixed(2) + ' Td (Auteur / créateur : ' + esc(opts.auteur || '—') + ') Tj ET');
    y -= 40;

    // Score + verdict
    var col = COULEURS[opts.verdictClasse] || COULEURS.green;
    L.push('BT /F2 40 Tf ' + col + ' rg 50 ' + y.toFixed(2) + ' Td (' + opts.score + '/100) Tj ET');
    L.push('BT /F2 15 Tf ' + col + ' rg 170 ' + (y - 8).toFixed(2) + ' Td (' + esc(opts.verdict || '') + ') Tj ET');
    y -= 46;

    // Barre de score
    L.push('q ' + COULEURS.track + ' rg 50 ' + y.toFixed(2) + ' 200 10 re f Q');
    L.push('q ' + col + ' rg 50 ' + y.toFixed(2) + ' ' + (200 * (opts.score / 100)).toFixed(2) + ' 10 re f Q');
    y -= 36;

    // Métriques
    L.push('BT /F2 13 Tf 0.067 0.094 0.153 rg 50 ' + y.toFixed(2) + ' Td (Détail des indicateurs) Tj ET');
    y -= 22;
    (opts.metriques || []).forEach(function (m) {
      if (y < 140) return;
      L.push('BT /F1 10.5 Tf 0.067 0.094 0.153 rg 50 ' + y.toFixed(2) + ' Td (' + esc(m.nom) + ') Tj ET');
      L.push('BT /F1 10.5 Tf 0.357 0.392 0.447 rg 280 ' + y.toFixed(2) + ' Td (' + m.valeur + '/100) Tj ET');
      L.push('q ' + COULEURS.track + ' rg 50 ' + (y - 9).toFixed(2) + ' 280 6 re f Q');
      var mc = COULEURS[m.couleur] || COULEURS.blue;
      L.push('q ' + mc + ' rg 50 ' + (y - 9).toFixed(2) + ' ' + (280 * (m.valeur / 100)).toFixed(2) + ' 6 re f Q');
      y -= 26;
    });
    y -= 30;

    // Badge + vérification
    L.push("BT /F2 13 Tf 0.067 0.094 0.153 rg 50 " + y.toFixed(2) + " Td (Badge d\\'authenticité) Tj ET");
    y -= 20;
    L.push('BT /F1 11 Tf 0.086 0.286 0.769 rg 50 ' + y.toFixed(2) + ' Td (Code : ' + esc(opts.code || '—') + ') Tj ET');
    y -= 17;
    L.push('BT /F1 10 Tf 0.357 0.392 0.447 rg 50 ' + y.toFixed(2) + ' Td (Vérification publique : ' + esc(opts.urlVerification || '') + ') Tj ET');
    y -= 30;

    // Note
    L.push("BT /F1 8.5 Tf 0.357 0.392 0.447 rg 50 " + y.toFixed(2) + " Td (Rapport de démonstration généré localement. En production, l\\'analyse combine cette heuristique) Tj ET");
    y -= 12;
    L.push("BT /F1 8.5 Tf 0.357 0.392 0.447 rg 50 " + y.toFixed(2) + " Td (stylistique avec des API de détection IA \\(GPTZero, Copyleaks, classifieur maison via api.preuveia.fr\\) .) Tj ET");

    return L.join('\n') + '\n';
  }

  /**
   * Construit le PDF complet. Retourne { bytes: Uint8Array, texte: string latin-1 }.
   */
  function buildRapport(opts) {
    opts = opts || {};
    var metriques = opts.metriques || [];
    var content = contentStream(opts);
    var parts = [];

    parts.push('%PDF-1.4\n');
    var offsets = [];
    function push(s) { offsets.push(parts.join('').length); parts.push(s); }

    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
    push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
    push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');
    var contentLatin1 = latin1(content);
    push('6 0 obj\n<< /Length ' + contentLatin1.length + ' >>\nstream\n' + contentLatin1 + 'endstream\nendobj\n');

    var xrefPos = parts.join('').length;
    var count = offsets.length + 1;
    var xref = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (var i = 0; i < offsets.length; i++) {
      xref += ('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n';
    }
    parts.push(xref);
    parts.push('trailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n');

    var texte = parts.join('');
    var bytes = new Uint8Array(texte.length);
    for (var j = 0; j < texte.length; j++) bytes[j] = texte.charCodeAt(j) & 0xFF;
    return { bytes: bytes, texte: texte, startxref: xrefPos };
  }

  var Pdf = {
    buildRapport: buildRapport,
    latin1: latin1
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Pdf = Pdf;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pdf;
  }
})(typeof window !== 'undefined' ? window : globalThis);
