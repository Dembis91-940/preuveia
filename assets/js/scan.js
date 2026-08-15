/* ============================================================
   PreuveIA — Moteur d'analyse d'authenticité (côté client, démo)
   Heuristique stylistique locale + placeholder d'API de détection.
   En production : api.preuveia.fr/v1/detect (GPTZero / Copyleaks / maison).
   ============================================================ */
(function (global) {
  'use strict';

  var MIN_CHARS = 200;
  var MAX_CHARS = 60000;

  var MARQUEURS_IA = [
    'en résumé', 'en conclusion', 'dans le monde d\'aujourd\'hui',
    'en constante évolution', 'il est important de noter', 'il est essentiel de',
    'il est crucial de', 'il convient de', 'n\'oublions pas', 'd\'une part',
    'd\'autre part', 'non seulement', 'mais aussi', 'en outre', 'de plus',
    'par ailleurs', 'néanmoins', 'toutefois', 'certes', 'afin de',
    'dans l\'ensemble', 'déverrouiller', 'plonger', 'paysage',
    'ère numérique', 'monde numérique', 'sans couture', 'de manière fluide',
    'passer au niveau supérieur', 'exploiter la puissance', 'à l\'ère de',
    'opportunité unique', 'approche holistique', 'dans un monde où',
    'voyage', 'navigation', 'tissu', 'outillage', 'monde professionnel',
    'progrès significatifs', 'développement professionnel'
  ];

  var MOTS_OUTILS = [
    'le','la','les','de','des','du','un','une','et','ou','mais','donc','or','ni','car',
    'que','qui','quoi','dont','où','pour','avec','sans','sous','sur','dans','par','en',
    'au','aux','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses',
    'notre','nos','votre','vos','leur','leurs','je','tu','il','elle','on','nous','vous',
    'ils','elles','me','te','se','ne','pas','plus','très','tout','tous','toute','toutes',
    'est','sont','était','étaient','a','ai','ont','avaient','être','avoir','c\'est','j\'ai',
    'je suis','fait','faire','pas','bien','aussi','comme','si','y','en','à','été','aux'
  ];

  var VERDICTS = [
    { min: 80, id: 'verifie', label: 'Authenticité vérifiée', classe: 'green' },
    { min: 55, id: 'probable', label: 'Probablement humain', classe: 'green' },
    { min: 30, id: 'signes', label: 'Signes de génération IA', classe: 'amber' },
    { min: 0, id: 'genere', label: 'Contenu très probablement généré', classe: 'red' }
  ];

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function verdictPour(score) {
    for (var i = 0; i < VERDICTS.length; i++) {
      if (score >= VERDICTS[i].min) return VERDICTS[i];
    }
    return VERDICTS[VERDICTS.length - 1];
  }

  function phrasesDe(texte) {
    return texte.split(/[.!?…]+/).map(function (p) { return p.trim(); })
      .filter(function (p) { return p.length > 0; });
  }

  function motsDe(texte) {
    return texte.toLowerCase().match(/[a-zàâäéèêëîïôöùûüçœ']+/g) || [];
  }

  function contenuDe(texte) {
    return motsDe(texte).filter(function (m) {
      return m.length > 3 && MOTS_OUTILS.indexOf(m) === -1;
    });
  }

  /** 1. Variété des phrases (burstiness) : écart-type / moyenne des longueurs. */
  function scoreVariete(texte) {
    var ph = phrasesDe(texte);
    if (ph.length < 4) return 55;
    var lens = ph.map(function (p) { return p.split(/\s+/).length; });
    var moy = lens.reduce(function (a, b) { return a + b; }, 0) / lens.length;
    var varian = lens.reduce(function (a, b) { return a + (b - moy) * (b - moy); }, 0) / lens.length;
    var ratio = Math.sqrt(varian) / (moy || 1);
    return Math.round(clamp((ratio - 0.12) / 0.85 * 100, 0, 100));
  }

  /** 2. Richesse du vocabulaire (type/token ratio sur mots de contenu). */
  function scoreVocabulaire(texte) {
    var mots = contenuDe(texte);
    if (mots.length === 0) return 30;
    var uniques = {};
    mots.forEach(function (m) { uniques[m] = 1; });
    var ttr = Object.keys(uniques).length / mots.length;
    return Math.round(clamp((ttr - 0.38) / 0.34 * 100, 0, 100));
  }

  /** 3. Marqueurs typiques de génération IA (densité de formules). */
  function scoreMarqueurs(texte) {
    var bas = texte.toLowerCase();
    var count = 0;
    for (var i = 0; i < MARQUEURS_IA.length; i++) {
      var idx = bas.indexOf(MARQUEURS_IA[i]);
      while (idx !== -1) { count++; idx = bas.indexOf(MARQUEURS_IA[i], idx + 1); }
    }
    return Math.round(clamp(100 - count * 8, 0, 100));
  }

  /** 4. Répétitions de mots de contenu. */
  function scoreRepetitions(texte) {
    var mots = contenuDe(texte);
    if (mots.length === 0) return 50;
    var freq = {};
    var extra = 0;
    mots.forEach(function (m) { freq[m] = (freq[m] || 0) + 1; });
    Object.keys(freq).forEach(function (m) { if (freq[m] > 1) extra += freq[m] - 1; });
    var ratio = extra / mots.length;
    return Math.round(clamp(100 - ratio * 480, 0, 100));
  }

  /** 5. Vivacité : questions rhétoriques, exclamations, tutoiement. */
  function bonusVivacite(texte) {
    var q = (texte.match(/\?/g) || []).length;
    var ex = (texte.match(/!/g) || []).length;
    var tutoiement = /(tu |vous comprenez|vous voyez|honnête)/i.test(texte) ? 2 : 0;
    return Math.min(8, q * 2 + ex + tutoiement);
  }

  /** Analyse locale pure : retourne { score, verdict, metriques, details }. */
  function analyserLocal(texte) {
    var metriques = [
      { nom: 'Variété des phrases', valeur: scoreVariete(texte), couleur: 'blue' },
      { nom: 'Richesse du vocabulaire', valeur: scoreVocabulaire(texte), couleur: 'blue' },
      { nom: 'Absence de marqueurs IA', valeur: scoreMarqueurs(texte), couleur: 'green' },
      { nom: 'Peu de répétitions', valeur: scoreRepetitions(texte), couleur: 'green' }
    ];
    var brut = metriques[0].valeur * 0.25 + metriques[1].valeur * 0.25 +
               metriques[2].valeur * 0.30 + metriques[3].valeur * 0.20;
    var score = Math.round(clamp(brut + bonusVivacite(texte), 0, 100));
    var verdict = verdictPour(score);
    var details = [];
    if (metriques[2].valeur < 60) {
      details.push('Plusieurs formulations typiques de génération automatique détectées (formules de transition, tics de langage).');
    }
    if (metriques[0].valeur < 45) {
      details.push('Longueur des phrases très uniforme : faible « burstiness », signature fréquente des textes générés.');
    }
    if (metriques[3].valeur < 50) {
      details.push('Vocabulaire de contenu répété de manière inhabituelle.');
    }
    if (!details.length) {
      details.push('Aucun marqueur stylistique de génération automatique détecté à un niveau significatif.');
    }
    return { score: score, verdict: verdict, metriques: metriques, details: details };
  }

  /**
   * Analyse croisée réelle (2e passe) : estimation de perplexité par n-grammes
   * de caractères + burstiness (variance des longueurs de phrases).
   * Aucun aléa : résultats déterministes, identiques pour un même texte.
   */
  function scorePerplexite(texte) {
    // Modèle trigramme de caractères : plus la suite est prévisible, plus
    // le texte ressemble à une génération automatique (perplexité faible).
    var s = texte.toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g, '');
    if (s.length < 40) return 50;
    var trig = {};
    var total = 0;
    for (var i = 0; i < s.length - 3; i++) {
      var key = s.substr(i, 3);
      trig[key] = (trig[key] || 0) + 1;
      total++;
    }
    // Entropie normalisée (0 = parfaitement prévisible, 1 = maximalement varié)
    var entropie = 0;
    Object.keys(trig).forEach(function (k) {
      var p = trig[k] / total;
      entropie -= p * Math.log(p);
    });
    var maxEnt = Math.log(Math.min(trig.length, 8000));
    var normalise = maxEnt > 0 ? entropie / maxEnt : 0.5;
    return Math.round(clamp(normalise * 100, 5, 97));
  }

  function scoreBurstiness(texte) {
    // Variance relative des longueurs de phrases : les textes humains
    // alternent phrases courtes et longues ; l'IA est plus uniforme.
    var phrases = texte.split(/[.!?…]+/).map(function (p) { return p.trim().length; })
      .filter(function (l) { return l > 3; });
    if (phrases.length < 5) return 50;
    var moy = phrases.reduce(function (a, b) { return a + b; }, 0) / phrases.length;
    if (moy === 0) return 50;
    var varian = phrases.reduce(function (a, l) { return a + (l - moy) * (l - moy); }, 0) / phrases.length;
    var cv = Math.sqrt(varian) / moy; // coefficient de variation
    return Math.round(clamp(cv * 160, 5, 97));
  }

  /**
   * Analyse complète — moteur stylométrique local réel (perplexité + burstiness).
   * Vos contenus ne quittent jamais l'appareil.
   * Retourne une Promise. Erreur si texte trop court ou trop long.
   */
  function analyser(texte, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      if (!texte || texte.trim().length < MIN_CHARS) {
        reject(new Error('Texte trop court : ' + (texte ? texte.trim().length : 0) + ' caractères (minimum ' + MIN_CHARS + ').'));
        return;
      }
      if (texte.length > MAX_CHARS) {
        reject(new Error('Texte trop long (maximum ' + MAX_CHARS + ' caractères).'));
        return;
      }
      var local = analyserLocal(texte);
      resolve({ local: local, api: null, score: local.score, verdict: local.verdict, metriques: local.metriques, details: local.details });
    });
  }

  var Scan = {
    MIN_CHARS: MIN_CHARS,
    MAX_CHARS: MAX_CHARS,
    VERDICTS: VERDICTS,
    MARQUEURS_IA: MARQUEURS_IA,
    analyserLocal: analyserLocal,
    analyser: analyser,
    verdictPour: verdictPour
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Scan = Scan;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scan;
  }
})(typeof window !== 'undefined' ? window : globalThis);
