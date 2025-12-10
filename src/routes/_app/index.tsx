import { Flex, Separator } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { summaryStatsQueryOptions } from "../../lib/queries/stats";
import { FinalCTA } from "./-index-resources/FinalCTA";
import { HeroSection } from "./-index-resources/HeroSection";
import { KeyDemo } from "./-index-resources/KeyDemo";
import { PurposeSection } from "./-index-resources/PurposeSection";
import { StatsFeatureGrid } from "./-index-resources/StatsFeatureGrid";

export const Route = createFileRoute("/_app/")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(summaryStatsQueryOptions());
  },
  component: Home,
});

function Home() {
  const { data: summaryStats } = useSuspenseQuery(summaryStatsQueryOptions());

  return (
    <Flex direction="column" align="center">
      <HeroSection />
      <KeyDemo />
      <Separator size="4" />
      <PurposeSection />
      <Separator size="4" />
      <StatsFeatureGrid summaryStats={summaryStats} />
      <FinalCTA />
    </Flex>
  );
}
