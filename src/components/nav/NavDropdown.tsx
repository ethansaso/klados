import { Flex, Text, Link as ThemeLink } from "@radix-ui/themes";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import classNames from "classnames";
import { NavigationMenu } from "radix-ui";
import * as React from "react";

function Root({ children }: React.PropsWithChildren<{}>) {
  return (
    <NavigationMenu.Item className="rt-TabNavItem nav-dropdown">
      {children}
    </NavigationMenu.Item>
  );
}

function Content({ children }: React.PropsWithChildren<{}>) {
  return (
    <NavigationMenu.Content asChild className="nav-dropdown__content">
      <ul>{children}</ul>
    </NavigationMenu.Content>
  );
}

/** Base anchor for the TRIGGER (wrapped by Radix Trigger/Link).
 *  Accepts `active`, `className`, `style` so you can keep your highlight styles. */
type TriggerAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
};
const TriggerAnchor = React.forwardRef<HTMLAnchorElement, TriggerAnchorProps>(
  ({ children, active, className, style, ...anchorProps }, ref) => (
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
        /** expose active state for CSS */
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
  )
);
TriggerAnchor.displayName = "TriggerAnchor";

/** Base anchor for DROPDOWN ITEM links (non-trigger). */
type ItemAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
const ItemAnchor = React.forwardRef<HTMLAnchorElement, ItemAnchorProps>(
  ({ className, ...props }, ref) => (
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
  )
);
ItemAnchor.displayName = "ItemAnchor";

/** -------- createLink: router-typed components -------- */

const CreatedTrigger = createLink(TriggerAnchor);
const CreatedItem = createLink(ItemAnchor);

/** Exported components (docs pattern), preserving your styling API. */
const Trigger: LinkComponent<typeof TriggerAnchor> = (props) => (
  <CreatedTrigger preload="intent" {...props} />
);

export const Link: LinkComponent<typeof ItemAnchor> = (props) => (
  <ThemeLink color="amber" highContrast underline="hover" asChild>
    <CreatedItem preload="intent" {...props} />
  </ThemeLink>
);

// TODO: keyboard accessibility
export const NavDropdown = { Root, Trigger, Content, Link };
