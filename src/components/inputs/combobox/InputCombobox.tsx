import {
  Combobox as AriakitCombobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
  useComboboxContext,
  useStoreState,
} from "@ariakit/react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Box, Flex, ScrollArea, Text, Theme } from "@radix-ui/themes";
import classNames from "classnames";
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type LabelHTMLAttributes,
  type ReactNode,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./combobox.css";
import type { ComboboxOption } from "./types";

type RootProps<T extends ComboboxOption> = {
  id?: string;

  /** Externally filtered/paginated options for the current query. */
  options: T[];

  /** Fired with the chosen option. Selection is transient — the
   * combobox holds no selection state of its own. */
  onSelect: (opt: T) => void;

  /** Debounced query callback (for DB calls). */
  onQueryChange?: (q: string) => void;

  /** Row content; defaults to adornment, label and hint. */
  renderItem?: (opt: T) => ReactNode;

  disabled?: boolean;
  loading?: boolean;

  size?: "1" | "2" | "3";

  className?: string;
  style?: CSSProperties;

  children: ReactNode;
};
type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;
type InputProps = Omit<
  ComponentProps<typeof AriakitCombobox>,
  "value" | "onChange" | "size"
> & {
  className?: string;
  /** Optional content to render inside the input's right slot. */
  rightSlot?: ReactNode;
};
type ContentProps = ComponentProps<typeof RadixPopover.Content> & {
  matchTriggerWidth?: boolean;
};
type ListProps = {
  className?: string;
  style?: CSSProperties;
};

type Ctx = {
  id?: string;
  open: boolean;
  setOpen: (open: boolean) => void;

  disabled?: boolean;
  loading?: boolean;

  options: ComboboxOption[];
  onSelect: (opt: ComboboxOption) => void;
  renderItem?: (opt: ComboboxOption) => ReactNode;
  /** The debounced query, i.e. the one `options` answer. */
  query: string;

  comboboxRef: RefObject<HTMLInputElement | null>;
  listboxRef: RefObject<HTMLDivElement | null>;

  size?: "1" | "2" | "3";
};

// Matches SelectCombobox's search field
const DEBOUNCE_MS = 300;
function useDebouncedEffect(
  value: string,
  delay: number,
  effect?: (v: string) => void,
) {
  useEffect(() => {
    if (!effect) return;
    const handle = window.setTimeout(() => effect(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay, effect]);
}

const InputComboboxContext = createContext<Ctx | null>(null);

function useCb() {
  const ctx = use(InputComboboxContext);
  if (!ctx) {
    throw new Error("InputCombobox.* must be used within InputCombobox.Root");
  }
  return ctx;
}

function QueryWatcher({
  onQueryChange,
}: {
  onQueryChange: (q: string) => void;
}) {
  const store = useComboboxContext();
  const value = useStoreState(store, "value") ?? "";
  useDebouncedEffect(value, DEBOUNCE_MS, onQueryChange);
  return null;
}

function Root<T extends ComboboxOption>({
  id,
  options,
  onSelect,
  onQueryChange,
  renderItem,
  disabled,
  loading,
  size,
  className,
  style,
  children,
}: RootProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      onQueryChange?.(q);
    },
    [onQueryChange],
  );

  const comboboxRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const ctx: Ctx = {
    id,
    open,
    setOpen,
    disabled,
    loading,
    options,
    // From Root's `T`
    onSelect: onSelect as Ctx["onSelect"],
    renderItem: renderItem as Ctx["renderItem"],
    query,
    comboboxRef,
    listboxRef,
    size,
  };

  return (
    <div
      className={classNames(className, `input-combobox size-${size ?? 2}`)}
      style={style}
    >
      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <ComboboxProvider open={open} setOpen={setOpen}>
          <InputComboboxContext value={ctx}>
            <QueryWatcher onQueryChange={handleQueryChange} />
            {children}
          </InputComboboxContext>
        </ComboboxProvider>
      </RadixPopover.Root>
    </div>
  );
}

function Label({ children, ...rest }: LabelProps) {
  const { id } = useCb();

  // Id derived from root
  const labelId = id ? `${id}-label` : undefined;

  return (
    <label id={labelId} htmlFor={id} {...rest}>
      {children}
    </label>
  );
}

