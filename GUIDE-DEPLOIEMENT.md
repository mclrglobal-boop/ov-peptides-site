# Guide — Mettre votre site Pep-Trust en ligne

Ce guide vous explique, étape par étape, comment publier votre site sur internet. Pas besoin de savoir coder : tout se fait avec la souris, dans votre navigateur.

La méthode utilisée : **GitHub** (pour stocker vos fichiers) + **Netlify** (pour les rendre accessibles en ligne, gratuitement). C'est nécessaire pour que l'espace admin et l'espace client fonctionnent plus tard.

## Vos fichiers à publier

Dans votre dossier de travail, vous devez avoir :

```
index.html
outils-gratuits.html
espace-client.html
content/
  └── site.json
admin/
  ├── index.html
  └── config.yml
assets/
  ├── logo-ov-peptides.png
  ├── logo-ov-peptides-small.png
  └── supabase-config.js
```

(Le dossier `tmp_preview` n'est pas utile, vous pouvez l'ignorer.)

---

## Étape 1 — Créer un compte GitHub

1. Allez sur [github.com](https://github.com).
2. Cliquez sur **Sign up** et suivez les instructions (email, mot de passe, nom d'utilisateur).
3. Si vous avez déjà un compte, passez à l'étape 2.

## Étape 2 — Créer un dépôt (repository)

Un dépôt, c'est simplement le dossier en ligne qui va contenir votre site.

1. Une fois connecté, cliquez sur le bouton vert **New** (ou le **+** en haut à droite → **New repository**).
2. Donnez-lui un nom, par exemple `ov-peptides-site`.
3. Laissez-le en **Public** (ou Private si vous préférez, les deux fonctionnent avec Netlify).
4. Cliquez sur **Create repository**.

## Étape 3 — Mettre vos fichiers dans le dépôt

1. Sur la page de votre nouveau dépôt, cliquez sur **uploading an existing file** (ou **Add file → Upload files**).
2. Ouvrez le dossier contenant vos fichiers sur votre ordinateur, sélectionnez-les tous (fichiers ET dossiers `content`, `admin`, `assets`), puis **glissez-les** dans la zone de la page GitHub.
   - GitHub conserve automatiquement la structure des dossiers.
   - Si le glisser-déposer d'un dossier entier ne fonctionne pas dans votre navigateur, faites-le dossier par dossier (d'abord les 3 fichiers `.html` à la racine, puis ouvrez/créez `content`, `admin`, `assets` un par un).
3. En bas de page, écrivez un petit message, par exemple "Premier envoi du site".
4. Cliquez sur **Commit changes**.

Vos fichiers sont maintenant en ligne sur GitHub (mais pas encore visibles publiquement comme un site web — c'est Netlify qui va s'en charger).

## Étape 4 — Créer un compte Netlify

1. Allez sur [netlify.com](https://www.netlify.com) et cliquez sur **Sign up**.
2. Choisissez **Sign up with GitHub** — c'est le plus simple, ça relie directement les deux comptes.
3. Autorisez Netlify à accéder à votre compte GitHub quand c'est demandé.

## Étape 5 — Connecter votre dépôt à Netlify

1. Une fois sur votre tableau de bord Netlify, cliquez sur **Add new site → Import an existing project**.
2. Choisissez **GitHub**, puis sélectionnez le dépôt `ov-peptides-site` créé à l'étape 2.
3. Sur l'écran de configuration :
   - **Build command** : laissez vide.
   - **Publish directory** : laissez vide, ou mettez `.` (un simple point).
4. Cliquez sur **Deploy site**.

Netlify va publier votre site en 30 secondes à 1 minute. Vous obtenez une adresse du type `nom-au-hasard-123.netlify.app`.

## Étape 6 — Vérifier que tout fonctionne

1. Cliquez sur l'adresse fournie par Netlify pour ouvrir votre site.
2. Vérifiez que la page d'accueil s'affiche correctement, que le fond animé bouge, et que les liens du menu fonctionnent (Outils gratuits, Espace client...).
3. Le bouton **🔒 Admin** et **👤 Espace client** s'afficheront, mais ne seront pleinement fonctionnels qu'après avoir suivi les guides dédiés (étape suivante).

## Étape 7 (optionnel) — Changer le nom de votre site ou ajouter un vrai nom de domaine

1. Dans Netlify, allez dans **Site configuration → Change site name** pour choisir une adresse plus lisible, ex : `ov-peptides.netlify.app`.
2. Si vous avez acheté un nom de domaine (ex : `ov-peptides.com`), allez dans **Domain management → Add a domain** et suivez les instructions pour le relier.

---

## Et après ?

Votre site est en ligne, mais deux fonctionnalités ont besoin d'une configuration supplémentaire, chacune expliquée dans son propre guide :

- **`GUIDE-ADMIN.md`** — pour activer votre accès admin (modifier textes, prix, FAQ depuis une interface, sans toucher au code).
- **`GUIDE-ESPACE-CLIENT.md`** — pour activer les comptes clients (connexion, suivi de poids).

Chaque modification future : vous pouvez soit repasser par GitHub (Upload files → Commit) pour renvoyer des fichiers modifiés, soit utiliser l'espace admin une fois activé. Netlify republie automatiquement le site à chaque changement.
