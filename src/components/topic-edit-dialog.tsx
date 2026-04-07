"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { saveTopicContent } from "@/app/(app)/programacion/actions";

interface TopicLink {
  label: string;
  url: string;
}

interface Props {
  topicNumber: number;
  topicTitle: string;
  initialContent: string;
  initialLinks: TopicLink[];
  initialVisible: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopicEditDialog({
  topicNumber,
  topicTitle,
  initialContent,
  initialLinks,
  initialVisible,
  open,
  onOpenChange,
}: Props) {
  const [links, setLinks] = useState<TopicLink[]>(initialLinks);
  const [visible, setVisible] = useState(initialVisible);

  function addLink() {
    setLinks([...links, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  }

  async function handleSubmit(formData: FormData) {
    formData.set("links", JSON.stringify(links.filter((l) => l.url.trim())));
    formData.set("visible", visible ? "true" : "false");
    await saveTopicContent(formData);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Editar Tema {topicNumber}: {topicTitle}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="topicNumber" value={topicNumber} />

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenido / Instrucciones</Label>
            <Textarea
              id="content"
              name="content"
              rows={5}
              defaultValue={initialContent}
              placeholder="Descripción del tema, puntos clave, instrucciones para el mentor..."
            />
          </div>

          {/* Links */}
          <div className="space-y-2">
            <Label>Enlaces a recursos</Label>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Nombre"
                  value={link.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  className="flex-[2]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLink(i)}
                  className="shrink-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar enlace
            </Button>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="visible-check"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="visible-check" className="font-normal">
              Visible para mentores y suplentes
            </Label>
          </div>

          <Button type="submit" className="w-full">
            Guardar cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
