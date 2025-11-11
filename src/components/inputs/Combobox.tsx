import {
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  ScrollArea,
  Strong,
  Text,
  TextField,
} from "@radix-ui/themes";
import * as React from "react";
import { PiCaretUpDownFill, PiMagnifyingGlass, PiX } from "react-icons/pi";
import { DebouncedTextField } from "./DebouncedTextField";

/** Public option shape required by the combobox. */
export type ComboboxOption = {
  id: number;
  label: string;
  hint?: string;
};

/* =============================== Context =============================== */

type RootProps = {
  /** If provided, a hidden input will be rendered for form posts (value = selected id). */
  name?: string;
  /** Visible label above the field. */
  label: string;
  /** Controlled selected option. */
  value: ComboboxOption | null;
  /** Selection change handler. */
  onValueChange: (opt: ComboboxOption | null) => void;
  /** Externally filtered/paginated options for the current query. */
  options: ComboboxOption[];
  /** Called whenever the query string changes. Use to fetch/filter `options`. */
  onQueryChange?: (q: string) => void;
  /** Disable the whole combobox. */
  disabled?: boolean;
  /** Parent-controlled loading state for current query. */
  loading?: boolean;
  /** Style hooks for the outer wrapper. */
  className?: string;
  style?: React.CSSProperties;
  /** Compose with Trigger/Content/Input/List/Item children. */
  children: React.ReactNode;
};

type Ctx = {
  uid: string;
  open: boolean;
  setOpen: (o: boolean) => void;

  label: string;
  disabled?: boolean;

  value: ComboboxOption | null;
  onValueChange: (opt: ComboboxOption | null) => void;

  options: ComboboxOption[];
  loading?: boolean;

  query: string;
  setQuery: (q: string) => void;

  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;

  selectActive: () => void;
  clear: () => void;
};

const Ctx = React.createContext<Ctx | null>(null);
function useCb() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Combobox.* must be used within Combobox.Root");
  return ctx;
}

/* ================================= Root ================================ */

function Root({
  name,
  label,
  value,
  onValueChange,
  options,
  onQueryChange,
  disabled,
  loading,
  className,
  style,
  children,
}: RootProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const uid = React.useId();

  React.useEffect(() => {
    if (options.length === 0) {
      setActiveIndex(-1);
    } else {
      setActiveIndex((i) => (i < 0 ? -1 : Math.min(i, options.length - 1)));
    }
  }, [options.length]);

  const openPopover = () => {
    if (!disabled) setOpen(true);
  };
  const closePopover = () => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    onQueryChange?.("");
  };

  const selectActive = () => {
    if (activeIndex >= 0 && options[activeIndex]) {
      onValueChange(options[activeIndex]);
      closePopover();
    }
  };

  const clear = () => {
    onValueChange(null);
    setActiveIndex(-1);
  };

  const ctx: Ctx = {
    uid,
    open,
    setOpen: (o) => (o ? openPopover() : closePopover()),
    label,
    disabled,
    value,
    onValueChange,
    options,
    loading,
    query,
    setQuery: (q) => {
      setQuery(q);
      onQueryChange?.(q);
      setActiveIndex(-1); // wait for new options
    },
    activeIndex,
    setActiveIndex,
    selectActive,
    clear,
  };

  const selectedId = value ? String(value.id) : "";

  return (
    <div className={className} style={style}>
      <Text
        as="label"
        size="2"
        weight="bold"
        mb="1"
        htmlFor={`cb-${uid}-input`}
        style={{ display: "block" }}
      >
        {label}
      </Text>

      {name && <input type="hidden" name={name} value={selectedId} />}

      <Ctx.Provider value={ctx}>
        <Popover.Root open={open} onOpenChange={ctx.setOpen}>
          {children}
        </Popover.Root>
      </Ctx.Provider>
    </div>
  );
}

/* ================================ Trigger ============================== */

function Trigger({ placeholder }: { placeholder?: React.ReactNode }) {
  const { open, disabled, value, uid, setOpen, clear } = useCb();
  const triggerLabel = value ? value.label : (placeholder ?? "Select...");

  return (
    <Flex align="center" gap="2" position="relative" style={{ width: "100%" }}>
      <Popover.Trigger>
        <Button
          variant="surface"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`cb-${uid}-listbox`}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          style={{ width: "100%" }}
        >
          <Flex align="center" justify="between" width="100%" gap="6">
            <Text as="div" truncate>
              {triggerLabel}
            </Text>
            <PiCaretUpDownFill size="14" aria-hidden />
          </Flex>
        </Button>
      </Popover.Trigger>

      {value && (
        <Box position="absolute" right="6" asChild>
          <IconButton
            type="button"
            size="1"
            variant="ghost"
            disabled={disabled}
            aria-label="Clear selection"
            title="Clear"
            onClick={clear}
          >
            <PiX size="14" />
          </IconButton>
        </Box>
      )}
    </Flex>
  );
}

