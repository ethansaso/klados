import { Link, Text } from "@radix-ui/themes";
import { LicenseLink } from "../../../LicenseLink";
import type { PickerPhoto } from "../types";

type Props = {
  photo: PickerPhoto;
};

/** Owner, license, and source of the photo on screen. */
export function PhotoCredit({ photo }: Props) {
  const { owner, license, source } = photo;

  return (
    <Text size="1" color="gray" truncate style={{ minWidth: 0 }}>
      {owner && `© ${owner} · `}
      <LicenseLink license={license} />
      {source && (
        <>
          {" · "}
          <Link href={source} target="_blank" rel="noopener noreferrer">
            Source
          </Link>
        </>
      )}
    </Text>
  );
}
