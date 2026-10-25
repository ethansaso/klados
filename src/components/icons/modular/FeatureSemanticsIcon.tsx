import { PiCircleDashed, PiGitFork, PiToggleRight } from "react-icons/pi";
import type { FeatureSemantics } from "../../../../db/schema/schema";

interface Props {
  semantics: FeatureSemantics;
}

export const FeatureSemanticsIcon = ({ semantics, ...rest }: Props) => {
  switch (semantics) {
    case "explicit":
      return <PiToggleRight {...rest} />;
    case "variant":
      return <PiGitFork {...rest} />;
    case "assumed":
      return <PiCircleDashed {...rest} />;
  }
};
