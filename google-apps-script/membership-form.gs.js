/**
 * KCYM Ayroor Membership Form — Apps Script
 *
 * Setup:
 * 1. Paste this into Extensions > Apps Script on the Form's linked Sheet.
 * 2. Fill in TEMPLATE_DOC_ID and SUBMISSIONS_FOLDER_ID below.
 * 3. In the Sheet, add two extra columns after the form questions:
 *    "PDF Link" and "Submission #" — this script writes into them.
 * 4. Triggers (clock icon, left sidebar) > Add Trigger:
 *      Function: onFormSubmit
 *      Event source: From spreadsheet
 *      Event type: On form submit
 *    Authorize when prompted (first run only).
 * 5. Submit the form once yourself to test, then check the Sheet row
 *    for the "PDF Link" and "Submission #" columns, and check the
 *    submissions Drive folder for the generated PDF.
 */

// ====== CONFIGURATION ======
var TEMPLATE_DOC_ID = '1s6-Uv0lFipgDHmPMK3L5HLh_NH_g41QiU1T3dD8n1cE';
var SUBMISSIONS_FOLDER_ID = '1-k6wpXr8gVbbfE7sU1TPzUdxlTDk2II4';

function onFormSubmit(e) {
  var responses = e.namedValues; // { "Question Title": ["answer"], ... }

  function getAnswer(question) {
    return responses[question] ? responses[question][0].toString().trim() : '';
  }

  var name = getAnswer('Full Name');
  var address = getAnswer('Address');
  var age = getAnswer('Age');
  var dob = getAnswer('Date of Birth');
  var phone = getAnswer('Phone Number');
  var email = getAnswer('Email Address');
  var gender = getAnswer('Gender');
  var bloodGroup = getAnswer('Blood Group');
  var qualification = getAnswer('Educational Qualification');
  var occupation = getAnswer('Occupation');

  // --- Work out the submission number (s1, s2, ...) for this name+DOB ---
  var sheet = e.range.getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var nameCol = headers.indexOf('Full Name');
  var dobCol = headers.indexOf('Date of Birth');
  var currentRow = e.range.getRow();

  var priorCount = 0;
  for (var r = 1; r < currentRow - 1; r++) { // rows before this submission, skip header
    if (
      data[r][nameCol] && data[r][dobCol] &&
      data[r][nameCol].toString().trim().toLowerCase() === name.toLowerCase() &&
      formatDateForCompare_(data[r][dobCol]) === formatDateForCompare_(dob)
    ) {
      priorCount++;
    }
  }
  var submissionNumber = priorCount + 1;

  // --- Build a filename-safe slug ---
  var dobForFile = formatDateForCompare_(dob); // YYYY-MM-DD
  var slug = name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  var fileName = slug + '_' + dobForFile + '_s' + submissionNumber + '.pdf';

  // --- Fill the template ---
  var templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  var folder = DriveApp.getFolderById(SUBMISSIONS_FOLDER_ID);
  var copy = templateFile.makeCopy('TEMP_' + fileName, folder);
  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();

  body.replaceText('{{NAME}}', name);
  body.replaceText('{{ADDRESS}}', address);
  body.replaceText('{{AGE}}', age);
  body.replaceText('{{DOB}}', dob);
  body.replaceText('{{PHONE}}', phone);
  body.replaceText('{{EMAIL}}', email);
  body.replaceText('{{GENDER}}', gender);
  body.replaceText('{{BLOODGROUP}}', bloodGroup);
  body.replaceText('{{QUALIFICATION}}', qualification);
  body.replaceText('{{OCCUPATION}}', occupation);

  doc.saveAndClose();

  // --- Export as PDF, save to the submissions folder, delete the temp Doc ---
  var pdfBlob = DriveApp.getFileById(copy.getId()).getAs('application/pdf');
  pdfBlob.setName(fileName);
  var pdfFile = folder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  DriveApp.getFileById(copy.getId()).setTrashed(true);

  var pdfUrl = 'https://drive.google.com/uc?export=download&id=' + pdfFile.getId();

  // --- Write the link + submission number back into the Sheet row ---
  var linkCol = headers.indexOf('PDF Link') + 1; // 1-based
  var subCol = headers.indexOf('Submission #') + 1;
  if (linkCol > 0) sheet.getRange(currentRow, linkCol).setValue(pdfUrl);
  if (subCol > 0) sheet.getRange(currentRow, subCol).setValue('s' + submissionNumber);

  // --- Email the applicant their PDF (optional — remove this block if not wanted) ---
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: 'Your KCYM Ayroor Membership Form',
      body: 'Thank you for submitting your KCYM Ayroor membership details.\n\n' +
            'You can download your filled membership form here:\n' + pdfUrl,
      attachments: [pdfFile.getAs(MimeType.PDF)]
    });
  }
}

function formatDateForCompare_(value) {
  var d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return value.toString().trim();
  var yyyy = d.getFullYear();
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return yyyy + '-' + mm + '-' + dd;
}
