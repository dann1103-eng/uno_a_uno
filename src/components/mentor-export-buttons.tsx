"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface SessionRow {
  date: string;
  studentName: string;
  topic: string;
}

interface Props {
  mentorName: string;
  sessions: SessionRow[];
}

const HOURS_PER_SESSION = 3;

// PDF styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1c1e" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1e3a5f", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#43474e", marginBottom: 2 },
  generatedAt: { fontSize: 9, color: "#888", marginTop: 4 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", padding: 8, borderRadius: 2 },
  tableHeaderCell: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tableRow: { flexDirection: "row", padding: 7, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tableRowAlt: { flexDirection: "row", padding: 7, backgroundColor: "#f8f9fa", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  cell: { fontSize: 9, color: "#1a1c1e" },
  colDate: { width: "18%" },
  colStudent: { width: "30%" },
  colTopic: { width: "42%" },
  colHours: { width: "10%", textAlign: "right" },
  totalRow: { flexDirection: "row", padding: 8, backgroundColor: "#eec058", marginTop: 2, borderRadius: 2 },
  totalLabel: { width: "90%", fontFamily: "Helvetica-Bold", fontSize: 10, color: "#1e3a5f" },
  totalValue: { width: "10%", fontFamily: "Helvetica-Bold", fontSize: 10, color: "#1e3a5f", textAlign: "right" },
  signatures: { marginTop: 48 },
  signatureTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e3a5f", marginBottom: 20 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  signatureBlock: { width: "45%" },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#1a1c1e", marginBottom: 6 },
  signatureLabel: { fontSize: 9, color: "#43474e" },
});

function MentorReportPDF({ mentorName, sessions }: Props) {
  const totalHours = sessions.length * HOURS_PER_SESSION;
  const generatedDate = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Sesiones</Text>
          <Text style={styles.subtitle}>Tutor: {mentorName}</Text>
          <Text style={styles.generatedAt}>Generado el {generatedDate}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Fecha</Text>
            <Text style={[styles.tableHeaderCell, styles.colStudent]}>Alumno</Text>
            <Text style={[styles.tableHeaderCell, styles.colTopic]}>Tema</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Hrs</Text>
          </View>
          {sessions.map((s, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.cell, styles.colDate]}>{s.date}</Text>
              <Text style={[styles.cell, styles.colStudent]}>{s.studentName}</Text>
              <Text style={[styles.cell, styles.colTopic]}>{s.topic}</Text>
              <Text style={[styles.cell, styles.colHours]}>{HOURS_PER_SESSION}h</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total horas acumuladas</Text>
            <Text style={styles.totalValue}>{totalHours}h</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <Text style={styles.signatureTitle}>Firmas de conformidad</Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}><Text> </Text></View>
              <Text style={styles.signatureLabel}>Firma del Supervisor</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}><Text> </Text></View>
              <Text style={styles.signatureLabel}>Firma del Alumno</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function MentorExportButtons({ mentorName, sessions }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(false);

  const safeName = mentorName.replace(/\s+/g, "-").toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];

  const handleExportExcel = () => {
    const rows = [
      ["Fecha", "Alumno", "Tema", "Horas"],
      ...sessions.map((s) => [s.date, s.studentName, s.topic, HOURS_PER_SESSION]),
      ["", "", "Total horas", sessions.length * HOURS_PER_SESSION],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 44 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sesiones");
    XLSX.writeFile(wb, `reporte-${safeName}-${dateStr}.xlsx`);
  };

  const handleExportPdf = async () => {
    setLoadingPdf(true);
    try {
      const blob = await pdf(<MentorReportPDF mentorName={mentorName} sessions={sessions} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${safeName}-${dateStr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Descargar Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={loadingPdf}>
        <FileText className="h-4 w-4 mr-2" />
        {loadingPdf ? "Generando..." : "Descargar PDF"}
      </Button>
    </div>
  );
}
