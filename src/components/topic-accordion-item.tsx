"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ExternalLink, Eye, EyeOff, Pencil } from "lucide-react";
import { TopicEditDialog } from "@/components/topic-edit-dialog";
import { toggleTopicVisibility } from "@/app/(app)/programacion/actions";

interface TopicLink {
  label: string;
  url: string;
}

interface Props {
  topic: { number: number; title: string };
  topicContent: {
    content: string;
    links: TopicLink[];
    visible: boolean;
  } | null;
  completed?: { notes: string; date: string } | null;
  userRole: string;
}

export function TopicAccordionItem({ topic, topicContent, completed, userRole }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isCompleted = !!completed;
  const isSupervisor = userRole === "SUPERVISOR";
  const isHidden = topicContent?.visible === false;
  const hasContent = topicContent && (topicContent.content.trim() || topicContent.links.length > 0);

  async function handleToggleVisibility() {
    const formData = new FormData();
    formData.set("topicNumber", String(topic.number));
    formData.set("visible", isHidden ? "true" : "false");
    await toggleTopicVisibility(formData);
  }

  return (
    <>
      <Card
        className={`border-none transition-all ${
          isHidden && isSupervisor ? "opacity-50" : ""
        } ${
          isCompleted
            ? "shadow-[0_4px_16px_rgba(2,36,72,0.04)] bg-[#1e3a5f]/5 border-l-4 border-l-[#1e3a5f]"
            : "shadow-[0_4px_16px_rgba(2,36,72,0.04)] hover:shadow-[0_8px_24px_rgba(2,36,72,0.08)]"
        }`}
      >
        <CardHeader className="py-4">
          <div className="flex items-start gap-4">
            {/* Number / Check icon */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0 ${
                isCompleted
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
              }`}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : topic.number}
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase tracking-wider ${
                    isCompleted ? "border-[#1e3a5f]/30 text-[#1e3a5f]" : ""
                  }`}
                >
                  Tema {topic.number}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-[#1e3a5f]/10 text-[#1e3a5f] hover:bg-[#1e3a5f]/15 text-[10px]">
                    Completado
                  </Badge>
                )}
                {isHidden && isSupervisor && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">Oculto</Badge>
                )}
              </div>

              {/* Clickable title area */}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <CardTitle className="text-sm font-semibold text-[#022448] group-hover:text-[#1e3a5f] transition-colors">
                  {topic.title}
                </CardTitle>
                {hasContent && (
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Completion notes (mentor) */}
              {isCompleted && completed.notes && !expanded && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                  {completed.notes}
                </p>
              )}

              {/* Expanded content */}
              {expanded && hasContent && (
                <div className="mt-3 space-y-3 border-t pt-3">
                  {topicContent!.content.trim() && (
                    <p className="text-sm text-[#43474e] whitespace-pre-line">
                      {topicContent!.content}
                    </p>
                  )}
                  {topicContent!.links.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Recursos
                      </p>
                      {topicContent!.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#1e3a5f] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {link.label || link.url}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded but no content */}
              {expanded && !hasContent && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm text-muted-foreground italic">
                    {isSupervisor ? 'Sin contenido aún. Haz clic en "Editar" para agregar.' : "Sin contenido disponible."}
                  </p>
                </div>
              )}
            </div>

            {/* Supervisor action buttons */}
            {isSupervisor && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleToggleVisibility}
                  title={isHidden ? "Mostrar tema" : "Ocultar tema"}
                >
                  {isHidden ? (
                    <EyeOff className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditOpen(true)}
                  title="Editar contenido"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Edit dialog (supervisor only) */}
      {isSupervisor && (
        <TopicEditDialog
          topicNumber={topic.number}
          topicTitle={topic.title}
          initialContent={topicContent?.content ?? ""}
          initialLinks={(topicContent?.links ?? []) as TopicLink[]}
          initialVisible={topicContent?.visible ?? true}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
