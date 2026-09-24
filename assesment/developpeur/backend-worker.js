/* Backend Python de l'entrevue : exécute backend/*.py avec Pyodide dans un Web Worker. */

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
importScripts(PYODIDE_URL + 'pyodide.js');

const FASTAPI_SHIM = `
import inspect


class HTTPException(Exception):
    def __init__(self, status_code, detail=None):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class FastAPI:
    def __init__(self, **kwargs):
        self.routes = {}

    def _route(self, method, path):
        def decorateur(fn):
            self.routes[(method, path)] = fn
            return fn
        return decorateur

    def get(self, path, **kwargs):
        return self._route("GET", path)

    def post(self, path, **kwargs):
        return self._route("POST", path)

    def put(self, path, **kwargs):
        return self._route("PUT", path)

    def patch(self, path, **kwargs):
        return self._route("PATCH", path)

    def delete(self, path, **kwargs):
        return self._route("DELETE", path)

    def _handle(self, method, path, body):
        fn = self.routes.get((method, path))
        if fn is None:
            if any(p == path for (_, p) in self.routes):
                return 405, {"detail": "Method Not Allowed"}
            return 404, {"detail": "Not Found"}
        try:
            if len(inspect.signature(fn).parameters) >= 1:
                result = fn(body if body is not None else {})
            else:
                result = fn()
        except HTTPException as e:
            return e.status_code, {"detail": e.detail}
        return 200, result
`;

