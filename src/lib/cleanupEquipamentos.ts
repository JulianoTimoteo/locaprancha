import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function cleanupEquipamentos(): Promise<number> {
  console.log("Iniciando faxina de equipamentos...");
  const equipRef = collection(db, "equipamentos");
  const snapshot = await getDocs(equipRef);

  if (snapshot.empty) {
    console.log("Nenhum equipamento encontrado.");
    return 0;
  }

  const seen = new Set<string>();
  const toDelete: string[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Identificador único: código + descrição + tipo (grupo)
    const key = `${data.codigo || ""}|${data.nome || ""}|${data.tipo || ""}`.toLowerCase().trim();

    if (seen.has(key)) {
      toDelete.push(doc.id);
    } else {
      seen.add(key);
    }
  });

  if (toDelete.length > 0) {
    console.log(`Removendo ${toDelete.length} duplicados...`);

    // Deletar em lotes de 500 (limite do Firestore)
    for (let i = 0; i < toDelete.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = toDelete.slice(i, i + 500);
      chunk.forEach((id) => {
        batch.delete(doc(db, "equipamentos", id));
      });
      await batch.commit();
    }

    console.log("Faxina concluída com sucesso!");
    return toDelete.length;
  } else {
    console.log("Nenhum duplicado encontrado.");
    return 0;
  }
}
