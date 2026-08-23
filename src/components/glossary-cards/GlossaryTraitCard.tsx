import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { traitValueQueryOptions } from "../../lib/queries/traits";
import { GlossaryCard } from "./GlossaryCard";

interface Props {
  id: number;
  children: React.ReactNode;
}

export const GlossaryTraitCard: React.FC<Props> = ({ id, children }) => {
  const [open, setOpen] = useState(false);
  const { data: trait } = useQuery({
    ...traitValueQueryOptions(id),
    enabled: open,
  });

  return (
    <GlossaryCard
      info={
        trait && {
          title: trait.label,
          description: trait.description,
          media: trait.media,
        }
      }
      onOpenChange={setOpen}
    >
      {children}
    </GlossaryCard>
  );
};
