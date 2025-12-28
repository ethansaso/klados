import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  duration: number;
  variant: ToastVariant;
}

type ToastInput = Partial<Omit<ToastItem, "id" | "title" | "variant">> & {
  title?: string;
  variant?: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  add: (t: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
};

function resolveDefaults(toast: ToastInput): Omit<ToastItem, "id"> {
  const variant = toast.variant ?? "default";

  // sensible title defaults
  const title =
    toast.title ??
    (variant === "success"
      ? "Success"
      : variant === "error"
        ? "Error"
        : "Notification");

  return {
    title,
    description: toast.description,
    duration: toast.duration ?? 5000,
    variant,
  };
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add: (toast) => {
    const id = crypto.randomUUID();
    const item = { id, ...resolveDefaults(toast) };
    set((s) => ({ toasts: [...s.toasts, item] }));
    return id;
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

/** Adds a toast notification. */
export function toast(input: ToastInput) {
  const resolvedInput = resolveDefaults(input);
  return useToastStore.getState().add(resolvedInput);
}
