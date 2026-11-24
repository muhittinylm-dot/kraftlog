/* KRAFTLOG 6.0 – interaktive isometrische Mini-Welt; Cardio 5.1 und Kraft bleiben erhalten. */
'use strict';
const STORE = 'kraftlog.profiles.v1';
const CLOUD_AUTH_ENCRYPTED_STORE = 'kraftlog.cloud.sealed.v1:';
const NEW_KDF_ITERATIONS = 600000; // alte Profile benutzen ohne Feld weiterhin 240000
const AUTH_FAILURES = new Map(); // nur lokale UI-Bremse, kein Ersatz fuer Server-Limits
function authThrottleKey(kind, identity){return kind + ':' + String(identity||'').slice(0,254).toLowerCase();}
function checkLoginThrottle(kind, identity){const key=authThrottleKey(kind,identity),record=AUTH_FAILURES.get(key);if(record && record.until>Date.now())throw new Error('Zu viele Versuche. Bitte in '+Math.ceil((record.until-Date.now())/1000)+' Sekunden erneut versuchen.');}
function noteLoginFailure(kind,identity){const key=authThrottleKey(kind,identity),previous=AUTH_FAILURES.get(key)||{count:0,until:0};previous.count++;previous.until=previous.count>=5?Date.now()+Math.min(15*60*1000,30*1000*2**Math.min(5,previous.count-5)):0;AUTH_FAILURES.set(key,previous);}
function resetLoginThrottle(kind,identity){AUTH_FAILURES.delete(authThrottleKey(kind,identity));}
function validEmail(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');return email;}
function validatePassword(value,{newPassword=false}={}){const pw=String(value||'');if(pw.length<8||pw.length>256)throw new Error('Passwort muss zwischen 8 und 256 Zeichen haben.');if(newPassword&&pw.length<12)throw new Error('Für ein neues Passwort bitte mindestens 12 Zeichen verwenden.');return pw;}

const GROUPS = ['Alle','Brust','Rücken','Schultern','Beine','Bauch','Arme','Cardio'];
const EXERCISES = [
  ['butterfly','Butterfly','Brust','Maschine','fly','strength'],
  ['brustpresse','Brustpresse','Brust','Maschine','chest','strength'],
  ['schraegpresse','Schrägbrustpresse','Brust','Maschine','chest','strength'],
  ['bankdruecken','Bankdrücken','Brust','Freihantel','bench','strength'],
  ['schraegbank','Schrägbank-Kurzhanteln','Brust','Freihantel','bench','strength'],
  ['kabelflys','Kabel-Flys','Brust','Kabelzug','fly','strength'],
  ['latzug','Latzug breit','Rücken','Maschine','lat','strength'],
  ['latzugeng','Latzug eng','Rücken','Maschine','lat','strength'],
  ['rudern','Rudern sitzend','Rücken','Maschine','row','strength'],
  ['rudernlh','Langhantelrudern','Rücken','Freihantel','hinge','strength'],
  ['klimmzuege','Klimmzüge','Rücken','Körpergewicht','pull','strength'],
  ['rueckenstrecker','Rückenstrecker','Rücken','Maschine','hinge','strength'],
  ['reversebutterfly','Reverse Butterfly','Schultern','Maschine','fly','strength'],
  ['schulterpresse','Schulterpresse','Schultern','Maschine','overhead','strength'],
  ['seitheben','Seitheben','Schultern','Freihantel','lateral','strength'],
  ['facepulls','Face Pulls','Schultern','Kabelzug','cable','strength'],
  ['beinpresse','Beinpresse','Beine','Maschine','legpress','strength'],
  ['beinstrecker','Beinstrecker','Beine','Maschine','legextension','strength'],
  ['beinbeuger','Beinbeuger','Beine','Maschine','legcurl','strength'],
  ['kniebeugen','Kniebeugen','Beine','Freihantel','squat','strength'],
  ['kreuzheben','Kreuzheben','Beine','Freihantel','hinge','strength'],
  ['abduktoren','Abduktoren','Beine','Maschine','hip','strength'],
  ['adduktoren','Adduktoren','Beine','Maschine','hip','strength'],
  ['wadenheben','Wadenheben','Beine','Maschine','calves','strength'],
  ['bauchmaschine','Bauchmaschine','Bauch','Maschine','abs','strength'],
  ['situps','Sit-ups','Bauch','Körpergewicht','abs','strength'],
  ['crunches','Crunches','Bauch','Körpergewicht','abs','strength'],
  ['cablecrunch','Kabel-Crunches','Bauch','Kabelzug','abs','strength'],
  ['beinheben','Hängendes Beinheben','Bauch','Körpergewicht','pull','strength'],
  ['bizepscurls','Bizepscurls','Arme','Freihantel','curl','strength'],
  ['bizepsmaschine','Bizepsmaschine','Arme','Maschine','curl','strength'],
  ['hammercurls','Hammer-Curls','Arme','Freihantel','curl','strength'],
  ['trizepsdruecken','Trizepsdrücken','Arme','Kabelzug','cable','strength'],
  ['trizepsueberkopf','Trizeps über Kopf','Arme','Freihantel','overhead','strength'],
  ['dips','Dips','Arme','Körpergewicht','chest','strength'],
  ['laufband','Laufband','Cardio','Gerät','treadmill','cardio'],
  ['ergometer','Ergometer','Cardio','Gerät','bike','cardio'],
  ['crosstrainer','Crosstrainer','Cardio','Gerät','elliptical','cardio'],
  ['rudermaschine','Rudermaschine','Cardio','Gerät','rower','cardio'],
  ['stepper','Stepper','Cardio','Gerät','stepper','cardio'],
  ['walking','Walking im Freien','Cardio','Outdoor','walk','cardio'],
  ['laufen','Laufen im Freien','Cardio','Outdoor','run','cardio'],
  ['radfahren','Radfahren','Cardio','Outdoor','bike','cardio']
].map(([id,name,group,equipment,art,mode])=>({id,name,group,equipment,art,mode}));
const EXERCISE_TIPS = {
 butterfly:'Sitzend die Griffe oder Polster kontrolliert vor der Brust zusammenführen.',
 brustpresse:'Sitzend die Griffe auf Brusthöhe nach vorn drücken.',
 schraegpresse:'Die Griffe aus leicht geneigter Sitzposition schräg nach vorn drücken.',
 bankdruecken:'Auf einer Bank liegend die Langhantel über der Brust nach oben drücken.',
 schraegbank:'Auf einer schrägen Bank die Kurzhanteln über der Brust nach oben drücken.',
 kabelflys:'Zwischen Kabelzügen die Arme in einem Bogen vor der Brust zusammenführen.',
 latzug:'Sitzend die breite Zugstange von oben kontrolliert zur oberen Brust ziehen.',
 latzugeng:'Sitzend einen engen Griff von oben in Richtung Brust ziehen.',
 rudern:'Sitzend den Griff des Zuggerätes zum Bauch ziehen.',
 rudernlh:'Mit nach vorn geneigtem Oberkörper die Langhantel zum Bauch ziehen.',
 klimmzuege:'An einer oberen Stange hängend den Körper mit den Armen hochziehen.',
 rueckenstrecker:'An der Rückenstreckermaschine oder Hyperextension den Oberkörper aufrichten.',
 reversebutterfly:'Sitzend die Arme an der Maschine nach außen und hinten öffnen.',
 schulterpresse:'Die Griffe von Schulterhöhe aus über den Kopf nach oben drücken.',
 seitheben:'Stehend die Kurzhanteln mit leicht gebeugten Armen seitlich anheben.',
 facepulls:'Am hohen Kabelzug das Seil in Richtung Gesicht ziehen und die Ellbogen auseinanderführen.',
 beinpresse:'Sitzend oder zurückgelehnt die Fußplatte mit beiden Beinen wegdrücken.',
 beinstrecker:'Sitzend die Knie gegen das Polster strecken.',
 beinbeuger:'An der Maschine die Knie gegen den Widerstand beugen.',
 kniebeugen:'Mit kontrollierter Knie- und Hüftbeugung in die Hocke gehen und aufstehen.',
 kreuzheben:'Eine Langhantel aus einer Hüftbeuge kontrolliert aufrichten.',
 abduktoren:'Sitzend die Knie gegen den Widerstand nach außen bewegen.',
 adduktoren:'Sitzend die Beine gegen den Widerstand nach innen zusammenführen.',
 wadenheben:'Die Fersen kontrolliert heben und senken, während der Vorfuß gestützt ist.',
 bauchmaschine:'An der Bauchmaschine den Oberkörper gegen Widerstand einrollen.',
 situps:'Auf dem Rücken liegend die Knie anwinkeln und den Oberkörper kontrolliert zum Sitzen aufrichten. Ohne Zusatzgewicht 0 kg eintragen.',
 crunches:'Auf dem Rücken liegend die Knie anwinkeln und die Schulterblätter kontrolliert vom Boden heben. Ohne Zusatzgewicht 0 kg eintragen.',
 cablecrunch:'Kniend am Kabelzug den Oberkörper nach unten einrollen.',
 beinheben:'Hängend oder gestützt die Beine kontrolliert in Richtung Oberkörper heben.',
 bizepscurls:'Mit Kurzhanteln die Ellenbogen beugen und das Gewicht anheben.',
 bizepsmaschine:'An der Maschine die Ellenbogen gegen den Widerstand beugen.',
 hammercurls:'Mit neutral gehaltenen Kurzhanteln die Ellenbogen beugen.',
 trizepsdruecken:'Am hohen Kabelzug den Griff nach unten drücken, dabei die Ellenbogen nah am Körper halten.',
 trizepsueberkopf:'Ein Gewicht von hinter dem Kopf nach oben strecken.',
 dips:'Auf parallelen Griffen den Körper durch Beugen und Strecken der Arme bewegen.',
 laufband:'Erfasse Dauer, Distanz und Kalorien für deine Laufband-Einheit.',
 ergometer:'Erfasse Dauer, Distanz und Kalorien auf dem Ergometer.',
 crosstrainer:'Erfasse Dauer, Distanz und Kalorien auf dem Crosstrainer.',
 rudermaschine:'Erfasse Dauer, Distanz und Kalorien für dein Rudern.',
 stepper:'Erfasse Dauer und Kalorien für deinen Stepper-Block.',
 walking:'Erfasse Dauer, Distanz und Kalorien für deinen Walking-Tag.',
 laufen:'Erfasse Dauer, Distanz und Kalorien für deinen Lauf.',
 radfahren:'Erfasse Dauer, Distanz und Kalorien für deine Radtour.'
};
const BASE_PLANS = [
  {id:'plan-ganz', name:'Ganzkörper', exerciseIds:['beinpresse','latzug','brustpresse','rudern','schulterpresse','bauchmaschine']},
  {id:'plan-push', name:'Push · Brust & Trizeps', exerciseIds:['brustpresse','schraegpresse','butterfly','schulterpresse','seitheben','trizepsdruecken']},
  {id:'plan-pull', name:'Pull · Rücken & Bizeps', exerciseIds:['latzug','rudern','reversebutterfly','facepulls','bizepscurls','rueckenstrecker']},
  {id:'plan-beine', name:'Beine & Bauch', exerciseIds:['beinpresse','beinstrecker','beinbeuger','abduktoren','wadenheben','bauchmaschine']},
  {id:'plan-cardio', name:'Cardio-Tag', exerciseIds:['laufband','ergometer','crosstrainer']}
];

const $ = (q,root=document)=>root.querySelector(q);
const el = id=>document.getElementById(id);
const escapeHTML = x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = ()=>crypto.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(16).slice(2);
const fmt = n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(Number(n)||0);
const shortDate = d=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(d+'T12:00:00'));
const longDate = d=>new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
function localDate(dt=new Date()){return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;}
function dateShift(date,n){let d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d);}
const baseData=()=>({version:7,plans:BASE_PLANS.map(p=>({...p,exerciseIds:[...p.exerciseIds]})),customExercises:[],sessions:[]});
let accounts=[],currentId=null,currentKey=null,data=null,activeTab='today',selectedDate=localDate();
let libraryGroup='Alle',libraryQuery='',statExercise='latzug',statMetric='volume',modal=null,authMode='new',saveQueue=Promise.resolve(),toastTimer=null,appError='';
let cloudStatus='Noch nicht verbunden',cloudConflict=false,cloudBusy=false,cloudDebounce=null,cloudNeedsRerun=false,localMutationSeq=0;
const TIMER_STORE='kraftlog.timer.v1';
const TIMER_PRESETS=[30,60,90,120,150,180];
let timerState=loadTimerState(),timerTicker=null;
const encoder=new TextEncoder(),decoder=new TextDecoder();

