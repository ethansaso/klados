import { Text } from "@radix-ui/themes";

export const a11yProps = (id: string, invalid: boolean) =>
  invalid
    ? {
        "aria-invalid": true,
        "aria-describedby": id,
      }
    : {};

export const ConditionalAlert = ({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) => {
  if (!message) return null;
  return (
    <Text id={id} size="1" color="tomato" role="alert">
      {message ?? "Please correct this field"}
    </Text>
  );
};
