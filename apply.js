(function () {
  const form = document.querySelector('.apply-form');
  if (!form) return;

  const done = document.querySelector('.apply-done');
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const MAX_CV_BYTES = 4 * 1024 * 1024;
  // Cloudflare challenges POSTs on the custom domain, so send them straight to Netlify.
  const ENDPOINT = location.hostname === 'polymtl.hack4impact.org' ? 'https://polymtl-h4i.netlify.app/api/apply' : form.action;

  const MESSAGES = {
    fr: {
      sending: 'Envoi en cours…',
      missing_fields: 'Certains champs obligatoires sont vides.',
      invalid_email: "L'adresse courriel n'est pas valide.",
      missing_role: 'Au moins un poste doit être sélectionné.',
      missing_cv: 'Le CV est obligatoire.',
      cv_too_large: 'Le CV dépasse 4 Mo.',
      cv_not_pdf: 'Le CV doit être un fichier PDF.',
      failed: "L'envoi a échoué. Réessayer dans quelques minutes."
    },
    en: {
      sending: 'Sending…',
      missing_fields: 'Some required fields are empty.',
      invalid_email: 'The email address is not valid.',
      missing_role: 'At least one role must be selected.',
      missing_cv: 'A resume is required.',
      cv_too_large: 'The resume is larger than 4 MB.',
      cv_not_pdf: 'The resume must be a PDF file.',
      failed: 'Sending failed. Try again in a few minutes.'
    }
  }[lang];

  form.querySelectorAll('.multi-select').forEach(function (select) {
    const value = select.querySelector('.multi-value');
    select.addEventListener('change', function () {
      const checked = Array.from(select.querySelectorAll('input:checked')).map(function (input) {
        return input.parentElement.textContent.trim();
      });
      value.textContent = checked.length ? checked.join(', ') : value.dataset.empty;
      value.classList.toggle('is-empty', checked.length === 0);
    });
  });

  document.addEventListener('click', function (event) {
    form.querySelectorAll('.multi-select[open]').forEach(function (select) {
      if (!select.contains(event.target)) select.removeAttribute('open');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    form.querySelectorAll('.multi-select[open]').forEach(function (select) {
      select.removeAttribute('open');
    });
  });

  const drop = form.querySelector('.file-drop');
  const fileName = drop.querySelector('.file-name');

  function showFile() {
    const file = form.cv.files[0];
    fileName.textContent = file ? file.name : fileName.dataset.empty;
    drop.classList.toggle('has-file', Boolean(file));
  }

  form.cv.addEventListener('change', showFile);

  ['dragenter', 'dragover'].forEach(function (type) {
    drop.addEventListener(type, function (event) {
      event.preventDefault();
      drop.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach(function (type) {
    drop.addEventListener(type, function () {
      drop.classList.remove('is-dragging');
    });
  });

  drop.addEventListener('drop', function (event) {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      form.cv.files = event.dataTransfer.files;
      showFile();
    }
  });

  const linkList = form.querySelector('.link-list');
  const linkAdd = form.querySelector('.link-add');
  const MAX_LINKS = 5;

  linkAdd.addEventListener('click', function () {
    const row = document.createElement('div');
    row.className = 'link-row';
    const input = document.createElement('input');
    input.name = 'liens';
    input.type = 'text';
    input.inputMode = 'url';
    input.placeholder = linkList.querySelector('input').placeholder;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'link-remove';
    remove.setAttribute('aria-label', linkAdd.dataset.removeLabel);
    remove.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    remove.addEventListener('click', function () {
      row.remove();
      linkAdd.hidden = false;
    });
    row.append(input, remove);
    linkList.append(row);
    input.focus();
    linkAdd.hidden = linkList.querySelectorAll('input').length >= MAX_LINKS;
  });

  const preset = new URLSearchParams(location.search).get('poste');
  if (preset) {
    const box = form.querySelector('input[name="postes"][value="' + CSS.escape(preset) + '"]');
    if (box) box.checked = true;
  }

  function show(key) {
    status.textContent = MESSAGES[key] || MESSAGES.failed;
    status.classList.toggle('is-error', key !== 'sending');
  }

  function check() {
    const missing = Array.from(form.querySelectorAll('[required]')).find(function (input) {
      return input.type !== 'file' && !input.value.trim();
    });
    if (missing) {
      missing.focus();
      return 'missing_fields';
    }
    if (!form.courriel.checkValidity()) {
      form.courriel.focus();
      return 'invalid_email';
    }
    if (!form.querySelector('input[name="postes"]:checked')) return 'missing_role';
    const file = form.cv.files[0];
    if (!file) return 'missing_cv';
    if (file.size > MAX_CV_BYTES) return 'cv_too_large';
    if (!/\.pdf$/i.test(file.name)) return 'cv_not_pdf';
    return null;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const error = check();
    if (error) {
      show(error);
      return;
    }

    button.disabled = true;
    show('sending');
    const progress = form.querySelector('.form-progress');
    const cover = progress.firstElementChild;
    cover.style.transition = 'none';
    cover.style.width = '100%';
    progress.hidden = false;
    void cover.offsetWidth;
    cover.style.transition = 'width 20s cubic-bezier(0.1, 0.7, 0.3, 1)';
    cover.style.width = '8%';
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', body: new FormData(form) });
      if (response.status === 413) throw new Error('cv_too_large');
      const result = await response.json();
      if (!result.ok) throw new Error(result.error);
      cover.style.transition = 'width 0.3s ease-out';
      cover.style.width = '0%';
      await new Promise(function (resolve) { setTimeout(resolve, 400); });
      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ block: 'center' });
    } catch (err) {
      show(err.message);
      button.disabled = false;
    }
  });
})();