const HARNESS = `
import sys, json, copy, importlib, traceback

sys.dont_write_bytecode = True
if "/lib" not in sys.path:
    sys.path.insert(0, "/lib")
if "/app/backend" not in sys.path:
    sys.path.insert(0, "/app/backend")

_etat = {"main": None, "points": {}, "captures": []}
MAX_CAPTURES = 40


def _relatif(chemin):
    return chemin[len("/app/"):] if chemin.startswith("/app/") else chemin


def _erreur(e):
    frames = []
    for f in traceback.extract_tb(e.__traceback__):
        if f.filename.startswith("/app/"):
            frames.append({"file": _relatif(f.filename), "line": f.lineno, "func": f.name, "code": f.line or ""})
    info = {"type": type(e).__name__, "message": str(e), "frames": frames}
    if isinstance(e, SyntaxError) and e.filename and e.filename.startswith("/app/"):
        info["message"] = e.msg
        info["syntax"] = {"file": _relatif(e.filename), "line": e.lineno or 1, "col": e.offset or 1, "code": (e.text or "").rstrip()}
        frames.append({"file": _relatif(e.filename), "line": e.lineno or 1, "func": "<module>", "code": (e.text or "").strip()})
    return info


def _purger():
    for nom, module in list(sys.modules.items()):
        fichier = getattr(module, "__file__", None) or ""
        if fichier.startswith("/app/"):
            del sys.modules[nom]


def _db():
    main = _etat["main"]
    db = getattr(main, "db", None) if main else None
    if db is None:
        return None
    try:
        return json.loads(json.dumps(db, default=repr))
    except Exception:
        return {"<erreur>": "db n'est pas sérialisable"}


def charger(garder_etat):
    ancien = _etat["main"]
    ancienne_db = None
    if garder_etat and ancien is not None and isinstance(getattr(ancien, "db", None), dict):
        ancienne_db = copy.deepcopy(ancien.db)
    _etat["main"] = None
    _purger()
    importlib.invalidate_caches()
    try:
        import main
        if not hasattr(main, "app"):
            raise RuntimeError("backend/main.py doit définir app = FastAPI()")
    except BaseException as e:
        return json.dumps({"ok": False, "error": _erreur(e)})
    conserve = False
    if ancienne_db is not None and isinstance(getattr(main, "db", None), dict):
        main.db.clear()
        main.db.update(ancienne_db)
        conserve = True
    _etat["main"] = main
    return json.dumps({"ok": True, "conserve": conserve, "db": _db(), "routes": [f"{m} {p}" for (m, p) in main.app.routes]})


def _repr(v):
    try:
        texte = repr(v)
    except Exception:
        texte = "<repr impossible>"
    return texte if len(texte) <= 300 else texte[:297] + "..."


def _trace(frame, event, arg):
    fichier = frame.f_code.co_filename
    if not fichier.startswith("/app/"):
        return None
    if event == "line":
        lignes = _etat["points"].get(_relatif(fichier))
        if lignes and frame.f_lineno in lignes and len(_etat["captures"]) < MAX_CAPTURES:
            pile = []
            f = frame
            while f is not None and f.f_code.co_filename.startswith("/app/"):
                pile.append({"file": _relatif(f.f_code.co_filename), "line": f.f_lineno, "func": f.f_code.co_name})
                f = f.f_back
            variables = {k: _repr(v) for k, v in frame.f_locals.items() if not k.startswith("__")}
            _etat["captures"].append({"file": _relatif(fichier), "line": frame.f_lineno, "func": frame.f_code.co_name, "locals": variables, "stack": pile})
    return _trace


def definir_points(points_json):
    _etat["points"] = {f: set(l) for f, l in json.loads(points_json).items() if l}
    return "true"


def requete(methode, chemin, corps_json):
    main = _etat["main"]
    if main is None:
        return json.dumps({"status": 503, "body": {"detail": "Le backend ne démarre pas : regarde l'erreur dans la console."}})
    corps = json.loads(corps_json) if corps_json else None
    _etat["captures"] = []
    tracer = any(_etat["points"].values())
    erreur = None
    if tracer:
        sys.settrace(_trace)
    try:
        statut, resultat = main.app._handle(methode, chemin, corps)
    except BaseException as e:
        statut, resultat = 500, {"detail": "Internal Server Error"}
        erreur = _erreur(e)
    finally:
        sys.settrace(None)
    try:
        corps_reponse = json.loads(json.dumps(resultat))
    except (TypeError, ValueError) as e:
        statut, corps_reponse = 500, {"detail": "Internal Server Error"}
        erreur = {"type": type(e).__name__, "message": "La réponse de la route n'est pas sérialisable en JSON : " + str(e), "frames": []}
    return json.dumps({"status": statut, "body": corps_reponse, "error": erreur, "captures": _etat["captures"], "db": _db()})


def reinitialiser():
    return charger(False)


# ---------- Tests ----------

def _nouvelle(p, **valeurs):
    pl = p.nouvelle_plante()
    pl.update(valeurs)
    return pl


# TODO 1 : arroser()

def t1_ajoute(p, main):
    pl = _nouvelle(p, eau=30)
    p.arroser(pl)
    assert pl["eau"] == 50, f"En partant de 30, un arrosage donne {pl['eau']:g} (attendu : 50)."


def t1_plafond(p, main):
    pl = _nouvelle(p, eau=60)
    for _ in range(10):
        p.arroser(pl)
    assert pl["eau"] == 100, f"Après 10 arrosages, eau = {pl['eau']:g} (attendu : 100)."


def t1_presque_plein(p, main):
    pl = _nouvelle(p, eau=95)
    p.arroser(pl)
    assert pl["eau"] == 100, f"En partant de 95, un arrosage donne {pl['eau']:g} (attendu : 100)."


def t1_autres(p, main):
    pl = _nouvelle(p, eau=40, lumiere=33, sante=77)
    p.arroser(pl)
    assert (pl["lumiere"], pl["sante"]) == (33, 77), "Arroser ne doit pas changer la lumière ni la santé."


# TODO 3 : simuler()

def t3_sante_monte(p, main):
    pl = _nouvelle(p, eau=60, lumiere=80, sante=50)
    p.simuler(pl, 5)
    assert pl["sante"] > 50, f"Bien entretenue, la santé passe de 50 à {pl['sante']:g} au lieu de monter."


def t3_grandit(p, main):
    pl = _nouvelle(p, eau=60, lumiere=80, croissance=0)
    p.simuler(pl, 5)
    assert pl["croissance"] > 0, f"Bien entretenue, la croissance reste à {pl['croissance']:g}."


def t3_sante_baisse(p, main):
    pl = _nouvelle(p, eau=5, lumiere=5, sante=50)
    p.simuler(pl, 5)
    assert pl["sante"] < 50, f"Négligée, la santé passe de 50 à {pl['sante']:g} au lieu de baisser."


def t3_pas_de_croissance(p, main):
    pl = _nouvelle(p, eau=5, lumiere=5, croissance=20)
    p.simuler(pl, 5)
    assert pl["croissance"] == 20, f"Négligée, la croissance passe de 20 à {pl['croissance']:g}."


def t3_fane(p, main):
    pl = _nouvelle(p, eau=0, lumiere=0, sante=3)
    p.simuler(pl, 10)
    assert pl["sante"] == 0 and pl["vivante"] is False, f"Négligée à 3 de santé pendant 10 s : santé = {pl['sante']:g}, vivante = {pl['vivante']} (attendu : 0, False)."


# TODO 5 : route /api/engrais

def _engrais(main):
    return main.app._handle("POST", "/api/engrais", None)


def t5_premiere(p, main):
    main.db["plante"] = p.nouvelle_plante()
    statut, corps = _engrais(main)
    assert statut == 200, f"La première dose renvoie le statut {statut} : {corps}."
    assert main.db["plante"]["croissance"] == p.CROISSANCE_PAR_ENGRAIS, "La première dose doit faire grandir la plante."


def t5_refus(p, main):
    main.db["plante"] = p.nouvelle_plante()
    _engrais(main)
    statut, _ = _engrais(main)
    assert statut == 429, f"Une deuxième dose immédiate renvoie le statut {statut} (attendu : 429)."


def t5_refus_sans_effet(p, main):
    main.db["plante"] = p.nouvelle_plante()
    _engrais(main)
    avant = main.db["plante"]["croissance"]
    _engrais(main)
    apres = main.db["plante"]["croissance"]
    assert apres == avant, f"La dose refusée fait passer la croissance de {avant:g} à {apres:g}."


def t5_message(p, main):
    main.db["plante"] = p.nouvelle_plante()
    _engrais(main)
    _, corps = _engrais(main)
    detail = corps.get("detail") if isinstance(corps, dict) else None
    assert isinstance(detail, str) and detail.strip(), "Le refus doit contenir un message dans detail."


def t5_avant_delai(p, main):
    main.db["plante"] = p.nouvelle_plante()
    _engrais(main)
    p.simuler(main.db["plante"], getattr(main, "DELAI_ENGRAIS", 30) - 1)
    statut, _ = _engrais(main)
    assert statut == 429, f"Une seconde avant la fin du délai, la dose renvoie le statut {statut} (attendu : 429)."


def t5_apres_delai(p, main):
    main.db["plante"] = p.nouvelle_plante()
    _engrais(main)
    p.simuler(main.db["plante"], getattr(main, "DELAI_ENGRAIS", 30))
    statut, _ = _engrais(main)
    assert statut == 200, f"Après DELAI_ENGRAIS secondes, la dose renvoie le statut {statut} (attendu : 200)."


TESTS = {
    "1": [
        ("Un arrosage ajoute 20 d'eau", t1_ajoute),
        ("L'eau ne dépasse jamais 100", t1_plafond),
        ("Arroser à 95 donne 100", t1_presque_plein),
        ("Arroser ne change pas les autres jauges", t1_autres),
    ],
    "3": [
        ("Bien entretenue, la santé monte", t3_sante_monte),
        ("Bien entretenue, la plante grandit", t3_grandit),
        ("Négligée, la santé baisse", t3_sante_baisse),
        ("Négligée, la plante ne grandit pas", t3_pas_de_croissance),
        ("Sans santé, la plante fane", t3_fane),
    ],
    "5": [
        ("La première dose est acceptée", t5_premiere),
        ("Une deuxième dose immédiate est refusée (429)", t5_refus),
        ("La dose refusée ne fait pas grandir la plante", t5_refus_sans_effet),
        ("Le refus contient un message", t5_message),
        ("Une seconde avant le délai, c'est encore refusé", t5_avant_delai),
        ("Après le délai, une nouvelle dose est acceptée", t5_apres_delai),
    ],
}


def lancer_tests(ids_json):
    ids = [i for i in json.loads(ids_json) if i in TESTS]
    main = _etat["main"]
    p = sys.modules.get("plante")
    resultats = []
    sauvegarde = copy.deepcopy(main.db) if main is not None and isinstance(getattr(main, "db", None), dict) else None
    for id_ in ids:
        for nom, test in TESTS[id_]:
            try:
                if main is None:
                    raise AssertionError("Le backend ne démarre pas : regarde l'erreur dans la console.")
                if p is None:
                    raise AssertionError("Le module plante n'est pas importé par main.py.")
                test(p, main)
                resultats.append({"todo": id_, "nom": nom, "ok": True, "message": ""})
            except AssertionError as e:
                resultats.append({"todo": id_, "nom": nom, "ok": False, "message": str(e) or "Échec"})
            except BaseException as e:
                info = _erreur(e)
                ou = f" ({info['frames'][-1]['file']}, ligne {info['frames'][-1]['line']})" if info["frames"] else ""
                resultats.append({"todo": id_, "nom": nom, "ok": False, "message": f"{info['type']} : {info['message']}{ou}"})
            finally:
                if sauvegarde is not None:
                    main.db.clear()
                    main.db.update(copy.deepcopy(sauvegarde))
    return json.dumps(resultats)
`;

