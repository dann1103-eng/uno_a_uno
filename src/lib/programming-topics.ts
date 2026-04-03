export type ProgrammingTopicItem =
  | { type: "topic"; number: number; title: string }
  | { type: "break"; label: string };

export const PROGRAMMING_TOPICS: ProgrammingTopicItem[] = [
  { type: "topic", number: 1, title: "La Prudencia" },
  { type: "topic", number: 2, title: "La Fortaleza" },
  { type: "topic", number: 3, title: "La Templanza" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 4, title: "La Humildad" },
  { type: "topic", number: 5, title: "Sinceridad y Veracidad" },
  { type: "topic", number: 6, title: "Sencillez y Serenidad" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 7, title: "Higiene y Limpieza. Castidad" },
  { type: "topic", number: 8, title: "Orden: material, cívico, ecológico" },
  { type: "topic", number: 9, title: "Esperanza. Optimismo. Espíritu deportivo. Magnanimidad" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 10, title: "Laboriosidad. Aprovechamiento del tiempo. Puntualidad" },
  { type: "topic", number: 11, title: "Reciedumbre. Paciencia" },
  { type: "topic", number: 12, title: "Constancia. Perseverancia" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 13, title: "Sentido del Deber" },
  { type: "topic", number: 14, title: "Iniciativa, Ingenio. Audacia" },
  { type: "topic", number: 15, title: "Egoísmo vs Altruismo. Caridad. Espíritu de Servicio" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 16, title: "Justicia. Tolerancia. Intolerancia+. Civismo" },
  { type: "topic", number: 17, title: "Compañerismo. Lealtad. Solidaridad. Amabilidad." },
  { type: "topic", number: 18, title: "Respeto. Comprensión. Perdón" },
  { type: "break", label: "CATEQUESIS" },
  { type: "topic", number: 19, title: "Colaboración. Agradecimiento" },
  { type: "topic", number: 20, title: "Amistad. Fidelidad" },
  { type: "topic", number: 21, title: "Obediencia. Pequeños servicios y encargos. Talante positivo" },
  { type: "break", label: "EVENTO DE CIERRE" },
];

/** Only the actual topics (no breaks) */
export const TOPIC_ITEMS = PROGRAMMING_TOPICS.filter(
  (item): item is Extract<ProgrammingTopicItem, { type: "topic" }> => item.type === "topic"
);
