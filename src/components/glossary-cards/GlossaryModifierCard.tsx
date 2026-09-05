import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { modifierQueryOptions } from "../../lib/queries/modifiers";
import { GlossaryCard } from "./GlossaryCard";

interface Props {
  id: number;
  children: React.ReactNode;
}

export const GlossaryModifierCard: React.FC<Props> = ({ id, children }) => {
  const [open, setOpen] = useState(false);
  const { data: modifier } = useQuery({
    ...modifierQueryOptions(id),
    enabled: open,
  });

  return (
    <GlossaryCard
      info={
        modifier && {
          title: modifier.label,
          description: modifier.description,
          media: modifier.media,
        }
      }
      onOpenChange={setOpen}
    >
      {children}
    </GlossaryCard>
  );
};