function bytesToBase64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
function base64ToBytes(s){let raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function deriveKey(password,salt,iterations=240000){if(!Number.isSafeInteger(iterations)||iterations<240000||iterations>1200000)throw new Error('Ungültige Verschlüsselungsparameter');const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encryptText(plaintext,key){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(plaintext));return {iv:bytesToBase64(iv),cipher:bytesToBase64(new Uint8Array(cipher))};}
async function decryptText(record,key){const buffer=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(record.iv)},key,base64ToBytes(record.cipher));return decoder.decode(buffer);}
function writeAccounts(){localStorage.setItem(STORE,JSON.stringify(accounts));}
function toast(msg){let n=el('toast');n.textContent=msg;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),2700);}
function save(){
 if(!data||!currentId||!currentKey)return;
 localMutationSeq++;
 const snapshot=JSON.stringify(data),id=currentId,key=currentKey;
 // Bestehende Speicherschlüssel bleiben UNVERÄNDERT: App-Updates lassen die Daten intakt.
 saveQueue=saveQueue.catch(()=>{}).then(async()=>{
   const enc=await encryptText(snapshot,key);
   const rec=accounts.find(a=>a.id===id);if(!rec)return;
   rec.iv=enc.iv;rec.cipher=enc.cipher;rec.updatedAt=new Date().toISOString();
   rec.localRevision=(rec.localRevision||0)+1;
   writeAccounts();
   if(currentId===id && rec.cloudUid) scheduleCloudSync();
 }).catch(err=>{toast('Lokales Speichern fehlgeschlagen!');setCloudStatus('Fehler beim lokalen Speichern');});
}
async function flush(){await saveQueue;}
// Refresh-Token duerfen den Browser nur verschluesselt ueberleben.
// Cloud-Sync bleibt nach dem lokalen Profil-Entsperren automatisch verfuegbar.
async function sealCloudSession(){
 if(!currentId||!currentKey||!KraftlogCloud.loggedIn())return;
 const id=currentId,key=currentKey,rec=accounts.find(a=>a.id===id);
 const auth=KraftlogCloud.authSnapshot();
 if(!rec||!auth||rec.cloudUid!==auth.uid)return;
 const enc=await encryptText(JSON.stringify(auth),key);
 if(currentId===id&&currentKey===key)localStorage.setItem(CLOUD_AUTH_ENCRYPTED_STORE+id,JSON.stringify(enc));
}
async function resumeCloudSession(){
 if(!currentId||!currentKey)return false;
 const rec=accounts.find(a=>a.id===currentId);
 if(!rec?.cloudUid)return false;
 if(KraftlogCloud.loggedIn()&&KraftlogCloud.uid()===rec.cloudUid){await sealCloudSession();return true;}
 const sealed=localStorage.getItem(CLOUD_AUTH_ENCRYPTED_STORE+currentId);
 if(!sealed)return false;
 try{
   const auth=JSON.parse(await decryptText(JSON.parse(sealed),currentKey));
   if(auth.uid!==rec.cloudUid||auth.localProfileId!==currentId)return false;
   if(KraftlogCloud.restoreAuthSnapshot(auth))return true;
 }catch{return false;}
 return false;
}
window.addEventListener('kraftlog:cloud-token',()=>{sealCloudSession().catch(()=>{});});

