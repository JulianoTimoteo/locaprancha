import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcularDuracaoOperacao, formatarDuracao } from "@/lib/utils/reservaFormatting";

interface OperationalReportData {
  titulo: string;
  periodoInicio: string;
  periodoFim: string;
  usuario: {
    nome: string;
    nickname?: string | undefined;
  };

  resumo: {
    total: number;
    finalizadas: number;
    finalizadasPercent: string | number;
    emAndamento: number;
    canceladas: number;
    canceladasPercent: string | number;
    emOficina: number;
    totalHoras: string | number;
    usuariosDistintos: number;
    equipamentosDistintos: number;
    frentesDistintas: number;
  };
  operacoes: any[];
  oficina: any[];
  oficinaOps?: any[];
  totalOficinaOps?: number;
}

export const generateOperationalReportPdf = (data: OperationalReportData) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  const addHeader = () => {
    doc.setFillColor(64, 128, 12);
    doc.rect(0, 0, pageWidth, 14, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LOCAPRANCHA", margin, 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("USINA PITANGUEIRAS", pageWidth - margin, 10, { align: "right" });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RELATORIO OPERACIONAL", margin, 24);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const emissionDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
    doc.text(`Emissao: ${emissionDate}`, pageWidth - margin, 24, { align: "right" });

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 27, pageWidth - margin, 27);
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("LOCAPRANCHA - USINA PITANGUEIRAS | Relatorio Operacional", margin, pageHeight - 8);
    doc.text(`Pag ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  addHeader();

  let currentY = 31;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("RESPONSAVEL:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(data.usuario.nome || "Nao informado", margin + 30, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("PERIODO:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(`${data.periodoInicio} ate ${data.periodoFim}`, margin + 30, currentY);

  currentY += 10;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 30, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 128, 12);
  doc.text("RESUMO OPERACIONAL", margin + 3, currentY + 6);

  const col1 = margin + 5;
  const col2 = margin + 60;
  const col3 = margin + 120;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  doc.text(`Total: ${data.resumo.total}`, col1, currentY + 13);
  doc.text(
    `Finalizadas: ${data.resumo.finalizadas} (${data.resumo.finalizadasPercent}%)`,
    col1,
    currentY + 18,
  );
  doc.text(`Em Andamento: ${data.resumo.emAndamento}`, col1, currentY + 23);
  doc.text(
    `Canceladas: ${data.resumo.canceladas} (${data.resumo.canceladasPercent}%)`,
    col2,
    currentY + 13,
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 0, 0);
  doc.text(`Em Oficina: ${data.resumo.emOficina}`, col2, currentY + 28);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Horas: ${data.resumo.totalHoras}h`, col2, currentY + 18);
  doc.text(`Usuarios: ${data.resumo.usuariosDistintos}`, col2, currentY + 23);
  doc.text(`Frotas: ${data.resumo.equipamentosDistintos}`, col3, currentY + 13);
  doc.text(`Frentes: ${data.resumo.frentesDistintas}`, col3, currentY + 18);

  currentY += 35;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("DETALHAMENTO DAS OPERACOES", margin, currentY);

  const tableRows = data.operacoes.map((op) => [
    `${op.data || "N/A"} ${op.hora || op.horarioRetirada || "N/A"}`,
    op.pranchaId || "N/A",
    op.frenteTrabalho || op.frenteId || "N/A",
    `${op.origem || "N/A"} -> ${op.destino || "N/A"}`,
    op.solicitanteNome || "N/A",
    formatarDuracao(calcularDuracaoOperacao(op)) || "N/A",
    op.status || "N/A",
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [
      ["Data/Hora", "Frota", "Frente", "Origem -> Destino", "Solicitante", "Duracao", "Status"],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [64, 128, 12],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 16 },
      2: { cellWidth: 20 },
      3: { cellWidth: 40 },
      4: { cellWidth: 26 },
      5: { cellWidth: 16 },
      6: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      addFooter(data.pageNumber as number);
    },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;

  if (data.oficina && data.oficina.length > 0 && lastTableY < pageHeight - 35) {
    const oficinaY = lastTableY + 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 0, 0);
    doc.text("FROTA EM OFICINA", margin, oficinaY);

    const oficinaRows = data.oficina
      .filter((op: any) => op && op.pranchaId)
      .map((op: any) => [
        `${op.data || "N/A"} ${op.hora || "--:--"}`,
        op.pranchaId || "N/A",
        op.solicitanteNome || "N/A",
        op.duracaoHoras != null ? `${op.duracaoHoras}h` : "N/A",
        op.status || "OFICINA",
      ]);

    if (oficinaRows.length === 0) return doc;

    autoTable(doc, {
      startY: oficinaY + 4,
      head: [["Data/Hora", "Frota", "Justificativa", "Tempo (h)", "Status"]],
      body: oficinaRows,
      theme: "grid",
      headStyles: {
        fillColor: [180, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 1.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        2: { cellWidth: 32 },
        3: { cellWidth: 20 },
        4: { cellWidth: 16 },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        addFooter(data.pageNumber as number);
      },
    });
  } else if (
    data.totalOficinaOps &&
    data.totalOficinaOps > 0 &&
    data.oficinaOps &&
    data.oficinaOps.length > 0 &&
    lastTableY < pageHeight - 50
  ) {
    const oficinaY = lastTableY + 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 0, 0);
    doc.text("OPERACOES DE OFICINA", margin, oficinaY);

    const oficinaRows = data.oficinaOps.map((op: any) => [
      `${op.data || "N/A"} ${op.hora || "N/A"}`,
      op.pranchaId || "N/A",
      op.frenteTrabalho || "N/A",
      op.status || "N/A",
      `${op.origem || "N/A"} -> ${op.destino || "N/A"}`,
    ]);

    autoTable(doc, {
      startY: oficinaY + 4,
      head: [["Data/Hora", "Frota", "Frente", "Status", "Origem -> Destino"]],
      body: oficinaRows,
      theme: "grid",
      headStyles: {
        fillColor: [180, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 1.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 44 },
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        addFooter(data.pageNumber as number);
      },
    });
  }

  addFooter(1);

  return doc;
};
