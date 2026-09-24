import type { ReactNode } from "react";

type Props = {
  libelle: string;
  valeur: number;
  icone: ReactNode;
  ton: "eau" | "lumiere" | "sante";
};

const RAYON = 25;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

export default function Jauge({ libelle, valeur, icone, ton }: Props) {
  const pourcentage = Math.round(valeur);
  const critique = valeur < 25;
  const rempli = Math.max(0, Math.min(100, valeur)) / 100;

  return (
    <div className={`jauge jauge-${ton}` + (critique ? " jauge-critique" : "")} role="meter" aria-label={libelle} aria-valuenow={pourcentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="anneau">
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <circle className="anneau-piste" cx="30" cy="30" r={RAYON} />
          <circle className="anneau-valeur" cx="30" cy="30" r={RAYON} strokeDasharray={CIRCONFERENCE} strokeDashoffset={CIRCONFERENCE * (1 - rempli)} />
        </svg>
        <span className="anneau-icone">{icone}</span>
      </div>
      <span className="jauge-valeur">{pourcentage} %</span>
      <span className="jauge-libelle">{libelle}</span>
    </div>
  );
}
