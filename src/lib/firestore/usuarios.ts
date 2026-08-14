import {
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  DocumentData,
  getDocs,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "@/types";
import { normalizeUserProfile } from "./normalizers";

/**
 * Escuta em tempo real a coleção de usuários
 */
export function subscribeToUsuarios(callback: (usuarios: UserProfile[]) => void) {
  const q = query(collection(db, "usuarios"));

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const usuarios = snapshot.docs.map((doc) => {
        return normalizeUserProfile(doc.id, doc.data());
      });
      callback(usuarios);
    },
    (error) => {
      console.error("Erro ao assinar usuários:", error);
    },
  );
}

/**
 * Busca um usuário por nickname (Apenas para verificação de existência, não identidade)
 */
export async function findUserByNickname(nickname: string): Promise<UserProfile | null> {
  if (!nickname) return null;

  const q = query(
    collection(db, "usuarios"),
    where("nickname", "==", nickname.toLowerCase().trim()),
    limit(1),
  );

  const snap = await getDocs(q);
  if (snap.empty || !snap.docs[0]) return null;

  return normalizeUserProfile(snap.docs[0].id, snap.docs[0].data());
}
