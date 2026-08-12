#!/usr/bin/env node
/* ============================================================
   PreuveIA — Harness de tests (Node, zéro dépendance)
   Lancement : node tests/test.js
   Couvre : inventaire, HTML, liens (résolution relative +
   strip query/hash), cohérence des prix, moteur de scan, PDF,
   badges (round-trip + anti-fraude), tunnel, dashboard, SEO,
   promesses marketing implémentées.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const JS = p => path.join(RACINE, 'assets', 'js', p);
const PAGE = p => path.join(RACINE, p);

/* ---------- mini-harness ---------- */
let total = 0, echoues = 0;
const erreurs = [];
function ok(cond, msg) {
  total++;
  if (!cond) { echoues++; erreurs.push('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + ' (attendu: ' + JSON.stringify(b) + ', obtenu: ' + JSON.stringify(a) + ')'); }
function contient(texte, aiguille, msg) { ok(String(texte).indexOf(aiguille) !== -1, msg); }
function section(t) { console.log('\n── ' + t); }

/* ---------- stubs frais par scénario (leçon 08-09) ---------- */
function stubLocalStorage() {
  const mem = {};
  return {
    getItem: k => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: k => { delete mem[k]; }
  };
}
function chargerModule(nom) {
  const chemin = JS(nom);
  delete require.cache[require.resolve(chemin)];
  delete globalThis.PreuveIA;
  global.window = globalThis;
  const mod = require(chemin);
  return mod;
}

/* ---------- collecte des fichiers ---------- */
function tousLesHtml() {
  const out = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    });
  }
  walk(RACINE);
  return out.sort();
}

/* ============================================================
   1. INVENTAIRE
   ============================================================ */
section('1. Inventaire des fichiers');
const ATTENDUS = [
  'index.html', 'fonctionnalites.html', 'tarifs.html', 'comment-ca-marche.html',
  'scan.html', 'badge.html', 'verification.html', 'inscription.html', 'dashboard.html',
  'mentions-legales.html', 'cgu.html',
  'blog/pourquoi-les-acheteurs-se-mefient-de-votre-formation.html',
  'blog/ia-ou-humain-comment-prouver-votre-authenticite.html',
  'emails/bienvenue.html', 'emails/rapport-livre.html', 'emails/panier-abandonne.html',
  'assets/css/style.css', 'assets/favicon.svg',
  'assets/js/tarifs.js', 'assets/js/common.js', 'assets/js/badge.js',
  'assets/js/badge-widget.js', 'assets/js/scan.js', 'assets/js/pdf.js',
  'assets/js/exemples.js', 'assets/js/inscription.js', 'assets/js/dashboard.js',
  'exemples/rapport-exemple.pdf', 'README.md', 'tests/test.js'
];
ATTENDUS.forEach(f => ok(fs.existsSync(path.join(RACINE, f)), 'fichier présent : ' + f));
const htmls = tousLesHtml();
eq(htmls.length, 16, '16 pages HTML trouvées (trouvé: ' + htmls.length + ')');

/* ============================================================
   2. STRUCTURE HTML
   ============================================================ */
section('2. Structure HTML');
const VOID = ['br', 'img', 'input', 'meta', 'link', 'hr', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
const CONTENEURS = ['html', 'head', 'body', 'div', 'section', 'main', 'header', 'footer', 'article', 'aside',
  'nav', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'form', 'span', 'p',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'details', 'summary', 'label', 'blockquote',
  'em', 'strong', 'b', 'i', 'code', 'small', 'select', 'option', 'textarea', 'button', 'title'];
function balisesEquilibrees(html) {
  let src = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const pile = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let m;
  while ((m = re.exec(src))) {
    const nom = m[1].toLowerCase();
    const fermant = m[0].startsWith('</');
    const autofermant = /\/>$/.test(m[0]);
    if (VOID.indexOf(nom) !== -1 || autofermant) continue;
    if (fermant) {
      const top = pile.pop();
      if (top !== nom) { pile.push(top); pile.push('MISMATCH:' + nom); break; }
    } else if (CONTENEURS.indexOf(nom) !== -1) {
      pile.push(nom);
    }
  }
  return pile.length === 0;
}
htmls.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const nom = path.relative(RACINE, f);
  const estEmail = nom.startsWith('emails/');
  ok(/^<!DOCTYPE html>/i.test(html.trim()), nom + ' : doctype');
  ok(/<html lang="fr"/.test(html), nom + ' : lang="fr"');
  ok(/<title>/.test(html) && /<\/title>/.test(html), nom + ' : title');
  if (!estEmail) ok(/<meta name="description"/.test(html), nom + ' : meta description');
  ok(/<meta name="viewport"/.test(html), nom + ' : viewport');
  ok(balisesEquilibrees(html), nom + ' : balises équilibrées');
  // ids uniques
  const ids = (html.match(/\sid="([^"]+)"/g) || []).map(s => s.slice(5, -1));
  eq(new Set(ids).size, ids.length, nom + ' : ids uniques (' + ids.length + ')');
});

