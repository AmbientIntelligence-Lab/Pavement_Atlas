import { submissionConfig } from './submission-config.js';

export const fields = Object.freeze([
  ['schemaVersion', 'Metadata schema'], ['submissionId', 'Submission reference'], ['submittedAt', 'Prepared at (UTC)'],
  ['submissionType', 'Contribution type'], ['contactName', 'Contributor name'], ['email', 'Contributor email'],
  ['affiliation', 'Institution / organization'], ['datasetName', 'Dataset name'], ['sourceUrl', 'Primary source URL'],
  ['accessUrl', 'Data access URL'], ['year', 'Release year'], ['license', 'License / reuse terms'], ['authors', 'Creators / authors'],
  ['doi', 'DOI'], ['sourceStatus', 'Source status'], ['platform', 'Acquisition platform'], ['vehicleType', 'Vehicle configuration'],
  ['viewpoint', 'Sensor viewpoint'], ['modalities', 'Sensors / modalities'], ['geography', 'Collection geography'],
  ['size', 'Size / resolution'], ['annotations', 'Distress types / annotations'], ['tasks', 'Supported tasks'],
  ['notes', 'Evidence / limitations / corrections'], ['consent', 'Consent to curator contact'], ['reviewStatus', 'Review status']
]);
const fieldLimits = {contactName:120,email:254,affiliation:180,datasetName:220,sourceUrl:1500,accessUrl:1500,year:7,license:220,authors:600,doi:300,modalities:500,geography:300,size:500,annotations:1600,tasks:500,notes:2400};
const vocabularies = {
  submissionType:['New dataset','Correction to an existing record'],
  sourceStatus:['Unknown','Peer-reviewed','Preprint','Project release','Community-contributed'],
  platform:['Unknown','Vehicle-mounted','Smartphone','Handheld camera','UAV / aerial','Ground robot','Specialized survey platform','Mixed / other'],
  vehicleType:['Unknown / not applicable','Conventional vehicle','ADAS / semi-autonomous vehicle','Autonomous research vehicle','Laboratory sensor vehicle','Road survey vehicle','Mobile robot','Other'],
  viewpoint:['Unknown','Forward-facing','Downward-facing','Oblique','Aerial / overhead','Mixed','Not applicable']
};
export function validateRecord(record) {
  for (const key of ['contactName','email','datasetName','sourceUrl','year','license']) {
    if (!String(record[key] || '').trim()) throw new Error(`${fields.find(([k])=>k===key)[1]} is required.`);
  }
  for (const [key,limit] of Object.entries(fieldLimits)) {
    if (String(record[key] || '').length>limit) throw new Error(`${fields.find(([k])=>k===key)[1]} is too long (maximum ${limit} characters).`);
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(record.email)) throw new Error('Enter a valid email address.');
  for (const key of ['sourceUrl','accessUrl']) {
    if (!record[key]) continue;
    let url;
    try { url = new URL(record[key]); } catch { throw new Error('Source and access links must be complete http:// or https:// URLs.'); }
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use public http:// or https:// links without login credentials.');
  }
  if (!/^unknown$/i.test(record.year) && (!/^\d{4}$/.test(record.year) || +record.year<1800 || +record.year>new Date().getFullYear()+1)) throw new Error('Enter a release year between 1800 and next year, or Unknown.');
  for (const [key,values] of Object.entries(vocabularies)) if (!values.includes(record[key])) throw new Error(`Choose a valid ${fields.find(([k])=>k===key)[1].toLowerCase()}.`);
  if (record.consent !== true) throw new Error('Please agree to curator review and follow-up before preparing a contribution.');
  return record;
}

