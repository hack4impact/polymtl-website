# Ma plante

Une application pour prendre soin d'une plante virtuelle : on l'arrose, on lui donne du soleil
et de l'engrais, et elle grandit de la graine jusqu'à la fleur.

Il reste 4 bugs, chacun marqué par un commentaire `TODO`.

## Structure

- `frontend/` : TypeScript et React (structure Next.js)
  - `app/page.tsx` : la page principale
  - `components/` : la plante, les jauges et les icônes
  - `lib/api.ts` : les appels au backend
  - `lib/stades.ts` : les stades de croissance
- `backend/` : Python (API compatible FastAPI, simplifiée)
  - `main.py` : les routes `/api/...`
  - `plante.py` : la logique de la plante

## Outils

- `Ctrl + S` : enregistrer et recharger l'application
- Console : `console.log` du frontend et `print()` du backend
- Réseau : les requêtes entre le frontend et le backend
- Débogueur : points d'arrêt dans les fichiers `.py` (clic dans la marge) et état de `db`
- Tests : le bouton Vérifier, à côté de chaque bug, lance ses tests unitaires
