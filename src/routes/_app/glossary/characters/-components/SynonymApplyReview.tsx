import {
  Box,
  Checkbox,
  Flex,
  Grid,
  ScrollArea,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { Fragment } from "react";
import { PiArrowRight } from "react-icons/pi";
import type {
  SynonymApply,
  SynonymField,
  SynonymFieldPair,
} from "../-hooks/useSynonymApply";
import type { MediaDTO } from "../../../../../lib/domain/media/types";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";
import "./SynonymApplyReview.css";

type Props = {
  /** The saved trait whose description and image get copied. */
  source: TraitValueDTO;
  apply: SynonymApply;
  disabled?: boolean;
};

type MemberProps = Omit<Props, "source"> & {
  member: TraitValueDTO;
  sourceMedia: MediaDTO | null;
};

const THUMB_SIZE = "40px";
const FIELD_LABELS: Record<SynonymField, string> = {
  description: "Description",
  media: "Image",
};

/** Pick which synonyms, and which of their fields, to overwrite. */
export function SynonymApplyReview({ source, apply, disabled = false }: Props) {
  const { label, description, media } = source;
  const { members, fields, isChecked, setChecked } = apply;

  if (apply.isLoading) {
    return (
      <Flex justify="center" py="4">
        <Spinner />
      </Flex>
    );
  }
  if (apply.error) {
    return (
      <Text size="2" color="tomato">
        {apply.error.message || "Failed to load synonyms."}
      </Text>
    );
  }
  if (!members.length) {
    return (
      <Text size="2" color="gray">
        This trait has no synonyms to apply to.
      </Text>
    );
  }

  const allPairs = members.flatMap((m) =>
    fields.map((f): SynonymFieldPair => [m.id, f]),
  );
  const overwriteCount = members.filter((m) =>
    fields.some((f) => isChecked(m.id, f) && hasValue(m, f)),
  ).length;

  return (
    <Flex direction="column" gap="3">
      <Flex gap="3" p="3" className="synonym-apply-review__source">
        {media && <Thumbnail media={media} />}
        <Flex direction="column" gap="1" minWidth="0">
          <Text size="1" color="gray">
            From {label}
          </Text>
          {description.trim() ? (
            <Text size="2">{description}</Text>
          ) : (
            <Text size="2" color="gray">
              No description
            </Text>
          )}
        </Flex>
      </Flex>

      <Box overflow="hidden" className="synonym-apply-review__tree">
        <Flex
          gap="2"
          align="center"
          px="3"
          py="2"
          className="synonym-apply-review__all"
        >
          <Checkbox
            id="synonym-apply-all"
            checked={checkedState(allPairs, isChecked)}
            onCheckedChange={(c) => setChecked(allPairs, c === true)}
            disabled={disabled}
          />
          <Label.Root htmlFor="synonym-apply-all">
            <Text size="2" weight="bold">
              All synonyms
            </Text>
          </Label.Root>
        </Flex>
        <ScrollArea
          type="auto"
          scrollbars="vertical"
          style={{ maxHeight: 300 }}
        >
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              sourceMedia={media}
              apply={apply}
              disabled={disabled}
            />
          ))}
        </ScrollArea>
      </Box>

      {overwriteCount > 0 && (
        <Text size="1" color="gray" align="right">
          {overwriteCount} synonym{overwriteCount === 1 ? "" : "s"} will be
          overwritten.
        </Text>
      )}
    </Flex>
  );
}

function MemberRow({ member, sourceMedia, apply, disabled }: MemberProps) {
  const { fields, isChecked, setChecked } = apply;
  const pairs = fields.map((f): SynonymFieldPair => [member.id, f]);
  const id = `synonym-apply-${member.id}`;

  return (
    <Box px="3" py="2" className="synonym-apply-review__member">
      <Flex gap="2" align="center">
        <Checkbox
          id={id}
          checked={checkedState(pairs, isChecked)}
          onCheckedChange={(c) => setChecked(pairs, c === true)}
          disabled={disabled}
        />
        <Label.Root htmlFor={id}>
          <Text size="2" weight="medium">
            {member.label}
          </Text>
        </Label.Root>
      </Flex>
      <Text as="div" size="1" mt="2">
        <Grid
          columns="auto max-content minmax(0, 1fr)"
          gap="2"
          align="start"
          pl="5"
        >
          {fields.map((field) => {
            const fieldId = `${id}-${field}`;
            const checked = isChecked(member.id, field);

            return (
              <Fragment key={field}>
                <Checkbox
                  id={fieldId}
                  checked={checked}
                  onCheckedChange={(c) =>
                    setChecked([[member.id, field]], c === true)
                  }
                  disabled={disabled}
                />
                <Label.Root htmlFor={fieldId}>
                  <Text color="gray" mr="2">
                    {FIELD_LABELS[field]}
                  </Text>
                </Label.Root>
                <Box minWidth="0" asChild>
                  {field === "description" ? (
                    <CurrentDescription
                      description={member.description}
                      replaced={checked}
                    />
                  ) : (
                    <Flex gap="2" align="center">
                      <Thumbnail media={member.media} />
                      {checked && sourceMedia && (
                        <>
                          <PiArrowRight aria-label="becomes" />
                          <Thumbnail media={sourceMedia} />
                        </>
                      )}
                    </Flex>
                  )}
                </Box>
              </Fragment>
            );
          })}
        </Grid>
      </Text>
    </Box>
  );
}

function CurrentDescription({
  description,
  replaced,
}: {
  description: string;
  replaced: boolean;
}) {
  if (!description.trim()) {
    return (
      <Text as="div" color="gray">
        <em>empty</em>
      </Text>
    );
  }

  return (
    <Text as="div">{replaced ? <del>{description}</del> : description}</Text>
  );
}

function Thumbnail({ media }: { media: MediaDTO | null }) {
  if (!media) {
    return (
      <Flex
        width={THUMB_SIZE}
        height={THUMB_SIZE}
        flexShrink="0"
        align="center"
        justify="center"
        className="synonym-apply-review__thumb synonym-apply-review__thumb--empty"
      >
        <Text size="1" color="gray">
          none
        </Text>
      </Flex>
    );
  }

  return (
    <Box asChild width={THUMB_SIZE} height={THUMB_SIZE} flexShrink="0">
      <img
        src={getMediaUrl(media.storageKey)}
        alt={media.title}
        className="synonym-apply-review__thumb"
      />
    </Box>
  );
}

function checkedState(
  pairs: readonly SynonymFieldPair[],
  isChecked: SynonymApply["isChecked"],
): boolean | "indeterminate" {
  const checked = pairs.filter(([id, field]) => isChecked(id, field)).length;
  if (checked === 0) return false;
  return checked === pairs.length ? true : "indeterminate";
}

function hasValue(member: TraitValueDTO, field: SynonymField): boolean {
  return field === "description" ? !!member.description.trim() : !!member.media;
}
