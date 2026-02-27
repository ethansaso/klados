import {
  Card,
  ContextMenu,
  DataList,
  Separator,
  Strong,
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
import { CharacterStateDisplay } from "../../../state-formatting/displays/CharacterStateDisplay";
import type { RFRichBranchEdge } from "../../editor/data/types";
import { useGuideEditorStore } from "../../editor/data/useGuideEditorStore";

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
                maxWidth: "250px",
                pointerEvents: "all",
              }}
            >
              {featureEntries.map(([featureId, fEntry]) => (
                <div key={featureId}>
                  {fEntry.presence === "absent" ? (
                    <Text size="1" as="div">
                      <Strong>{fEntry.name}</Strong>: absent
                    </Text>
                  ) : Object.keys(fEntry.characters).length === 0 ? (
                    <Text size="1" as="div">
                      <Strong>{fEntry.name}</Strong>: present
                    </Text>
                  ) : (
                    <>
                      <Text size="1" as="div" color="gray">
                        {fEntry.name}
                      </Text>
                      <DataList.Root size="1">
                        {Object.entries(fEntry.characters).map(
                          ([charId, charEntry]) => (
                            <DataList.Item key={charId}>
                              <DataList.Label minWidth="60" maxWidth="60">
                                {charEntry.name}
                              </DataList.Label>
                              <DataList.Value>
                                {charEntry.inverted ? (
                                  "Other"
                                ) : (
                                  <CharacterStateDisplay
                                    state={{
                                      kind: "categorical",
                                      traitValues: charEntry.traits,
                                    }}
                                  />
                                )}
                              </DataList.Value>
                            </DataList.Item>
                          ),
                        )}
                      </DataList.Root>
                    </>
                  )}
                </div>
              ))}

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
