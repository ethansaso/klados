import { Link as RadixLink, Text } from "@radix-ui/themes";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { PiCaretRight } from "react-icons/pi";

export interface Breadcrumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export interface BreadcrumbsProps {
  items: Breadcrumb[];
  size?: "1" | "2" | "3";
}

// https://tanstack.com/router/latest/docs/framework/react/guide/custom-link
const CreatedRouterRadixLink = createLink(RadixLink);

const RouterRadixLink: LinkComponent<typeof RadixLink> = (props) => {
  return <CreatedRouterRadixLink preload="intent" {...props} />;
};

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
