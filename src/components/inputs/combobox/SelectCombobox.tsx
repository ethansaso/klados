import {
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  ScrollArea,
  Text,
  TextField,
} from "@radix-ui/themes";
import classNames from "classnames";
import {
  Children,
  ComponentProps,
  createContext,
  CSSProperties,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
  useEffect,
  useState,
} from "react";
import {
  PiCaretUpDownFill,
  PiCheck,
  PiMagnifyingGlass,
  PiX,
} from "react-icons/pi";
import { DebouncedTextField } from "../DebouncedTextField";
import { ComboboxOption } from "./types";

/* =============================== Context =============================== */

type RootProps = {
  /** If provided, the combobox take this id for label interaction/a11y. */
  id?: string;
  /** If provided, a hidden input will be rendered for form posts (value = selected id). */
  name?: string;
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
  style?: CSSProperties;
  /** Compose with Trigger/Content/Input/List/Item children. */
  children: ReactNode;
};

type ContentProps = ComponentProps<typeof Popover.Content> & {
  behavior?: "select" | "input";
};

type ComboboxContext = {
  id?: string;
  open: boolean;
  setOpen: (o: boolean) => void;

  disabled?: boolean;

  value: ComboboxOption | null;
  onValueChange: (opt: ComboboxOption | null) => void;

  options: ComboboxOption[];
  loading?: boolean;

  query: string;
  setQuery: (q: string) => void;

  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;

  selectActive: () => void;
  clear: () => void;
};

const ComboboxContext = createContext<ComboboxContext | null>(null);
function useCb() {
  const ctx = use(ComboboxContext);
  if (!ctx) throw new Error("Combobox.* must be used within Combobox.Root");
  return ctx;
}

function Root({
  id,
  name,
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
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

  const ctx: ComboboxContext = {
    id,
    open,
    setOpen: (o) => (o ? openPopover() : closePopover()),
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
      {name && <input type="hidden" name={name} value={selectedId} />}
      <ComboboxContext.Provider value={ctx}>
        <Popover.Root open={open} onOpenChange={ctx.setOpen}>
          {children}
        </Popover.Root>
      </ComboboxContext.Provider>
    </div>
  );
}

function Trigger({ placeholder }: { placeholder?: React.ReactNode }) {
  const { open, disabled, value, id, setOpen, clear } = useCb();
  const triggerLabel = value ? value.label : (placeholder ?? "Select...");

  return (
    <Flex align="center" gap="2" position="relative" style={{ width: "100%" }}>
      <Popover.Trigger>
        <Button
          id={id}
          variant="surface"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
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
            <PiCaretUpDownFill
              size="14"
              aria-hidden
              style={{ flexShrink: 0 }}
            />
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

function Content({
  children,
  minWidth = "280px",
  maxWidth = "400px",
  behavior = "select",
  ...props
}: ContentProps) {
  return (
    <Popover.Content
      side="bottom"
      align="start"
      size="1"
      minWidth={minWidth}
      maxWidth={maxWidth}
      onOpenAutoFocus={(e) => {
        if (behavior === "input") {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {children}
    </Popover.Content>
  );
}

function Input(props: React.ComponentProps<typeof TextField.Root>) {
  const {
    id,
    open,
    options,
    query,
    setQuery,
    setActiveIndex,
    selectActive,
    setOpen,
  } = useCb();

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
      id={`${id}-input`}
      variant="surface"
      initialValue={query}
      onDebouncedChange={(str) => setQuery(str)}
      onKeyDown={onKeyDown}
      role="combobox"
      aria-autocomplete="list"
      aria-labelledby={id}
      aria-expanded={open}
      aria-controls={`${id}-listbox`}
      {...props}
    >
      <TextField.Slot>
        <PiMagnifyingGlass size="16" />
      </TextField.Slot>
    </DebouncedTextField>
  );
}

function List({
  className,
  style,
  children,
}: React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>) {
  const { id, loading, options } = useCb();

  const hasChildren = Children.count(children) > 0;

  return (
    <ScrollArea
      type="auto"
      scrollbars="vertical"
      className={classNames("combobox__list", className)}
      style={{ maxHeight: 260, ...style }}
    >
      <ul
        id={id ? `${id}-listbox` : undefined}
        role="listbox"
        aria-busy={!!loading}
        style={{
          padding: 0,
          margin: 0,
          listStyle: "none",
          position: "relative",
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

function Item({
  option,
  index,
  style,
}: {
  option: ComboboxOption;
  index: number;
  style?: React.CSSProperties;
}) {
  const { id, activeIndex, setActiveIndex, value, onValueChange, setOpen } =
    useCb();
  const active = index === activeIndex;
  const selected = value ? value.id === option.id : false;

  return (
    <Flex direction="column" gap="0" asChild>
      <li
        id={`${id}-opt-${index}`}
        className="combobox__item"
        role="option"
        aria-selected={selected}
        data-selected={selected || undefined}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => {
          onValueChange(option);
          setOpen(false);
        }}
        style={{
          padding: "6px var(--space-2)",
          borderRadius: 6,
          cursor: "pointer",
          background: active ? "var(--accent-3)" : "transparent",
          ...style,
        }}
      >
        <Flex
          justify="between"
          align="center"
          gap="2"
          className="combobox__item-content"
        >
          <Flex align="baseline" gap="2" flexShrink="1" overflow="hidden">
            <Text
              as="p"
              size="2"
              truncate
              weight="medium"
              className="combobox__item-text__label"
            >
              {option.label}
            </Text>
            {option.hint && (
              <Text
                as="p"
                size="1"
                color="gray"
                truncate
                className="combobox__item-text__hint"
              >
                {option.hint}
              </Text>
            )}
          </Flex>
          <PiCheck size="14" visibility={selected ? "visible" : "hidden"} />
        </Flex>
      </li>
    </Flex>
  );
}

// TODO: fix SSR issues with label
export const SelectCombobox = {
  Root,
  Trigger,
  Content,
  Input,
  List,
  Item,
};
