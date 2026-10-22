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
  type ComponentProps,
  createContext,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  use,
  useState,
} from "react";
import {
  PiCaretUpDownFill,
  PiCheck,
  PiMagnifyingGlass,
  PiX,
} from "react-icons/pi";
import { DebouncedTextField } from "../DebouncedTextField";
import "./combobox.css";
import type { ComboboxOption } from "./types";

/* =============================== Context =============================== */

type RootProps<T extends ComboboxOption> = {
  /** If provided, the combobox take this id for label interaction/a11y. */
  id?: string;
  /** If provided, a hidden input will be rendered for form posts (value = selected id). */
  name?: string;
  /** Controlled selected option. Pinned atop list while nothing is typed. */
  value: T | null;
  /** Selection change handler. */
  onValueChange: (opt: T | null) => void;
  /** Externally filtered/paginated options for the current query. */
  options: T[];
  /** Called whenever the query string changes. Use to fetch/filter `options`. */
  onQueryChange?: (q: string) => void;
  /** Custom row content. */
  renderItem?: (opt: T) => ReactNode;
  /** Custom trigger content. */
  renderValue?: (opt: T) => ReactNode;
  /** Disable the whole combobox. */
  disabled?: boolean;
  /** Parent-controlled loading state for current query. */
  loading?: boolean;
  /** Style hooks for the outer wrapper. */
  className?: string;
  style?: CSSProperties;
  /** Compose with Trigger/Content/Input/List children. */
  children: ReactNode;
};

type ContentProps = ComponentProps<typeof Popover.Content> & {
  matchTriggerWidth?: boolean;
};

type ComboboxContext = {
  id?: string;
  open: boolean;
  setOpen: (o: boolean) => void;

  disabled?: boolean;

  value: ComboboxOption | null;
  onValueChange: (opt: ComboboxOption | null) => void;

  /** What the list shows: the pinned value, then the other options. */
  items: ComboboxOption[];
  renderItem?: (opt: ComboboxOption) => ReactNode;
  renderValue?: (opt: ComboboxOption) => ReactNode;
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

function Root<T extends ComboboxOption>({
  id,
  name,
  value,
  onValueChange,
  options,
  onQueryChange,
  renderItem,
  renderValue,
  disabled,
  loading,
  className,
  style,
  children,
}: RootProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndexRaw, setActiveIndexRaw] = useState(-1);

  // Search results can't be counted on to include the selection
  const items: T[] =
    value && !query
      ? [value, ...options.filter((o) => o.id !== value.id)]
      : options;

  const activeIndex =
    items.length === 0
      ? -1
      : activeIndexRaw < 0
        ? -1
        : Math.min(activeIndexRaw, items.length - 1);

  // The search resets as the popover opens, in the same render, rather than
  // on close: the closing popover keeps its rows through the exit animation.
  const openPopover = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    onQueryChange?.("");
    // The first row: the pinned selection if any, so Enter keeps it
    setActiveIndexRaw(0);
  };
  const closePopover = () => setOpen(false);

  const selectActive = () => {
    const item = items[activeIndex];
    if (item) {
      onValueChange(item);
      closePopover();
    }
  };

  const clear = () => {
    onValueChange(null);
    setActiveIndexRaw(-1);
  };

  const ctx: ComboboxContext = {
    id,
    open,
    setOpen: (o) => (o ? openPopover() : closePopover()),
    disabled,
    value,
    // From Root's `T`
    onValueChange: onValueChange as ComboboxContext["onValueChange"],
    items,
    renderItem: renderItem as ComboboxContext["renderItem"],
    renderValue: renderValue as ComboboxContext["renderValue"],
    loading,
    query,
    setQuery: (q) => {
      setQuery(q);
      onQueryChange?.(q);
      // Top result is highlighted, so Enter picks it once it's current
      setActiveIndexRaw(0);
    },
    activeIndex,
    setActiveIndex: setActiveIndexRaw,
    selectActive,
    clear,
  };

  const selectedId = value ? String(value.id) : "";

  return (
    <div className={className} style={style}>
      {name && <input type="hidden" name={name} value={selectedId} />}
      <ComboboxContext value={ctx}>
        <Popover.Root open={open} onOpenChange={ctx.setOpen}>
          {children}
        </Popover.Root>
      </ComboboxContext>
    </div>
  );
}

