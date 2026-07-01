import { Text } from "@radix-ui/themes";
import { PiCaretRight } from "react-icons/pi";
import type { ResponsiveSize, Size } from "../lib/utils/responsiveSize";
import { RouterRadixLink } from "./RouterRadixLink";

export interface Breadcrumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
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
            {item.to ? (
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
