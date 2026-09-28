import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  browserLocalPersistence
} from 'firebase/auth';
import { expireInactiveSessionBeforeClientCreation } from './inactivity';

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || ''),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || ''),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || ''),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || ''),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || ''),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId && 
  firebaseConfig.appId
);

// An abandoned persisted session must be discarded before Firebase starts its
// automatic recovery, otherwise an expired token can hold the initial screen
// while the browser waits for a refresh request.
expireInactiveSessionBeforeClientCreation();

let app: FirebaseApp;
let auth: Auth;

if (isFirebaseConfigured) {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    auth = getAuth(app);
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence);
  }
}

export { app, auth };
