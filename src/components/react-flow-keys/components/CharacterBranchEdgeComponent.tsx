import {
  Card,
  ContextMenu,
  DataList,
  Separator,
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
import { TraitTokenList } from "../../trait-tokens/TraitTokenList";
import { RFCharacterBranchEdge } from "../data/types";
import { useKeyEditorStore } from "../data/useKeyEditorStore";

const CharacterBranchEdgeComponent = memo(
  (props: EdgeProps<RFCharacterBranchEdge>) => {
    const {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      markerEnd,
      data: {
        branchId,
        rationale: { characters, annotation },
      },
    } = props;

    const { deleteElements } = useReactFlow();
    const updateBranchAnnotation = useKeyEditorStore(
      (s) => s.updateBranchAnnotation
    );

    // null = not editing; string = current draft text
    const [editingAnnotation, setEditingAnnotation] = useState<string | null>(
      null
    );
    // Ref for the textarea to focus when editing starts
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
      // Delete this edge by id; onEdgesChange will handle branch removal.
      deleteElements({
        edges: [{ id }],
      });
    }, [deleteElements, id]);

    const startEditing = useCallback(() => {
      setEditingAnnotation(annotation ?? "");
      // Focus the textarea on the next tick
      requestAnimationFrame(() => {
        taRef.current?.focus();
      });
    }, [annotation]);

    const commitAnnotation = useCallback(() => {
      if (!isEditing) return;
      const next = (editingAnnotation ?? "").trim();

      // Save to store; empty string means clear annotation
      updateBranchAnnotation(branchId, next.length ? next : null);
      setEditingAnnotation(null);
    }, [branchId, editingAnnotation, isEditing, updateBranchAnnotation]);

    const renderContextContent = useCallback(
      () => (
        <ContextMenu.Content>
          <ContextMenu.Label>Character Branch Details</ContextMenu.Label>
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
      ]
    );

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
                <DataList.Root size="1">
                  {Object.entries(characters).map(([charId, meta]) => (
                    <DataList.Item key={charId}>
                      <DataList.Label minWidth="60" maxWidth="60">
                        {meta.name}
                      </DataList.Label>
                      <DataList.Value>
                        {meta.inverted ? (
                          "Other"
                        ) : (
                          <TraitTokenList traits={meta.traits} />
                        )}
                      </DataList.Value>
                    </DataList.Item>
                  ))}
                </DataList.Root>

                {(isEditing || hasAnnotation) && (
                  <>
                    <Separator my="2" size="4" />
                    <TextArea
                      size="1"
                      variant="soft"
                      ref={taRef}
                      value={
                        isEditing
                          ? (editingAnnotation ?? "")
                          : (annotation ?? "")
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
  }
);

export default CharacterBranchEdgeComponent;
