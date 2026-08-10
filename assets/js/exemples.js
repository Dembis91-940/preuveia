/* ============================================================
   PreuveIA — Textes d'exemple pour la démo du scanner
   « humain » doit scorer haut, « ia » doit scorer bas (testé).
   ============================================================ */
(function (global) {
  'use strict';

  var EXEMPLES = {
    humain: [
      "J'ai mis trois ans à construire cette formation, et je vais être honnête avec vous :",
      "les deux premières versions étaient mauvaises. Pas moyennes. Mauvaises.",
      "Mes premiers élèves décrochaient à la deuxième semaine. L'un d'eux, Karim, m'a écrit",
      "un message qui m'a fait mal : « On dirait que tu récites un manuel. » Il avait raison.",
      "J'ai tout repris. J'ai enregistré mes cours comme je parle à un ami, avec mes hésitations,",
      "mes exemples ratés, mes raccourcis. J'ai raconté l'erreur de chiffrage qui m'a coûté",
      "4 000 euros sur mon premier client freelance — et ce que j'en ai appris.",
      "Aujourd'hui, mes élèves me disent que les modules se « boivent ». Mais je n'ai aucun",
      "moyen de le prouver à un inconnu qui arrive sur ma page de vente, vous comprenez ?",
      "Une capture d'écran d'avis, n'importe qui peut la fabriquer en deux minutes avec une IA.",
      "C'est pour ça que j'ai fait scanner chacun de mes chapitres par PreuveIA : le rapport",
      "montre la variété de mes phrases, mes marqueurs personnels, mes répétitions assumées.",
      "Et le badge sur ma page de vente fait le reste : les gens cliquent, ils voient le code,",
      "ils vérifient. La confiance, ça se prouve — pas ça se raconte.",
      "Alors si vous hésitez encore : lisez le premier module. S'il ne vous plaît pas,",
      "je vous rembourse, sans question, sans justification. C'est aussi simple que ça."
    ].join(' '),

    ia: [
      "Dans le monde d'aujourd'hui, en constante évolution, la maîtrise des outils numériques",
      "est devenue essentielle. Il est important de noter que le paysage professionnel a été",
      "profondément transformé par les nouvelles technologies. Dans cette formation complète,",
      "nous explorerons les concepts clés qui vous permettront de passer au niveau supérieur.",
      "D'une part, nous aborderons les fondamentaux théoriques. D'autre part, nous mettrons",
      "en pratique ces connaissances à travers des exercices concrets. Non seulement vous",
      "acquerrez des compétences techniques, mais aussi une vision stratégique indispensable.",
      "En outre, chaque module a été conçu avec soin pour offrir une progression logique et",
      "fluide. De plus, des études de cas réelles illustreront chaque notion abordée.",
      "Il est essentiel de comprendre que la réussite repose sur une pratique régulière et",
      "une approche méthodique. En conclusion, cette formation représente une opportunité",
      "unique de développer votre expertise et de déverrouiller tout votre potentiel dans",
      "un environnement professionnel de plus en plus compétitif. N'oublions pas que la clé",
      "du succès réside dans l'application cohérente des principes enseignés au fil des modules.",
      "Dans l'ensemble, les apprenants qui suivent ce parcours avec assiduité constateront",
      "des progrès significatifs et durables dans leur développement professionnel."
    ].join(' ')
  };

  global.PreuveIA = global.PreuveIA || {};
  global.PreuveIA.EXEMPLES = EXEMPLES;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXEMPLES;
  }
})(typeof window !== 'undefined' ? window : globalThis);
