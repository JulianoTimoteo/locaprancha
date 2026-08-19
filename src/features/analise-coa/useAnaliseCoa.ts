import { useState, useMemo } from "react";
import { Reserva } from "@/types";
import * as XLSX from "xlsx";

export interface CoaRecord {
  frota: string;
  data: string;
  origem: string;
  destino: string;
  status: string;
  kms?: number;
  horas?: number;
  consumo?: number;
}

export function useAnaliseCoa(_data: Reserva[]) {
  const [importedData, setImportedData] = useState<CoaRecord[]>([]);

  // 1:1 Functional Migration: Calculations from AnaliseCOA_V20
  const stats = useMemo(() => {
    const combined = [...importedData];

    const totalViagens = combined.length;
    const totalKms = combined.reduce((acc, curr) => acc + (curr.kms || 0), 0);
    const avgConsumo =
      combined.length > 0
        ? combined.reduce((acc, curr) => acc + (curr.consumo || 0), 0) / combined.length
        : 0;

    return {
      totalViagens,
      totalKms,
      avgConsumo,
      records: combined,
    };
  }, [importedData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== "string") return;

      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      if (!wsname) return;

      const ws = wb.Sheets[wsname];
      if (!ws) return;

      const rawJson = XLSX.utils.sheet_to_json(ws);

      // Strict 1:1 Mapping logic
      const mapped: CoaRecord[] = rawJson.map((row: any) => ({
        frota: String(row["Frota"] || row["FROTA"] || ""),
        data: String(row["Data"] || row["DATA"] || ""),
        origem: String(row["Origem"] || row["ORIGEM"] || ""),
        destino: String(row["Destino"] || row["DESTINO"] || ""),
        status: String(row["Status"] || row["STATUS"] || "Finalizado"),
        kms: Number(row["Km"] || row["KM"] || 0),
        horas: Number(row["Horas"] || row["HORAS"] || 0),
        consumo: Number(row["Consumo"] || row["CONSUMO"] || 0),
      }));

      setImportedData(mapped);
    };
    reader.readAsBinaryString(file);
  };

  return {
    stats,
    handleFileUpload,
  };
}
