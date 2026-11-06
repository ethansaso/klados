import { Link } from "@radix-ui/themes";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  type MediaLicense,
  MEDIA_LICENSE_LINKS,
} from "../../db/utils/mediaLicense";

type Props = {
  license: MediaLicense;
};

/** A media license's name, linked to its terms when it has any. */
export function LicenseLink({ license }: Props) {
  const href = MEDIA_LICENSE_LINKS[license];
  const name = HUMAN_CASED_MEDIA_LICENSES[license];

  return href ? (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {name}
    </Link>
  ) : (
    name
  );
}
