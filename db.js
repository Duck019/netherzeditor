import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  writeBatch
} from "firebase/firestore";
import { db } from "./firebaseConfig.js";

export async function salvarEspacoRemoto(userId, space) {
  try {
    const spaceRef = doc(db, "users", userId, "spaces", space.id);
    await setDoc(spaceRef, space, { merge: true });
  } catch (error) {
    console.error("Error saving space:", error);
    throw error;
  }
}

export async function deletarEspacoRemoto(userId, spaceId) {
  try {
    await deleteDoc(doc(db, "users", userId, "spaces", spaceId));
  } catch (error) {
    console.error("Error deleting space:", error);
    throw error;
  }
}

export async function carregarEspacosRemotos(userId) {
  try {
    const spacesRef = collection(db, "users", userId, "spaces");
    const q = query(spacesRef);
    
    const querySnapshot = await getDocs(q);
    const spaces = [];
    
    querySnapshot.forEach((doc) => {
      spaces.push(doc.data());
    });

    return spaces;
  } catch (error) {
    console.error("Error loading spaces:", error);
    return [];
  }
}

export async function salvarMuitosEspacos(userId, spaces) {
  try {
    const batch = writeBatch(db);
    spaces.forEach(space => {
      const ref = doc(db, "users", userId, "spaces", space.id);
      batch.set(ref, space);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error batch saving:", error);
  }
}