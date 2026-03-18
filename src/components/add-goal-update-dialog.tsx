"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addGoalUpdate } from "@/app/(app)/metas/actions";

export function AddGoalUpdateDialog({ goalId }: { goalId: string }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await addGoalUpdate(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-xs h-7">
            + Agregar actualización
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar actualización</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="goalId" value={goalId} />
          <div className="space-y-2">
            <Label htmlFor="progressNote">Nota de progreso</Label>
            <Textarea
              id="progressNote"
              name="progressNote"
              rows={4}
              placeholder="Describe el avance en esta meta..."
              required
            />
          </div>
          <Button type="submit" className="w-full">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
