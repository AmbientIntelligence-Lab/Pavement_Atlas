/**
 * PaveData Atlas v1.3 — deploy separately as a Google Apps Script web app.
 * No credentials belong in the GitHub Pages repository. See docs/SUBMISSIONS.md.
 * The receiver uses top-level form navigation: no opaque fetch/CORS false positives.
 */
const ATLAS = Object.freeze({
  recipient: 'tianzhi.he@ami-lab.com',
  returnUrl: 'https://ambientintelligence-lab.github.io/Pavement_Atlas/submit.html',
  dailyLimit: 40,
  hourlyEmailLimit: 3,
  maxPayload: 24000,
  retentionDays: 7,
  xlsxMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const FIELDS = [
  ['schemaVersion','Metadata schema'],['submissionId','Submission reference'],['submittedAt','Prepared at (UTC)'],
  ['submissionType','Contribution type'],['contactName','Contributor name'],['email','Contributor email'],
  ['affiliation','Institution / organization'],['datasetName','Dataset name'],['sourceUrl','Primary source URL'],
  ['accessUrl','Data access URL'],['year','Release year'],['license','License / reuse terms'],['authors','Creators / authors'],
  ['doi','DOI'],['sourceStatus','Source status'],['platform','Acquisition platform'],['vehicleType','Vehicle configuration'],
  ['viewpoint','Sensor viewpoint'],['modalities','Sensors / modalities'],['geography','Collection geography'],
  ['size','Size / resolution'],['annotations','Distress types / annotations'],['tasks','Supported tasks'],
  ['notes','Evidence / limitations / corrections'],['consent','Consent to curator contact'],['reviewStatus','Review status']
];

// Run once in the editor to initialize state and request authorization. It sends no email.
function initializeReceiver() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('EMAIL_HASH_SALT')) p.setProperty('EMAIL_HASH_SALT', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('ENABLED')) p.setProperty('ENABLED', 'false');
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder().getId();
  console.log('Initialized. Set ENABLED to true in Script Properties only after completing the deployment checklist.');
}