type TriggerProps = {
  placeholder?: ReactNode;
} & Pick<
  ComponentProps<"button">,
  | "aria-invalid"
  | "aria-describedby"
  | "aria-label"
  | "aria-labelledby"
  | "aria-required"
>;

function Trigger({ placeholder, ...ariaProps }: TriggerProps) {
  const { open, disabled, value, id, setOpen, clear, renderValue } = useCb();

  return (
    <Flex align="center" gap="2" position="relative" style={{ width: "100%" }}>
      <Popover.Trigger>
        <Button
          id={id}
          className="select-combobox__trigger"
          variant="surface"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          {...ariaProps}
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
            {value && renderValue ? (
              <Box minWidth="0">{renderValue(value)}</Box>
            ) : (
              <Flex align="center" gap="2" minWidth="0">
                {value?.adornment}
                <Text as="div" truncate>
                  {value ? value.label : (placeholder ?? "Select...")}
                </Text>
              </Flex>
            )}
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
  matchTriggerWidth,
  minWidth = "280px",
  maxWidth = "400px",
  style,
  ...props
}: ContentProps) {
  const mergedStyles = {
    ...(matchTriggerWidth && { width: "var(--radix-popover-trigger-width)" }),
    ...style,
  };

  return (
    <Popover.Content
      side="bottom"
      align="start"
      size="1"
      minWidth={minWidth}
      maxWidth={maxWidth}
      {...props}
      style={mergedStyles}
    >
      {children}
    </Popover.Content>
  );
}

function Input(props: React.ComponentProps<typeof TextField.Root>) {
  const {
    id,
    open,
    items,
    query,
    setQuery,
    loading,
    setActiveIndex,
    selectActive,
    setOpen,
  } = useCb();

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!items.length) return;
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, items.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      setActiveIndex((i) => (i < 0 ? items.length - 1 : Math.max(i - 1, 0)));
    } else if (e.key === "Home") {
      e.preventDefault();
      if (items.length) setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (items.length) setActiveIndex(items.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Rows may be from the last search while the next is pending or loading
      if (e.currentTarget.value !== query || loading) return;
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
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { id, loading, items, query } = useCb();

  const status =
    items.length > 0
      ? ""
      : loading
        ? "Loading"
        : query
          ? "No results"
          : "Type to search";

  return (
    <ScrollArea
      type="auto"
      scrollbars="vertical"
      className={classNames("select-combobox__list", className)}
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
        {/* Live region must be inside <li> (valid <ul> structure) */}
        <li
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
          {status}
        </li>

        {status && (
          <li>
            <Text
              size="2"
              color="gray"
              style={{ display: "block", padding: "8px 10px" }}
            >
              {status}
            </Text>
          </li>
        )}

        {items.map((option, index) => (
          <Item key={option.id} option={option} index={index} />
        ))}
      </ul>
    </ScrollArea>
  );
}

function Item({ option, index }: { option: ComboboxOption; index: number }) {
  const {
    id,
    activeIndex,
    setActiveIndex,
    value,
    onValueChange,
    setOpen,
    renderItem,
  } = useCb();
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
          padding: "var(--space-1) var(--space-2)",
          borderRadius: 6,
          cursor: "pointer",
          background: active ? "var(--accent-3)" : "transparent",
        }}
      >
        <Flex
          justify="between"
          align="center"
          gap="2"
          className="combobox__item-content"
        >
          {renderItem ? (
            <Box flexGrow="1" minWidth="0">
              {renderItem(option)}
            </Box>
          ) : (
            <Flex align="baseline" gap="2" flexShrink="1" overflow="hidden">
              {option.adornment}
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
          )}
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
};
