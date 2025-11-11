import { Button, Flex, Text } from "@radix-ui/themes";
import { PiArrowLeft, PiArrowRight } from "react-icons/pi";

export function GlossarySidebarPager({
  page,
  pageSize,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Flex mt="2" gap="2" justify="between" align="center">
      <Button variant="soft" disabled={page <= 1} onClick={onPrev}>
        <PiArrowLeft size={16} />
      </Button>
      <Text size="2">
        {page} / {max}
      </Text>
      <Button variant="soft" disabled={page >= max} onClick={onNext}>
        <PiArrowRight size={16} />
      </Button>
    </Flex>
  );
}
