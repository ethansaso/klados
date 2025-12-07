import { Button, Flex, Text } from "@radix-ui/themes";

export function PaginationFooter({
  page,
  pageSize,
  total,
  showValue,
  onPrev,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  showValue?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Flex mt="3" justify="between" align="center">
      <Text size="1" color="gray">
        Page {page} of {max}
        {showValue ? ` · ${total} value${total === 1 ? "" : "s"}` : ""}
      </Text>
      <Flex gap="2">
        <Button size="1" variant="soft" disabled={page <= 1} onClick={onPrev}>
          Previous
        </Button>
        <Button size="1" variant="soft" disabled={page >= max} onClick={onNext}>
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
