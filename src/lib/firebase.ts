import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Permite também passar toda a configuração do Firebase como um objeto JSON único em VITE_FIREBASE_CONFIG
const jsonConfig = import.meta.env.VITE_FIREBASE_CONFIG;
if (jsonConfig) {
  try {
    let cleanConfig = jsonConfig.trim();
    // Remove aspas externas caso o valor tenha sido injetado com aspas extras
    if (cleanConfig.startsWith("'") && cleanConfig.endsWith("'")) {
      cleanConfig = cleanConfig.slice(1, -1).trim();
    }
    if (cleanConfig.startsWith('"') && cleanConfig.endsWith('"')) {
      cleanConfig = cleanConfig.slice(1, -1).trim();
    }
    const parsed = JSON.parse(cleanConfig);
    firebaseConfig = {
      ...firebaseConfig,
      ...parsed,
    };
  } catch (e) {
    console.error('Erro ao decodificar VITE_FIREBASE_CONFIG JSON:', e);
  }
}

// Check if we have minimum config to initialize
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Secure debug logging to help diagnose why it might fall back to Local Mode
console.log('Verificação do Firebase:', {
  isConfigured: isFirebaseConfigured,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
});

let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error('Erro ao inicializar o Firebase:', error);
  }
}

export { db, isFirebaseConfigured };
