import type { NameItem } from "../../../../lib/domain/taxon-names/validation";
import { uploadMediaFn } from "../../../../lib/server-fns/media/uploadMediaFn";
import { fetchInatImport, inatPhotoToUploadItem } from "./inat";

export type InatImport = {
  names: NameItem[];
  mediaIds: number[];
  failedPhotoCount: number;
};

export async function importFromInat(inatId: number): Promise<InatImport> {
  const { names, photos } = await fetchInatImport(inatId);

  // One request per photo, so a bad one doesn't fail the batch
  const uploads = await Promise.allSettled(
    photos.map((p) =>
      uploadMediaFn({ data: { items: [inatPhotoToUploadItem(p)] } }),
    ),
  );
  const mediaIds = uploads.flatMap((r) =>
    r.status === "fulfilled" ? r.value.map((u) => u.media.id) : [],
  );

  return {
    names,
    mediaIds,
    failedPhotoCount: uploads.filter((r) => r.status === "rejected").length,
  };
}
