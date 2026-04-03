"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type MetricsData = {
  discipline: number;
  responsibility: number;
  study: number;
  relationships: number;
  family: number;
  piety: number;
};

export function MetricsRadarChart({ metrics }: { metrics: MetricsData }) {
  const data = [
    { subject: "Disciplina", value: metrics.discipline },
    { subject: "Responsabilidad", value: metrics.responsibility },
    { subject: "Estudio", value: metrics.study },
    { subject: "Relaciones", value: metrics.relationships },
    { subject: "Familia", value: metrics.family },
    { subject: "Piedad", value: metrics.piety },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
        <Radar
          name="Métricas"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
        />
        <Tooltip
          formatter={(value) => [
            typeof value === "number" ? value.toFixed(1) : value,
            "Puntaje",
          ]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
