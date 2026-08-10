/* ============================================================
   PreuveIA — SOURCE UNIQUE DES TARIFS
   Toute page (landing, tarifs, tunnel) doit afficher ces valeurs.
   Charger AVANT tout script qui affiche un prix.
   ============================================================ */
(function (global) {
  'use strict';

  var ESSAI_JOURS = 7;      // essai gratuit, sans carte
  var GARANTIE_JOURS = 14;  // satisfait ou remboursé

  var PLANS = [
    {
      id: 'authenticite',
      nom: 'Authenticité',
      prix: 29,
      unite: '/mois',
      scans: 10,             // scans inclus par mois (null = illimité)
      tagline: 'Pour valider vos premiers contenus et rassurer vos premiers acheteurs.',
      features: [
        '10 scans de contenu / mois',
        'Rapport PDF d\u2019authenticité',
        'Badge « Authenticité vérifiée »',
        'Page publique de vérification',
        'Essai gratuit 7 jours, sans carte'
      ],
      cta: 'Essayer 7 jours gratuits',
      featured: false
    },
    {
      id: 'createur',
      nom: 'Créateur',
      prix: 49,
      unite: '/mois',
      scans: null,
      tagline: 'Pour les créateurs qui vivent de leurs formations, au quotidien.',
      features: [
        'Scans illimités',
        'Rapport PDF personnalisé (logo, couleurs)',
        'Badge « Authenticité vérifiée » + variantes',
        'Vérification illimitée des badges',
        'Support prioritaire (réponse < 24 h)',
        'Historique complet + export des rapports'
      ],
      cta: 'Choisir Créateur',
      featured: true
    },
    {
      id: 'academie',
      nom: 'Académie',
      prix: 79,
      unite: '/mois',
      scans: null,
      tagline: 'Pour les studios et équipes qui publient plusieurs formations.',
      features: [
        'Tout le plan Créateur',
        '5 sièges (équipe, assistants)',
        'Scans multi-formats (transcriptions, PDF, scripts)',
        'API d\u2019analyse (accès programme)',
        'SLA de disponibilité 99,9 %',
        'Accompagnement à la mise en place'
      ],
      cta: 'Choisir Académie',
      featured: false
    }
  ];

  var TARIFS = {
    ESSAI_JOURS: ESSAI_JOURS,
    GARANTIE_JOURS: GARANTIE_JOURS,
    PLANS: PLANS,
    /** Retourne le plan dont l'id correspond, sinon undefined. */
    plan: function (id) {
      for (var i = 0; i < PLANS.length; i++) {
        if (PLANS[i].id === id) return PLANS[i];
      }
      return undefined;
    },
    /** Libellé de prix au format marketing, ex. « 29 € /mois ». */
    prixLabel: function (id) {
      var p = TARIFS.plan(id);
      if (!p) return '';
      return String(p.prix) + ' € ' + p.unite;
    },
    /** Quota mensuel de scans (null = illimité). */
    quotaScans: function (id) {
      var p = TARIFS.plan(id);
      return p ? p.scans : 0;
    }
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.TARIFS = TARIFS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TARIFS;
  }
})(typeof window !== 'undefined' ? window : globalThis);
