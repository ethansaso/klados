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
  const [debouncedQ] = useDebounce(qInput, DEBOUNCE_DELAY);

  const lastCommittedRef = useRef(initialValue);
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  onDebouncedChangeRef.current = onDebouncedChange;

  // Blur and Enter re-commit the current text; callers often reset paging on a
  // new query, so only commit text that differs from the last commit
  const commit = useCallback((q: string) => {
    if (q === lastCommittedRef.current) return;
    lastCommittedRef.current = q;
    onDebouncedChangeRef.current(q);
  }, []);

  useEffect(() => {
    commit(debouncedQ);
  }, [debouncedQ, commit]);

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
