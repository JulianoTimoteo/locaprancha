import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    totalHoras: string | number;
    usuariosDistintos: number;
    equipamentosDistintos: number;
    frentesDistintas: number;
  };
  operacoes: any[];
}

export const generateOperationalReportPdf = (data: OperationalReportData) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const addHeader = (pageNum: number, totalPages?: number) => {
    // Top Bar - Primary Green Pitangueiras
    doc.setFillColor(64, 128, 12); // #40800c
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LOCAPRANCHA", margin, 13);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("USINA PITANGUEIRAS", pageWidth - margin, 13, { align: "right" });

    // Header Content
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO OPERACIONAL", margin, 32);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const emissionDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
    doc.text(`Emissão: ${emissionDate}`, pageWidth - margin, 32, { align: "right" });

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 36, pageWidth - margin, 36);
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("LOCAPRANCHA — USINA PITANGUEIRAS | Relatório Operacional", margin, pageHeight - 10);
    doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  };

  // --- Page 1 ---
  addHeader(1);

  let currentY = 45;

  // Identification
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("RESPONSÁVEL:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.usuario.nome || "Não informado", margin + 30, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("PERÍODO:", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.periodoInicio} até ${data.periodoFim}`, margin + 30, currentY);

  currentY += 15;

  // Resumo Executivo
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 40, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(64, 128, 12);
  doc.text("RESUMO OPERACIONAL", margin + 5, currentY + 7);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);

  const col1 = margin + 5;
  const col2 = margin + 65;
  const col3 = margin + 125;

  doc.text(`Total de Operações: ${data.resumo.total}`, col1, currentY + 17);
  doc.text(
    `Finalizadas: ${data.resumo.finalizadas} (${data.resumo.finalizadasPercent}%)`,
    col1,
    currentY + 24,
  );
  doc.text(`Em Andamento: ${data.resumo.emAndamento}`, col1, currentY + 31);

  doc.text(
    `Canceladas: ${data.resumo.canceladas} (${data.resumo.canceladasPercent}%)`,
    col2,
    currentY + 17,
  );
  doc.text(`Horas Totais: ${data.resumo.totalHoras}h`, col2, currentY + 24);
  doc.text(`Usuários: ${data.resumo.usuariosDistintos}`, col2, currentY + 31);

  doc.text(`Frotas Atendidas: ${data.resumo.equipamentosDistintos}`, col3, currentY + 17);
  doc.text(`Frentes: ${data.resumo.frentesDistintas}`, col3, currentY + 24);

  currentY += 55;

  // Tabela de Operações
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("DETALHAMENTO DAS OPERAÇÕES", margin, currentY);

  const tableRows = data.operacoes.map((op) => [
    op.data || "N/A",
    op.hora || op.horarioRetirada || "N/A",
    op.pranchaId || "N/A",
    op.frenteId || "N/A",
    op.solicitanteNome || "N/A",
    op.origem || "N/A",
    op.destino || "N/A",
    op.status || "N/A",
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Data", "Hora", "Frota", "Frente", "Usuário", "Origem", "Destino", "Status"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [64, 128, 12],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 12 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
      7: { cellWidth: 20 },
    },
    margin: { top: 40, bottom: 20 },
    didDrawPage: (data) => {
      // For pages > 1, add header and footer
      if (data.pageNumber > 1) {
        addHeader(data.pageNumber);
      }
      addFooter(data.pageNumber);
    },
  });

  // Final Summary on last page
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  if (finalY < pageHeight - 40) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINAL", margin, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `O relatório apresenta um total de ${data.resumo.total} operações no período selecionado.`,
      margin,
      finalY + 7,
    );
  }

  addFooter(1);

  return doc;
};
