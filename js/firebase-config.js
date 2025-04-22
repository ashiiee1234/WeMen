// Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyASNKkt9Doxa1H8WXGYxDCQ3ABB3I2v_pY",
    authDomain: "wemen-5a087.firebaseapp.com",
    projectId: "wemen-5a087",
    storageBucket: "wemen-5a087.firebasestorage.app",
    messagingSenderId: "195921236221",
    appId: "1:195921236221:web:75c2308da83172076a6e94",
    measurementId: "G-QMS2SPESGN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable anonymous authentication
auth.useDeviceLanguage();

// Set persistence to local
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Firebase persistence error:", error);
    });

// Export services for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
