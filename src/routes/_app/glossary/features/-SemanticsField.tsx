import { Box, Flex, RadioGroup, Text } from "@radix-ui/themes";
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
    hint: "The presence/absence of this feature means something.",
  },
  variant: {
    label: "Variant",
    hint: "This feature is one alternative amongst its other variant siblings.",
  },
  assumed: {
    label: "Assumed",
    hint: "The omission of this feature is typically accidental, or due to adequate description by its sub-features.",
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
      <RadioGroup.Root
        id={id}
        value={value}
        onValueChange={(next) => onChange(next as FeatureSemantics)}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        {...a11yProps(errorId, !!error)}
      >
        <Flex direction="column" gap="2">
          {FEATURE_SEMANTICS.map((option) => {
            const { label, hint } = SEMANTICS_OPTIONS[option];
            const needsParent = option === "variant" && !hasParent;

            return (
              <RadioGroup.Item
                key={option}
                value={option}
                disabled={needsParent && value !== option}
              >
                <Flex direction="column">
                  <Flex align="center" gap="1">
                    <FeatureSemanticsIcon semantics={option} />
                    <Text weight="medium">{label}</Text>
                  </Flex>
                  <Text size="1" color="gray">
                    {hint}
                    {needsParent && " Needs a parent feature."}
                  </Text>
                </Flex>
              </RadioGroup.Item>
            );
          })}
        </Flex>
      </RadioGroup.Root>
    </Box>
  );
}