/* ============================================================
   3. LIENS (résolution relative + strip query/hash)
   ============================================================ */
section('3. Liens internes');
const EXTERNE = /^(https?:|mailto:|tel:|data:|javascript:|#|ftp:|\/\/)/i;
htmls.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  const nom = path.relative(RACINE, f);
  // Ne vérifier que les liens réels du document : ignorer le contenu des
  // <script> (chaînes des snippets d'embed) et des <style>.
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const refs = (html.match(/(?:href|src)="([^"]+)"/g) || []).map(s => s.slice(s.indexOf('"') + 1, -1));
  refs.forEach(ref => {
    if (EXTERNE.test(ref)) return;
    if (ref.indexOf('{{') !== -1 || ref.indexOf('}}') !== -1) return; // placeholders d'emails
    let cible = ref.split('#')[0].split('?')[0]; // strip query PUIS hash (leçon 08-10)
    const ancre = ref.includes('#') ? ref.split('#')[1] : null;
    if (!cible) return; // ancre seule
    const resolue = path.resolve(path.dirname(f), cible);
    ok(fs.existsSync(resolue), nom + ' → ' + ref + ' existe (' + path.relative(RACINE, resolue) + ')');
    if (ancre && fs.existsSync(resolue)) {
      const cibleHtml = fs.readFileSync(resolue, 'utf8');
      ok(new RegExp('id="' + ancre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(cibleHtml),
        nom + ' → ancre #' + ancre + ' existe dans ' + path.relative(RACINE, resolue));
    }
  });
});

/* ============================================================
   4. PRIX — source unique (leçon 08-08)
   ============================================================ */
section('4. Cohérence des prix (source unique tarifs.js)');
{
  const T = chargerModule('tarifs.js');
  eq(T.PLANS.length, 3, '3 formules');
  eq(T.plan('authenticite').prix, 29, 'Authenticité = 29 €');
  eq(T.plan('createur').prix, 49, 'Créateur = 49 €');
  eq(T.plan('academie').prix, 79, 'Académie = 79 €');
  eq(T.plan('authenticite').scans, 10, 'Authenticité : 10 scans/mois');
  eq(T.plan('createur').scans, null, 'Créateur : scans illimités');
  eq(T.ESSAI_JOURS, 7, 'Essai 7 jours');
  eq(T.GARANTIE_JOURS, 14, 'Garantie 14 jours');
  ['index.html', 'tarifs.html', 'inscription.html'].forEach(p => {
    const h = fs.readFileSync(PAGE(p), 'utf8');
    contient(h, '29 €', p + ' : 29 €');
    contient(h, '49 €', p + ' : 49 €');
    contient(h, '79 €', p + ' : 79 €');
  });
  contient(fs.readFileSync(PAGE('README.md'), 'utf8'), '29 €', 'README : 29 €');
  contient(fs.readFileSync(PAGE('README.md'), 'utf8'), '49 €', 'README : 49 €');
  contient(fs.readFileSync(PAGE('README.md'), 'utf8'), '79 €', 'README : 79 €');
  contient(fs.readFileSync(PAGE('inscription.html'), 'utf8'), 'value="createur"', 'tunnel : plan Créateur présent');
}

/* ============================================================
   5. BADGES — round-trip + anti-fraude (leçon 08-10)
   ============================================================ */
