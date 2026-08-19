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
 * Procura um perfil operacional órfão pelo e-mail do usuário autenticado
 * (ou pelo nickname digitado no login, para perfis legados com e-mail FAKE).
 * Um perfil é considerado órfão se o seu documento ID (normalmente nickname ou string manual)
 * NÃO for igual ao UID do Auth, mas o campo 'email' (ou 'nickname') coincidir.
 */
export async function autoMigrateProfile(
  authUser: any,
  nickname?: string | null,
): Promise<boolean> {
  if (!authUser || !authUser.uid) return false;

  try {
    // 1. Verificar se já existe o documento correto (ID == UID)
    const exactDocRef = doc(db, "usuarios", authUser.uid);
    const exactDocSnap = await getDoc(exactDocRef);

    if (exactDocSnap.exists()) {
      return true;
    }

    // 2. Procurar por um perfil que tenha o e-mail mas ID diferente (ex: nickname)
    let perfilOrfao: { doc: any; data: any } | null = null;

    if (authUser.email) {
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", authUser.email.toLowerCase().trim()),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0]) {
        perfilOrfao = { doc: snap.docs[0], data: snap.docs[0].data() };
      }
    }

    // 3. Fallback: buscar pelo nickname digitado no login
    //    (perfis legados podem ter e-mail FAKE diferente do Auth, mas nickname igual)
    if (!perfilOrfao && nickname) {
      const normalizedNickname = nickname
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".")
        .replace(/(^\.|\.$)/g, "");

      if (normalizedNickname) {
        const qNick = query(
          collection(db, "usuarios"),
          where("nickname", "==", normalizedNickname),
          limit(1),
        );
        const snapNick = await getDocs(qNick);
        if (!snapNick.empty && snapNick.docs[0]) {
          perfilOrfao = { doc: snapNick.docs[0], data: snapNick.docs[0].data() };
        }
      }
    }

    if (perfilOrfao) {
      const oldDoc = perfilOrfao.doc;
      const oldData = perfilOrfao.data;
      const oldId = oldDoc.id;

      if (oldId === authUser.uid) return true;

      // 4. Criar o novo documento com ID = UID
      const newData = {
        ...oldData,
        uid: authUser.uid,
        email: authUser.email || oldData.email,
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
