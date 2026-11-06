import { IconButton, Text, Tooltip } from "@radix-ui/themes";
import { memo, type Dispatch } from "react";
import { PiX } from "react-icons/pi";
import type { TraitValueDTO } from "../../../../lib/domain/traits/types";
import { NumberBubble } from "../../../NumberBubble";
import type { ColorPick } from "../types";
import type { PickAction } from "../usePicks";
import { chosenMember, orderSetMembers } from "../useSwatchSets";
import "./ColorPickCard.css";
import { PaletteGrid } from "./PaletteGrid";
import { TakenWarning } from "./TakenWarning";

type Props = {
  pick: ColorPick;
  index: number;
  /** The chosen swatch's labels; undefined while they load. */
  members: TraitValueDTO[] | undefined;
  paletteOpen: boolean;
  takenReason: (hexCode: string, pickId: number) => string | null;
  dispatch: Dispatch<PickAction>;
  onTogglePalette: (pickId: number) => void;
};

/** Trait builder for sampled spot. */
export const ColorPickCard = memo(
  ({
    pick,
    index,
    members,
    paletteOpen,
    takenReason,
    dispatch,
    onTogglePalette,
  }: Props) => {
    const { id, swatch } = pick;
    const ordered = members && orderSetMembers(members, swatch.label);
    const chosen = ordered && chosenMember(ordered, pick);
    const tabs = pick.suggestions.some((s) => s.hexCode === swatch.hexCode)
      ? pick.suggestions
      : [...pick.suggestions, swatch];
    const reasonFor = (hexCode: string) => takenReason(hexCode, id);

    return (
      <div className="color-pick-card">
        <div className="color-pick-card__swatch">
          <button
            type="button"
            className="color-pick-card__more"
            aria-expanded={paletteOpen}
            aria-label="All colors"
            onClick={() => onTogglePalette(id)}
          >
            <span
              className="color-pick-card__sample"
              style={{ backgroundColor: pick.sampledHex }}
            />
            {paletteOpen ? "Less" : "More"}
          </button>
          <NumberBubble className="color-pick-card__index">
            {index + 1}
          </NumberBubble>
        </div>

        <div className="color-pick-card__body">
          <div
            className="color-pick-card__tabs"
            role="radiogroup"
            aria-label="Color"
          >
            {tabs.map((tab) => {
              const reason = reasonFor(tab.hexCode);
              return (
                <Tooltip
                  key={tab.hexCode}
                  content={reason}
                  delayDuration={0}
                  open={reason ? undefined : false}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={tab.hexCode === swatch.hexCode}
                    className="color-pick-card__tab"
                    onClick={() =>
                      dispatch({ type: "chooseSwatch", id, swatch: tab })
                    }
                  >
                    <span
                      className="color-pick-card__dot"
                      style={{ backgroundColor: tab.hexCode }}
                    />
                    {tab.label}
                    {reason && <TakenWarning />}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div
            className="color-pick-card__panel"
            data-flush={tabs[0]!.hexCode === swatch.hexCode}
          >
            {paletteOpen && (
              <PaletteGrid
                sampledHex={pick.sampledHex}
                selectedHex={swatch.hexCode}
                takenReason={reasonFor}
                onSelect={(next) =>
                  dispatch({ type: "chooseSwatch", id, swatch: next })
                }
              />
            )}
            <div
              className="color-pick-card__labels"
              role="radiogroup"
              aria-label="Label"
            >
              {!ordered ? (
                <Text size="1" color="gray">
                  Loading labels...
                </Text>
              ) : ordered.length ? (
                ordered.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    role="radio"
                    aria-checked={member === chosen}
                    className="color-pick-card__label"
                    onClick={() =>
                      dispatch({
                        type: "chooseLabel",
                        id,
                        traitValueId: member.id,
                      })
                    }
                  >
                    {member.label}
                  </button>
                ))
              ) : (
                <Text size="1" color="red">
                  This color isn't in the glossary yet.
                </Text>
              )}
            </div>
          </div>
        </div>

        <IconButton
          type="button"
          size="1"
          variant="ghost"
          color="tomato"
          className="color-pick-card__remove"
          aria-label={`Remove ${chosen?.label ?? swatch.label}`}
          onClick={() => dispatch({ type: "remove", id })}
        >
          <PiX size={14} />
        </IconButton>
      </div>
    );
  },
);