function doGet() {
  return receipt_('Contribution service', 'Please start at the Atlas contribution form. This service accepts one dataset record at a time.', '', false);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let spreadsheetId = '', record = null, props = null, reservation = false, mailAttempted = false;
  if (!lock.tryLock(1000)) return receipt_('The review service is busy', 'Nothing was accepted in this attempt. Please return to the form and try again shortly, or email your downloaded workbook.', '', false);
  try {
    props = PropertiesService.getScriptProperties();
    if (props.getProperty('ENABLED') !== 'true' || !props.getProperty('EMAIL_HASH_SALT')) throw new Error('Automatic delivery is temporarily unavailable. Email your downloaded workbook to the review team.');
    if (!e || !e.parameter || typeof e.parameter.payload !== 'string' || e.parameter.payload.length > ATLAS.maxPayload) throw new Error('The submitted metadata is missing or too large. Return to the form and check the fields.');
    let incoming;
    try { incoming = JSON.parse(e.parameter.payload); } catch (_) { throw new Error('The submitted metadata could not be read. Return to the form and prepare it again.'); }
    record = validate_(incoming);
    const now = new Date(), fingerprint = hash_(JSON.stringify(record));
    const requestKey = 'request:' + record.submissionId;
    const existing = readState_(props, requestKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new Error('This reference was already used for different metadata. Prepare a new contribution.');
      if (existing.status === 'sent') return success_(record.submissionId, true);
      throw new Error('This reference has an earlier attempt whose delivery is not confirmed. Please contact the review team with this reference instead of resubmitting.');
    }
    pruneState_(props, now.getTime());
    const dayKey = 'day:' + Utilities.formatDate(now, 'UTC', 'yyyy-MM-dd');
    const emailKey = 'email:' + hash_(props.getProperty('EMAIL_HASH_SALT') + record.email.toLowerCase()) + ':' + Utilities.formatDate(now, 'UTC', 'yyyy-MM-dd-HH');
    const daily = readState_(props, dayKey) || {count:0,time:now.getTime()};
    const hourly = readState_(props, emailKey) || {count:0,time:now.getTime()};
    if (daily.count >= ATLAS.dailyLimit || hourly.count >= ATLAS.hourlyEmailLimit || MailApp.getRemainingDailyQuota() < 1) throw new Error('The review service has reached its submission limit. Please email your downloaded workbook or try again later.');
    daily.count++; hourly.count++;
    props.setProperties({[dayKey]:JSON.stringify(daily),[emailKey]:JSON.stringify(hourly),[requestKey]:JSON.stringify({status:'preparing',fingerprint:fingerprint,time:now.getTime()})});
    reservation = true;
    const book = SpreadsheetApp.create('PaveData Atlas submission ' + record.submissionId);
    spreadsheetId = book.getId();
    const sheet = book.getSheets()[0]; sheet.setName('Submission');
    const rows = [['Metadata field','Submitted value']].concat(FIELDS.map(function(f){return[f[1],f[0]==='consent'?'Yes':(record[f[0]] || 'Unknown')];}));
    rows.push(['Received at (UTC)',now.toISOString()]);
    const range = sheet.getRange(1,1,rows.length,2);
    range.setNumberFormat('@'); range.setValues(rows.map(function(row){return row.map(safeCell_);})); range.setWrap(true);range.setVerticalAlignment('top');
    sheet.setFrozenRows(1);sheet.setColumnWidth(1,230);sheet.setColumnWidth(2,680);
    sheet.getRange(1,1,1,2).setBackground('#0071e3').setFontColor('#ffffff').setFontWeight('bold');
    const guide=book.insertSheet('Review guidance');
    const guidance=[['Review note','Meaning'],['Status','Community contribution; unverified until curator review.'],['Evidence','Check original source, provenance, availability, license, acquisition setup and labels.'],['Contact privacy','Name and email are for curator correspondence, not public catalog publication.'],['Unknown values','Unknown means information has not been supplied or verified.'],['Vehicle association','A relevance association does not establish manufacturer capture, use or endorsement.'],['Formula safety','Submitted values are plain text; formula-like prefixes have been escaped.']];
    guide.getRange(1,1,guidance.length,2).setNumberFormat('@').setValues(guidance).setWrap(true);guide.setColumnWidth(1,230);guide.setColumnWidth(2,680);guide.setFrozenRows(1);guide.getRange(1,1,1,2).setBackground('#0071e3').setFontColor('#ffffff').setFontWeight('bold');
    SpreadsheetApp.flush();
    // Only fetch our newly created sheet. Submitted URLs are never fetched server-side.
    const exportUrl='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(spreadsheetId)+'/export?mimeType='+encodeURIComponent(ATLAS.xlsxMime);
    const response=UrlFetchApp.fetch(exportUrl,{headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},muteHttpExceptions:true});
    if(response.getResponseCode()!==200) throw new Error('Excel generation failed before email was attempted. Please email the workbook downloaded by your browser.');
    const attachment=response.getBlob().setContentType(ATLAS.xlsxMime).setName('PaveData_Atlas_submission_'+record.submissionId.slice(0,8)+'.xlsx');
    if(attachment.getBytes().length<100) throw new Error('The generated attachment was incomplete. Please email your downloaded workbook.');
    // Mark uncertain BEFORE calling the mail service: an interrupted execution must not resend.
    props.setProperty(requestKey,JSON.stringify({status:'sending',fingerprint:fingerprint,time:now.getTime()}));
    mailAttempted=true;
    MailApp.sendEmail({
      to:ATLAS.recipient,
      replyTo:record.email,
      name:'PaveData Atlas submissions',
      subject:'[PaveData Atlas] Dataset contribution — '+record.datasetName.replace(/[\r\n]/g,' ').slice(0,160),
      body:'A new community contribution is ready for curator review.\n\nDataset: '+record.datasetName+'\nPrimary source: '+record.sourceUrl+'\nContributor: '+record.contactName+'\nReply to: '+record.email+'\nReference: '+record.submissionId+'\nReceived: '+now.toISOString()+'\n\nThe attached Excel workbook contains the submitted metadata. Please check the source, reuse terms and pavement relevance; reconcile duplicates; and confirm the outcome or request clarification from the contributor.\n\nThis contribution is unverified and has not been added to the public catalog. The contributor consented to review and follow-up. Submitted URLs are untrusted; inspect them before opening.\n\nSystem message generated by PaveData Atlas v1.3.',
      attachments:[attachment]
    });
    props.setProperty(requestKey,JSON.stringify({status:'sent',fingerprint:fingerprint,time:now.getTime()}));
    return success_(record.submissionId,false);
  } catch (error) {
    if(reservation && !mailAttempted && record && props) props.deleteProperty('request:'+record.submissionId);
    // Do not log contact data, payloads, access tokens or raw exception details.
    const message = mailAttempted ? 'We could not confirm the mail-service result. Please contact the review team with the reference below before trying again; your email may already have been accepted.' : (error && error.message && /^(Automatic|The submitted|This reference|The review|Excel generation|The generated|Please |Enter |Choose |Use |Release |Consent|Unsupported|Invalid)/.test(error.message) ? error.message : 'The service could not complete this submission. Please email your downloaded workbook to the review team.');
    return receipt_(mailAttempted?'Delivery needs confirmation':'Submission not sent',message,record?record.submissionId:'',false);
  } finally {
    if(spreadsheetId){try{DriveApp.getFileById(spreadsheetId).setTrashed(true);}catch(_){console.warn('Temporary workbook cleanup requires operator attention.');}}
    lock.releaseLock();
  }
}

