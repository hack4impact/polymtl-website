"use client";

import { useEffect, useRef, useState } from "react";
import { api, type Plante as EtatPlante } from "../lib/api";
import { choisirStade, STADES } from "../lib/stades";
import Plante from "../components/Plante";
import Jauge from "../components/Jauge";
import { Coeur, Etincelle, Goutte, Soleil } from "../components/Icones";

const VITESSES = [1, 2, 5];
const SECONDES_PAR_JOUR = 10;

type Effet = "eau" | "soleil" | "engrais" | null;

function humeur(plante: EtatPlante): { texte: string; ton: "ok" | "alerte" | "danger" } {
  if (!plante.vivante) return { texte: "Fanée", ton: "danger" };
  if (plante.eau < 30) return { texte: "A soif", ton: "alerte" };
  if (plante.eau > 90) return { texte: "Trop arrosée", ton: "alerte" };
  if (plante.lumiere < 25) return { texte: "Manque de lumière", ton: "alerte" };
  if (plante.sante < 40) return { texte: "Mal en point", ton: "danger" };
  return { texte: "En pleine forme", ton: "ok" };
}

export default function Page() {
  const [plante, setPlante] = useState<EtatPlante | null>(null);
  const [vitesse, setVitesse] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [effet, setEffet] = useState<Effet>(null);
  const [nouveauNom, setNouveauNom] = useState("");
  const minuteries = useRef<{ message?: number; effet?: number }>({});

  function afficherErreur(erreur: Error) {
    setMessage(erreur.message);
    window.clearTimeout(minuteries.current.message);
    minuteries.current.message = window.setTimeout(() => setMessage(null), 3200);
  }

  function jouerEffet(nom: Effet) {
    setEffet(nom);
    window.clearTimeout(minuteries.current.effet);
    minuteries.current.effet = window.setTimeout(() => setEffet(null), 900);
  }

  useEffect(() => {
    api.lire().then(setPlante).catch(afficherErreur);
  }, []);

  // Le temps passe : chaque seconde, le backend simule `vitesse` secondes.
  useEffect(() => {
    const id = setInterval(() => {
      api.tick(vitesse).then(setPlante).catch(afficherErreur);
    }, 1000);
    return () => clearInterval(id);
  }, [vitesse]);

  async function agir(action: () => Promise<EtatPlante>, nom: Effet) {
    try {
      setPlante(await action());
      jouerEffet(nom);
    } catch (erreur) {
      afficherErreur(erreur as Error);
    }
  }

  async function replanter() {
    await agir(() => api.replanter(nouveauNom.trim()), null);
    setNouveauNom("");
  }

  if (!plante) {
    return <div className="chargement">{message ?? "Chargement de ta plante…"}</div>;
  }

  const stade = choisirStade(plante.croissance);
  const etat = humeur(plante);
  const jour = Math.floor(plante.age / SECONDES_PAR_JOUR) + 1;
  const prochain = STADES.find((s) => s.min > plante.croissance);

  return (
    <div className="carte">
      <header className="carte-entete">
        <div>
          <h1 className="nom">{plante.nom}</h1>
          <p className="details">
            {stade.nom}, jour {jour}
          </p>
        </div>
        <span className={`humeur humeur-${etat.ton}`}>{etat.texte}</span>
      </header>

      <div className="scene">
        <Plante stade={stade} sante={plante.sante} lumiere={plante.lumiere} vivante={plante.vivante} effet={effet} />

        {!plante.vivante && (
          <div className="fanee">
            <p className="fanee-titre">{plante.nom} a fané</p>
            <form
              className="fanee-form"
              onSubmit={(e) => {
                e.preventDefault();
                replanter();
              }}
            >
              <input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom de la nouvelle plante" aria-label="Nom de la nouvelle plante" />
              <button type="submit" className="bouton-principal">Replanter</button>
            </form>
          </div>
        )}
      </div>

      <section className="jauges">
        <Jauge libelle="Eau" valeur={plante.eau} icone={<Goutte />} ton="eau" />
        <Jauge libelle="Lumière" valeur={plante.lumiere} icone={<Soleil />} ton="lumiere" />
        <Jauge libelle="Santé" valeur={plante.sante} icone={<Coeur />} ton="sante" />
      </section>

      <section className="croissance">
        <div className="croissance-entete">
          <span>Croissance</span>
          <span>{Math.round(plante.croissance)} %</span>
        </div>
        <div className="croissance-piste">
          <div className="croissance-barre" style={{ width: `${Math.max(0, Math.min(100, plante.croissance))}%` }} />
        </div>
        <p className="croissance-suite">{prochain ? `${prochain.nom} à ${prochain.min} %` : "Croissance terminée"}</p>
      </section>

      <section className="actions">
        <button className="action action-eau" data-action="arroser" onClick={() => agir(api.arroser, "eau")} disabled={!plante.vivante}>
          <span className="action-icone"><Goutte /></span>
          <span className="action-texte">
            <b>Arroser</b>
            <small>+20 eau</small>
          </span>
        </button>
        <button className="action action-soleil" data-action="soleil" onClick={() => agir(api.soleil, "soleil")} disabled={!plante.vivante}>
          <span className="action-icone"><Soleil /></span>
          <span className="action-texte">
            <b>Soleil</b>
            <small>+15 lumière</small>
          </span>
        </button>
        <button className="action action-engrais" data-action="engrais" onClick={() => agir(api.engrais, "engrais")} disabled={!plante.vivante}>
          <span className="action-icone"><Etincelle /></span>
          <span className="action-texte">
            <b>Engrais</b>
            <small>+10 croissance</small>
          </span>
        </button>
      </section>

      <footer className="carte-pied">
        <span>Vitesse</span>
        <div className="vitesses" role="radiogroup" aria-label="Vitesse du temps">
          {VITESSES.map((v) => (
            <button key={v} role="radio" aria-checked={v === vitesse} data-vitesse={v} className={v === vitesse ? "actif" : ""} onClick={() => setVitesse(v)}>
              ×{v}
            </button>
          ))}
        </div>
      </footer>

      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
