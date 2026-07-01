import { Card, IconButton, Separator } from "@radix-ui/themes";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { PiMinus, PiPlus, PiTreeStructure } from "react-icons/pi";
import { useGuideEditorStore } from "../../../../components/react-flow-guides/editor/data/useGuideEditorStore";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";

export const GuideEditorToolbar = () => {
  const { zoomIn, zoomOut } = useReactFlow();
  const autoLayout = useGuideEditorStore((s) => s.autoLayout);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  return (
    <Card className="guide-editor-toolbar">
      <ResponsiveTooltip content="Zoom Out">
        <IconButton variant="ghost" size="1" onClick={handleZoomOut}>
          <PiMinus />
        </IconButton>
      </ResponsiveTooltip>
      <ResponsiveTooltip content="Zoom In">
        <IconButton variant="ghost" size="1" onClick={handleZoomIn}>
          <PiPlus />
        </IconButton>
      </ResponsiveTooltip>
      <Separator orientation="vertical" size="4" mx="1" />
      <ResponsiveTooltip content="Auto-Layout">
        <IconButton variant="ghost" size="1" onClick={autoLayout}>
          <PiTreeStructure />
        </IconButton>
      </ResponsiveTooltip>
    </Card>
  );
};
