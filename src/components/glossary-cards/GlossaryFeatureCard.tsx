import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { featureQueryOptions } from "../../lib/queries/features";
import { GlossaryCard } from "./GlossaryCard";

interface Props {
  id: number;
  children: React.ReactNode;
}

export const GlossaryFeatureCard: React.FC<Props> = ({ id, children }) => {
  const [open, setOpen] = useState(false);
  const { data: feature } = useQuery({
    ...featureQueryOptions(id),
    enabled: open,
  });

  return (
    <GlossaryCard
      info={
        feature && {
          title: feature.label,
          description: feature.description,
          media: feature.media,
        }
      }
      onOpenChange={setOpen}
    >
      {children}
    </GlossaryCard>
  );
};
