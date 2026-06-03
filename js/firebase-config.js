// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMCXiCaiwRrZ6ms_337MZAXstGeow-2hE",
  authDomain: "gen-lang-client-0576446793.firebaseapp.com",
  projectId: "gen-lang-client-0576446793",
  storageBucket: "gen-lang-client-0576446793.firebasestorage.app",
  messagingSenderId: "341882667122",
  appId: "1:341882667122:web:9558ee8db16e3d3b5c42eb",
  measurementId: "G-26FCGHGJ9B"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
// Initialize services
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
const db = firebase.firestore();
// Storage is optional - only initialize if needed
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

// Set language to Arabic
if (auth) {
  auth.languageCode = 'ar';
}

// Helper function to get current user
function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

// Helper function to check if user is logged in
function isLoggedIn() {
  return auth && auth.currentUser !== null;
}

// Helper function to get user role from Firestore
async function getUserRole(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

// Auth state observer
if (auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User logged in:', user.uid);
    } else {
      console.log('User logged out');
    }
  });
}
