import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import vm from 'node:vm';
import { createWorkbook, safeCell, validateRecord, mailtoFor, fields } from '../src/submissions.js';

const source=readFileSync(new URL('./google-apps-script/Code.gs',import.meta.url),'utf8');
const valid=()=>({schemaVersion:'1.3',submissionId:randomUUID(),submittedAt:new Date().toISOString(),submissionType:'New dataset',contactName:'Atlas Test — 测试',email:'atlas-test@example.org',affiliation:'Test only',datasetName:'Synthetic validation dataset',sourceUrl:'https://example.org/dataset',accessUrl:'',year:'Unknown',license:'Unknown',authors:'Example contributor',doi:'',sourceStatus:'Unknown',platform:'Vehicle-mounted',vehicleType:'Laboratory sensor vehicle',viewpoint:'Forward-facing',modalities:'RGB; stereo',geography:'Test region',size:'Unknown',annotations:'Cracks\nPotholes',tasks:'Segmentation',notes:'=HYPERLINK("https://example.org","not a formula")',consent:true,reviewStatus:'Awaiting curator review'});

function server(options={}){
  const state={props:{ENABLED:'true',EMAIL_HASH_SALT:'test-only-salt'},emails:[],values:[],trashed:[],locks:0};
  const properties={getProperty:k=>state.props[k]??null,setProperty(k,v){state.props[k]=v;return this;},setProperties(map){Object.assign(state.props,map);return this;},deleteProperty(k){delete state.props[k];return this;},getProperties:()=>({...state.props})};
  function sheet(){const obj={setName(){return obj;},getRange(){return obj;},setNumberFormat(){return obj;},setValues(v){state.values.push(v);return obj;},setWrap(){return obj;},setVerticalAlignment(){return obj;},setFrozenRows(){return obj;},setColumnWidth(){return obj;},setBackground(){return obj;},setFontColor(){return obj;},setFontWeight(){return obj;}};return obj;}
  const blob={setContentType(){return this;},setName(name){this.name=name;return this;},getBytes:()=>new Array(512).fill(80)};
  const ctx=vm.createContext({console:{log(){},warn(){}},Date,JSON,isFinite,encodeURIComponent,PropertiesService:{getScriptProperties:()=>properties},Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,s)=>[...createHash('sha256').update(s).digest()],formatDate:(d,zone,fmt)=>fmt==='yyyy-MM-dd'?d.toISOString().slice(0,10):d.toISOString().slice(0,13).replace('T','-')},LockService:{getScriptLock:()=>({tryLock:()=>!options.busy,releaseLock:()=>state.locks++})},MailApp:{getRemainingDailyQuota:()=>options.noQuota?0:100,sendEmail(mail){state.emails.push(mail);if(options.mailError)throw new Error('Mock send result unknown');}},DriveApp:{getRootFolder:()=>({getId:()=> 'test-root'}),getFileById:id=>({setTrashed(value){state.trashed.push({id,value});}})},SpreadsheetApp:{create:()=>({getId:()=> 'synthetic-sheet-id',getSheets:()=>[sheet()],insertSheet:()=>sheet()}),flush(){}},ScriptApp:{getOAuthToken:()=> 'never-a-real-token'},UrlFetchApp:{fetch:(url,request)=>{assert.match(url,/^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/synthetic-sheet-id\/export\?/);assert.equal(request.headers.Authorization,'Bearer never-a-real-token');return{getResponseCode:()=>options.exportError?500:200,getBlob:()=>blob};}},HtmlService:{createHtmlOutput:html=>({html,setTitle(){return this;}})}});
  vm.runInContext(source,ctx);
  return{state,ctx,submit:record=>ctx.doPost({parameter:{payload:JSON.stringify(record)}})};
}

test('required contact, source, year, license and consent are enforced',()=>{
  assert.equal(validateRecord(valid()).consent,true);
  for(const key of ['contactName','email','datasetName','sourceUrl','year','license'])assert.throws(()=>validateRecord({...valid(),[key]:''}),/required/);
  assert.throws(()=>validateRecord({...valid(),email:'x\r\nBcc:other@example.org'}),/email address/);
  assert.throws(()=>validateRecord({...valid(),sourceUrl:'javascript:alert(1)'}),/public http/);
  assert.throws(()=>validateRecord({...valid(),sourceUrl:'https://user:secret@example.org'}),/credentials/);
  assert.throws(()=>validateRecord({...valid(),year:'3000'}),/release year/);
  assert.throws(()=>validateRecord({...valid(),consent:false}),/agree/);
  assert.throws(()=>validateRecord({...valid(),datasetName:'a'.repeat(221)}),/too long/);
});

