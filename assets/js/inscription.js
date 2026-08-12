/* ============================================================
   PreuveIA — Tunnel d'inscription (logique)
   Paiement Stripe en MODE TEST (placeholder clair, aucun débit).
   En production : stripe.com, clé pk_live_… côté serveur.
   ============================================================ */
(function (global) {
  'use strict';

  var STRIPE_TEST_KEY = 'pk_test_51PREUVEIA_DEMO_LOCALE_NO_DEBIT';

  function validateur(donnees) {
    var d = donnees || {};
    var erreurs = {};
    if (!d.nom || d.nom.trim().length < 2) erreurs.nom = 'Indiquez votre nom (2 caractères minimum).';
    var email = String(d.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.email = 'Adresse email invalide.';
    if (!d.mdp || d.mdp.length < 8) erreurs.mdp = 'Mot de passe : 8 caractères minimum.';
    if (!d.plan) erreurs.plan = 'Choisissez une formule.';
    return { ok: Object.keys(erreurs).length === 0, erreurs: erreurs };
  }

  function luhn(numStr) {
    var n = String(numStr || '').replace(/\D/g, '');
    if (n.length < 12) return false;
    var sum = 0, dbl = false;
    for (var i = n.length - 1; i >= 0; i--) {
      var d = parseInt(n.charAt(i), 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  // ⚡ LIENS DE PAIEMENT STRIPE — remplacés dès que le compte Stripe est créé (2 min)
  var STRIPE_URLS = {
    authenticite: 'https://buy.stripe.com/REMPLACER_AUTH',
    createur: 'https://buy.stripe.com/REMPLACER_CREA',
    academie: 'https://buy.stripe.com/REMPLACER_ACAD'
  };
  function simulerPaiement(donnees) {
    return new Promise(function (resolve) {
      var url = STRIPE_URLS[donnees && donnees.plan] || STRIPE_URLS.createur;
      var sep = url.indexOf('?') === -1 ? '?' : '&';
      var target = url + sep + 'prefilled_email=' + encodeURIComponent(String(donnees && donnees.email || '').trim());
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = target;
      }
      resolve({ ok: true, mode: 'redirect', stripe: 'Redirection vers le paiement sécurisé Stripe.', url: target });
    });
  }

  var Inscription = {
    STRIPE_URLS: STRIPE_URLS,
    valider: validateur,
    luhn: luhn,
    simulerPaiement: simulerPaiement
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Inscription = Inscription;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Inscription;
  }
})(typeof window !== 'undefined' ? window : globalThis);
