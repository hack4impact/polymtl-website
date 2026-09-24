from fastapi import FastAPI, HTTPException

import plante as p

app = FastAPI()

# Base de données en mémoire
db = {"plante": p.nouvelle_plante()}

DELAI_ENGRAIS = 30  # secondes simulées entre deux doses d'engrais


def verifier_vivante():
    if not db["plante"]["vivante"]:
        raise HTTPException(status_code=400, detail="Ta plante a fané. Replante-la pour recommencer.")


@app.get("/api/plante")
def lire_plante():
    return db["plante"]


@app.post("/api/tick")
def tick(donnees: dict):
    secondes = donnees.get("secondes", 1)
    return p.simuler(db["plante"], secondes)


@app.post("/api/arroser")
def arroser():
    verifier_vivante()
    return p.arroser(db["plante"])


@app.post("/api/soleil")
def soleil():
    verifier_vivante()
    return p.soleil(db["plante"])


@app.post("/api/engrais")
def engrais():
    verifier_vivante()
    plante = db["plante"]

    # TODO 4 : on peut spammer le bouton Engrais et la plante fleurit en dix clics.
    # Refuse une nouvelle dose si moins de DELAI_ENGRAIS secondes se sont écoulées depuis la
    # dernière. Compare plante["age"] avec plante["dernier_engrais"] (None avant la première dose).
    # Si c'est trop tôt, lève HTTPException(status_code=429, detail="...") avec un message clair :
    # le frontend affiche déjà le detail. Pense à mettre à jour plante["dernier_engrais"].
    plante["croissance"] = p.borner(plante["croissance"] + p.CROISSANCE_PAR_ENGRAIS)
    return plante


@app.post("/api/replanter")
def replanter(donnees: dict):
    db["plante"] = p.nouvelle_plante(donnees.get("nom") or "Pousse")
    return db["plante"]
