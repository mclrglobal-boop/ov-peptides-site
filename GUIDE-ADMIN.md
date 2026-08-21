# Guide — Mode admin du site Pep-Trust

Ce guide explique comment mettre en ligne le mode d'administration : un écran de connexion avec identifiants, puis une interface pour modifier le contenu du site (textes, prix, FAQ, liens Stripe) sans toucher au code.

## Ce qui a été ajouté

- `content/site.json` — tout le contenu éditable du site (textes, formules, FAQ, footer).
- `index.html` — modifié pour charger son contenu depuis `content/site.json` au chargement de la page.
- `admin/index.html` et `admin/config.yml` — l'interface d'administration (Decap CMS), protégée par un vrai écran de connexion (Netlify Identity).

Le bouton "🔒 Admin" en haut à droite du site renvoie vers `/admin/`.

## Étape 1 — Ajouter les fichiers à votre dépôt GitHub

Copiez les dossiers/fichiers suivants dans votre dépôt existant (celui connecté à Netlify), en conservant l'arborescence :

```
votre-site/
├── index.html
├── outils-gratuits.html
├── content/
│   └── site.json
└── admin/
    ├── index.html
    └── config.yml
```

Puis commitez et poussez :

```
git add .
git commit -m "Ajout du mode admin (CMS)"
git push
```

Netlify va automatiquement redéployer le site après ce push.

## Étape 2 — Activer Netlify Identity

1. Allez sur app.netlify.com → votre site → **Site configuration** → **Identity**.
2. Cliquez sur **Enable Identity**.
3. Dans **Registration preferences**, choisissez **Invite only** (recommandé : seules les personnes que vous invitez explicitement peuvent créer un compte admin).

## Étape 3 — Activer Git Gateway

1. Toujours dans **Identity** → onglet **Services**.
2. Activez **Git Gateway**. C'est ce qui permet à l'interface d'édition d'enregistrer vos modifications directement dans votre dépôt GitHub, sans que vous ayez besoin de gérer un token GitHub personnel.

## Étape 4 — Vous inviter vous-même comme administrateur

1. Dans l'onglet **Identity**, cliquez sur **Invite users**.
2. Entrez votre adresse email.
3. Vous recevrez un email d'invitation — cliquez sur le lien, définissez votre mot de passe.

C'est ce couple **email + mot de passe** qui constitue vos identifiants de connexion admin.

## Étape 5 — Se connecter et modifier le site

1. Allez sur `https://votre-site.netlify.app/admin/`.
2. Connectez-vous avec l'email et le mot de passe définis à l'étape 4.
3. Vous arrivez sur une interface avec des formulaires (hero, formules, FAQ, footer, etc.) — modifiez ce que vous voulez, puis cliquez sur **Publish**.
4. Netlify redéploie automatiquement le site (1 à 2 minutes). Rechargez la page publique pour voir les changements.

## Important à savoir

- **Sécurité réelle** : contrairement à un mot de passe écrit dans le code JavaScript, cette fois l'authentification est gérée par Netlify (Identity + Git Gateway) — un vrai système de connexion, pas un simple gadget côté client.
- **Testing en local** : si vous ouvrez `index.html` directement en double-cliquant dessus (`file://...`), le contenu dynamique ne se chargera pas (les navigateurs bloquent ce type de requête en local). Cela fonctionne uniquement une fois le site servi via Netlify (ou un serveur local du type `npx serve`).
- **Qui peut éditer** : uniquement les personnes que vous invitez explicitement via l'onglet Identity. Vous pouvez en inviter d'autres plus tard (une associée, un community manager, etc.) sans jamais partager de mot de passe unique.
- **Historique** : chaque modification via l'admin crée un commit Git — vous avez donc un historique complet et pouvez revenir en arrière si besoin (via GitHub).
