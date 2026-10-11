import { Badge, Box } from "@radix-ui/themes";

type PctColor = "tomato" | "orange" | "yellow" | "green";

/** `percentage` is a fraction in [0, 1]. */
const getColorFromPercentage = (percentage: number): PctColor => {
  if (percentage >= 0.75) {
    return "green";
  } else if (percentage >= 0.5) {
    return "yellow";
  } else if (percentage >= 0.25) {
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
    <Box asChild display="block">
      <Badge variant="solid" color={color}>
        {formattedPct}
      </Badge>
    </Box>
  );
};
