import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Frente } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAction } from "@/lib/audit";

export function useFrentes() {
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "frentes"), orderBy("nome"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Frente[];
      setFrentes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addFrente = async (data: Omit<Frente, "id">) => {
    try {
      const docRef = await addDoc(collection(db, "frentes"), data);
      if (profile) {
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "CREATE_FRENTE",
          "FRENTE",
          data.nome,
          null,
          data,
        );
      }
      toast.success("Frente adicionada com sucesso");
      return docRef.id;
    } catch (e: any) {
      console.error("Erro ao adicionar frente:", e);
      toast.error(`Erro ao adicionar frente: ${e.message || "Erro desconhecido"}`);
      return null;
    }
  };

  const updateFrente = async (id: string, data: Partial<Frente>) => {
    try {
      const old = frentes.find((f) => f.id === id);

      // Sanitização rigorosa para Firestore
      const dataToUpdate: any = {};
      if (data.nome !== undefined) dataToUpdate.nome = data.nome;
      if (data.codigo !== undefined) dataToUpdate.codigo = data.codigo;
      if (data.responsavel !== undefined) dataToUpdate.responsavel = data.responsavel || "";

      // Importante: status deve ser sempre 'ATIVA' ou 'INATIVA'
      if (data.status !== undefined) {
        dataToUpdate.status = data.status === "ATIVA" ? "ATIVA" : "INATIVA";
      } else if (!old?.status) {
        // Garantir que status nunca seja undefined se o registro antigo não tiver
        dataToUpdate.status = "ATIVA";
      }

      const docRef = doc(db, "frentes", id);
      await updateDoc(docRef, dataToUpdate);

      if (profile && old) {
        // Envia apenas o ID da entidade para o log para evitar problemas com nomes complexos
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "UPDATE_FRENTE",
          "FRENTE",
          id,
          old,
          dataToUpdate,
        );
      }

      toast.success("Frente atualizada");
      return true;
    } catch (e: any) {
      console.error("ERRO CRÍTICO NO FIRESTORE (Frentes):", e);
      // Extrai a mensagem de erro detalhada do Firestore para o usuário
      const errorMessage = e.message || "Erro de permissão ou conexão";
      toast.error(`Falha técnica: ${errorMessage}`);
      return false;
    }
  };

  const deleteFrente = async (id: string) => {
    try {
      const old = frentes.find((f) => f.id === id);
      await deleteDoc(doc(db, "frentes", id));
      if (profile && old) {
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "DELETE_FRENTE",
          "FRENTE",
          old.nome,
          old,
          null,
        );
      }
      toast.success("Frente removida");
    } catch (e) {
      toast.error("Erro ao remover frente");
    }
  };

  return { frentes, loading, addFrente, updateFrente, deleteFrente };
}
