// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfvf6nvc5yA33BgJqgGbQ_SO8G0857hIU",
  authDomain: "teatron-c8f6f.firebaseapp.com",
  projectId: "teatron-c8f6f",
  storageBucket: "teatron-c8f6f.firebasestorage.app",
  messagingSenderId: "395041638044",
  appId: "1:395041638044:web:2982dad13b3c51b78ecf59",
  measurementId: "G-J83QFXDPKS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
// Storage is optional - only initialize if needed
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

// Set language to Arabic
auth.languageCode = 'ar';

// Helper function to get current user
function getCurrentUser() {
  return auth.currentUser;
}

// Helper function to check if user is logged in
function isLoggedIn() {
  return auth.currentUser !== null;
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
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});
