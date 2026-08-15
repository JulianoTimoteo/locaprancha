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
      toast.success("Equipamento removido");
    } catch (e) {
      toast.error("Erro ao remover equipamento");
    }
  };

  const seedEquipamentos = async () => {
    try {
      const snapshot = await getDocs(collection(db, "equipamentos"));
      const existingCodes = new Set(
        snapshot.docs.map((doc) => (doc.data().codigo as string) || ""),
      );

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

        { codigo: "68117", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "411", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "73", nome: "COBRIDOR DE LINHA", grupo: "IMPLEMENTOS" },
        { codigo: "404", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "119", nome: "CULTIVADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "423", nome: "DESENLEIRADOR DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "61", nome: "ENLEIRADOR DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "87", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "55218", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "82", nome: "GRADE INTERMEDIÁRIA", grupo: "IMPLEMENTOS" },
        { codigo: "842", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "439", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "401", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "419", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "143", nome: "SUBSOLADOR", grupo: "IMPLEMENTOS" },
        { codigo: "843", nome: "SUBSOLADOR", grupo: "IMPLEMENTOS" },
        { codigo: "549", nome: "APLICADOR DE TORTA", grupo: "IMPLEMENTOS" },
        { codigo: "58118", nome: "TERRACEADOR", grupo: "IMPLEMENTOS" },
        { codigo: "77", nome: "TERRACEADOR", grupo: "IMPLEMENTOS" },
        { codigo: "329", nome: "PÁ CARREGADEIRA NEW HOLLAND W 170B", grupo: "IMPLEMENTOS" },
        { codigo: "340", nome: "UNIPORT VALTRA BF 3020 H", grupo: "IMPLEMENTOS" },
        { codigo: "712", nome: "ENFARDADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "823", nome: "ENFARDADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "138", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "414", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "421", nome: "CULTIVADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "425", nome: "CULTIVADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "88", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "95", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "140", nome: "REMAPLAN", grupo: "IMPLEMENTOS" },
        { codigo: "74", nome: "MARCADOR DE PLANTIO", grupo: "IMPLEMENTOS" },
        { codigo: "75", nome: "MARCADOR DE PLANTIO", grupo: "IMPLEMENTOS" },
        { codigo: "144", nome: "SUBSOLADOR", grupo: "IMPLEMENTOS" },
        { codigo: "50116", nome: "MOTONIVELADORA JOHN DEERE 670G", grupo: "IMPLEMENTOS" },
        { codigo: "50118", nome: "MOTONIVELADORA JOHN DEERE 670G", grupo: "IMPLEMENTOS" },
        { codigo: "769", nome: "CARRETA DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "90", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "400", nome: "SULCADOR", grupo: "IMPLEMENTOS" },
        { codigo: "407", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "53218", nome: "GRADE INTERMEDIÁRIA", grupo: "IMPLEMENTOS" },
        { codigo: "94", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "51", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "53", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "416", nome: "ROLO COMPACTADOR", grupo: "IMPLEMENTOS" },
        { codigo: "65", nome: "SULCADOR", grupo: "IMPLEMENTOS" },
        { codigo: "841", nome: "SUPER GRADE ARAD. ECOAGRICOLA", grupo: "IMPLEMENTOS" },
        { codigo: "429", nome: "COMPOSTAGEM", grupo: "IMPLEMENTOS" },
        { codigo: "410", nome: "ARADO", grupo: "IMPLEMENTOS" },
        { codigo: "97", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "72", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "59", nome: "ENLEIRADOR DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "60", nome: "ENLEIRADOR DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "409", nome: "ARADO", grupo: "IMPLEMENTOS" },
        { codigo: "96", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "323", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "52", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "325", nome: "CULTIVADOR", grupo: "IMPLEMENTOS" },
        { codigo: "66", nome: "SULCADOR", grupo: "IMPLEMENTOS" },
        { codigo: "408", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "145", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "37055", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "403", nome: "GRADE INTERMEDIÁRIA", grupo: "IMPLEMENTOS" },
        { codigo: "84", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "149", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "406", nome: "SUBSOLADOR", grupo: "IMPLEMENTOS" },
        { codigo: "139", nome: "CULTIVADOR", grupo: "IMPLEMENTOS" },
        { codigo: "64", nome: "SULCADOR", grupo: "IMPLEMENTOS" },
        { codigo: "527", nome: "MOTONIVELADORA NEW HOLLAND RG 170B VHP", grupo: "IMPLEMENTOS" },
        { codigo: "16367", nome: "CULTIVADO DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "85118", nome: "APLICADOR DE VINHAÇA LOCALIZADA", grupo: "IMPLEMENTOS" },
        { codigo: "85119", nome: "APLICADOR DE VINHAÇA LOCALIZADA", grupo: "IMPLEMENTOS" },
        { codigo: "52120", nome: "ELIMINADOR DE SOQUEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "55555", nome: "PLANTIO DE CEREAIS", grupo: "IMPLEMENTOS" },
        { codigo: "85121", nome: "APLICADOR DE VINHAÇA LOCALIZADA", grupo: "IMPLEMENTOS" },
        { codigo: "52220", nome: "ELIMINADOR DE SOQUEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "78120", nome: "PLANTADORA DE TORTA", grupo: "IMPLEMENTOS" },
        { codigo: "44444", nome: "SILAGEM", grupo: "IMPLEMENTOS" },
        { codigo: "69119", nome: "ACEIRADOR", grupo: "IMPLEMENTOS" },
        { codigo: "78220", nome: "PLANTADORA DE TORTA", grupo: "IMPLEMENTOS" },
        { codigo: "57121", nome: "CANTERIZADOR", grupo: "IMPLEMENTOS" },
        { codigo: "26115", nome: "ENFA. PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "26114", nome: "ENFARD. PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "70122", nome: "UNIPORT CASE PATRIOT 250 AFS", grupo: "IMPLEMENTOS" },
        { codigo: "99998", nome: "IMPLEMENTO TRANSBORDO", grupo: "IMPLEMENTOS" },
        {
          codigo: "89123",
          nome: "PLANTADORA DE CANA DMB PCP 6000 AUTOMATIZADA",
          grupo: "IMPLEMENTOS",
        },
        { codigo: "11121", nome: "TRATOR NEW HOLLAND T7", grupo: "IMPLEMENTOS" },
        { codigo: "435", nome: "MOTO BOMBA", grupo: "IMPLEMENTOS" },
        { codigo: "72114", nome: "ENLEIRADEIRA DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "37056", nome: "APLICADOR DE VINHAÇA LOCALIZADA", grupo: "IMPLEMENTOS" },
        { codigo: "200", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "201", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "204", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "83100", nome: "SISTEMA DE IRRIGACAO HIDROHALL", grupo: "IMPLEMENTOS" },
        { codigo: "83216", nome: "SISTEMA DE IRRIGACAO HIDROHALL", grupo: "IMPLEMENTOS" },
        { codigo: "33", nome: "MOTOBOMBA", grupo: "IMPLEMENTOS" },
        { codigo: "203", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "202", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "83101", nome: "CARRETEL ENROLADOR HIDRO ROLL", grupo: "IMPLEMENTOS" },
        { codigo: "83108", nome: "SISTEMA DE IRRIGACAO HIDROHALL", grupo: "IMPLEMENTOS" },
        { codigo: "83116", nome: "SISTEMA DE IRRIGACAO HIDROHALL", grupo: "IMPLEMENTOS" },
        { codigo: "32", nome: "MOTO BOMBA", grupo: "IMPLEMENTOS" },
        { codigo: "34", nome: "MOTO BOMBA", grupo: "IMPLEMENTOS" },
        { codigo: "91", nome: "MOTO BOMBA", grupo: "IMPLEMENTOS" },
        { codigo: "80100", nome: "CARRETEL ENROLADOR HIDRO ROLL", grupo: "IMPLEMENTOS" },
        { codigo: "48", nome: "TRATOR MASSEY FERGUSON", grupo: "IMPLEMENTOS" },
        { codigo: "61123", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "55124", nome: "CULTIVADOR ADUBADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "55224", nome: "CULTIVADOR ADUBADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "85125", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "85225", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "11125", nome: "HERBPLUS", grupo: "IMPLEMENTOS" },
        { codigo: "11225", nome: "HERBPLUS", grupo: "IMPLEMENTOS" },
        { codigo: "11324", nome: "TRAÇÃO", grupo: "IMPLEMENTOS" },
        { codigo: "57325", nome: "CANTERIZADOR", grupo: "IMPLEMENTOS" },
        { codigo: "16667", nome: "CARR. DISTRIBUIDORA/ESPARRAMA", grupo: "IMPLEMENTOS" },
        { codigo: "64118", nome: "ADUBADOR C/ APLICAÇÃO DE INSETI", grupo: "IMPLEMENTOS" },
        { codigo: "533", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
        { codigo: "418", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
        { codigo: "60116", nome: "PA CARREGADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "60120", nome: "PA CARREGADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "85120", nome: "APLICADOR DE FERTILIZANTE LIQUIDO", grupo: "IMPLEMENTOS" },
        { codigo: "85220", nome: "APLICADOR DE FERTILIZANTE LIQUIDO", grupo: "IMPLEMENTOS" },
        { codigo: "55924", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "85224", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "85324", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "80325", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "70121", nome: "PULVERIZADOR AUTOPROPELIDO M4025", grupo: "IMPLEMENTOS" },
        { codigo: "11424", nome: "TRAÇÃO", grupo: "IMPLEMENTOS" },
        { codigo: "11216", nome: "TRAÇÃO", grupo: "IMPLEMENTOS" },
        { codigo: "661", nome: "SULCADOR", grupo: "IMPLEMENTOS" },
        { codigo: "313", nome: "PÁ CARREGADEIRA NEW HOLLAND W 160", grupo: "IMPLEMENTOS" },
        { codigo: "11118", nome: "TRATOR COM PV DE ARRASTO", grupo: "IMPLEMENTOS" },
        { codigo: "523", nome: "ADUBADOR C/ APLICAÇÃO DE INSETI", grupo: "IMPLEMENTOS" },
        { codigo: "135", nome: "CULTIVADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "709", nome: "ENLEIRADOR DE PALHA", grupo: "IMPLEMENTOS" },
        { codigo: "55118", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "412", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "76", nome: "MARCADOR DE PLANTIO", grupo: "IMPLEMENTOS" },
        { codigo: "333", nome: "VALETADOR", grupo: "IMPLEMENTOS" },
        { codigo: "543", nome: "PÁ CARREGADEIRA NEW HOLLAND W 130 ZB", grupo: "IMPLEMENTOS" },
        { codigo: "68217", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "53118", nome: "GRADE INTERMEDIÁRIA", grupo: "IMPLEMENTOS" },
        { codigo: "438", nome: "GRADE NIVELADORA", grupo: "IMPLEMENTOS" },
        { codigo: "61118", nome: "PULVERIZADOR - IMPL", grupo: "IMPLEMENTOS" },
        { codigo: "15922", nome: "SUBSOLADOR", grupo: "IMPLEMENTOS" },
        { codigo: "121", nome: "ROÇADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "99999", nome: "IMPLEMENTO COLHEDORA", grupo: "IMPLEMENTOS" },
        { codigo: "71", nome: "COBRIDOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "428", nome: "CULTIVADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "85", nome: "GRADE ARADORA", grupo: "IMPLEMENTOS" },
        { codigo: "532", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
        { codigo: "537", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
        { codigo: "417", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
        { codigo: "60121", nome: "PA CARREGADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "60118", nome: "PA CARREGADEIRA", grupo: "IMPLEMENTOS" },
        { codigo: "85126", nome: "APLICADOR DE VINHACA LOCALIZADA", grupo: "IMPLEMENTOS" },
        { codigo: "55324", nome: "CULTIVADOR ADUBADOR DE CANA", grupo: "IMPLEMENTOS" },
        { codigo: "85124", nome: "APLICADOR DE VINHACA", grupo: "IMPLEMENTOS" },
        { codigo: "55424", nome: "KIT QUEBRA LOMBO", grupo: "IMPLEMENTOS" },
        { codigo: "535", nome: "TRATOR VALTRA", grupo: "IMPLEMENTOS" },
      ];

      const batch = writeBatch(db);
      let addedCount = 0;
      initialData.forEach((item) => {
        if (!existingCodes.has(item.codigo)) {
          const docRef = doc(collection(db, "equipamentos"));
          batch.set(docRef, {
            codigo: item.codigo,
            nome: item.nome,
            tipo: item.grupo,
            status: "DISPONÍVEL",
            createdAt: new Date(),
          });
          addedCount++;
        }
      });

      if (addedCount === 0) {
        toast.info("Nenhum equipamento novo para importar.");
        return;
      }

      await batch.commit();
      toast.success(`${addedCount} equipamentos importados com sucesso`);
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
