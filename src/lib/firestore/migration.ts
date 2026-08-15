import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

/**
 * Procura um perfil operacional órfão pelo e-mail do usuário autenticado.
 * Um perfil é considerado órfão se o seu documento ID (normalmente nickname ou string manual)
 * NÃO for igual ao UID do Auth, mas o campo 'email' coincidir.
 */
export async function autoMigrateProfile(authUser: any): Promise<boolean> {
  if (!authUser || !authUser.email || !authUser.uid) return false;

  try {
    // 1. Verificar se já existe o documento correto (ID == UID)
    const exactDocRef = doc(db, "usuarios", authUser.uid);
    const exactDocSnap = await getDoc(exactDocRef);

    if (exactDocSnap.exists()) {
      return true;
    }

    // 2. Procurar por um perfil que tenha o e-mail mas ID diferente (ex: nickname)
    const q = query(
      collection(db, "usuarios"),
      where("email", "==", authUser.email.toLowerCase().trim()),
      limit(1),
    );

    const snap = await getDocs(q);

    if (!snap.empty && snap.docs[0]) {
      const oldDoc = snap.docs[0];
      const oldData = oldDoc.data();
      const oldId = oldDoc.id;

      if (oldId === authUser.uid) return true;

      // 3. Criar o novo documento com ID = UID
      const newData = {
        ...oldData,
        uid: authUser.uid,
        atualizadoEm: serverTimestamp(),
        ultimoAcesso: serverTimestamp(),
      };

      await setDoc(exactDocRef, newData);

      return true;
    }

    return false;
  } catch (error) {
    console.error("[AUTO-MIGRATION] Erro ao migrar perfil:", error);
    return false;
  }
}
