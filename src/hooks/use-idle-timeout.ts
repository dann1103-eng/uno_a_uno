"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";

interface UseIdleTimeoutOptions {
  idleMinutes: number;
  warningSeconds: number;
}

export function useIdleTimeout({ idleMinutes, warningSeconds }: UseIdleTimeoutOptions) {
  const [isWarning, setIsWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningSeconds);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startCountdown = useCallback(() => {
    setIsWarning(true);
    setCountdown(warningSeconds);

    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!);
          signOut({ callbackUrl: "/login" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningSeconds]);

  const reset = useCallback(() => {
    clearTimers();
    setIsWarning(false);
    setCountdown(warningSeconds);

    idleTimer.current = setTimeout(() => {
      startCountdown();
    }, (idleMinutes * 60 - warningSeconds) * 1000);
  }, [clearTimers, startCountdown, idleMinutes, warningSeconds]);

  useEffect(() => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    const handleActivity = () => {
      if (!isWarning) reset();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity));
    reset();

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWarning]);

  return { isWarning, countdown, reset };
}
