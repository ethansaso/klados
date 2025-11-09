import { TextField } from "@radix-ui/themes";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

type Props = Omit<
  React.ComponentProps<typeof TextField.Root>,
  "value" | "onChange"
> & {
  initialValue: string;
  onDebouncedChange: (value: string) => void;
};

const DEBOUNCE_DELAY = 200;

/** TODO: if this starts causing problems due to lack of re-seeding, consider maintaining a ref to last committed value and re-seeding on *all* external changes */
export const DebouncedTextField = ({
  initialValue,
  onDebouncedChange,
  children,
  ...rest
}: Props) => {
  const [qInput, setQInput] = useState(initialValue);

  const commit = useCallback(
    (q: string) => {
      onDebouncedChange(q);
    },
    [onDebouncedChange]
  );

  const [debouncedQ] = useDebounce(qInput, DEBOUNCE_DELAY);
  useEffect(() => {
    if (debouncedQ !== initialValue) {
      onDebouncedChange(debouncedQ);
    }
  }, [debouncedQ, initialValue, onDebouncedChange]);

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
