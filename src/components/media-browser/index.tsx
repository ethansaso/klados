import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog } from "@radix-ui/themes";
import { useState } from "react";
import { PiUploadSimple } from "react-icons/pi";
import type { MediaDTO } from "../../lib/domain/media/types";
import { toast } from "../../lib/utils/toast";
import SurfaceDialog from "../dialogs/SurfaceDialog";
import "./MediaBrowser.css";
import { MediaBrowserEdit } from "./MediaBrowserEdit";
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
  MediaBrowserSingleProps | MediaBrowserMultiProps;

type PaneMode = "select" | "upload" | "edit";

const PANE_TITLES: Record<PaneMode, string> = {
  select: "Browse Media",
  upload: "Upload Media",
  edit: "Edit Media",
};

const MediaBrowser = NiceModal.create<MediaBrowserProps>((props) => {
  const { visible, remove } = NiceModal.useModal();
  const [selected, setSelected] = useState<MediaDTO[]>([]);
  const [mode, setMode] = useState<PaneMode>("select");

  /** The item shown in the details column, and the one edit acts on. */
  const viewing = selected[selected.length - 1];

  const handleUpload = (media: MediaDTO, alreadyExisted: boolean) => {
    if (props.mode === "single") {
      setSelected([media]);
    } else {
      setSelected((prev) =>
        prev.some((m) => m.id === media.id) ? prev : [...prev, media],
      );
    }

    toast(
      alreadyExisted
        ? {
            variant: "default",
            description: "This image is already in the library.",
          }
        : { variant: "success", description: "Media uploaded successfully" },
    );
    setMode("select");
  };

  const handleSaved = (media: MediaDTO) => {
    setSelected((prev) => prev.map((m) => (m.id === media.id ? media : m)));
    toast({ variant: "success", description: "Media details updated" });
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
            {PANE_TITLES[mode]}
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
          onEdit={() => setMode("edit")}
          enabled={mode === "select"}
        />
        <MediaBrowserUpload
          key={mode} // reset upload form when switching modes
          {...props}
          onCancel={() => setMode("select")}
          onUpload={handleUpload}
          enabled={mode === "upload"}
        />
        {viewing && (
          <MediaBrowserEdit
            key={`edit-${mode}-${viewing.id}`} // refill form when target changes
            media={viewing}
            onCancel={() => setMode("select")}
            onSaved={handleSaved}
            enabled={mode === "edit"}
          />
        )}
      </SurfaceDialog.Content>
    </Dialog.Root>
  );
});

export default MediaBrowser;
