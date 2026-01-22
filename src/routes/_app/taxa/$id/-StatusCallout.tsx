import { Box, Callout } from "@radix-ui/themes";
import { TaxonStatus } from "../../../../db/schema/schema";

export const StatusCallout = ({ status }: { status: TaxonStatus }) => {
  if (status === "active") return null;

  return (
    <Box asChild width="100%" mb="4">
      <Callout.Root color={status === "deprecated" ? "tomato" : undefined}>
        <Callout.Text>
          Heads up! This taxon is{" "}
          {status === "draft" ? "currently under review." : "not active."}
        </Callout.Text>
      </Callout.Root>
    </Box>
  );
};
