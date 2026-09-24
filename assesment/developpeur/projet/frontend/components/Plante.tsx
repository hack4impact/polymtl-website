import type { Stade } from "../lib/stades";

type Props = {
  stade: Stade;
  sante: number;
  lumiere: number;
  vivante: boolean;
  effet: "eau" | "soleil" | "engrais" | null;
};

const HAUTEURS: Record<string, number> = {
  "Graine": 0,
  "Pousse": 44,
  "Jeune plante": 80,
  "Plante": 112,
  "En fleur": 124,
};

const BASE_X = 120;
const BASE_Y = 164;

// Mélange deux couleurs hexadécimales, t entre 0 et 1
function melanger(a: string, b: string, t: number): string {
  const ca = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const cb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export default function Plante({ stade, sante, lumiere, vivante, effet }: Props) {
  const hauteur = HAUTEURS[stade.nom] ?? 0;
  const sommet = BASE_Y - hauteur;
  const maladie = vivante ? 1 - Math.max(0, Math.min(100, sante)) / 100 : 1;
  const feuillage = vivante ? melanger("3f9e5a", "b8a24e", maladie) : "#8c6f4b";
  const tige = vivante ? melanger("2f7d46", "9a8742", maladie) : "#7a5f40";
  const taille = 0.75 + Math.min(stade.feuilles, 6) * 0.05;
  const clarte = Math.max(0, Math.min(100, lumiere)) / 100;

  const feuilles = Array.from({ length: stade.feuilles }, (_, i) => {
    const cote = i % 2 === 0 ? 1 : -1;
    const niveau = stade.feuilles === 2 ? 1 : 0.28 + (0.62 * i) / Math.max(stade.feuilles - 1, 1);
    return { cote, y: BASE_Y - hauteur * niveau, echelle: taille * (1.05 - niveau * 0.25) };
  });

  return (
    <svg className="plante" viewBox="0 0 320 250" role="img" aria-label={`Plante au stade ${stade.nom}`}>
      <defs>
        <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfe8f7" />
          <stop offset="70%" stopColor="#f3f1e6" />
        </linearGradient>
        <radialGradient id="halo">
          <stop offset="0%" stopColor="#ffe28a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffe28a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pot" x1="0" x2="1">
          <stop offset="0%" stopColor="#c9663c" />
          <stop offset="55%" stopColor="#e08556" />
          <stop offset="100%" stopColor="#c35f36" />
        </linearGradient>
      </defs>

      <rect width="320" height="250" fill="url(#ciel)" />
      <rect width="320" height="250" fill="#50607e" opacity={(1 - clarte) * 0.22} className="ombre-ciel" />

      <circle className="halo" cx="262" cy="50" r={34 + clarte * 18} fill="url(#halo)" opacity={0.3 + clarte * 0.7} />
      <g className="rayons" opacity={0.15 + clarte * 0.55}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="262" y1="27" x2="262" y2="21" transform={`rotate(${i * 30} 262 50)`} />
        ))}
      </g>
      <circle cx="262" cy="50" r="15" fill="#ffd45c" opacity={0.45 + clarte * 0.55} />
      {effet === "soleil" && (
        <g className="effet-soleil">
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="262" y1="22" x2="262" y2="12" transform={`rotate(${i * 45} 262 50)`} />
          ))}
        </g>
      )}

      <g className="nuage nuage-1" fill="#ffffff" opacity="0.85">
        <ellipse cx="62" cy="48" rx="26" ry="9" />
        <ellipse cx="74" cy="41" rx="15" ry="10" />
        <ellipse cx="52" cy="43" rx="11" ry="8" />
      </g>
      <g className="nuage nuage-2" fill="#ffffff" opacity="0.7">
        <ellipse cx="196" cy="86" rx="20" ry="6.5" />
        <ellipse cx="205" cy="81" rx="11" ry="7" />
      </g>

      <path d="M0 196 Q80 176 160 190 T320 184 V250 H0 Z" fill="#dce9d3" />
      <g className="herbes" stroke="#b9d3ad" strokeWidth="2" strokeLinecap="round" fill="none">
        {[24, 46, 70, 238, 262, 288, 304].map((x, i) => (
          <path key={i} className="herbe" style={{ animationDelay: `${i * 0.4}s` }} d={`M${x} ${226} q2 -8 -1 -14 M${x + 5} 226 q-1 -6 3 -11`} />
        ))}
      </g>
      <rect x="18" y="232" width="284" height="10" rx="3" fill="#d5ab80" />
      <rect x="18" y="239" width="284" height="11" fill="#bf905f" />

      <g transform="translate(40 -10)">
        <ellipse cx="120" cy="242" rx="54" ry="4" fill="#7a5433" opacity="0.25" />
        <path d="M74 176 L166 176 L156 236 Q155 242 148 242 L92 242 Q85 242 84 236 Z" fill="url(#pot)" />
        <rect x="64" y="160" width="112" height="20" rx="5" fill="#e8946a" />
        <rect x="64" y="174" width="112" height="6" fill="#b85a33" opacity="0.35" />
        <ellipse cx="120" cy="164" rx="50" ry="4.5" fill="#4b3223" />

        <g className={"plante-corps" + (vivante ? "" : " plante-fanee")} key={stade.nom}>
          {hauteur === 0 ? (
            <g>
              <ellipse cx={BASE_X} cy={BASE_Y - 3} rx="8" ry="5.5" fill="#8b5e3c" />
              <ellipse cx={BASE_X - 2.5} cy={BASE_Y - 5} rx="2.5" ry="1.4" fill="#b98a61" />
            </g>
          ) : (
            <g>
              <path
                d={`M${BASE_X} ${BASE_Y} C ${BASE_X - 5} ${BASE_Y - hauteur * 0.4}, ${BASE_X + 5} ${BASE_Y - hauteur * 0.7}, ${BASE_X} ${sommet}`}
                stroke={tige}
                strokeWidth={3 + taille * 1.6}
                strokeLinecap="round"
                fill="none"
              />
              {feuilles.map((f, i) => (
                <g key={i} transform={`translate(${BASE_X + f.cote * 1.5} ${f.y}) scale(${f.cote * f.echelle} ${f.echelle}) rotate(-22)`}>
                  <path d="M0 0 C8 -15 30 -17 44 -6 C31 5 12 7 0 0 Z" fill={feuillage} />
                  <path d="M2 -1 C14 -6 26 -7 40 -6" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.2" fill="none" />
                </g>
              ))}
              {stade.fleur && vivante && (
                <g transform={`translate(${BASE_X} ${sommet})`}>
                  <g className="fleur">
                    {Array.from({ length: 6 }, (_, i) => (
                      <ellipse key={i} cx="0" cy="-11" rx="7" ry="11" fill="#f39ab9" transform={`rotate(${i * 60})`} />
                    ))}
                    <circle r="7" fill="#f7c948" />
                    <circle r="3" cx="-2" cy="-2" fill="#fde7a0" />
                  </g>
                </g>
              )}
            </g>
          )}
        </g>

        {vivante && sante >= 70 && hauteur > 0 && (
          <g className="papillon">
            <g className="papillon-ailes">
              <ellipse cx="-5.5" cy="0" rx="7" ry="9" fill="#f39ab9" />
              <ellipse cx="5.5" cy="0" rx="7" ry="9" fill="#f7b267" />
            </g>
            <rect x="-1" y="-6.5" width="2" height="13" rx="1" fill="#5b3a29" />
          </g>
        )}

        {vivante && sante < 40 && hauteur > 0 && (
          <g transform={`translate(${BASE_X + 26} ${BASE_Y - hauteur * 0.6})`}>
            <path className="feuille-tombe" d="M0 0 C5 -8 16 -9 22 -3 C16 3 6 4 0 0 Z" fill={feuillage} />
          </g>
        )}

        {effet === "engrais" && (
          <circle className="onde-engrais" cx={BASE_X} cy={sommet + hauteur / 2} r="30" fill="none" stroke="#8cc95e" strokeWidth="3" />
        )}

        {effet === "engrais" && (
          <g className="effet-engrais">
            {[-34, -12, 14, 36].map((dx, i) => (
              <g key={i} transform={`translate(${120 + dx} ${120 - (i % 2) * 26})`}>
                <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" style={{ animationDelay: `${i * 90}ms` }} />
              </g>
            ))}
          </g>
        )}

        {effet === "eau" && (
          <g className="eclaboussure">
            <ellipse cx="120" cy="164" rx="18" ry="3" />
            <ellipse cx="120" cy="164" rx="18" ry="3" style={{ animationDelay: "0.25s" }} />
          </g>
        )}

        {effet === "eau" && (
          <g className="effet-eau">
            {[-26, -8, 10, 28].map((dx, i) => (
              <g key={i} transform={`translate(${120 + dx} 60)`}>
                <path d="M0 -7 C3 -2 5 1 5 3.5 A5 5 0 0 1 -5 3.5 C-5 1 -3 -2 0 -7 Z" style={{ animationDelay: `${i * 80}ms` }} />
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
