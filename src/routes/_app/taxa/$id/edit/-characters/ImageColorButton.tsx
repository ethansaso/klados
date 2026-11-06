import { IconButton, Tooltip } from "@radix-ui/themes";
import { useWatch } from "react-hook-form";
import { PiPalette } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import { pickImageColors } from "../../../../../../components/dialogs/color-picker/ImageColorModal";
import type { CategoricalValueSuggestion } from "../../../../../../lib/domain/suggestions/types";
import type { CharacterStateFormValue } from "./validation";

type Props = {
  featureLabel: string;
  characterId: number;
  characterLabel: string;
  states: CharacterStateFormValue[];
  onAdd: (suggestions: CategoricalValueSuggestion[]) => void;
};

/** Opens the image color picker; watches media itself so feature cards don't re-render. */
export function ImageColorButton({
  featureLabel,
  characterId,
  characterLabel,
  states,
  onAdd,
}: Props) {
  const media = useWatch<TaxonEditFormValues, "media">({ name: "media" });
  const hasMedia = media.length > 0;

  const handleClick = async () => {
    const picked = await pickImageColors({
      featureLabel,
      characterId,
      characterLabel,
      media,
      existingHexes: states.flatMap((state) =>
        state.kind === "categorical" && state.trait.hexCode
          ? [state.trait.hexCode.toLowerCase()]
          : [],
      ),
    });
    if (picked?.length) onAdd(picked);
  };

  return (
    <Tooltip
      content={
        hasMedia
          ? "Pick a color from this taxon's images"
          : "Add an image to this taxon to pick a color from it"
      }
    >
      <IconButton
        type="button"
        size="1"
        variant="ghost"
        disabled={!hasMedia}
        aria-label="Pick colors from images"
        onClick={handleClick}
      >
        <PiPalette size={14} />
      </IconButton>
    </Tooltip>
  );
}
