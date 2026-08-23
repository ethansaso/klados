import { TextField } from "@radix-ui/themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type Props = Omit<
  React.ComponentProps<typeof TextField.Root>,
  "value" | "onChange"
> & {
  initialValue: string;
  onDebouncedChange: (value: string) => void;
};

const DEBOUNCE_DELAY = 300;

export const DebouncedTextField = ({
  initialValue,
  onDebouncedChange,
  children,
  ...rest
}: Props) => {
  const [qInput, setQInput] = useState(initialValue);

  const onDebouncedChangeRef = useRef(onDebouncedChange);
  onDebouncedChangeRef.current = onDebouncedChange;

  const commit = useCallback(
    (q: string) => {
      onDebouncedChange(q);
    },
    [onDebouncedChange],
  );

  const [debouncedQ] = useDebounce(qInput, DEBOUNCE_DELAY);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    onDebouncedChangeRef.current(debouncedQ);
  }, [debouncedQ]);

  return (
    <TextField.Root
      value={qInput}
      onChange={(e) => setQInput(e.currentTarget.value)}
      onBlur={() => commit(qInput)}
      onKeyDown={(e) => e.key === "Enter" && commit(qInput)}
      {...rest}
    >
      {children}
    </TextField.Root>
  );
};
