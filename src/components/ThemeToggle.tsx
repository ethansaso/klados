import { IconButton } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { PiMoon, PiSun } from "react-icons/pi";
import { themeQueryOptions } from "../lib/queries/theme";
import { setThemeFn } from "../lib/server-fns/theme/setThemeFn";
import { ResponsiveTooltip } from "./ResponsiveTooltip";

type ThemeToggleProps = {
  className?: string;
  style?: CSSProperties;
};

export function ThemeToggle({ className, style }: ThemeToggleProps) {
  const queryClient = useQueryClient();
  const options = themeQueryOptions();
  const { data: theme } = useSuspenseQuery(options);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    // set optimistically, since cookie won't trigger query update
    queryClient.setQueryData(options.queryKey, next);
    void setThemeFn({ data: { theme: next } });
  };

  return (
    <ResponsiveTooltip content="Toggle theme">
      <IconButton
        className={className}
        style={style}
        variant="ghost"
        color="gray"
        size="2"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <PiMoon /> : <PiSun />}
      </IconButton>
    </ResponsiveTooltip>
  );
}
