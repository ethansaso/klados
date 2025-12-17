import { Flex, Separator, Text, Link as ThemeLink } from "@radix-ui/themes";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import classNames from "classnames";
import { NavigationMenu } from "radix-ui";
import {
  ComponentProps,
  ComponentPropsWithRef,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from "react";

function Root({ children }: PropsWithChildren) {
  return (
    <NavigationMenu.Item className="rt-TabNavItem nav-dropdown">
      {children}
    </NavigationMenu.Item>
  );
}

function Content({ children }: PropsWithChildren) {
  return (
    <NavigationMenu.Content asChild className="nav-dropdown__content">
      <ul>{children}</ul>
    </NavigationMenu.Content>
  );
}

/** Base anchor for the TRIGGER (wrapped by Radix Trigger/Link).
 *  Accepts `active`, `className`, `style` so you can keep your highlight styles. */
type TriggerAnchorProps = ComponentPropsWithRef<"a"> & {
  active?: boolean;
};

const TriggerAnchor = ({
  children,
  active,
  className,
  style,
  ref,
  ...anchorProps
}: TriggerAnchorProps) => (
  <NavigationMenu.Trigger
    asChild
    className={classNames(
      "rt-reset rt-BaseTabListTrigger rt-TabNavLink",
      className
    )}
    style={style}
  >
    <NavigationMenu.Link
      asChild
      className="nav-dropdown__trigger"
      data-active={active ? "" : undefined}
    >
      <a ref={ref} {...anchorProps}>
        <Flex
          as="span"
          align="center"
          gap="1"
          className="rt-BaseTabListTriggerInner rt-TabNavLinkInner"
        >
          {children}
        </Flex>
        <Flex
          as="span"
          align="center"
          className="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden"
        >
          {children}
        </Flex>
      </a>
    </NavigationMenu.Link>
  </NavigationMenu.Trigger>
);
TriggerAnchor.displayName = "TriggerAnchor";

/** Base anchor for DROPDOWN ITEM links (non-trigger). */
type ItemAnchorProps = ComponentPropsWithRef<"a">;
const ItemAnchor = ({ className, ref, ...props }: ItemAnchorProps) => (
  <NavigationMenu.Link asChild>
    <li>
      <Text asChild>
        <a
          ref={ref}
          className={classNames("nav-dropdown__link", className)}
          {...props}
        />
      </Text>
    </li>
  </NavigationMenu.Link>
);
ItemAnchor.displayName = "ItemAnchor";

/** -------- createLink: router-typed components -------- */

const CreatedTrigger = createLink(TriggerAnchor);
const CreatedItem = createLink(ItemAnchor);

type CreatedTriggerProps = ComponentProps<typeof CreatedTrigger>;

/** Plain (pathless) trigger: no <a>, just styled text. */
type PlainTriggerProps = {
  children: ReactNode;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Public Trigger props:
 *  - With `to`: router-backed link trigger.
 *  - Without `to`: plain text trigger (no <a>).
 */
type TriggerProps = CreatedTriggerProps | PlainTriggerProps;

const Trigger = (props: TriggerProps) => {
  // Router-backed version when `to` is present
  if ("to" in props && typeof props.to !== "undefined") {
    return <CreatedTrigger preload="intent" {...props} />;
  }

  // Plain version: no <a>, just styled text inside Radix Trigger
  const { children, active, className, style } = props as PlainTriggerProps;

  return (
    <NavigationMenu.Trigger
      asChild
      className={classNames(
        "rt-reset rt-BaseTabListTrigger rt-TabNavLink",
        className
      )}
      style={style}
    >
      <span
        className="nav-dropdown__trigger"
        data-active={active ? "" : undefined}
        style={{ cursor: "pointer" }}
      >
        <Flex
          as="span"
          align="center"
          justify="center"
          gap="1"
          className="rt-BaseTabListTriggerInner rt-TabNavLinkInner"
        >
          {children}
        </Flex>
        <Flex
          as="span"
          align="center"
          className="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden"
        >
          {children}
        </Flex>
      </span>
    </NavigationMenu.Trigger>
  );
};

const Divider = () => {
  return (
    <li className="nav-dropdown__separator" aria-hidden="true">
      <Separator size="4" my="1" />
    </li>
  );
};

/** Exported dropdown item Link. */
export const Link: LinkComponent<typeof ItemAnchor> = (props) => (
  <ThemeLink color="amber" highContrast underline="hover" asChild>
    <CreatedItem preload="intent" {...props} />
  </ThemeLink>
);

// TODO: keyboard accessibility
export const NavDropdown = { Root, Trigger, Content, Link, Separator: Divider };
