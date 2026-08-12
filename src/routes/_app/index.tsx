import "../../assets/styles/pages/home.css";
import "../../assets/styles/react-flow/demo.css";

import { Flex, Separator } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { summaryStatsQueryOptions } from "../../lib/queries/stats";
import { routeSeo } from "../../lib/utils/head/routeSeo";
import { FeatureStrip } from "./-index-resources/FeatureStrip";
import { GuideDemo } from "./-index-resources/GuideDemo";
import { HeroSection } from "./-index-resources/HeroSection";
import { StatsFeatureGrid } from "./-index-resources/StatsGrid";

export const Route = createFileRoute("/_app/")({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(summaryStatsQueryOptions());
  },
  head: ({ match }) =>
    routeSeo({
      title: "Klados | Visual Tools to Identify Organisms",
      description:
        "Browse thousands of species and explore interactive, community-maintained guides built from real biological data.",
      canonicalUrl: match.pathname,
    }),
  component: Home,
});

function Home() {
  const { data: summaryStats } = useSuspenseQuery(summaryStatsQueryOptions());

  return (
    <Flex direction="column" align="center">
      <HeroSection />
      <FeatureStrip />
      <Separator size="4" />
      <GuideDemo />
      <Separator size="4" />
      <StatsFeatureGrid summaryStats={summaryStats} />
    </Flex>
  );
}
