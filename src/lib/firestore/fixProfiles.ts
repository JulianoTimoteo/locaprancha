import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Script utilitário para corrigir perfis de usuários que possuem múltiplos documentos
 * ou estão com o UID incorreto no Firestore.
 * Prioriza o documento cujo ID é o UID do Auth.
 */
export async function fixUserProfiles() {
  const usersColl = collection(db, "usuarios");
  const snapshot = await getDocs(usersColl);

  const emailMap = new Map<string, any[]>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const email = (data["email"] as string)?.toLowerCase().trim();
    if (email) {
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)?.push({ id: doc.id, ...data });
    }
  });

  const batch = writeBatch(db);
  let changes = 0;

  for (const [email, docs] of emailMap.entries()) {
    if (docs.length > 1) {
      const correctDoc = docs.find((d) => d.id === d.uid);
      const nicknameDoc = docs.find((d) => d.id === d.nickname);

      const targetDoc = correctDoc || nicknameDoc || docs[0];
      const otherDocs = docs.filter((d) => d.id !== targetDoc.id);

      if (targetDoc.uid && targetDoc.id !== targetDoc.uid) {
        const newRef = doc(db, "usuarios", targetDoc.uid);
        batch.set(newRef, {
          ...targetDoc,
          atualizadoEm: serverTimestamp(),
        });
        batch.delete(doc(db, "usuarios", targetDoc.id));
        changes++;
      }

      otherDocs.forEach((d) => {
        batch.delete(doc(db, "usuarios", d.id));
        changes++;
      });
    } else {
      const d = docs[0];
      if (d.uid && d.id !== d.uid) {
        const newRef = doc(db, "usuarios", d.uid);
        batch.set(newRef, {
          ...d,
          atualizadoEm: serverTimestamp(),
        });
        batch.delete(doc(db, "usuarios", d.id));
        changes++;
      }
    }
  }

  if (changes > 0) {
    await batch.commit();
  }
}
