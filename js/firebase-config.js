// Secure Firebase Config - Do NOT expose in main app bundle
// In production, use Firebase Functions rewrites or environment variables

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBw_2IUe06ZfizYL30dmlWRjGA51Lqg-eI",
  authDomain: "svce-results.firebaseapp.com",
  projectId: "svce-results",
  storageBucket: "svce-results.firebasestorage.app",
  messagingSenderId: "112537639370",
  appId: "1:112537639370:web:6a1f6bbc5fe658d43cd733",
  measurementId: "G-63NRGEVLXB"
};

// Prod check - in dev use localhost config if available
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('Development mode - using prod config (update for true local dev)');
}
