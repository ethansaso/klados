import { Button, Flex, Text } from "@radix-ui/themes";

export function PaginationFooter({
  size = "1",
  page,
  pageSize,
  total,
  showTotal,
  onPrev,
  onNext,
}: {
  size?: "1" | "2" | "3";
  page: number;
  pageSize: number;
  total: number;
  showTotal?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Flex mt="3" justify="between" align="center" wrap="wrap" gap="2">
      <Text size={size} color="gray">
        Page {page} of {max}
        {showTotal ? ` · ${total} value${total === 1 ? "" : "s"}` : ""}
      </Text>
      <Flex gap="2">
        <Button
          size={size}
          variant="soft"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          size={size}
          variant="soft"
          disabled={page >= max}
          onClick={onNext}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
