import { TextField } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type Props = Omit<
  React.ComponentProps<typeof TextField.Root>,
  "value" | "onChange"
> & {
  /** The committed value, e.g. from the URL. The input follows outside changes to it. */
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
  const [committed, setCommitted] = useState(initialValue);
  const [debouncedQ] = useDebounce(qInput, DEBOUNCE_DELAY);

  // Follow outside changes (back/forward, another record), but avoid echoing back
  const [prevInitial, setPrevInitial] = useState(initialValue);
  if (initialValue !== prevInitial) {
    setPrevInitial(initialValue);
    if (initialValue !== committed) {
      setQInput(initialValue);
      setCommitted(initialValue);
    }
  }

  // Blur and Enter re-commit the current text; only commit anything that differs
  const commit = (q: string) => {
    if (q === committed) return;
    setCommitted(q);
    onDebouncedChange(q);
  };

  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    commitRef.current(debouncedQ);
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
