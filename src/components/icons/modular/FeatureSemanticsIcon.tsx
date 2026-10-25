import { PiBracketsRound, PiSubtract, PiUsersThree } from "react-icons/pi";
import type { FeatureSemantics } from "../../../../db/schema/schema";

interface Props {
  semantics: FeatureSemantics;
}

export const FeatureSemanticsIcon = ({ semantics, ...rest }: Props) => {
  switch (semantics) {
    case "explicit":
      return <PiSubtract {...rest} />;
    case "variant":
      return <PiUsersThree {...rest} />;
    case "assumed":
      return <PiBracketsRound {...rest} />;
  }
};
