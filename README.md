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

Renseignez soit un Measurement ID GA4 (`G-XXXXXXXXXX`), soit un identifiant de conteneur Google Tag Manager (`GTM-XXXXXXXX`). Tant qu’aucun identifiant valide n’est renseigné, aucun script Google n’est chargé. Mettre `ENABLE_ANALYTICS` à `false` désactive intégralement Analytics et le bandeau de consentement.

Le script ne charge GA4 qu’après acceptation explicite. Le choix (acceptation ou refus) expire au bout de six mois. Dans la propriété GA4, conservez uniquement les fonctionnalités de mesure, désactivez les signaux Google et les associations publicitaires, puis réglez la conservation des données sur deux mois.

Avant publication, remplacez les adresses e-mail `VOTRE-ADRESSE-EMAIL@EXEMPLE.FR` dans `privacy.html` et `legal.html`, et vérifiez les informations de l’hébergeur selon votre mode de déploiement. (fait)
