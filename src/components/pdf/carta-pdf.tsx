import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface CartaPDFProps {
  title: "CARTA DE CONSTANCIA" | "CARTA DE RECOMENDACIÓN";
  body: string;
  signerName: string;
  signerTitle: string;
  date: string; // formatted as "9 de mayo de 2026", rendered as "Guatemala, [date]"
}

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 12,
    marginBottom: 16,
  },
  programName: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    color: "#1e3a5f",
    letterSpacing: 1,
    marginBottom: 3,
  },
  programSubtitle: {
    fontSize: 9,
    color: "#64748b",
  },
  date: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 12,
  },
  letterTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#1e3a5f",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    textAlign: "justify",
    marginBottom: 10,
  },
  signatureBlock: {
    marginTop: 48,
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
    width: 200,
    marginBottom: 6,
  },
  signerName: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    textAlign: "center",
  },
  signerTitle: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },
  signerProgram: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 1,
  },
});

export function CartaPDF({ title, body, signerName, signerTitle, date }: CartaPDFProps) {
  // Split body into paragraphs for individual <Text> rendering
  const paragraphs = body.split("\n\n").filter((p) => p.trim().length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.programName}>PROGRAMA DE MENTORÍA UNO A UNO</Text>
          <Text style={styles.programSubtitle}>Programa de Voluntariado Formativo</Text>
        </View>

        {/* Date */}
        <Text style={styles.date}>Guatemala, {date}</Text>

        {/* Letter title */}
        <Text style={styles.letterTitle}>{title}</Text>

        {/* Body paragraphs */}
        {paragraphs.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph.trim()}
          </Text>
        ))}

        {/* Signature */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signerName}>{signerName}</Text>
          <Text style={styles.signerTitle}>{signerTitle}</Text>
          <Text style={styles.signerProgram}>Programa de Mentoría Uno a Uno</Text>
        </View>
      </Page>
    </Document>
  );
}
