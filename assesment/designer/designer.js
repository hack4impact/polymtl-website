/* Éditeur de l'entrevue designer : canevas façon Figma, bibliothèque de composants,
   calques, inspecteur, historique et mode présentation. */
(() => {
  'use strict';

  const CLE = 'h4i-entrevue-design-v1';
  const HTML_TO_IMAGE = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const borne = (v, a, b) => Math.min(b, Math.max(a, v));
  const arrondi = (v) => Math.round(v);

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
      return true;
    } catch {
      return false;
    }
  };

  const duree = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // ---------- Icônes ----------

  const ICONES = {
    accueil: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z',
    calendrier: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    horloge: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
    utilisateur: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
    famille: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16.5 11a3 3 0 1 0 0-6M17.5 14.5a5.5 5.5 0 0 1 4 5.5',
    cloche: 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15ZM10 21h4',
    recherche: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
    menu: 'M4 7h16M4 12h16M4 17h16',
    retour: 'M15 5l-7 7 7 7',
    suivant: 'M9 5l7 7-7 7',
    'chevron-bas': 'M6 9l6 6 6-6',
    plus: 'M12 5v14M5 12h14',
    valider: 'M5 12.5l4.5 4.5L19 7.5',
    fermer: 'M6 6l12 12M18 6 6 18',
    coeur: 'M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z',
    panier: 'M3 9h18l-2 11H5ZM8 9l3-5M16 9l-3-5M9 13v4M15 13v4',
    lieu: 'M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    telephone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
    message: 'M4 5h16v11H9l-5 4Z',
    reglages: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v5M12 8h.01',
    alerte: 'M12 4 2.5 20h19ZM12 10v4M12 17h.01',
    langue: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z',
    etoile: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z',
    filtre: 'M4 5h16l-6 8v6l-4-2v-4Z',
    liste: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    code: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2',
    modifier: 'M4 20h4L19 9l-4-4L4 16ZM13.5 6.5l4 4',
    poubelle: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    partager: 'M12 4v11M7.5 8.5 12 4l4.5 4.5M5 14v5h14v-5',
    'texte-plus': 'M4 18 9 6l5 12M5.8 14h6.4M17 8v6M14 11h6',
    deconnexion: 'M10 5H5v14h5M14 8l4 4-4 4M18 12H9',
    oeil: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    camion: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    pomme: 'M12 7c-1.5-1.5-6-1.5-6.5 3-.5 4.5 2.5 9.5 4.5 9.5 1 0 1.3-.5 2-.5s1 .5 2 .5c2 0 5-5 4.5-9.5C18 5.5 13.5 5.5 12 7ZM12 7c0-2 1-3.5 3-4',
  };
  const NOMS_ICONES = Object.keys(ICONES);

  const svgIcone = (nom, epaisseur = 1.9) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONES[nom] || ICONES.info}"/></svg>`;

  const SVG_IMAGE = '<svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" fill="none"><rect width="120" height="80" fill="none"/><path d="M20 62 45 36l16 16 10-10 29 20Z" fill="#b8c3d3"/><circle cx="80" cy="24" r="8" fill="#b8c3d3"/></svg>';

  const OUTILS_ICONES = {
    select: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M5 3.5 19 11l-6.2 1.6L10 19Z"/></svg>',
    main: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 10V4.5a1.5 1.5 0 0 1 3 0V10M14 10V5.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6.5 7-2.5 0-4-1-5.5-3L3 13.5a1.5 1.5 0 0 1 2.5-1.6L8 14.5V8a1.5 1.5 0 0 1 3 0"/></svg>',
    ecran: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 3v18M16 3v18M3 8h18M3 16h18"/></svg>',
    rect: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/></svg>',
    texte: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M4 17l5-5 4 4 2.5-2.5L20 18"/><circle cx="15.5" cy="9.5" r="1.3"/></svg>',
  };

  const TYPES_NOMS = { ecran: 'Écran', rect: 'Rectangle', ellipse: 'Ellipse', texte: 'Texte', image: 'Image', icone: 'Icône' };

  const PALETTE = ['#2E7D4F', '#F28C28', '#FFF8EE', '#1F2A24', '#FFFFFF', '#F3F4F6', '#E5E7EB', '#9CA3AF', '#4B5563', '#111827', '#2563EB', '#DBEAFE', '#DC2626', '#FEE2E2', '#16A34A', '#DCFCE7', '#F59E0B', 'transparent'];
  const POLICES = ['Inter', 'DM Sans', 'Poppins', 'Fraunces', 'Source Serif 4'];
  const OMBRES = {
    aucune: 'none',
    douce: '0 1px 3px rgba(17,24,39,.08), 0 2px 8px rgba(17,24,39,.06)',
    moyenne: '0 4px 12px rgba(17,24,39,.12)',
    forte: '0 12px 32px rgba(17,24,39,.18)',
  };

  // ---------- Modèle ----------

  const BASE = {
    ecran: { nom: 'Écran', w: 390, h: 844, fill: '#FFFFFF' },
    rect: { nom: 'Rectangle', w: 120, h: 80, fill: '#E5E7EB' },
    ellipse: { nom: 'Ellipse', w: 80, h: 80, fill: '#E5E7EB' },
    texte: { nom: 'Texte', w: 200, h: 24, fill: 'transparent', texte: 'Texte', taille: 16, graisse: 400, couleur: '#111827', alignH: 'left', alignV: 'top', police: 'Inter', interligne: 1.35, padding: 0 },
    image: { nom: 'Image', w: 200, h: 140, fill: '#E5E7EB', src: null, ajustement: 'cover' },
    icone: { nom: 'Icône', w: 24, h: 24, fill: 'transparent', couleur: '#111827', icone: 'accueil', epaisseur: 1.9 },
  };

  function creer(type, props = {}) {
    return {
      id: uid(),
      type,
      parent: null,
      groupe: null,
      x: 0,
      y: 0,
      visible: true,
      verrou: false,
      stroke: 'transparent',
      strokeWidth: 0,
      radius: 0,
      opacity: 1,
      ombre: 'aucune',
      lien: null,
      ...BASE[type],
      ...props,
    };
  }

  const etat = {
    doc: { elements: [] },
    map: new Map(),
    selection: new Set(),
    outil: 'select',
    zoom: 1,
    panX: 0,
    panY: 0,
    edition: null,
    groupeOuvert: null,
    survol: null,
    historique: [],
    futur: [],
    docOuvert: null,
    debut: null,
    candidat: '',
    guides: [],
    zone: null,
    presse: null,
  };

  const el = (id) => etat.map.get(id);
  const elements = () => etat.doc.elements;
  const ecrans = () => elements().filter((e) => e.type === 'ecran');

  function reindexer() {
    etat.map = new Map(elements().map((e) => [e.id, e]));
    for (const e of elements()) if (e.parent && !etat.map.has(e.parent)) e.parent = null;
    for (const id of [...etat.selection]) if (!etat.map.has(id)) etat.selection.delete(id);
  }

  function abs(e) {
    const p = e.parent ? el(e.parent) : null;
    return p ? { x: p.x + e.x, y: p.y + e.y, w: e.w, h: e.h } : { x: e.x, y: e.y, w: e.w, h: e.h };
  }

  function boite(ids) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const id of ids) {
      const r = abs(el(id));
      x1 = Math.min(x1, r.x);
      y1 = Math.min(y1, r.y);
      x2 = Math.max(x2, r.x + r.w);
      y2 = Math.max(y2, r.y + r.h);
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  const membresGroupe = (g) => elements().filter((e) => e.groupe === g).map((e) => e.id);

  function ecranSous(x, y, exclure) {
    const liste = ecrans().filter((e) => e.visible && !(exclure && exclure.has(e.id)));
    for (let i = liste.length - 1; i >= 0; i--) {
      const r = liste[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }

  // ---------- Historique et sauvegarde ----------

  let derniereCle = null;
  let derniereFois = 0;

  function memoriser(cle) {
    const maintenant = Date.now();
    if (cle && cle === derniereCle && maintenant - derniereFois < 900) {
      derniereFois = maintenant;
      return;
    }
    derniereCle = cle || null;
    derniereFois = maintenant;
    etat.historique.push(JSON.stringify(etat.doc));
    if (etat.historique.length > 120) etat.historique.shift();
    etat.futur = [];
  }

  function annuler() {
    if (!etat.historique.length) return;
    etat.futur.push(JSON.stringify(etat.doc));
    etat.doc = JSON.parse(etat.historique.pop());
    apresRestauration();
  }

  function retablir() {
    if (!etat.futur.length) return;
    etat.historique.push(JSON.stringify(etat.doc));
    etat.doc = JSON.parse(etat.futur.pop());
    apresRestauration();
  }

  function apresRestauration() {
    derniereCle = null;
    terminerEdition(false);
    reindexer();
    toutRendre();
  }

  let minuterieSauvegarde;
  function sauver() {
    clearTimeout(minuterieSauvegarde);
    minuterieSauvegarde = setTimeout(() => {
      if (!ecrire(CLE, { doc: etat.doc, debut: etat.debut, candidat: etat.candidat, vue: { zoom: etat.zoom, panX: etat.panX, panY: etat.panY } })) {
        notifier('Sauvegarde impossible : les images sont peut-être trop lourdes.');
      }
    }, 400);
  }

  let minuterieToast;
  function notifier(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.hidden = false;
    clearTimeout(minuterieToast);
    minuterieToast = setTimeout(() => (t.hidden = true), 2400);
  }

  // ---------- Rendu du canevas ----------

  const noeuds = new Map();

  function creerNoeud(e) {
    if (e.type === 'ecran') {
      const racine = h('div', { class: 'ecran', 'data-id': e.id });
      const titre = h('div', { class: 'ecran-titre', 'data-titre': e.id });
      const contenu = h('div', { class: 'ecran-contenu', 'data-id': e.id });
      racine.append(titre, contenu);
      return { racine, titre, contenu };
    }
    const racine = h('div', { class: 'el type-' + e.type, 'data-id': e.id });
    let interieur = null;
    if (e.type === 'texte') {
      interieur = h('div', { class: 'el-texte' });
      racine.append(interieur);
    }
    return { racine, interieur, cle: '' };
  }

  function appliquerStyle(e, n, echelle = 1) {
    const s = n.racine.style;
    s.left = e.x + 'px';
    s.top = e.y + 'px';
    s.width = e.w + 'px';
    s.height = e.h + 'px';
    s.display = e.visible ? '' : 'none';
    if (e.type === 'ecran') {
      const c = n.contenu.style;
      c.background = e.fill;
      c.borderRadius = e.radius + 'px';
      n.titre.textContent = e.nom;
      n.titre.style.transform = `scale(${1 / echelle})`;
      n.titre.classList.toggle('selected', etat.selection.has(e.id));
      return;
    }
    s.background = e.fill === 'transparent' ? 'transparent' : e.fill;
    s.border = e.strokeWidth > 0 && e.stroke !== 'transparent' ? `${e.strokeWidth}px solid ${e.stroke}` : '0';
    s.borderRadius = e.type === 'ellipse' ? '50%' : e.radius + 'px';
    s.opacity = e.opacity;
    s.boxShadow = OMBRES[e.ombre] || 'none';
    if (e.type === 'texte') {
      const t = n.interieur.style;
      t.fontFamily = `'${e.police}', system-ui, sans-serif`;
      t.fontSize = e.taille + 'px';
      t.fontWeight = e.graisse;
      t.color = e.couleur;
      t.textAlign = e.alignH;
      t.lineHeight = e.interligne;
      t.padding = `0 ${e.padding}px`;
      t.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[e.alignV];
      if (etat.edition !== e.id && n.interieur.textContent !== e.texte) n.interieur.textContent = e.texte;
    } else if (e.type === 'icone') {
      const cle = e.icone + e.epaisseur;
      if (n.cle !== cle) {
        n.racine.innerHTML = svgIcone(e.icone, e.epaisseur);
        n.cle = cle;
      }
      s.color = e.couleur;
    } else if (e.type === 'image') {
      const cle = (e.src ? e.src.length + e.src.slice(-32) : 'vide') + e.ajustement;
      if (n.cle !== cle) {
        n.racine.innerHTML = e.src ? `<img alt="" src="${e.src}" style="object-fit:${e.ajustement}">` : SVG_IMAGE;
        n.cle = cle;
      }
      s.overflow = 'hidden';
    }
  }

  function placer(conteneur, liste) {
    let precedent = null;
    for (const e of liste) {
      const n = noeuds.get(e.id).racine;
      const attendu = precedent ? precedent.nextSibling : conteneur.firstChild;
      if (n.parentNode !== conteneur || attendu !== n) {
        if (precedent) precedent.after(n);
        else conteneur.prepend(n);
      }
      precedent = n;
    }
  }

  function rendreCanevas() {
    const monde = $('#monde');
    monde.style.transform = `translate(${etat.panX}px, ${etat.panY}px) scale(${etat.zoom})`;
    const racines = [];
    const enfants = new Map();
    for (const e of elements()) {
      if (!noeuds.has(e.id)) noeuds.set(e.id, creerNoeud(e));
      appliquerStyle(e, noeuds.get(e.id), etat.zoom);
      if (e.parent) {
        if (!enfants.has(e.parent)) enfants.set(e.parent, []);
        enfants.get(e.parent).push(e);
      } else racines.push(e);
    }
    placer(monde, racines);
    for (const e of ecrans()) placer(noeuds.get(e.id).contenu, enfants.get(e.id) || []);
    for (const [id, n] of noeuds) {
      if (!etat.map.has(id)) {
        n.racine.remove();
        noeuds.delete(id);
      }
    }
    $('#zoom-val').textContent = Math.round(etat.zoom * 100) + ' %';
    rendreSurcouche();
  }

  const versEcran = (x, y) => ({ x: x * etat.zoom + etat.panX, y: y * etat.zoom + etat.panY });

  function versMonde(clientX, clientY) {
    const r = $('#canevas').getBoundingClientRect();
    return { x: (clientX - r.left - etat.panX) / etat.zoom, y: (clientY - r.top - etat.panY) / etat.zoom };
  }

  function cadre(r, classe) {
    const a = versEcran(r.x, r.y);
    return h('div', { class: 'cadre ' + classe, style: `left:${a.x}px;top:${a.y}px;width:${r.w * etat.zoom}px;height:${r.h * etat.zoom}px` });
  }

  function rendreSurcouche() {
    const s = $('#surcouche');
    const morceaux = [];
    if (etat.survol && !etat.selection.has(etat.survol) && el(etat.survol) && !etat.presse) {
      morceaux.push(cadre(abs(el(etat.survol)), 'cadre-survol'));
    }
    const ids = [...etat.selection].filter((id) => el(id) && el(id).visible);
    if (ids.length && etat.edition == null) {
      const groupes = new Set();
      for (const id of ids) {
        if (ids.length > 1) morceaux.push(cadre(abs(el(id)), 'cadre'));
        if (el(id).groupe) groupes.add(el(id).groupe);
      }
      const b = boite(ids);
      morceaux.push(cadre(b, 'cadre-sel' + (groupes.size && ids.length > 1 ? ' cadre-groupe' : '')));
      const a = versEcran(b.x, b.y);
      const w = b.w * etat.zoom, hh = b.h * etat.zoom;
      const verrouille = ids.some((id) => el(id).verrou);
      if (!verrouille) {
        const points = { nw: [0, 0], n: [w / 2, 0], ne: [w, 0], e: [w, hh / 2], se: [w, hh], s: [w / 2, hh], sw: [0, hh], w: [0, hh / 2] };
        const curseurs = { nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw', n: 'ns', s: 'ns', e: 'ew', w: 'ew' };
        for (const [dir, [px, py]] of Object.entries(points)) {
          if ((dir === 'n' || dir === 's') && w < 24) continue;
          if ((dir === 'e' || dir === 'w') && hh < 24) continue;
          morceaux.push(h('div', { class: 'poignee', 'data-poignee': dir, style: `left:${a.x + px}px;top:${a.y + py}px;cursor:${curseurs[dir]}-resize` }));
        }
      }
      morceaux.push(h('div', { class: 'dim', style: `left:${a.x + w / 2}px;top:${a.y + hh + 8}px` }, `${arrondi(b.w)} × ${arrondi(b.h)}`));
    }
    for (const g of etat.guides) {
      if (g.axe === 'x') {
        const a = versEcran(g.pos, g.de), b = versEcran(g.pos, g.a);
        morceaux.push(h('div', { class: 'guide', style: `left:${a.x}px;top:${a.y}px;width:1px;height:${b.y - a.y}px` }));
      } else {
        const a = versEcran(g.de, g.pos), b = versEcran(g.a, g.pos);
        morceaux.push(h('div', { class: 'guide', style: `left:${a.x}px;top:${a.y}px;height:1px;width:${b.x - a.x}px` }));
      }
    }
    if (etat.zone) {
      const z = etat.zone;
      const a = versEcran(Math.min(z.x1, z.x2), Math.min(z.y1, z.y2));
      morceaux.push(h('div', { class: 'selection-zone', style: `left:${a.x}px;top:${a.y}px;width:${Math.abs(z.x2 - z.x1) * etat.zoom}px;height:${Math.abs(z.y2 - z.y1) * etat.zoom}px` }));
    }
    s.replaceChildren(...morceaux);
  }

  function toutRendre() {
    rendreCanevas();
    rendreCalques();
    rendreInspecteur();
    sauver();
  }

  // ---------- Sélection ----------

  function selectionner(ids, ajouter = false) {
    if (!ajouter) etat.selection.clear();
    for (const id of ids) etat.selection.add(id);
    if (etat.groupeOuvert && ![...etat.selection].some((id) => el(id)?.groupe === etat.groupeOuvert)) etat.groupeOuvert = null;
    rendreCanevas();
    rendreCalques();
    rendreInspecteur();
  }

  function cibleDe(id, individuel) {
    const e = el(id);
    if (!e) return [];
    if (e.groupe && !individuel && etat.groupeOuvert !== e.groupe) return membresGroupe(e.groupe);
    return [id];
  }

  // ---------- Opérations ----------

  function ajouter(liste, parentId) {
    memoriser();
    for (const e of liste) {
      e.parent = e.type === 'ecran' ? null : parentId || null;
      elements().push(e);
    }
    reindexer();
    return liste.map((e) => e.id);
  }

  function supprimer(ids) {
    if (!ids.length) return;
    memoriser();
    const a = new Set(ids);
    for (const e of elements()) if (e.parent && a.has(e.parent)) a.add(e.id);
    etat.doc.elements = elements().filter((e) => !a.has(e.id));
    for (const e of elements()) if (e.lien && a.has(e.lien)) e.lien = null;
    etat.selection.clear();
    reindexer();
    toutRendre();
  }

  function copier(ids) {
    const a = new Set(ids);
    const liste = elements().filter((e) => a.has(e.id) || (e.parent && a.has(e.parent)));
    return JSON.parse(JSON.stringify(liste));
  }

  function coller(liste, decalage = 16, parentForce) {
    if (!liste || !liste.length) return [];
    memoriser();
    const ids = new Map();
    const groupes = new Map();
    for (const e of liste) ids.set(e.id, uid());
    const nouveaux = liste.map((e) => {
      const n = { ...e, id: ids.get(e.id) };
      if (e.groupe) {
        if (!groupes.has(e.groupe)) groupes.set(e.groupe, uid());
        n.groupe = groupes.get(e.groupe);
      }
      if (e.parent && ids.has(e.parent)) n.parent = ids.get(e.parent);
      else if (e.type !== 'ecran') {
        if (parentForce !== undefined) {
          const origine = e.parent ? el(e.parent) : null;
          const cible = parentForce ? el(parentForce) : null;
          const ax = (origine ? origine.x : 0) + e.x, ay = (origine ? origine.y : 0) + e.y;
          n.parent = parentForce;
          n.x = cible ? ax - cible.x : ax;
          n.y = cible ? ay - cible.y : ay;
        } else if (e.parent && !el(e.parent)) n.parent = null;
        n.x += decalage;
        n.y += decalage;
      } else {
        n.x += e.w + 80;
      }
      if (n.lien && ids.has(n.lien)) n.lien = ids.get(n.lien);
      return n;
    });
    etat.doc.elements.push(...nouveaux);
    reindexer();
    const nouveauxIds = new Set(nouveaux.map((n) => n.id));
    const racines = nouveaux.filter((n) => !(n.parent && nouveauxIds.has(n.parent)));
    etat.selection = new Set(racines.map((n) => n.id));
    toutRendre();
    return racines.map((n) => n.id);
  }

  function ordonner(ids, sens) {
    if (!ids.length) return;
    memoriser();
    const a = new Set(ids);
    const liste = elements();
    if (sens === 'devant' || sens === 'derriere') {
      const choisis = liste.filter((e) => a.has(e.id));
      const autres = liste.filter((e) => !a.has(e.id));
      etat.doc.elements = sens === 'devant' ? [...autres, ...choisis] : [...choisis, ...autres];
    } else {
      const pas = sens === 'avancer' ? 1 : -1;
      const indices = liste.map((e, i) => (a.has(e.id) ? i : -1)).filter((i) => i >= 0);
      if (pas > 0) indices.reverse();
      for (const i of indices) {
        const e = liste[i];
        let j = i + pas;
        while (j >= 0 && j < liste.length && (liste[j].parent !== e.parent || (liste[j].type === 'ecran') !== (e.type === 'ecran'))) j += pas;
        if (j < 0 || j >= liste.length || a.has(liste[j].id)) continue;
        liste.splice(i, 1);
        liste.splice(j, 0, e);
      }
    }
    reindexer();
    toutRendre();
  }

  function grouper(ids) {
    const liste = ids.map(el).filter((e) => e && e.type !== 'ecran');
    if (liste.length < 2) return notifier('Sélectionne au moins deux éléments à grouper.');
    const parent = liste[0].parent;
    if (liste.some((e) => e.parent !== parent)) return notifier('Les éléments doivent être dans le même écran.');
    memoriser();
    const g = uid();
    for (const e of liste) e.groupe = g;
    toutRendre();
  }

  function degrouper(ids) {
    const liste = ids.map(el).filter((e) => e && e.groupe);
    if (!liste.length) return;
    memoriser();
    for (const e of liste) e.groupe = null;
    etat.groupeOuvert = null;
    toutRendre();
  }

  function reparenter(ids) {
    const deplaces = new Set(ids);
    for (const id of ids) {
      const e = el(id);
      if (!e || e.type === 'ecran') continue;
      const r = abs(e);
      const cible = ecranSous(r.x + r.w / 2, r.y + r.h / 2, deplaces);
      const nouveau = cible ? cible.id : null;
      if (nouveau === e.parent) continue;
      e.parent = nouveau;
      e.x = cible ? r.x - cible.x : r.x;
      e.y = cible ? r.y - cible.y : r.y;
      const liste = elements();
      liste.splice(liste.indexOf(e), 1);
      liste.push(e);
    }
    reindexer();
  }

  function aligner(ids, mode) {
    const liste = ids.map(el).filter((e) => e && !e.verrou);
    if (!liste.length) return;
    memoriser();
    let ref;
    if (liste.length > 1) ref = boite(liste.map((e) => e.id));
    else {
      const p = liste[0].parent ? el(liste[0].parent) : null;
      if (!p) return;
      ref = { x: p.x, y: p.y, w: p.w, h: p.h };
    }
    const groupes = new Map();
    for (const e of liste) {
      const cle = e.groupe || e.id;
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(e);
    }
    const blocs = [...groupes.values()].map((membres) => ({ membres, r: boite(membres.map((m) => m.id)) }));
    if (mode === 'distH' || mode === 'distV') {
      const axe = mode === 'distH' ? 'x' : 'y', taille = mode === 'distH' ? 'w' : 'h';
      if (blocs.length < 3) return notifier('Sélectionne au moins trois éléments à répartir.');
      blocs.sort((a, b) => a.r[axe] - b.r[axe]);
      const total = blocs.reduce((s, b) => s + b.r[taille], 0);
      const espace = (ref[taille] - total) / (blocs.length - 1);
      let pos = ref[axe];
      for (const b of blocs) {
        const d = pos - b.r[axe];
        for (const m of b.membres) m[axe] += d;
        pos += b.r[taille] + espace;
      }
    } else {
      for (const b of blocs) {
        let dx = 0, dy = 0;
        if (mode === 'gauche') dx = ref.x - b.r.x;
        if (mode === 'centreH') dx = ref.x + ref.w / 2 - (b.r.x + b.r.w / 2);
        if (mode === 'droite') dx = ref.x + ref.w - (b.r.x + b.r.w);
        if (mode === 'haut') dy = ref.y - b.r.y;
        if (mode === 'centreV') dy = ref.y + ref.h / 2 - (b.r.y + b.r.h / 2);
        if (mode === 'bas') dy = ref.y + ref.h - (b.r.y + b.r.h);
        for (const m of b.membres) {
          m.x += dx;
          m.y += dy;
        }
      }
    }
    for (const e of liste) {
      e.x = arrondi(e.x);
      e.y = arrondi(e.y);
    }
    toutRendre();
  }

  // ---------- Magnétisme ----------

  function ciblesMagnetiques(ids) {
    const a = new Set(ids);
    const premier = el(ids[0]);
    const parent = premier && premier.type !== 'ecran' ? premier.parent : null;
    const xs = [], ys = [];
    const ajouterRect = (r) => {
      xs.push({ v: r.x, r }, { v: r.x + r.w / 2, r }, { v: r.x + r.w, r });
      ys.push({ v: r.y, r }, { v: r.y + r.h / 2, r }, { v: r.y + r.h, r });
    };
    for (const e of elements()) {
      if (a.has(e.id) || !e.visible) continue;
      if (premier && premier.type === 'ecran') {
        if (e.type === 'ecran') ajouterRect(abs(e));
      } else if (e.parent === parent && e.type !== 'ecran') ajouterRect(abs(e));
    }
    if (parent) ajouterRect(abs(el(parent)));
    return { xs, ys };
  }

  function magnetiser(b, cibles, dirs = { x: [0, 0.5, 1], y: [0, 0.5, 1] }) {
    const seuil = 6 / etat.zoom;
    let meilleurX = null, meilleurY = null;
    for (const f of dirs.x) {
      const v = b.x + b.w * f;
      for (const c of cibles.xs) {
        const d = c.v - v;
        if (Math.abs(d) <= seuil && (!meilleurX || Math.abs(d) < Math.abs(meilleurX.d))) meilleurX = { d, v: c.v, r: c.r };
      }
    }
    for (const f of dirs.y) {
      const v = b.y + b.h * f;
      for (const c of cibles.ys) {
        const d = c.v - v;
        if (Math.abs(d) <= seuil && (!meilleurY || Math.abs(d) < Math.abs(meilleurY.d))) meilleurY = { d, v: c.v, r: c.r };
      }
    }
    const guides = [];
    const dx = meilleurX ? meilleurX.d : 0;
    const dy = meilleurY ? meilleurY.d : 0;
    if (meilleurX) {
      const r = meilleurX.r;
      guides.push({ axe: 'x', pos: meilleurX.v, de: Math.min(r.y, b.y + dy), a: Math.max(r.y + r.h, b.y + dy + b.h) });
    }
    if (meilleurY) {
      const r = meilleurY.r;
      guides.push({ axe: 'y', pos: meilleurY.v, de: Math.min(r.x, b.x + dx), a: Math.max(r.x + r.w, b.x + dx + b.w) });
    }
    return { dx, dy, guides };
  }

  // ---------- Interactions sur le canevas ----------

  let espace = false;

  function demarrerPanoramique(e) {
    const depart = { x: e.clientX, y: e.clientY, panX: etat.panX, panY: etat.panY };
    $('#canevas').classList.add('glisse');
    etat.presse = {
      bouger(ev) {
        etat.panX = depart.panX + ev.clientX - depart.x;
        etat.panY = depart.panY + ev.clientY - depart.y;
        rendreCanevas();
      },
      lacher() {
        $('#canevas').classList.remove('glisse');
        sauver();
      },
    };
  }

  function demarrerDeplacement(e, ids) {
    const depart = versMonde(e.clientX, e.clientY);
    let liste = ids.filter((id) => !el(id).verrou);
    if (!liste.length) return;
    let duplique = false;
    let initial = new Map(liste.map((id) => [id, { x: el(id).x, y: el(id).y }]));
    let b0 = boite(liste);
    let cibles = ciblesMagnetiques(liste);
    let bouge = false;
    etat.presse = {
      bouger(ev) {
        const p = versMonde(ev.clientX, ev.clientY);
        let dx = p.x - depart.x, dy = p.y - depart.y;
        if (!bouge && Math.hypot(dx * etat.zoom, dy * etat.zoom) < 3) return;
        if (!bouge) {
          bouge = true;
          memoriser();
          if (ev.altKey && !duplique) {
            duplique = true;
            const copies = coller(copier(liste), 0);
            etat.historique.pop();
            liste = copies;
            initial = new Map(liste.map((id) => [id, { x: el(id).x, y: el(id).y }]));
            b0 = boite(liste);
            cibles = ciblesMagnetiques(liste);
          }
        }
        if (ev.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        const m = ev.ctrlKey || ev.metaKey ? { dx: 0, dy: 0, guides: [] } : magnetiser({ ...b0, x: b0.x + dx, y: b0.y + dy }, cibles);
        dx = arrondi(dx + m.dx);
        dy = arrondi(dy + m.dy);
        etat.guides = m.guides;
        for (const id of liste) {
          const i = initial.get(id);
          el(id).x = i.x + dx;
          el(id).y = i.y + dy;
        }
        rendreCanevas();
        majChampsPosition();
      },
      lacher() {
        etat.guides = [];
        if (bouge) {
          reparenter(liste);
          toutRendre();
        } else rendreSurcouche();
      },
    };
  }

  function demarrerRedimension(e, dir) {
    const ids = [...etat.selection].filter((id) => el(id) && !el(id).verrou);
    if (!ids.length) return;
    memoriser();
    const b0 = boite(ids);
    const initial = new Map(ids.map((id) => [id, { ...abs(el(id)), x0: el(id).x, y0: el(id).y }]));
    const cibles = ciblesMagnetiques(ids);
    const depart = versMonde(e.clientX, e.clientY);
    etat.presse = {
      bouger(ev) {
        const p = versMonde(ev.clientX, ev.clientY);
        const dx = p.x - depart.x, dy = p.y - depart.y;
        let x1 = b0.x, y1 = b0.y, x2 = b0.x + b0.w, y2 = b0.y + b0.h;
        if (dir.includes('w')) x1 += dx;
        if (dir.includes('e')) x2 += dx;
        if (dir.includes('n')) y1 += dy;
        if (dir.includes('s')) y2 += dy;
        if (ev.altKey) {
          if (dir.includes('w')) x2 -= dx;
          if (dir.includes('e')) x1 -= dx;
          if (dir.includes('n')) y2 -= dy;
          if (dir.includes('s')) y1 -= dy;
        }
        if (!(ev.ctrlKey || ev.metaKey)) {
          const m = magnetiser({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, cibles, {
            x: dir.includes('w') ? [0] : dir.includes('e') ? [1] : [],
            y: dir.includes('n') ? [0] : dir.includes('s') ? [1] : [],
          });
          if (dir.includes('w')) x1 += m.dx;
          if (dir.includes('e')) x2 += m.dx;
          if (dir.includes('n')) y1 += m.dy;
          if (dir.includes('s')) y2 += m.dy;
          etat.guides = m.guides;
        }
        let w = Math.max(1, x2 - x1), hh = Math.max(1, y2 - y1);
        if (x2 < x1) x1 = x2 - 1;
        if (y2 < y1) y1 = y2 - 1;
        if (ev.shiftKey && dir.length === 2) {
          const ratio = b0.w / b0.h;
          if (w / hh > ratio) hh = w / ratio;
          else w = hh * ratio;
          if (dir.includes('w')) x1 = x2 - w;
          if (dir.includes('n')) y1 = y2 - hh;
        }
        const sx = w / b0.w, sy = hh / b0.h;
        for (const id of ids) {
          const i = initial.get(id);
          const e2 = el(id);
          const nx = x1 + (i.x - b0.x) * sx;
          const ny = y1 + (i.y - b0.y) * sy;
          e2.w = Math.max(1, arrondi(i.w * sx));
          e2.h = Math.max(1, arrondi(i.h * sy));
          e2.x = arrondi(i.x0 + (nx - i.x));
          e2.y = arrondi(i.y0 + (ny - i.y));
        }
        rendreCanevas();
        majChampsPosition();
      },
      lacher() {
        etat.guides = [];
        toutRendre();
      },
    };
  }

  function demarrerZone(e, dansEcran) {
    const depart = versMonde(e.clientX, e.clientY);
    const ajout = e.shiftKey;
    const avant = new Set(etat.selection);
    etat.zone = { x1: depart.x, y1: depart.y, x2: depart.x, y2: depart.y };
    etat.presse = {
      bouger(ev) {
        const p = versMonde(ev.clientX, ev.clientY);
        etat.zone.x2 = p.x;
        etat.zone.y2 = p.y;
        const z = { x: Math.min(etat.zone.x1, p.x), y: Math.min(etat.zone.y1, p.y), x2: Math.max(etat.zone.x1, p.x), y2: Math.max(etat.zone.y1, p.y) };
        const trouves = new Set(ajout ? avant : []);
        for (const el2 of elements()) {
          if (!el2.visible || el2.verrou) continue;
          if (dansEcran ? el2.parent !== dansEcran : el2.parent) continue;
          const r = abs(el2);
          if (r.x < z.x2 && r.x + r.w > z.x && r.y < z.y2 && r.y + r.h > z.y) for (const id of cibleDe(el2.id)) trouves.add(id);
        }
        etat.selection = trouves;
        rendreCanevas();
      },
      lacher() {
        etat.zone = null;
        rendreCanevas();
        rendreCalques();
        rendreInspecteur();
      },
    };
  }

  function demarrerCreation(e) {
    const type = etat.outil;
    const depart = versMonde(e.clientX, e.clientY);
    const parent = type === 'ecran' ? null : ecranSous(depart.x, depart.y);
    const ox = parent ? parent.x : 0, oy = parent ? parent.y : 0;
    let cree = null;
    etat.presse = {
      bouger(ev) {
        const p = versMonde(ev.clientX, ev.clientY);
        if (!cree && Math.hypot((p.x - depart.x) * etat.zoom, (p.y - depart.y) * etat.zoom) < 4) return;
        let x1 = Math.min(depart.x, p.x), y1 = Math.min(depart.y, p.y);
        let w = Math.abs(p.x - depart.x), hh = Math.abs(p.y - depart.y);
        if (ev.shiftKey) w = hh = Math.max(w, hh);
        if (!cree) {
          cree = creer(type, type === 'ecran' ? { nom: `Écran ${ecrans().length + 1}` } : {});
          ajouter([cree], parent && parent.id);
          etat.selection = new Set([cree.id]);
        }
        cree.x = arrondi(x1 - ox);
        cree.y = arrondi(y1 - oy);
        cree.w = Math.max(1, arrondi(w));
        cree.h = Math.max(1, arrondi(hh));
        rendreCanevas();
      },
      lacher() {
        if (!cree) {
          cree = creer(type, type === 'ecran' ? { nom: `Écran ${ecrans().length + 1}` } : {});
          const centrer = type !== 'ecran' && type !== 'texte';
          cree.x = arrondi(depart.x - ox - (centrer ? cree.w / 2 : 0));
          cree.y = arrondi(depart.y - oy - (centrer ? cree.h / 2 : type === 'texte' ? cree.h / 2 : 0));
          ajouter([cree], parent && parent.id);
        }
        etat.selection = new Set([cree.id]);
        choisirOutil('select');
        toutRendre();
        if (type === 'texte') commencerEdition(cree.id, true);
      },
    };
  }

  function installerCanevas() {
    const canevas = $('#canevas');

    canevas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      if (etat.edition && e.target.closest('[contenteditable="true"]')) return;
      if (etat.edition) terminerEdition();
      const poignee = e.target.closest('[data-poignee]');
      if (e.button === 1 || etat.outil === 'main' || espace) return demarrerPanoramique(e);
      if (poignee) return demarrerRedimension(e, poignee.dataset.poignee);
      if (['rect', 'ellipse', 'texte', 'ecran', 'image'].includes(etat.outil)) return demarrerCreation(e);

      const titre = e.target.closest('[data-titre]');
      const noeud = e.target.closest('[data-id]');
      let id = titre ? titre.dataset.titre : noeud ? noeud.dataset.id : null;
      let cible = id ? el(id) : null;

      // Une zone vide d'un écran démarre une sélection par zone dans cet écran
      if (cible && cible.type === 'ecran' && !titre) {
        const dansSelection = etat.selection.has(cible.id);
        if (!dansSelection) {
          if (!e.shiftKey) etat.selection.clear();
          rendreCanevas();
          return demarrerZone(e, cible.id);
        }
      }
      if (cible && cible.verrou && cible.type !== 'ecran') {
        const p = cible.parent;
        if (!e.shiftKey) etat.selection.clear();
        rendreCanevas();
        return demarrerZone(e, p);
      }
      if (!cible) {
        if (!e.shiftKey) etat.selection.clear();
        etat.groupeOuvert = null;
        rendreCanevas();
        return demarrerZone(e, null);
      }

      const ids = cibleDe(cible.id, e.ctrlKey || e.metaKey);
      if (e.shiftKey) {
        const toutes = ids.every((i) => etat.selection.has(i));
        for (const i of ids) toutes ? etat.selection.delete(i) : etat.selection.add(i);
        selectionner([], true);
        return;
      }
      if (!ids.every((i) => etat.selection.has(i))) selectionner(ids);
      demarrerDeplacement(e, [...etat.selection]);
    });

    addEventListener('pointermove', (e) => {
      if (etat.presse) etat.presse.bouger(e);
    });
    canevas.addEventListener('pointermove', (e) => {
      if (etat.presse) return;
      const noeud = e.target.closest('[data-id]');
      const titre = e.target.closest('[data-titre]');
      let id = titre ? titre.dataset.titre : noeud ? noeud.dataset.id : null;
      if (id && el(id)?.type === 'ecran' && !titre) id = null;
      if (id && el(id)?.groupe && etat.groupeOuvert !== el(id).groupe && !(e.ctrlKey || e.metaKey)) id = null;
      if (id !== etat.survol) {
        etat.survol = id;
        rendreSurcouche();
      }
    });

    const finir = (e) => {
      if (!etat.presse) return;
      const p = etat.presse;
      etat.presse = null;
      p.lacher(e);
    };
    addEventListener('pointerup', finir);
    addEventListener('pointercancel', finir);
    canevas.addEventListener('pointerleave', () => {
      if (etat.survol) {
        etat.survol = null;
        rendreSurcouche();
      }
    });

    canevas.addEventListener('dblclick', (e) => {
      const noeud = e.target.closest('[data-id]');
      if (!noeud) return;
      const cible = el(noeud.dataset.id);
      if (!cible || cible.type === 'ecran' || cible.verrou) return;
      if (cible.groupe && etat.groupeOuvert !== cible.groupe) {
        etat.groupeOuvert = cible.groupe;
        selectionner([cible.id]);
      }
      if (cible.type === 'texte') commencerEdition(cible.id);
      else if (cible.type === 'image') choisirImage(cible.id);
    });

    canevas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          const r = canevas.getBoundingClientRect();
          zoomer(etat.zoom * Math.exp(-e.deltaY * 0.0085), e.clientX - r.left, e.clientY - r.top);
        } else {
          etat.panX -= e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
          etat.panY -= e.shiftKey && !e.deltaX ? 0 : e.deltaY;
          rendreCanevas();
          sauver();
        }
      },
      { passive: false }
    );

    canevas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function zoomer(z, cx, cy) {
    const r = $('#canevas').getBoundingClientRect();
    if (cx == null) {
      cx = r.width / 2;
      cy = r.height / 2;
    }
    z = borne(z, 0.05, 6);
    const mx = (cx - etat.panX) / etat.zoom, my = (cy - etat.panY) / etat.zoom;
    etat.zoom = z;
    etat.panX = cx - mx * z;
    etat.panY = cy - my * z;
    rendreCanevas();
    sauver();
  }

  function ajuster(ids) {
    const liste = ids && ids.length ? ids : elements().filter((e) => !e.parent).map((e) => e.id);
    const r = $('#canevas').getBoundingClientRect();
    if (!liste.length) {
      etat.zoom = 1;
      etat.panX = r.width / 2;
      etat.panY = r.height / 2;
      return rendreCanevas();
    }
    const b = boite(liste);
    const marge = 60;
    const z = borne(Math.min((r.width - marge * 2) / b.w, (r.height - marge * 2) / b.h), 0.05, 1);
    etat.zoom = z;
    etat.panX = (r.width - b.w * z) / 2 - b.x * z;
    etat.panY = (r.height - b.h * z) / 2 - b.y * z + 10;
    rendreCanevas();
    sauver();
  }

  // ---------- Texte ----------

  function commencerEdition(id, nouveau = false) {
    const e = el(id);
    const n = noeuds.get(id);
    if (!e || !n || e.type !== 'texte') return;
    etat.edition = id;
    etat.selection = new Set([id]);
    memoriser();
    const t = n.interieur;
    t.contentEditable = 'true';
    t.spellcheck = false;
    t.focus();
    const plage = document.createRange();
    plage.selectNodeContents(t);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(plage);
    t.onkeydown = (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Escape') {
        ev.preventDefault();
        terminerEdition();
      }
    };
    t.oninput = () => {
      e.texte = t.innerText.replace(/\n$/, '');
      const hauteur = t.scrollHeight;
      if (hauteur > e.h) {
        e.h = Math.ceil(hauteur);
        n.racine.style.height = e.h + 'px';
      }
    };
    t.onblur = () => terminerEdition();
    rendreSurcouche();
    rendreInspecteur();
  }

  function terminerEdition(rendre = true) {
    if (!etat.edition) return;
    const id = etat.edition;
    etat.edition = null;
    const n = noeuds.get(id);
    const e = el(id);
    if (n && n.interieur) {
      n.interieur.contentEditable = 'false';
      n.interieur.onblur = n.interieur.oninput = n.interieur.onkeydown = null;
      if (e) e.texte = n.interieur.innerText.replace(/\n$/, '');
    }
    getSelection().removeAllRanges();
    if (rendre) toutRendre();
  }

  // ---------- Images ----------

  let imageCible = null;
  function choisirImage(id) {
    imageCible = id;
    $('#fichier-image').value = '';
    $('#fichier-image').click();
  }

  function installerImages() {
    $('#fichier-image').addEventListener('change', (ev) => {
      const f = ev.target.files[0];
      if (!f || !imageCible) return;
      if (f.size > 1.5 * 1024 * 1024) return notifier('Image trop lourde (1,5 Mo maximum).');
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const e = el(imageCible);
        if (!e) return;
        memoriser();
        e.src = lecteur.result;
        toutRendre();
      };
      lecteur.readAsDataURL(f);
    });
  }

  // ---------- Bibliothèque ----------

  const T = (props) => creer('texte', props);
  const R = (props) => creer('rect', props);
  const E = (props) => creer('ellipse', props);
  const I = (props) => creer('icone', props);
  const IMG = (props) => creer('image', props);

  const BIBLIO = [
    {
      titre: 'Écrans',
      items: [
        { nom: 'Mobile', ecran: true, faire: () => [creer('ecran', { nom: 'Mobile', w: 390, h: 844 })] },
        { nom: 'Tablette', ecran: true, faire: () => [creer('ecran', { nom: 'Tablette', w: 1024, h: 768 })] },
        { nom: 'Ordinateur', ecran: true, faire: () => [creer('ecran', { nom: 'Ordinateur', w: 1440, h: 900 })] },
      ],
    },
    {
      titre: 'Navigation',
      items: [
        {
          nom: 'Barre du haut',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 390, h: 56, fill: '#FFFFFF' }),
            R({ nom: 'Bordure', x: 0, y: 55, w: 390, h: 1, fill: '#E5E7EB' }),
            I({ nom: 'Retour', x: 16, y: 16, icone: 'retour' }),
            T({ nom: 'Titre', x: 60, y: 16, w: 270, h: 24, texte: 'Titre', taille: 17, graisse: 600, alignH: 'center', alignV: 'middle' }),
          ],
        },
        {
          nom: "Barre d'onglets",
          faire: () => {
            const items = [['accueil', 'Accueil'], ['calendrier', 'Réserver'], ['liste', 'Rendez-vous'], ['utilisateur', 'Profil']];
            return [
              R({ nom: 'Fond', x: 0, y: 0, w: 390, h: 76, fill: '#FFFFFF' }),
              R({ nom: 'Bordure', x: 0, y: 0, w: 390, h: 1, fill: '#E5E7EB' }),
              ...items.flatMap(([icone, texte], i) => [
                I({ nom: texte, x: 97.5 * i + 36.75, y: 12, icone, couleur: i ? '#6B7280' : '#111827' }),
                T({ nom: texte, x: 97.5 * i, y: 40, w: 97.5, h: 18, texte, taille: 12, graisse: i ? 500 : 600, couleur: i ? '#6B7280' : '#111827', alignH: 'center' }),
              ]),
            ];
          },
        },
        {
          nom: 'Menu latéral',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 240, h: 400, fill: '#F9FAFB' }),
            T({ nom: 'Titre', x: 20, y: 24, w: 200, h: 24, texte: 'Le Panier Solidaire', taille: 16, graisse: 700 }),
            ...['Aujourd’hui', 'Créneaux', 'Familles', 'Réglages'].flatMap((t, i) => [
              R({ nom: 'Élément', x: 12, y: 72 + i * 44, w: 216, h: 38, radius: 8, fill: i ? 'transparent' : '#E5E7EB' }),
              T({ nom: t, x: 24, y: 72 + i * 44, w: 190, h: 38, texte: t, taille: 14, graisse: i ? 500 : 600, alignV: 'middle', couleur: '#111827' }),
            ]),
          ],
        },
      ],
    },
    {
      titre: 'Texte',
      items: [
        { nom: 'Titre', faire: () => [T({ nom: 'Titre', w: 342, h: 36, texte: 'Titre de la page', taille: 28, graisse: 700 })] },
        { nom: 'Sous-titre', faire: () => [T({ nom: 'Sous-titre', w: 342, h: 28, texte: 'Sous-titre', taille: 20, graisse: 600 })] },
        { nom: 'Paragraphe', faire: () => [T({ nom: 'Paragraphe', w: 342, h: 66, texte: 'Texte de paragraphe. Double-clique pour le modifier.', taille: 16, couleur: '#4B5563', interligne: 1.4 })] },
        { nom: 'Étiquette', faire: () => [T({ nom: 'Étiquette', w: 160, h: 18, texte: 'ÉTIQUETTE', taille: 12, graisse: 600, couleur: '#6B7280' })] },
      ],
    },
    {
      titre: 'Boutons',
      items: [
        { nom: 'Principal', faire: () => [T({ nom: 'Bouton principal', w: 342, h: 52, texte: 'Continuer', taille: 17, graisse: 600, couleur: '#FFFFFF', fill: '#111827', radius: 12, alignH: 'center', alignV: 'middle' })] },
        { nom: 'Secondaire', faire: () => [T({ nom: 'Bouton secondaire', w: 342, h: 52, texte: 'Annuler', taille: 17, graisse: 600, couleur: '#111827', fill: '#FFFFFF', stroke: '#D1D5DB', strokeWidth: 1.5, radius: 12, alignH: 'center', alignV: 'middle' })] },
        { nom: 'Lien', faire: () => [T({ nom: 'Lien', w: 140, h: 36, texte: 'En savoir plus', taille: 16, graisse: 600, couleur: '#2563EB', alignH: 'center', alignV: 'middle' })] },
        {
          nom: 'Bouton icône',
          faire: () => [E({ nom: 'Fond', x: 0, y: 0, w: 48, h: 48, fill: '#F3F4F6' }), I({ nom: 'Icône', x: 12, y: 12, icone: 'plus' })],
        },
      ],
    },
    {
      titre: 'Formulaires',
      items: [
        {
          nom: 'Champ texte',
          faire: () => [
            T({ nom: 'Libellé', x: 0, y: 0, w: 342, h: 20, texte: 'Prénom', taille: 14, graisse: 600 }),
            T({ nom: 'Champ', x: 0, y: 28, w: 342, h: 52, texte: 'Ex. Fatima', taille: 16, couleur: '#9CA3AF', fill: '#FFFFFF', stroke: '#D1D5DB', strokeWidth: 1.5, radius: 10, padding: 16, alignV: 'middle' }),
          ],
        },
        {
          nom: 'Liste déroulante',
          faire: () => [
            T({ nom: 'Libellé', x: 0, y: 0, w: 342, h: 20, texte: 'Taille du foyer', taille: 14, graisse: 600 }),
            T({ nom: 'Champ', x: 0, y: 28, w: 342, h: 52, texte: '3 personnes', taille: 16, fill: '#FFFFFF', stroke: '#D1D5DB', strokeWidth: 1.5, radius: 10, padding: 16, alignV: 'middle' }),
            I({ nom: 'Chevron', x: 302, y: 42, icone: 'chevron-bas', couleur: '#6B7280' }),
          ],
        },
        {
          nom: 'Recherche',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 342, h: 48, fill: '#F3F4F6', radius: 12 }),
            I({ nom: 'Loupe', x: 14, y: 12, icone: 'recherche', couleur: '#6B7280' }),
            T({ nom: 'Texte', x: 48, y: 0, w: 280, h: 48, texte: 'Rechercher', taille: 16, couleur: '#9CA3AF', alignV: 'middle' }),
          ],
        },
        {
          nom: 'Case à cocher',
          faire: () => [
            T({ nom: 'Case', x: 0, y: 2, w: 24, h: 24, texte: '', fill: '#111827', radius: 6 }),
            I({ nom: 'Coche', x: 3, y: 5, w: 18, h: 18, icone: 'valider', couleur: '#FFFFFF', epaisseur: 2.6 }),
            T({ nom: 'Libellé', x: 36, y: 0, w: 260, h: 28, texte: 'Me rappeler par texto', taille: 16, alignV: 'middle' }),
          ],
        },
        {
          nom: 'Bouton radio',
          faire: () => [
            E({ nom: 'Cercle', x: 0, y: 2, w: 24, h: 24, fill: '#FFFFFF', stroke: '#111827', strokeWidth: 2 }),
            E({ nom: 'Point', x: 6, y: 8, w: 12, h: 12, fill: '#111827' }),
            T({ nom: 'Libellé', x: 36, y: 0, w: 260, h: 28, texte: 'Français', taille: 16, alignV: 'middle' }),
          ],
        },
        {
          nom: 'Interrupteur',
          faire: () => [
            R({ nom: 'Piste', x: 0, y: 0, w: 52, h: 32, radius: 16, fill: '#16A34A' }),
            E({ nom: 'Bouton', x: 23, y: 3, w: 26, h: 26, fill: '#FFFFFF', ombre: 'douce' }),
          ],
        },
      ],
    },
    {
      titre: 'Contenu',
      items: [
        {
          nom: 'Carte',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 342, h: 236, fill: '#FFFFFF', radius: 16, stroke: '#E5E7EB', strokeWidth: 1, ombre: 'douce' }),
            IMG({ nom: 'Image', x: 12, y: 12, w: 318, h: 120, radius: 10 }),
            T({ nom: 'Titre', x: 16, y: 146, w: 310, h: 26, texte: 'Titre de la carte', taille: 18, graisse: 600 }),
            T({ nom: 'Texte', x: 16, y: 176, w: 310, h: 44, texte: 'Une courte description sur deux lignes au maximum.', taille: 14, couleur: '#6B7280' }),
          ],
        },
        {
          nom: 'Élément de liste',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 342, h: 72, fill: '#FFFFFF', radius: 12 }),
            E({ nom: 'Cercle', x: 12, y: 14, w: 44, h: 44, fill: '#F3F4F6' }),
            I({ nom: 'Icône', x: 22, y: 24, icone: 'calendrier' }),
            T({ nom: 'Titre', x: 68, y: 14, w: 230, h: 22, texte: 'Jeudi 14 novembre', taille: 16, graisse: 600 }),
            T({ nom: 'Sous-titre', x: 68, y: 38, w: 230, h: 20, texte: '10 h 15 · Comptoir 2', taille: 14, couleur: '#6B7280' }),
            I({ nom: 'Chevron', x: 306, y: 24, icone: 'suivant', couleur: '#9CA3AF' }),
          ],
        },
        {
          nom: 'Créneau horaire',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 104, h: 64, fill: '#FFFFFF', radius: 12, stroke: '#D1D5DB', strokeWidth: 1.5 }),
            T({ nom: 'Heure', x: 0, y: 12, w: 104, h: 22, texte: '10 h 15', taille: 17, graisse: 600, alignH: 'center' }),
            T({ nom: 'Places', x: 0, y: 36, w: 104, h: 16, texte: '3 places', taille: 12, couleur: '#6B7280', alignH: 'center' }),
          ],
        },
        { nom: 'Puce', faire: () => [T({ nom: 'Puce', w: 96, h: 36, texte: 'Mardi', taille: 14, graisse: 500, fill: '#F3F4F6', radius: 18, alignH: 'center', alignV: 'middle' })] },
        { nom: 'Badge', faire: () => [T({ nom: 'Badge', w: 88, h: 24, texte: 'Confirmé', taille: 12, graisse: 600, couleur: '#166534', fill: '#DCFCE7', radius: 12, alignH: 'center', alignV: 'middle' })] },
        {
          nom: 'Bannière',
          faire: () => [
            R({ nom: 'Fond', x: 0, y: 0, w: 342, h: 64, fill: '#FEF3C7', radius: 12 }),
            I({ nom: 'Icône', x: 16, y: 20, icone: 'info', couleur: '#B45309' }),
            T({ nom: 'Message', x: 52, y: 0, w: 276, h: 64, texte: 'Rappel : apporte tes sacs réutilisables.', taille: 14, couleur: '#92400E', alignV: 'middle' }),
          ],
        },
        {
          nom: 'Code',
          faire: () =>
            ['4', '8', '2', '7'].map((c, i) => T({ nom: 'Chiffre ' + (i + 1), x: i * 76, y: 0, w: 64, h: 76, texte: c, taille: 34, graisse: 700, fill: '#F3F4F6', radius: 12, alignH: 'center', alignV: 'middle' })),
        },
        {
          nom: 'Avatar',
          faire: () => [E({ nom: 'Fond', x: 0, y: 0, w: 48, h: 48, fill: '#DBEAFE' }), T({ nom: 'Initiales', x: 0, y: 0, w: 48, h: 48, texte: 'FA', taille: 16, graisse: 600, couleur: '#1E40AF', alignH: 'center', alignV: 'middle' })],
        },
        { nom: 'Image', faire: () => [IMG({ nom: 'Image', w: 342, h: 180, radius: 12 })] },
        { nom: 'Icône', faire: () => [I({ nom: 'Icône', icone: 'panier', w: 32, h: 32 })] },
        { nom: 'Séparateur', faire: () => [R({ nom: 'Séparateur', w: 342, h: 1, fill: '#E5E7EB' })] },
      ],
    },
    {
      titre: 'Formes',
      items: [
        { nom: 'Rectangle', faire: () => [R({ radius: 8 })] },
        { nom: 'Ellipse', faire: () => [E({})] },
        { nom: 'Ligne', faire: () => [R({ nom: 'Ligne', w: 160, h: 2, fill: '#111827' })] },
      ],
    },
  ];

  function dimensions(liste) {
    let w = 0, hh = 0;
    for (const e of liste) {
      w = Math.max(w, e.x + e.w);
      hh = Math.max(hh, e.y + e.h);
    }
    return { w, h: hh };
  }

  function rendreApercu(liste) {
    const d = dimensions(liste);
    const conteneur = h('div', { style: `width:${d.w}px;height:${d.h}px;position:absolute` });
    for (const e of liste) {
      if (e.type === 'ecran') {
        conteneur.append(h('div', { style: `position:absolute;left:0;top:0;width:${e.w}px;height:${e.h}px;background:#fff;border-radius:${Math.max(e.w, e.h) / 20}px;box-shadow:0 0 0 ${Math.max(e.w, e.h) / 60}px #c9d6e6` }));
        continue;
      }
      const n = creerNoeud(e);
      appliquerStyle(e, n);
      conteneur.append(n.racine);
    }
    return { conteneur, d };
  }

  function rendreBibliotheque() {
    const pane = $('#pane-composants');
    pane.replaceChildren(
      h('p', { class: 'vide', style: 'margin-top:0' }, 'Glisse un composant dans un écran, ou clique dessus pour l’ajouter à l’écran sélectionné.'),
      ...BIBLIO.flatMap((section) => [
        h('p', { class: 'side-title' }, section.titre),
        h('div', { class: 'biblio' },
          section.items.map((item) => {
            const { conteneur, d } = rendreApercu(item.faire());
            const echelle = Math.min(1, 104 / d.w, 46 / d.h);
            conteneur.style.transform = `scale(${echelle})`;
            conteneur.style.left = (116 - d.w * echelle) / 2 - 6 + 'px';
            conteneur.style.top = (58 - d.h * echelle) / 2 + 'px';
            const tuile = h('div', { class: 'tuile', title: item.nom }, h('div', { class: 'tuile-apercu' }, conteneur), h('span', { class: 'tuile-nom' }, item.nom));
            tuile.addEventListener('pointerdown', (e) => glisserComposant(e, item, tuile));
            return tuile;
          })
        ),
      ])
    );
  }

  function insererComposant(item, xMonde, yMonde) {
    const liste = item.faire();
    const d = dimensions(liste);
    let parent = null;
    let ox, oy;
    if (item.ecran) {
      if (xMonde == null) {
        const derniers = ecrans();
        const dernier = derniers[derniers.length - 1];
        ox = dernier ? dernier.x + dernier.w + 80 : 0;
        oy = dernier ? dernier.y : 0;
      } else {
        ox = xMonde - d.w / 2;
        oy = yMonde - 40;
      }
      liste[0].nom = `${liste[0].nom} ${ecrans().length + 1}`;
    } else {
      if (xMonde == null) {
        const sel = [...etat.selection].map(el).find(Boolean);
        parent = sel ? (sel.type === 'ecran' ? sel : sel.parent ? el(sel.parent) : null) : null;
        if (!parent) parent = ecrans()[0] || null;
        if (parent) {
          xMonde = parent.x + parent.w / 2;
          yMonde = parent.y + Math.min(parent.h / 2, 160 + d.h / 2);
        } else {
          const r = $('#canevas').getBoundingClientRect();
          const c = versMonde(r.left + r.width / 2, r.top + r.height / 2);
          xMonde = c.x;
          yMonde = c.y;
        }
      } else parent = ecranSous(xMonde, yMonde);
      ox = xMonde - d.w / 2 - (parent ? parent.x : 0);
      oy = yMonde - d.h / 2 - (parent ? parent.y : 0);
    }
    const groupe = liste.length > 1 ? uid() : null;
    for (const e of liste) {
      e.x = arrondi(e.x + ox);
      e.y = arrondi(e.y + oy);
      e.groupe = groupe;
    }
    const ids = ajouter(liste, parent && parent.id);
    etat.selection = new Set(item.ecran ? [ids[0]] : ids);
    toutRendre();
    if (item.ecran) ajuster(ecrans().map((e) => e.id));
  }

  function glisserComposant(e, item, tuile) {
    e.preventDefault();
    const depart = { x: e.clientX, y: e.clientY };
    let fantome = null;
    const bouger = (ev) => {
      if (!fantome && Math.hypot(ev.clientX - depart.x, ev.clientY - depart.y) < 5) return;
      if (!fantome) {
        const { conteneur, d } = rendreApercu(item.faire());
        const echelle = item.ecran ? Math.min(0.25, etat.zoom) : etat.zoom;
        fantome = h('div', { class: 'fantome', style: `width:${d.w}px;height:${d.h}px;transform:scale(${echelle})` }, conteneur);
        fantome.dataset.w = d.w * echelle;
        fantome.dataset.h = d.h * echelle;
        document.body.append(fantome);
      }
      fantome.style.left = ev.clientX - fantome.dataset.w / 2 + 'px';
      fantome.style.top = ev.clientY - fantome.dataset.h / 2 + 'px';
    };
    const lacher = (ev) => {
      removeEventListener('pointermove', bouger);
      removeEventListener('pointerup', lacher);
      if (!fantome) return insererComposant(item);
      fantome.remove();
      const r = $('#canevas').getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
      const p = versMonde(ev.clientX, ev.clientY);
      insererComposant(item, p.x, p.y);
    };
    addEventListener('pointermove', bouger);
    addEventListener('pointerup', lacher);
    tuile.blur();
  }

  // ---------- Calques ----------

  const ICONES_CALQUE = {
    ecran: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v18M16 3v18M3 8h18M3 16h18"/></svg>',
    rect: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>',
    texte: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M4 17l5-5 4 4 2.5-2.5L20 18"/></svg>',
    icone: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/></svg>',
    groupe: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2.5"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  };
  const OEIL = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const OEIL_BARRE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.4 6.4A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.3-1"/></svg>';
  const CADENAS = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CADENAS_OUVERT = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';

  let minuterieCalques = 0;
  function rendreCalques() {
    cancelAnimationFrame(minuterieCalques);
    minuterieCalques = requestAnimationFrame(construireCalques);
  }

  function ligneCalque(e, profondeur) {
    const ligne = h('div', {
      class: 'calque' + (e.type === 'ecran' ? ' calque-ecran' : '') + (etat.selection.has(e.id) ? ' selected' : '') + (e.visible ? '' : ' cache'),
      style: `--depth:${profondeur}`,
      onclick: (ev) => {
        if (ev.shiftKey) {
          etat.selection.has(e.id) ? etat.selection.delete(e.id) : etat.selection.add(e.id);
          selectionner([], true);
        } else {
          if (e.groupe) etat.groupeOuvert = e.groupe;
          selectionner([e.id]);
        }
      },
      onmouseenter: () => {
        etat.survol = e.id;
        rendreSurcouche();
      },
      onmouseleave: () => {
        etat.survol = null;
        rendreSurcouche();
      },
    },
      h('span', { class: 'calque-type', html: ICONES_CALQUE[e.type] }),
      h('span', { class: 'calque-nom', ondblclick: (ev) => renommer(ev.currentTarget, e) }, e.nom),
      h('button', { class: 'calque-btn' + (e.verrou ? ' on' : ''), type: 'button', title: e.verrou ? 'Déverrouiller' : 'Verrouiller', html: e.verrou ? CADENAS : CADENAS_OUVERT, onclick: (ev) => { ev.stopPropagation(); memoriser(); e.verrou = !e.verrou; toutRendre(); } }),
      h('button', { class: 'calque-btn' + (e.visible ? '' : ' on'), type: 'button', title: e.visible ? 'Masquer' : 'Afficher', html: e.visible ? OEIL : OEIL_BARRE, onclick: (ev) => { ev.stopPropagation(); memoriser(); e.visible = !e.visible; toutRendre(); } })
    );
    return ligne;
  }

  function construireCalques() {
    const pane = $('#pane-calques');
    const lignes = [];
    const parParent = new Map();
    for (const e of elements()) {
      const p = e.parent || '';
      if (!parParent.has(p)) parParent.set(p, []);
      parParent.get(p).push(e);
    }
    const listerNiveau = (liste, profondeur) => {
      const inverse = [...liste].reverse();
      const vus = new Set();
      for (const e of inverse) {
        if (e.groupe) {
          if (vus.has(e.groupe)) continue;
          vus.add(e.groupe);
          const membres = inverse.filter((m) => m.groupe === e.groupe);
          const choisi = membres.every((m) => etat.selection.has(m.id));
          lignes.push(h('div', {
            class: 'calque' + (choisi ? ' selected' : ''),
            style: `--depth:${profondeur}`,
            onclick: () => {
              etat.groupeOuvert = null;
              selectionner(membres.map((m) => m.id));
            },
          }, h('span', { class: 'calque-type', html: ICONES_CALQUE.groupe }), h('span', { class: 'calque-nom' }, 'Groupe')));
          for (const m of membres) lignes.push(ligneCalque(m, profondeur + 1));
        } else {
          lignes.push(ligneCalque(e, profondeur));
          if (e.type === 'ecran') listerNiveau(parParent.get(e.id) || [], profondeur + 1);
        }
      }
    };
    listerNiveau(parParent.get('') || [], 0);
    pane.replaceChildren(...(lignes.length ? lignes : [h('p', { class: 'vide' }, 'Aucun élément. Ajoute un écran depuis les Composants ou avec l’outil Écran (F).')]));
  }

  function renommer(cible, e) {
    const champ = h('input', { value: e.nom });
    cible.replaceChildren(champ);
    champ.focus();
    champ.select();
    const valider = () => {
      if (champ.value.trim() && champ.value !== e.nom) {
        memoriser();
        e.nom = champ.value.trim();
      }
      toutRendre();
    };
    champ.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') champ.blur();
      if (ev.key === 'Escape') {
        champ.value = e.nom;
        champ.blur();
      }
    });
    champ.addEventListener('blur', valider);
    champ.addEventListener('click', (ev) => ev.stopPropagation());
  }

  // ---------- Inspecteur ----------

  const IC = {
    gauche: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 3v18M8 7h10M8 12h6M8 17h12"/></svg>',
    centreH: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 3v18M6 7h12M8 12h8M5 17h14"/></svg>',
    droite: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M20 3v18M6 7h10M10 12h6M4 17h12"/></svg>',
    haut: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 4h18M7 8v10M12 8v6M17 8v12"/></svg>',
    centreV: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 12h18M7 6v12M12 8v8M17 5v14"/></svg>',
    bas: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 20h18M7 6v10M12 10v6M17 4v12"/></svg>',
    distH: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 4v16M20 4v16M10 8h4v8h-4z"/></svg>',
    distV: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 4h16M4 20h16M8 10h8v4H8z"/></svg>',
    txtG: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></svg>',
    txtC: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 6h16M7 10h10M4 14h16M7 18h10"/></svg>',
    txtD: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></svg>',
    vHaut: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 4h16M12 8v12M8 12l4-4 4 4"/></svg>',
    vMilieu: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 12h16M12 3v5M12 16v5M9 6l3 2 3-2M9 18l3-2 3 2"/></svg>',
    vBas: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 20h16M12 4v12M8 12l4 4 4-4"/></svg>',
    avant: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    arriere: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    dupliquer: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    supprimer: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  };

  function selectionListe() {
    return [...etat.selection].map(el).filter(Boolean);
  }

  function modifier(liste, champ, valeur, cle) {
    memoriser(cle || champ + [...etat.selection].join());
    for (const e of liste) e[champ] = valeur;
    rendreCanevas();
    rendreCalques();
    sauver();
  }

  function champNombre(etiquette, valeur, surChange, opts = {}) {
    const input = h('input', { type: 'number', value: valeur == null ? '' : +(+valeur).toFixed(2), step: opts.pas || 1, min: opts.min, max: opts.max, placeholder: valeur == null ? 'Mixte' : null, 'data-champ': opts.champ });
    input.addEventListener('input', () => {
      if (input.value === '') return;
      surChange(+input.value);
    });
    input.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') input.blur();
    });
    return h('label', { class: 'champ' + (opts.plein ? ' champ-plein' : '') }, h('span', null, etiquette), input);
  }

  function champCouleur(valeur, surChange) {
    const transparent = valeur === 'transparent' || valeur == null;
    const natif = h('input', { type: 'color', value: transparent ? '#ffffff' : valeur.slice(0, 7) });
    const pastille = h('span', { class: 'pastille' + (transparent ? ' transparent' : ''), style: transparent ? '' : `background:${valeur}` }, natif);
    const texte = h('input', { type: 'text', value: transparent ? 'Aucun' : valeur.toUpperCase(), spellcheck: 'false' });
    const appliquer = (v) => {
      surChange(v);
      const t = v === 'transparent';
      pastille.classList.toggle('transparent', t);
      pastille.style.background = t ? '' : v;
      if (document.activeElement !== texte) texte.value = t ? 'Aucun' : v.toUpperCase();
      if (!t) natif.value = v.slice(0, 7);
    };
    natif.addEventListener('input', () => appliquer(natif.value));
    texte.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter') texte.blur();
    });
    texte.addEventListener('change', () => {
      let v = texte.value.trim();
      if (/^aucun$/i.test(v) || !v) return appliquer('transparent');
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
        if (v.length === 4) v = '#' + v.slice(1).split('').map((c) => c + c).join('');
        appliquer(v);
      } else texte.value = transparent ? 'Aucun' : valeur.toUpperCase();
    });
    return h('div', null,
      h('div', { class: 'couleur-champ' }, pastille, h('label', { class: 'champ' }, texte)),
      h('div', { class: 'nuancier' }, PALETTE.map((c) => h('button', { type: 'button', class: 'nuance' + (c === 'transparent' ? ' transparent' : ''), title: c === 'transparent' ? 'Aucun' : c, style: c === 'transparent' ? '' : `background:${c}`, onclick: () => appliquer(c) })))
    );
  }

  function segments(options, valeur, surChange) {
    return h('div', { class: 'segments' },
      options.map(([v, icone, titre]) => h('button', { type: 'button', class: v === valeur ? 'active' : '', title: titre, html: icone, onclick: (ev) => {
        surChange(v);
        $$('button', ev.currentTarget.parentNode).forEach((b) => b.classList.remove('active'));
        ev.currentTarget.classList.add('active');
      } }))
    );
  }

  const commun = (liste, champ) => {
    const v = liste[0][champ];
    return liste.every((e) => e[champ] === v) ? v : null;
  };

  function section(titre, ...contenu) {
    return h('section', { class: 'insp-section' }, titre && h('h3', { class: 'insp-titre' }, titre), contenu);
  }

  function majChampsPosition() {
    const liste = selectionListe();
    if (liste.length !== 1) return;
    const e = liste[0];
    for (const champ of ['x', 'y', 'w', 'h']) {
      const input = $(`#inspecteur input[data-champ="${champ}"]`);
      if (input && document.activeElement !== input) input.value = e[champ];
    }
  }

  function rendreInspecteur() {
    const insp = $('#inspecteur');
    const liste = selectionListe();
    const blocs = [];

    if (!liste.length) {
      const ecr = ecrans();
      blocs.push(section('Écrans',
        ecr.length
          ? h('div', { class: 'ecrans-liste' }, ecr.map((e) => h('button', { type: 'button', class: 'btn-outil large', style: 'justify-content:flex-start', onclick: () => { selectionner([e.id]); ajuster([e.id]); } }, e.nom)))
          : h('p', { class: 'insp-aide' }, 'Aucun écran. Glisse « Mobile » depuis les Composants ou utilise l’outil Écran (F).')
      ));
      blocs.push(section('Raccourcis', h('dl', { class: 'raccourcis' },
        [['Sélection', 'V'], ['Main', 'H ou Espace'], ['Écran', 'F'], ['Rectangle', 'R'], ['Ellipse', 'O'], ['Texte', 'T'], ['Modifier un texte', 'Double-clic'], ['Dupliquer', 'Ctrl D'], ['Grouper', 'Ctrl G'], ['Annuler', 'Ctrl Z'], ['Premier plan', 'Ctrl ]'], ['Déplacer finement', 'Flèches'], ['Tout afficher', 'Maj 1'], ['Zoom', 'Ctrl molette']]
          .flatMap(([a, b]) => [h('dt', null, a), h('dd', null, b.split(' ou ').map((k, i) => [i ? ' ou ' : '', ...k.split(' ').map((x, j) => [j ? ' ' : '', /^(Double-clic|molette|Flèches)$/.test(x) ? x : h('kbd', null, x)])]))])
      )));
      insp.replaceChildren(...blocs);
      return;
    }

    const seul = liste.length === 1 ? liste[0] : null;
    const types = new Set(liste.map((e) => e.type));
    const ids = liste.map((e) => e.id);

    // En-tête
    if (seul) {
      const nom = h('input', { value: seul.nom, 'aria-label': 'Nom du calque' });
      nom.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') nom.blur();
      });
      nom.addEventListener('change', () => {
        memoriser();
        seul.nom = nom.value.trim() || seul.nom;
        rendreCanevas();
        rendreCalques();
        sauver();
      });
      blocs.push(section(null, h('div', { class: 'insp-entete' }, h('span', { class: 'insp-type' }, TYPES_NOMS[seul.type]), nom)));
    } else {
      blocs.push(section(null, h('div', { class: 'insp-entete' }, h('span', { class: 'insp-type' }, `${liste.length} éléments`))));
    }

    // Alignement
    const alignable = liste.length > 1 || (seul && seul.parent);
    if (alignable) {
      blocs.push(section('Alignement',
        h('div', { class: 'actions-ligne' },
          ['gauche', 'centreH', 'droite', 'haut', 'centreV', 'bas'].map((m) => h('button', { type: 'button', class: 'btn-outil carre', title: { gauche: 'Aligner à gauche', centreH: 'Centrer horizontalement', droite: 'Aligner à droite', haut: 'Aligner en haut', centreV: 'Centrer verticalement', bas: 'Aligner en bas' }[m], html: IC[m], onclick: () => aligner(ids, m) })),
          liste.length > 2 && [h('button', { type: 'button', class: 'btn-outil carre', title: 'Répartir horizontalement', html: IC.distH, onclick: () => aligner(ids, 'distH') }), h('button', { type: 'button', class: 'btn-outil carre', title: 'Répartir verticalement', html: IC.distV, onclick: () => aligner(ids, 'distV') })]
        )
      ));
    }

    // Position et taille
    if (seul) {
      const maj = (champ) => (v) => {
        memoriser(champ + seul.id);
        seul[champ] = champ === 'w' || champ === 'h' ? Math.max(1, v) : v;
        rendreCanevas();
        sauver();
      };
      blocs.push(section('Position et taille',
        h('div', { class: 'grille2' },
          champNombre('X', seul.x, maj('x'), { champ: 'x' }),
          champNombre('Y', seul.y, maj('y'), { champ: 'y' }),
          champNombre('L', seul.w, maj('w'), { champ: 'w', min: 1 }),
          champNombre('H', seul.h, maj('h'), { champ: 'h', min: 1 })
        )
      ));
    }

    // Texte
    const textes = liste.filter((e) => e.type === 'texte');
    if (textes.length) {
      const zone = seul && seul.type === 'texte' ? h('textarea', { 'aria-label': 'Contenu du texte' }, seul.texte) : null;
      if (zone) {
        zone.addEventListener('input', () => modifier([seul], 'texte', zone.value, 'texte' + seul.id));
        zone.addEventListener('keydown', (ev) => ev.stopPropagation());
      }
      const police = h('select', null, POLICES.map((p) => h('option', { value: p, selected: commun(textes, 'police') === p }, p)));
      police.addEventListener('change', () => modifier(textes, 'police', police.value));
      const graisse = h('select', null, [[400, 'Normal'], [500, 'Moyen'], [600, 'Semi-gras'], [700, 'Gras'], [800, 'Très gras']].map(([v, n]) => h('option', { value: v, selected: commun(textes, 'graisse') === v }, n)));
      graisse.addEventListener('change', () => modifier(textes, 'graisse', +graisse.value));
      blocs.push(section('Texte',
        zone,
        h('div', { class: 'grille2', style: zone ? 'margin-top:8px' : '' },
          h('label', { class: 'champ champ-plein' }, police),
          champNombre('Aa', commun(textes, 'taille'), (v) => modifier(textes, 'taille', Math.max(1, v), 'taille'), { min: 1 }),
          h('label', { class: 'champ' }, graisse),
          champNombre('↕', commun(textes, 'interligne'), (v) => modifier(textes, 'interligne', v, 'interligne'), { pas: 0.05, min: 0.5 }),
          champNombre('↔', commun(textes, 'padding'), (v) => modifier(textes, 'padding', Math.max(0, v), 'padding'), { min: 0 })
        ),
        h('div', { class: 'grille2', style: 'margin-top:8px' },
          segments([['left', IC.txtG, 'Aligner à gauche'], ['center', IC.txtC, 'Centrer'], ['right', IC.txtD, 'Aligner à droite']], commun(textes, 'alignH'), (v) => modifier(textes, 'alignH', v)),
          segments([['top', IC.vHaut, 'En haut'], ['middle', IC.vMilieu, 'Au milieu'], ['bottom', IC.vBas, 'En bas']], commun(textes, 'alignV'), (v) => modifier(textes, 'alignV', v))
        ),
        h('div', { style: 'margin-top:10px' }, champCouleur(commun(textes, 'couleur') || '#111827', (v) => modifier(textes, 'couleur', v, 'couleur')))
      ));
    }

    // Icône
    const icones = liste.filter((e) => e.type === 'icone');
    if (icones.length) {
      blocs.push(section('Icône',
        h('div', { class: 'icones' }, NOMS_ICONES.map((n) => h('button', { type: 'button', class: 'icone-choix' + (commun(icones, 'icone') === n ? ' active' : ''), title: n, html: svgIcone(n).replace('<svg', '<svg width="18" height="18"'), onclick: (ev) => {
          modifier(icones, 'icone', n);
          $$('.icone-choix', ev.currentTarget.parentNode).forEach((b) => b.classList.toggle('active', b === ev.currentTarget));
        } }))),
        h('div', { class: 'grille2', style: 'margin:10px 0' }, champNombre('Tr', commun(icones, 'epaisseur'), (v) => modifier(icones, 'epaisseur', borne(v, 0.5, 4), 'epaisseur'), { pas: 0.1, min: 0.5, max: 4 })),
        champCouleur(commun(icones, 'couleur') || '#111827', (v) => modifier(icones, 'couleur', v, 'couleurIcone'))
      ));
    }

    // Image
    if (seul && seul.type === 'image') {
      const ajust = h('select', null, [['cover', 'Remplir'], ['contain', 'Ajuster']].map(([v, n]) => h('option', { value: v, selected: seul.ajustement === v }, n)));
      ajust.addEventListener('change', () => modifier([seul], 'ajustement', ajust.value));
      blocs.push(section('Image',
        h('div', { class: 'actions-ligne' },
          h('button', { type: 'button', class: 'btn-outil', onclick: () => choisirImage(seul.id) }, seul.src ? 'Remplacer l’image' : 'Choisir une image'),
          seul.src && h('button', { type: 'button', class: 'btn-outil', onclick: () => modifier([seul], 'src', null) }, 'Retirer')
        ),
        h('label', { class: 'champ', style: 'margin-top:8px' }, h('span', null, 'Aj'), ajust)
      ));
    }

    // Remplissage
    const avecFond = liste.filter((e) => e.type !== 'icone');
    if (avecFond.length) {
      blocs.push(section(types.has('ecran') && types.size === 1 ? 'Fond' : 'Remplissage', champCouleur(commun(avecFond, 'fill') ?? '#FFFFFF', (v) => modifier(avecFond, 'fill', v, 'fill'))));
    }

    // Contour et coins
    const formes = liste.filter((e) => e.type !== 'ecran' && e.type !== 'icone');
    if (formes.length) {
      blocs.push(section('Contour',
        champCouleur(commun(formes, 'stroke') ?? 'transparent', (v) => {
          modifier(formes, 'stroke', v, 'stroke');
          if (v !== 'transparent' && formes.every((e) => !e.strokeWidth)) {
            for (const e of formes) e.strokeWidth = 1;
            rendreCanevas();
            const champ = $('#inspecteur input[data-champ="strokeWidth"]');
            if (champ) champ.value = 1;
          }
        }),
        h('div', { class: 'grille2', style: 'margin-top:8px' }, champNombre('Ép', commun(formes, 'strokeWidth'), (v) => modifier(formes, 'strokeWidth', Math.max(0, v), 'strokeWidth'), { min: 0, pas: 0.5, champ: 'strokeWidth' }))
      ));
    }
    const arrondis = liste.filter((e) => e.type !== 'ellipse' && e.type !== 'icone');
    const effets = liste.filter((e) => e.type !== 'ecran');
    if (arrondis.length || effets.length) {
      const ombre = h('select', null, [['aucune', 'Aucune ombre'], ['douce', 'Ombre douce'], ['moyenne', 'Ombre moyenne'], ['forte', 'Ombre forte']].map(([v, n]) => h('option', { value: v, selected: effets.length > 0 && commun(effets, 'ombre') === v }, n)));
      ombre.addEventListener('change', () => modifier(effets, 'ombre', ombre.value));
      blocs.push(section('Apparence',
        h('div', { class: 'grille2' },
          arrondis.length > 0 && champNombre('◜', commun(arrondis, 'radius'), (v) => modifier(arrondis, 'radius', Math.max(0, v), 'radius'), { min: 0 }),
          effets.length > 0 && champNombre('%', commun(effets, 'opacity') == null ? null : Math.round(commun(effets, 'opacity') * 100), (v) => modifier(effets, 'opacity', borne(v, 0, 100) / 100, 'opacity'), { min: 0, max: 100 }),
          effets.length > 0 && h('label', { class: 'champ champ-plein' }, ombre)
        )
      ));
    }

    // Interaction
    const autresEcrans = ecrans();
    if (effets.length && autresEcrans.length) {
      const lien = h('select', null,
        h('option', { value: '' }, 'Aucune'),
        autresEcrans.map((e) => h('option', { value: e.id, selected: commun(effets, 'lien') === e.id }, e.nom))
      );
      lien.addEventListener('change', () => modifier(effets, 'lien', lien.value || null));
      blocs.push(section('Interaction',
        h('label', { class: 'champ' }, h('span', { title: 'Au clic, aller à' }, '→'), lien),
        h('p', { class: 'insp-aide', style: 'margin-top:8px' }, 'Au clic, aller à cet écran en mode Présenter.')
      ));
    }

    // Actions
    const peutGrouper = liste.length > 1 && !types.has('ecran');
    const estGroupe = liste.some((e) => e.groupe);
    blocs.push(section('Calque',
      h('div', { class: 'actions-ligne' },
        h('button', { type: 'button', class: 'btn-outil carre', title: 'Avancer (Ctrl ])', html: IC.avant, onclick: () => ordonner(ids, 'avancer') }),
        h('button', { type: 'button', class: 'btn-outil carre', title: 'Reculer (Ctrl [)', html: IC.arriere, onclick: () => ordonner(ids, 'reculer') }),
        h('button', { type: 'button', class: 'btn-outil carre', title: 'Dupliquer (Ctrl D)', html: IC.dupliquer, onclick: () => coller(copier(ids)) }),
        h('button', { type: 'button', class: 'btn-outil carre danger', title: 'Supprimer (Suppr)', html: IC.supprimer, onclick: () => supprimer(ids) }),
        peutGrouper && h('button', { type: 'button', class: 'btn-outil', onclick: () => grouper(ids) }, 'Grouper'),
        estGroupe && h('button', { type: 'button', class: 'btn-outil', onclick: () => degrouper(ids) }, 'Dégrouper')
      ),
      seul && seul.type === 'ecran' && h('button', { type: 'button', class: 'btn-outil large', style: 'margin-top:8px', onclick: () => exporterPng(seul) }, 'Exporter en PNG')
    ));

    insp.replaceChildren(...blocs);
  }

  // ---------- Export ----------

  function chargerScript(src) {
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => ko(new Error('chargement'));
      document.head.append(s);
    });
  }

  async function exporterPng(ecran) {
    try {
      if (!window.htmlToImage) await chargerScript(HTML_TO_IMAGE);
      notifier('Export en cours…');
      const n = noeuds.get(ecran.id).contenu;
      const url = await window.htmlToImage.toPng(n, { pixelRatio: 2, width: ecran.w, height: ecran.h, style: { boxShadow: 'none' } });
      const a = h('a', { href: url, download: `${ecran.nom.replace(/[^\w\- ]+/g, '').trim() || 'ecran'}.png` });
      a.click();
      notifier('Écran exporté.');
    } catch {
      notifier('Export impossible.');
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
        sauver();
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

  // ---------- Téléchargement du travail ----------

  const slug = (t) =>
    t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'candidat';

  async function telechargerTravail() {
    const bouton = $('#btn-telecharger');
    const liste = ecrans().filter((e) => e.visible);
    if (!liste.length) return notifier('Aucun écran à télécharger.');
    if (bouton.disabled) return;
    if (!(await demanderNom())) return;
    terminerEdition();
    bouton.disabled = true;
    const libelle = bouton.querySelector('span');
    libelle.textContent = 'Préparation…';
    const anciens = new Set(etat.selection);
    etat.selection.clear();
    rendreCanevas();
    try {
      if (!window.htmlToImage) await chargerScript(HTML_TO_IMAGE);
      const largeurTotale = liste.reduce((s, e) => s + e.w, 0);
      const ratio = largeurTotale > 5000 ? 1 : 2;
      const images = [];
      for (const e of liste) {
        const n = noeuds.get(e.id).contenu;
        images.push(await window.htmlToImage.toCanvas(n, { pixelRatio: ratio, width: e.w, height: e.h, style: { boxShadow: 'none' } }));
      }

      const marge = 64 * ratio, espace = 56 * ratio, entete = 108 * ratio, titre = 30 * ratio;
      const largeur = marge * 2 + liste.reduce((s, e) => s + e.w * ratio, 0) + espace * (liste.length - 1);
      const hauteur = marge + entete + titre + Math.max(...liste.map((e) => e.h * ratio)) + marge;
      const toile = document.createElement('canvas');
      toile.width = largeur;
      toile.height = hauteur;
      const ctx = toile.getContext('2d');
      ctx.fillStyle = '#eef3fa';
      ctx.fillRect(0, 0, largeur, hauteur);

      ctx.fillStyle = '#2463d9';
      ctx.font = `600 ${12 * ratio}px Inter, system-ui, sans-serif`;
      ctx.fillText('ENTREVUE TECHNIQUE · DESIGNER', marge, marge + 12 * ratio);
      ctx.fillStyle = '#15223a';
      ctx.font = `700 ${28 * ratio}px Inter, system-ui, sans-serif`;
      ctx.fillText(etat.candidat || 'Candidat', marge, marge + 48 * ratio);
      ctx.fillStyle = '#4d5e79';
      ctx.font = `400 ${14 * ratio}px Inter, system-ui, sans-serif`;
      const date = new Date().toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' });
      const temps = etat.debut ? duree(Date.now() - etat.debut) : '00:00';
      ctx.fillText(`${window.RESSOURCES.organisme} · ${date} · ${temps} · ${liste.length} écran${liste.length > 1 ? 's' : ''}`, marge, marge + 74 * ratio);

      let x = marge;
      const y = marge + entete;
      liste.forEach((e, i) => {
        ctx.fillStyle = '#4d5e79';
        ctx.font = `500 ${13 * ratio}px Inter, system-ui, sans-serif`;
        ctx.fillText(e.nom, x, y + 16 * ratio);
        ctx.save();
        ctx.shadowColor = 'rgba(21, 34, 58, 0.18)';
        ctx.shadowBlur = 24 * ratio;
        ctx.shadowOffsetY = 8 * ratio;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y + titre, e.w * ratio, e.h * ratio);
        ctx.restore();
        ctx.drawImage(images[i], x, y + titre, e.w * ratio, e.h * ratio);
        x += e.w * ratio + espace;
      });

      const blob = await new Promise((ok) => toile.toBlob(ok, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: `entrevue-designer-${slug(etat.candidat)}-${new Date().toISOString().slice(0, 10)}.png` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      notifier('Image téléchargée.');
    } catch {
      notifier('Téléchargement impossible.');
    } finally {
      etat.selection = anciens;
      rendreCanevas();
      bouton.disabled = false;
      libelle.textContent = 'Télécharger';
    }
  }

  // ---------- Présentation ----------

  let ecranPresente = null;

  function presenter(id) {
    const liste = ecrans();
    if (!liste.length) return notifier('Ajoute au moins un écran avant de présenter.');
    terminerEdition();
    const choisi = id || [...etat.selection].map(el).find((e) => e && e.type === 'ecran')?.id || [...etat.selection].map(el).find((e) => e && e.parent)?.parent || liste[0].id;
    const select = $('#pres-ecran');
    select.replaceChildren(...liste.map((e) => h('option', { value: e.id }, e.nom)));
    $('#presentation').hidden = false;
    afficherEcran(choisi);
  }

  function afficherEcran(id) {
    const e = el(id);
    if (!e) return;
    ecranPresente = id;
    $('#pres-ecran').value = id;
    const scene = $('#pres-scene');
    const r = scene.getBoundingClientRect();
    const echelle = Math.min(1, (r.width - 48) / e.w, (r.height - 48) / e.h);
    const clone = noeuds.get(id).contenu.cloneNode(true);
    clone.className = 'pres-ecran';
    clone.removeAttribute('data-id');
    clone.style.cssText += `;left:50%;top:50%;right:auto;bottom:auto;width:${e.w}px;height:${e.h}px;transform:translate(-50%,-50%) scale(${echelle})`;
    for (const n of clone.querySelectorAll('[data-id]')) {
      const cible = el(n.dataset.id);
      if (cible && cible.lien && el(cible.lien)) {
        n.classList.add('lien');
        n.addEventListener('click', (ev) => {
          ev.stopPropagation();
          afficherEcran(cible.lien);
        });
      }
      n.querySelectorAll('[contenteditable]').forEach((t) => t.removeAttribute('contenteditable'));
    }
    clone.addEventListener('click', () => {
      clone.classList.remove('indices');
      void clone.offsetWidth;
      clone.classList.add('indices');
    });
    scene.replaceChildren(clone);
  }

  function quitterPresentation() {
    $('#presentation').hidden = true;
    $('#pres-scene').replaceChildren();
    ecranPresente = null;
  }

  // ---------- Ressources ----------

  const ICONES_DOCS = {
    brief: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
    entrevues: 'M4 5h16v11H9l-5 4Z',
    personas: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
    'parcours-actuel': 'M5 6a2 2 0 1 0 0 .01M19 18a2 2 0 1 0 0 .01M5 8v3a3 3 0 0 0 3 3h8a3 3 0 0 1 3 3',
    'parcours-cible': 'M5 12h14M13 6l6 6-6 6',
    donnees: 'M5 20V10M12 20V4M19 20v-7',
    livrables: 'M4.5 12.5l5 5L19.5 7',
  };

  function rendreRessources() {
    const pane = $('#pane-ressources');
    pane.replaceChildren(
      h('div', { class: 'org' }, h('b', null, window.RESSOURCES.organisme), h('span', null, 'Banque alimentaire, Montréal-Nord · organisme fictif')),
      ...window.RESSOURCES.documents.map((d) =>
        h('button', { type: 'button', class: 'doc-item' + (etat.docOuvert === d.id ? ' active' : ''), onclick: () => ouvrirDoc(etat.docOuvert === d.id ? null : d.id) },
          h('span', { class: 'doc-icone', html: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONES_DOCS[d.id]}"/></svg>` }),
          h('span', { class: 'doc-texte' }, h('b', null, d.titre), h('span', null, d.sousTitre))
        )
      )
    );
  }

  function bloc(b) {
    switch (b.type) {
      case 'intro':
        return h('p', { class: 'intro' }, b.texte);
      case 'p':
        return h('p', null, b.texte);
      case 'h':
        return h('h2', null, b.texte);
      case 'liste':
        return h('ul', null, b.items.map((i) => h('li', null, i)));
      case 'chiffres':
        return h('div', { class: 'chiffres' }, b.items.map(([v, l]) => h('div', { class: 'chiffre' }, h('b', null, v), h('span', null, l))));
      case 'couleurs':
        return h('div', { class: 'couleurs' }, b.items.map(([c, n]) => h('div', { class: 'couleur' }, h('i', { style: `background:${c}` }), h('span', null, n, h('code', null, c)))));
      case 'entrevue':
        return h('article', { class: 'entrevue' },
          h('div', { class: 'entrevue-tete' }, h('span', { class: 'initiales' }, b.nom[0]), h('div', null, h('b', null, b.nom), h('span', null, b.role))),
          b.contexte && h('p', null, b.contexte),
          b.citations.map((c) => h('blockquote', null, `« ${c} »`)),
          h('div', { class: 'besoins' }, b.besoins.map((x) => h('span', { class: 'besoin' }, x)))
        );
      case 'persona':
        return h('article', { class: 'persona' },
          h('h3', null, b.nom),
          h('p', null, b.resume),
          h('div', { class: 'persona-cols' },
            h('div', null, h('b', null, 'Objectifs'), h('ul', null, b.objectifs.map((o) => h('li', null, o)))),
            h('div', null, h('b', null, 'Frustrations'), h('ul', null, b.frustrations.map((o) => h('li', null, o))))
          ),
          h('div', { class: 'aisance' }, 'Aisance numérique', h('span', { class: 'aisance-barre' }, [1, 2, 3, 4, 5].map((i) => h('i', { class: i <= b.aisance ? 'on' : '' }))))
        );
      case 'flux':
        return h('ol', { class: 'flux' }, b.etapes.map((e, i) => h('li', { class: e.irritant ? 'irritant' : '' }, h('span', { class: 'flux-n' }, i + 1), h('div', null, h('b', null, e.titre), e.note && h('span', null, e.note)))));
      case 'barres':
        return h('div', { class: 'barres' }, h('h3', null, b.titre), b.items.map(([l, v]) => h('div', { class: 'barre' }, h('span', null, l), h('b', null, v + ' %'), h('span', { class: 'barre-piste' }, h('i', { style: `width:${v}%` })))));
      case 'etapes':
        return h('ol', { class: 'etapes' }, b.items.map(([t, d]) => h('li', null, h('div', null, h('b', null, t), h('span', null, d)))));
      default:
        return null;
    }
  }

  function ouvrirDoc(id) {
    etat.docOuvert = id;
    const lecteur = $('#lecteur');
    const d = window.RESSOURCES.documents.find((x) => x.id === id);
    lecteur.hidden = !d;
    $('#workspace').classList.toggle('avec-lecteur', !!d);
    rendreRessources();
    if (!d) return;
    $('#lecteur-titre').textContent = window.RESSOURCES.organisme;
    const corps = $('#lecteur-corps');
    corps.replaceChildren(h('div', { class: 'doc' }, h('h1', null, d.titre), h('p', { class: 'doc-sous' }, d.sousTitre), d.blocs.map(bloc)));
    corps.scrollTop = 0;
  }

  function docVoisin(pas) {
    const docs = window.RESSOURCES.documents;
    const i = docs.findIndex((d) => d.id === etat.docOuvert);
    ouvrirDoc(docs[(i + pas + docs.length) % docs.length].id);
  }

  // ---------- Outils et clavier ----------

  const OUTILS = [
    ['select', 'Sélection (V)'],
    ['main', 'Main (H)'],
    null,
    ['ecran', 'Écran (F)'],
    ['rect', 'Rectangle (R)'],
    ['ellipse', 'Ellipse (O)'],
    ['texte', 'Texte (T)'],
    ['image', 'Image'],
  ];

  function rendreOutils() {
    $('#outils').replaceChildren(
      ...OUTILS.map((o) => (o ? h('button', { type: 'button', class: 'outil' + (etat.outil === o[0] ? ' active' : ''), title: o[1], 'aria-label': o[1], html: OUTILS_ICONES[o[0]], onclick: () => choisirOutil(o[0]) }) : h('span', { class: 'outil-sep' })))
    );
  }

  function choisirOutil(o) {
    etat.outil = o;
    const c = $('#canevas');
    c.classList.toggle('outil-main', o === 'main');
    c.classList.toggle('outil-creation', ['rect', 'ellipse', 'texte', 'ecran', 'image'].includes(o));
    rendreOutils();
  }

  let pressePapier = null;

  function installerClavier() {
    addEventListener('keydown', (e) => {
      if ($('#presentation').hidden === false) {
        if (e.key === 'Escape') quitterPresentation();
        const liste = ecrans();
        const i = liste.findIndex((x) => x.id === ecranPresente);
        if (e.key === 'ArrowRight') afficherEcran(liste[(i + 1) % liste.length].id);
        if (e.key === 'ArrowLeft') afficherEcran(liste[(i - 1 + liste.length) % liste.length].id);
        return;
      }
      if (document.querySelector('dialog[open]')) return;
      const cible = e.target;
      if (cible.closest && cible.closest('input, textarea, select, [contenteditable="true"]')) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const ids = [...etat.selection];
      const k = e.key.toLowerCase();

      if (e.code === 'Space' && !espace) {
        espace = true;
        $('#canevas').classList.add('panoramique');
        e.preventDefault();
        return;
      }
      if (ctrl && k === 'z') {
        e.preventDefault();
        e.shiftKey ? retablir() : annuler();
      } else if (ctrl && k === 'y') {
        e.preventDefault();
        retablir();
      } else if (ctrl && k === 'd') {
        e.preventDefault();
        if (ids.length) coller(copier(ids));
      } else if (ctrl && k === 'c') {
        if (ids.length) pressePapier = copier(ids);
      } else if (ctrl && k === 'x') {
        if (ids.length) {
          pressePapier = copier(ids);
          supprimer(ids);
        }
      } else if (ctrl && k === 'v') {
        e.preventDefault();
        if (!pressePapier) return;
        const sel = ids.map(el).find(Boolean);
        const ecranCible = sel ? (sel.type === 'ecran' ? sel.id : sel.parent) : undefined;
        const aDesEcrans = pressePapier.some((x) => x.type === 'ecran');
        coller(pressePapier, aDesEcrans || ecranCible === undefined ? 16 : 0, aDesEcrans ? undefined : ecranCible);
      } else if (ctrl && k === 'a') {
        e.preventDefault();
        const sel = ids.map(el).find(Boolean);
        const parent = sel ? (sel.type === 'ecran' ? sel.id : sel.parent) : null;
        selectionner(elements().filter((x) => x.visible && !x.verrou && (parent ? x.parent === parent : !x.parent)).map((x) => x.id));
      } else if (ctrl && k === 'g') {
        e.preventDefault();
        e.shiftKey ? degrouper(ids) : grouper(ids);
      } else if (ctrl && (e.key === ']' || e.key === '[')) {
        e.preventDefault();
        ordonner(ids, e.key === ']' ? (e.shiftKey ? 'devant' : 'avancer') : e.shiftKey ? 'derriere' : 'reculer');
      } else if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomer(etat.zoom * 1.25);
      } else if (ctrl && e.key === '-') {
        e.preventDefault();
        zoomer(etat.zoom / 1.25);
      } else if (ctrl && e.key === '0') {
        e.preventDefault();
        zoomer(1);
      } else if (e.shiftKey && e.code === 'Digit1') {
        ajuster();
      } else if (e.shiftKey && e.code === 'Digit2') {
        ajuster(ids);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        supprimer(ids);
      } else if (e.key === 'Escape') {
        if (etat.groupeOuvert) {
          const g = etat.groupeOuvert;
          etat.groupeOuvert = null;
          selectionner(membresGroupe(g));
        } else selectionner([]);
        choisirOutil('select');
      } else if (e.key === 'Enter' && ids.length === 1 && el(ids[0]).type === 'texte') {
        e.preventDefault();
        commencerEdition(ids[0]);
      } else if (e.key.startsWith('Arrow') && ids.length) {
        e.preventDefault();
        const pas = e.shiftKey ? 10 : 1;
        memoriser('fleche');
        for (const id of ids) {
          const x = el(id);
          if (x.verrou) continue;
          if (e.key === 'ArrowLeft') x.x -= pas;
          if (e.key === 'ArrowRight') x.x += pas;
          if (e.key === 'ArrowUp') x.y -= pas;
          if (e.key === 'ArrowDown') x.y += pas;
        }
        rendreCanevas();
        majChampsPosition();
        sauver();
      } else if (!ctrl && !e.altKey) {
        const raccourcis = { v: 'select', h: 'main', f: 'ecran', r: 'rect', o: 'ellipse', t: 'texte' };
        if (raccourcis[k]) choisirOutil(raccourcis[k]);
      }
    });
    addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        espace = false;
        $('#canevas').classList.remove('panoramique');
      }
    });
    addEventListener('blur', () => {
      espace = false;
      $('#canevas').classList.remove('panoramique');
    });
  }

  // ---------- Démarrage ----------

  function majChrono() {
    $('#timer-text').textContent = etat.debut ? duree(Date.now() - etat.debut) : '00:00';
  }

  function docDepart() {
    return { elements: [creer('ecran', { nom: 'Choix du créneau', x: 0, y: 0 }), creer('ecran', { nom: 'Confirmation', x: 470, y: 0 })] };
  }

  function demarrer() {
    const session = lire(CLE);
    if (session && session.doc && Array.isArray(session.doc.elements)) {
      etat.doc = session.doc;
      etat.debut = session.debut || null;
      etat.candidat = session.candidat || '';
    } else {
      etat.doc = docDepart();
    }
    reindexer();

    rendreOutils();
    rendreRessources();
    rendreBibliotheque();
    installerCanevas();
    installerClavier();
    installerImages();

    $$('.side-tab').forEach((b) =>
      b.addEventListener('click', () => {
        $$('.side-tab').forEach((x) => x.classList.toggle('active', x === b));
        $$('.side-pane').forEach((p) => p.classList.toggle('active', p.id === 'pane-' + b.dataset.onglet));
      })
    );
    $('#lecteur-fermer').addEventListener('click', () => ouvrirDoc(null));
    $('#lecteur-prec').addEventListener('click', () => docVoisin(-1));
    $('#lecteur-suiv').addEventListener('click', () => docVoisin(1));
    $('#zoom-plus').addEventListener('click', () => zoomer(etat.zoom * 1.25));
    $('#zoom-moins').addEventListener('click', () => zoomer(etat.zoom / 1.25));
    $('#zoom-val').addEventListener('click', () => ajuster());
    $('#btn-presenter').addEventListener('click', () => presenter());
    $('#pres-fermer').addEventListener('click', quitterPresentation);
    $('#pres-ecran').addEventListener('change', (e) => afficherEcran(e.target.value));
    addEventListener('resize', () => {
      if (ecranPresente) afficherEcran(ecranPresente);
    });

    const objectif = $('#dlg-objectif');
    objectif.addEventListener('cancel', (e) => {
      if (!etat.debut) e.preventDefault();
    });
    $('#btn-telecharger').addEventListener('click', telechargerTravail);
    $('#objectif-start').addEventListener('click', () => {
      if (!etat.debut) {
        etat.debut = Date.now();
        sauver();
        ouvrirDoc('brief');
      }
      objectif.close();
      document.body.classList.remove('accueil');
      requestAnimationFrame(() => ajuster(ecrans().map((e) => e.id)));
    });
    $('#btn-objectif').addEventListener('click', () => {
      $('#objectif-start').textContent = etat.debut ? 'Reprendre' : 'Commencer';
      objectif.showModal();
    });
    const reset = $('#dlg-reset');
    $('#btn-reset').addEventListener('click', () => reset.showModal());
    $('#reset-cancel').addEventListener('click', () => reset.close());
    $('#reset-confirm').addEventListener('click', () => {
      try {
        localStorage.removeItem(CLE);
      } catch {
        /* rien */
      }
      location.reload();
    });
    $('#narrow-continue').addEventListener('click', () => document.body.classList.add('narrow-ok'));

    majChrono();
    setInterval(majChrono, 1000);
    requestAnimationFrame(() => ajuster(ecrans().map((e) => e.id)));
    toutRendre();
    if (!etat.debut) {
      objectif.showModal();
    } else {
      document.body.classList.remove('accueil');
    }
  }

  demarrer();
})();
