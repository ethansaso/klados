import { TextField } from "@radix-ui/themes";
import * as React from "react";
import { useDebouncedCallback } from "use-debounce";

type Props = Omit<React.ComponentProps<typeof TextField.Root>, "value"> & {
  value: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
};

export function DebouncedTextField({
  value,
  onDebouncedChange,
  delay = 200,
  children,
  ...rest
}: Props) {
  const [local, setLocal] = React.useState(value);

  // Keep local in sync if the prop changes externally
  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const debounced = useDebouncedCallback((v: string) => {
    onDebouncedChange(v);
  }, delay);

  // Clean up on unmount
  React.useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setLocal(v);
    debounced(v);
  };

  const commitNow = (v: string) => {
    // prevent double fire: cancel any pending debounce, then emit immediately exactly once
    debounced.cancel();
    onDebouncedChange(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitNow((e.currentTarget as HTMLInputElement).value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commitNow((e.currentTarget as HTMLInputElement).value);
  };

  return (
    <TextField.Root
      value={local}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      {...rest}
    >
      {children}
    </TextField.Root>
  );
}
