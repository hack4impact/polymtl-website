"""Logique de la plante. Toutes les jauges vont de 0 à 100."""

EAU_PAR_ARROSAGE = 20
LUMIERE_PAR_SOLEIL = 15
CROISSANCE_PAR_ENGRAIS = 10

# Variations par seconde simulée
PERTE_EAU = 1.2
PERTE_LUMIERE = 0.8
GAIN_SANTE = 1.0
PERTE_SANTE = 1.5
VITESSE_CROISSANCE = 0.8


def nouvelle_plante(nom="Pousse"):
    return {
        "nom": nom,
        "eau": 60,
        "lumiere": 60,
        "sante": 100,
        "croissance": 0,
        "age": 0,
        "vivante": True,
        "dernier_engrais": None,
    }


def borner(valeur, minimum=0, maximum=100):
    """Garde une valeur entre minimum et maximum."""
    return max(minimum, min(maximum, valeur))


def arroser(plante):
    # TODO 1 : la jauge d'eau dépasse 100 % quand on arrose plusieurs fois de suite.
    # Regarde comment soleil() garde la lumière entre 0 et 100, puis fais la même chose ici.
    plante["eau"] = plante["eau"] + EAU_PAR_ARROSAGE
    return plante


def soleil(plante):
    plante["lumiere"] = borner(plante["lumiere"] + LUMIERE_PAR_SOLEIL)
    return plante


def est_en_forme(plante):
    bien_arrosee = 30 <= plante["eau"] <= 90
    bien_eclairee = plante["lumiere"] >= 25
    return bien_arrosee and bien_eclairee


def simuler(plante, secondes):
    """Fait avancer le temps, une seconde à la fois."""
    for _ in range(int(secondes)):
        if not plante["vivante"]:
            break

        plante["age"] += 1
        plante["eau"] = borner(plante["eau"] - PERTE_EAU)
        plante["lumiere"] = borner(plante["lumiere"] - PERTE_LUMIERE)

        # TODO 3 : la plante tombe malade quand on s'en occupe bien,
        # et elle grandit quand on la néglige. Lis attentivement les deux branches du if.
        # Astuce : clique dans la marge à gauche de la ligne du if pour poser un point d'arrêt,
        # puis regarde la valeur de en_forme dans l'onglet Débogueur.
        en_forme = est_en_forme(plante)
        if en_forme:
            plante["sante"] = borner(plante["sante"] - PERTE_SANTE)
        else:
            plante["sante"] = borner(plante["sante"] + GAIN_SANTE)
            plante["croissance"] = borner(plante["croissance"] + VITESSE_CROISSANCE)

        if plante["sante"] <= 0:
            plante["vivante"] = False

    return plante
