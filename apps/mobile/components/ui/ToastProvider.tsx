import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Toast } from "./Toast";

export type ToastAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export type ToastPayload =
  | string
  | {
      title?: string;
      message: string;
      duration?: number;
      actions?: ToastAction[];
    };

type ToastState = {
  visible: boolean;
  title?: string;
  message: string;
  actions?: ToastAction[];
};

type ToastApi = {
  showToast: (payload: ToastPayload, durationMs?: number) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

type Props = {
  children: React.ReactNode;
  defaultDurationMs?: number;
};

export function ToastProvider({ children, defaultDurationMs = 3000 }: Props) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    setToast((t) => (t.visible ? { ...t, visible: false } : t));
  }, [clearTimer]);

  const showToast = useCallback(
    (payload: ToastPayload, durationMs?: number) => {
      clearTimer();

      if (typeof payload === "string") {
        setToast({
          visible: true,
          message: payload,
        });

        timerRef.current = setTimeout(
          hideToast,
          durationMs ?? defaultDurationMs
        );
        return;
      }

      setToast({
        visible: true,
        title: payload.title,
        message: payload.message,
        actions: payload.actions,
      });

      const d = payload.duration ?? durationMs ?? defaultDurationMs;
      timerRef.current = setTimeout(hideToast, d);
    },
    [clearTimer, hideToast, defaultDurationMs]
  );

  useEffect(() => clearTimer, [clearTimer]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        actions={toast.actions}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
