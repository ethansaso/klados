import { Card, IconButton, Separator, Tooltip } from "@radix-ui/themes";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { PiMinus, PiPlus, PiTreeStructure } from "react-icons/pi";
import { useKeyEditorStore } from "../../../../components/react-flow-keys/data/useKeyEditorStore";

export const KeyToolbar = () => {
  const { zoomIn, zoomOut } = useReactFlow();
  const autoLayout = useKeyEditorStore((s) => s.autoLayout);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  return (
    <Card className="key-toolbar">
      <Tooltip content="Zoom Out">
        <IconButton variant="ghost" size="1" onClick={handleZoomOut}>
          <PiMinus />
        </IconButton>
      </Tooltip>
      <Tooltip content="Zoom In">
        <IconButton variant="ghost" size="1" onClick={handleZoomIn}>
          <PiPlus />
        </IconButton>
      </Tooltip>
      <Separator orientation="vertical" size="4" mx="1" />
      <Tooltip content="Auto-Layout">
        <IconButton variant="ghost" size="1" onClick={autoLayout}>
          <PiTreeStructure />
        </IconButton>
      </Tooltip>
    </Card>
  );
};