let pyodide = null;

const pret = (async () => {
  pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  pyodide.setStdout({ batched: (texte) => postMessage({ type: 'log', level: 'log', text: texte }) });
  pyodide.setStderr({ batched: (texte) => postMessage({ type: 'log', level: 'error', text: texte }) });
  pyodide.FS.mkdirTree('/lib/fastapi');
  pyodide.FS.writeFile('/lib/fastapi/__init__.py', FASTAPI_SHIM);
  pyodide.FS.mkdirTree('/app/backend');
  pyodide.runPython(HARNESS);
  return pyodide.runPython('sys.version.split()[0]');
})();

function viderDossier(dossier) {
  const FS = pyodide.FS;
  for (const nom of FS.readdir(dossier)) {
    if (nom === '.' || nom === '..') continue;
    const chemin = dossier + '/' + nom;
    if (FS.isDir(FS.stat(chemin).mode)) {
      viderDossier(chemin);
      FS.rmdir(chemin);
    } else {
      FS.unlink(chemin);
    }
  }
}

function ecrireFichiers(fichiers) {
  viderDossier('/app');
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    const complet = '/app/' + chemin;
    pyodide.FS.mkdirTree(complet.slice(0, complet.lastIndexOf('/')));
    pyodide.FS.writeFile(complet, contenu);
  }
}

function appeler(nom, ...args) {
  const fn = pyodide.globals.get(nom);
  try {
    return JSON.parse(fn(...args));
  } finally {
    fn.destroy();
  }
}

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    const version = await pret;
    let result;
    switch (type) {
      case 'init':
        result = { version };
        break;
      case 'load':
        ecrireFichiers(data.files);
        result = appeler('charger', !!data.keepState);
        break;
      case 'reset':
        result = appeler('reinitialiser');
        break;
      case 'breakpoints':
        result = appeler('definir_points', JSON.stringify(data.points));
        break;
      case 'request':
        result = appeler('requete', data.method, data.path, data.body === undefined || data.body === null ? '' : JSON.stringify(data.body));
        break;
      case 'test':
        result = appeler('lancer_tests', JSON.stringify(data.ids || []));
        break;
      default:
        throw new Error('Message inconnu : ' + type);
    }
    postMessage({ id, ok: true, result });
  } catch (erreur) {
    postMessage({ id, ok: false, error: String(erreur && erreur.message || erreur) });
  }
};
