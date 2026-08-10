# PreuveIA — Certification d'authenticité pour créateurs de formations IA

SaaS qui scanne les contenus des créateurs de formations IA (transcriptions, PDF, scripts), délivre un **score d'authenticité /100**, un **rapport PDF automatique** et un **badge « Authenticité vérifiée » à code unique**, vérifiable publiquement en un clic.

> **Statut : démonstration locale complète et testée.** Analyses simulées côté client, paiement Stripe en mode test (aucun débit), témoignages et statistiques illustratifs. Prêt à déployer tel quel (Netlify/Vercel), à brancher sur les vraies API en production.

---

## 1. Business model

| Élément | Détail |
|---|---|
| **Cible** | Créateurs de formations IA et en ligne (Teachable, Gumroad, Udemy, sites propres) qui pâtissent de la méfiance structurelle des acheteurs |
| **Problème** | L'IA génère un « cours » en 20 min → les acheteurs doutent de tout. Les preuves classiques (avis, captures) sont elles-mêmes générables. Les créateurs honnêtes sont les plus pénalisés : leur travail authentique n'est pas démontrable |
| **Solution** | Scan du contenu → score /100 (heuristique stylistique locale + API de détection IA en production) → rapport PDF daté + badge à code unique vérifiable publiquement |
| **Prix** | Authenticité **29 €/mois** (10 scans + badge) · Créateur **49 €/mois** (scans illimités + rapport personnalisé + support &lt; 24 h) · Académie **79 €/mois** (5 sièges + API + SLA). Essai 7 jours sans carte, garantie 14 jours |
| **Marge** | ~90–100 % : SaaS pur. Coûts = API de détection (0,01–0,05 €/scan) + Stripe ~1,7 % + hébergement statique (gratuit). Une vente de formation (49–99 €) rembourse 1–2 mois d'abonnement |
| **Canaux** | Communautés de créateurs (Discord/Facebook/Reddit), X/Twitter (threads « j'ai scanné les formations populaires »), LinkedIn, partenariats plateformes, SEO (2 articles de blog + page de vérification) |
| **Objectif 30 jours** | 350 € MRR · 8 clients payants · 3 témoignages réels · 2 000 visites/mois via SEO + threads |

**Sources uniques des prix** : `assets/js/tarifs.js` (`PreuveIA.TARIFS`) — la landing, la page tarifs et le tunnel lisent les mêmes valeurs ; les tests vérifient la cohérence.

---

## 2. Structure du livrable

```
preuveia/
├── index.html                  # Landing de vente (hero, stats, problème, 4 étapes, bénéfices, rapport, témoignages, tarifs, FAQ, CTA)
├── fonctionnalites.html        # Fonctionnalités + méthode de score + comparatif
├── tarifs.html                 # 3 formules + comparatif détaillé + FAQ tarifs
├── comment-ca-marche.html      # Parcours créateur + parcours acheteur + architecture démo
├── scan.html                   # OUTIL DE SCAN : collage/upload → analyse → score → rapport PDF
├── badge.html                  # GÉNÉRATEUR DE BADGE : code unique, aperçu SVG, snippets à copier
├── verification.html           # VÉRIFICATION PUBLIQUE : ?code=… + checksum anti-fraude
├── inscription.html            # TUNNEL : formulaire + Stripe (mode test, placeholder clair)
├── dashboard.html              # Espace membre : historique scans, registre badges, quota, export JSON
├── mentions-legales.html / cgu.html
├── blog/                       # 2 articles SEO (BlogPosting schema.org)
├── emails/                     # bienvenue, rapport livré, panier abandonné (brouillons prêts)
├── assets/
│   ├── css/style.css           # Design system complet, responsive, print-friendly
│   └── js/
│       ├── tarifs.js           # SOURCE UNIQUE des prix/quotas/garanties
│       ├── scan.js             # Moteur heuristique (4 indicateurs + bonus) + API placeholder + fallback
│       ├── pdf.js              # Mini-générateur PDF (PDF 1.4, CP1252, xref exact)
│       ├── badge.js            # Codes PIA-XXXX-XXXX-XXXX + checksum + SVG
│       ├── badge-widget.js     # Widget autonome intégrable (snippet)
│       ├── common.js           # Compte/scans/badges localStorage, validation, formatage
│       ├── inscription.js      # Validation tunnel + paiement simulé Stripe test
│       ├── dashboard.js        # Export JSON, jours d'essai restants
│       └── exemples.js         # Textes de démo (humain vs IA)
├── exemples/rapport-exemple.pdf  # Rapport PDF réel généré par le produit
└── tests/test.js               # Harness Node : 380+ assertions, zéro dépendance
```

---

## 3. Ce qui est vérifié (preuves)

Lancer la vérification complète :

```bash
cd preuveia
node tests/test.js          # ~380 assertions : fichiers, HTML, liens, prix, scan, PDF, badges, tunnel, SEO
python3 -m http.server 8123 # puis ouvrir http://localhost:8123
```

Points couverts par les tests :
- **Inventaire** : 24 fichiers attendus présents.
- **HTML** : doctype, `lang="fr"`, title, meta description, viewport sur toutes les pages ; balises équilibrées ; ids uniques.
- **Liens** : tous les href/src internes résolus **relativement à chaque fichier** (les pages `blog/` utilisent `../`), query strings et ancres strippées avant résolution, ancres vérifiées dans les fichiers cibles.
- **Prix** : 29 / 49 / 79 € présents et identiques sur landing, tarifs, tunnel, README et `tarifs.js`.
- **Scan** : texte humain → score ≥ 80 « Authenticité vérifiée » ; texte IA → score ≤ 54 « Signes de génération IA » ; texte court rejeté ; API placeholder OK ; panne API → fallback local propre.
- **PDF** : entête `%PDF-1.4`, `%%EOF`, **`startxref === indexOf('xref\n')`** (offset absolu), contenu présent ; fichier réel reconnu par `file` (« PDF document, version 1.4 »).
- **Badges** : `validCode(generateCode())` sur 2 000 itérations ; code altéré rejeté ; alphabet sans I/O/0/1 ; code démo `PIA-292S-2BUS-VU22` valide et présent dans les pages.
- **Tunnel** : validation formulaire (email, Luhn, exp, CVC), compte persisté, redirection si déjà connecté.
- **Dashboard** : redirection sans compte, quota plan, export JSON complet.
- **SEO** : JSON-LD parsable, meta OG/Twitter présentes, **promesses marketing implémentées dans le code** (essai 7 j, garantie 14 j, PDF auto, badge vérifiable, Stripe test).

---

## 4. Plan de lancement — 2 semaines

### Semaine 1 — Fondations (J1–J7)
- [ ] **J1–J2** : Réserver `preuveia.fr` + email pro + comptes sociaux (X `@preuveia`, LinkedIn page entreprise).
- [ ] **J3** : Déployer cette démo sur Netlify/Vercel (voir §5) ; brancher le domaine.
- [ ] **J4–J5** : Brancher la vraie API de détection (`api.preuveia.fr/v1/detect` → GPTZero ou Copyleaks) ; conserver le fallback local.
- [ ] **J6** : Créer le compte Stripe réel + brancher le checkout (remplacer `pk_test_…` par `pk_live_…`) ; activer les 3 emails (Resend/Mailjet).
- [ ] **J7** : Bêta privée : 5 créateurs ciblés (via DMs X/LinkedIn), 15 jours gratuits contre témoignage. Remplacer les témoignages/statistiques illustratifs par les vrais retours.

### Semaine 2 — Acquisition (J8–J14)
- [ ] **J8–J9** : Threads X « J'ai scanné les 10 formations IA les plus vendues — voici les scores » (1 thread/jour × 3 jours). Chaque thread finit sur le scanner gratuit.
- [ ] **J10** : Outreach 50 créateurs (DMs + emails personnalisés) : « votre formation mérite d'être vérifiable — scan gratuit ».
- [ ] **J11** : Posts dans les communautés créateurs (r/BuildInPublic, Discord francophones) — apport de valeur, pas de spam.
- [ ] **J12** : SEO : soumettre le sitemap, faire pointer les 2 articles de blog vers le scanner ; publier l'article « j'ai scanné 100 formations ».
- [ ] **J13–J14** : Conversion de la bêta (offre de lancement : 2 mois à -50 %), collecte des témoignages, mise à jour des pages.

**Objectif fin J14** : 350 € MRR, 8 clients, 3 témoignages réels, 2 000 visites/mois.

---

## 5. Déploiement (Netlify / Vercel)

Site 100 % statique, zéro build requis.

**Netlify** :
```bash
cd preuveia
npx netlify-cli deploy --prod --dir=.
```
Ou : drag & drop du dossier sur app.netlify.com → Settings > Domain > ajouter `preuveia.fr` (HTTPS auto).

**Vercel** :
```bash
cd preuveia
npx vercel --prod
```

**Après déploiement** :
1. Remplacer les URLs absolues `https://preuveia.fr/...` (canonicals, JSON-LD, emails) par le vrai domaine.
2. Stripe live : remplacer la clé test dans `assets/js/inscription.js` et brancher le vrai checkout (les cartes ne doivent plus être gérées côté client).
3. API de détection : brancher `api.preuveia.fr/v1/detect` (voir `assets/js/scan.js`, fonction `detecterViaAPI`).
4. Registre central des badges : en production, la vérification doit s'appuyer sur une base de données serveur (le checksum local est un premier niveau anti-fraude, pas une preuve serveur).

---

## 6. Limites honnêtes du mode démo (à connaître avant de vendre)

1. **Analyse locale** : le score est calculé dans le navigateur (heuristique stylistique). En production il doit être calculé côté serveur (sinon le score est falsifiable).
2. **Vérification locale** : le registre des badges vit en localStorage (un navigateur). La vérification publique inter-navigateurs nécessite le backend.
3. **Paiement simulé** : aucun débit réel ; le tunnel est un prototype UX du checkout Stripe.
4. **Témoignages/chiffres illustratifs** : clairement marqués sur les pages, à remplacer par les retours de la bêta.
5. **CGU/mentions** : SIRET et immatriculation à compléter avant tout déploiement public.

---

## 7. Roadmap après lancement

1. Abonnement annuel (2 mois offerts) + paiement par virement pour les pros.
2. Détection vidéo/audio (vraie valeur pour les formations filmées) : transcription + analyse du style oral.
3. API publique documentée (plan Académie) + webhooks.
4. « Certificat de formation » horodaté (horodatage tiers) pour les clients B2B.
5. Extension du scoring aux pages de vente (analyse du texte marketing de la page).

---

© 2026 PreuveIA — Démonstration locale. Analyses simulées, paiement Stripe en mode test, témoignages et statistiques illustratifs.
