import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { FeatureGrid } from "./-index-resources/FeatureGrid";
import { FinalCTA } from "./-index-resources/FinalCTA";
import { WhatIsKlados } from "./-index-resources/WhatIsKlados";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  return (
    <Flex direction="column" gap="4" align="center">
      <h1>Welcome to Klados!</h1>
      <WhatIsKlados />
      <FeatureGrid />
      <FinalCTA />
    </Flex>
  );
}
