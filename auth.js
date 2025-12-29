import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebaseConfig.js";

export async function criarConta(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (name) {
      await updateProfile(user, {
        displayName: name,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff`
      });
    }

    return mapUser(user);
  } catch (error) {
    throw error;
  }
}

export async function fazerLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(userCredential.user);
  } catch (error) {
    throw error;
  }
}

export async function fazerLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export function monitorarEstadoAuth(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(mapUser(firebaseUser));
    } else {
      callback(null);
    }
  });
}

function mapUser(firebaseUser) {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email || 'U')}&background=8b5cf6&color=fff`
  };
}