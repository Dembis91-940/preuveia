/* ============================================================
   PreuveIA — Dashboard membre (logique, localStorage en démo)
   ============================================================ */
(function (global) {
  'use strict';

  /** Export JSON complet du compte (scans + badges + profil). */
  function exporterJSON(compte, scans, badges) {
    return JSON.stringify({
      exporteLe: new Date().toISOString(),
      application: 'PreuveIA',
      version: 'demo-locale',
      compte: compte,
      scans: scans || [],
      badges: badges || []
    }, null, 2);
  }

  function joursRestantsEssai(compte) {
    if (!compte || !compte.essaiFin) return null;
    var diff = new Date(compte.essaiFin).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 3600 * 1000)));
  }

  var Dashboard = {
    exporterJSON: exporterJSON,
    joursRestantsEssai: joursRestantsEssai
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.Dashboard = Dashboard;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
  }
})(typeof window !== 'undefined' ? window : globalThis);
