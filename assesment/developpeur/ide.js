/* Environnement de l'entrevue développeur : éditeur Monaco, frontend React compilé dans le
   navigateur, backend Python (Pyodide) dans un Web Worker, console, réseau, débogueur et tests. */
(() => {
  'use strict';

  const MONACO = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min';
  const REACT = 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js';
  const REACT_DOM = 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js';
  const POLICES_APP = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap';
  const TYPES = [
    ['https://cdn.jsdelivr.net/npm/@types/react@18/index.d.ts', 'file:///node_modules/@types/react/index.d.ts'],
    ['https://cdn.jsdelivr.net/npm/@types/react@18/global.d.ts', 'file:///node_modules/@types/react/global.d.ts'],
    ['https://cdn.jsdelivr.net/npm/@types/react@18/jsx-runtime.d.ts', 'file:///node_modules/@types/react/jsx-runtime.d.ts'],
    ['https://cdn.jsdelivr.net/npm/@types/prop-types@15/index.d.ts', 'file:///node_modules/@types/prop-types/index.d.ts'],
    ['https://cdn.jsdelivr.net/npm/csstype@3/index.d.ts', 'file:///node_modules/csstype/index.d.ts'],
  ];

  const CLE_SESSION = 'h4i-eval-dev-v1';
  const CLE_DISPOSITION = 'h4i-eval-dev-layout';
  const DELAI_REQUETE = 5000;

  const FICHIERS = [
    'README.md',
    'frontend/app/layout.tsx',
    'frontend/app/page.tsx',
    'frontend/app/globals.css',
    'frontend/components/Plante.tsx',
    'frontend/components/Jauge.tsx',
    'frontend/components/Icones.tsx',
    'frontend/lib/api.ts',
    'frontend/lib/stades.ts',
    'backend/main.py',
    'backend/plante.py',
  ];

  const TACHES = [
    { id: '1', titre: "La jauge d'eau déborde", fichier: 'backend/plante.py', niveau: 'facile' },
    { id: '2', titre: 'La plante reste une graine', fichier: 'frontend/lib/stades.ts', niveau: 'facile' },
    { id: '3', titre: 'Malade quand on en prend soin', fichier: 'backend/plante.py', niveau: 'moyen' },
    { id: '4', titre: "Le temps s'emballe", fichier: 'frontend/app/page.tsx', niveau: 'moyen' },
    { id: '5', titre: "L'engrais à volonté", fichier: 'backend/main.py', niveau: 'difficile' },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

  function h(tag, props, ...enfants) {
    const n = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style') n.style.cssText = v;
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const e of enfants.flat(Infinity)) {
      if (e == null || e === false) continue;
      n.append(e.nodeType ? e : String(e));
    }
    return n;
  }

  const lire = (cle) => {
    try {
      return JSON.parse(localStorage.getItem(cle));
    } catch {
      return null;
    }
  };
  const ecrire = (cle, valeur) => {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
    } catch {
      /* stockage indisponible : la session reste en mémoire */
    }
  };

  const heure = (t = Date.now()) => {
    const d = new Date(t);
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  };
  const duree = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  const langage = (p) => (/\.tsx?$/.test(p) ? 'typescript' : p.endsWith('.py') ? 'python' : p.endsWith('.css') ? 'css' : p.endsWith('.md') ? 'markdown' : 'plaintext');
  const nomFichier = (p) => p.split('/').pop();

  // ---------- État ----------

  const etat = {
    fichiers: {},
    modeles: {},
    enregistres: {},
    vues: {},
    onglets: [],
    actif: null,
    points: {},
    todoDeco: {},
    resultats: {},
    enCours: new Set(),
    debut: null,
    fin: null,
    candidat: '',
    requetes: [],
    captures: [],
    fige: false,
    db: null,
    dernierBuild: null,
    backendPret: false,
    filtreConsole: 'tout',
    masquerTicks: false,
    requeteChoisie: null,
    erreursNonLues: 0,
    dossiersFermes: new Set(),
  };

  let monaco = null;
  let editeur = null;

  // ---------- Session ----------

  async function chargerSession() {
    const session = lire(CLE_SESSION);
    if (session && session.fichiers && FICHIERS.every((p) => typeof session.fichiers[p] === 'string')) {
      etat.fichiers = session.fichiers;
      etat.debut = session.debut || null;
      etat.fin = session.fin || null;
      etat.candidat = session.candidat || '';
      etat.resultats = session.resultats || {};
      // Le README est en lecture seule : toujours la version du serveur
      const r = await fetch('projet/README.md', { cache: 'no-cache' }).catch(() => null);
      if (r && r.ok) etat.fichiers['README.md'] = await r.text();
      return;
    }
    const contenus = await Promise.all(
      FICHIERS.map(async (p) => {
        const r = await fetch('projet/' + p, { cache: 'no-cache' });
        if (!r.ok) throw new Error(`Impossible de charger ${p} (${r.status})`);
        return [p, await r.text()];
      })
    );
    etat.fichiers = Object.fromEntries(contenus);
  }

  function sauverSession() {
    ecrire(CLE_SESSION, { fichiers: etat.fichiers, debut: etat.debut, fin: etat.fin, resultats: etat.resultats, candidat: etat.candidat });
  }

  // ---------- Disposition ----------

  function initialiserDisposition() {
    const racine = document.documentElement;
    const d = lire(CLE_DISPOSITION) || {};
    if (d.side) racine.style.setProperty('--side', d.side + 'px');
    if (d.preview) racine.style.setProperty('--preview', d.preview + 'px');
    if (d.panel) racine.style.setProperty('--panel', d.panel + 'px');
    else racine.style.setProperty('--preview', Math.round(Math.min(520, Math.max(380, innerWidth * 0.3))) + 'px');

    for (const poignee of $$('.resizer')) {
      poignee.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const type = poignee.dataset.resize;
        const depart = { x: e.clientX, y: e.clientY };
        const valeur = parseFloat(getComputedStyle(racine).getPropertyValue('--' + type));
        poignee.classList.add('dragging');
        document.body.classList.add('resizing');
        const bouger = (ev) => {
          let v;
          if (type === 'side') v = Math.min(420, Math.max(180, valeur + ev.clientX - depart.x));
          else if (type === 'preview') v = Math.min(innerWidth * 0.6, Math.max(320, valeur - (ev.clientX - depart.x)));
          else v = Math.min(innerHeight * 0.7, Math.max(110, valeur - (ev.clientY - depart.y)));
          racine.style.setProperty('--' + type, Math.round(v) + 'px');
        };
        const lacher = () => {
          poignee.classList.remove('dragging');
          document.body.classList.remove('resizing');
          removeEventListener('pointermove', bouger);
          removeEventListener('pointerup', lacher);
          const cs = getComputedStyle(racine);
          ecrire(CLE_DISPOSITION, {
            side: parseFloat(cs.getPropertyValue('--side')),
            preview: parseFloat(cs.getPropertyValue('--preview')),
            panel: parseFloat(cs.getPropertyValue('--panel')),
          });
        };
        addEventListener('pointermove', bouger);
        addEventListener('pointerup', lacher);
      });
    }
  }

  // ---------- Chronomètre et progression ----------

  function majChrono() {
    const texte = $('#timer-text');
    if (!etat.debut) {
      texte.textContent = '00:00';
      return;
    }
    texte.textContent = duree((etat.fin || Date.now()) - etat.debut);
    $('#timer').classList.toggle('done', !!etat.fin);
  }

  function majProgression() {
    const reussis = TACHES.filter((t) => etat.resultats[t.id]?.ok).length;
    $('#segments').replaceChildren(...TACHES.map((t) => h('span', { class: 'tb-seg' + (etat.resultats[t.id]?.ok ? ' ok' : ''), title: `TODO ${t.id} · ${t.titre}` })));
    $('#progress-text').replaceChildren(h('b', null, reussis), ` / ${TACHES.length} bugs réglés`);
    $('#todo-count').textContent = `${reussis}/${TACHES.length}`;
    const badge = $('#badge-tests');
    badge.textContent = `${reussis}/${TACHES.length}`;
    badge.classList.add('show');
    badge.classList.toggle('badge-ok', reussis === TACHES.length);

    if (reussis === TACHES.length && etat.debut && !etat.fin) {
      etat.fin = Date.now();
      sauverSession();
      majChrono();
      feliciter();
    }
  }

  function feliciter() {
    $('#bravo-time').textContent = duree(etat.fin - etat.debut);
    $('#dlg-bravo').showModal();
  }

  // ---------- Explorateur et tâches ----------

  function iconeFichier(p) {
    if (p.endsWith('.tsx')) return h('span', { class: 'ficon ficon-tsx', html: '<svg viewBox="-12 -11 24 22" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.3"><ellipse rx="10" ry="4"/><ellipse rx="10" ry="4" transform="rotate(60)"/><ellipse rx="10" ry="4" transform="rotate(120)"/><circle r="1.6" fill="currentColor" stroke="none"/></svg>' });
    if (p.endsWith('.ts')) return h('span', { class: 'ficon ficon-ts' }, 'TS');
    if (p.endsWith('.py')) return h('span', { class: 'ficon ficon-py' }, 'PY');
    if (p.endsWith('.css')) return h('span', { class: 'ficon ficon-css' }, '#');
    if (p.endsWith('.md')) return h('span', { class: 'ficon ficon-md', html: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>' });
    return h('span', { class: 'ficon' });
  }

  function lignesTodo(p) {
    const modele = etat.modeles[p];
    const texte = modele ? modele.getValue() : etat.fichiers[p] || '';
    const trouve = [];
    texte.split('\n').forEach((ligne, i) => {
      const m = ligne.match(/(?:\/\/|#)\s*TODO\s+(\d+)/);
      if (m) trouve.push({ id: m[1], ligne: i + 1 });
    });
    return trouve;
  }

  function estModifie(p) {
    const m = etat.modeles[p];
    return !!m && m.getAlternativeVersionId() !== etat.enregistres[p];
  }

  function rendreArbre() {
    const arbre = {};
    for (const p of FICHIERS) {
      const parts = p.split('/');
      let noeud = arbre;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) noeud[part] = p;
        else noeud = noeud[part] = noeud[part] || {};
      });
    }
    const lignes = [];
    const parcourir = (noeud, profondeur, prefixe) => {
      const entrees = Object.entries(noeud).sort(([a, va], [b, vb]) => {
        const da = typeof va === 'object', db = typeof vb === 'object';
        return da !== db ? (da ? -1 : 1) : a.localeCompare(b);
      });
      for (const [nom, valeur] of entrees) {
        if (typeof valeur === 'object') {
          const chemin = prefixe + nom;
          const ferme = etat.dossiersFermes.has(chemin);
          lignes.push(
            h('button', { class: 'tree-row tree-dir' + (ferme ? ' closed' : ''), style: `--depth:${profondeur}`, type: 'button', role: 'treeitem', 'aria-expanded': String(!ferme), onclick: () => { ferme ? etat.dossiersFermes.delete(chemin) : etat.dossiersFermes.add(chemin); rendreArbre(); } },
              h('span', { class: 'chev', html: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' }),
              h('span', { class: 'ficon ficon-dir', html: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" opacity="0.85"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2h8.8A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/></svg>' }),
              h('span', { class: 'tree-name' }, nom)
            )
          );
          if (!ferme) parcourir(valeur, profondeur + 1, chemin + '/');
        } else {
          const todos = lignesTodo(valeur).filter((t) => TACHES.some((x) => x.id === t.id));
          const tousOk = todos.length > 0 && todos.every((t) => etat.resultats[t.id]?.ok);
          lignes.push(
            h('button', { class: 'tree-row' + (etat.actif === valeur ? ' active' : ''), style: `--depth:${profondeur}`, type: 'button', role: 'treeitem', title: valeur, onclick: () => ouvrir(valeur) },
              h('span', { class: 'chev', style: 'visibility:hidden', html: '<svg width="12" height="12"></svg>' }),
              iconeFichier(valeur),
              h('span', { class: 'tree-name' }, nom),
              h('span', { class: 'tree-meta' },
                todos.length > 0 && h('span', { class: 'tree-todo' + (tousOk ? ' ok' : ''), title: `${todos.length} TODO` }, tousOk ? '✓' : todos.length)
              )
            )
          );
        }
      }
    };
    parcourir(arbre, 0, '');
    $('#tree').replaceChildren(...lignes);
  }

  function resumeTests(r) {
    if (!r) return 'Non vérifié';
    const reussis = r.tests.filter((x) => x.ok).length;
    return `${reussis}/${r.tests.length} tests`;
  }

  function rendreTaches() {
    $('#todos').replaceChildren(
      ...TACHES.map((t) => {
        const r = etat.resultats[t.id];
        const enCours = etat.enCours.has(t.id);
        const ligne = lignesTodo(t.fichier).find((x) => x.id === t.id);
        const statut = enCours ? ' running' : r ? (r.ok ? ' ok' : ' fail') : '';
        return h('li', { class: 'todo' + statut },
          h('button', { class: 'todo-main', type: 'button', onclick: () => ouvrir(t.fichier, ligne?.ligne) },
            h('span', { class: 'todo-status' }, enCours ? h('span', { class: 'spinner' }) : r ? (r.ok ? '✓' : '✕') : ''),
            h('span', null,
              h('span', { class: 'todo-title' }, t.titre),
              h('span', { class: 'todo-meta' }, `${t.niveau[0].toUpperCase() + t.niveau.slice(1)} · ${enCours ? 'Vérification…' : resumeTests(r)}`)
            )
          ),
          h('button', { class: 'todo-check', type: 'button', disabled: enCours, title: `Lancer les tests du TODO ${t.id}`, onclick: () => verifier([t.id]) }, 'Vérifier')
        );
      })
    );
  }

  // ---------- Onglets et éditeur ----------

  function rendreOnglets() {
    $('#tabs').replaceChildren(
      ...etat.onglets.map((p) =>
        h('div', { class: 'tab' + (p === etat.actif ? ' active' : '') + (estModifie(p) ? ' dirty' : ''), role: 'tab', title: p, onclick: () => ouvrir(p), onauxclick: (e) => e.button === 1 && fermer(p) },
          iconeFichier(p),
          h('span', null, nomFichier(p)),
          h('span', { class: 'tab-close', role: 'button', title: 'Fermer', onclick: (e) => { e.stopPropagation(); fermer(p); }, html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' })
        )
      )
    );
    const actif = $('.tab.active');
    if (actif) actif.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    $('#btn-save').classList.toggle('dirty', FICHIERS.some(estModifie));
  }

  function echapperHtml(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function enLigne(t) {
    return echapperHtml(t)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  // Rendu Markdown minimal : titres, paragraphes, listes imbriquées, code en ligne, gras, liens
  function rendreMarkdown(texte) {
    const html = [];
    let paragraphe = [];
    const pile = [];
    const fermerParagraphe = () => {
      if (paragraphe.length) html.push(`<p>${enLigne(paragraphe.join(' '))}</p>`);
      paragraphe = [];
    };
    const fermerListes = (niveau) => {
      while (pile.length > niveau) {
        html.push('</li></ul>');
        pile.pop();
      }
    };
    for (const ligne of texte.split('\n')) {
      const titre = ligne.match(/^(#{1,3})\s+(.*)$/);
      const puce = ligne.match(/^(\s*)[-*]\s+(.*)$/);
      if (titre) {
        fermerParagraphe();
        fermerListes(0);
        html.push(`<h${titre[1].length}>${enLigne(titre[2])}</h${titre[1].length}>`);
      } else if (puce) {
        fermerParagraphe();
        const niveau = Math.floor(puce[1].length / 2) + 1;
        if (niveau > pile.length) {
          while (pile.length < niveau) {
            html.push('<ul><li>');
            pile.push(true);
          }
        } else {
          fermerListes(niveau);
          html.push('</li><li>');
        }
        html.push(enLigne(puce[2]));
      } else if (!ligne.trim()) {
        fermerParagraphe();
        fermerListes(0);
      } else if (pile.length) {
        html.push(' ' + enLigne(ligne.trim()));
      } else {
        paragraphe.push(ligne.trim());
      }
    }
    fermerParagraphe();
    fermerListes(0);
    return html.join('');
  }

  function ouvrir(p, ligne) {
    if (!editeur || !etat.modeles[p]) return;
    const apercu = p.endsWith('.md');
    if (etat.actif && etat.actif !== p && !etat.actif.endsWith('.md')) etat.vues[etat.actif] = editeur.saveViewState();
    if (!etat.onglets.includes(p)) etat.onglets.push(p);
    $('#md-preview').hidden = !apercu;
    $('#editor').style.visibility = apercu ? 'hidden' : '';
    if (apercu) {
      etat.actif = p;
      $('#md-preview').innerHTML = `<article class="md">${rendreMarkdown(etat.fichiers[p])}</article>`;
      rendreOnglets();
      rendreArbre();
      majBarreEtat();
      return;
    }
    if (etat.actif !== p) {
      etat.actif = p;
      editeur.setModel(etat.modeles[p]);
      if (etat.vues[p]) editeur.restoreViewState(etat.vues[p]);
    }
    rendreOnglets();
    rendreArbre();
    majBarreEtat();
    if (ligne) {
      editeur.revealLineInCenter(ligne);
      editeur.setPosition({ lineNumber: ligne, column: etat.modeles[p].getLineFirstNonWhitespaceColumn(ligne) || 1 });
      flash(p, ligne, 'flash-line', 1600);
    }
    editeur.focus();
  }

  function fermer(p) {
    const i = etat.onglets.indexOf(p);
    if (i < 0) return;
    etat.onglets.splice(i, 1);
    if (etat.actif === p) {
      etat.vues[p] = editeur.saveViewState();
      etat.actif = null;
      const suivant = etat.onglets[Math.min(i, etat.onglets.length - 1)];
      if (suivant) ouvrir(suivant);
      else {
        $('#md-preview').hidden = true;
        $('#editor').style.visibility = '';
        editeur.setModel(null);
        rendreOnglets();
        rendreArbre();
      }
    } else {
      rendreOnglets();
    }
  }

  function flash(p, ligne, classe, ms) {
    const m = etat.modeles[p];
    if (!m || ligne > m.getLineCount()) return;
    const ids = m.deltaDecorations([], [{ range: new monaco.Range(ligne, 1, ligne, 1), options: { isWholeLine: true, className: classe } }]);
    setTimeout(() => m.deltaDecorations(ids, []), ms);
  }

  function majBarreEtat() {
    if (!editeur) return;
    const pos = editeur.getPosition();
    $('#sb-cursor').textContent = pos && etat.actif && !etat.actif.endsWith('.md') ? `Ln ${pos.lineNumber}, Col ${pos.column}` : '';
    const noms = { typescript: 'TypeScript React', python: 'Python', css: 'CSS', markdown: 'Markdown · lecture seule' };
    $('#sb-lang').textContent = etat.actif ? (etat.actif.endsWith('.ts') ? 'TypeScript' : noms[langage(etat.actif)] || '') : '';
  }

  function majDecorationsTodo(p) {
    const m = etat.modeles[p];
    if (!m) return;
    const deco = lignesTodo(p).map((t) => {
      let fin = t.ligne;
      while (fin < m.getLineCount() && /^\s*(\/\/|#)/.test(m.getLineContent(fin + 1))) fin++;
      const ok = etat.resultats[t.id]?.ok;
      return { range: new monaco.Range(t.ligne, 1, fin, 1), options: { isWholeLine: true, className: ok ? '' : 'todo-line', linesDecorationsClassName: 'todo-margin' + (ok ? ' ok' : '') } };
    });
    etat.todoDeco[p] = m.deltaDecorations(etat.todoDeco[p] || [], deco);
  }

  // ---------- Points d'arrêt ----------

  function lignesPoints(p) {
    const m = etat.modeles[p];
    if (!m || !etat.points[p]) return [];
    return [...new Set(etat.points[p].map((id) => m.getDecorationRange(id)?.startLineNumber).filter(Boolean))].sort((a, b) => a - b);
  }

  function definirPoints(p, lignes) {
    const m = etat.modeles[p];
    etat.points[p] = m.deltaDecorations(etat.points[p] || [], lignes.map((l) => ({
      range: new monaco.Range(l, 1, l, 1),
      options: { isWholeLine: true, glyphMarginClassName: 'bp-glyph', className: 'bp-line', glyphMarginHoverMessage: { value: "Point d'arrêt : clique pour le retirer" }, stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges },
    })));
    envoyerPoints();
    rendrePoints();
  }

  function basculerPoint(p, ligne) {
    const lignes = lignesPoints(p);
    definirPoints(p, lignes.includes(ligne) ? lignes.filter((l) => l !== ligne) : [...lignes, ligne]);
  }

  function tousLesPoints() {
    const tous = {};
    for (const p of FICHIERS) if (p.endsWith('.py')) tous[p] = lignesPoints(p);
    return tous;
  }

  function envoyerPoints() {
    if (etat.backendPret) backend.envoyer('breakpoints', { points: tousLesPoints() }).catch(() => {});
  }

  function rendrePoints() {
    const puces = [];
    for (const [p, lignes] of Object.entries(tousLesPoints())) {
      for (const l of lignes) {
        puces.push(h('span', { class: 'bp-chip' },
          h('button', { class: 'loc', type: 'button', onclick: () => ouvrir(p, l) }, `${nomFichier(p)}:${l}`),
          h('button', { class: 'bp-chip-x', type: 'button', title: 'Retirer', onclick: () => basculerPoint(p, l), html: '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' })
        ));
      }
    }
    $('#bp-list').replaceChildren(...puces);
    if (!etat.captures.length) rendreCaptures();
  }

  let survol = [];
  function installerMarge() {
    editeur.onMouseDown((e) => {
      const t = e.target;
      if (t.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || !t.position || !etat.actif) return;
      if (etat.actif.endsWith('.py')) {
        basculerPoint(etat.actif, t.position.lineNumber);
      } else if (!installerMarge.averti) {
        installerMarge.averti = true;
        journal('systeme', 'info', ["Les points d'arrêt fonctionnent dans les fichiers Python. Pour le frontend, utilise console.log(), ou l'instruction debugger; avec les DevTools du navigateur (F12)."]);
        montrerPanneau('console');
      }
    });
    editeur.onMouseMove((e) => {
      const m = editeur.getModel();
      if (!m) return;
      const t = e.target;
      const surMarge = !!t.position && t.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && etat.actif?.endsWith('.py');
      survol = m.deltaDecorations(survol, surMarge && !lignesPoints(etat.actif).includes(t.position.lineNumber) ? [{ range: new monaco.Range(t.position.lineNumber, 1, t.position.lineNumber, 1), options: { glyphMarginClassName: 'bp-hover' } }] : []);
    });
    editeur.onMouseLeave(() => {
      const m = editeur.getModel();
      if (m) survol = m.deltaDecorations(survol, []);
    });
  }

  // ---------- Monaco ----------

  function chargerMonaco() {
    return new Promise((resoudre, rejeter) => {
      window.MonacoEnvironment = {
        getWorkerUrl: () => 'data:text/javascript;charset=utf-8,' + encodeURIComponent(`self.MonacoEnvironment = { baseUrl: '${MONACO}/' }; importScripts('${MONACO}/vs/base/worker/workerMain.js');`),
      };
      const s = document.createElement('script');
      s.src = MONACO + '/vs/loader.js';
      s.onerror = () => rejeter(new Error("Impossible de charger l'éditeur (vérifie la connexion internet)."));
      s.onload = () => {
        window.require.config({ paths: { vs: MONACO + '/vs' } });
        const editeurPrincipal = () => window.require(['vs/editor/editor.main'], () => resoudre(window.monaco), rejeter);
        window.require(['vs/nls.messages.fr'], editeurPrincipal, editeurPrincipal);
      };
      document.head.append(s);
    });
  }

  function configurerMonaco() {
    const ts = monaco.languages.typescript;
    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.ReactJSX,
      lib: ['es2020', 'dom', 'dom.iterable'],
      strict: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      isolatedModules: true,
      skipLibCheck: true,
      allowNonTsExtensions: true,
      inlineSourceMap: true,
      inlineSources: true,
    });
    ts.typescriptDefaults.setEagerModelSync(true);
    ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    ts.typescriptDefaults.addExtraLib('declare module "*.css";', 'file:///node_modules/@types/css/index.d.ts');

    Promise.all(TYPES.map(([url]) => fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(url))))))
      .then((contenus) => {
        contenus.forEach((c, i) => ts.typescriptDefaults.addExtraLib(c, TYPES[i][1]));
        ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
      })
      .catch(() => {
        /* sans les types de React, on garde seulement la validation syntaxique */
      });

    monaco.editor.defineTheme('h4i', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b94a3', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: '1a7f37' },
        { token: 'number', foreground: 'b35900' },
        { token: 'type', foreground: '0b6bcb' },
        { token: 'type.identifier', foreground: '0b6bcb' },
        { token: 'identifier', foreground: '18202c' },
        { token: 'delimiter', foreground: '566173' },
        { token: 'tag', foreground: 'c2185b' },
        { token: 'attribute.name', foreground: '9a5b00' },
        { token: 'regexp', foreground: 'c2185b' },
      ],
      colors: {
        'editor.background': '#fbfdff',
        'editor.foreground': '#18202c',
        'editorLineNumber.foreground': '#b3c1d6',
        'editorLineNumber.activeForeground': '#4d5e79',
        'editor.lineHighlightBackground': '#eef4fc',
        'editor.lineHighlightBorder': '#00000000',
        'editor.selectionBackground': '#cfe0ff',
        'editor.inactiveSelectionBackground': '#e3ecfb',
        'editorCursor.foreground': '#2463d9',
        'editorIndentGuide.background1': '#e6edf7',
        'editorIndentGuide.activeBackground1': '#d9dde4',
        'editorWhitespace.foreground': '#e2e5ea',
        'editorWidget.background': '#fbfdff',
        'editorWidget.border': '#c9d6e6',
        'editorSuggestWidget.background': '#ffffff',
        'editorSuggestWidget.border': '#d9dde4',
        'editorSuggestWidget.selectedBackground': '#e8f0fe',
        'editorHoverWidget.background': '#ffffff',
        'editorHoverWidget.border': '#d9dde4',
        'editorGutter.background': '#fbfdff',
        'editorBracketMatch.background': '#2563eb14',
        'editorBracketMatch.border': '#2563eb55',
        'scrollbarSlider.background': '#18202c14',
        'scrollbarSlider.hoverBackground': '#18202c24',
        'scrollbarSlider.activeBackground': '#18202c33',
        'editorOverviewRuler.border': '#00000000',
        'editorError.foreground': '#d93848',
        'editorWarning.foreground': '#b86e00',
      },
    });

    for (const p of FICHIERS) {
      const m = monaco.editor.createModel(etat.fichiers[p], langage(p), monaco.Uri.parse('file:///' + p));
      m.updateOptions({ tabSize: p.endsWith('.py') ? 4 : 2, insertSpaces: true });
      etat.modeles[p] = m;
      etat.enregistres[p] = m.getAlternativeVersionId();
      let minuterie;
      m.onDidChangeContent(() => {
        rendreOnglets();
        clearTimeout(minuterie);
        minuterie = setTimeout(() => {
          rendreArbre();
          rendreTaches();
          majDecorationsTodo(p);
          rendrePoints();
        }, 250);
      });
      majDecorationsTodo(p);
    }

    editeur = monaco.editor.create($('#editor'), {
      model: null,
      theme: 'h4i',
      fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace",
      fontSize: 13.5,
      lineHeight: 21,
      fontLigatures: false,
      glyphMargin: true,
      lineNumbersMinChars: 3,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'all',
      padding: { top: 14, bottom: 14 },
      bracketPairColorization: { enabled: true },
      guides: { indentation: true, bracketPairs: false },
      automaticLayout: true,
      wordWrap: 'off',
      tabSize: 2,
      fixedOverflowWidgets: true,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
    });
    editeur.onDidChangeCursorPosition(majBarreEtat);
    editeur.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => enregistrer());
    installerMarge();
  }

  // ---------- Backend Python ----------

  const backend = {
    worker: null,
    seq: 0,
    attente: new Map(),
    pret: null,
    version: '',

    demarrer() {
      etat.backendPret = false;
      majStatutBackend('wait', 'Backend : démarrage de Python…');
      this.worker = new Worker('backend-worker.js');
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'log') {
          journal('backend', data.level, [data.text]);
          return;
        }
        const attente = this.attente.get(data.id);
        if (!attente) return;
        this.attente.delete(data.id);
        clearTimeout(attente.minuterie);
        data.ok ? attente.resoudre(data.result) : attente.rejeter(new Error(data.error));
      };
      this.worker.onerror = (e) => {
        journal('systeme', 'error', ['Le worker Python a planté : ' + (e.message || 'erreur inconnue')]);
      };
      this.pret = this.envoyer('init').then((r) => {
        this.version = r.version;
        return r;
      });
      return this.pret;
    },

    envoyer(type, donnees = {}, delai = 0) {
      const id = ++this.seq;
      return new Promise((resoudre, rejeter) => {
        const attente = { resoudre, rejeter, minuterie: null };
        if (delai) {
          attente.minuterie = setTimeout(() => {
            this.attente.delete(id);
            rejeter(new Error('delai'));
            this.redemarrer();
          }, delai);
        }
        this.attente.set(id, attente);
        this.worker.postMessage({ id, type, ...donnees });
      });
    },

    async redemarrer() {
      journal('systeme', 'error', [`Le backend ne répond plus depuis ${DELAI_REQUETE / 1000} s (boucle infinie ?). Redémarrage de Python…`]);
      this.worker.terminate();
      for (const a of this.attente.values()) {
        clearTimeout(a.minuterie);
        a.rejeter(new Error('redemarrage'));
      }
      this.attente.clear();
      await this.demarrer();
      await chargerBackend(false);
    },
  };

  function majStatutBackend(ton, texte) {
    const n = $('#sb-backend');
    n.textContent = texte;
    n.classList.toggle('sb-err', ton === 'err');
  }

  function fichiersBackend() {
    return Object.fromEntries(FICHIERS.filter((p) => p.startsWith('backend/')).map((p) => [p, etat.fichiers[p]]));
  }

  async function chargerBackend(garderEtat) {
    await backend.pret;
    etat.backendPret = true;
    let r;
    try {
      r = await backend.envoyer('load', { files: fichiersBackend(), keepState: garderEtat }, 15000);
    } catch {
      return false;
    }
    for (const p of FICHIERS) if (p.endsWith('.py')) monaco.editor.setModelMarkers(etat.modeles[p], 'python', []);
    if (!r.ok) {
      majStatutBackend('err', 'Backend : erreur au démarrage');
      journalErreurPython(r.error, 'Démarrage du backend');
      marquerErreurPython(r.error);
      return false;
    }
    majStatutBackend('ok', `Backend : Python ${backend.version} · prêt`);
    envoyerPoints();
    majDb(r.db);
    return r;
  }

  function marquerErreurPython(erreur) {
    const ou = erreur.syntax || erreur.frames[erreur.frames.length - 1];
    if (!ou || !etat.modeles[ou.file]) return;
    const m = etat.modeles[ou.file];
    const ligne = Math.min(ou.line, m.getLineCount());
    monaco.editor.setModelMarkers(m, 'python', [{
      severity: monaco.MarkerSeverity.Error,
      message: `${erreur.type} : ${erreur.message}`,
      startLineNumber: ligne,
      startColumn: ou.col || m.getLineFirstNonWhitespaceColumn(ligne) || 1,
      endLineNumber: ligne,
      endColumn: m.getLineMaxColumn(ligne),
    }]);
  }

  async function requeteApi(req) {
    const entree = { id: etat.requetes.length + 1, t: Date.now(), method: req.method, path: req.path, reqBody: req.body, status: null, resBody: null, ms: null };
    ajouterRequete(entree);
    const debut = performance.now();
    let r;
    try {
      await backend.pret;
      r = await backend.envoyer('request', { method: req.method, path: req.path, body: req.body }, DELAI_REQUETE);
    } catch {
      r = { status: 503, body: { detail: 'Le backend est en train de redémarrer.' } };
    }
    entree.ms = performance.now() - debut;
    entree.status = r.status;
    entree.resBody = r.body;
    majRequete(entree);
    if (r.error) journalErreurPython(r.error, `${req.method} ${req.path}`);
    if (r.captures && r.captures.length) ajouterCaptures(r.captures, entree);
    if ('db' in r) majDb(r.db);
    return { status: r.status, body: r.body };
  }

  // ---------- Console ----------

  function journal(source, niveau, parties, extra) {
    const conteneur = $('#console');
    const enBas = conteneur.scrollHeight - conteneur.scrollTop - conteneur.clientHeight < 30;
    const libelle = { frontend: 'Front', backend: 'Back', systeme: 'IDE' }[source];
    const ligne = h('div', { class: `log log-${niveau}`, 'data-source': source },
      h('span', { class: 'log-time' }, heure()),
      h('span', { class: `log-src src-${source}` }, libelle),
      h('div', { class: 'log-msg' }, parties.map((p, i) => [i ? ' ' : '', typeof p === 'string' ? p : h('span', { class: p.type === 'obj' ? 'log-obj' : p.type === 'ctx' ? 'log-ctx' : '' }, p.texte)]), extra)
    );
    if (etat.filtreConsole !== 'tout' && etat.filtreConsole !== source) ligne.hidden = true;
    conteneur.append(ligne);
    while (conteneur.childElementCount > 600) conteneur.firstElementChild.remove();
    if (enBas) conteneur.scrollTop = conteneur.scrollHeight;
    if (niveau === 'error' && !$('#pane-console').classList.contains('active')) {
      etat.erreursNonLues++;
      const b = $('#badge-console');
      b.textContent = etat.erreursNonLues;
      b.classList.add('show');
    }
  }

  function lien(p, ligne, texte) {
    if (!FICHIERS.includes(p)) return h('span', null, texte || `${p}:${ligne}`);
    return h('button', { class: 'loc', type: 'button', onclick: () => ouvrir(p, ligne) }, texte || `${p}:${ligne}`);
  }

  function journalErreurPython(erreur, contexte) {
    const cadres = erreur.frames.length
      ? h('div', { class: 'tb-frames' }, erreur.frames.map((f) => h('span', { class: 'tb-frame' }, lien(f.file, f.line), ` dans ${f.func}`, f.code && h('span', { class: 'tb-code' }, f.code.trim()))))
      : null;
    journal('backend', 'error', [`${erreur.type} : ${erreur.message}`, { texte: contexte ? `  (${contexte})` : '', type: 'ctx' }], cadres);
  }

  function initialiserConsole() {
    $('#console-filter').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      etat.filtreConsole = b.dataset.filter;
      $$('#console-filter button').forEach((x) => x.classList.toggle('active', x === b));
      $$('#console .log').forEach((l) => (l.hidden = etat.filtreConsole !== 'tout' && l.dataset.source !== etat.filtreConsole));
    });
    $('#console-clear').addEventListener('click', () => $('#console').replaceChildren());
  }

  // ---------- Réseau ----------

  function classeStatut(s) {
    if (s == null) return 'st-wait';
    if (s < 400) return 'st-ok';
    if (s < 500) return 'st-client';
    return 'st-server';
  }

  function ajouterRequete(entree) {
    etat.requetes.push(entree);
    const rangee = h('button', { class: 'net-row new' + (etat.masquerTicks && entree.path === '/api/tick' ? ' hidden-tick' : ''), type: 'button', onclick: () => choisirRequete(entree) },
      h('span', { class: 'm-' + entree.method }, entree.method),
      h('span', { class: 'net-path' }, entree.path),
      h('span', { class: 'st-wait' }, '…'),
      h('span', { class: 'net-ms' }, '')
    );
    entree.rangee = rangee;
    const liste = $('#net-rows');
    const enBas = liste.scrollHeight - liste.scrollTop - liste.clientHeight < 30;
    liste.append(rangee);
    if (etat.requetes.length > 300) {
      const vieille = etat.requetes.shift();
      vieille.rangee.remove();
    }
    if (enBas) liste.scrollTop = liste.scrollHeight;
    const b = $('#badge-reseau');
    b.textContent = etat.requetes.length >= 300 ? '300+' : etat.requetes.length;
    b.classList.add('show');
  }

  function majRequete(entree) {
    const [, , statut, ms] = entree.rangee.children;
    statut.className = classeStatut(entree.status);
    statut.textContent = entree.status;
    ms.textContent = entree.ms < 1 ? '<1 ms' : Math.round(entree.ms) + ' ms';
    if (etat.requeteChoisie === entree) choisirRequete(entree);
  }

  function jsonColore(valeur, indentation = 0) {
    const pad = '  '.repeat(indentation);
    if (valeur === null || valeur === undefined) return [h('span', { class: 'j-null' }, String(valeur))];
    if (typeof valeur === 'string') return [h('span', { class: 'j-str' }, JSON.stringify(valeur))];
    if (typeof valeur === 'number') return [h('span', { class: 'j-num' }, String(Math.round(valeur * 1000) / 1000))];
    if (typeof valeur === 'boolean') return [h('span', { class: 'j-bool' }, String(valeur))];
    if (Array.isArray(valeur)) {
      if (!valeur.length) return ['[]'];
      return ['[\n', ...valeur.flatMap((v, i) => [pad + '  ', ...jsonColore(v, indentation + 1), i < valeur.length - 1 ? ',\n' : '\n']), pad + ']'];
    }
    const cles = Object.keys(valeur);
    if (!cles.length) return ['{}'];
    return ['{\n', ...cles.flatMap((k, i) => [pad + '  ', h('span', { class: 'j-key' }, JSON.stringify(k)), ': ', ...jsonColore(valeur[k], indentation + 1), i < cles.length - 1 ? ',\n' : '\n']), pad + '}'];
  }

  function choisirRequete(entree) {
    etat.requeteChoisie = entree;
    $$('.net-row.selected').forEach((r) => r.classList.remove('selected'));
    entree.rangee.classList.add('selected');
    $('#net-detail').replaceChildren(
      h('p', { class: 'detail-title' }, h('span', { class: 'm-' + entree.method }, entree.method), entree.path, h('span', { class: classeStatut(entree.status) }, entree.status ?? '…'), h('span', { class: 'net-ms' }, heure(entree.t))),
      h('div', { class: 'detail-block' }, h('p', { class: 'detail-label' }, 'Corps de la requête'), entree.reqBody == null ? h('p', { class: 'empty', style: 'padding:0' }, 'Aucun') : h('pre', { class: 'json' }, jsonColore(entree.reqBody))),
      h('div', { class: 'detail-block' }, h('p', { class: 'detail-label' }, 'Réponse'), entree.status == null ? h('p', { class: 'empty', style: 'padding:0' }, 'En attente…') : h('pre', { class: 'json' }, jsonColore(entree.resBody)))
    );
  }

  function initialiserReseau() {
    $('#net-hide-ticks').addEventListener('change', (e) => {
      etat.masquerTicks = e.target.checked;
      for (const r of etat.requetes) r.rangee.classList.toggle('hidden-tick', etat.masquerTicks && r.path === '/api/tick');
    });
    $('#net-clear').addEventListener('click', () => {
      etat.requetes = [];
      etat.requeteChoisie = null;
      $('#net-rows').replaceChildren();
      $('#net-detail').replaceChildren(h('p', { class: 'empty' }, 'Sélectionne une requête pour voir son contenu.'));
      $('#badge-reseau').classList.remove('show');
    });
  }

  // ---------- Débogueur ----------

  function ajouterCaptures(captures, entree) {
    if (etat.fige) return;
    for (const c of captures) {
      c.t = Date.now();
      c.requete = `${entree.method} ${entree.path}`;
      etat.captures.unshift(c);
    }
    etat.captures.length = Math.min(etat.captures.length, 80);
    rendreCaptures();
    const derniere = captures[captures.length - 1];
    if (derniere && etat.actif === derniere.file) flash(derniere.file, derniere.line, 'capture-line', 700);
    const b = $('#badge-debug');
    b.textContent = etat.captures.length >= 80 ? '80+' : etat.captures.length;
    b.classList.add('show');
  }

  function rendreCaptures() {
    const conteneur = $('#captures');
    if (!etat.captures.length) {
      const aDesPoints = Object.values(tousLesPoints()).some((l) => l.length);
      conteneur.replaceChildren(
        h('p', { class: 'debug-hint' },
          aDesPoints
            ? ['En attente d’une exécution de la ligne…']
            : ["Clique dans la marge d'un fichier ", h('code', null, '.py'), " pour poser un point d'arrêt. Les variables locales sont capturées à chaque passage, sans arrêter le programme."]
        )
      );
      return;
    }
    const ouvertes = new Set($$('.capture[open]', conteneur).map((d) => d.dataset.cle));
    conteneur.replaceChildren(
      ...etat.captures.slice(0, 60).map((c, i) => {
        const cle = `${c.t}-${c.file}-${c.line}-${i}`;
        return h('details', { class: 'capture', 'data-cle': cle, open: i === 0 || ouvertes.has(cle) },
          h('summary', null,
            lien(c.file, c.line, `${nomFichier(c.file)}:${c.line}`),
            h('span', { class: 'capture-fn' }, c.func + '()'),
            h('span', { class: 'capture-req' }, `${c.requete} · ${heure(c.t)}`)
          ),
          h('div', { class: 'capture-body' },
            Object.keys(c.locals).length
              ? h('table', { class: 'vars' }, h('tbody', null, Object.entries(c.locals).map(([k, v]) => h('tr', null, h('td', null, k), h('td', null, v)))))
              : h('p', { class: 'empty', style: 'padding:0' }, 'Aucune variable locale.'),
            c.stack.length > 1 && h('ul', { class: 'stack' }, c.stack.map((f) => h('li', null, lien(f.file, f.line, `${nomFichier(f.file)}:${f.line}`), ` ${f.func}()`)))
          )
        );
      })
    );
  }

  let dbPrecedente = null;
  function majDb(db) {
    etat.db = db;
    const conteneur = $('#db-tree');
    if (db == null) {
      conteneur.replaceChildren(h('p', { class: 'empty', style: 'padding:0' }, "Aucune variable db dans backend/main.py."));
      dbPrecedente = null;
      return;
    }
    const lignes = [];
    const parcourir = (valeur, precedent, profondeur, cle) => {
      const estObjet = valeur && typeof valeur === 'object';
      if (estObjet) {
        lignes.push(h('div', { class: 'db-row', style: `--depth:${profondeur}` }, cle != null && h('span', { class: 'j-key' }, cle + ':'), Array.isArray(valeur) ? '[' : '{'));
        for (const [k, v] of Object.entries(valeur)) parcourir(v, precedent && typeof precedent === 'object' ? precedent[k] : undefined, profondeur + 1, k);
        lignes.push(h('div', { class: 'db-row', style: `--depth:${profondeur}` }, Array.isArray(valeur) ? ']' : '}'));
      } else {
        const change = dbPrecedente !== null && JSON.stringify(valeur) !== JSON.stringify(precedent);
        lignes.push(h('div', { class: 'db-row' + (change ? ' changed' : ''), style: `--depth:${profondeur}` }, cle != null && h('span', { class: 'j-key' }, cle + ':'), h('span', { class: 'db-val' }, jsonColore(valeur))));
      }
    };
    parcourir(db, dbPrecedente, 0, null);
    conteneur.replaceChildren(...lignes);
    dbPrecedente = db;
  }

  function initialiserDebogueur() {
    $('#debug-freeze').addEventListener('click', (e) => {
      etat.fige = !etat.fige;
      const b = e.currentTarget;
      b.setAttribute('aria-pressed', String(etat.fige));
      b.querySelector('span').textContent = etat.fige ? 'Figé' : 'Figer';
    });
    $('#debug-clear').addEventListener('click', () => {
      etat.captures = [];
      $('#badge-debug').classList.remove('show');
      rendreCaptures();
    });
    $('#db-reset').addEventListener('click', async () => {
      await backend.pret;
      const r = await backend.envoyer('reset', {}, 15000).catch(() => null);
      if (r && r.ok) {
        envoyerPoints();
        majDb(r.db);
        journal('systeme', 'info', ["État du backend réinitialisé : la plante est replantée."]);
        rechargerApercu();
      } else if (r) {
        journalErreurPython(r.error, 'Démarrage du backend');
      }
    });
  }

  // ---------- Panneau ----------

  function montrerPanneau(nom) {
    $$('.panel-tab').forEach((b) => b.classList.toggle('active', b.dataset.pane === nom));
    $$('.pane').forEach((p) => p.classList.toggle('active', p.id === 'pane-' + nom));
    $$('.tools').forEach((t) => (t.hidden = t.dataset.tools !== nom));
    if (nom === 'console') {
      etat.erreursNonLues = 0;
      $('#badge-console').classList.remove('show');
    }
  }

  // ---------- Compilation du frontend ----------

  function texteDiagnostic(m) {
    if (typeof m === 'string') return m;
    let t = m.messageText;
    let n = m.next;
    while (n && n.length) {
      t += ' ' + n[0].messageText;
      n = n[0].next;
    }
    return t;
  }

  async function compilerFrontend() {
    const debut = performance.now();
    const chemins = FICHIERS.filter((p) => p.startsWith('frontend/') && /\.tsx?$/.test(p));
    const obtenir = await monaco.languages.typescript.getTypeScriptWorker();
    const client = await obtenir(...chemins.map((p) => etat.modeles[p].uri));
    const modules = {};
    const erreurs = [];
    for (const p of chemins) {
      const uri = etat.modeles[p].uri.toString();
      for (const d of await client.getSyntacticDiagnostics(uri)) {
        const pos = etat.modeles[p].getPositionAt(d.start || 0);
        erreurs.push({ file: p, line: pos.lineNumber, col: pos.column, message: texteDiagnostic(d.messageText) });
      }
      const sortie = await client.getEmitOutput(uri);
      const js = sortie.outputFiles.find((f) => f.name.endsWith('.js'));
      modules[p] = js ? js.text : '';
    }
    const css = FICHIERS.filter((p) => p.startsWith('frontend/') && p.endsWith('.css')).map((p) => etat.fichiers[p]).join('\n');
    return { modules, css, erreurs, ms: performance.now() - debut };
  }

  // Exécuté dans l'iframe de l'application. Ne doit dépendre de rien d'extérieur.
  function runtimeApercu(config) {
    const pont = window.parent[config.pont];
    const React = window.React;
    const ReactDOM = window.ReactDOM;

    function inspecter(v, profondeur, vus) {
      vus = vus || new Set();
      const type = Object.prototype.toString.call(v);
      if (v === null) return 'null';
      if (v === undefined) return 'undefined';
      if (typeof v === 'string') return profondeur ? JSON.stringify(v) : v;
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
      if (typeof v === 'symbol') return v.toString();
      if (typeof v === 'function') return `ƒ ${v.name || 'anonyme'}()`;
      if (type === '[object Error]' || v instanceof Error) return `${v.name}: ${v.message}`;
      if (v.nodeType === 1) return `<${v.tagName.toLowerCase()}${v.className ? ` class="${v.className}"` : ''}>`;
      if (vus.has(v)) return '[circulaire]';
      if (profondeur > 3) return Array.isArray(v) ? '[…]' : '{…}';
      vus.add(v);
      if (Array.isArray(v)) {
        const items = v.slice(0, 50).map((x) => inspecter(x, profondeur + 1, vus));
        if (v.length > 50) items.push(`… ${v.length - 50} de plus`);
        return `[${items.join(', ')}]`;
      }
      if (v.$$typeof) return '<ReactElement>';
      const cles = Object.keys(v).slice(0, 30);
      const nom = v.constructor && v.constructor.name && v.constructor.name !== 'Object' ? v.constructor.name + ' ' : '';
      return `${nom}{ ${cles.map((k) => `${k}: ${inspecter(v[k], profondeur + 1, vus)}`).join(', ')} }`.replace('{  }', '{}');
    }

    function formater(args) {
      args = Array.from(args);
      if (typeof args[0] === 'string' && /%[sdifoOc]/.test(args[0])) {
        let i = 1;
        const texte = args[0].replace(/%([sdifoOc%])/g, (m, c) => {
          if (c === '%') return '%';
          if (i >= args.length) return m;
          const a = args[i++];
          if (c === 'c') return '';
          if (c === 'd' || c === 'i') return String(parseInt(a, 10));
          if (c === 'f') return String(parseFloat(a));
          return inspecter(a, c === 's' ? 0 : 1);
        });
        args = [texte].concat(args.slice(i));
      }
      return args.map((a) => ({ texte: inspecter(a, 0), type: typeof a === 'string' ? 'str' : 'obj' }));
    }

    ['log', 'info', 'warn', 'error', 'debug'].forEach((niveau) => {
      const natif = console[niveau].bind(console);
      console[niveau] = function () {
        natif.apply(null, arguments);
        try {
          pont.log(niveau === 'debug' ? 'log' : niveau, formater(arguments));
        } catch (e) {
          /* parent indisponible */
        }
      };
    });

    function surcouche(titre, message, details) {
      let n = document.getElementById('__surcouche');
      if (n) n.remove();
      n = document.createElement('div');
      n.id = '__surcouche';
      n.innerHTML =
        '<div class="s-carte"><div class="s-entete"><span class="s-pastille"></span><span class="s-titre"></span><button type="button" class="s-x" aria-label="Fermer">×</button></div>' +
        '<p class="s-msg"></p><pre class="s-details"></pre><p class="s-aide">Corrige le code puis enregistre avec Ctrl + S. Plus de détails dans la console.</p></div>';
      n.querySelector('.s-titre').textContent = titre;
      n.querySelector('.s-msg').textContent = message;
      const d = n.querySelector('.s-details');
      if (details) d.textContent = details;
      else d.remove();
      n.querySelector('.s-x').onclick = () => n.remove();
      document.body.appendChild(n);
    }

    function pileLisible(e) {
      if (!e || !e.stack) return '';
      return e.stack
        .split('\n')
        .filter((l) => /frontend\//.test(l))
        .map((l) => l.trim().replace(/\(?(?:about:srcdoc|https?:\/\/[^)]*?\/)?(frontend\/[^):]+)(?::\d+:\d+)?\)?/, '($1)'))
        .slice(0, 6)
        .join('\n');
    }

    function signaler(erreur) {
      const e = erreur instanceof Error || (erreur && erreur.message) ? erreur : new Error(String(erreur));
      try {
        pont.erreur({ message: `${e.name || 'Error'}: ${e.message}`, pile: pileLisible(e) });
      } catch (x) {
        /* parent indisponible */
      }
      surcouche("Erreur d'exécution", `${e.name || 'Error'}: ${e.message}`, pileLisible(e));
    }

    window.addEventListener('error', (ev) => signaler(ev.error || ev.message));
    window.addEventListener('unhandledrejection', (ev) => signaler(ev.reason));

    const fetchNatif = window.fetch.bind(window);
    window.fetch = async function (entree, init) {
      init = init || {};
      const url = new URL(typeof entree === 'string' ? entree : entree.url, 'http://localhost:3000');
      if (!url.pathname.startsWith('/api')) return fetchNatif(entree, init);
      const method = String(init.method || (entree && entree.method) || 'GET').toUpperCase();
      let corps = null;
      if (init.body != null) {
        try {
          corps = JSON.parse(init.body);
        } catch (e) {
          corps = String(init.body);
        }
      }
      const r = await pont.requete({ method, path: url.pathname, body: corps });
      return new Response(r.status === 204 ? null : JSON.stringify(r.body === undefined ? null : r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
    };

    const avecCle = (props, key) => (key === undefined ? props : Object.assign({}, props, { key }));
    const jsxRuntime = {
      Fragment: React.Fragment,
      jsx: (type, props, key) => React.createElement(type, avecCle(props, key)),
      // Enfants statiques : passés en arguments pour que React ne demande pas de key
      jsxs: (type, props, key) => {
        const { children, ...reste } = props;
        return React.createElement(type, avecCle(reste, key), ...(Array.isArray(children) ? children : [children]));
      },
    };
    const externes = { react: React, 'react-dom': ReactDOM, 'react-dom/client': ReactDOM, 'react/jsx-runtime': jsxRuntime, 'react/jsx-dev-runtime': jsxRuntime };
    const cache = {};

    function resoudre(depuis, demande) {
      if (!demande.startsWith('.')) return demande;
      const base = depuis.split('/').slice(0, -1);
      for (const part of demande.split('/')) {
        if (part === '..') base.pop();
        else if (part !== '.') base.push(part);
      }
      const chemin = base.join('/');
      if (/\.css$/.test(chemin)) return chemin;
      for (const c of [chemin, chemin + '.tsx', chemin + '.ts', chemin + '/index.tsx', chemin + '/index.ts']) if (c in config.modules) return c;
      return chemin;
    }

    function exiger(chemin, depuis) {
      if (chemin in externes) return externes[chemin];
      if (/\.css$/.test(chemin)) return {};
      if (cache[chemin]) return cache[chemin].exports;
      if (!(chemin in config.modules)) throw new Error(`Module introuvable : "${chemin}"` + (depuis ? ` (importé dans ${depuis})` : ''));
      const module = { exports: {} };
      cache[chemin] = module;
      let code = config.modules[chemin];
      const carte = code.match(/\/\/# sourceMappingURL=.*$/m);
      code = code.replace(/\/\/# sourceMappingURL=.*$/m, '');
      const fn = (0, eval)('(function (require, module, exports) {' + code + '\n})\n//# sourceURL=' + chemin + '\n' + (carte ? carte[0] : ''));
      fn((demande) => exiger(resoudre(chemin, demande), chemin), module, module.exports);
      return module.exports;
    }
    window.__require = (c) => exiger(c);

    if (config.erreurs.length) {
      surcouche(
        'Erreur de compilation',
        config.erreurs[0].message,
        config.erreurs.map((e) => `${e.file}:${e.line}:${e.col}  ${e.message}`).join('\n')
      );
      return;
    }

    class Frontiere extends React.Component {
      constructor(props) {
        super(props);
        this.state = { erreur: null };
      }
      static getDerivedStateFromError(erreur) {
        return { erreur };
      }
      componentDidCatch(erreur) {
        signaler(erreur);
      }
      render() {
        return this.state.erreur ? null : this.props.children;
      }
    }

    try {
      const Page = exiger('frontend/app/page.tsx').default;
      const Layout = 'frontend/app/layout.tsx' in config.modules ? exiger('frontend/app/layout.tsx').default : (p) => p.children;
      if (typeof Page !== 'function') throw new Error('frontend/app/page.tsx doit exporter un composant par défaut (export default function Page).');
      ReactDOM.createRoot(document.getElementById('__next')).render(React.createElement(Frontiere, null, React.createElement(Layout, null, React.createElement(Page))));
    } catch (e) {
      console.error(e);
      signaler(e);
    }
  }

  const STYLE_SURCOUCHE = `
    #__surcouche{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding:32px 14px;background:rgba(10,14,22,.55);backdrop-filter:blur(3px);font-family:Inter,system-ui,sans-serif;overflow:auto}
    #__surcouche .s-carte{width:100%;max-width:560px;border-radius:14px;background:#141a24;color:#e8edf5;box-shadow:0 30px 70px -20px rgba(0,0,0,.6);border-top:4px solid #ff5a6b;padding:18px 20px 16px;animation:s-in .25s ease}
    #__surcouche .s-entete{display:flex;align-items:center;gap:9px}
    #__surcouche .s-pastille{width:9px;height:9px;border-radius:50%;background:#ff5a6b}
    #__surcouche .s-titre{font-weight:600;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#ff8d99}
    #__surcouche .s-x{margin-left:auto;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:#9aa6b8;font-size:20px;line-height:1;cursor:pointer}
    #__surcouche .s-x:hover{background:rgba(255,255,255,.08);color:#fff}
    #__surcouche .s-msg{margin:12px 0 0;font:600 14.5px/1.5 'JetBrains Mono',ui-monospace,monospace;white-space:pre-wrap;word-break:break-word}
    #__surcouche .s-details{margin:12px 0 0;padding:10px 12px;border-radius:8px;background:#0b0f16;color:#aeb9ca;font:12px/1.6 'JetBrains Mono',ui-monospace,monospace;white-space:pre-wrap;word-break:break-word}
    #__surcouche .s-aide{margin:12px 0 0;font-size:12.5px;color:#8792a4}
    @keyframes s-in{from{opacity:0;transform:translateY(8px)}}`;

  function documentApercu(build, pont) {
    const echapper = (s) => s.split('<').join('\\u003c');
    const config = { pont, modules: build.modules, erreurs: build.erreurs };
    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${POLICES_APP}">
<style>${build.css.replace(/<\/style/gi, '<\\/style')}</style><style>${STYLE_SURCOUCHE}</style>
<script src="${REACT}"><\/script><script src="${REACT_DOM}"><\/script>
</head><body><div id="__next"></div>
<script>(${runtimeApercu.toString()})(${echapper(JSON.stringify(config))});<\/script>
</body></html>`;
  }

  function chargerIframe(iframe, html) {
    return new Promise((resoudre) => {
      iframe.onload = () => resoudre(iframe.contentWindow);
      iframe.srcdoc = html;
    });
  }

  window.__ide = {
    log(niveau, parties) {
      if (parties.length && /Download the React DevTools/.test(parties[0].texte)) return;
      journal('frontend', niveau, parties);
    },
    erreur(info) {
      journal('frontend', 'error', [info.message], info.pile ? h('div', { class: 'tb-frames' }, info.pile.split('\n').map((l) => h('span', { class: 'tb-frame' }, l))) : null);
    },
    requete: (req) => requeteApi(req),
  };

  function majStatutFrontend(build) {
    const ok = !build.erreurs.length;
    const n = $('#sb-frontend');
    n.textContent = ok ? `Frontend : compilé en ${Math.max(1, Math.round(build.ms))} ms` : `Frontend : ${build.erreurs.length} erreur${build.erreurs.length > 1 ? 's' : ''} de compilation`;
    n.classList.toggle('sb-err', !ok);
  }

  async function construireApercu() {
    const build = await compilerFrontend();
    etat.dernierBuild = build;
    majStatutFrontend(build);
    for (const e of build.erreurs) journal('frontend', 'error', [`Erreur de compilation : ${e.message}  `], h('div', { class: 'tb-frames' }, h('span', { class: 'tb-frame' }, lien(e.file, e.line))));
    await rechargerApercu();
    return build;
  }

  async function rechargerApercu() {
    if (!etat.dernierBuild) return;
    const b = $('#pv-reload');
    b.classList.remove('spin');
    void b.offsetWidth;
    b.classList.add('spin');
    await chargerIframe($('#frame'), documentApercu(etat.dernierBuild, '__ide'));
    $('#preview-loading').classList.add('hidden');
  }

  // ---------- Tests ----------

  const TODOS_BACKEND = ['1', '3', '5'];

  async function trouver(win, sel) {
    for (let i = 0; i < 80; i++) {
      const n = win.document.querySelector(sel);
      if (n) return n;
      await attendre(50);
    }
    throw new Error(`L'élément ${sel} est introuvable dans la page.`);
  }

  const NOMS_FRONT = {
    '2': ['0 % donne Graine', '15 % (seuil exact) donne Pousse', '50 % donne Jeune plante', '80 % donne Plante', '100 % donne En fleur'],
    '4': ['Au démarrage, un tick par seconde', 'À ×5, un seul tick par seconde', 'À ×5, chaque tick simule 5 secondes', 'Retour à ×1, un seul tick par seconde', 'Retour à ×1, chaque tick simule 1 seconde'],
  };

  const TESTS_FRONT = {
    async '2'(win) {
      const mod = win.__require('frontend/lib/stades.ts');
      const cas = [[0, 'Graine'], [15, 'Pousse'], [50, 'Jeune plante'], [80, 'Plante'], [100, 'En fleur']];
      return cas.map(([croissance, attendu], i) => {
        const nom = NOMS_FRONT['2'][i];
        try {
          if (typeof mod.choisirStade !== 'function') throw new Error('choisirStade n’est plus exportée par lib/stades.ts.');
          const stade = mod.choisirStade(croissance);
          const obtenu = stade && stade.nom;
          if (obtenu !== attendu) throw new Error(`choisirStade(${croissance}) retourne "${obtenu}" (attendu : "${attendu}").`);
          return { nom, ok: true, message: '' };
        } catch (e) {
          return { nom, ok: false, message: e.message };
        }
      });
    },

    async '4'(win, suivi) {
      const noms = NOMS_FRONT['4'];
      const resultats = [];
      const fenetre = async (ms) => {
        const debut = performance.now();
        await attendre(ms);
        return suivi.ticks.filter((t) => t.t >= debut);
      };
      const noter = (nom, verif) => {
        try {
          verif();
          resultats.push({ nom, ok: true, message: '' });
        } catch (e) {
          resultats.push({ nom, ok: false, message: e.message });
        }
      };
      const rythme = (ticks, duree, contexte) => {
        if (ticks.length > duree + 1) throw new Error(`${contexte} : ${ticks.length} requêtes /api/tick en ${duree} s (attendu : environ ${duree}).`);
        if (ticks.length < duree - 1) throw new Error(`${contexte} : seulement ${ticks.length} requête(s) /api/tick en ${duree} s, le temps ne s'écoule plus.`);
      };
      const secondes = (ticks, attendu, contexte) => {
        const autres = ticks.filter((t) => t.secondes !== attendu);
        if (autres.length) throw new Error(`${contexte} : ${autres.length} tick(s) sur ${ticks.length} demandent ${autres[0].secondes} s au lieu de ${attendu}.`);
      };

      const cinq = await trouver(win, '[data-vitesse="5"]');
      const un = await trouver(win, '[data-vitesse="1"]');
      await attendre(200);

      const depart = await fenetre(2000);
      noter(noms[0], () => rythme(depart, 2, 'Au démarrage'));

      cinq.click();
      await attendre(300);
      const rapide = await fenetre(2000);
      noter(noms[1], () => rythme(rapide, 2, 'À ×5'));
      noter(noms[2], () => secondes(rapide, 5, 'À ×5'));

      un.click();
      await attendre(300);
      const retour = await fenetre(3000);
      noter(noms[3], () => rythme(retour, 3, 'Retour à ×1'));
      noter(noms[4], () => secondes(retour, 1, 'Retour à ×1'));
      return resultats;
    },
  };

  const echecGlobal = (id, message) => NOMS_FRONT[id].map((nom) => ({ nom, ok: false, message }));

  async function testsFrontend(build, ids) {
    const resultats = {};
    if (build.erreurs.length) {
      for (const id of ids) resultats[id] = echecGlobal(id, 'Le frontend ne compile pas.');
      return resultats;
    }
    const suivi = { ticks: [] };
    const plante = { nom: 'Test', eau: 60, lumiere: 60, sante: 100, croissance: 0, age: 0, vivante: true, dernier_engrais: null };
    window.__ideTest = {
      log() {},
      erreur() {},
      async requete(r) {
        if (r.path === '/api/tick') suivi.ticks.push({ t: performance.now(), secondes: r.body && r.body.secondes });
        return { status: 200, body: { ...plante } };
      },
    };
    const iframe = $('#test-frame');
    const win = await chargerIframe(iframe, documentApercu(build, '__ideTest'));
    for (const id of ids) {
      try {
        if (!win.__require) throw new Error("L'application ne démarre pas.");
        resultats[id] = await TESTS_FRONT[id](win, suivi);
      } catch (e) {
        resultats[id] = echecGlobal(id, e.message);
      }
    }
    iframe.srcdoc = '';
    return resultats;
  }

  async function testsBackend(ids) {
    try {
      await backend.pret;
      const liste = await backend.envoyer('test', { ids }, DELAI_REQUETE * 2);
      const resultats = Object.fromEntries(ids.map((id) => [id, []]));
      for (const x of liste) resultats[x.todo].push({ nom: x.nom, ok: x.ok, message: x.message });
      return resultats;
    } catch {
      return Object.fromEntries(ids.map((id) => [id, [{ nom: 'Backend', ok: false, message: 'Le backend ne répond pas.' }]]));
    }
  }

  function rendreTests() {
    const conteneur = $('#tests');
    const reussis = TACHES.filter((t) => etat.resultats[t.id]?.ok).length;
    conteneur.replaceChildren(
      h('div', { class: 'tests-head' }, h('span', null, h('b', null, `${reussis} / ${TACHES.length}`), ' bugs réglés')),
      ...TACHES.map((t) => {
        const r = etat.resultats[t.id];
        const enCours = etat.enCours.has(t.id);
        const statut = enCours ? 'wait' : r ? (r.ok ? 'ok' : 'fail') : 'none';
        return h('section', { class: 'test-group ' + statut },
          h('div', { class: 'test-group-head' },
            h('span', { class: 'test-icon' }, enCours ? h('span', { class: 'spinner' }) : r ? (r.ok ? '✓' : '✕') : ''),
            h('span', { class: 'test-title' }, `TODO ${t.id} · ${t.titre}`),
            h('span', { class: 'test-count' }, enCours ? 'Vérification…' : r ? `${resumeTests(r)} · ${heure(r.t)}` : 'Non vérifié'),
            lien(t.fichier, lignesTodo(t.fichier).find((x) => x.id === t.id)?.ligne || 1, nomFichier(t.fichier)),
            h('button', { class: 'tool-btn tool-text test-run', type: 'button', disabled: enCours, onclick: () => verifier([t.id]) }, 'Vérifier')
          ),
          r && !enCours && h('ul', { class: 'test-cases' },
            r.tests.map((c) => h('li', { class: c.ok ? 'ok' : 'fail' },
              h('span', { class: 'case-icon' }, c.ok ? '✓' : '✕'),
              h('span', null, h('span', { class: 'case-name' }, c.nom), !c.ok && c.message && h('span', { class: 'case-msg' }, c.message))
            ))
          )
        );
      })
    );
  }

  function rafraichirResultats() {
    rendreTests();
    rendreTaches();
    rendreArbre();
    FICHIERS.forEach(majDecorationsTodo);
    majProgression();
  }

  let fileTests = Promise.resolve();

  function verifier(ids = TACHES.map((t) => t.id)) {
    ids = ids.filter((id) => !etat.enCours.has(id));
    if (!ids.length) return fileTests;
    for (const id of ids) etat.enCours.add(id);
    montrerPanneau('tests');
    rafraichirResultats();
    fileTests = fileTests.then(async () => {
      if (FICHIERS.some(estModifie)) await enregistrer();
      await enregistrement;
      const build = etat.dernierBuild;
      const back = ids.filter((id) => TODOS_BACKEND.includes(id));
      const front = ids.filter((id) => id in TESTS_FRONT);
      const [rb, rf] = await Promise.all([
        back.length ? testsBackend(back) : {},
        !front.length ? {} : build ? testsFrontend(build, front) : Object.fromEntries(front.map((id) => [id, echecGlobal(id, 'Le frontend n’est pas encore compilé.')])),
      ]);
      const tous = { ...rb, ...rf };
      for (const id of ids) {
        const tests = tous[id] || [];
        etat.resultats[id] = { ok: tests.length > 0 && tests.every((c) => c.ok), tests, t: Date.now() };
        etat.enCours.delete(id);
      }
      sauverSession();
      rafraichirResultats();
    });
    return fileTests;
  }

  // ---------- Enregistrement ----------

  let enregistrement = Promise.resolve();

  function enregistrer() {
    enregistrement = enregistrement.then(async () => {
      if (!monaco) return;
      const modifies = FICHIERS.filter(estModifie);
      for (const p of modifies) {
        etat.fichiers[p] = etat.modeles[p].getValue();
        etat.enregistres[p] = etat.modeles[p].getAlternativeVersionId();
      }
      sauverSession();
      rendreOnglets();
      rendreArbre();
      const sb = $('#sb-save');
      sb.textContent = modifies.length ? `✓ ${modifies.length} fichier${modifies.length > 1 ? 's' : ''} enregistré${modifies.length > 1 ? 's' : ''}` : '✓ Rechargé';
      sb.style.opacity = '1';
      clearTimeout(enregistrer.minuterie);
      enregistrer.minuterie = setTimeout(() => (sb.style.opacity = '0'), 2200);

      if (modifies.some((p) => p.startsWith('backend/'))) {
        const r = await chargerBackend(true);
        if (r) journal('systeme', 'success', [r.conserve ? "Backend rechargé. L'état de la plante est conservé." : 'Backend rechargé.']);
      }
      await construireApercu();
    });
    return enregistrement;
  }

  // ---------- Rapport de l'entrevue ----------

  const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const slug = (t) =>
    t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'candidat';

  function telecharger(nomFichier, contenu, type) {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const a = h('a', { href: url, download: nomFichier });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Différence ligne à ligne (plus longue sous-séquence commune)
  function diffLignes(avant, apres) {
    const a = avant.split('\n'), b = apres.split('\n');
    const n = a.length, m = b.length;
    const t = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    const lignes = [];
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) {
        lignes.push({ t: ' ', l: a[i], n: j + 1 });
        i++;
        j++;
      } else if (j < m && (i >= n || t[i][j + 1] >= t[i + 1][j])) {
        lignes.push({ t: '+', l: b[j], n: j + 1 });
        j++;
      } else {
        lignes.push({ t: '-', l: a[i], n: null });
        i++;
      }
    }
    const garder = new Set();
    lignes.forEach((x, k) => {
      if (x.t !== ' ') for (let d = -3; d <= 3; d++) garder.add(k + d);
    });
    const blocs = [];
    let precedent = -2;
    lignes.forEach((x, k) => {
      if (!garder.has(k)) return;
      if (k !== precedent + 1 && blocs.length) blocs.push({ t: '…' });
      blocs.push(x);
      precedent = k;
    });
    return blocs;
  }

  async function genererRapport() {
    const maintenant = Date.now();
    const originaux = Object.fromEntries(
      await Promise.all(FICHIERS.map(async (p) => {
        const r = await fetch('projet/' + p, { cache: 'no-cache' }).catch(() => null);
        return [p, r && r.ok ? await r.text() : null];
      }))
    );
    const regles = TACHES.filter((t) => etat.resultats[t.id]?.ok).length;
    let testsTotal = 0, testsOk = 0;
    for (const t of TACHES) {
      const r = etat.resultats[t.id];
      if (!r) continue;
      testsTotal += r.tests.length;
      testsOk += r.tests.filter((c) => c.ok).length;
    }
    const tempsMs = etat.debut ? (etat.fin || maintenant) - etat.debut : 0;
    const date = new Date(maintenant).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' });

    const taches = TACHES.map((t) => {
      const r = etat.resultats[t.id];
      const cas = r ? r.tests : [];
      const ok = cas.filter((c) => c.ok).length;
      return `<section class="tache ${r && r.ok ? 'ok' : 'ko'}">
        <div class="tache-tete"><span class="statut">${r && r.ok ? '✓' : '✕'}</span><div><h3>TODO ${t.id} · ${echapper(t.titre)}</h3><p>${t.niveau[0].toUpperCase() + t.niveau.slice(1)} · ${t.fichier}</p></div><b>${ok}/${cas.length}</b></div>
        <ul>${cas.map((c) => `<li class="${c.ok ? 'ok' : 'ko'}"><span>${c.ok ? '✓' : '✕'}</span><div>${echapper(c.nom)}${!c.ok && c.message ? `<small>${echapper(c.message)}</small>` : ''}</div></li>`).join('')}</ul>
      </section>`;
    }).join('');

    const fichiers = FICHIERS.filter((p) => p !== 'README.md').map((p) => {
      const avant = originaux[p];
      const apres = etat.fichiers[p];
      if (avant == null || avant === apres) return null;
      const lignes = diffLignes(avant, apres).map((x) => x.t === '…' ? '<tr class="saut"><td></td><td>…</td></tr>' : `<tr class="${x.t === '+' ? 'ajout' : x.t === '-' ? 'retrait' : ''}"><td>${x.n ?? ''}</td><td>${x.t === ' ' ? ' ' : x.t} ${echapper(x.l)}</td></tr>`).join('');
      return `<details open><summary>${p}</summary><table class="diff">${lignes}</table></details>`;
    }).filter(Boolean);

    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Entrevue développeur · ${echapper(etat.candidat)}</title>
<style>
  body{margin:0;background:#f3f7fc;color:#15223a;font:14px/1.5 Inter,system-ui,-apple-system,'Segoe UI',sans-serif}
  main{max-width:860px;margin:0 auto;padding:40px 24px 64px}
  .label{margin:0;color:#2463d9;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
  h1{margin:6px 0 4px;font-size:28px}
  .meta{margin:0;color:#4d5e79}
  .cartes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0 32px}
  .carte{padding:16px 18px;border:1px solid #dce5f0;border-radius:12px;background:#fff}
  .carte b{display:block;font-size:26px}
  .carte span{color:#4d5e79;font-size:13px}
  h2{margin:32px 0 12px;font-size:17px}
  .tache{margin-bottom:10px;border:1px solid #dce5f0;border-radius:12px;background:#fff;overflow:hidden}
  .tache-tete{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #e7edf5}
  .tache-tete h3{margin:0;font-size:14.5px}
  .tache-tete p{margin:0;color:#8292ab;font-size:12.5px}
  .tache-tete b{margin-left:auto;font-variant-numeric:tabular-nums}
  .statut{display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700}
  .tache.ok .statut{background:#1c9a52;color:#fff}
  .tache.ko .statut{background:#fde8ea;color:#d93848}
  .tache.ok .tache-tete b{color:#1c9a52}
  .tache.ko .tache-tete b{color:#d93848}
  .tache ul{margin:0;padding:10px 16px 12px;list-style:none}
  .tache li{display:grid;grid-template-columns:18px 1fr;gap:8px;padding:3px 0}
  .tache li.ok span{color:#1c9a52;font-weight:700}
  .tache li.ko span{color:#d93848;font-weight:700}
  .tache li small{display:block;color:#b4232f;font-family:ui-monospace,Consolas,monospace;font-size:12px}
  details{margin-bottom:12px;border:1px solid #dce5f0;border-radius:12px;background:#fff;overflow:hidden}
  summary{padding:10px 16px;font-family:ui-monospace,Consolas,monospace;font-size:13px;font-weight:600;cursor:pointer;border-bottom:1px solid #e7edf5}
  .diff{width:100%;border-collapse:collapse;font:12px/1.55 ui-monospace,Consolas,monospace}
  .diff td{padding:0 10px;white-space:pre-wrap;word-break:break-word;vertical-align:top}
  .diff td:first-child{width:1%;color:#8292ab;text-align:right;user-select:none}
  .diff .ajout{background:#e6f6ec}
  .diff .retrait{background:#fdecee;color:#8d1d29}
  .diff .saut td{color:#8292ab;background:#f7f9fc}
  .vide{color:#8292ab}
  footer{margin-top:40px;color:#8292ab;font-size:12px}
</style></head>
<body><main>
  <p class="label">Entrevue technique · Développeur</p>
  <h1>${echapper(etat.candidat || 'Candidat')}</h1>
  <p class="meta">${date}</p>
  <div class="cartes">
    <div class="carte"><b>${regles} / ${TACHES.length}</b><span>TODO réglés</span></div>
    <div class="carte"><b>${testsOk} / ${testsTotal}</b><span>tests réussis</span></div>
    <div class="carte"><b>${duree(tempsMs)}</b><span>${etat.fin ? 'pour tout régler' : 'de temps écoulé'}</span></div>
  </div>
  <h2>Détail des tests</h2>
  ${taches}
  <h2>Code modifié</h2>
  ${fichiers.length ? fichiers.join('') : '<p class="vide">Aucun fichier modifié.</p>'}
  <footer>Hack4Impact Polytechnique Montréal · rapport généré automatiquement</footer>
</main></body></html>`;
  }

  async function telechargerResultats() {
    const bouton = $('#btn-resultats');
    if (bouton.disabled) return;
    if (!(await demanderNom())) return;
    bouton.disabled = true;
    const libelle = bouton.lastChild.textContent;
    bouton.lastChild.textContent = ' Vérification…';
    try {
      await verifier();
      const html = await genererRapport();
      const jour = new Date().toISOString().slice(0, 10);
      telecharger(`entrevue-developpeur-${slug(etat.candidat)}-${jour}.html`, html, 'text/html');
    } finally {
      bouton.disabled = false;
      bouton.lastChild.textContent = libelle;
    }
  }

  // Le nom est demandé seulement au moment de télécharger
  function demanderNom() {
    return new Promise((ok) => {
      const d = $('#dlg-nom');
      const champ = $('#nom-valeur');
      const bouton = $('#nom-valider');
      const maj = () => (bouton.disabled = !champ.value.trim());
      champ.value = etat.candidat || '';
      maj();
      const fin = (valide) => {
        champ.oninput = champ.onkeydown = bouton.onclick = $('#nom-annuler').onclick = d.oncancel = null;
        d.close();
        ok(valide);
      };
      champ.oninput = maj;
      champ.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && champ.value.trim()) bouton.click();
      };
      bouton.onclick = () => {
        etat.candidat = champ.value.trim().replace(/\s+/g, ' ');
        sauverSession();
        fin(true);
      };
      $('#nom-annuler').onclick = () => fin(false);
      d.oncancel = (e) => {
        e.preventDefault();
        fin(false);
      };
      d.showModal();
      champ.focus();
      champ.select();
    });
  }

  // ---------- Dialogues ----------

  function initialiserDialogues() {
    const mission = $('#dlg-mission');
    mission.addEventListener('cancel', (e) => {
      if (!etat.debut) e.preventDefault();
    });
    $('#mission-start').addEventListener('click', () => {
      if (!etat.debut) {
        etat.debut = Date.now();
        sauverSession();
        majChrono();
      }
      mission.close();
      document.body.classList.remove('accueil');
      if (editeur) editeur.focus();
    });
    $('#btn-mission').addEventListener('click', () => {
      $('#mission-start').textContent = etat.debut ? 'Reprendre' : 'Commencer';
      mission.showModal();
    });
    $('#btn-resultats').addEventListener('click', telechargerResultats);

    const reset = $('#dlg-reset');
    $('#btn-reset').addEventListener('click', () => reset.showModal());
    $('#reset-cancel').addEventListener('click', () => reset.close());
    $('#reset-confirm').addEventListener('click', () => {
      try {
        localStorage.removeItem(CLE_SESSION);
      } catch {
        /* rien à effacer */
      }
      location.reload();
    });

    $('#bravo-close').addEventListener('click', () => $('#dlg-bravo').close());
    $('#narrow-continue').addEventListener('click', () => document.body.classList.add('narrow-ok'));

    if (!etat.debut) {
      $('#mission-start').textContent = 'Commencer';
      mission.showModal();
    } else {
      document.body.classList.remove('accueil');
    }
  }

  // ---------- Démarrage ----------

  async function demarrer() {
    initialiserDisposition();
    initialiserConsole();
    initialiserReseau();
    initialiserDebogueur();
    $$('.panel-tab').forEach((b) => b.addEventListener('click', () => montrerPanneau(b.dataset.pane)));
    $('#btn-save').addEventListener('click', () => enregistrer());
    $('#pv-reload').addEventListener('click', () => rechargerApercu());
    $('#tests-run').addEventListener('click', () => verifier());
    addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        enregistrer();
      }
    });
    addEventListener('beforeunload', (e) => {
      if (FICHIERS.some(estModifie)) e.preventDefault();
    });

    try {
      await chargerSession();
    } catch (e) {
      $('#editor-loading').replaceChildren(e.message);
      return;
    }

    initialiserDialogues();
    majChrono();
    setInterval(majChrono, 1000);
    majProgression();
    rendreArbre();
    rendreTaches();
    rendreTests();
    rendreCaptures();

    const pythonPret = backend.demarrer();
    try {
      monaco = await chargerMonaco();
    } catch (e) {
      $('#editor-loading').replaceChildren(e.message);
      return;
    }
    configurerMonaco();
    $('#editor-loading').classList.add('hidden');
    ouvrir('README.md');
    ouvrir('backend/plante.py');
    ouvrir('README.md');

    pythonPret.catch((e) => {
      majStatutBackend('err', 'Backend : Python indisponible');
      $('#preview-loading-text').textContent = 'Impossible de démarrer Python : ' + e.message;
    });
    await pythonPret;
    $('#preview-loading-text').textContent = 'Compilation du frontend…';
    await chargerBackend(false);
    await construireApercu();
  }

  demarrer();
})();
