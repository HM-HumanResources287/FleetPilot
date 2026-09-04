const firebaseConfig = {
  apiKey: "AIzaSyB05eM7eDiIUNv0KROZ1Lly_HauLlBqgDY",
  authDomain: "fleetpilot-f61e1.firebaseapp.com",
  projectId: "fleetpilot-f61e1",
  storageBucket: "fleetpilot-f61e1.firebasestorage.app",
  messagingSenderId: "639156853582",
  appId: "1:639156853582:web:a992c55475a5d8c0d89c1f",
  measurementId: "G-NHSEHVV5SS"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

db.enablePersistence()
  .then(() => console.log('✅ Firestore persistence enabled'))
  .catch((err) => console.warn('⚠️ Firestore persistence error:', err));