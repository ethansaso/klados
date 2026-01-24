import { Flex, Separator } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { summaryStatsQueryOptions } from "../../lib/queries/stats";
import { routeSeo } from "../../lib/utils/head/routeSeo";
import { FinalCTA } from "./-index-resources/FinalCTA";
import { GuideDemo } from "./-index-resources/GuideDemo";
import { HeroSection } from "./-index-resources/HeroSection";
import { PurposeSection } from "./-index-resources/PurposeSection";
import { StatsFeatureGrid } from "./-index-resources/StatsFeatureGrid";

import homeCssUrl from "../../assets/styles/pages/home.css?url";
import rfDemoCssUrl from "../../assets/styles/react-flow/demo.css?url";

export const Route = createFileRoute("/_app/")({
  head: () =>
    routeSeo({
      title: "Klados | Visual Tools to Identify Organisms",
      description:
        "Browse thousands of species and explore interactive, community-maintained guides built from real biological data.",
      links: [
        { rel: "stylesheet", href: homeCssUrl },
        { rel: "stylesheet", href: rfDemoCssUrl },
      ],
    }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(summaryStatsQueryOptions());
  },
  component: Home,
});

function Home() {
  const { data: summaryStats } = useSuspenseQuery(summaryStatsQueryOptions());

  return (
    <Flex direction="column" align="center">
      <HeroSection />
      <GuideDemo />
      <Separator size="4" />
      <PurposeSection />
      <Separator size="4" />
      <StatsFeatureGrid summaryStats={summaryStats} />
      <FinalCTA />
    </Flex>
  );
}
