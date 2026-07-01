import { PiCaretUpDown, PiHash, PiTag } from "react-icons/pi";
import type { CharacterType } from "../../../lib/domain/characters/types";

interface Props {
  type: CharacterType;
}

export const CharacterIcon = ({ type, ...rest }: Props) => {
  switch (type) {
    case "categorical":
      return <PiTag {...rest} />;
    case "number":
      return <PiHash {...rest} />;
    case "range":
      return <PiCaretUpDown {...rest} />;
  }
};
