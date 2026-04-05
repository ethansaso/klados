import {
  PiCrosshair,
  PiFlame,
  PiFlask,
  PiUsersThree,
  PiWifiHigh,
} from "react-icons/pi";
import type { ModifierClass } from "../../../../db/schema/schema";

interface Props {
  type: ModifierClass;
}

export const ModifierIcon = ({ type, ...rest }: Props) => {
  switch (type) {
    case "demographic":
      return <PiUsersThree {...rest} />;
    case "positional":
      return <PiCrosshair {...rest} />;
    case "reactive":
      return <PiFlask {...rest} />;
    case "reliability":
      return <PiWifiHigh {...rest} />;
    case "intensity":
      return <PiFlame {...rest} />;
  }
};