function Input({ className, rightSlot, ...rest }: InputProps) {
  const { id, disabled, open, setOpen, comboboxRef } = useCb();

  const labelId = id ? `${id}-label` : undefined;

  return (
    <RadixPopover.Anchor asChild>
      <div
        className={classNames(
          "input-combobox__slot-wrap",
          !rightSlot && "input-combobox__slot-wrap--plain",
        )}
      >
        <AriakitCombobox
          ref={comboboxRef}
          id={id}
          autoComplete="off"
          autoSelect="always"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          aria-disabled={disabled}
          aria-labelledby={labelId}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          className={classNames(
            "input-combobox__input rt-reset",
            rightSlot ? "input-combobox__input--has-slot" : undefined,
            className,
          )}
          {...rest}
        />
        {rightSlot && (
          <div className="input-combobox__slot-right">{rightSlot}</div>
        )}
      </div>
    </RadixPopover.Anchor>
  );
}

function Content({
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  matchTriggerWidth,
  className,
  style,
  ...props
}: ContentProps) {
  const { comboboxRef, listboxRef, size } = useCb();
  const mergedClassName = classNames(
    // Radix Themes' popover open/close animation; it carries no other styles
    "rt-PopperContent",
    "input-combobox__content",
    `size-${size ?? 2}`,
    className,
  );
  const mergedStyles = {
    ...(matchTriggerWidth && { width: "var(--radix-popover-trigger-width)" }),
    ...style,
  };

  return (
    <RadixPopover.Portal>
      <Theme asChild>
        <RadixPopover.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          onOpenAutoFocus={(event) => {
            // Keep focus on the combobox input.
            event.preventDefault();
          }}
          onInteractOutside={(event) => {
            const target = event.target as Element | null;
            const isCombobox = target === comboboxRef.current;
            const inListbox = target && listboxRef.current?.contains(target);

            if (isCombobox || inListbox) {
              event.preventDefault();
            }
          }}
          className={mergedClassName}
          {...props}
          style={mergedStyles}
        >
          {children}
        </RadixPopover.Content>
      </Theme>
    </RadixPopover.Portal>
  );
}

function List({ className, style }: ListProps) {
  const { id, loading, options, query, listboxRef } = useCb();

  const status =
    options.length > 0
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
      style={{ maxHeight: 260, ...style }}
      className={classNames("input-combobox__list-scroll", className)}
    >
      <ComboboxList
        ref={listboxRef}
        // Radix decides presence; Ariakit would hide it mid exit animation
        alwaysVisible
        id={id ? `${id}-listbox` : undefined}
        role="listbox"
        className="input-combobox__list"
        aria-busy={!!loading}
      >
        {status && (
          <Box p="2">
            <Text color="gray">{status}</Text>
          </Box>
        )}

        {options.map((option, index) => (
          // Ariakit doesn't re-sort its items when kept ones merely change
          // order, which desyncs arrow keys from the DOM; so key by position.
          <Item key={index} option={option} />
        ))}
      </ComboboxList>
    </ScrollArea>
  );
}

function Item({ option }: { option: ComboboxOption }) {
  const { onSelect, setOpen, renderItem } = useCb();
  const store = useComboboxContext();

  return (
    <ComboboxItem
      value={String(option.id)}
      focusOnHover
      setValueOnClick={false}
      className="input-combobox__item"
      onClick={() => {
        // 1) Tell parent what was selected.
        onSelect(option);
        // 2) Clear the combobox text / query.
        store?.setValue("");
        // 3) Close popover — focus returns to the input automatically.
        setOpen(false);
      }}
    >
      {renderItem ? (
        renderItem(option)
      ) : (
        <Flex align="baseline" gap="2" overflow="hidden">
          {option.adornment}
          <Text as="p" truncate weight="medium">
            {option.label}
          </Text>
          {option.hint && (
            <Text as="p" size="1" color="gray" truncate>
              {option.hint}
            </Text>
          )}
        </Flex>
      )}
    </ComboboxItem>
  );
}

export const InputCombobox = {
  Root,
  Label,
  Input,
  Content,
  List,
};