function safeGetAccounts(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
function allExercises(){return [...EXERCISES,...(data?.customExercises||[])];}
function getEx(id){return allExercises().find(e=>e.id===id)||{id,name:'Unbekannte Übung',group:'Andere',equipment:'',art:'chest',mode:'strength'};}
function isCardioExercise(exOrId){const id=typeof exOrId==='string'?exOrId:exOrId?.id;return getEx(id).mode==='cardio';}
function cardioShape(e){if(!e.cardio)e.cardio={duration:'',distance:'',calories:'',recordedAt:null,completed:false};return e.cardio;}
// In alten Profilen gab es noch keinen separaten Abschliessen-Knopf.
// Solche bereits gespeicherten Cardio-Werte zaehlen weiterhin als erfasst.
function cardioValid(e){const c=e?.cardio||{};const d=Number(c.duration),dist=Number(c.distance),cal=Number(c.calories);return c.duration!==''&&c.duration!=null&&Number.isFinite(d)&&d>0&&d<=10080&&(!hasCardioField(c.distance)||(Number.isFinite(dist)&&dist>=0&&dist<=100000))&&(!hasCardioField(c.calories)||(Number.isFinite(cal)&&cal>=0&&cal<=100000));}
function hasCardioField(v){return v!==''&&v!=null;}
function entryCompleted(e){return isCardioExercise(e)?(cardioValid(e)&&e.cardio?.completed!==false):e.sets.some(validSet);}
function cardioDuration(e){return Number(e?.cardio?.duration)||0;}
function cardioDistance(e){return Number(e?.cardio?.distance)||0;}
function cardioCalories(e){return Number(e?.cardio?.calories)||0;}
function cardioPaceText(e){const m=cardioDuration(e),km=cardioDistance(e);if(!(Number.isFinite(m)&&Number.isFinite(km)&&m>0&&km>0))return '–';const sec=Math.round((m*60)/km);if(sec>359999)return '–';return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function cardioSpeedText(e){const m=cardioDuration(e),km=cardioDistance(e);return m>0&&km>0?fmt(km*60/m):'–';}
function parseCardioInput(raw){const v=String(raw??'').trim().replace(',','.');if(v==='')return '';if(!/^\d{1,6}(?:\.\d{0,3})?$/.test(v))return null;return v;}
function hasCardioDraft(ex){const c=ex.cardio;return isCardioExercise(ex)&&c&&['duration','distance','calories'].some(f=>hasCardioField(c[f]));}
function cardioSaveVisual(ex){const node=el('cardio-summary-'+ex.id);if(node)node.textContent=`${fmt(cardioDuration(ex))} min · ${fmt(cardioDistance(ex))} km · ${fmt(cardioCalories(ex))} kcal`;const pace=el('cardio-pace-'+ex.id);if(pace)pace.textContent=cardioPaceText(ex);const speed=el('cardio-speed-'+ex.id);if(speed)speed.textContent=cardioSpeedText(ex);const state=el('cardio-state-'+ex.id);if(state)state.textContent=entryCompleted(ex)?'Abgeschlossen · automatisch gespeichert':'Entwurf · automatisch gespeichert';}
function cardioSavedStatus(exId,seq){const n=el('cardio-save-'+exId);if(n)n.textContent='Speichere …';saveQueue.then(()=>{if(localMutationSeq!==seq||!currentId)return;const elStatus=el('cardio-save-'+exId);if(elStatus)elStatus.textContent='Lokal gespeichert';}).catch(()=>{const elStatus=el('cardio-save-'+exId);if(elStatus)elStatus.textContent='Speichern fehlgeschlagen';});}
function changeCardioField(target){const ex=session()?.exercises.find(e=>e.id===target.dataset.ex),field=target.dataset.cardioField;if(!ex||!['duration','distance','calories'].includes(field))return;const parsed=parseCardioInput(target.value);if(parsed===null||(parsed!==''&&Number(parsed)>(field==='duration'?10080:100000))){target.setAttribute('aria-invalid','true');const state=el('cardio-save-'+ex.id);if(state)state.textContent='Bitte gültige Zahl eingeben';return;}target.removeAttribute('aria-invalid');const c=cardioShape(ex);if(String(c[field]??'')===parsed)return;c[field]=parsed;session().updatedAt=new Date().toISOString();save();cardioSaveVisual(ex);cardioSavedStatus(ex.id,localMutationSeq);syncVolume();}
function applyPriorCardio(ex,field=null){const previous=priorExercise(ex.id)?.ex?.cardio;if(!previous)return false;const c=cardioShape(ex);const fields=field?[field]:['duration','distance','calories'];let changed=false;for(const key of fields){if(!['duration','distance','calories'].includes(key))continue;if(hasCardioField(previous[key])&&(field||!hasCardioField(c[key]))&&String(c[key]??'')!==String(previous[key])){c[key]=String(previous[key]);changed=true;}}if(changed){session().updatedAt=new Date().toISOString();save();}return changed;}

function validSet(s){return s.reps!==''&&s.kg!==''&&s.reps!=null&&s.kg!=null&&Number.isFinite(Number(s.reps))&&Number.isFinite(Number(s.kg))&&Number(s.reps)>0&&Number(s.reps)<=9999&&Number.isInteger(Number(s.reps))&&Number(s.kg)>=0&&Number(s.kg)<=9999;}
const exVolume = e=>e.sets.reduce((n,s)=>n+(validSet(s)?Number(s.kg)*Number(s.reps):0),0);
const exPeak = e=>Math.max(0,...e.sets.filter(validSet).map(s=>Number(s.kg)));
const exSetCount = e=>e.sets.filter(validSet).length;
function session(){return data?.sessions.find(s=>s.date===selectedDate)||null;}
function ensureSession(){let s=session();if(s)return s;s={id:uid(),date:selectedDate,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),planId:null,planName:'Freies Training',exercises:[]};data.sessions.push(s);return s;}
function makeExerciseEntry(id){return isCardioExercise(id)?{id,sets:[],cardio:{duration:'',distance:'',calories:'',recordedAt:null,completed:false}}:{id,sets:[{id:uid(),kg:'',reps:''},{id:uid(),kg:'',reps:''},{id:uid(),kg:'',reps:''}]};}
function addExerciseToSession(id){const s=ensureSession();if(s.exercises.some(e=>e.id===id))return false;s.exercises.push(makeExerciseEntry(id));s.updatedAt=new Date().toISOString();save();return true;}
function priorExercise(id){return data.sessions.filter(s=>s.date<selectedDate).sort((a,b)=>b.date.localeCompare(a.date)).map(s=>({date:s.date,ex:s.exercises.find(e=>e.id===id)})).find(x=>x.ex&&entryCompleted(x.ex))||null;}
// Historische Sätze sind NUR Vorlagen. Bis zur manuellen Übernahme zählen sie nicht als Training.
function previousValidSets(id){return isCardioExercise(id)?[]:(priorExercise(id)?.ex.sets.filter(validSet)||[]);}
function hasSetField(v){return v!==''&&v!=null;}
function applyPreviousSet(target, source, field=null){
 if(!target||!source||!validSet(source))return false;
 const keys=field?[field]:['kg','reps'];let changed=false;
 for(const key of keys){
   if(key!=='kg'&&key!=='reps')continue;
   if(field||!hasSetField(target[key])){
     const value=String(source[key]);
     if(String(target[key]??'')!==value){target[key]=value;changed=true;}
   }
 }
 if(changed&&validSet(target))target.recordedAt=new Date().toISOString();
 return changed;
}
function commitPriorChange(){const s=session();if(!s)return;s.updatedAt=new Date().toISOString();save();render();}

function exerciseEntries(id){return data.sessions.flatMap(s=>s.exercises.filter(e=>e.id===id&&entryCompleted(e)).map(ex=>({date:s.date,volume:exVolume(ex),peak:exPeak(ex),count:exSetCount(ex),ex,duration:cardioDuration(ex),distance:cardioDistance(ex),calories:cardioCalories(ex)})) ).sort((a,b)=>a.date.localeCompare(b.date));}
const allEntries=()=>data.sessions.flatMap(s=>s.exercises.filter(entryCompleted).map(e=>({date:s.date,ex:e})));
const allCardioEntries=()=>data.sessions.flatMap(s=>s.exercises.filter(e=>isCardioExercise(e)&&entryCompleted(e)).map(e=>({date:s.date,ex:e}))).sort((a,b)=>a.date.localeCompare(b.date));


function normalizeDataShape(obj){
 if(!obj||typeof obj!=='object')obj=baseData();
 if(!Array.isArray(obj.plans))obj.plans=BASE_PLANS.map(p=>({...p,exerciseIds:[...p.exerciseIds]}));
 if(!Array.isArray(obj.customExercises))obj.customExercises=[];
 if(!Array.isArray(obj.sessions))obj.sessions=[];
 // Bestehende Nutzerdaten, auch ältere Zusatzfelder, bewusst unverändert erhalten.
 obj.version=7;
 obj.sessions.forEach(s=>{
   if(!Array.isArray(s.exercises))s.exercises=[];
   if(typeof s.planId==='undefined')s.planId=null;
   if(!s.planName)s.planName='Freies Training';
   s.exercises.forEach(ex=>{
     if(isCardioExercise(ex.id)){
       if(!ex.cardio)ex.cardio={duration:'',distance:'',calories:'',recordedAt:null,completed:false};
       else if(typeof ex.cardio.completed!=='boolean')ex.cardio.completed=cardioValid(ex);
       if(!Array.isArray(ex.sets))ex.sets=[];
     }else if(!Array.isArray(ex.sets)||!ex.sets.length)ex.sets=[{id:uid(),kg:'',reps:''}];
   });
 });
 return obj;
}
function completedSessions(){return (data?.sessions||[]).filter(s=>s.exercises.some(entryCompleted)).sort((a,b)=>a.date.localeCompare(b.date));}
function trainingSummary(){
 const sessions=completedSessions();
 const exercises=allEntries().filter(x=>!isCardioExercise(x.ex));
 const cardio=allCardioEntries();
 return {
  trainingDays:sessions.length,
  strengthDays:sessions.filter(s=>s.exercises.some(e=>!isCardioExercise(e)&&entryCompleted(e))).length,
  cardioDays:sessions.filter(s=>s.exercises.some(e=>isCardioExercise(e)&&entryCompleted(e))).length,
  strengthSets:exercises.reduce((a,x)=>a+exSetCount(x.ex),0),
  volume:exercises.reduce((a,x)=>a+exVolume(x.ex),0),
  cardioMinutes:cardio.reduce((a,x)=>a+cardioDuration(x.ex),0),
  cardioKm:cardio.reduce((a,x)=>a+cardioDistance(x.ex),0),
  cardioKcal:cardio.reduce((a,x)=>a+cardioCalories(x.ex),0),
  cardioUnits:cardio.length
 };
}
function loadTimerState(){
 const defaults={expanded:false,running:false,mode:'single',single:90,cycleA:60,cycleB:30,active:'A',remainingMs:90000,endAt:null,flashUntil:0,ended:false};
 try{const raw=JSON.parse(localStorage.getItem(TIMER_STORE)||'null');return {...defaults,...(raw||{})};}catch{return defaults;}
}
function saveTimerState(){localStorage.setItem(TIMER_STORE,JSON.stringify(timerState));}
function timerCurrentDuration(){return (timerState.mode==='cycle'?(timerState.active==='A'?timerState.cycleA:timerState.cycleB):timerState.single)*1000;}
function timerRemainingMs(){return timerState.running?Math.max(0,Number(timerState.endAt||0)-Date.now()):Math.max(0,Number(timerState.remainingMs??timerCurrentDuration()));}
function formatTimer(ms){const total=Math.ceil(ms/1000),m=String(Math.floor(total/60)).padStart(2,'0'),ss=String(total%60).padStart(2,'0');return `${m}:${ss}`;}
function ensureTimerReady(){if(!timerTicker)timerTicker=setInterval(timerTick,250);timerTick();}
function timerTick(){
 if(timerState.running&&timerRemainingMs()<=0){
   timerState.flashUntil=Date.now()+1400;
   if(timerState.mode==='cycle'){
     timerState.active=timerState.active==='A'?'B':'A';
     timerState.remainingMs=timerCurrentDuration();
     timerState.endAt=Date.now()+timerState.remainingMs;
     timerState.ended=false;
   }else{
     timerState.running=false;
     timerState.endAt=null;
     timerState.remainingMs=0;
     timerState.ended=true;
   }
   saveTimerState();
 }
 updateTimerUI();
}
function startPauseTimer(){
 ensureTimerReady();
 if(timerState.running){timerState.remainingMs=timerRemainingMs();timerState.running=false;timerState.endAt=null;timerState.ended=false;}
 else{if(timerState.ended||timerRemainingMs()<=0)timerState.remainingMs=timerCurrentDuration();timerState.running=true;timerState.endAt=Date.now()+timerState.remainingMs;timerState.ended=false;}
 timerState.flashUntil=0;saveTimerState();updateTimerUI();
}
function repeatTimer(){
 // Wiederholen funktioniert direkt in der minimierten Anzeige, ohne Öffnen des Panels.
 if(timerState.mode==='cycle')timerState.active='A';
 timerState.remainingMs=timerCurrentDuration();timerState.running=true;timerState.endAt=Date.now()+timerState.remainingMs;
 timerState.ended=false;timerState.flashUntil=0;saveTimerState();updateTimerUI();
}
function resetTimer(){timerState.running=false;timerState.endAt=null;timerState.remainingMs=timerCurrentDuration();timerState.ended=false;timerState.flashUntil=0;saveTimerState();updateTimerUI();}
function setSinglePreset(sec){
 timerState.single=sec;
 if(timerState.mode==='single'){timerState.running=false;timerState.endAt=null;timerState.remainingMs=sec*1000;timerState.ended=false;timerState.flashUntil=0;}
 saveTimerState();updateTimerUI();
}
function toggleTimerMode(enabled){timerState.mode=enabled?'cycle':'single';timerState.active='A';timerState.running=false;timerState.endAt=null;timerState.remainingMs=timerCurrentDuration();timerState.ended=false;timerState.flashUntil=0;saveTimerState();render();}
function renderTimerDock(){
 const remaining=formatTimer(timerRemainingMs());
 const showRepeat=timerState.mode==='single'&&timerState.ended;
 return `<div class="timer-dock ${timerState.expanded?'open':''} ${Date.now()<(timerState.flashUntil||0)?'done':''}" id="timer-dock">
 <div class="timer-compact"><button class="timer-toggle" data-action="toggle-timer-panel" id="timer-mini" aria-label="Timer öffnen"><span>TIMER</span><strong>${remaining}</strong></button><button class="timer-repeat-mini" id="timer-repeat-mini" data-action="timer-repeat" ${showRepeat?'':'hidden'} aria-label="Timer ${timerState.single} Sekunden erneut starten">Wiederholen</button></div>
 <div class="timer-panel"><div class="row between"><div><strong>Pausen-Timer</strong><div class="small muted" id="timer-meta">${timerState.mode==='cycle'?`Zirkel ${timerState.cycleA}s ↔ ${timerState.cycleB}s`:`${timerState.single}s Standard`}</div></div><button class="btn btn-small btn-ghost" data-action="toggle-timer-panel" aria-label="Timer verkleinern">×</button></div>
 <div class="timer-big" id="timer-big">${remaining}</div>
 <div class="timer-presets">${TIMER_PRESETS.map(sec=>`<button class="chip ${(timerState.mode==='single'&&timerState.single===sec)?'active':''}" data-action="timer-preset" data-seconds="${sec}">${sec}s</button>`).join('')}</div>
 <label class="timer-check"><input type="checkbox" id="timer-cycle-enabled" ${timerState.mode==='cycle'?'checked':''}> Zirkelmodus</label>
 <div class="timer-cycle-row"><select class="input" id="timer-cycle-a">${TIMER_PRESETS.map(sec=>`<option value="${sec}" ${timerState.cycleA===sec?'selected':''}>${sec} s</option>`).join('')}</select><span>↔</span><select class="input" id="timer-cycle-b">${TIMER_PRESETS.map(sec=>`<option value="${sec}" ${timerState.cycleB===sec?'selected':''}>${sec} s</option>`).join('')}</select></div>
 <div class="btn-wrap"><button class="btn btn-primary grow" data-action="timer-startpause">${timerState.running?'Pause':'Start'}</button><button class="btn grow" data-action="timer-reset">Reset</button></div>
 </div></div>`;
}
function updateTimerUI(){
 const dock=el('timer-dock');if(!dock)return;
 const remaining=formatTimer(timerRemainingMs());
 const mini=el('timer-mini'),big=el('timer-big'),meta=el('timer-meta'),repeat=el('timer-repeat-mini');
 if(mini){const label=mini.querySelector('strong');if(label)label.textContent=remaining;}
 if(big)big.textContent=remaining;
 if(meta)meta.textContent=timerState.mode==='cycle'?`Zirkel ${timerState.cycleA}s ↔ ${timerState.cycleB}s${timerState.running?` · aktiv: ${timerState.active}`:''}`:`${timerState.single}s Standard`;
 const start=dock.querySelector('[data-action="timer-startpause"]');if(start)start.textContent=timerState.running?'Pause':'Start';
 if(repeat){repeat.hidden=!(timerState.mode==='single'&&timerState.ended);repeat.setAttribute('aria-label',`Timer ${timerState.single} Sekunden erneut starten`);}
 dock.classList.toggle('done',Date.now()<(timerState.flashUntil||0));
 dock.classList.toggle('timer-ended',timerState.mode==='single'&&timerState.ended);
}

/* Die Übungsbilder sind eigenständig gezeichnete schematische SVG-Illustrationen. */
function art(type){
 // Untrusted illustration IDs from imported profiles cannot enter SVG attributes.
 type=(typeof type==='string'&&/^[a-z]{1,30}$/.test(type))?type:'chest';
 const H='#d8b08c',M='#9a7a62',G='#6b5649';
 const line=(path,c=H,w=5)=>`<path d="${path}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const dot=(x,y,r=8)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${H}"/>`;
 const bar=(x,y,w,h=4,c=M)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/>`;
 let z='';
 switch(type){
  case 'lat':z=bar(33,19,105,5)+line('M86 22V33',M,2)+line('M65 23L68 37L78 49 M108 23L103 37L90 49')+dot(84,46,9)+line('M84 55V78 M84 68L70 84 M84 68L99 84')+bar(61,83,47,5)+line('M121 20V102 M117 102H132',G,4)+bar(120,65,14,29,G);break;
  case 'fly':z=dot(85,36)+line('M85 46V79 M85 52L51 46L36 65 M85 52L120 46L135 65 M85 79L70 92 M85 79L100 92')+line('M24 29V95 M146 29V95 M24 29H37 M133 29H146',G,4)+bar(69,93,35,5)+bar(27,59,12,13)+bar(131,59,12,13);break;
  case 'chest':z=dot(70,33)+line('M70 43V79 M70 53L92 53L116 43 M70 57L92 68L120 69 M70 79L58 94 M70 79L84 94')+line('M47 29V100 M47 29H57 M49 76H76 M47 100H104',G,4)+bar(115,38,9,36)+bar(82,72,20,6,M);break;
  case 'bench':z=dot(64,55)+line('M73 57L117 61 M86 60L74 76 M103 60L112 79 M87 57L86 36 M103 57L108 37')+bar(59,64,78,6,G)+line('M78 70L70 97 M118 70L126 97',M,4)+bar(74,27,43,5)+bar(67,23,8,12)+bar(118,23,8,12);break;
  case 'row':z=dot(61,37)+line('M61 47L70 72L83 79 M64 51L91 52L110 50 M70 72L47 91 M83 79L107 95')+bar(45,75,30,6,G)+line('M40 76V98 M119 20V95',G,4)+bar(118,45,19,6)+line('M112 49L125 49',M,3);break;
  case 'pull':z=bar(40,15,92,6)+dot(86,38)+line('M86 48V73 M86 50L56 27 M86 50L112 27 M86 73L71 93 M86 73L103 91')+line('M45 17V28 M126 17V28',M,3);break;
  case 'overhead':z=dot(84,41)+line('M84 51V80 M84 56L64 45L57 22 M84 56L104 45L111 22 M84 80L70 97 M84 80L100 97')+bar(42,15,29,7)+bar(100,15,29,7)+bar(65,94,37,5,G);break;
  case 'lateral':z=dot(84,38)+line('M84 48V79 M84 55L50 45L33 33 M84 55L118 45L136 33 M84 79L70 99 M84 79L97 99')+bar(18,27,23,8)+bar(127,27,23,8);break;
  case 'legpress':z=dot(48,45)+line('M55 50L77 64L91 78 M58 49L83 55 M77 65L112 50L126 34 M91 78L124 68L138 49')+line('M26 36L43 56L72 76 M26 36L16 46 M29 84H92',G,5)+line('M137 17L154 36L140 50',M,7)+bar(126,25,20,5);break;
  case 'legextension':z=dot(59,32)+line('M59 42V72 M59 72L89 77L124 67 M59 55L87 55 M59 72L39 92')+bar(43,72,48,6,G)+line('M44 78V98 M106 78V99',G,4)+bar(120,61,9,18);break;
  case 'legcurl':z=dot(60,34)+line('M60 44V75 M60 75L94 80L102 99 M60 58L85 58 M60 75L44 93')+bar(39,73,43,7,G)+line('M45 81V101 M100 82V101',G,4)+bar(90,91,28,7);break;
  case 'squat':z=dot(83,38)+line('M83 48L75 65L91 77 M79 52L58 47 M79 52L105 48 M75 65L59 81L64 99 M91 77L108 86L118 100')+bar(40,32,90,6)+bar(32,28,9,13)+bar(130,28,9,13);break;
  case 'hinge':z=dot(105,42)+line('M101 52L70 67L81 84 M70 67L48 80 M70 67L93 81 M81 84L70 101 M81 84L106 98')+bar(38,86,92,6)+bar(27,81,12,17)+bar(129,81,12,17);break;
  case 'hip':z=dot(85,34)+line('M85 44V74 M85 51L67 66 M85 51L103 66 M85 74L51 88L40 78 M85 74L116 88L130 78')+bar(65,72,41,8,G)+line('M69 77L61 100 M101 77L109 100',G,4)+bar(28,72,20,6)+bar(124,72,20,6);break;
  case 'calves':z=dot(83,30)+line('M83 40V73 M83 44L67 62 M83 44L100 62 M83 73L72 94 M83 73L96 94')+bar(53,99,68,5,G)+bar(75,92,39,5)+line('M51 40V98 M120 40V98',G,4);break;
  case 'abs':z=dot(77,35)+line('M77 45L92 65L100 79 M87 55L63 63 M92 65L72 80 M100 79L116 94')+bar(65,77,50,6,G)+line('M73 82L66 100 M107 82L117 100',G,4)+bar(52,53,20,5,M);break;
  case 'curl':z=dot(84,33)+line('M84 43V79 M84 50L64 68L57 53 M84 50L104 68L111 53 M84 79L69 99 M84 79L100 99')+bar(41,46,27,7)+bar(101,46,27,7);break;
  case 'cable':z=dot(89,34)+line('M89 44V77 M89 50L108 61L124 48 M89 50L70 62L55 54 M89 77L72 98 M89 77L107 98')+line('M27 19V103 M25 19H52 M25 39L53 55',M,4)+bar(20,70,13,24,G)+bar(117,41,11,14);break;
  default:z=dot(83,35)+line('M83 45V79 M83 49L60 70 M83 49L105 70 M83 79L67 98 M83 79L101 98');
 }
 return `<svg viewBox="0 0 170 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematische Übungsillustration" focusable="false"><defs><linearGradient id="b${type}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5b4334"/><stop offset="1" stop-color="#2e221b"/></linearGradient></defs><rect width="170" height="120" rx="11" fill="url(#b${type})"/><circle cx="139" cy="21" r="57" fill="#f5dcc5" opacity=".06"/><path d="M13 104H157" stroke="#7e6756" stroke-width="1" stroke-dasharray="5 5"/>${z}</svg>`;
}
function artBox(ex,small=false){return `<div class="ex-art ${small?'mini':''}">${art(ex.art)}</div>`;}
function svgIcon(name){const paths={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',exercise:'<path d="M5 8v8M8 6v12M16 6v12M19 8v8M8 12h8"/>',plans:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',stats:'<path d="M4 20V4M4 20h17M7 16l4-5 3 2 6-8"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 20c0-5 3-7 8-7s8 2 8 7"/>'};return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.home}</svg>`;}

function render(){el('app').innerHTML=!currentId?renderAuth():renderShell();renderModal();requestAnimationFrame(()=>{updateTimerUI();});}
function isLinked(){const rec=accounts.find(a=>a.id===currentId);return !!(rec?.cloudUid && KraftlogCloud.loggedIn() && rec.cloudUid===KraftlogCloud.uid());}
function setCloudStatus(message){cloudStatus=message;const target=el('cloud-status');if(target)target.textContent=message;}
function cloudMessage(){
 if(!KraftlogCloud.enabled())return 'Noch nicht eingerichtet – siehe README: Firebase-Einrichtung.';
 if(cloudConflict)return 'Konflikt: Cloud und Gerät wurden unterschiedlich geändert. Bitte unten entscheiden.';
 if(!isLinked())return 'Noch nicht mit einem Online-Konto verbunden.';
 return cloudStatus;
}
function cloudForms(){
 if(!KraftlogCloud.enabled())return `<div class="notice warning">Die Cloud ist noch nicht aktiviert. Trage zuerst die Firebase-Werte in <code>cloud-config.js</code> ein (Anleitung in README.md). Bis dahin bleiben deine bisherigen Daten unverändert auf diesem Handy.</div>`;
 const rec=accounts.find(a=>a.id===currentId);
 return `<div class="card stack"><div class="row"><div class="grow"><strong>Automatisch online speichern</strong><p class="intro" style="margin:4px 0 0">Jeder Nutzer bekommt ein eigenes kostenloses Online-Konto. Die Trainingsdaten werden vor dem Hochladen verschlüsselt.</p></div></div>
 <p class="small muted" id="cloud-status" role="status">${escapeHTML(cloudMessage())}</p>
 ${isLinked()?`<p class="intro">Verbunden als <strong>${escapeHTML(KraftlogCloud.email())}</strong>. Deine Änderungen werden bei Internetverbindung automatisch übertragen.</p><div class="btn-wrap"><button class="btn btn-primary grow" data-action="cloud-sync">Jetzt synchronisieren</button><button class="btn btn-ghost" data-action="cloud-logout">Online abmelden</button></div>`:
 `<form id="cloud-link-form" class="stack"><div class="field"><label for="cloud-email">Deine E-Mail</label><input class="input" id="cloud-email" name="email" type="email" required autocomplete="email" placeholder="du@beispiel.de"></div><div class="field"><label for="cloud-password">Online-Passwort (mind. 8 Zeichen)</label><input class="input" id="cloud-password" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="btn-wrap"><button class="btn btn-primary grow" type="submit" name="mode" value="register">Cloud-Konto erstellen</button><button class="btn grow" type="submit" name="mode" value="login">Mit Online-Konto verbinden</button></div><p class="small muted">Dein vorhandenes lokales Profil bleibt erhalten. Beim ersten Verbinden wird es in die Cloud übernommen, wenn dort noch keine Trainingsdaten liegen.</p></form>`}
 ${cloudConflict?`<div class="notice warning"><strong>Änderungen auf zwei Geräten erkannt.</strong><p>Automatisches Überschreiben ist gestoppt. Entscheide, welche Version behalten werden soll.</p><div class="stack"><button class="btn btn-secondary btn-block" data-action="cloud-use-remote">Cloud-Version übernehmen (lokale Änderungen verwerfen)</button><button class="btn btn-red btn-block" data-action="cloud-use-local">Geräte-Version übernehmen (Cloud-Änderungen verwerfen)</button></div></div>`:''}
 </div>`;
}
function renderAuth(){const newMode=authMode==='new'||!accounts.length;return `<main class="auth-layout"><div class="brand"><div class="mark">K</div><div><h1 style="font-size:19px;margin:0;letter-spacing:1px">KRAFTLOG</h1><small>DEIN TRAINING. DEINE DATEN.</small></div></div><h1>Stärker. Satz für Satz.</h1><p class="muted">Trainingspläne, Gewichte und Fortschritte – lokal verschlüsselt, auf Wunsch mit kostenloser Cloud-Synchronisierung.</p><section class="card auth-card"><h2>${newMode?'Dein privates Profil':'Profil entsperren'}</h2><p>${newMode?'Du legst ein verschlüsseltes Profil nur für dieses Gerät an.':'Deine Trainingsdaten sind auf diesem Gerät verschlüsselt gespeichert. Bei aktivierter Cloud werden sie zusätzlich online gesichert.'}</p><form id="auth-form" autocomplete="off">${newMode?`<div class="field"><label for="reg-name">Profilname</label><input required class="input" id="reg-name" name="name" maxlength="40" placeholder="z. B. Alex" autocomplete="nickname"></div>`:`<div class="field"><label for="login-profile">Profil auswählen</label><select class="input" id="login-profile" name="profile">${accounts.map(a=>`<option value="${escapeHTML(a.id)}">${escapeHTML(a.name)}</option>`).join('')}</select></div>`}<div class="field"><label for="auth-passwort">${newMode?'Passwort festlegen (mind. 12 Zeichen)':'Passwort'}</label><input required type="password" class="input" id="auth-passwort" name="password" minlength="${newMode?'12':'8'}" autocomplete="${newMode?'new-password':'current-password'}" placeholder="Dein Passwort"></div>${newMode?`<div class="field"><label for="auth-confirm">Passwort wiederholen</label><input required type="password" class="input" id="auth-confirm" name="confirm" minlength="8" autocomplete="new-password" placeholder="Passwort wiederholen"></div>`:''}<button type="submit" class="btn btn-primary btn-block">${newMode?'Profil erstellen':'Profil öffnen'} →</button></form>${accounts.length?`<button type="button" class="btn btn-ghost btn-block" style="margin-top:10px" data-action="auth-mode">${newMode?'Vorhandenes Profil öffnen':'Neues Profil auf diesem Gerät erstellen'}</button>`:''}<button type="button" class="btn btn-ghost btn-block" style="margin-top:10px" data-action="import-backup">Verschlüsseltes Backup importieren</button><div class="auth-bubble">Dein Passwort verschlüsselt deine Trainingsdaten. Auch bei Cloud-Nutzung brauchst du es zum Entsperren. Ohne Cloud bleiben die Daten nur auf diesem Gerät.</div></section>${KraftlogCloud.enabled()?`<section class="card auth-card" style="margin-top:16px"><h2>Online-Profil wiederherstellen</h2><p>Neues Handy? Mit deinem Online-Konto den verschlüsselten Trainingsstand laden. Danach mit deinem bisherigen Profilpasswort entsperren.</p><form id="cloud-restore-form" class="stack"><div class="field"><label for="restore-email">E-Mail</label><input id="restore-email" name="email" class="input" type="email" required autocomplete="email"></div><div class="field"><label for="restore-password">Online-Passwort</label><input id="restore-password" name="password" class="input" type="password" minlength="8" required autocomplete="current-password"></div><button type="submit" class="btn btn-secondary btn-block">Online-Profil laden</button></form></section>`:''}<div class="auth-footer">Inoffizielles privates Trainingstagebuch · Kein Produkt von FitX</div></main>`;}
function renderShell(){
 const tabs=[['today','Training','home'],['library','Übungen','exercise'],['plans','Pläne','plans'],['stats','Verlauf','stats'],['profile','Profil','user']];
 return `<main class="app-shell"><header class="header"><div class="brand"><div class="mark">K</div><div><h1>KRAFTLOG</h1><small>DEIN TRAINING. DEINE DATEN.</small></div></div><button class="profile-chip" data-action="switch-tab" data-tab="profile" aria-label="Profil öffnen"><span class="avatar">${escapeHTML((accounts.find(a=>a.id===currentId)?.name||'?').slice(0,1).toUpperCase())}</span><span class="truncate">${escapeHTML(accounts.find(a=>a.id===currentId)?.name)}</span></button></header>${activeTab==='today'?renderToday():activeTab==='library'?renderLibrary():activeTab==='plans'?renderPlans():activeTab==='stats'?renderStats():renderProfile()}<p class="footer-note">KRAFTLOG · privat & kostenlos · keine Verbindung zu FitX</p></main><nav class="bottomnav" aria-label="Hauptmenü">${tabs.map(([id,name,ico])=>`<button class="nav-button ${activeTab===id?'active':''}" data-action="switch-tab" data-tab="${id}" ${activeTab===id?'aria-current="page"':''}>${svgIcon(ico)}<span>${name}</span></button>`).join('')}</nav>${renderTimerDock()}`;
}
function renderDateBar(){return `<div class="card date-bar"><div class="date-label">${escapeHTML(longDate(selectedDate))}</div><button class="btn btn-small btn-icon" data-action="shift-date" data-days="-1" aria-label="Vorheriger Tag">‹</button><input class="input input-sm input-date" type="date" id="training-date" value="${selectedDate}" aria-label="Trainingstag wählen"><button class="btn btn-small btn-icon" data-action="shift-date" data-days="1" aria-label="Nächster Tag">›</button><button class="btn btn-small" data-action="today-date">Heute</button></div>`;}

function renderToday(){
 const s=session(),entries=s?s.exercises:[];
 return `${renderDateBar()}<div class="training-toolbar"><div><h2>Dein Training</h2><p class="training-plan-subtitle">${s?escapeHTML(s.planName):'Noch kein Plan ausgewählt'}</p></div><div class="btn-wrap"><button class="btn btn-primary" data-action="open-plan-picker">Plan wählen</button><button class="btn" data-action="switch-tab" data-tab="library">Übung hinzufügen</button></div></div>
 ${entries.length?`<div class="stack training-exercises">${entries.map(e=>renderSessionExercise(e)).join('')}</div>`:`<div class="empty"><strong>Noch keine Übungen für diesen Tag</strong><p>Wähle einen Plan oder füge Kraft- und Cardio-Übungen hinzu.</p><button class="btn btn-secondary" data-action="open-plan-picker">Plan auswählen</button></div>`}${renderRecentDates()}`;
}
function renderCardioExercise(e){
 const ex=getEx(e.id),c=cardioShape(e),previous=priorExercise(e.id),last=previous?.ex?.cardio||null;
 const lastLine=last?`${fmt(last.duration)} min · ${fmt(last.distance)} km · ${fmt(last.calories)} kcal · Pace ${cardioPaceText(previous.ex)} min/km`:'Noch kein früherer Eintrag';
 return `<article class="card exercise-card cardio-card"><div class="ex-head">${artBox(ex)}<div class="ex-info"><h3>${escapeHTML(ex.name)}</h3><p>${escapeHTML(ex.group)} · ${escapeHTML(ex.equipment)}</p><p class="ex-date">${previous?'Letzte Einheit: '+shortDate(previous.date):'Noch kein früherer Eintrag'}</p></div><button class="btn btn-icon btn-small btn-ghost" data-action="remove-ex" data-ex="${escapeHTML(ex.id)}" aria-label="Eintrag entfernen">×</button></div><div class="ex-detail">
 ${previous?`<div class="ex-history"><strong>Zuletzt · ${shortDate(previous.date)}:</strong> ${lastLine}</div><div class="prior-control"><button type="button" class="btn btn-secondary btn-small btn-block" data-action="copy-prior-cardio" data-ex="${escapeHTML(e.id)}">Fehlende letzte Werte übernehmen</button></div>`:''}
 <div class="sets-table cardio-grid">${['duration','distance','calories'].map((field,index)=>{const info=[['DAUER','Minuten','z. B. 30'],['DISTANZ','Kilometer','z. B. 4,5'],['KALORIEN','kcal','optional']][index];return `<div class="set-col"><label for="cardio-${field}-${escapeHTML(ex.id)}">${info[0]}</label><input id="cardio-${field}-${escapeHTML(ex.id)}" class="input input-sm" type="text" inputmode="decimal" autocomplete="off" aria-label="${info[1]}" placeholder="${info[2]}" data-cardio-field="${field}" data-ex="${escapeHTML(ex.id)}" value="${escapeHTML(c[field]??'')}">${last?`<div class="cardio-field-suggestion">${hasCardioField(last[field])?`<button type="button" class="cardio-suggest" data-action="copy-prior-cardio-field" data-ex="${escapeHTML(ex.id)}" data-field="${field}">Zuletzt ${fmt(last[field])} ${['min','km','kcal'][index]}</button>`:''}</div>`:''}</div>`;}).join('')}</div>
 <div class="cardio-metrics"><div><span>PACE</span><strong id="cardio-pace-${escapeHTML(ex.id)}">${cardioPaceText(e)}</strong><small>min/km</small></div><div><span>Ø TEMPO</span><strong id="cardio-speed-${escapeHTML(ex.id)}">${cardioSpeedText(e)}</strong><small>km/h</small></div></div>
 <div class="ex-foot cardio-footer"><span class="small muted">Eintrag: <strong id="cardio-summary-${escapeHTML(ex.id)}">${fmt(cardioDuration(e))} min · ${fmt(cardioDistance(e))} km · ${fmt(cardioCalories(e))} kcal</strong><br><span id="cardio-save-${escapeHTML(ex.id)}" role="status">Lokal gespeichert</span></span></div>
 <div class="cardio-completion"><div class="small muted" id="cardio-state-${escapeHTML(ex.id)}">${entryCompleted(e)?'Abgeschlossen · automatisch gespeichert':'Entwurf · automatisch gespeichert'}</div><button type="button" class="btn ${entryCompleted(e)?'btn-secondary':'btn-primary'} btn-block" data-action="finish-cardio" data-ex="${escapeHTML(ex.id)}">${entryCompleted(e)?'Cardio-Einheit aktualisieren':'Cardio-Einheit abschließen'}</button><p class="small muted">Deine Eingaben werden automatisch gespeichert. Erst mit „Cardio-Einheit abschließen“ erscheint sie im Verlauf. Dauer ist erforderlich; Strecke und Kalorien sind optional.</p></div>
 </div></article>`;
}
function renderSetRow(e,set,index,priorSets){
 const old=priorSets[index],done=validSet(set),name=escapeHTML(getEx(e.id).name);
 const copyField=(field,unit)=>old?`<button type="button" class="set-suggestion" data-action="copy-prior-field" data-ex="${escapeHTML(e.id)}" data-index="${index}" data-field="${field}" title="Letzten Wert einsetzen: ${fmt(old[field])} ${unit}" aria-label="${name}, Satz ${index+1}: ${fmt(old[field])} ${unit} vom letzten Training übernehmen">↳ ${fmt(old[field])} ${unit}</button>`:'<span class="set-no-suggestion" aria-hidden="true"></span>';
 return `<div class="set-row ${done?'set-row-done':''}" data-set-row="${escapeHTML(set.id)}">
 <span class="set-num">${index+1}</span>
 <div class="set-col"><label for="kg-${escapeHTML(set.id)}">GEWICHT (KG)</label><input id="kg-${escapeHTML(set.id)}" class="input input-sm ${old&&!hasSetField(set.kg)?'input-has-suggestion':''}" type="number" inputmode="decimal" min="0" max="9999" step="0.5" placeholder="${old?fmt(old.kg):'kg'}" data-set-field="kg" data-ex="${escapeHTML(e.id)}" data-set="${escapeHTML(set.id)}" value="${escapeHTML(set.kg)}" aria-label="Gewicht für Satz ${index+1}${old?'; zuletzt '+fmt(old.kg)+' kg':''}">${copyField('kg','kg')}</div>
 <div class="set-col"><label for="reps-${escapeHTML(set.id)}">WIEDERHOLUNGEN</label><input id="reps-${escapeHTML(set.id)}" class="input input-sm ${old&&!hasSetField(set.reps)?'input-has-suggestion':''}" type="number" inputmode="numeric" min="1" max="9999" step="1" placeholder="${old?fmt(old.reps):'Wdh.'}" data-set-field="reps" data-ex="${escapeHTML(e.id)}" data-set="${escapeHTML(set.id)}" value="${escapeHTML(set.reps)}" aria-label="Wiederholungen für Satz ${index+1}${old?'; zuletzt '+fmt(old.reps):''}">${copyField('reps','Wdh.')}</div>
 <div class="set-row-actions">${done?`<span class="set-done" title="Satz erfasst" aria-label="Satz ${index+1} erfasst">✓</span>`:old?`<button class="set-accept" type="button" data-action="copy-prior-set" data-ex="${escapeHTML(e.id)}" data-index="${index}" title="Fehlende Werte aus dem letzten Satz übernehmen" aria-label="Satz ${index+1} vom letzten Training übernehmen">✓</button>`:'<span class="set-action-spacer" aria-hidden="true"></span>'}<button class="btn btn-small btn-ghost set-remove" data-action="remove-set" data-ex="${escapeHTML(e.id)}" data-set="${escapeHTML(set.id)}" aria-label="Satz ${index+1} löschen" title="Satz löschen">×</button></div>
 </div>`;
}

function renderSessionExercise(e){
 if(isCardioExercise(e))return renderCardioExercise(e);
 const ex=getEx(e.id),previous=priorExercise(e.id),priorSets=previous?previous.ex.sets.filter(validSet):[],volume=exVolume(e),n=exSetCount(e);
 return `<article class="card exercise-card"><div class="ex-head">${artBox(ex)}<div class="ex-info"><h3>${escapeHTML(ex.name)}</h3><p>${escapeHTML(ex.group)} · ${escapeHTML(ex.equipment)}</p><p class="ex-date">${previous?'Letztes Training: '+shortDate(previous.date):'Noch kein früherer Eintrag'}</p></div><button class="btn btn-icon btn-small btn-ghost" aria-label="Übung entfernen" title="Übung entfernen" data-action="remove-ex" data-ex="${escapeHTML(ex.id)}">×</button></div><div class="ex-detail">${previous?`<div class="ex-history"><strong>Zuletzt · ${shortDate(previous.date)}:</strong> ${priorSets.map(s=>`${fmt(s.kg)} kg × ${fmt(s.reps)}`).join(' · ')}<br><span>Volumen: ${fmt(exVolume(previous.ex))} kg</span></div><div class="prior-control"><p>Die vorgeschlagenen Werte werden erst nach deiner Übernahme gespeichert.</p><button type="button" class="btn btn-secondary btn-small btn-block" data-action="copy-prior-all" data-ex="${escapeHTML(e.id)}">Alle letzten Sätze übernehmen</button></div>`:''}<div class="sets-table">${e.sets.map((s,i)=>renderSetRow(e,s,i,priorSets)).join('')}</div><div class="ex-foot"><button class="btn btn-small" data-action="add-set" data-ex="${escapeHTML(ex.id)}">Satz hinzufügen</button><span class="small muted">Volumen: <strong class="vol" id="volume-${escapeHTML(ex.id)}">${fmt(volume)} kg</strong> · <span id="setcount-${escapeHTML(ex.id)}">${n}</span> Sätze</span></div></div></article>`;
}

function renderFilters(active){return `<div class="filters">${GROUPS.map(g=>`<button class="chip ${g===active?'active':''}" data-action="filter-group" data-group="${g}">${g}</button>`).join('')}</div>`;}

function renderLibrary(){
 const s=session(),selected=new Set(s?.exercises.map(e=>e.id)||[]),exs=allExercises().filter(ex=>(libraryGroup==='Alle'||ex.group===libraryGroup)&&(ex.name+' '+ex.equipment).toLowerCase().includes(libraryQuery.toLowerCase()));
 return `<div class="section-header"><div><h2>Übungen</h2><div class="intro">Füge Kraft- oder Cardio-Übungen für ${shortDate(selectedDate)} hinzu.</div></div></div><div class="library-tools"><input class="input" id="library-search" value="${escapeHTML(libraryQuery)}" placeholder="Übung suchen, z. B. Latzug oder Laufband" autocomplete="off">${renderFilters(libraryGroup)}</div><div class="exercise-grid" id="library-results">${exs.map(ex=>`<article class="library-card"><button class="library-art" type="button" data-action="exercise-info" data-ex="${escapeHTML(ex.id)}" aria-label="Bild und Erklärung: ${escapeHTML(ex.name)}">${art(ex.art)}</button><div><h3>${escapeHTML(ex.name)}</h3><p>${escapeHTML(ex.group)} · ${escapeHTML(ex.equipment)}${isCardioExercise(ex)?' · Cardio':''}</p></div><button class="btn btn-small ${selected.has(ex.id)?'btn-secondary':'btn-primary'} btn-block" data-action="toggle-exercise" data-ex="${escapeHTML(ex.id)}">${selected.has(ex.id)?'Ausgewählt':'Hinzufügen'}</button></article>`).join('')}</div>${!exs.length?`<div class="empty">Keine passende Übung gefunden.</div>`:''}<div class="section-header"><h3>Eigene Übung fehlt?</h3></div><button class="btn btn-ghost btn-block" data-action="new-exercise">Eigene Übung anlegen</button><div class="notice">Die Illustrationen wurden an den neuen braunen Farbstil angepasst und dienen als Orientierung.</div>`;
}



function renderRecentDates(){
 const dates=data.sessions.filter(s=>s.exercises.some(entryCompleted)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 if(!dates.length)return '';
 return `<div class="section-header"><h3>Letzte Trainingstage</h3></div><div class="card stack">${dates.map(s=>{const vol=s.exercises.reduce((sum,e)=>sum+(isCardioExercise(e)?0:exVolume(e)),0),cardio=s.exercises.reduce((sum,e)=>sum+(entryCompleted(e)?cardioDuration(e):0),0);return `<button class="btn btn-ghost" style="justify-content:space-between" data-action="jump-date" data-date="${s.date}"><span>${shortDate(s.date)} · ${escapeHTML(s.planName||'Freies Training')}</span><span class="accent">${vol?fmt(vol)+' kg':''}${vol&&cardio?' · ':''}${cardio?fmt(cardio)+' min':''}</span></button>`;}).join('')}</div>`;
}
function renderPlans(){return `<div class="section-header"><div><h2>Deine Trainingspläne</h2><p class="intro">Erstelle Pläne oder passe die Vorschläge an. Vor jedem Training kannst du Übungen an- und abwählen.</p></div></div><div class="stack">${data.plans.map(p=>`<article class="card plan-card"><div class="plan-art"></div><h3>${escapeHTML(p.name)}</h3><p>${p.exerciseIds.length} Einträge</p><div class="chiplist">${p.exerciseIds.slice(0,7).map(id=>`<span>${escapeHTML(getEx(id).name)}</span>`).join('')}${p.exerciseIds.length>7?`<span>+${p.exerciseIds.length-7}</span>`:''}</div><div class="btn-wrap"><button class="btn btn-primary btn-small" data-action="start-plan" data-plan="${escapeHTML(p.id)}">Für ${shortDate(selectedDate)} verwenden</button><button class="btn btn-small" data-action="edit-plan" data-plan="${escapeHTML(p.id)}">Bearbeiten</button></div></article>`).join('')}</div><button class="btn btn-secondary btn-block" style="margin-top:12px" data-action="edit-plan" data-plan="">Eigenen Trainingsplan erstellen</button>`;}
function plotChart(entries,metric){if(!entries.length)return `<div class="empty"><strong>Noch keine Daten</strong><p>Trage Kraftdaten ein, dann erscheint hier dein Fortschritt.</p></div>`;const pts=entries.slice(-14);const W=700,H=244,p={l:52,r:17,t:23,b:44};const vals=pts.map(x=>metric==='volume'?x.volume:x.peak);const max=Math.max(1,...vals);const yMax=Math.ceil(max/Math.pow(10,Math.floor(Math.log10(max)))*1.13)*Math.pow(10,Math.floor(Math.log10(max)));const xAt=i=>p.l+(pts.length===1?(W-p.l-p.r)/2:i*(W-p.l-p.r)/(pts.length-1));const yAt=v=>H-p.b-(v/yMax)*(H-p.t-p.b);const xy=pts.map((x,i)=>[xAt(i),yAt(vals[i])]);const grid=[0,.25,.5,.75,1].map(f=>`<line x1="${p.l}" y1="${yAt(yMax*f)}" x2="${W-p.r}" y2="${yAt(yMax*f)}" stroke="#6b5a4f" stroke-dasharray="4 6"/><text x="${p.l-9}" y="${yAt(yMax*f)+4}" fill="#8e7f71" text-anchor="end" font-size="12">${fmt(yMax*f)}</text>`).join('');const path=xy.map((a,i)=>`${i?'L':'M'}${a[0].toFixed(1)} ${a[1].toFixed(1)}`).join(' ');const area=path+` L${xy.at(-1)[0]} ${H-p.b} L${xy[0][0]} ${H-p.b} Z`;const indices=[0,Math.floor((pts.length-1)/2),pts.length-1].filter((v,i,a)=>a.indexOf(v)===i);return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlaufsdiagramm"><defs><linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b98d68" stop-opacity=".26"/><stop offset="1" stop-color="#b98d68" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#areafill)"/><path d="${path}" fill="none" stroke="#8a6247" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${xy.map((a,i)=>`<circle cx="${a[0]}" cy="${a[1]}" r="5" fill="#8a6247" stroke="#f4ece2" stroke-width="2"/><title>${shortDate(pts[i].date)}: ${fmt(vals[i])} kg</title>`).join('')}${indices.map(i=>`<text x="${xAt(i)}" y="${H-15}" fill="#8e7f71" font-size="12" text-anchor="middle">${shortDate(pts[i].date).slice(0,5)}</text>`).join('')}</svg>`;}
function renderStats(){
 const sum=trainingSummary();
 const used=new Set(allEntries().filter(x=>!isCardioExercise(x.ex)).map(x=>x.ex.id));
 const exercises=allExercises().filter(e=>used.has(e.id));
 if(exercises.length&&!used.has(statExercise))statExercise=exercises[0].id;
 const entries=exercises.length?exerciseEntries(statExercise):[],last=entries.at(-1),cardioEntries=allCardioEntries().slice(-10).reverse();
 return `<div class="section-header stats-heading"><div><h2>Deine Statistik</h2><p class="intro">Deine tatsächlichen Trainingsleistungen auf einen Blick.</p></div></div>
 <div class="stats-grid"><div class="card metric-card"><strong>${sum.trainingDays}</strong><small>Trainingstage</small></div><div class="card metric-card"><strong>${sum.strengthSets}</strong><small>Kraft-Sätze</small></div><div class="card metric-card"><strong>${fmt(sum.volume)} kg</strong><small>Gesamtvolumen</small></div><div class="card metric-card"><strong>${sum.strengthDays}</strong><small>Tage mit Krafttraining</small></div><div class="card metric-card"><strong>${fmt(sum.cardioMinutes)} min</strong><small>Cardio-Dauer</small></div><div class="card metric-card"><strong>${fmt(sum.cardioKm)} km</strong><small>Cardio-Distanz</small></div><div class="card metric-card"><strong>${fmt(sum.cardioKcal)} kcal</strong><small>Erfasste Cardio-Kalorien</small></div><div class="card metric-card"><strong>${sum.cardioDays}</strong><small>Tage mit Cardio</small></div></div>
 <div class="section-header"><h3>Kraftentwicklung</h3></div>
 ${exercises.length?`<div class="card"><div class="row wrap" style="gap:12px"><div class="field grow"><label for="stat-exercise">Übung</label><select id="stat-exercise" class="input">${exercises.map(ex=>`<option value="${escapeHTML(ex.id)}" ${ex.id===statExercise?'selected':''}>${escapeHTML(ex.name)}</option>`).join('')}</select></div><div class="field"><label>Anzeige</label><div class="btn-wrap"><button class="btn btn-small ${statMetric==='volume'?'btn-primary':'btn-ghost'}" data-action="metric" data-metric="volume">Volumen</button><button class="btn btn-small ${statMetric==='peak'?'btn-primary':'btn-ghost'}" data-action="metric" data-metric="peak">Max. Gewicht</button></div></div></div>${plotChart(entries,statMetric)}${last?`<p class="small muted">Letzte Einheit: ${shortDate(last.date)} · ${fmt(last.peak)} kg Maximalgewicht · ${fmt(last.volume)} kg Volumen</p>`:''}</div>`:`<div class="empty"><strong>Noch keine Kraftdaten</strong><p>Erfasse zunächst Gewichte und Wiederholungen.</p></div>`}
 <div class="section-header"><h3>Cardio-Verlauf</h3></div>
 ${cardioEntries.length?`<div class="stack">${cardioEntries.map(x=>`<div class="card cardio-stat-card"><div class="row between"><strong>${shortDate(x.date)} · ${escapeHTML(getEx(x.ex.id).name)}</strong><span class="status-chip">${fmt(cardioDuration(x.ex))} min</span></div><p class="intro" style="margin-top:8px">${fmt(cardioDistance(x.ex))} km · ${fmt(cardioCalories(x.ex))} kcal · Pace ${cardioPaceText(x.ex)} min/km</p></div>`).join('')}</div>`:`<div class="empty"><strong>Noch keine abgeschlossenen Cardio-Einheiten</strong><p>Erfasse Dauer und optional Strecke sowie Kalorien und schließe die Einheit ab.</p></div>`}`;
}
function renderProfile(){
 const rec=accounts.find(a=>a.id===currentId);
 return `<div class="section-header"><div><h2>Profil</h2><p class="intro">Deine Daten und Einstellungen</p></div></div>
 <div class="card stack"><div class="row between"><div><strong>${escapeHTML(rec?.name||'Profil')}</strong><div class="small muted">Privates Trainingsprofil</div></div><span class="avatar" style="width:54px;height:54px">${escapeHTML((rec?.name||'?').slice(0,1).toUpperCase())}</span></div><div class="btn-wrap"><button class="btn btn-secondary grow" data-action="open-change-password">Profilpasswort ändern</button><button class="btn btn-ghost" data-action="lock">Sperren</button></div></div>
 <div class="section-header"><h3>Synchronisierung</h3></div>${cloudForms()}
 <div class="section-header"><h3>Zusätzliche Sicherung</h3></div><div class="card stack"><p class="intro" style="margin:0">Bei aktivierter Cloud werden deine verschlüsselten Änderungen automatisch synchronisiert. Ein gelegentlicher zusätzlicher Export bleibt sinnvoll.</p><button class="btn btn-primary btn-block" data-action="export-backup">Verschlüsseltes Backup herunterladen</button><button class="btn btn-ghost btn-block" data-action="import-backup">Backup als zusätzliches Profil importieren</button><div class="notice warning">Ohne aktive Cloud liegen deine Daten nur auf diesem Gerät. Du brauchst dein Profilpasswort auch nach einem Gerätewechsel zum Entschlüsseln.</div></div>
 <div class="section-header"><h3>Datenschutz und Updates</h3></div><div class="card"><p class="intro">Deine Kraft- und Cardio-Einträge werden lokal mit AES-GCM verschlüsselt gespeichert. Das Update ändert nur den Programmcode; bereits vorhandene Trainingsdaten bleiben erhalten.</p></div>
 <div class="section-header"><h3>Profil von diesem Gerät entfernen</h3></div><button class="btn btn-red btn-block" data-action="delete-profile">Lokales Profil löschen (Cloud bleibt erhalten)</button>`;
}
async function changeProfilePassword(currentPassword,newPassword){
 validatePassword(newPassword,{newPassword:true});
 await flush();
 const rec=accounts.find(a=>a.id===currentId);if(!rec)throw new Error('Profil nicht gefunden');
 const currentKeyCheck=await deriveKey(currentPassword,base64ToBytes(rec.salt),rec.kdfIterations||240000);
 await decryptText(rec,currentKeyCheck);
 const newSalt=crypto.getRandomValues(new Uint8Array(16)),newKey=await deriveKey(newPassword,newSalt,NEW_KDF_ITERATIONS);
 const encrypted=await encryptText(JSON.stringify(data),newKey);
 let previousAuth=KraftlogCloud.authSnapshot();
 if(!previousAuth){try{const sealed=localStorage.getItem(CLOUD_AUTH_ENCRYPTED_STORE+currentId);if(sealed)previousAuth=JSON.parse(await decryptText(JSON.parse(sealed),currentKey));}catch{}}
 rec.salt=bytesToBase64(newSalt);rec.kdfIterations=NEW_KDF_ITERATIONS;rec.iv=encrypted.iv;rec.cipher=encrypted.cipher;rec.updatedAt=new Date().toISOString();
 rec.localRevision=(rec.localRevision||0)+1;
 currentKey=newKey;writeAccounts();
 if(previousAuth&&previousAuth.uid===rec.cloudUid){const enc=await encryptText(JSON.stringify(previousAuth),newKey);localStorage.setItem(CLOUD_AUTH_ENCRYPTED_STORE+currentId,JSON.stringify(enc));}
 if(rec.cloudUid)scheduleCloudSync();
}

function modalMarkup(title,body,foot=''){return `<div class="overlay" id="overlay" role="presentation"><section class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="sheet-head"><h3>${escapeHTML(title)}</h3><button class="btn btn-icon btn-small btn-ghost" data-action="close-modal" aria-label="Schließen">×</button></div><div class="sheet-body">${body}</div>${foot?`<div class="sheet-foot">${foot}</div>`:''}</section></div>`;}
function checklist(ids){const selected=new Set(ids);return `<div class="select-exercises">${allExercises().map(ex=>`<label class="select-ex"><input type="checkbox" data-select-ex="${escapeHTML(ex.id)}" ${selected.has(ex.id)?'checked':''}>${artBox(ex)}<span class="grow"><strong>${escapeHTML(ex.name)}</strong><small>${escapeHTML(ex.group)} · ${escapeHTML(ex.equipment)}</small></span></label>`).join('')}</div>`;}
function renderModal(){const root=el('modal-root');if(!modal){root.innerHTML='';return;}if(modal.type==='choosePlan'){const p=data.plans.find(p=>p.id===modal.planId)||data.plans[0];root.innerHTML=modalMarkup('Trainingsplan wählen',`<div class="field"><label for="choose-plan">Plan</label><select id="choose-plan" class="input">${data.plans.map(p=>`<option value="${escapeHTML(p.id)}" ${p.id===modal.planId?'selected':''}>${escapeHTML(p.name)}</option>`).join('')}</select></div><p class="modal-help">Wähle vor dem Start Übungen an oder ab. Bereits eingetragene Übungen an diesem Tag werden nicht gelöscht.</p>${checklist(modal.ids)}`,`<button class="btn btn-primary btn-block" data-action="apply-plan" ${modal.ids.length?'':'disabled'}>Mit ${modal.ids.length} Übungen übernehmen</button>`);}else if(modal.type==='editPlan'){const p=modal.draft;root.innerHTML=modalMarkup(modal.isNew?'Trainingsplan erstellen':'Trainingsplan bearbeiten',`<div class="field"><label for="plan-name">Name des Plans</label><input class="input" id="plan-name" maxlength="50" value="${escapeHTML(p.name)}" placeholder="z. B. Oberkörper A"></div><p class="modal-help">Lege fest, welche Übungen standardmäßig in deinem Plan enthalten sind. Vor jedem Training kannst du die Auswahl ändern.</p>${checklist(p.exerciseIds)}`,`<div class="btn-wrap"><button class="btn btn-primary grow" data-action="save-plan">Plan speichern</button>${!modal.isNew?`<button class="btn btn-red" data-action="delete-plan">Löschen</button>`:''}</div>`);}else if(modal.type==='infoExercise'){const ex=getEx(modal.exId);root.innerHTML=modalMarkup(ex.name,`<div style="max-width:410px;margin:0 auto 15px;height:220px" class="library-art">${art(ex.art)}</div><div class="row" style="margin-bottom:10px"><span class="tag">${escapeHTML(ex.group)}</span><span class="tag">${escapeHTML(ex.equipment)}</span></div><p class="intro">${escapeHTML(EXERCISE_TIPS[ex.id]||'Individuell angelegte Übung. Achte auf die Gerätebeschriftung im Studio und eine kontrollierte Ausführung.')}</p><p class="modal-help">Die Zeichnung dient nur zur Orientierung und ersetzt keine Übungsanleitung durch eine Fachperson.</p>`,`<button class="btn btn-primary btn-block" data-action="info-add" data-ex="${escapeHTML(ex.id)}">＋ Für ${shortDate(selectedDate)} hinzufügen</button>`);}else if(modal.type==='customExercise'){root.innerHTML=modalMarkup('Eigene Übung erstellen',`<div class="stack"><div class="field"><label for="custom-name">Übungsname</label><input class="input" id="custom-name" maxlength="60" placeholder="z. B. Hackenschmidt-Presse"></div><div class="field"><label for="custom-group">Muskelgruppe</label><select class="input" id="custom-group">${GROUPS.slice(1).map(g=>`<option>${g}</option>`).join('')}</select></div><div class="field"><label for="custom-kind">Art</label><select class="input" id="custom-kind"><option>Maschine</option><option>Freihantel</option><option>Kabelzug</option><option>Körpergewicht</option><option>Gerät</option><option>Outdoor</option></select></div><div class="notice">Für eigene Übungen wird eine passende schematische Standardillustration angezeigt.</div></div>`,`<button class="btn btn-primary btn-block" data-action="save-custom">Übung erstellen & hinzufügen</button>`);}else if(modal.type==='changePassword'){root.innerHTML=modalMarkup('Passwort ändern',`<div class="stack"><div class="field"><label for="pw-current">Aktuelles Profilpasswort</label><input id="pw-current" class="input" type="password" autocomplete="current-password"></div><div class="field"><label for="pw-new">Neues Profilpasswort (mind. 12 Zeichen)</label><input id="pw-new" class="input" type="password" minlength="12" autocomplete="new-password"></div><div class="field"><label for="pw-confirm">Neues Passwort wiederholen</label><input id="pw-confirm" class="input" type="password" minlength="12" autocomplete="new-password"></div></div>`,`<button class="btn btn-primary btn-block" data-action="save-password">Passwort ändern</button>`);}}
function refreshModalKeepScroll(){const old=$('.sheet-body')?.scrollTop||0;renderModal();if($('.sheet-body'))$('.sheet-body').scrollTop=old;}
function setDay(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(date+'T12:00:00').getTime()))return;selectedDate=date;activeTab='today';render();}
function switchTab(tab){activeTab=tab;render();window.scrollTo({top:0,behavior:'instant'});}
function syncVolume(){const s=session();if(!s)return;const tot=s.exercises.reduce((sum,x)=>sum+(isCardioExercise(x)?0:exVolume(x)),0),sets=s.exercises.reduce((sum,x)=>sum+(isCardioExercise(x)?0:exSetCount(x)),0),minutes=s.exercises.reduce((sum,x)=>sum+(entryCompleted(x)?cardioDuration(x):0),0);if(el('day-set-count'))el('day-set-count').textContent=sets;if(el('day-vol-total'))el('day-vol-total').textContent=fmt(tot)+' kg';if(el('day-cardio-total'))el('day-cardio-total').textContent=fmt(minutes)+' min';}

function cloudSafeProfile(rec){const {id,name,salt,kdfIterations,iv,cipher,createdAt,updatedAt}=rec;return {id,name,salt,...(kdfIterations?{kdfIterations}:{}),iv,cipher,createdAt,updatedAt};}
function validCloudProfile(p){
 if(!p||typeof p.id!=='string'||typeof p.name!=='string'||p.name.length>70)return false;
 try {return ['salt','iv','cipher'].every(k=>typeof p[k]==='string'&&p[k].length>8)&&(!p.kdfIterations||(Number.isSafeInteger(p.kdfIterations)&&p.kdfIterations>=240000&&p.kdfIterations<=1200000))&&base64ToBytes(p.salt).length===16&&base64ToBytes(p.iv).length===12&&p.cipher.length<1600000;}catch{return false;}
}
function scheduleCloudSync(){
 if(!isLinked()||cloudConflict)return;
 clearTimeout(cloudDebounce);
 cloudDebounce=setTimeout(()=>{syncCloud().catch(e=>void e);},1700);
}
async function applyCloudProfile(remote, rec, expectedMutation=localMutationSeq){
 const profile=remote.profile;
 if(!validCloudProfile(profile)||profile.id!==rec.id||profile.salt!==rec.salt)throw new Error('Das Cloud-Profil passt nicht zu diesem Gerät. Bitte Support/Backup prüfen.');
 const parsed=JSON.parse(await decryptText(profile,currentKey));
 if(!Array.isArray(parsed.sessions)||!Array.isArray(parsed.plans)||!Array.isArray(parsed.customExercises))throw new Error('Cloud-Profil beschädigt.');
 if(localMutationSeq!==expectedMutation){cloudConflict=true;throw new Error('Während des Ladens wurde lokal trainiert. Kein Stand wurde überschrieben. Bitte Konflikt im Profil lösen.');}
 data=normalizeDataShape(parsed);
 rec.iv=profile.iv;rec.cipher=profile.cipher;
 rec.updatedAt=profile.updatedAt;
 rec.cloudVersion=remote.updateTime;
 rec.cloudSyncedLocalRev=rec.localRevision||0;
 writeAccounts();
 render();
}
async function syncCloud({forceLocal=false,forceRemote=false}={}){
 if(cloudBusy){cloudNeedsRerun=true;return;}
 if(!isLinked()||!navigator.onLine)return;
 if(cloudConflict&&!forceLocal&&!forceRemote)return;
 cloudBusy=true;
 try{
   await flush();
   if(!isLinked())return;
   const rec=accounts.find(a=>a.id===currentId);
   const remote=await KraftlogCloud.getProfile();
   await flush(); // Auch Änderungen berücksichtigen, die während des Netzaufrufs erfolgten.
   const expectedMutation=localMutationSeq;
   const dirty=(rec.localRevision||0)>(rec.cloudSyncedLocalRev||0);
   const differs=!!remote && remote.updateTime!==rec.cloudVersion;
   if(forceRemote){
     if(!remote)throw new Error('In der Cloud sind keine Daten vorhanden.');
     await applyCloudProfile(remote,rec,expectedMutation);cloudConflict=false;setCloudStatus('Cloud-Daten übernommen und lokal gespeichert');return;
   }
   if(differs&&!forceLocal){
     if(dirty){cloudConflict=true;setCloudStatus('Konflikt: Cloud und Gerät haben unterschiedliche Änderungen');if(activeTab==='profile')render();return;}
     await applyCloudProfile(remote,rec,expectedMutation);setCloudStatus('Aktuellen Cloud-Stand geladen');return;
   }
   if(!dirty&&!forceLocal&&remote){setCloudStatus('Alles synchronisiert');return;}
   setCloudStatus('Synchronisiere …');
   // Snapshot inklusive lokaler Revision wird VOR dem Netzaufruf festgehalten.
   const snapshot=cloudSafeProfile(rec),rev=rec.localRevision||0;
   const stamp=await KraftlogCloud.putProfile(snapshot,remote?.updateTime||null);
   rec.cloudVersion=stamp;
   rec.cloudSyncedLocalRev=rev;
   cloudConflict=false;writeAccounts();
   setCloudStatus('Synchronisiert · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));
   if((rec.localRevision||0)>rev)scheduleCloudSync();
 }catch(err){
   if(err.conflict){cloudConflict=true;setCloudStatus('Konflikt erkannt: Bitte im Profil entscheiden');if(activeTab==='profile')render();}
   else {setCloudStatus((cloudConflict?'Konflikt – ':'Cloud nicht erreichbar: lokal gespeichert · ')+err.message);if(cloudConflict&&activeTab==='profile')render();}
 }finally{
   cloudBusy=false;
   if(cloudNeedsRerun){cloudNeedsRerun=false;if(!cloudConflict)scheduleCloudSync();}
 }
}
async function linkCloud(form,mode='login'){
 await flush();
 const fd=new FormData(form),email=validEmail(fd.get('email')),pw=validatePassword(fd.get('password'));
 checkLoginThrottle('cloud',email);
 const rec=accounts.find(a=>a.id===currentId);
 if(!rec)throw new Error('Bitte zuerst das Profil entsperren.');
 try{await KraftlogCloud.authenticate(email,pw,mode==='register',rec.id);resetLoginThrottle('cloud',email);}catch(err){noteLoginFailure('cloud',email);throw err;}
 const remote=await KraftlogCloud.getProfile();
 if(remote && (!rec.cloudUid||rec.cloudUid!==KraftlogCloud.uid()))throw new Error('Dieses Online-Konto enthält bereits ein Profil. Die vorhandenen Cloud-Daten wurden nicht überschrieben. Bitte über „Online-Profil laden“ am Anmeldebildschirm wiederherstellen.');
 if(rec.cloudUid && rec.cloudUid!==KraftlogCloud.uid())throw new Error('Dieses Profil ist bereits mit einem anderen Online-Konto verknüpft.');
 rec.cloudUid=KraftlogCloud.uid();
 rec.cloudVersion=rec.cloudVersion||null;
 rec.localRevision=rec.localRevision||0;
 rec.cloudSyncedLocalRev=rec.cloudSyncedLocalRev||0;
 writeAccounts();cloudConflict=false;await sealCloudSession();
 setCloudStatus('Verbunden – erste Synchronisierung …');render();
 await syncCloud();
}
async function restoreCloud(form){
 const fd=new FormData(form),email=validEmail(fd.get('email')),pw=validatePassword(fd.get('password'));
 checkLoginThrottle('cloud',email);
 try{await KraftlogCloud.authenticate(email,pw,false,null);resetLoginThrottle('cloud',email);}catch(err){noteLoginFailure('cloud',email);throw err;}
 const remote=await KraftlogCloud.getProfile();
 if(!remote)throw new Error('Dieses Online-Konto hat noch keine gesicherten Trainingsdaten.');
 const incoming=remote.profile;
 if(!validCloudProfile(incoming))throw new Error('Online-Profil hat ein ungültiges Format.');
 const existing=accounts.find(a=>a.id===incoming.id);
 if(existing && (existing.localRevision||0)>(existing.cloudSyncedLocalRev||0))throw new Error('Dieses Gerät enthält noch nicht synchronisierte Einträge. Öffne zunächst das lokale Profil und synchronisiere es.');
 if(existing){
   if(!confirm('Lokales Profil durch den gesicherten Cloud-Stand ersetzen?'))return;
   Object.assign(existing,incoming,{cloudUid:KraftlogCloud.uid(),cloudVersion:remote.updateTime,cloudSyncedLocalRev:existing.localRevision||0});
 } else accounts.push({...incoming,cloudUid:KraftlogCloud.uid(),cloudVersion:remote.updateTime,localRevision:0,cloudSyncedLocalRev:0});
 KraftlogCloud.associate(incoming.id);
 writeAccounts();authMode='login';render();
 toast('Online-Profil geladen. Mit deinem bisherigen Profilpasswort öffnen.');
}
async function createProfile(name,password){validatePassword(password,{newPassword:true});const salt=crypto.getRandomValues(new Uint8Array(16)),key=await deriveKey(password,salt,NEW_KDF_ITERATIONS),id=uid(),encrypted=await encryptText(JSON.stringify(baseData()),key);accounts.push({id,name,salt:bytesToBase64(salt),kdfIterations:NEW_KDF_ITERATIONS,...encrypted,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});writeAccounts();currentId=id;currentKey=key;data=normalizeDataShape(baseData());activeTab='today';render();toast('Profil erstellt und verschlüsselt gespeichert');}
async function openProfile(id,password){checkLoginThrottle('local',id);const rec=accounts.find(a=>a.id===id);if(!rec)throw new Error('Profil nicht gefunden');let key;try{key=await deriveKey(password,base64ToBytes(rec.salt),rec.kdfIterations||240000);}catch(err){noteLoginFailure('local',id);throw err;}let text;try{text=await decryptText(rec,key);}catch{noteLoginFailure('local',id);throw new Error('Passwort falsch oder Profil beschädigt.');}resetLoginThrottle('local',id);const parsed=JSON.parse(text);if(!Array.isArray(parsed.sessions)||!Array.isArray(parsed.plans)||!Array.isArray(parsed.customExercises))throw new Error('Profil beschädigt');currentId=id;currentKey=key;data=normalizeDataShape(parsed);activeTab='today';selectedDate=localDate();await resumeCloudSession();render();toast('Profil entsperrt');if(isLinked())syncCloud().catch(()=>{});}
async function lockProfile(){await flush();currentId=null;currentKey=null;data=null;modal=null;authMode='login';render();}
function exportBackup(){const rec=accounts.find(a=>a.id===currentId);if(!rec)return;flush().then(()=>{const contents={format:'kraftlog-encrypted-backup-v1',exportedAt:new Date().toISOString(),profile:{...rec}};const url=URL.createObjectURL(new Blob([JSON.stringify(contents,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`KRAFTLOG-Backup-${rec.name.replace(/[^a-z0-9äöüß_-]/gi,'_')}-${localDate()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Verschlüsseltes Backup erstellt');});}
async function importBackup(file){if(!file)return;if(file.size>10*1024*1024){toast('Backup ist zu groß (max. 10 MB)');return;}try{const incoming=JSON.parse(await file.text());const r=incoming.profile;if(incoming.format!=='kraftlog-encrypted-backup-v1'||!r||typeof r.name!=='string'||r.name.length>70||typeof r.id!=='string'||!['salt','iv','cipher'].every(k=>typeof r[k]==='string'&&r[k].length>8))throw new Error('Ungültiges Backup');if(base64ToBytes(r.salt).length!==16||base64ToBytes(r.iv).length!==12)throw new Error('Ungültige Verschlüsselungsdaten');accounts.push({...r,id:uid(),name:r.name+' (Import)',updatedAt:new Date().toISOString()});writeAccounts();authMode='login';toast('Backup importiert. Mit ursprünglichem Passwort öffnen.');if(!currentId)render();}catch(err){toast('Backup konnte nicht importiert werden');}}

async function handleClick(event){const btn=event.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action;try{
 switch(action){
  case 'switch-tab':switchTab(btn.dataset.tab);break;
  case 'today-date':setDay(localDate());break;
  case 'shift-date':setDay(dateShift(selectedDate,Number(btn.dataset.days)));break;
  case 'jump-date':setDay(btn.dataset.date);break;
  case 'auth-mode':authMode=authMode==='new'?'login':'new';render();break;
  case 'lock':await lockProfile();break;
  case 'filter-group':libraryGroup=btn.dataset.group;render();break;
  case 'toggle-exercise':{const id=btn.dataset.ex,s=session();if(s?.exercises.some(e=>e.id===id)){const ent=s.exercises.find(e=>e.id===id);if((entryCompleted(ent)||hasCardioDraft(ent))&&!confirm('Die eingetragenen Werte dieser Übung für diesen Tag wirklich löschen?'))break;s.exercises=s.exercises.filter(e=>e.id!==id);save();toast('Übung entfernt');}else{addExerciseToSession(id);toast('Übung hinzugefügt');}render();break;}
  case 'remove-ex':{const s=session(),ent=s?.exercises.find(e=>e.id===btn.dataset.ex);if(!ent)break;if((entryCompleted(ent)||hasCardioDraft(ent))&&!confirm('Diese Übung und ihre Einträge für diesen Tag wirklich löschen?'))break;s.exercises=s.exercises.filter(e=>e!==ent);save();render();toast('Übung entfernt');break;}
  case 'copy-prior-field':{
    const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex),index=Number(btn.dataset.index),old=previousValidSets(btn.dataset.ex)[index];
    if(!ex||!Number.isInteger(index)||index<0||index>=ex.sets.length||!['kg','reps'].includes(btn.dataset.field)||!old)break;
    if(applyPreviousSet(ex.sets[index],old,btn.dataset.field)){commitPriorChange();toast(btn.dataset.field==='kg'?'Letztes Gewicht übernommen':'Letzte Wiederholungen übernommen');}
    break;
  }
  case 'copy-prior-set':{
    const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex),index=Number(btn.dataset.index),old=previousValidSets(btn.dataset.ex)[index];
    if(!ex||!Number.isInteger(index)||index<0||index>=ex.sets.length||!old)break;
    if(applyPreviousSet(ex.sets[index],old)){commitPriorChange();toast(`Satz ${index+1} übernommen`);}
    break;
  }
  case 'copy-prior-all':{
    const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex),oldSets=previousValidSets(btn.dataset.ex);
    if(!ex||!oldSets.length)break;
    let changed=false;
    oldSets.forEach((old,i)=>{
      if(!ex.sets[i]){ex.sets.push({id:uid(),kg:'',reps:''});changed=true;}
      if(applyPreviousSet(ex.sets[i],old))changed=true;
    });
    if(changed){commitPriorChange();toast('Letzte Sätze übernommen – Gewichte und Wiederholungen anpassbar');}
    else toast('Alle vorgeschlagenen Werte sind bereits eingetragen');
    break;
  }
  case 'add-set':{const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex);if(!ex)break;ex.sets.push({id:uid(),kg:'',reps:''});save();render();break;}
  case 'remove-set':{const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex);if(!ex)break;const set=ex.sets.find(s=>s.id===btn.dataset.set);if(set&&validSet(set)&&!confirm('Erfassten Satz wirklich löschen?'))break;ex.sets=ex.sets.filter(s=>s!==set);if(!ex.sets.length)ex.sets.push({id:uid(),kg:'',reps:''});save();render();break;}
  case 'open-plan-picker':{const p=data.plans[0];modal={type:'choosePlan',planId:p?.id,ids:[...(p?.exerciseIds||[])]};renderModal();break;}
  case 'start-plan':{const p=data.plans.find(x=>x.id===btn.dataset.plan);modal={type:'choosePlan',planId:p.id,ids:[...p.exerciseIds]};renderModal();break;}
  case 'apply-plan':{const p=data.plans.find(x=>x.id===modal.planId);if(!p||!modal.ids.length){toast('Mindestens eine Übung auswählen');break;}const s=ensureSession();s.planId=p.id;s.planName=p.name;let added=0;modal.ids.forEach(id=>{if(!s.exercises.some(ex=>ex.id===id)){s.exercises.push(makeExerciseEntry(id));added++;}});save();modal=null;activeTab='today';render();toast(`${added} Einträge übernommen`);break;}
  case 'edit-plan':{const p=data.plans.find(x=>x.id===btn.dataset.plan);modal={type:'editPlan',isNew:!p,draft:p?{id:p.id,name:p.name,exerciseIds:[...p.exerciseIds]}:{id:uid(),name:'',exerciseIds:[]}};renderModal();break;}
  case 'save-plan':{const p=modal?.draft;if(!p)break;p.name=p.name.trim();if(!p.name){toast('Bitte Plannamen eingeben');$('#plan-name')?.focus();break;}if(!p.exerciseIds.length){toast('Mindestens eine Übung auswählen');break;}if(modal.isNew)data.plans.push(p);else{const idx=data.plans.findIndex(x=>x.id===p.id);if(idx<0)break;data.plans[idx]=p;}save();modal=null;render();toast('Trainingsplan gespeichert');break;}
  case 'delete-plan':{if(data.plans.length<=1){toast('Mindestens ein Plan muss bleiben');break;}if(!confirm('Diesen Trainingsplan löschen? Bereits erfasste Trainings bleiben erhalten.'))break;data.plans=data.plans.filter(p=>p.id!==modal.draft.id);save();modal=null;render();toast('Plan gelöscht');break;}
  case 'new-exercise':modal={type:'customExercise'};renderModal();break;
  case 'exercise-info':modal={type:'infoExercise',exId:btn.dataset.ex};renderModal();break;
  case 'info-add':{const added=addExerciseToSession(btn.dataset.ex);modal=null;activeTab='today';render();toast(added?'Übung hinzugefügt':'Übung ist bereits im Training');break;}
  case 'save-custom':{const name=$('#custom-name')?.value.trim(),group=$('#custom-group')?.value,equipment=$('#custom-kind')?.value;if(!name){toast('Bitte einen Übungsnamen eingeben');break;}const mode=group==='Cardio'?'cardio':'strength';const artType=group==='Cardio'?(equipment==='Outdoor'?'run':'treadmill'):({Brust:'chest',Rücken:'row',Schultern:'overhead',Beine:'legpress',Bauch:'abs',Arme:'curl'})[group]||'chest';const ex={id:'custom-'+uid(),name:name.slice(0,60),group,equipment,art:artType,mode};data.customExercises.push(ex);addExerciseToSession(ex.id);save();modal=null;activeTab='library';render();toast('Eigene Übung hinzugefügt');break;}
  case 'metric':statMetric=btn.dataset.metric;render();break;

  case 'copy-prior-cardio':{const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex);if(!ex)break;const changed=applyPriorCardio(ex);if(changed){render();toast('Letzte fehlende Cardio-Werte übernommen');}else toast('Keine fehlenden Werte – einzeln antippen zum Ersetzen');break;}
  case 'copy-prior-cardio-field':{const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex),field=btn.dataset.field;if(!ex||!['duration','distance','calories'].includes(field))break;const changed=applyPriorCardio(ex,field);if(changed){render();toast('Letzten Wert übernommen');}break;}
  case 'finish-cardio':{const ex=session()?.exercises.find(e=>e.id===btn.dataset.ex);if(!ex)break;const c=cardioShape(ex);if(!cardioValid(ex)){toast('Bitte mindestens eine gültige Dauer in Minuten eintragen');break;}c.completed=true;c.recordedAt=new Date().toISOString();session().updatedAt=c.recordedAt;save();render();toast('Cardio-Einheit abgeschlossen und gespeichert');break;}
  case 'open-change-password':modal={type:'changePassword'};renderModal();break;
  case 'save-password':{const cur=$('#pw-current')?.value||'',pw=$('#pw-new')?.value||'',conf=$('#pw-confirm')?.value||'';if(pw.length<12){toast('Neues Passwort braucht mindestens 12 Zeichen');break;}if(pw!==conf){toast('Die neuen Passwörter stimmen nicht überein');break;}await changeProfilePassword(cur,pw);modal=null;render();toast('Passwort geändert');break;}
  case 'toggle-timer-panel':timerState.expanded=!timerState.expanded;saveTimerState();render();break;
  case 'timer-preset':setSinglePreset(Number(btn.dataset.seconds));render();break;
  case 'timer-startpause':startPauseTimer();break;
  case 'timer-reset':resetTimer();render();break;
  case 'timer-repeat':repeatTimer();break;
  case 'close-modal':modal=null;renderModal();break;
  case 'import-backup':{let input=el('backup-file');if(!input){input=document.createElement('input');input.id='backup-file';input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.appendChild(input);input.addEventListener('change',async e=>{await importBackup(e.target.files[0]);input.value='';});}input.click();break;}
  case 'export-backup':exportBackup();break;
  case 'cloud-sync':await syncCloud();break;
  case 'cloud-logout':localStorage.removeItem(CLOUD_AUTH_ENCRYPTED_STORE+currentId);KraftlogCloud.logout();cloudConflict=false;setCloudStatus('Online abgemeldet. Lokal weiter nutzbar.');render();break;
  case 'cloud-use-remote':{
    if(!confirm('Wirklich die Cloud-Version laden? Nicht synchronisierte Änderungen auf diesem Gerät gehen verloren.'))break;
    await syncCloud({forceRemote:true});render();break;
  }
  case 'cloud-use-local':{
    if(!confirm('Wirklich diese Geräte-Version in der Cloud speichern? Änderungen eines anderen Geräts gehen dadurch verloren.'))break;
    await syncCloud({forceLocal:true});render();break;
  }
  case 'delete-profile':{if(!confirm('Dieses Profil nur von DIESEM Gerät löschen? Die bereits synchronisierten Cloud-Daten bleiben erhalten. Nicht synchronisierte lokale Änderungen gehen verloren.'))break;await flush();localStorage.removeItem(CLOUD_AUTH_ENCRYPTED_STORE+currentId);accounts=accounts.filter(a=>a.id!==currentId);writeAccounts();currentId=null;currentKey=null;data=null;modal=null;authMode=accounts.length?'login':'new';render();toast('Lokales Profil gelöscht');break;}
 }
 }catch(err){toast('Ein Fehler ist aufgetreten.');}}

document.addEventListener('click',handleClick);
document.addEventListener('submit',async e=>{
 if(e.target.id!=='cloud-link-form'&&e.target.id!=='cloud-restore-form')return;
 e.preventDefault();const form=e.target;
 const buttons=[...form.querySelectorAll('button[type=submit]')];buttons.forEach(b=>b.disabled=true);
 try{if(form.id==='cloud-link-form')await linkCloud(form,e.submitter?.value||'login');else await restoreCloud(form);}
 catch(err){toast(err.message);setCloudStatus('Cloud: '+err.message);}
 finally{buttons.forEach(b=>{if(b.isConnected)b.disabled=false;});}
});
document.addEventListener('submit',async e=>{if(e.target.id!=='auth-form')return;e.preventDefault();const form=e.target,btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Verschlüsselung wird vorbereitet …';try{const fd=new FormData(form),pw=String(fd.get('password')||'');if(pw.length<8)throw new Error('Das Passwort braucht mindestens 8 Zeichen.');if(authMode==='new'||!accounts.length){const name=String(fd.get('name')||'').trim();if(!name||name.length>40)throw new Error('Bitte einen Profilnamen mit maximal 40 Zeichen eingeben.');if(pw!==fd.get('confirm'))throw new Error('Die Passwörter stimmen nicht überein.');await createProfile(name,pw);}else await openProfile(String(fd.get('profile')),pw);}catch(err){toast(err?.name==='OperationError'?'Passwort falsch oder Backup beschädigt':err.message==='Profil beschädigt'?err.message:err.message||'Anmeldung fehlgeschlagen');}finally{if(btn.isConnected){btn.disabled=false;btn.textContent=authMode==='new'?'Profil erstellen →':'Profil öffnen →';}}});
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.matches('[data-set-field]')){
   const ex=session()?.exercises.find(x=>x.id===t.dataset.ex),set=ex?.sets.find(s=>s.id===t.dataset.set);
   if(!set)return;
   let v=t.value.replace(',','.');if(v!==''&&Number(v)<0)v='';
   set[t.dataset.setField]=v;
   if(validSet(set))set.recordedAt=new Date().toISOString();
   session().updatedAt=new Date().toISOString();save();
   const index=ex.sets.indexOf(set),old=previousValidSets(ex.id)[index];
   t.classList.toggle('input-has-suggestion',Boolean(old)&&!hasSetField(set[t.dataset.setField]));
   const row=t.closest('[data-set-row]');
   if(row){
     const done=validSet(set);
     row.classList.toggle('set-row-done',done);
     const action=row.querySelector('.set-accept,.set-done,.set-action-spacer');
     if(action){
       if(done)action.outerHTML='<span class="set-done" title="Satz erfasst" aria-label="Satz erfasst">✓</span>';
       else if(old)action.outerHTML='<button type="button" class="set-accept" data-action="copy-prior-set" data-ex="'+escapeHTML(ex.id)+'" data-index="'+index+'" aria-label="Letzte Satzwerte übernehmen" title="Fehlende Werte übernehmen">✓</button>';
       else action.outerHTML='<span class="set-action-spacer" aria-hidden="true"></span>';
     }
   }
   const vEl=el('volume-'+ex.id);if(vEl)vEl.textContent=fmt(exVolume(ex))+' kg';
   const sEl=el('setcount-'+ex.id);if(sEl)sEl.textContent=exSetCount(ex);
   syncVolume();
 }else if(t.matches('[data-cardio-field]')){changeCardioField(t);}
 else if(t.id==='plan-name'&&modal?.type==='editPlan')modal.draft.name=t.value;
 else if(t.id==='library-search'){
   libraryQuery=t.value;const pos=t.selectionStart;render();const input=el('library-search');input.focus();input.setSelectionRange(pos,pos);
 }
});
document.addEventListener('change',e=>{const t=e.target;if(t.matches('[data-cardio-field]')){changeCardioField(t);return;}if(t.id==='training-date')setDay(t.value);else if(t.id==='choose-plan'&&modal?.type==='choosePlan'){const p=data.plans.find(p=>p.id===t.value);modal.planId=t.value;modal.ids=[...(p?.exerciseIds||[])];renderModal();}else if(t.matches('[data-select-ex]')&&modal){const a=modal.type==='choosePlan'?modal.ids:modal.type==='editPlan'?modal.draft.exerciseIds:null;if(!a)return;const id=t.dataset.selectEx,idx=a.indexOf(id);if(t.checked&&idx<0)a.push(id);else if(!t.checked&&idx>=0)a.splice(idx,1);refreshModalKeepScroll();}else if(t.id==='stat-exercise'){statExercise=t.value;render();}else if(t.id==='timer-cycle-enabled'){toggleTimerMode(t.checked);}else if(t.id==='timer-cycle-a'){timerState.cycleA=Number(t.value);timerState.active='A';timerState.running=false;timerState.remainingMs=timerCurrentDuration();timerState.ended=false;saveTimerState();updateTimerUI();}else if(t.id==='timer-cycle-b'){timerState.cycleB=Number(t.value);timerState.running=false;timerState.remainingMs=timerCurrentDuration();timerState.ended=false;saveTimerState();updateTimerUI();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){modal=null;renderModal();}});

(function start(){try{if(!window.crypto?.subtle){el('app').innerHTML='<main class="auth-layout"><h1>Ein sicherer Browser ist nötig</h1><p>Für die Verschlüsselung muss die App über HTTPS laufen, zum Beispiel auf GitHub Pages. Öffne sie dort in Safari oder Chrome.</p></main>';return;}accounts=safeGetAccounts();authMode=accounts.length?'login':'new';ensureTimerReady();render();if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(e=>void e);}}catch(err){el('app').textContent='Der lokale Browser-Speicher ist nicht verfügbar. Bitte verwende einen normalen Browsermodus.';}})();

/* In regelmäßigen Abständen Cloud-Änderungen prüfen (auch nach einem App-Update). */
window.addEventListener('online',()=>{if(isLinked())syncCloud();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isLinked())syncCloud();});
setInterval(()=>{if(isLinked()&&!document.hidden)syncCloud();},5*60*1000);