/* ================================ Content ============================== */

function Content({
  style,
  className,
  children,
}: React.PropsWithChildren<{
  style?: React.CSSProperties;
  className?: string;
}>) {
  return (
    <Popover.Content
      side="bottom"
      align="start"
      size="1"
      style={{ minWidth: 280, ...style }}
    >
      {children}
    </Popover.Content>
  );
}

/* ================================= Input =============================== */

function Input(props: React.ComponentProps<typeof TextField.Root>) {
  const {
    uid,
    open,
    options,
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    selectActive,
    setOpen,
  } = useCb();

  const activeId =
    activeIndex >= 0 ? `cb-${uid}-opt-${activeIndex}` : undefined;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!options.length) return;
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, options.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!options.length) return;
      setActiveIndex((i) => (i < 0 ? options.length - 1 : Math.max(i - 1, 0)));
    } else if (e.key === "Home") {
      e.preventDefault();
      if (options.length) setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (options.length) setActiveIndex(options.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectActive();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <DebouncedTextField
      mb="2"
      id={`cb-${uid}-input`}
      variant="surface"
      initialValue={query}
      onDebouncedChange={(str) => setQuery(str)}
      onKeyDown={onKeyDown}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={`cb-${uid}-listbox`}
      aria-activedescendant={activeId}
      {...props}
    >
      <TextField.Slot>
        <PiMagnifyingGlass size="16" />
      </TextField.Slot>
    </DebouncedTextField>
  );
}

/* ================================= List ================================ */
/** Structural only: ARIA container + scroll. Caller maps items manually.
    Shows simple <Text> "Loading" and "No results" when no children provided. */
function List({
  className,
  style,
  children,
}: React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>) {
  const { uid, label, loading, options } = useCb();

  const hasChildren = React.Children.count(children) > 0;

  return (
    <ScrollArea
      type="auto"
      scrollbars="vertical"
      className={className}
      style={{ maxHeight: 260, ...style }}
    >
      <ul
        id={`cb-${uid}-listbox`}
        role="listbox"
        aria-label={`${label} options`}
        aria-busy={!!loading}
        style={{
          padding: 0,
          margin: 0,
          listStyle: "none",
          position: "relative",
          paddingRight: "var(--space-4)",
        }}
      >
        {/* Hidden live region for screen readers */}
        <span
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            margin: -1,
            border: 0,
            padding: 0,
            clip: "rect(0 0 0 0)",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {loading
            ? "Loading results"
            : !hasChildren && options.length === 0
              ? "No results"
              : ""}
        </span>

        {!hasChildren && loading && (
          <li>
            <Text
              size="2"
              color="gray"
              style={{ display: "block", padding: "8px 10px" }}
            >
              Loading
            </Text>
          </li>
        )}

        {!hasChildren && !loading && options.length === 0 && (
          <li>
            <Text
              size="2"
              color="gray"
              style={{ display: "block", padding: "8px 10px" }}
            >
              No results
            </Text>
          </li>
        )}

        {children}
      </ul>
    </ScrollArea>
  );
}

/* ================================= Item ================================ */
/** Self-sufficient item: reads active/selected state from context; commits on click. */
function Item({
  option,
  index,
  style,
}: {
  option: ComboboxOption;
  index: number;
  style?: React.CSSProperties;
}) {
  const { uid, activeIndex, setActiveIndex, value, onValueChange, setOpen } =
    useCb();
  const active = index === activeIndex;
  const selected = value ? value.id === option.id : false;

  return (
    <Flex direction="column" gap="0" asChild>
      <li
        id={`cb-${uid}-opt-${index}`}
        role="option"
        aria-selected={selected}
        data-active={active || undefined}
        data-selected={selected || undefined}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => {
          onValueChange(option);
          setOpen(false);
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 6,
          cursor: "pointer",
          background: active ? "var(--accent-3)" : "transparent",
          outline: active ? "2px solid transparent" : "none",
          ...style,
        }}
      >
        <Text as="p" size="2" truncate>
          <Strong>{option.label}</Strong>
        </Text>
        {option.hint && (
          <Text as="p" size="1" color="gray" truncate>
            {option.hint}
          </Text>
        )}
      </li>
    </Flex>
  );
}

/* ================================ Export =============================== */

export const Combobox = {
  Root,
  Trigger,
  Content,
  Input,
  List,
  Item,
};