test('XLSX is an OOXML ZIP with text-only Unicode data and no formula elements',()=>{
  const record=valid(),bytes=createWorkbook(record),buf=Buffer.from(bytes);let p=0;const members={};
  while(buf.readUInt32LE(p)===0x04034b50){const size=buf.readUInt32LE(p+18),nameLen=buf.readUInt16LE(p+26),extra=buf.readUInt16LE(p+28),name=buf.subarray(p+30,p+30+nameLen).toString();members[name]=buf.subarray(p+30+nameLen+extra,p+30+nameLen+extra+size).toString();p+=30+nameLen+extra+size;}
  assert.equal(Object.keys(members).length,7);assert.equal(buf.readUInt32LE(p),0x02014b50);assert.equal(buf.readUInt32LE(buf.length-22),0x06054b50);
  assert.match(members['xl/worksheets/sheet1.xml'],/Atlas Test — 测试/);
  assert.match(members['xl/worksheets/sheet1.xml'],/&apos;=HYPERLINK/);
  assert.ok(!Object.values(members).some(s=>/<f[\s>]/.test(s)));
  assert.match(members['xl/workbook.xml'],/Review guidance/);
  assert.equal(safeCell('\t=1+1'),"'\t=1+1");assert.equal(safeCell('@SUM(A1)'),"'@SUM(A1)");
  if(process.argv[2])writeFileSync(process.argv[2],bytes);
});

test('email fallback fixes recipient and explains that manual sending is required',()=>{
  const uri=decodeURIComponent(mailtoFor(valid(),'example.xlsx'));
  assert.match(uri,/^mailto:tianzhi\.he@ami-lab\.com\?/);assert.match(uri,/Attachment to add: example.xlsx/);assert.match(uri,/has not sent it automatically/);
});

test('receiver revalidates client data and never emails invalid metadata',()=>{
  for(const patch of [{contactName:''},{email:'bad'},{sourceUrl:'javascript:alert(1)'},{year:'3000'},{license:''},{consent:false},{platform:'Invented'},{schemaVersion:'99'},{submissionId:'invalid'},{website:'bot'}]){
    const s=server(),response=s.submit({...valid(),...patch});assert.match(response.html,/Submission not sent/);assert.equal(s.state.emails.length,0);
  }
});

test('receiver sends fixed recipient, independent XLSX attachment, escaped cells, then successful receipt',()=>{
  const s=server(),record={...valid(),recipient:'attacker@example.org'},response=s.submit(record);
  assert.match(response.html,/Thank you for your contribution/);assert.match(response.html,/mail service accepted/);assert.equal(s.state.emails.length,1);
  const mail=s.state.emails[0];assert.equal(mail.to,'tianzhi.he@ami-lab.com');assert.equal(mail.replyTo,record.email);assert.match(mail.attachments[0].name,/\.xlsx$/);
  assert.ok(s.state.values.flat().some(row=>row[0]==='Evidence / limitations / corrections'&&row[1].startsWith("'=")));
  assert.equal(s.state.trashed.length,1);assert.equal(s.state.trashed[0].value,true);assert.equal(s.state.locks,1);
});

test('duplicate reference returns receipt without a second send; changed payload is rejected',()=>{
  const s=server(),record=valid();s.submit(record);const duplicate=s.submit(record);assert.match(duplicate.html,/no duplicate email was sent/);assert.equal(s.state.emails.length,1);
  const changed=s.submit({...record,datasetName:'Changed'});assert.match(changed.html,/Submission not sent/);assert.equal(s.state.emails.length,1);
});

test('mail uncertainty never claims success and prevents a blind duplicate retry',()=>{
  const s=server({mailError:true}),record=valid(),response=s.submit(record);assert.match(response.html,/Delivery needs confirmation/);assert.doesNotMatch(response.html,/Thank you for your contribution/);assert.equal(s.state.trashed.length,1);
  const retry=s.submit(record);assert.match(retry.html,/earlier attempt/);assert.equal(s.state.emails.length,1);
});

test('export failure cleans up and sends no message; service-off/quota/busy states are honest',()=>{
  const exp=server({exportError:true}),response=exp.submit(valid());assert.match(response.html,/Submission not sent/);assert.equal(exp.state.emails.length,0);assert.equal(exp.state.trashed.length,1);
  const off=server();off.state.props.ENABLED='false';assert.match(off.submit(valid()).html,/temporarily unavailable/);assert.equal(off.state.emails.length,0);
  const quota=server({noQuota:true});assert.match(quota.submit(valid()).html,/submission limit/);assert.equal(quota.state.emails.length,0);
  const busy=server({busy:true});assert.match(busy.submit(valid()).html,/review service is busy/);assert.equal(busy.state.emails.length,0);
});

test('rate limit stops fourth email per hour and submission cells use a fixed field allowlist',()=>{
  const s=server();for(let i=0;i<3;i++)assert.match(s.submit({...valid(),extraField:'excluded'}).html,/Thank you/);
  assert.match(s.submit(valid()).html,/submission limit/);assert.equal(s.state.emails.length,3);assert.equal(s.state.values[0].length,fields.length+2);assert.ok(!s.state.values.flat(2).includes('excluded'));
});

test('receipt safely escapes attacker-controlled content',()=>{
  const s=server();const out=s.ctx.receipt_('<script>alert(1)</script>','A & B','<img src=x>',false);assert.doesNotMatch(out.html,/<script>|<img src=x>/);assert.match(out.html,/&lt;script&gt;/);
});
