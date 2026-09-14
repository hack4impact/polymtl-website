# polymtl-website

## Candidatures étudiantes

Le formulaire `appliquer/index.html` (et `en/apply/index.html`) envoie les réponses à la fonction Netlify `netlify/functions/apply.mjs`, servie sur `/api/apply`. La fonction valide les champs et le CV, puis transmet le tout à un Apps Script du compte Google Hack4Impact. Le script crée un dossier `date - Prénom Nom` avec le CV en PDF et un Google Doc des réponses.

### Configuration

1. Avec le compte Google Hack4Impact, créer un dossier `Candidatures` dans le Drive et copier son ID (la fin de l'URL du dossier).
2. Sur script.google.com, créer un projet et coller le contenu de `apps-script/Code.gs`.
3. Dans Project Settings > Script properties, ajouter `ROOT_FOLDER_ID` (l'ID du dossier) et `SECRET` (une longue chaîne aléatoire).
4. Deploy > New deployment > Web app, avec Execute as: Me et Who has access: Anyone. Autoriser les accès demandés et copier l'URL `/exec`.
5. Dans le projet Netlify `polymtl-h4i`, sous Project configuration > Environment variables, ajouter `APPS_SCRIPT_URL` (l'URL `/exec`) et `APPS_SCRIPT_SECRET` (la même valeur que `SECRET`, cochée Contains secret values), avec au minimum le scope Functions, puis redéployer.

Le CV est limité à 4 Mo, parce que Netlify refuse les requêtes de fonction de plus de 6 Mo une fois encodées.

Après une modification de `Code.gs`, publier une nouvelle version dans Deploy > Manage deployments pour garder la même URL.