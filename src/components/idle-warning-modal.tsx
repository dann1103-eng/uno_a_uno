"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IdleWarningModalProps {
  isOpen: boolean;
  countdown: number;
  onContinue: () => void;
}

export function IdleWarningModal({ isOpen, countdown, onContinue }: IdleWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>¿Sigues ahí?</DialogTitle>
          <DialogDescription>
            Tu sesión se cerrará automáticamente por inactividad.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-4xl font-bold tabular-nums text-foreground">
            {countdown}
          </p>
          <p className="text-sm text-muted-foreground">
            {countdown === 1 ? "segundo restante" : "segundos restantes"}
          </p>
          <Button className="w-full" onClick={onContinue}>
            Seguir conectado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
