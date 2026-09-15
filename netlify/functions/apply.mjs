const MAX_CV_BYTES = 4 * 1024 * 1024;
const REQUIRED = ['prenom', 'nom', 'courriel', 'programme', 'annee', 'disponibilite', 'motivation'];
const OPTIONAL = ['experience', 'reference'];
const ROLES = ['Développeur', 'Designer', 'Product Manager'];
const EXECUTIVE = ['VP Projets', 'VP Communications', 'VP Externe', 'VP Interne', 'VP Finances', 'VP Événements'];

function fail(status, error) {
  return Response.json({ ok: false, error }, { status });
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return fail(405, 'method_not_allowed');
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'invalid_form');
  }

  if (form.get('site_web')) {
    return Response.json({ ok: true });
  }

  const fields = {};
  for (const key of [...REQUIRED, ...OPTIONAL]) {
    fields[key] = String(form.get(key) ?? '').trim().slice(0, 5000);
  }
  if (REQUIRED.some((key) => !fields[key])) {
    return fail(400, 'missing_fields');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.courriel)) {
    return fail(400, 'invalid_email');
  }

  const postes = form.getAll('postes').map(String).filter((role) => ROLES.includes(role));
  if (postes.length === 0) {
    return fail(400, 'missing_role');
  }

  const cv = form.get('cv');
  if (!cv || typeof cv === 'string' || cv.size === 0) {
    return fail(400, 'missing_cv');
  }
  if (cv.size > MAX_CV_BYTES) {
    return fail(413, 'cv_too_large');
  }
  const bytes = Buffer.from(await cv.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== '%PDF-') {
    return fail(400, 'cv_not_pdf');
  }

  const upstream = await fetch(process.env.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      secret: process.env.APPS_SCRIPT_SECRET,
      ...fields,
      postes: postes.join(', '),
      liens: form.getAll('liens').map((link) => String(link).trim()).filter(Boolean).slice(0, 10).join('\n'),
      executif: form.getAll('executif').map(String).filter((role) => EXECUTIVE.includes(role)).join(', '),
      cv: { content: bytes.toString('base64') },
    }),
  }).catch(() => null);

  const result = upstream ? await upstream.json().catch(() => null) : null;
  if (!result?.ok) {
    return fail(502, 'drive_failed');
  }
  return Response.json({ ok: true });
}

export const config = {
  path: '/api/apply',
};
