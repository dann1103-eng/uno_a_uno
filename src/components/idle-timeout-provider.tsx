"use client";

import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { IdleWarningModal } from "@/components/idle-warning-modal";

export function IdleTimeoutProvider() {
  const { isWarning, countdown, reset } = useIdleTimeout({
    idleMinutes: 10,
    warningSeconds: 60,
  });

  return (
    <IdleWarningModal
      isOpen={isWarning}
      countdown={countdown}
      onContinue={reset}
    />
  );
}
