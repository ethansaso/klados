import {
  Badge,
  Card,
  ContextMenu,
  Flex,
  Separator,
  Text,
  TextArea,
} from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { memo, useCallback, useRef, useState } from "react";
import type { HydratedCharacterEntry } from "../../../../keygen/hydration/types";
import { CategoricalStateDisplay } from "../../../state-formatting/displays/CategoricalStateDisplay";
import type { RFRichBranchEdge } from "../../editor/data/types";
import { useGuideEditorStore } from "../../editor/data/useGuideEditorStore";

/** Flatten all character entries for a feature into badged trait nodes. */
function flattenChips(
  characters: Record<number, HydratedCharacterEntry>,
): React.ReactNode[] {
  const chips: React.ReactNode[] = [];
  for (const [charId, charEntry] of Object.entries(characters)) {
    if (charEntry.inverted) {
      chips.push(
        <Badge color="gray" variant="outline" key={`${charId}-other`}>
          <CategoricalStateDisplay
            state={{
              kind: "categorical",
              trait: { id: -1, label: "Other" },
              modifiers: [],
            }}
          />
        </Badge>,
      );
    } else {
      charEntry.traits.forEach((trait, idx) => {
        chips.push(
          <Badge color="gray" variant="outline" key={`${charId}-${trait.id}`}>
            <CategoricalStateDisplay
              state={{ kind: "categorical", trait, modifiers: [] }}
              lowercaseFirst={idx > 0}
            />
          </Badge>,
        );
      });
    }
  }
  return chips;
}

// ---------------------------------------------------------------------------

const RichBranchEdgeComponent = memo((props: EdgeProps<RFRichBranchEdge>) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data: {
      branchId,
      rationale: { features, annotation },
    },
  } = props;

  const { deleteElements } = useReactFlow();
  const updateBranchAnnotation = useGuideEditorStore(
    (s) => s.updateBranchAnnotation,
  );

  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(
    null,
  );
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });

  const hasAnnotation = !!annotation && annotation.trim().length > 0;
  const isEditing = editingAnnotation !== null;

  const handleDelete = useCallback(() => {
    deleteElements({ edges: [{ id }] });
  }, [deleteElements, id]);

  const startEditing = useCallback(() => {
    setEditingAnnotation(annotation ?? "");
    requestAnimationFrame(() => {
      taRef.current?.focus();
    });
  }, [annotation]);

  const commitAnnotation = useCallback(() => {
    if (!isEditing) return;
    const next = (editingAnnotation ?? "").trim();
    updateBranchAnnotation(branchId, next.length ? next : null);
    setEditingAnnotation(null);
  }, [branchId, editingAnnotation, isEditing, updateBranchAnnotation]);

  const renderContextContent = useCallback(
    () => (
      <ContextMenu.Content>
        <ContextMenu.Label>Branch Details</ContextMenu.Label>
        <ContextMenu.Item onSelect={startEditing}>
          {hasAnnotation ? "Edit annotation" : "Add annotation"}
        </ContextMenu.Item>
        {hasAnnotation && (
          <ContextMenu.Item
            onSelect={() => {
              updateBranchAnnotation(branchId, null);
              setEditingAnnotation(null);
            }}
          >
            Clear annotation
          </ContextMenu.Item>
        )}
        <ContextMenu.Separator />
        <ContextMenu.Item color="tomato" onSelect={handleDelete}>
          Delete
        </ContextMenu.Item>
      </ContextMenu.Content>
    ),
    [
      branchId,
      hasAnnotation,
      handleDelete,
      startEditing,
      updateBranchAnnotation,
    ],
  );

  const featureEntries = Object.entries(features);

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <g>
            <BaseEdge id={id} path={path} markerEnd={markerEnd} />
          </g>
        </ContextMenu.Trigger>
        {renderContextContent()}
      </ContextMenu.Root>

      <EdgeLabelRenderer>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <Card
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                maxWidth: "260px",
                pointerEvents: "all",
              }}
            >
              <Flex direction="column" gap="3">
                {featureEntries.map(([featureId, fEntry]) => (
                  <div key={featureId}>
                    <Text size="1" as="div" weight="bold" mb="1">
                      {fEntry.name}
                    </Text>
                    {fEntry.presence === "absent" ? (
                      <Flex wrap="wrap" gap="1">
                        <Badge color="gray" variant="outline">
                          <Text size="1">absent</Text>
                        </Badge>
                      </Flex>
                    ) : Object.keys(fEntry.characters).length === 0 ? (
                      <Flex wrap="wrap" gap="1">
                        <Badge color="gray" variant="outline">
                          <Text size="1">present</Text>
                        </Badge>
                      </Flex>
                    ) : (
                      <Flex wrap="wrap" gap="1">
                        {flattenChips(fEntry.characters)}
                      </Flex>
                    )}
                  </div>
                ))}
              </Flex>

              {(isEditing || hasAnnotation) && (
                <>
                  <Separator my="2" size="4" />
                  <TextArea
                    size="1"
                    variant="soft"
                    ref={taRef}
                    value={
                      isEditing ? (editingAnnotation ?? "") : (annotation ?? "")
                    }
                    onChange={
                      isEditing
                        ? (e) => setEditingAnnotation(e.target.value)
                        : undefined
                    }
                    onBlur={commitAnnotation}
                    readOnly={!isEditing}
                    placeholder={
                      isEditing ? "Add a note for this branch…" : undefined
                    }
                    style={{ width: "100%" }}
                  />
                </>
              )}
            </Card>
          </ContextMenu.Trigger>
          {renderContextContent()}
        </ContextMenu.Root>
      </EdgeLabelRenderer>
    </>
  );
});

export default RichBranchEdgeComponent;
