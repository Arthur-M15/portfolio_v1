# Portfolio — Arthur Maquin

Site personnel statique, sans dépendance ni outil de compilation. Il est directement publiable avec GitHub Pages.

## Utilisation

Ouvrez `index.html` dans un navigateur ou servez le dossier avec un serveur HTTP statique. Les textes de présentation, les projets et les liens de réseaux sociaux se modifient directement dans `index.html`.

La photo de profil est référencée sous `assets/profile.jpg`.

## Analytics

Toute la configuration se trouve en tête de `js/main.js` :

```js
const ENABLE_ANALYTICS = true;
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
```

Remplacez le Measurement ID avant toute mise en production. Tant que la valeur reste `G-XXXXXXXXXX`, aucun script Google Analytics n’est chargé. Mettre `ENABLE_ANALYTICS` à `false` désactive intégralement Analytics et le bandeau de consentement.
