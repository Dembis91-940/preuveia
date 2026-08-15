/* ============================================================
   PreuveIA — Tunnel d'inscription (logique)
   Commande réelle via EmailJS : confirmation par email,
   paiement par virement ou message privé (aucun simulateur).
   Le compte local ne sert qu'à la démo de l'espace membre.
   ============================================================ */
(function (global) {
  'use strict';

  var EMAILJS = {
    serviceId: 'service_cy1ytdb',
    templateId: 'template_xpo58cv',
    publicKey: '8Pui4ZEqxW2jRVF7h'
  };

  function emailJsConfig() {
    var c = (global.CHATBOT_CONFIG && global.CHATBOT_CONFIG.emailjs) || {};
    return {
      serviceId: c.serviceId || EMAILJS.serviceId,
      templateId: c.templateId || EMAILJS.templateId,
      publicKey: c.publicKey || EMAILJS.publicKey
    };
  }

  function validateur(donnees) {
    var d = donnees || {};
    var erreurs = {};
    if (!d.nom || d.nom.trim().length < 2) erreurs.nom = 'Indiquez votre nom (2 caractères minimum).';
    var email = String(d.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.email = 'Adresse email invalide.';
    if (!d.plan) erreurs.plan = 'Choisissez une formule.';
    return { ok: Object.keys(erreurs).length === 0, erreurs: erreurs };
  }

  function chargerEmailJS(callback) {
    if (global.emailjs) { callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = function () { try { emailjs.init({ publicKey: emailJsConfig().publicKey }); } catch (e) {} callback(); };
    s.onerror = function () { callback(); };
    document.head.appendChild(s);
  }

  /** Envoie la commande réelle via EmailJS (promesse). */
  function envoyerCommande(donnees) {
    return new Promise(function (resolve, reject) {
      chargerEmailJS(function () {
        if (!global.emailjs) {
          reject(new Error('Le service d\'envoi est momentanément indisponible. Réessayez dans quelques instants.'));
          return;
        }
        var cfg = emailJsConfig();
        global.emailjs.send(cfg.serviceId, cfg.templateId, {
          site: 'PreuveIA',
          name: String(donnees.nom || '').trim(),
          email: String(donnees.email || '').trim(),
          question: 'Commande PreuveIA : plan ' + String(donnees.planNom || donnees.plan || '') +
            ' — essai 7 jours gratuit. Confirmation et coordonnées de paiement à envoyer.'
        }).then(resolve, reject);
      });
    });
  }

  var Inscription = {
    valider: validateur,
    envoyerCommande: envoyerCommande,
    EMAILJS: EMAILJS
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Inscription = Inscription;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Inscription;
  }
})(typeof window !== 'undefined' ? window : globalThis);
