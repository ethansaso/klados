import { Badge, Flex, IconButton } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { PiX } from "react-icons/pi";

type StateTagWrapperProps = {
  children: ReactNode;
  onRemove?: () => void;
};

export function StateTagWrapper({ children, onRemove }: StateTagWrapperProps) {
  return (
    <Badge
      asChild
      variant="outline"
      color="gray"
      className="character-editor__tag"
    >
      <Flex align="center" gap="2">
        {children}
        {onRemove && (
          <IconButton
            type="button"
            size="1"
            variant="ghost"
            color="tomato"
            onClick={onRemove}
            style={{
              padding: "calc(var(--space-1) / 2)",
              marginRight: "-3px",
            }}
          >
            <PiX size={12} />
          </IconButton>
        )}
      </Flex>
    </Badge>
  );
}
