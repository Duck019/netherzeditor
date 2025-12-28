import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { User } from "./types";

/**
 * Cria uma nova conta no Firebase Authentication.
 */
export async function criarConta(email: string, password: string, name?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Atualizar o perfil com o nome se fornecido
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

/**
 * Realiza login com email e senha no Firebase.
 */
export async function fazerLogin(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(userCredential.user);
  } catch (error) {
    throw error;
  }
}

/**
 * Desconecta o usuário do Firebase.
 */
export async function fazerLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
}

/**
 * Observa mudanças no estado de autenticação do Firebase.
 */
export function monitorarEstadoAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(mapUser(firebaseUser));
    } else {
      callback(null);
    }
  });
}

// Helper para transformar o usuário do Firebase no tipo User da aplicação
function mapUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email || 'U')}&background=8b5cf6&color=fff`
  };
}