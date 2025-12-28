import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Space } from "./types";

/**
 * Salva ou atualiza um espaço específico do usuário no Firestore.
 */
export async function salvarEspacoRemoto(userId: string, space: Space) {
  try {
    const spaceRef = doc(db, "users", userId, "spaces", space.id);
    // Usamos merge: true para não sobrescrever campos se mudarmos a estrutura no futuro,
    // embora aqui estejamos enviando o objeto completo.
    await setDoc(spaceRef, space, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar espaço no Firestore:", error);
    throw error;
  }
}

/**
 * Deleta um espaço do usuário no Firestore.
 */
export async function deletarEspacoRemoto(userId: string, spaceId: string) {
  try {
    await deleteDoc(doc(db, "users", userId, "spaces", spaceId));
  } catch (error) {
    console.error("Erro ao deletar espaço no Firestore:", error);
    throw error;
  }
}

/**
 * Carrega todos os espaços do usuário ordenados por modificação.
 */
export async function carregarEspacosRemotos(userId: string): Promise<Space[]> {
  try {
    const spacesRef = collection(db, "users", userId, "spaces");
    // Ordenar por data de modificação (mais recente primeiro se quiséssemos, mas o app ordena depois)
    const q = query(spacesRef); // Adicione orderBy('lastModified', 'desc') se criar índice
    
    const querySnapshot = await getDocs(q);
    const spaces: Space[] = [];
    
    querySnapshot.forEach((doc) => {
      spaces.push(doc.data() as Space);
    });

    return spaces;
  } catch (error) {
    console.error("Erro ao carregar espaços do Firestore:", error);
    return [];
  }
}

/**
 * Salva múltiplos espaços de uma vez (usado na migração inicial ou upload em massa).
 */
export async function salvarMuitosEspacos(userId: string, spaces: Space[]) {
  try {
    const batch = writeBatch(db);
    spaces.forEach(space => {
      const ref = doc(db, "users", userId, "spaces", space.id);
      batch.set(ref, space);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro no batch save:", error);
  }
}