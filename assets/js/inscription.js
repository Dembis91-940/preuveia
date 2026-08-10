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
    var num = String(d.numero || '').replace(/\D/g, '');
    if (num.length < 12 || !luhn(num)) erreurs.numero = 'Numéro de carte invalide (mode test — utilisez 4242 4242 4242 4242).';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(d.exp || ''))) erreurs.exp = 'Date d\u2019expiration invalide (MM/AA).';
    if (!/^\d{3,4}$/.test(String(d.cvc || ''))) erreurs.cvc = 'CVC invalide (3 ou 4 chiffres).';
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

  function simulerPaiement(donnees) {
    // Placeholder : remplacé par un vrai checkout Stripe en production.
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          ok: true,
          mode: 'test',
          stripe: 'Aucun débit réel — paiement simulé (clé de test ' + STRIPE_TEST_KEY + ')',
          transaction: 'pi_' + Date.now().toString(36)
        });
      }, 1400);
    });
  }

  var Inscription = {
    STRIPE_TEST_KEY: STRIPE_TEST_KEY,
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
