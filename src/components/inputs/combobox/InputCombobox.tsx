import {
  Combobox as AriakitCombobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
  useComboboxContext,
  useStoreState,
} from "@ariakit/react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Box, ScrollArea, Text, Theme } from "@radix-ui/themes";
import classNames from "classnames";
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type LabelHTMLAttributes,
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useRef,
  useState,
} from "react";

type RootProps = {
  id?: string;

  /** Fired with the selected item's value. Selection is transient — the
   * combobox holds no selection state of its own. */
  onSelect: (value: string) => void;

  /** Debounced query callback (for DB calls). */
  onQueryChange?: (q: string) => void;

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
type PopoverProps = ComponentProps<typeof RadixPopover.Content> & {
  matchTriggerWidth?: boolean;
};
type ListProps = {
  /** Whether the caller has no items to render — shows the
   * "Loading"/"No results" placeholders. */
  isEmpty?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};
type ItemProps = {
  /** Identity of this item, passed to Root's onSelect when chosen. */
  value: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

type Ctx = {
  id?: string;
  open: boolean;
  setOpen: (open: boolean) => void;

  disabled?: boolean;
  loading?: boolean;

  onSelect: (value: string) => void;

  comboboxRef: RefObject<HTMLInputElement | null>;
  listboxRef: RefObject<HTMLDivElement | null>;

  size?: "1" | "2" | "3";
};

const DEBOUNCE_MS = 200;
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
  onQueryChange?: (q: string) => void;
}) {
  const store = useComboboxContext();
  const value = useStoreState(store, "value") ?? "";
  useDebouncedEffect(value, DEBOUNCE_MS, onQueryChange);
  return null;
}

function Root({
  id,
  onSelect,
  onQueryChange,
  disabled,
  loading,
  size,
  className,
  style,
  children,
}: RootProps) {
  const [open, setOpen] = useState(false);

  const comboboxRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const ctx: Ctx = {
    id,
    open,
    setOpen,
    disabled,
    loading,
    onSelect,
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
            {onQueryChange && <QueryWatcher onQueryChange={onQueryChange} />}
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

function Popover({
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  matchTriggerWidth,
  className,
  style,
  ...props
}: PopoverProps) {
  const { comboboxRef, listboxRef, size } = useCb();
  const mergedClassName = classNames(
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
          style={mergedStyles}
          {...props}
        >
          {children}
        </RadixPopover.Content>
      </Theme>
    </RadixPopover.Portal>
  );
}

function List({ isEmpty = false, className, style, children }: ListProps) {
  const { id, loading, listboxRef } = useCb();
  return (
    <ScrollArea
      type="auto"
      scrollbars="vertical"
      style={{ maxHeight: 260, ...style }}
      className={classNames("input-combobox__list-scroll", className)}
    >
      <ComboboxList
        ref={listboxRef}
        id={id ? `${id}-listbox` : undefined}
        role="listbox"
        className="input-combobox__list"
        aria-busy={!!loading}
      >
        {loading && isEmpty && (
          <Box p="2">
            <Text color="gray">Loading</Text>
          </Box>
        )}

        {!loading && isEmpty && (
          <Box p="2">
            <Text color="gray">No results</Text>
          </Box>
        )}

        {children}
      </ComboboxList>
    </ScrollArea>
  );
}

function Item({ value, className, style, children }: ItemProps) {
  const { onSelect, setOpen } = useCb();
  const store = useComboboxContext();

  return (
    <ComboboxItem
      value={value}
      focusOnHover
      setValueOnClick={false}
      className={classNames("input-combobox__item", className)}
      onClick={() => {
        // 1) Tell parent what was selected.
        onSelect(value);
        // 2) Clear the combobox text / query.
        store?.setValue("");
        // 3) Close popover — focus returns to the input automatically.
        setOpen(false);
      }}
      style={style}
    >
      {children}
    </ComboboxItem>
  );
}

export const InputCombobox = {
  Root,
  Label,
  Input,
  Popover,
  List,
  Item,
};
