import { createToastSystem } from "headless-toast";

export const { toast, useToastStore } = createToastSystem({
  variants: ["default", "success", "error"] as const,
});
