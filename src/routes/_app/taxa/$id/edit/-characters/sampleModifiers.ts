/**
 * Demo modifier vocabulary for the Compound Builder UX prototype.
 * These will eventually be replaced by live DB queries via the modifiers domain.
 */
export type SampleModifier = {
  id: number;
  value: string;
  affixType: "prefix" | "suffix";
  groupId: number;
  groupLabel: string;
};

export const SAMPLE_MODIFIERS: SampleModifier[] = [
  // Reliability
  {
    id: 1,
    value: "sometimes",
    affixType: "prefix",
    groupId: 1,
    groupLabel: "Reliability",
  },
  {
    id: 2,
    value: "rarely",
    affixType: "prefix",
    groupId: 1,
    groupLabel: "Reliability",
  },
  {
    id: 3,
    value: "typically",
    affixType: "prefix",
    groupId: 1,
    groupLabel: "Reliability",
  },
  {
    id: 4,
    value: "occasionally",
    affixType: "prefix",
    groupId: 1,
    groupLabel: "Reliability",
  },
  {
    id: 5,
    value: "often",
    affixType: "prefix",
    groupId: 1,
    groupLabel: "Reliability",
  },

  // Degree
  {
    id: 6,
    value: "somewhat",
    affixType: "prefix",
    groupId: 2,
    groupLabel: "Degree",
  },
  {
    id: 7,
    value: "fairly",
    affixType: "prefix",
    groupId: 2,
    groupLabel: "Degree",
  },
  {
    id: 8,
    value: "slightly",
    affixType: "prefix",
    groupId: 2,
    groupLabel: "Degree",
  },
  {
    id: 9,
    value: "not",
    affixType: "prefix",
    groupId: 2,
    groupLabel: "Degree",
  },
  {
    id: 10,
    value: "becoming",
    affixType: "prefix",
    groupId: 2,
    groupLabel: "Degree",
  },
  {
    id: 11,
    value: "nearly so",
    affixType: "suffix",
    groupId: 2,
    groupLabel: "Degree",
  },

  // Position
  {
    id: 12,
    value: "at apex",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },
  {
    id: 13,
    value: "at base",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },
  {
    id: 14,
    value: "at margin",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },
  {
    id: 15,
    value: "centrally",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },
  {
    id: 16,
    value: "near stem",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },
  {
    id: 17,
    value: "in stem",
    affixType: "suffix",
    groupId: 3,
    groupLabel: "Position",
  },

  // Condition / Life stage
  {
    id: 18,
    value: "when fresh",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 19,
    value: "when dry",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 20,
    value: "when young",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 21,
    value: "at maturity",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 22,
    value: "when old",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 23,
    value: "on exposure",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },
  {
    id: 24,
    value: "on drying",
    affixType: "suffix",
    groupId: 4,
    groupLabel: "Condition",
  },

  // Reaction
  {
    id: 25,
    value: "in KOH",
    affixType: "suffix",
    groupId: 5,
    groupLabel: "Reaction",
  },
  {
    id: 26,
    value: "in Melzer's",
    affixType: "suffix",
    groupId: 5,
    groupLabel: "Reaction",
  },
  {
    id: 27,
    value: "in water",
    affixType: "suffix",
    groupId: 5,
    groupLabel: "Reaction",
  },
  {
    id: 28,
    value: "with FeSO₄",
    affixType: "suffix",
    groupId: 5,
    groupLabel: "Reaction",
  },
  {
    id: 29,
    value: "in ammonia",
    affixType: "suffix",
    groupId: 5,
    groupLabel: "Reaction",
  },

  // Attachment
  {
    id: 30,
    value: "free from stem",
    affixType: "suffix",
    groupId: 6,
    groupLabel: "Attachment",
  },
  {
    id: 31,
    value: "adnate to stem",
    affixType: "suffix",
    groupId: 6,
    groupLabel: "Attachment",
  },
  {
    id: 32,
    value: "decurrent",
    affixType: "suffix",
    groupId: 6,
    groupLabel: "Attachment",
  },
  {
    id: 33,
    value: "from stem",
    affixType: "suffix",
    groupId: 6,
    groupLabel: "Attachment",
  },
];

export function filterModifiers(q: string): SampleModifier[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return SAMPLE_MODIFIERS;
  return SAMPLE_MODIFIERS.filter((m) => m.value.toLowerCase().includes(lower));
}

export function groupModifiers(
  modifiers: SampleModifier[],
): { groupId: number; groupLabel: string; items: SampleModifier[] }[] {
  const groups = new Map<
    number,
    { groupId: number; groupLabel: string; items: SampleModifier[] }
  >();
  for (const m of modifiers) {
    let g = groups.get(m.groupId);
    if (!g) {
      g = { groupId: m.groupId, groupLabel: m.groupLabel, items: [] };
      groups.set(m.groupId, g);
    }
    g.items.push(m);
  }
  return Array.from(groups.values());
}
