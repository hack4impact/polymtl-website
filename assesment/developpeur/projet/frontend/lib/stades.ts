export type Stade = {
  nom: string;
  min: number;
  feuilles: number;
  fleur: boolean;
};

// Du plus petit au plus grand
export const STADES: Stade[] = [
  { nom: "Graine", min: 0, feuilles: 0, fleur: false },
  { nom: "Pousse", min: 15, feuilles: 2, fleur: false },
  { nom: "Jeune plante", min: 40, feuilles: 4, fleur: false },
  { nom: "Plante", min: 70, feuilles: 6, fleur: false },
  { nom: "En fleur", min: 95, feuilles: 6, fleur: true },
];

export function choisirStade(croissance: number): Stade {
  // TODO 2 (facile) : la plante reste une graine pour toujours, même à 100 % de croissance.
  // Ajoute un console.log(croissance, stade.nom) dans la boucle et regarde la console :
  // quel stade est retourné, et pourquoi la boucle s'arrête-t-elle aussi tôt ?
  for (const stade of STADES) {
    if (croissance >= stade.min) {
      return stade;
    }
  }
  return STADES[0];
}
