/* Entrevue product manager : des notes de rencontre au PRD, au MVP et au plan de sprints. */
(() => {
  'use strict';

  const N = window.NOTES;
  const CLE = 'h4i-entrevue-pm-v2';
  const POINTS = { S: 2, M: 3, L: 5 };
  const CAPACITE = 8;
  const NB_SPRINTS = 4;
  const TONS = { Jeunes: '#0969da', Parents: '#8250df', Animateurs: '#1a7f37', Direction: '#bc4c00' };
  const STATUTS = [
    ['trier', 'À trier'],
    ['mvp', 'MVP'],
    ['stretch', 'Stretch goal'],
    ['hors', 'Hors portée'],
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 10);

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

  // Octicons (16 px)
  const OCT = {
    fichier: 'M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z',
    probleme: 'M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z',
    issue: 'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
    projet: 'M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0ZM1.5 1.75v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25ZM11.75 3a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm-8.25.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0ZM8 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 3Z',
    jalon: 'M7.75 0a.75.75 0 0 1 .75.75V3h3.634c.414 0 .814.147 1.13.414l2.07 1.75a1.75 1.75 0 0 1 0 2.672l-2.07 1.75a1.75 1.75 0 0 1-1.13.414H8.5v5.25a.75.75 0 0 1-1.5 0V10H2.75A1.75 1.75 0 0 1 1 8.25v-3.5C1 3.784 1.784 3 2.75 3H7V.75A.75.75 0 0 1 7.75 0Zm4.384 8.5a.25.25 0 0 0 .161-.06l2.07-1.75a.248.248 0 0 0 0-.38l-2.07-1.75a.25.25 0 0 0-.161-.06H2.75a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h9.384Z',
    livre: 'M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z',
    plus: 'M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z',
    check: 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z',
    telecharger: 'M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.69V1.75a.75.75 0 0 1 1.5 0v5.94l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 6.78a.75.75 0 0 1 1.06-1.06Z',
  };
  const oct = (nom, taille = 16) => `<svg viewBox="0 0 16 16" width="${taille}" height="${taille}" fill="currentColor" aria-hidden="true"><path d="${OCT[nom]}"/></svg>`;

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
      /* stockage indisponible */
    }
  };

  const duree = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // ---------- État ----------

  const prdVide = () => ({
    probleme: '',
    utilisateurs: [],
    mesures: '',
    features: [],
    sprints: Array.from({ length: NB_SPRINTS }, () => ({ objectif: '' })),
  });

  const etat = { prd: prdVide(), onglet: 'probleme', debut: null, candidat: '' };

  let minuterie;
  function sauver() {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => ecrire(CLE, etat), 300);
  }

  let minuterieToast;
  function notifier(texte) {
    const t = $('#toast');
    t.textContent = texte;
    t.hidden = false;
    clearTimeout(minuterieToast);
    minuterieToast = setTimeout(() => (t.hidden = true), 2400);
  }

  const features = () => etat.prd.features;
  const trie = (liste) => [...liste].sort((a, b) => a.ordre - b.ordre);
  const points = (f) => POINTS[f.effort] || 0;
  const somme = (liste) => liste.reduce((s, f) => s + points(f), 0);
  const tonDe = (u) => TONS[u] || '#59636e';
  const numero = (f) => features().indexOf(f) + 1;
  const priorisees = () => features().filter((f) => f.statut === 'mvp' || f.statut === 'stretch');

  // ---------- Notes ----------

  function rendreNotes() {
    const faits = new Set(features().map((f) => f.source).filter(Boolean));
    const liste = (items) =>
      h('ul', { class: 'besoins' },
        items.map((x) =>
          h('li', { class: 'besoin' + (faits.has(x.code) ? ' fait' : '') },
            h('code', null, x.code),
            h('span', { class: 'besoin-texte' }, x.texte),
            h('button', {
              type: 'button',
              class: 'convertir',
              title: faits.has(x.code) ? 'Déjà ajouté aux fonctionnalités' : 'Ajouter aux fonctionnalités',
              'aria-label': faits.has(x.code) ? 'Déjà ajouté' : 'Ajouter aux fonctionnalités',
              html: oct(faits.has(x.code) ? 'check' : 'plus'),
              onclick: () => {
                const existante = features().find((f) => f.source === x.code);
                if (existante) return ouvrirEditeur(existante.id);
                creerFeature({ titre: x.texte, source: x.code });
              },
            })
          )
        )
      );

    $('#notes').replaceChildren(
      h('div', { class: 'box' },
        h('div', { class: 'box-tete', html: `${oct('fichier')}<b>notes-rencontre.md</b>` }),
        h('div', { class: 'markdown' },
          h('h1', null, N.organisme),
          h('p', { class: 'meta' }, `${N.rencontre} · ${N.presents}`),
          h('h2', null, 'Contexte'),
          h('ul', null, N.contexte.map((x) => h('li', null, x))),
          h('h2', null, 'Ce qui ne va pas'),
          N.irritants.map(([qui, t]) => h('blockquote', null, h('p', null, h('b', null, `${qui} : `), `« ${t} »`))),
          h('h2', null, 'Besoins exprimés'),
          liste(N.besoins),
          h('h3', null, 'Idées lancées'),
          liste(N.idees),
          h('h2', null, 'Contraintes'),
          h('ul', null, N.contraintes.map((x) => h('li', null, x)))
        )
      )
    );
  }

  // ---------- Onglets ----------

  const ONGLETS = [
    ['probleme', 'Problème', 'probleme', () => null, () => !!etat.prd.probleme.trim()],
    ['features', 'Fonctionnalités', 'issue', () => features().length, () => features().length > 0],
    ['mvp', 'MVP', 'projet', () => `${features().filter((f) => f.statut !== 'trier').length}/${features().length}`, () => features().length > 0 && features().every((f) => f.statut !== 'trier')],
    ['sprints', 'Sprints', 'jalon', () => {
      const mvp = features().filter((f) => f.statut === 'mvp');
      return `${mvp.filter((f) => f.sprint).length}/${mvp.length}`;
    }, () => {
      const mvp = features().filter((f) => f.statut === 'mvp');
      return mvp.length > 0 && mvp.every((f) => f.sprint);
    }],
    ['prd', 'PRD', 'livre', () => null, () => false],
  ];

  function rendreOnglets() {
    $('#onglets').replaceChildren(
      ...ONGLETS.map(([id, titre, icone, compte, fait]) => {
        const c = compte();
        return h('button', { type: 'button', class: 'onglet' + (etat.onglet === id ? ' active' : ''), onclick: () => allerA(id) },
          h('span', { html: oct(icone) }),
          titre,
          c != null && h('span', { class: 'compteur' }, c),
          fait() && h('span', { class: 'coche', html: oct('check', 14) })
        );
      })
    );
  }

  function allerA(id) {
    etat.onglet = id;
    sauver();
    rendreOnglets();
    rendreTravail();
    $('#travail').scrollTop = 0;
  }

  function toutRendre() {
    rendreOnglets();
    rendreNotes();
    rendreTravail();
    sauver();
  }

  function rendreTravail() {
    const vues = { probleme: vueProbleme, features: vueFeatures, mvp: vueMvp, sprints: vueSprints, prd: vuePrd };
    $('#travail').replaceChildren(vues[etat.onglet]());
  }

  const titrePage = (titre, texte, action) => h('div', { class: 'titre-page' }, h('div', null, h('h1', null, titre), texte && h('p', null, texte)), action);

  // ---------- Problème ----------

  function vueProbleme() {
    const p = etat.prd;
    const zone = (valeur, placeholder, surChange, lignes) => {
      const t = h('textarea', { class: 'input', rows: lignes, placeholder });
      t.value = valeur;
      t.addEventListener('input', () => {
        surChange(t.value);
        rendreOnglets();
        sauver();
      });
      return t;
    };
    return h('div', { class: 'formulaire' },
      titrePage('Problème', 'Ce que l’organisme vit aujourd’hui et ce que le projet doit changer.'),
      h('div', { class: 'champ' },
        h('label', { class: 'champ-label' }, 'Énoncé du problème'),
        h('p', { class: 'aide' }, 'Qui a le problème, lequel, et pourquoi c’est important.'),
        zone(p.probleme, 'Aujourd’hui, les inscriptions aux activités se font…', (v) => (p.probleme = v), 4)
      ),
      h('div', { class: 'champ' },
        h('label', { class: 'champ-label' }, 'Utilisateurs'),
        h('div', { class: 'labels' },
          N.utilisateurs.map((u) => {
            const actif = p.utilisateurs.includes(u);
            return h('button', {
              type: 'button',
              class: 'label ' + (actif ? 'label-u' : 'label-choix'),
              style: `--ton:${tonDe(u)}`,
              'aria-pressed': String(actif),
              onclick: () => {
                p.utilisateurs = actif ? p.utilisateurs.filter((x) => x !== u) : [...p.utilisateurs, u];
                toutRendre();
              },
            }, actif && h('span', { html: oct('check', 12) }), u);
          })
        )
      ),
      h('div', { class: 'champ' },
        h('label', { class: 'champ-label' }, 'Mesures de succès'),
        h('p', { class: 'aide' }, 'Comment saura-t-on que le projet a réussi ?'),
        zone(p.mesures, '- Plus aucun tirage au sort pour les sorties\n- …', (v) => (p.mesures = v), 3)
      )
    );
  }

  // ---------- Fonctionnalités ----------

  function labelsDe(f, { statut = false } = {}) {
    return [
      f.utilisateur && h('span', { class: 'label label-u', style: `--ton:${tonDe(f.utilisateur)}` }, f.utilisateur),
      h('span', { class: 'label label-gris' }, f.effort ? `${f.effort} · ${points(f)} pts` : 'Effort ?'),
      statut && f.statut !== 'trier' && h('span', { class: `label label-${f.statut}` }, STATUTS.find((s) => s[0] === f.statut)[1]),
    ];
  }

  function creerFeature(props = {}) {
    const f = { id: uid(), titre: '', description: '', utilisateur: etat.prd.utilisateurs[0] || N.utilisateurs[0], effort: null, statut: 'trier', sprint: null, source: null, ordre: Date.now(), ...props };
    features().push(f);
    toutRendre();
    ouvrirEditeur(f.id, true);
  }

  function vueFeatures() {
    const liste = features();
    return h('div', null,
      titrePage('Fonctionnalités', 'Crée-les ici ou avec le + à côté d’un besoin dans les notes.',
        h('button', { type: 'button', class: 'btn btn-vert', onclick: () => creerFeature(), html: `${oct('plus')} Nouvelle fonctionnalité` })),
      h('div', { class: 'box' },
        h('div', { class: 'box-tete', html: `${oct('issue')}<b>${liste.length} fonctionnalité${liste.length > 1 ? 's' : ''}</b>` }),
        liste.length
          ? liste.map((f) =>
              h('div', { class: 'ligne', tabindex: '0', onclick: () => ouvrirEditeur(f.id), onkeydown: (e) => e.key === 'Enter' && ouvrirEditeur(f.id) },
                h('span', { class: 'ligne-icone', html: oct('issue') }),
                h('div', { class: 'ligne-corps' },
                  h('div', { class: 'ligne-titre' }, h('span', null, f.titre || 'Sans titre'), labelsDe(f, { statut: true })),
                  h('div', { class: 'ligne-meta' }, `#${numero(f)}`, f.source && ` · depuis ${f.source}`, f.description && ` · ${f.description}`)
                )
              )
            )
          : h('div', { class: 'vide' }, h('b', null, 'Aucune fonctionnalité'), 'Commence par les besoins exprimés dans les notes.')
      )
    );
  }

  // ---------- Tableaux ----------

  function carte(f, statut = false) {
    return h('article', { class: 'carte', 'data-id': f.id },
      h('span', { class: 'carte-titre' }, f.titre || 'Sans titre'),
      h('div', { class: 'carte-labels' }, labelsDe(f, { statut }))
    );
  }

  function colonne({ titre, compte, sous, zone, cartes, extra, classe }) {
    return h('section', { class: 'colonne' + (classe ? ' ' + classe : '') },
      h('div', { class: 'colonne-tete' },
        h('div', { class: 'colonne-titre' }, titre, h('span', { class: 'compteur' }, compte)),
        sous && h('div', { class: 'colonne-sous' }, sous),
        extra
      ),
      h('div', { class: 'colonne-corps', 'data-zone': zone }, cartes.length ? cartes : h('div', { class: 'colonne-vide' }, 'Glisse une carte ici'))
    );
  }

  function vueMvp() {
    if (!features().length) {
      return h('div', null, titrePage('MVP'), h('div', { class: 'box' }, h('div', { class: 'vide' }, h('b', null, 'Rien à trier'), 'Ajoute d’abord des fonctionnalités.')));
    }
    const tableau = h('div', { class: 'tableau tableau-4' },
      STATUTS.map(([s, titre]) => {
        const liste = trie(features().filter((f) => f.statut === s));
        return colonne({ titre, compte: liste.length, sous: s === 'trier' ? null : `${somme(liste)} points`, zone: 'statut:' + s, cartes: liste.map((f) => carte(f)) });
      })
    );
    activerGlisser(tableau);
    return h('div', null,
      titrePage('MVP et stretch goals', `Glisse les cartes. L’équipe fait environ ${CAPACITE} points par sprint, soit ${CAPACITE * NB_SPRINTS} points en ${NB_SPRINTS} sprints.`),
      tableau
    );
  }

  function vueSprints() {
    if (!priorisees().length) {
      return h('div', null, titrePage('Sprints'), h('div', { class: 'box' }, h('div', { class: 'vide' }, h('b', null, 'Rien à planifier'), 'Place d’abord des cartes dans MVP ou Stretch goal.')));
    }
    const backlog = trie(priorisees().filter((f) => !f.sprint));
    const tableau = h('div', { class: 'tableau tableau-5' },
      colonne({ titre: 'Backlog', compte: backlog.length, sous: `${somme(backlog)} points`, zone: 'sprint:0', cartes: backlog.map((f) => carte(f, true)) }),
      Array.from({ length: NB_SPRINTS }, (_, i) => {
        const n = i + 1;
        const liste = trie(features().filter((f) => f.sprint === n && (f.statut === 'mvp' || f.statut === 'stretch')));
        const total = somme(liste);
        const objectif = h('input', { class: 'objectif-sprint', placeholder: 'Ajouter un objectif', 'aria-label': `Objectif du sprint ${n}` });
        objectif.value = etat.prd.sprints[i].objectif;
        objectif.addEventListener('input', () => {
          etat.prd.sprints[i].objectif = objectif.value;
          sauver();
        });
        return colonne({
          titre: `Sprint ${n}`,
          compte: liste.length,
          classe: total > CAPACITE ? 'depasse' : '',
          zone: 'sprint:' + n,
          cartes: liste.map((f) => carte(f, true)),
          extra: [
            h('div', { class: 'progression' }, h('span', { class: 'progression-piste' }, h('i', { style: `width:${Math.min(100, (total / CAPACITE) * 100)}%` })), h('b', null, `${total}/${CAPACITE}`)),
            objectif,
          ],
        });
      })
    );
    activerGlisser(tableau);
    const sansEffort = priorisees().filter((f) => !f.effort).length;
    return h('div', null,
      titrePage('Sprints', `${NB_SPRINTS} sprints de 2 semaines, environ ${CAPACITE} points chacun.`),
      tableau,
      sansEffort > 0 && h('p', { class: 'note' }, `${sansEffort} carte${sansEffort > 1 ? 's n’ont' : ' n’a'} pas encore d’effort : clique dessus pour l’estimer.`)
    );
  }

  // ---------- Glisser-déposer ----------

  function activerGlisser(conteneur) {
    conteneur.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.carte');
      if (!c || e.button !== 0) return;
      const id = c.dataset.id;
      const depart = { x: e.clientX, y: e.clientY };
      const r = c.getBoundingClientRect();
      const decalage = { x: e.clientX - r.left, y: e.clientY - r.top };
      let fantome = null, place = null, zone = null;

      const bouger = (ev) => {
        if (!fantome) {
          if (Math.hypot(ev.clientX - depart.x, ev.clientY - depart.y) < 5) return;
          fantome = c.cloneNode(true);
          fantome.classList.add('fantome');
          fantome.style.width = r.width + 'px';
          document.body.append(fantome);
          document.body.classList.add('glisse');
          c.classList.add('source');
          place = h('div', { class: 'place', style: `--h:${r.height}px` });
        }
        fantome.style.left = ev.clientX - decalage.x + 'px';
        fantome.style.top = ev.clientY - decalage.y + 'px';
        const sous = document.elementFromPoint(ev.clientX, ev.clientY);
        const nouvelle = sous && sous.closest('.colonne');
        const corps = nouvelle && $('[data-zone]', nouvelle);
        if (zone && zone !== corps) {
          zone.closest('.colonne').classList.remove('survol');
          const vide = $('.colonne-vide', zone);
          if (vide) vide.style.display = '';
        }
        zone = corps;
        if (!zone) return place.remove();
        zone.closest('.colonne').classList.add('survol');
        const vide = $('.colonne-vide', zone);
        if (vide) vide.style.display = 'none';
        const avant = $$('.carte', zone).filter((x) => x !== c).find((x) => {
          const b = x.getBoundingClientRect();
          return ev.clientY < b.top + b.height / 2;
        });
        if (avant) avant.before(place);
        else zone.append(place);
      };

      const lacher = () => {
        removeEventListener('pointermove', bouger);
        removeEventListener('pointerup', lacher);
        if (!fantome) return ouvrirEditeur(id);
        const index = zone ? [...zone.children].filter((x) => x === place || (x.classList.contains('carte') && x !== c)).indexOf(place) : -1;
        fantome.remove();
        document.body.classList.remove('glisse');
        if (zone) deplacer(id, zone.dataset.zone, index);
        else rendreTravail();
      };

      addEventListener('pointermove', bouger);
      addEventListener('pointerup', lacher);
    });
  }

  function deplacer(id, zone, index) {
    const f = features().find((x) => x.id === id);
    if (!f) return;
    const [type, valeur] = zone.split(':');
    let voisins;
    if (type === 'statut') {
      f.statut = valeur;
      if (valeur === 'trier' || valeur === 'hors') f.sprint = null;
      voisins = features().filter((x) => x.statut === valeur);
    } else {
      f.sprint = +valeur || null;
      voisins = priorisees().filter((x) => (x.sprint || null) === f.sprint);
    }
    const ordre = trie(voisins.filter((x) => x !== f));
    ordre.splice(index < 0 ? ordre.length : index, 0, f);
    ordre.forEach((x, i) => (x.ordre = i + 1));
    toutRendre();
  }

  // ---------- Éditeur ----------

  let enEdition = null;

  function ouvrirEditeur(id, nouvelle = false) {
    const f = features().find((x) => x.id === id);
    if (!f) return;
    enEdition = { id, nouvelle };
    $('#feature-title').textContent = nouvelle ? 'Nouvelle fonctionnalité' : `Fonctionnalité #${numero(f)}`;
    $('#f-titre').value = f.titre;
    $('#f-description').value = f.description || '';
    const u = $('#f-utilisateur');
    u.replaceChildren(...N.utilisateurs.map((x) => h('option', null, x)));
    u.value = f.utilisateur || N.utilisateurs[0];
    const e = $('#f-effort');
    e.replaceChildren(h('option', { value: '' }, 'À estimer'), ...Object.entries(POINTS).map(([k, v]) => h('option', { value: k }, `${k} · ${v} points`)));
    e.value = f.effort || '';
    $('#f-supprimer').hidden = nouvelle;
    $('#dlg-feature').showModal();
    setTimeout(() => (nouvelle && f.titre ? $('#f-description') : $('#f-titre')).focus(), 30);
  }

  function installerEditeur() {
    const dlg = $('#dlg-feature');
    const fermer = (garder) => {
      if (!enEdition) return dlg.close();
      const f = features().find((x) => x.id === enEdition.id);
      if (f && garder) {
        f.titre = $('#f-titre').value.trim() || 'Sans titre';
        f.description = $('#f-description').value.trim();
        f.utilisateur = $('#f-utilisateur').value;
        f.effort = $('#f-effort').value || null;
      } else if (f && enEdition.nouvelle) {
        etat.prd.features = features().filter((x) => x !== f);
      }
      enEdition = null;
      dlg.close();
      toutRendre();
    };
    $('#form-feature').addEventListener('submit', (e) => {
      e.preventDefault();
      fermer(true);
    });
    $('#f-annuler').addEventListener('click', () => fermer(false));
    $('#f-fermer').addEventListener('click', () => fermer(false));
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      fermer(false);
    });
    $('#f-supprimer').addEventListener('click', () => {
      if (!enEdition) return;
      etat.prd.features = features().filter((x) => x.id !== enEdition.id);
      enEdition = null;
      dlg.close();
      toutRendre();
      notifier('Fonctionnalité supprimée.');
    });
  }

  // ---------- PRD ----------

  const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function prdHtml() {
    const p = etat.prd;
    const manque = (t) => `<p class="manquant">${t}</p>`;
    const texte = (t, vide) => (t && t.trim() ? `<p>${echapper(t.trim()).replace(/\n/g, '<br>')}</p>` : manque(vide));
    const par = (s) => trie(features().filter((f) => f.statut === s));
    const table = (liste) =>
      liste.length
        ? `<table><thead><tr><th>Fonctionnalité</th><th>Utilisateur</th><th>Effort</th></tr></thead><tbody>${liste.map((f) => `<tr><td><b>${echapper(f.titre)}</b>${f.description ? `<small>${echapper(f.description)}</small>` : ''}</td><td>${echapper(f.utilisateur || '')}</td><td>${f.effort ? `${f.effort} (${points(f)} pts)` : '—'}</td></tr>`).join('')}</tbody></table>`
        : manque('Aucune.');
    const sprints = Array.from({ length: NB_SPRINTS }, (_, i) => {
      const liste = trie(features().filter((f) => f.sprint === i + 1 && (f.statut === 'mvp' || f.statut === 'stretch')));
      return `<tr><td><b>Sprint ${i + 1}</b></td><td>${echapper(p.sprints[i].objectif || '—')}</td><td>${liste.length ? liste.map((f) => echapper(f.titre) + (f.statut === 'stretch' ? ' <small>(stretch)</small>' : '')).join('<br>') : '—'}</td><td>${somme(liste)} / ${CAPACITE}</td></tr>`;
    }).join('');
    return `<h1>PRD · ${echapper(N.organisme)}</h1>
      <p class="meta">Version 1${etat.candidat ? ` · ${echapper(etat.candidat)}` : ''}</p>
      <h2>Problème</h2>${texte(p.probleme, 'Pas encore rédigé.')}
      <h2>Utilisateurs</h2>${p.utilisateurs.length ? `<p>${p.utilisateurs.map(echapper).join(', ')}</p>` : manque('Aucun utilisateur choisi.')}
      <h2>Mesures de succès</h2>${texte(p.mesures, 'Aucune.')}
      <h2>MVP <code>${somme(par('mvp'))} pts</code></h2>${table(par('mvp'))}
      <h2>Stretch goals <code>${somme(par('stretch'))} pts</code></h2>${table(par('stretch'))}
      <h2>Hors portée</h2>${par('hors').length ? `<ul>${par('hors').map((f) => `<li>${echapper(f.titre)}</li>`).join('')}</ul>` : manque('Aucune.')}
      ${par('trier').length ? `<h2>À trier</h2><ul>${par('trier').map((f) => `<li>${echapper(f.titre)}</li>`).join('')}</ul>` : ''}
      <h2>Plan des sprints</h2><table><thead><tr><th>Sprint</th><th>Objectif</th><th>Fonctionnalités</th><th>Points</th></tr></thead><tbody>${sprints}</tbody></table>`;
  }

  function vuePrd() {
    return h('div', null,
      titrePage('PRD', 'Généré à partir des autres onglets.', h('button', { type: 'button', class: 'btn', onclick: telechargerPrd, html: `${oct('telecharger')} Télécharger` })),
      h('div', { class: 'box' },
        h('div', { class: 'box-tete', html: `${oct('fichier')}<b>PRD.md</b>` }),
        h('div', { class: 'markdown prd', html: prdHtml() })
      )
    );
  }

  const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'candidat';

  async function telechargerPrd() {
    if (!(await demanderNom())) return;
    const f = features();
    const temps = etat.debut ? duree(Date.now() - etat.debut) : '00:00';
    const resume = `${f.length} fonctionnalités · ${f.filter((x) => x.statut === 'mvp').length} MVP · ${f.filter((x) => x.statut === 'stretch').length} stretch · ${f.filter((x) => x.sprint).length} planifiées · ${temps}`;
    const css = [...document.styleSheets]
      .filter((s) => s.href && s.href.includes('pm.css'))
      .flatMap((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .filter((t) => /^(:root|\.markdown|\.prd|\.box)/.test(t))
      .join('\n');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PRD · ${echapper(N.organisme)} · ${echapper(etat.candidat)}</title>
<style>${css}
body{margin:0;padding:32px 16px;background:#fff;color:#1f2328;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif}
.page{max-width:900px;margin:0 auto}.entrevue{margin:0 0 16px;color:#59636e;font-size:13px}.entrevue b{color:#1f2328}</style></head>
<body><div class="page"><p class="entrevue"><b>Entrevue product manager · ${echapper(etat.candidat)}</b> · ${echapper(new Date().toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' }))} · ${echapper(resume)}</p>
<div class="box"><div class="markdown prd">${prdHtml()}</div></div></div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = h('a', { href: url, download: `entrevue-pm-${slug(etat.candidat)}-${new Date().toISOString().slice(0, 10)}.html` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notifier('PRD téléchargé.');
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

  // ---------- Démarrage ----------

  function demarrer() {
    const session = lire(CLE);
    if (session && session.prd) {
      Object.assign(etat, session);
      etat.prd = { ...prdVide(), ...session.prd };
    }

    installerEditeur();
    toutRendre();

    const objectif = $('#dlg-objectif');
    objectif.addEventListener('cancel', (e) => {
      if (!etat.debut) e.preventDefault();
    });
    $('#objectif-start').addEventListener('click', () => {
      if (!etat.debut) etat.debut = Date.now();
      sauver();
      objectif.close();
      document.body.classList.remove('accueil');
    });
    $('#btn-objectif').addEventListener('click', () => {
      $('#objectif-start').textContent = etat.debut ? 'Reprendre' : 'Commencer';
      objectif.showModal();
    });
    $('#btn-telecharger').addEventListener('click', telechargerPrd);

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

    const chrono = () => ($('#timer-text').textContent = etat.debut ? duree(Date.now() - etat.debut) : '00:00');
    chrono();
    setInterval(chrono, 1000);

    if (!etat.debut) {
      objectif.showModal();
    } else {
      document.body.classList.remove('accueil');
    }
  }

  demarrer();
})();
