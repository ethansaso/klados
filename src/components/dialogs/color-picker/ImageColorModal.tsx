import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useCallback, useEffect, useState } from "react";
import type { CategoricalValueSuggestion } from "../../../lib/domain/suggestions/types";
import { ColorPickCard } from "./pick/ColorPickCard";
import { PhotoCredit } from "./photo/PhotoCredit";
import { PhotoStage } from "./photo/PhotoStage";
import { PhotoStrip } from "./photo/PhotoStrip";
import { preloadPhotos } from "./sampling/imageSampling";
import { chosenMember, useSwatchSets } from "./useSwatchSets";
import type { PickerPhoto } from "./types";
import { usePicks } from "./usePicks";

type Props = {
  /** The feature whose colors are being picked, e.g. "Gills". */
  featureLabel: string;
  characterId: number;
  characterLabel: string;
  media: PickerPhoto[];
  /** Swatch hexes of colors the feature already has, lowercase. */
  existingHexes: string[];
  onConfirm: (suggestions: CategoricalValueSuggestion[]) => void;
};

const ImageColorModal = NiceModal.create<Props>(
  ({
    featureLabel,
    characterId,
    characterLabel,
    media,
    existingHexes,
    onConfirm,
  }) => {
    const { visible, remove } = NiceModal.useModal();
    const [photoIndex, setPhotoIndex] = useState(0);
    const [picks, dispatch] = usePicks();
    const [openPaletteId, setOpenPaletteId] = useState<number | null>(null);
    const [hoveredPickId, setHoveredPickId] = useState<number | null>(null);
    const sets = useSwatchSets(characterId, picks);

    useEffect(() => preloadPhotos(media), [media]);

    const photo = media[photoIndex]!;
    const chosen = picks.map((pick) =>
      chosenMember(sets.get(pick.swatch.hexCode) ?? [], pick),
    );

    const takenReason = useCallback(
      (hexCode: string, pickId: number) => {
        if (existingHexes.includes(hexCode)) return "Already on this feature";
        if (
          picks.some((p) => p.id !== pickId && p.swatch.hexCode === hexCode)
        ) {
          return "Also picked here";
        }
        return null;
      },
      [existingHexes, picks],
    );

    const togglePalette = useCallback((pickId: number) => {
      setOpenPaletteId((open) => (open === pickId ? null : pickId));
    }, []);

    const handleAdd = () => {
      onConfirm(
        chosen.map((member) => ({
          kind: "categorical-value",
          characterId,
          characterLabel,
          traitValueId: member!.id,
          traitValueLabel: member!.label,
          traitValueDescription: member!.description,
          traitValueHexCode: member!.hexCode,
        })),
      );
      remove();
    };

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && remove()}>
        <Dialog.Content maxWidth="640px" aria-describedby={undefined}>
          <Dialog.Title size="4">Pick colors for {featureLabel}</Dialog.Title>

          <PhotoStage
            key={photo.id}
            photo={photo}
            alt={`Photo ${photoIndex + 1} of ${media.length}`}
            picks={picks.filter((pick) => pick.mediaId === photo.id)}
            highlightedPickId={hoveredPickId}
            onAdd={(x, y, sample) => {
              dispatch({ type: "add", mediaId: photo.id, x, y, sample });
              setOpenPaletteId(null);
            }}
            onMove={(id, x, y) => dispatch({ type: "move", id, x, y })}
            onMoveEnd={(id, sample) =>
              dispatch({ type: "resample", id, sample })
            }
          />

          {media.length > 1 && (
            <PhotoStrip
              media={media}
              selectedIndex={photoIndex}
              picks={picks}
              onSelect={setPhotoIndex}
            />
          )}

          {picks.length > 0 && (
            <Flex
              direction="column"
              gap="2"
              mt="3"
              pt="3"
              style={{ borderTop: "1px solid var(--gray-a5)" }}
            >
              {picks.map((pick, i) => (
                <div
                  key={pick.id}
                  onPointerEnter={() => setHoveredPickId(pick.id)}
                  onPointerLeave={() => setHoveredPickId(null)}
                >
                  <ColorPickCard
                    pick={pick}
                    index={i}
                    members={sets.get(pick.swatch.hexCode)}
                    paletteOpen={openPaletteId === pick.id}
                    takenReason={takenReason}
                    dispatch={dispatch}
                    onTogglePalette={togglePalette}
                  />
                </div>
              ))}
            </Flex>
          )}

          <Flex align="center" justify="between" gap="4" mt="4">
            <PhotoCredit photo={photo} />
            <Flex gap="2" flexShrink="0">
              <Button variant="soft" color="gray" onClick={remove}>
                Cancel
              </Button>
              <Button
                disabled={!picks.length || !chosen.every(Boolean)}
                onClick={handleAdd}
              >
                {picks.length > 1 ? `Add ${picks.length} colors` : "Add color"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);

/** Resolves to the colors to add, or null if the picker was closed. */
export function pickImageColors(props: Omit<Props, "onConfirm">) {
  return new Promise<CategoricalValueSuggestion[] | null>((resolve) => {
    NiceModal.show(ImageColorModal, {
      ...props,
      onConfirm: (suggestions) => resolve(suggestions),
    }).then(() => resolve(null));
  });
}
