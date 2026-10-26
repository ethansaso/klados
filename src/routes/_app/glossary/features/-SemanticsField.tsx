import { Box, Flex, RadioCards, Text } from "@radix-ui/themes";
import { Label } from "radix-ui";
import {
  FEATURE_SEMANTICS,
  type FeatureSemantics,
} from "../../../../../db/schema/schema";
import { FeatureSemanticsIcon } from "../../../../components/icons/modular/FeatureSemanticsIcon";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";

type Props = {
  id: string;
  value: FeatureSemantics;
  onChange: (value: FeatureSemantics) => void;
  /** Variants are alternatives among siblings, so they need a parent. */
  hasParent: boolean;
  error?: string;
  disabled?: boolean;
};

export const SEMANTICS_OPTIONS: Record<
  FeatureSemantics,
  { label: string; hint: string }
> = {
  explicit: {
    label: "Explicit",
    hint: "Omitting this feature from a description implies it's absent.",
  },
  assumed: {
    label: "Assumed",
    hint: "Omitting this feature doesn't imply it's absent, but marking it absent still counts. Useful for features descriptions often skip, like microscopic structures.",
  },
  variant: {
    label: "Variant",
    hint: "This feature is a mutually exclusive alternative among its other variant siblings.",
  },
};

export function SemanticsField({
  id,
  value,
  onChange,
  hasParent,
  error,
  disabled,
}: Props) {
  const errorId = `${id}-error`;

  return (
    <Box>
      <Flex justify="between" align="baseline" mb="1">
        <Label.Root id={`${id}-label`}>Semantics</Label.Root>
        <ConditionalAlert id={errorId} message={error} />
      </Flex>
      <RadioCards.Root
        id={id}
        size="1"
        columns="1"
        gap="2"
        value={value}
        onValueChange={(next) => onChange(next as FeatureSemantics)}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        {...a11yProps(errorId, !!error)}
      >
        {FEATURE_SEMANTICS.map((option) => {
          const { label, hint } = SEMANTICS_OPTIONS[option];
          const needsParent = option === "variant" && !hasParent;

          return (
            <RadioCards.Item
              key={option}
              value={option}
              disabled={needsParent && value !== option}
            >
              <Flex direction="column" width="100%">
                <Flex align="center" gap="1">
                  <FeatureSemanticsIcon semantics={option} />
                  <Text weight="medium">{label}</Text>
                </Flex>
                <Text size="1" color="gray">
                  {hint}
                  {needsParent && (
                    <Text color="tomato" style={{ opacity: 0.75 }}>
                      {" "}
                      Requires a parent feature.
                    </Text>
                  )}
                </Text>
              </Flex>
            </RadioCards.Item>
          );
        })}
      </RadioCards.Root>
    </Box>
  );
}
