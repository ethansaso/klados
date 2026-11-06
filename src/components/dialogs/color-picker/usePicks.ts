import { useReducer } from "react";
import type { PaletteSwatch } from "./sampling/nearestPaletteColor";
import type { ColorPick, ColorSample } from "./types";

type State = { picks: ColorPick[]; nextId: number };

export type PickAction =
  | { type: "add"; mediaId: number; x: number; y: number; sample: ColorSample }
  | { type: "move"; id: number; x: number; y: number }
  | { type: "resample"; id: number; sample: ColorSample }
  | { type: "chooseSwatch"; id: number; swatch: PaletteSwatch }
  | { type: "chooseLabel"; id: number; traitValueId: number }
  | { type: "remove"; id: number };

const INITIAL: State = { picks: [], nextId: 1 };

/** The picker's sampled spots, in the order they were added. */
export function usePicks() {
  const [{ picks }, dispatch] = useReducer(reducer, INITIAL);
  return [picks, dispatch] as const;
}

function reducer(state: State, action: PickAction): State {
  switch (action.type) {
    case "add": {
      const { mediaId, x, y, sample } = action;
      const pick = { id: state.nextId, mediaId, x, y, ...fromSample(sample) };
      return { picks: [...state.picks, pick], nextId: state.nextId + 1 };
    }
    case "move":
      return update(state, action.id, { x: action.x, y: action.y });
    case "resample":
      return update(state, action.id, fromSample(action.sample));
    case "chooseSwatch":
      return update(state, action.id, {
        swatch: action.swatch,
        traitValueId: null,
      });
    case "chooseLabel":
      return update(state, action.id, { traitValueId: action.traitValueId });
    case "remove":
      return {
        ...state,
        picks: state.picks.filter((pick) => pick.id !== action.id),
      };
  }
}

/** A fresh sample starts on its best suggestion and that swatch's own label. */
function fromSample(sample: ColorSample) {
  return { ...sample, swatch: sample.suggestions[0]!, traitValueId: null };
}

function update(state: State, id: number, patch: Partial<ColorPick>): State {
  return {
    ...state,
    picks: state.picks.map((pick) =>
      pick.id === id ? { ...pick, ...patch } : pick,
    ),
  };
}
