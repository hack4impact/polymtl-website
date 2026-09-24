/* Ressources de l'entrevue designer : cas fictif du Panier Solidaire. */
window.RESSOURCES = {
  organisme: 'Le Panier Solidaire',

  documents: [
    {
      id: 'brief',
      titre: 'Brief',
      sousTitre: 'Le problème en bref',
      blocs: [
        { type: 'intro', texte: "Le Panier Solidaire est une banque alimentaire de Montréal-Nord (organisme fictif). Chaque jeudi, elle distribue un panier d'épicerie à environ 180 familles." },
        { type: 'chiffres', items: [['74 min', "d'attente dehors en moyenne"], ['28 %', 'de rendez-vous manqués']] },
        { type: 'p', texte: "Aujourd'hui, tout le monde arrive à l'ouverture et fait la file. L'organisme veut une application mobile pour que chaque famille réserve une heure précise pour venir chercher son panier." },
        { type: 'h', texte: 'Contraintes' },
        { type: 'liste', items: [
          'Plusieurs utilisateurs lisent mal le français.',
          'Certains sont âgés : gros texte et gros boutons.',
        ] },
        { type: 'h', texte: 'Couleurs de l’organisme' },
        { type: 'couleurs', items: [['#2E7D4F', 'Vert'], ['#F28C28', 'Orange'], ['#FFF8EE', 'Crème'], ['#1F2A24', 'Encre']] },
      ],
    },

    {
      id: 'entrevues',
      titre: 'Entrevues',
      sousTitre: '3 utilisateurs rencontrés',
      blocs: [
        {
          type: 'entrevue',
          nom: 'Fatima',
          role: 'Mère de 3 enfants, 34 ans',
          citations: ['Attendre dehors avec les enfants en novembre, c’est très dur.', 'Parfois je ne comprends pas les messages en français.'],
          besoins: ['Choisir sa langue', 'Une heure précise'],
        },
        {
          type: 'entrevue',
          nom: 'Jean-Paul',
          role: 'Retraité, 76 ans',
          citations: ['Les petits boutons, je peux pas.', 'Je veux juste savoir quand venir.'],
          besoins: ['Gros boutons', 'Très peu d’étapes'],
        },
        {
          type: 'entrevue',
          nom: 'Marc',
          role: 'Bénévole à l’accueil',
          citations: ['Si les gens avaient un code, ça irait deux fois plus vite au comptoir.'],
          besoins: ['Un code à présenter'],
        },
      ],
    },

    {
      id: 'parcours-cible',
      titre: 'Parcours',
      sousTitre: 'Ce que la famille doit pouvoir faire',
      blocs: [
        {
          type: 'flux',
          etapes: [
            { titre: 'Voit les heures disponibles', note: 'Jeudi, créneaux de 15 minutes' },
            { titre: 'Choisit un créneau', note: 'Avec le nombre de places restantes' },
            { titre: 'Reçoit une confirmation', note: 'Heure, adresse et code à 4 chiffres' },
          ],
        },
      ],
    },

    {
      id: 'livrables',
      titre: 'Livrables',
      sousTitre: '20 minutes',
      blocs: [
        { type: 'etapes', items: [
          ['Choix du créneau', 'Les heures disponibles du jeudi et les places restantes.'],
          ['Confirmation', 'L’heure choisie, l’adresse et le code à présenter au comptoir.'],
        ] },
        { type: 'p', texte: 'Bonus : relie les deux écrans (Interaction dans l’inspecteur) et montre le résultat avec Présenter.' },
      ],
    },
  ],
};
