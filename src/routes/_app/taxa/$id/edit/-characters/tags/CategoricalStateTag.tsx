import { Badge, Flex, IconButton } from "@radix-ui/themes";
import { PiX } from "react-icons/pi";

type CategoricalTraitTagProps = {
  characterId: number;
  traitValue: { id: number; label: string };
  onRemove?: (traitValueId: number) => void;
  // later: modifiers, onClick to open editor, etc.
};

export function CategoricalStateTag({
  traitValue,
  onRemove,
}: CategoricalTraitTagProps) {
  return (
    <Badge
      asChild
      variant="outline"
      color="gray"
      className="character-editor__tag"
    >
      <Flex align="center" gap="2">
        <span>{traitValue.label}</span>
        {onRemove && (
          <IconButton
            type="button"
            size="1"
            variant="ghost"
            color="tomato"
            onClick={() => onRemove(traitValue.id)}
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
