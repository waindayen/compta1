import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  onSnapshotsInSync,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmfSKep6vYG4r4slwmXGLmdAIEvYnHnIc",
  authDomain: "ndex236.firebaseapp.com",
  projectId: "ndex236",
  storageBucket: "ndex236.firebasestorage.app",
  messagingSenderId: "413273183972",
  appId: "1:413273183972:web:3d2258028a5becc14b3ef1",
  measurementId: "G-WRBD9RCVL3"
};

// Online status tracking
let isOnline = navigator.onLine;
const listeners = new Set<(online: boolean) => void>();

export function onConnectivityStateChange(callback: (online: boolean) => void) {
  listeners.add(callback);
  callback(isOnline);
  return () => listeners.delete(callback);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with optimized settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Enable offline persistence with enhanced error handling
const setupPersistence = async () => {
  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    console.log('Offline persistence enabled successfully');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.info('Multiple tabs open, persistence enabled in another tab');
    } else if (err.code === 'unimplemented') {
      console.info('Browser doesn\'t support persistence');
    } else {
      console.error('Error setting up persistence:', err);
    }
  }
};

// Setup persistence
setupPersistence().catch(console.warn);

// Initialiser le document de temps serveur
const initServerTimeDoc = async () => {
  try {
    const timeDocRef = doc(db, 'site_config/server_time');
    await setDoc(timeDocRef, { 
      timestamp: serverTimestamp(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('Document de temps serveur initialisé');
  } catch (err) {
    console.warn('Erreur lors de l\'initialisation du document de temps serveur:', err);
  }
};

// Initialiser le document de temps serveur
initServerTimeDoc().catch(console.warn);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Analytics if supported
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
}).catch(console.warn);

// Setup online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('App is online');
    isOnline = true;
    listeners.forEach(listener => listener(true));
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    isOnline = false;
    listeners.forEach(listener => listener(false));
  });
}

// Monitor Firestore connectivity
onSnapshotsInSync(db, () => {
  if (!isOnline) {
    console.log('Firestore connection restored');
    isOnline = true;
    listeners.forEach(listener => listener(true));
  }
});

// Export connection status
export const getConnectionStatus = () => isOnline;

export { analytics };
export default app;