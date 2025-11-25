import {
  Combobox as AriakitCombobox,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
  useComboboxContext,
} from "@ariakit/react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Box, Flex, ScrollArea, Text, Theme } from "@radix-ui/themes";
import classNames from "classnames";
import {
  Children,
  ComponentProps,
  createContext,
  CSSProperties,
  LabelHTMLAttributes,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ComboboxOption } from "./types";

type RootProps = {
  id?: string;
  name?: string;

  /** Controlled "selection" passed back to parent. */
  value: ComboboxOption | null;
  onValueChange: (opt: ComboboxOption | null) => void;

  /** Options to display for the current query. */
  options: ComboboxOption[];

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
};
type PopoverProps = ComponentProps<typeof RadixPopover.Content> & {
  children: ReactNode;
};
type ListProps = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};
type ItemProps = {
  option: ComboboxOption;
  className?: string;
  style?: CSSProperties;
};

type Ctx = {
  id?: string;
  name?: string;
  open: boolean;
  setOpen: (open: boolean) => void;

  disabled?: boolean;
  loading?: boolean;

  selected: ComboboxOption | null;
  onSelectedChange: (opt: ComboboxOption | null) => void;

  options: ComboboxOption[];

  clearInput: () => void;

  comboboxRef: RefObject<HTMLInputElement | null>;
  listboxRef: RefObject<HTMLDivElement | null>;

  size?: "1" | "2" | "3";
};

const DEBOUNCE_MS = 200;
function useDebouncedEffect(
  value: string,
  delay: number,
  effect?: (v: string) => void
) {
  useEffect(() => {
    if (!effect) return;
    const handle = window.setTimeout(() => effect(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay, effect]);
}

const Ctx = createContext<Ctx | null>(null);

function useCb() {
  const ctx = useContext(Ctx);
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
  const value = store?.useState("value") ?? "";
  useDebouncedEffect(value, DEBOUNCE_MS, onQueryChange);
  return null;
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
  size,
  className,
  style,
  children,
}: RootProps) {
  const [open, setOpen] = useState(false);

  const comboboxRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  // This will be null here (different context), so we do this in Item instead.
  const clearInput = useCallback(() => {}, []);

  const ctx: Ctx = {
    id,
    name,
    open,
    setOpen,
    disabled,
    loading,
    selected: value,
    onSelectedChange: onValueChange,
    options,
    clearInput,
    comboboxRef,
    listboxRef,
    size,
  };

  const selectedId = value ? String(value.id) : "";

  return (
    <div
      className={classNames(className, `input-combobox size-${size ?? 2}`)}
      style={style}
    >
      {name && <input type="hidden" name={name} value={selectedId} />}

      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <ComboboxProvider open={open} setOpen={setOpen}>
          <Ctx.Provider value={ctx}>
            {onQueryChange && <QueryWatcher onQueryChange={onQueryChange} />}
            {children}
          </Ctx.Provider>
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

function Input({ className, ...rest }: InputProps) {
  const { id, disabled, open, setOpen, comboboxRef } = useCb();

  const labelId = id ? `${id}-label` : undefined;

  return (
    <RadixPopover.Anchor asChild>
      <AriakitCombobox
        ref={comboboxRef}
        id={id}
        autoComplete="off"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-disabled={disabled}
        aria-labelledby={labelId}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        className={classNames(`input-combobox__input rt-reset`, className)}
        {...rest}
      />
    </RadixPopover.Anchor>
  );
}

function Popover({
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  ...props
}: PopoverProps) {
  const { comboboxRef, listboxRef, size } = useCb();

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
          className={classNames(
            "input-combobox__content",
            `size-${size ?? 2}`,
            className
          )}
          {...props}
        >
          {children}
        </RadixPopover.Content>
      </Theme>
    </RadixPopover.Portal>
  );
}

function List({ className, style, children }: ListProps) {
  const { id, loading, options, listboxRef } = useCb();

  const hasChildren = Children.count(children) > 0;

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
        {!hasChildren && loading && (
          <Box p="2">
            <Text color="gray">Loading</Text>
          </Box>
        )}

        {!hasChildren && !loading && options.length === 0 && (
          <Box p="2">
            <Text color="gray">No results</Text>
          </Box>
        )}

        {children}
      </ComboboxList>
    </ScrollArea>
  );
}

function Item({ option, className, style }: ItemProps) {
  const { selected, onSelectedChange, setOpen, comboboxRef } = useCb();
  const store = useComboboxContext();

  const isSelected = selected ? selected.id === option.id : false;

  return (
    <ComboboxItem
      value={option.label}
      focusOnHover
      setValueOnClick={false}
      className={classNames("input-combobox__item", className)}
      onClick={() => {
        // 1) Tell parent what was selected.
        onSelectedChange(option);
        // 2) Clear the combobox text / query.
        store?.setValue("");
        // 3) Close popover and blur.
        setOpen(false);
        comboboxRef.current?.blur();
      }}
      style={style}
      aria-selected={isSelected}
    >
      <Flex align="baseline" gap="2" overflow="hidden">
        <Text
          as="p"
          truncate
          weight="medium"
          className="input-combobox__item-label"
        >
          {option.label}
        </Text>
        {option.hint && (
          <Text
            as="p"
            size="1"
            color="gray"
            truncate
            className="input-combobox__item-hint"
          >
            {option.hint}
          </Text>
        )}
      </Flex>
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
