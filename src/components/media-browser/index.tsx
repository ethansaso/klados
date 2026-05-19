import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog } from "@radix-ui/themes";
import { useState } from "react";
import { PiUploadSimple } from "react-icons/pi";
import type { MediaDTO } from "../../lib/domain/media/types";
import { toast } from "../../lib/utils/toast";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import "./MediaBrowser.css";
import { MediaBrowserUpload } from "./MediaBrowserUpload";
import { MediaBrowserView } from "./MediaBrowserView";

export type MediaBrowserMode = "single" | "multi";
export type MediaBrowserSingleProps = {
  mode: "single";
  onSelect: (media: MediaDTO) => void;
};

export type MediaBrowserMultiProps = {
  mode: "multi";
  onSelect: (media: MediaDTO[]) => void;
};

export type MediaBrowserProps =
  | MediaBrowserSingleProps
  | MediaBrowserMultiProps;

const MediaBrowser = NiceModal.create<MediaBrowserProps>((props) => {
  const { visible, remove } = NiceModal.useModal();
  const [selected, setSelected] = useState<MediaDTO[]>([]);
  const [mode, setMode] = useState<"select" | "upload">("select");

  const handleUpload = (media: MediaDTO) => {
    if (props.mode === "single") {
      setSelected([media]);
    } else {
      setSelected((prev) => [...prev, media]);
    }

    toast({ variant: "success", description: "Media uploaded successfully" });
    setMode("select");
  };

  return (
    <Dialog.Root open={visible} onOpenChange={remove}>
      <SurfaceDialog.Content
        aria-describedby={undefined}
        className="media-browser"
        maxWidth={mode === "select" ? "896px" : "448px"}
        height={mode === "select" ? "min(80vh, 768px)" : undefined}
        size="2"
      >
        <SurfaceDialog.Header>
          <SurfaceDialog.Title trim="normal">
            {mode === "select" ? "Browse Media" : "Upload Media"}
          </SurfaceDialog.Title>
          {mode === "select" && (
            <Button size="1" onClick={() => setMode("upload")}>
              <PiUploadSimple />
              Upload
            </Button>
          )}
        </SurfaceDialog.Header>
        <MediaBrowserView
          {...props}
          selected={selected}
          setSelected={setSelected}
          onClose={remove}
          enabled={mode === "select"}
        />
        <MediaBrowserUpload
          key={mode} // reset upload form when switching modes
          {...props}
          onCancel={() => setMode("select")}
          onUpload={handleUpload}
          enabled={mode === "upload"}
        />
      </SurfaceDialog.Content>
    </Dialog.Root>
  );
});

export default MediaBrowser;
