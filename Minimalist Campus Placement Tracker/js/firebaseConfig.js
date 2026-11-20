/* 
========================================================================
   FIREBASE SYSTEM CONFIGURATION
   Uses Firebase v10 Modular SDK via CDN.
   No local installation or bundler (Webpack/Vite) required!
========================================================================
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =====================================================================
// INSTRUCTIONS FOR PROJECT EVALUATION & DEPLOYMENT:
// Replace this dummy firebaseConfig object with your actual keys from 
// the Firebase Console (Settings -> Project Settings -> General -> Your Apps).
// =====================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export instances to be imported by other JavaScript modules
export { app, auth, db };
export default app;
