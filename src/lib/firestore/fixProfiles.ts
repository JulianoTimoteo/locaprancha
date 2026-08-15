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
  console.log("Iniciando correção de perfis...");
  const usersColl = collection(db, "usuarios");
  const snapshot = await getDocs(usersColl);

  const emailMap = new Map<
    string,
    (Record<string, unknown> & {
      id: string;
      uid?: string;
      nickname?: string;
    })[]
  >();

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
      console.log(
        `Email duplicado encontrado: ${email}`,
        docs.map((d) => d.id),
      );

      // Encontrar o documento que tem o UID como ID (se houver)
      const correctDoc = docs.find((d) => d.id === d.uid);
      const nicknameDoc = docs.find((d) => d.id === d.nickname);

      const targetDoc = correctDoc || nicknameDoc || docs[0];
      const otherDocs = docs.filter((d) => d.id !== targetDoc.id);

      // Consolidar dados no documento alvo, priorizando o que tem UID
      if (targetDoc.uid && targetDoc.id !== targetDoc.uid) {
        // Se o melhor documento não tem o ID como UID, vamos criar um novo com ID=UID
        const newRef = doc(db, "usuarios", targetDoc.uid);
        batch.set(newRef, {
          ...targetDoc,
          atualizadoEm: serverTimestamp(),
        });
        // Marcar o antigo para deleção
        batch.delete(doc(db, "usuarios", targetDoc.id));
        changes++;
      }

      // Deletar os outros duplicados
      otherDocs.forEach((d) => {
        batch.delete(doc(db, "usuarios", d.id));
        changes++;
      });
    } else {
      // Mesmo com um doc, verificar se ID == UID
      const d = docs[0];
      if (d.uid && d.id !== d.uid) {
        console.log(`Corrigindo ID de ${d.id} para UID ${d.uid}`);
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
    console.log(`Correção concluída. ${changes} alterações realizadas.`);
  } else {
    console.log("Nenhuma inconsistência encontrada.");
  }
}