// Explicit inline-string cells plus a leading apostrophe for formula-like values protect
// both the XLSX and later spreadsheet imports. No macros, formulas or external links.
export function safeCell(value) {
  let text = String(value == null ? '' : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'');
  return /^\s*[=+@-]/.test(text) ? "'" + text : text;
}
const xml = value => safeCell(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const utf8 = new TextEncoder();
const crcTable = Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++) c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
// Small uncompressed ZIP writer. OOXML readers accept stored members; no dependency or CDN.
function zip(entries){
  const locals=[],central=[];let offset=0;
  for(const [name,content] of entries){
    const filename=utf8.encode(name),body=utf8.encode(content),crc=crc32(body);
    const header=new Uint8Array(30),v=new DataView(header.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,body.length,true);v.setUint32(22,body.length,true);v.setUint16(26,filename.length,true);
    locals.push(header,filename,body);
    const directory=new Uint8Array(46),d=new DataView(directory.buffer);
    d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,body.length,true);d.setUint32(24,body.length,true);d.setUint16(28,filename.length,true);d.setUint32(42,offset,true);
    central.push(directory,filename);offset+=header.length+filename.length+body.length;
  }
  const directory=concat(central),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,directory.length,true);e.setUint32(16,offset,true);
  return concat([...locals,directory,end]);
}
function worksheet(rows){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="31" customWidth="1"/><col min="2" max="2" width="95" customWidth="1"/></cols><sheetData>'+rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((cell,j)=>'<c r="'+String.fromCharCode(65+j)+(i+1)+'" t="inlineStr" s="'+(i===0?1:0)+'"><is><t xml:space="preserve">'+xml(cell)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData><autoFilter ref="A1:B'+rows.length+'"/></worksheet>';
}
export function createWorkbook(record){
  const rows=[['Metadata field','Submitted value'],...fields.map(([key,label])=>[label,key==='consent'?(record[key]?'Yes':'No'):(record[key]||'Unknown')])];
  const guidance=[['Review note','Meaning'],['Status','Community contribution; unverified until curator review.'],['Source evidence','Review original source, availability, acquisition platform, viewpoint, annotations and license.'],['Contact privacy','Contributor name and email are for curator correspondence, not public catalog publication.'],['Unknown values','Unknown means information has not been provided or verified; it does not mean the property is absent.'],['Vehicle association','Vehicle-type relevance is not evidence that a manufacturer captured, endorses or validated this dataset.'],['Formula safety','All submitted cells are text. Formula-like values are prefixed with an apostrophe.'],['Delivery','A downloaded workbook alone does not establish email delivery. Retain the receipt or send it through your email app.']];
  return zip([
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Submission" sheetId="1" r:id="rId1"/><sheet name="Review guidance" sheetId="2" r:id="rId2"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0071E3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
    ['xl/worksheets/sheet1.xml',worksheet(rows)],['xl/worksheets/sheet2.xml',worksheet(guidance)]
  ]);
}
export function mailtoFor(record,filename){
  const subject=`[PaveData Atlas] Dataset contribution — ${record.datasetName}`;
  const body=`Dear PaveData Atlas review team,\n\nPlease review the attached dataset metadata workbook for possible inclusion or correction in the Atlas.\n\nDataset: ${record.datasetName}\nSource: ${record.sourceUrl}\nContributor: ${record.contactName}\nReply to: ${record.email}\nReference: ${record.submissionId}\n\nAttachment to add: ${filename}\n\nI consent to curator review and follow-up. Please check the source evidence and confirm any inclusion or clarification with me.\n\nThank you,\n${record.contactName}\n\nPrepared by PaveData Atlas v1.3. This email is sent by the contributor; the website has not sent it automatically.`;
  return `mailto:${submissionConfig.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function endpointIsValid(value){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value);}
function setup(){
  const form=document.getElementById('contribution-form');if(!form)return;
  const result=document.getElementById('submission-result'),submit=document.getElementById('submit-button');
  const configured=endpointIsValid(submissionConfig.endpoint);let lastKey='',lastRecord=null,blobUrl='';
  if(configured){
    document.querySelector('#delivery-note strong').textContent='Send to the Atlas review team';
    document.querySelector('#delivery-note p').textContent='We will save an Excel copy, then open a secure submission receipt page. That page confirms whether the mail service accepted your contribution.';
    submit.querySelector('span').textContent='Submit for review';
    document.getElementById('action-help').textContent='Your name, email and dataset metadata will be sent to the review service. The receipt page opens here after an Excel copy is prepared.';
  }
  function collect(){
    if(!form.reportValidity())return null;
    const data=new FormData(form);if(data.get('website'))throw new Error('Submission could not be prepared. Refresh the page and try again.');
    const record={};for(const [key]of fields){if(data.has(key))record[key]=String(data.get(key)).trim();}
    record.consent=data.has('consent');validateRecord(record);
    const key=JSON.stringify(record);if(key===lastKey&&lastRecord)return lastRecord;
    record.schemaVersion=submissionConfig.schemaVersion;record.submissionId=crypto.randomUUID();record.submittedAt=new Date().toISOString();record.reviewStatus='Awaiting curator review';
    lastKey=key;lastRecord=record;return record;
  }
  function prepare(record){
    const bytes=createWorkbook(record);if(blobUrl)URL.revokeObjectURL(blobUrl);
    blobUrl=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    const filename=`PaveData_Atlas_submission_${record.submissionId.slice(0,8)}.xlsx`;
    const link=document.createElement('a');link.href=blobUrl;link.download=filename;document.body.append(link);link.click();link.remove();return filename;
  }
  function message(title,paragraph,error=false){result.replaceChildren();result.classList.toggle('error',error);result.hidden=false;const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=paragraph;result.append(h,p);result.focus();return result;}
  function downloadLink(filename){const a=document.createElement('a');a.className='button secondary';a.href=blobUrl;a.download=filename;a.textContent='Download Excel again';return a;}
  document.getElementById('export-button').addEventListener('click',()=>{
    try{const record=collect();if(!record)return;const filename=prepare(record);const panel=message('Excel prepared. Nothing has been sent.','The workbook includes your contact information and dataset metadata. Keep it for your records or attach it to an email to the review team.');panel.append(downloadLink(filename));}catch(error){message('Please check your contribution',error.message,true);}
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const record=collect();if(!record)return;const filename=prepare(record);
      if(configured){
        submit.disabled=true;submit.querySelector('span').textContent='Opening submission receipt…';
        message('Opening the review service','Your Excel copy has been prepared. The next page will confirm whether the mail service accepted your submission.');
        const post=document.createElement('form');post.method='POST';post.action=submissionConfig.endpoint;post.target='_self';
        const payload=document.createElement('input');payload.type='hidden';payload.name='payload';payload.value=JSON.stringify({...record,website:''});post.append(payload);document.body.append(post);post.submit();
        setTimeout(()=>{submit.disabled=false;submit.querySelector('span').textContent='Submit for review';},10000);return;
      }
      const panel=message('Excel ready. Complete your contribution by email.','Thank you for contributing. Automatic email delivery is not enabled yet, so this submission has not been sent.');
      const steps=document.createElement('ol');for(const text of ['Open the pre-addressed email below.',`Attach ${filename} from your downloads.`,`Send it to ${submissionConfig.recipient}. After it arrives, we will check the evidence and confirm back to you soon.`]){const li=document.createElement('li');li.textContent=text;steps.append(li);}panel.append(steps);
      const actions=document.createElement('div');actions.className='result-actions';const email=document.createElement('a');email.className='button primary';email.href=mailtoFor(record,filename);email.textContent='Open addressed email';actions.append(email,downloadLink(filename));panel.append(actions);
      const note=document.createElement('p');note.textContent=`If no email app opens, compose a message to ${submissionConfig.recipient} with the downloaded workbook attached. Reference: ${record.submissionId}.`;panel.append(note);
    }catch(error){submit.disabled=false;message('Please check your contribution',error.message,true);}
  });
}
if(typeof document!=='undefined')setup();
