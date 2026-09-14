const QUESTIONS = [
  ['prenom', 'Prénom'],
  ['nom', 'Nom'],
  ['courriel', 'Courriel'],
  ['programme', "Programme d'études"],
  ['annee', 'Année'],
  ['postes', 'Postes visés'],
  ['disponibilite', 'Heures disponibles par semaine'],
  ['motivation', 'Motivation'],
  ['experience', 'Expériences pertinentes'],
  ['liens', 'Liens'],
];

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'invalid_json' });
  }
  if (!data.secret || data.secret !== props.getProperty('SECRET')) {
    return reply({ ok: false, error: 'unauthorized' });
  }

  const root = DriveApp.getFolderById(props.getProperty('ROOT_FOLDER_ID'));
  const date = Utilities.formatDate(new Date(), 'America/Toronto', 'yyyy-MM-dd');
  const fullName = `${data.prenom} ${data.nom}`.trim();
  const folder = root.createFolder(`${date} - ${fullName}`);

  const cv = Utilities.newBlob(Utilities.base64Decode(data.cv.content), 'application/pdf', `CV - ${fullName}.pdf`);
  folder.createFile(cv);

  const doc = DocumentApp.create(`Réponses - ${fullName}`);
  const body = doc.getBody();
  body.appendParagraph(fullName).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(`Reçue le ${date}`);
  QUESTIONS.forEach(function ([key, label]) {
    body.appendParagraph(label).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(data[key] ? String(data[key]) : '-');
  });
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);

  return reply({ ok: true, folder: folder.getUrl() });
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
