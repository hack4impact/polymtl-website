/* Notes de la première rencontre avec l'organisme fictif de l'entrevue PM. */
window.NOTES = {
  organisme: 'Maison des Jeunes Le Tremplin',
  rencontre: 'Rencontre de démarrage, 12 septembre',
  presents: 'Sophie (directrice), Karim (coordonnateur des activités), Léa (animatrice)',

  contexte: [
    'Organisme pour les 12 à 17 ans de Verdun (fictif).',
    '140 jeunes inscrits, environ 45 par soir, 18 activités par semaine.',
    'Inscriptions sur une feuille au babillard, autorisations parentales sur papier, présences dans Excel.',
  ],

  irritants: [
    ['Karim', '30 jeunes se sont inscrits pour 15 places au Laser Quest. On a fait un tirage au sort à la main.'],
    ['Léa', 'Un tiers des autorisations parentales arrivent le matin même, ou jamais.'],
    ['Sophie', 'Pour les subventions, je passe deux jours dans Excel à compter les jeunes.'],
  ],

  besoins: [
    { code: 'B1', texte: 'Voir le calendrier des activités de la semaine' },
    { code: 'B2', texte: 'S’inscrire à une activité, avec une limite de places' },
    { code: 'B3', texte: 'Liste d’attente quand une activité est pleine' },
    { code: 'B4', texte: 'Autorisation parentale en ligne pour les sorties' },
    { code: 'B5', texte: 'Prendre les présences sur la tablette de l’accueil' },
    { code: 'B6', texte: 'Statistiques de fréquentation pour les subventions' },
  ],

  idees: [
    { code: 'I1', texte: 'Badges et points de participation' },
    { code: 'I2', texte: 'Messagerie entre les jeunes' },
    { code: 'I3', texte: 'Paiement en ligne des sorties' },
  ],

  contraintes: [
    'Équipe de 4 étudiants : environ 8 points par sprint de 2 semaines, 4 sprints.',
    'Aucun budget, application web seulement.',
    'Utilisateurs mineurs : consentement parental obligatoire (Loi 25).',
  ],

  utilisateurs: ['Jeunes', 'Parents', 'Animateurs', 'Direction'],
};