section('5. Moteur de badges');
{
  const B = chargerModule('badge.js');
  let defauts = 0;
  for (let i = 0; i < 2000; i++) {
    const c = B.generateCode();
    if (!B.validCode(c)) defauts++;
    if (!/^PIA-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(c)) defauts++;
  }
  eq(defauts, 0, '2000 codes : round-trip + format OK');
  ok(!/[IO01]/.test(B.ALPHABET), 'alphabet exclut I, O, 0, 1');
  const demo = 'PIA-292S-2BUS-VU22';
  ok(B.validCode(demo), 'code démo ' + demo + ' valide');
  ok(!B.validCode('PIA-292S-2BUS-VU2X'), 'code altéré (1 caractère) rejeté');
  ok(!B.validCode('PIA-292S-2BUS-VU22-EXTRA'), 'format étendu rejeté');
  ok(!B.validCode(''), 'vide rejeté');
  eq(B.verificationUrl(demo), 'verification.html?code=' + demo, 'URL de vérification');
  ok(B.svg({ code: demo, titre: 'T', proprietaire: 'P' }).startsWith('<svg'), 'SVG généré');
  // code démo présent dans les pages marketing
  contient(fs.readFileSync(PAGE('verification.html'), 'utf8'), demo, 'verification.html : lien exemple');
  contient(fs.readFileSync(PAGE('index.html'), 'utf8'), demo, 'index.html : exemple vérifiable');
  // widget autonome
  const W = chargerModule('badge-widget.js');
  const rendu = W.render({ code: demo, titre: 'Formation', base: 'https://preuveia.fr/' });
  contient(rendu, 'verification.html?code=' + demo, 'widget : lien de vérification');
  contient(rendu, '<svg', 'widget : SVG');
}

/* ============================================================
   6. MOTEUR DE SCAN
   ============================================================ */
section('6. Moteur de scan');
(async () => {
  const S = chargerModule('scan.js');
  const E = chargerModule('exemples.js');

  const humain = await S.analyser(E.humain, { api: false });
  ok(humain.score >= 80, 'texte humain ≥ 80 (obtenu ' + humain.score + ')');
  eq(humain.verdict.id, 'verifie', 'texte humain → « Authenticité vérifiée »');
  eq(humain.metriques.length, 4, '4 indicateurs détaillés');

  const ia = await S.analyser(E.ia, { api: false });
  ok(ia.score <= 54, 'texte IA ≤ 54 (obtenu ' + ia.score + ')');
  ok(['signes', 'genere'].indexOf(ia.verdict.id) !== -1, 'texte IA → verdict négatif (' + ia.verdict.id + ')');

  let rejet = null;
  try { await S.analyser('texte bien trop court pour être analysé', {}); } catch (e) { rejet = e.message; }
  ok(rejet && rejet.indexOf('trop court') !== -1, 'texte court rejeté avec message');

  const avecApi = await S.analyser(E.humain, { api: true });
  ok(avecApi.api && avecApi.api.fournisseur, 'API placeholder : fournisseur renseigné');
  ok(avecApi.api.mode === 'statistique', 'API réelle : mode statistique (perplexité + burstiness)');
  ok(avecApi.api.fournisseur.indexOf('PreuveIA v2') !== -1, 'API réelle : moteur PreuveIA v2');

  const panne = await S.analyser(E.humain, { api: true, simulerPanne: true });
  eq(panne.apiPanne, true, 'panne API détectée');
  ok(panne.score >= 80, 'fallback local propre en cas de panne (score ' + panne.score + ')');

  // Promesse marketing « analyse en 30 secondes » → API simulée avec délai court
  ok(S.MIN_CHARS === 200, 'seuil minimal 200 caractères');
})().then(lancerSuite2);

/* ============================================================
   7. PDF (leçon 08-08 : startxref = offset absolu)
   ============================================================ */
function testPdf() {
  section('7. Générateur PDF');
  const P = chargerModule('pdf.js');
  const B = chargerModule('badge.js');
  const r = P.buildRapport({
    titre: 'Formation test — édition accentuée: é è ê à ç œ',
    auteur: 'Claire Fontaine',
    score: 88, verdict: 'Authenticité vérifiée', verdictClasse: 'green',
    metriques: [
      { nom: 'Variété des phrases', valeur: 84, couleur: 'blue' },
      { nom: 'Absence de marqueurs IA', valeur: 100, couleur: 'green' }
    ],
    code: B.generateCode(),
    urlVerification: 'https://preuveia.fr/verification.html?code=PIA-292S-2BUS-VU22',
    dateLabel: '10 août 2026'
  });
  ok(r.texte.startsWith('%PDF-1.4'), 'entête %PDF-1.4');
  ok(r.texte.endsWith('%%EOF\n'), 'trailer %%EOF');
  eq(r.texte.indexOf('xref\n'), r.startxref, 'startxref === indexOf("xref\\n") (offset absolu)');
  ok(r.bytes.length > 1000, 'taille > 1 Ko (' + r.bytes.length + ' octets)');
  contient(r.texte, 'Authenticité vérifiée', 'PDF : verdict présent');
  contient(r.texte, '88/100', 'PDF : score présent');
  contient(r.texte, 'PIA-292S-2BUS-VU22', 'PDF : code présent (accents inclus)');
  contient(r.texte, 'édition accentuée', 'PDF : accents CP1252 préservés');
  // écriture réelle
  fs.writeFileSync(path.join(RACINE, 'exemples', 'rapport-exemple.pdf'), Buffer.from(r.bytes));
  const stat = fs.statSync(path.join(RACINE, 'exemples', 'rapport-exemple.pdf'));
  ok(stat.size > 1000, 'PDF écrit sur disque (' + stat.size + ' octets)');
}

