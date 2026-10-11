import { Badge, Box } from "@radix-ui/themes";
import type { ComponentProps } from "react";

/** `percentage` is a fraction in [0, 1]. */
const getColorFromPercentage = (
  percentage: number,
): ComponentProps<typeof Badge>["color"] => {
  if (percentage >= 0.7) {
    return "grass";
  } else if (percentage > 0.6) {
    return "lime";
  } else if (percentage >= 0.5) {
    return "amber";
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
