import { Link as RadixLink } from "@radix-ui/themes";
import { createLink, type LinkComponent } from "@tanstack/react-router";

// https://tanstack.com/router/latest/docs/framework/react/guide/custom-link
const CreatedRouterRadixLink = createLink(RadixLink);

export const RouterRadixLink: LinkComponent<typeof RadixLink> = (props) => {
  return <CreatedRouterRadixLink preload="intent" {...props} />;
};