/* ============================================================
   8. TUNNEL D'INSCRIPTION (Stripe test)
   ============================================================ */
function testTunnel() {
  section("8. Tunnel d'inscription");
  const I = chargerModule('inscription.js');
  ok(I.STRIPE_URLS && I.STRIPE_URLS.createur.indexOf('buy.stripe.com') !== -1, 'liens de paiement Stripe configurés');
  const bon = {
    nom: 'Claire Fontaine', email: 'claire@domaine.fr', mdp: 'motdepasse123',
    plan: 'createur'
  };
  ok(I.valider(bon).ok, 'formulaire valide accepté (sans carte : redirection Stripe)');
  const mauvais = I.valider({ nom: 'C', email: 'pas-un-email', mdp: 'court', plan: '' });
  eq(mauvais.ok, false, 'formulaire invalide rejeté');
  ['nom', 'email', 'mdp', 'plan'].forEach(ch => ok(mauvais.erreurs[ch], 'erreur champ ' + ch));
  ok(I.luhn('4242424242424242'), 'Luhn : carte de test valide');
  ok(!I.luhn('4242424242424241'), 'Luhn : carte invalide rejetée');
  return I.simulerPaiement(bon).then(res => {
    eq(res.mode, 'redirect', 'paiement = redirection Stripe sécurisée');
    ok(res.stripe.indexOf('Stripe') !== -1, 'mention Stripe présente');
  });
}

/* ============================================================
   9. COMMON + DASHBOARD (stubs frais par scénario)
   ============================================================ */
function testCommonDashboard() {
  section('9. Common + Dashboard');
  // Scénario A : quota plan Authenticité
  {
    global.localStorage = stubLocalStorage();
    const C = chargerModule('common.js');
    const T = chargerModule('tarifs.js');
    const compteAuth = { plan: 'authenticite' };
    eq(C.quotaRestant(compteAuth), 10, 'quota Authenticité = 10');
    C.addScan({ titre: 'S1', score: 88, verdict: 'v', classe: 'green', code: 'PIA-292S-2BUS-VU22', metriques: [] });
    C.addScan({ titre: 'S2', score: 90, verdict: 'v', classe: 'green', code: 'X', metriques: [] });
    eq(C.getScans().length, 2, '2 scans enregistrés');
    eq(C.quotaRestant(compteAuth), 8, 'quota restant = 8 après 2 scans');
    eq(C.quotaRestant({ plan: 'createur' }), null, 'quota Créateur = illimité');
    eq(C.emailValide('a@b.fr'), true, 'email valide');
    eq(C.emailValide('pas-email'), false, 'email invalide');
    eq(C.formatCarte('4242424242424242'), '4242 4242 4242 4242', 'format carte');
    eq(C.formatExp('1228'), '12/28', 'format expiration');
    ok(C.luhnValide('4242424242424242'), 'Luhn (common) carte test');
  }
  // Scénario B : dashboard (stubs NEUFS — leçon 08-09)
  {
    global.localStorage = stubLocalStorage();
    const D = chargerModule('dashboard.js');
    const C = chargerModule('common.js');
    const compte = { nom: 'C', email: 'c@d.fr', plan: 'createur', depuis: new Date().toISOString(), essaiFin: new Date(Date.now() + 3 * 864e5).toISOString() };
    eq(D.joursRestantsEssai(compte), 3, '3 jours d\'essai restants');
    const exp = D.exporterJSON(compte, [{ titre: 'S' }], [{ code: 'PIA-292S-2BUS-VU22' }]);
    const obj = JSON.parse(exp);
    eq(obj.application, 'PreuveIA', 'export : application');
    eq(obj.scans.length, 1, 'export : scans');
    eq(obj.badges[0].code, 'PIA-292S-2BUS-VU22', 'export : badges');
    ok(C.emailValide(compte.email), 'email compte valide');
  }
}

