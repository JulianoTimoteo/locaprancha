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
  writeBatch,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Equipamento } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { logAction } from "@/lib/audit";

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "equipamentos"), orderBy("codigo"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Equipamento[];
      setEquipamentos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addEquipamento = async (data: Omit<Equipamento, "id">) => {
    try {
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "equipamentos"), payload);
      if (profile) {
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "CREATE_EQUIPAMENTO",
          "EQUIPAMENTO",
          data.codigo,
          null,
          payload,
        );
      }
      return docRef.id;
    } catch (e: any) {
      console.error("Erro ao adicionar equipamento:", e);
      toast.error(`Erro ao adicionar equipamento: ${e.message}`);
      return null;
    }
  };

  const updateEquipamento = async (id: string, data: Partial<Equipamento>) => {
    try {
      const old = equipamentos.find((e) => e.id === id);
      const docRef = doc(db, "equipamentos", id);
      const updates = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, updates);

      if (profile && old) {
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "UPDATE_EQUIPAMENTO",
          "EQUIPAMENTO",
          id,
          old,
          updates,
        );
      }
      return true;
    } catch (e: any) {
      console.error("Erro ao atualizar equipamento:", e);
      toast.error(`Erro ao atualizar equipamento: ${e.message}`);
      return false;
    }
  };

  const deleteEquipamento = async (id: string) => {
    try {
      const old = equipamentos.find((e) => e.id === id);
      await deleteDoc(doc(db, "equipamentos", id));
      if (profile && old) {
        await logAction(
          profile.uid,
          profile.nickname || profile.name,
          "DELETE_EQUIPAMENTO",
          "EQUIPAMENTO",
          old.codigo,
          old,
          null,
        );
      }
      toast.success("Equipamento removido");
    } catch (e) {
      toast.error("Erro ao remover equipamento");
    }
  };

  const seedEquipamentos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "equipamentos"));
      if (!snapshot.empty) {
        toast.info("Banco de dados já contém equipamentos.");
        return;
      }

      const initialData = [
        { codigo: "11116", nome: "TRATOR NEW HOLLAND T7 245", grupo: "BIOMASSA" },
        { codigo: "11118", nome: "TRATOR NEW HOLLAND TL 85", grupo: "BIOMASSA" },
        { codigo: "11216", nome: "TRATOR NEW HOLLAND T7.245", grupo: "BIOMASSA" },
        { codigo: "11218", nome: "TRATOR NEW HOLLAND TL 85", grupo: "BIOMASSA" },
        { codigo: "11321", nome: "NEW HOLLAND T7 240", grupo: "BIOMASSA" },
        { codigo: "80116", nome: "COLHEDORA", grupo: "COLHEDORA RESERVA" },
        { codigo: "11126", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "11226", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "11316", nome: "TRATOR NEW HOLLAND T7 245", grupo: "FERTIRRIGACAO" },
        { codigo: "11326", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "11426", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "11526", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "11616", nome: "TRATOR NEW HOLLAND T7 260", grupo: "FERTIRRIGACAO" },
        { codigo: "11626", nome: "CASE PUMA 185", grupo: "FERTIRRIGACAO" },
        { codigo: "20123", nome: "MOTO BOMBA VALETA DUPLA", grupo: "FERTIRRIGACAO" },
        { codigo: "32", nome: "MOTO BOMBA CAMINHAO", grupo: "FERTIRRIGACAO" },
        { codigo: "33", nome: "MOTO BOMBA CAMINHÃO", grupo: "FERTIRRIGACAO" },
        { codigo: "34", nome: "MOTO BOMBA VALETA", grupo: "FERTIRRIGACAO" },
        { codigo: "435", nome: "MOTO BOMBA VALETA", grupo: "FERTIRRIGACAO" },
        { codigo: "48", nome: "MASSEY FERGUSON", grupo: "FERTIRRIGACAO" },
        { codigo: "91", nome: "MOTO BOMBA VALETA", grupo: "FERTIRRIGACAO" },
        { codigo: "80118", nome: "COLHEDORA", grupo: "FRENTE 08" },
        { codigo: "80317", nome: "COLHEDORA", grupo: "FRENTE 08" },
        { codigo: "92677", nome: "TRANSBORDO TERCEIRO", grupo: "FRENTE 08" },
        { codigo: "80119", nome: "COLHEDORA", grupo: "FRENTE 10" },
        { codigo: "80719", nome: "COLHEDORA", grupo: "FRENTE 10" },
        { codigo: "80319", nome: "COLHEDORA", grupo: "FRENTE 11" },
        { codigo: "80419", nome: "COLHEDORA", grupo: "FRENTE 11" },
        { codigo: "92465", nome: "TRATOR TRANSBORDO", grupo: "FRENTE 11" },
        { codigo: "80316", nome: "COLHEDORA", grupo: "FRENTE 12" },
        { codigo: "80320", nome: "COLHEDORA", grupo: "FRENTE 12" },
        { codigo: "80124", nome: "COLHEDORA", grupo: "FRENTE 13" },
        { codigo: "80217", nome: "COLHEDORA", grupo: "FRENTE 13" },
        { codigo: "80219", nome: "COLHEDORA", grupo: "FRENTE 14" },
        { codigo: "80222", nome: "COLHEDORA", grupo: "FRENTE 14" },
        { codigo: "80120", nome: "COLHEDORA", grupo: "FRENTE 15" },
        { codigo: "80519", nome: "COLHEDORA", grupo: "FRENTE 15" },
        { codigo: "93044", nome: "COLHEDORA", grupo: "FRENTE 30" },
        { codigo: "93058", nome: "COLHEDORA", grupo: "FRENTE 33" },
        { codigo: "93059", nome: "COLHEDORA", grupo: "FRENTE 33" },
        { codigo: "93086", nome: "COLHEDORA TERCEIRO", grupo: "FRENTE 38" },
        { codigo: "11124", nome: "TRATOR CASE PUMA 155", grupo: "HERBICIDA" },
        { codigo: "11125", nome: "TL 5", grupo: "HERBICIDA" },
        { codigo: "313", nome: "PA CARREGADEIRA NEW HOLLAND W 160", grupo: "LINHA AMARELA" },
        { codigo: "50116", nome: "MOTONIVELADORA", grupo: "LINHA AMARELA" },
        { codigo: "80122", nome: "COLHEDORA", grupo: "OFICINA" },
        { codigo: "11119", nome: "TRATORES MASSEY FERGUSON MF 283", grupo: "PREPARO" },
        { codigo: "11324", nome: "TRATOR CASE 155", grupo: "TRATOS CULTURAIS" },
      ];

      const batch = writeBatch(db);
      initialData.forEach((item) => {
        const docRef = doc(collection(db, "equipamentos"));
        batch.set(docRef, {
          codigo: item.codigo,
          nome: item.nome,
          tipo: item.grupo,
          status: "DISPONÍVEL",
          createdAt: new Date(),
        });
      });
      await batch.commit();
      toast.success("Equipamentos importados com sucesso");
    } catch (e) {
      console.error("Erro no seed:", e);
      toast.error("Erro ao importar equipamentos");
    }
  };

  return {
    equipamentos,
    loading,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    seedEquipamentos,
  };
}
