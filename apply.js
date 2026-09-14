(function () {
  const form = document.querySelector('.apply-form');
  if (!form) return;

  const done = document.querySelector('.apply-done');
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
  const MAX_CV_BYTES = 4 * 1024 * 1024;

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
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error);
      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ block: 'center' });
    } catch (err) {
      show(err.message);
      button.disabled = false;
    }
  });
})();