/* ============================================================
   10. SEO + promesses marketing implémentées (leçon 08-08)
   ============================================================ */
function testSeoEtPromesses() {
  section('10. SEO + promesses marketing');
  htmls.forEach(f => {
    const html = fs.readFileSync(f, 'utf8');
    const nom = path.relative(RACINE, f);
    const jsonld = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []);
    jsonld.forEach(bloc => {
      const contenu = bloc.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
      try { JSON.parse(contenu); ok(true, nom + ' : JSON-LD parsable'); }
      catch (e) { ok(false, nom + ' : JSON-LD INVALIDE — ' + e.message); }
    });
  });
  contient(fs.readFileSync(PAGE('index.html'), 'utf8'), 'og:title', 'landing : OG');
  contient(fs.readFileSync(PAGE('index.html'), 'utf8'), 'twitter:card', 'landing : Twitter Card');
  ['fonctionnalites.html', 'tarifs.html', 'scan.html', 'verification.html', 'inscription.html', 'badge.html',
    'blog/pourquoi-les-acheteurs-se-mefient-de-votre-formation.html',
    'blog/ia-ou-humain-comment-prouver-votre-authenticite.html'
  ].forEach(p => {
    contient(fs.readFileSync(PAGE(p), 'utf8'), 'canonical', p + ' : canonical');
  });

  // Chaque promesse marketing doit être réalisée PAR LE CODE
  const PROMESSES = [
    ['Essai 7 jours sans carte', 'tarifs.js', 'ESSAI_JOURS'],
    ['Essai 7 jours sans carte (pages)', 'index.html', '7 jours sans carte'],
    ['Garantie 14 jours', 'tarifs.js', 'GARANTIE_JOURS'],
    ['Garantie 14 jours (pages)', 'tarifs.html', '14 jours'],
    ['Rapport PDF automatique', 'scan.html', 'btnPDF'],
    ['Rapport PDF (moteur)', 'pdf.js', 'buildRapport'],
    ['Badge vérifiable en 1 clic', 'verification.html', 'validCode'],
    ['Checksum anti-fraude', 'badge.js', 'checksum'],
    ['Code PIA-XXXX-XXXX-XXXX', 'badge.js', 'PIA'],
    ['Paiement Stripe', 'inscription.html', 'Stripe'],
    ['Stripe mode test', 'inscription.js', 'pk_test_'],
    ['Scans illimités (Créateur)', 'tarifs.js', 'scans: null'],
    ['10 scans/mois (Authenticité)', 'tarifs.js', 'scans: 10'],
    ['Analyse en 30 s', 'scan.html', '30 secondes'],
    ['Vos contenus jamais entraînés', 'cgu.html', 'entraîner'],
    ['Résiliable en 1 clic', 'index.html', '1 clic']
  ];
  PROMESSES.forEach(([promesse, fichier, aiguille]) => {
    let contenu;
    try {
      contenu = fs.readFileSync(fichier.endsWith('.js') ? JS(fichier) : PAGE(fichier), 'utf8');
    } catch (e) { ok(false, 'promesse « ' + promesse + ' » : fichier ' + fichier + ' introuvable'); return; }
    ok(contenu.indexOf(aiguille) !== -1, 'promesse « ' + promesse + ' » implémentée dans ' + fichier);
  });
}

/* ============================================================
   Lancement
   ============================================================ */
function lancerSuite2() {
  testPdf();
  testTunnel().then(() => {
    testCommonDashboard();
    testSeoEtPromesses();
    const nbPages = htmls.length;
    console.log('\n════════════════════════════════════════');
    console.log('PreuveIA — ' + total + ' assertions, ' + echoues + ' échec(s), ' + nbPages + ' pages');
    if (echoues > 0) {
      console.log('\nÉCHECS :');
      erreurs.forEach(e => console.log(e));
      process.exit(1);
    }
    console.log('TOUS LES TESTS SONT VERTS ✅');
  }).catch(e => {
    console.error('Erreur d\'exécution des tests tunnel :', e);
    process.exit(1);
  });
}
