/* ============================================================
   PreuveIA — Helpers communs (compte, scans, badges, formatage)
   Dépend de tarifs.js (charger avant).
   ============================================================ */
(function (global) {
  'use strict';

  var LS_ACCOUNT = 'preuveia.compte';
  var LS_SCANS = 'preuveia.scans';
  var LS_BADGES = 'preuveia.badges';

  function store() {
    try { return global.localStorage; } catch (e) { return null; }
  }

  function read(key, fallback) {
    try {
      var raw = store() && store().getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { store() && store().setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var Common = {
    LS_ACCOUNT: LS_ACCOUNT,
    LS_SCANS: LS_SCANS,
    LS_BADGES: LS_BADGES,

    getCompte: function () { return read(LS_ACCOUNT, null); },
    setCompte: function (c) { write(LS_ACCOUNT, c); },
    clearCompte: function () { try { store() && store().removeItem(LS_ACCOUNT); } catch (e) {} },

    getScans: function () { return read(LS_SCANS, []); },
    addScan: function (scan) {
      var scans = read(LS_SCANS, []);
      scan.id = scan.id || ('scan-' + Date.now().toString(36));
      scan.date = scan.date || new Date().toISOString();
      scans.unshift(scan);
      if (scans.length > 200) scans = scans.slice(0, 200);
      write(LS_SCANS, scans);
      return scan;
    },

    getBadges: function () { return read(LS_BADGES, []); },
    addBadge: function (b) {
      var badges = read(LS_BADGES, []);
      b.date = b.date || new Date().toISOString();
      badges.unshift(b);
      write(LS_BADGES, badges);
      return b;
    },

    /** Scans utilisés ce mois-ci (comptage simple sur les 30 derniers jours). */
    scansDuMois: function () {
      var scans = read(LS_SCANS, []);
      var seuil = Date.now() - 30 * 24 * 3600 * 1000;
      return scans.filter(function (s) { return new Date(s.date).getTime() >= seuil; }).length;
    },

    /** Quota restant selon le plan (null = illimité). */
    quotaRestant: function (compte) {
      var planId = compte && compte.plan ? compte.plan : null;
      var quota = global.PreuveIA && global.PreuveIA.TARIFS
        ? global.PreuveIA.TARIFS.quotaScans(planId) : null;
      if (quota === null) return null;
      return Math.max(0, quota - Common.scansDuMois());
    },

    formatDate: function (iso) {
      try {
        return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) { return iso; }
    },

    emailValide: function (email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
    },

    /** Luhn — validation carte (démo Stripe). */
    luhnValide: function (num) {
      var n = String(num || '').replace(/\D/g, '');
      if (n.length < 12) return false;
      var sum = 0, dbl = false;
      for (var i = n.length - 1; i >= 0; i--) {
        var d = parseInt(n.charAt(i), 10);
        if (dbl) { d *= 2; if (d > 9) d -= 9; }
        sum += d; dbl = !dbl;
      }
      return sum % 10 === 0;
    },

    formatCarte: function (v) {
      return String(v || '').replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    },

    formatExp: function (v) {
      var d = String(v || '').replace(/\D/g, '').slice(0, 4);
      if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2);
      return d;
    },

    /** Télécharge un Blob (export JSON, etc.). */
    telecharger: function (nom, contenu, mime) {
      try {
        var blob = new Blob([contenu], { type: mime || 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = nom;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
        return true;
      } catch (e) { return false; }
    },

    // Clés du stockage partagé entre scan.html et dashboard.html
    cleCompte: LS_ACCOUNT
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Common = Common;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Common;
  }
})(typeof window !== 'undefined' ? window : globalThis);
