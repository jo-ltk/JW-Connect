import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

// When no Firebase keys are configured (e.g. a Vercel deploy without env vars),
// fall back to placeholders so Firebase Auth initializes instead of throwing
// auth/invalid-api-key and crashing the whole app. The app then runs in
// offline mode; online sign-in needs real keys in the deployment env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY || 'jwconnect-offline-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID || 'jwconnect-offline',
  appId: import.meta.env.VITE_FIREBASE_APPID || 'jwconnect-offline-app-id',
};

// Initialize Firebase
initializeApp(firebaseConfig);

if (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(
    getAuth(),
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST,
    {
      disableWarnings: true,
    }
  );
}