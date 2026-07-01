import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { characterQueryOptions } from "../../lib/queries/characters";
import { GlossaryCard } from "./GlossaryCard";

interface Props {
  id: number;
  children: React.ReactNode;
}

export const GlossaryCharacterCard: React.FC<Props> = ({ id, children }) => {
  const [open, setOpen] = useState(false);
  const { data: character } = useQuery({
    ...characterQueryOptions(id),
    enabled: open,
  });

  return (
    <GlossaryCard
      info={
        character && {
          title: character.label,
          description: character.description,
          media: character.media,
        }
      }
      onOpenChange={setOpen}
    >
      {children}
    </GlossaryCard>
  );
};