function validate_(input) {
  if(!input || typeof input!=='object' || Array.isArray(input) || input.website) throw new Error('Invalid submission. Return to the contribution form.');
  const limits={contactName:120,email:254,affiliation:180,datasetName:220,sourceUrl:1500,accessUrl:1500,year:7,license:220,authors:600,doi:300,modalities:500,geography:300,size:500,annotations:1600,tasks:500,notes:2400};
  const record={};
  FIELDS.forEach(function(f){const value=input[f[0]];if(value!==undefined && f[0]!=='consent'){if(typeof value!=='string')throw new Error('Invalid metadata field type.');record[f[0]]=value.trim();}});
  Object.keys(limits).forEach(function(key){if((record[key]||'').length>limits[key])throw new Error('The submitted '+key+' field exceeds its length limit.');});
  ['contactName','email','datasetName','sourceUrl','year','license'].forEach(function(key){if(!record[key])throw new Error('Please provide '+key+'.');});
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(record.email))throw new Error('Enter a valid email address.');
  ['sourceUrl','accessUrl'].forEach(function(key){if(!record[key])return;if(!/^https?:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/i.test(record[key]))throw new Error('Use complete public HTTP or HTTPS URLs without embedded credentials.');});
  if(!/^unknown$/i.test(record.year)&&(!/^\d{4}$/.test(record.year)||+record.year<1800||+record.year>new Date().getFullYear()+1))throw new Error('Release year must be a four-digit year or Unknown.');
  const vocab={submissionType:['New dataset','Correction to an existing record'],sourceStatus:['Unknown','Peer-reviewed','Preprint','Project release','Community-contributed'],platform:['Unknown','Vehicle-mounted','Smartphone','Handheld camera','UAV / aerial','Ground robot','Specialized survey platform','Mixed / other'],vehicleType:['Unknown / not applicable','Conventional vehicle','ADAS / semi-autonomous vehicle','Autonomous research vehicle','Laboratory sensor vehicle','Road survey vehicle','Mobile robot','Other'],viewpoint:['Unknown','Forward-facing','Downward-facing','Oblique','Aerial / overhead','Mixed','Not applicable']};
  Object.keys(vocab).forEach(function(key){if(vocab[key].indexOf(record[key])===-1)throw new Error('Choose a valid '+key+'.');});
  if(record.schemaVersion!=='1.3')throw new Error('Unsupported metadata version. Refresh the Atlas form.');
  if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(record.submissionId||''))throw new Error('Invalid submission reference.');
  if(!record.submittedAt || record.submittedAt.length>32 || !isFinite(Date.parse(record.submittedAt)))throw new Error('Invalid preparation timestamp.');
  if(input.consent!==true)throw new Error('Consent to curator review and follow-up is required.');
  record.consent=true;record.reviewStatus='Awaiting curator review';
  return record;
}
function safeCell_(value){const text=String(value===null||value===undefined?'':value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'');return /^\s*[=+@-]/.test(text)?"'"+text:text;}
function hash_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(function(b){return('0'+(b&255).toString(16)).slice(-2);}).join('');}
function readState_(props,key){const value=props.getProperty(key);if(!value)return null;try{return JSON.parse(value);}catch(_){throw new Error('The review service needs maintenance. Please email your downloaded workbook.');}}
function pruneState_(props,now){const cutoff=now-ATLAS.retentionDays*86400000;const all=props.getProperties();Object.keys(all).forEach(function(key){if(/^(request:|email:|day:)/.test(key)){try{if(JSON.parse(all[key]).time<cutoff)props.deleteProperty(key);}catch(_){/* Operator-owned malformed state is not deleted automatically. */}}});}
function escapeHtml_(text){return String(text).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function success_(id,duplicate){return receipt_('Thank you for your contribution.',(duplicate?'This reference was already accepted; no duplicate email was sent. ':'')+'The mail service accepted your metadata workbook for '+ATLAS.recipient+'. We will check the information and confirm back to you soon. This is a review request, not a publication confirmation.',id,true);}
function receipt_(title,message,id,ok){
  const html='<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_top"><style>body{margin:0;background:#f5f5f7;color:#1d1d1f;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:650px;margin:10vh auto;padding:36px;background:#fff;border-radius:18px}h1{font-size:30px;line-height:1.2;letter-spacing:-.02em}p{color:#53535b}a{color:#0071e3}code{overflow-wrap:anywhere;font-size:13px}.reference{padding:16px;background:#f5f5f7;border-radius:10px}.back{display:inline-block;padding:10px 18px;border-radius:99px;background:#0071e3;color:#fff;text-decoration:none;margin-top:16px}.status{font-size:13px;font-weight:600;color:'+(ok?'#23623a':'#92511e')+'}@media(max-width:720px){main{margin:24px 14px;padding:26px}}</style></head><body><main><div class="status">PaveData Atlas · '+(ok?'Accepted by mail service':'Delivery not confirmed')+'</div><h1>'+escapeHtml_(title)+'</h1><p>'+escapeHtml_(message)+'</p>'+(id?'<p class="reference">Submission reference<br><code>'+escapeHtml_(id)+'</code></p>':'')+'<p>Review contact: <a href="mailto:'+ATLAS.recipient+'">'+ATLAS.recipient+'</a></p><a class="back" href="'+ATLAS.returnUrl+'">Return to the Atlas</a></main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('PaveData Atlas · Submission receipt');
}
