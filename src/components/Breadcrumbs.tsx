import { Flex, Link, Popover, Text } from "@radix-ui/themes";
import { PiCaretRight } from "react-icons/pi";
import type { ResponsiveSize, Size } from "../lib/utils/types/responsiveSize";
import { RouterRadixLink } from "./RouterRadixLink";

export interface Breadcrumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
  hiddenItems?: Breadcrumb[];
}

export interface BreadcrumbsProps {
  items: Breadcrumb[];
  size?: Size | ResponsiveSize;
}

export const Breadcrumbs = ({ items, size = "3" }: BreadcrumbsProps) => {
  return (
    <ul className="breadcrumbs">
      {items.map((item, index) => (
        <Text asChild size={size} key={item.label}>
          <li className="breadcrumbs__item">
            {item.hiddenItems?.length ? (
              <Popover.Root>
                <Popover.Trigger>
                  <Link asChild>
                    <button
                      type="button"
                      aria-label={`Show ${item.hiddenItems.length} hidden ancestors`}
                    >
                      {item.label}
                    </button>
                  </Link>
                </Popover.Trigger>
                <Popover.Content align="center" sideOffset={6}>
                  <Flex
                    direction="column"
                    gap="2"
                    className="breadcrumbs__overflow-menu"
                  >
                    {item.hiddenItems.map((hiddenItem) =>
                      hiddenItem.to ? (
                        <RouterRadixLink
                          key={`${hiddenItem.label}-${hiddenItem.params?.id ?? "current"}`}
                          to={hiddenItem.to}
                          params={hiddenItem.params}
                          size={size}
                          className="breadcrumbs__link"
                        >
                          {hiddenItem.label}
                        </RouterRadixLink>
                      ) : (
                        <span
                          key={`${hiddenItem.label}-${hiddenItem.params?.id ?? "current"}`}
                          className="breadcrumbs__current"
                        >
                          {hiddenItem.label}
                        </span>
                      ),
                    )}
                  </Flex>
                </Popover.Content>
              </Popover.Root>
            ) : item.to ? (
              <RouterRadixLink
                to={item.to}
                params={item.params}
                size={size}
                className="breadcrumbs__link"
              >
                {item.label}
              </RouterRadixLink>
            ) : (
              <span className="breadcrumbs__current">{item.label}</span>
            )}
            {index < items.length - 1 && <PiCaretRight />}
          </li>
        </Text>
      ))}
    </ul>
  );
};
