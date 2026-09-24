export type Plante = {
  nom: string;
  eau: number;
  lumiere: number;
  sante: number;
  croissance: number;
  age: number;
  vivante: boolean;
  dernier_engrais: number | null;
};

async function appeler(methode: "GET" | "POST", chemin: string, corps?: object): Promise<Plante> {
  const reponse = await fetch(chemin, {
    method: methode,
    headers: { "Content-Type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const donnees = await reponse.json();

  if (!reponse.ok) {
    throw new Error(donnees.detail ?? `Erreur ${reponse.status}`);
  }
  return donnees;
}

export const api = {
  lire: () => appeler("GET", "/api/plante"),
  tick: (secondes: number) => appeler("POST", "/api/tick", { secondes }),
  arroser: () => appeler("POST", "/api/arroser"),
  soleil: () => appeler("POST", "/api/soleil"),
  engrais: () => appeler("POST", "/api/engrais"),
  replanter: (nom: string) => appeler("POST", "/api/replanter", { nom }),
};
