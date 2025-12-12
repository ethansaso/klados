import { Badge } from "@radix-ui/themes";

type PctColor = "tomato" | "orange" | "yellow" | "green";

const getColorFromPercentage = (percentage: number): PctColor => {
  if (percentage >= 75) {
    return "green";
  } else if (percentage >= 50) {
    return "yellow";
  } else if (percentage >= 25) {
    return "orange";
  } else {
    return "tomato";
  }
};

export const LookalikePercentBadge = ({
  percentage,
}: {
  percentage: number;
}) => {
  const color = getColorFromPercentage(percentage);
  const formattedPct = `${(percentage * 100).toFixed(2)}%`;

  return (
    <Badge variant="solid" color={color}>
      {formattedPct}
    </Badge>
  );
};
