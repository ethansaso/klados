import { TextField } from "@radix-ui/themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type Props = Omit<
  React.ComponentProps<typeof TextField.Root>,
  "value" | "onChange"
> & {
  /**
   * The committed value, owned by the caller. Typing edits a local draft and
   * only commits on a pause, so this lags what is on screen by design -- but
   * when it changes for any other reason (a reset, the back button) the box
   * follows it.
   */
  value: string;
  onDebouncedChange: (value: string) => void;
};

const DEBOUNCE_DELAY = 300;

export const DebouncedTextField = ({
  value,
  onDebouncedChange,
  children,
  ...rest
}: Props) => {
  const [draft, setDraft] = useState(value);

  const onDebouncedChangeRef = useRef(onDebouncedChange);
  onDebouncedChangeRef.current = onDebouncedChange;

  /**
   * What we last handed upward. Lets us tell our own commit coming back as a
   * new `value` from a change that started somewhere else, so an in-flight
   * keystroke is never overwritten by the echo of the one before it.
   */
  const lastCommittedRef = useRef(value);

  const commit = useCallback((next: string) => {
    if (next === lastCommittedRef.current) return;
    lastCommittedRef.current = next;
    onDebouncedChangeRef.current(next);
  }, []);

  // Adjusting state during render, rather than in an effect, so an external
  // reset paints in the same pass instead of flashing the stale draft first.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== lastCommittedRef.current) {
      lastCommittedRef.current = value;
      setDraft(value);
    }
  }

  const [debouncedDraft] = useDebounce(draft, DEBOUNCE_DELAY);
  useEffect(() => {
    commit(debouncedDraft);
  }, [debouncedDraft, commit]);

  return (
    <TextField.Root
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => e.key === "Enter" && commit(draft)}
      {...rest}
    >
      {children}
    </TextField.Root>
  );
};
