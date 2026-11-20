/* KRAFTLOG Cloud 2.0 – Firebase Auth + Firestore REST, keine externen Bibliotheken.
 * Datenschutz: Trainingsdaten werden VOR dem Upload vom Hauptprogramm verschlüsselt.
 * Zugriff: Firestore-Regeln aus firestore.rules sind für den Schutz erforderlich.
 */
'use strict';
const KraftlogCloud = (() => {
  const SESSION_STORE = 'kraftlog.firebase.session.v2';
  const cfg = window.KRAFTLOG_CLOUD_CONFIG || {};
  let session = null;
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_STORE) || 'null');
    if (s && typeof s.uid === 'string' && typeof s.refreshToken === 'string')
      session = {...s, idToken: null, expiresAt: 0};
  } catch { /* keine gespeicherte Anmeldung */ }
  const enabled = () => Boolean(typeof cfg.apiKey === 'string' && cfg.apiKey.trim() && /^[a-z\d-]+$/i.test(cfg.projectId || ''));
  const loggedIn = () => !!(session?.uid && session?.refreshToken);
  const uid = () => session?.uid || null;
  const email = () => session?.email || null;
  const linkedProfileId = () => session?.localProfileId || null;
  const persist = () => {
    if (!session) { localStorage.removeItem(SESSION_STORE); return; }
    const {uid, email, refreshToken, localProfileId} = session;
    localStorage.setItem(SESSION_STORE, JSON.stringify({uid,email,refreshToken,localProfileId}));
  };
  const labelError = (code) => ({
    EMAIL_EXISTS:'Diese E-Mail-Adresse ist bereits registriert. Bitte anmelden.',
    EMAIL_NOT_FOUND:'Kein Online-Konto für diese Adresse gefunden.',
    INVALID_PASSWORD:'Das Online-Passwort ist falsch.',
    INVALID_LOGIN_CREDENTIALS:'E-Mail-Adresse oder Online-Passwort ist falsch.',
    WEAK_PASSWORD:'Das Online-Passwort ist zu schwach (mindestens 6 Zeichen).',
    OPERATION_NOT_ALLOWED:'Bitte in Firebase die Anmeldung per E-Mail/Passwort aktivieren.',
    TOO_MANY_ATTEMPTS_TRY_LATER:'Zu viele Versuche. Bitte später erneut versuchen.',
    PERMISSION_DENIED:'Kein Datenbankzugriff. Bitte Firestore-Sicherheitsregeln prüfen.',
    INVALID_REFRESH_TOKEN:'Bitte erneut mit dem Online-Konto anmelden.',
    TOKEN_EXPIRED:'Bitte erneut mit dem Online-Konto anmelden.'
  }[code] || `Cloud-Anfrage fehlgeschlagen (${code || 'Netzwerk-/Serverfehler'}).`);
  const request = async (url, options={}) => {
    let response;
    try { response = await fetch(url, {...options, cache:'no-store'}); }
    catch { throw new Error('Keine Internetverbindung zur Cloud. Lokal wird weiter gespeichert.'); }
    let body = {};
    try { body = await response.json(); } catch { /* kein JSON */ }
    if (!response.ok) {
      if (response.status === 404 && url.includes('firestore.googleapis.com')) return null;
      const code = body?.error?.message || String(response.status);
      const error = new Error(labelError(code));
      error.status = response.status;
      error.code = code;
      error.conflict = response.status === 409 || response.status === 412 || code === 'FAILED_PRECONDITION' || code === 'ALREADY_EXISTS';
      throw error;
    }
    return body;
  };
  const acceptAuth = (response, localProfileId) => {
    session = {
      uid: response.localId || response.user_id,
      email: response.email || session?.email || '',
      refreshToken: response.refreshToken || response.refresh_token,
      idToken: response.idToken || response.id_token,
      expiresAt: Date.now() + (Number(response.expiresIn || response.expires_in) || 3600)*1000,
      localProfileId: localProfileId ?? session?.localProfileId ?? null
    };
    persist();
    return session.uid;
  };
  async function authenticate(email, password, create=false, localProfileId=null) {
    if (!enabled()) throw new Error('Cloud noch nicht eingerichtet. Bitte cloud-config.js ausfüllen.');
    const result = await request(`https://identitytoolkit.googleapis.com/v1/accounts:${create?'signUp':'signInWithPassword'}?key=${encodeURIComponent(cfg.apiKey)}`, {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email.trim().toLowerCase(),password,returnSecureToken:true})
    });
    acceptAuth(result,localProfileId);
    return uid();
  }
  async function token() {
    if (!loggedIn()) throw new Error('Bitte zuerst mit deinem Online-Konto anmelden.');
    if (session.idToken && session.expiresAt > Date.now()+90000) return session.idToken;
    const result = await request(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(cfg.apiKey)}`, {
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken}).toString()
    });
    acceptAuth(result,session.localProfileId);
    return session.idToken;
  }
  const docUrl = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents/kraftlog_users/${encodeURIComponent(uid())}`;
  async function getProfile() {
    const doc = await request(docUrl(), {headers:{Authorization:`Bearer ${await token()}`}});
    if (!doc) return null;
    const raw = doc.fields?.encryptedProfile?.stringValue;
    if (!raw || raw.length>900000) throw new Error('Die Cloud-Daten haben ein ungültiges Format.');
    let profile;
    try { profile = JSON.parse(raw); } catch { throw new Error('Cloud-Daten unlesbar.'); }
    return {profile, updateTime:doc.updateTime};
  }
  async function putProfile(profile, previousUpdateTime=null) {
    const params = new URLSearchParams();
    if (previousUpdateTime) params.set('currentDocument.updateTime',previousUpdateTime);
    else params.set('currentDocument.exists','false');
    const doc = await request(`${docUrl()}?${params.toString()}`, {
      method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await token()}`},
      body:JSON.stringify({fields:{encryptedProfile:{stringValue:JSON.stringify(profile)}}})
    });
    return doc.updateTime;
  }
  const associate = (localProfileId) => {if (session) {session.localProfileId=localProfileId;persist();}};
  const logout = () => {session=null;persist();};
  return {enabled,loggedIn,uid,email,linkedProfileId,authenticate,getProfile,putProfile,associate,logout};
})();
