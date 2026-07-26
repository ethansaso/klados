import { Link, Text, Theme } from "@radix-ui/themes";
import { PiCopyrightFill } from "react-icons/pi";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  type MediaLicense,
} from "../../../db/utils/mediaLicense";
import type { MediaDTO } from "../../lib/domain/media/types";
import type {
  ResponsiveSize,
  Size,
} from "../../lib/utils/types/responsiveSize";
import "./AnnotationBubbleWrap.css";
import { spacingClasses } from "./spacingClasses";

type MediaAnnotation = Pick<MediaDTO, "owner" | "license" | "source">;

const LICENSE_LINKS: Record<MediaLicense, string | null> = {
  unknown: null,
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "cc-by": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
  "cc-by-nc": "https://creativecommons.org/licenses/by-nc/4.0/",
  "cc-by-nc-sa": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "cc-by-nd": "https://creativecommons.org/licenses/by-nd/4.0/",
  "cc-by-nc-nd": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  "all-rights-reserved": "",
};

type AnnotationBubbleWrapProps = {
  media?: MediaAnnotation | null;
  spacing?: Size | ResponsiveSize;
  children: React.ReactNode;
};

export const AnnotationBubbleWrap = ({
  media,
  spacing = "2",
  children,
}: AnnotationBubbleWrapProps) => {
  if (!media) return children;

  const { owner, license, source } = media;
  const classes = spacingClasses(spacing).join(" ");

  return (
    <div className={`annotation-bubble__wrapper ${classes}`}>
      <Theme appearance="light">
        <div className="annotation-bubble">
          <div className="annotation-bubble__indicator">
            <PiCopyrightFill />
          </div>
          <Text className="annotation-bubble__content" size="1" color="gray">
            {owner && <div className="owner-name">© {owner}</div>}
            {license && (
              <div className="license">
                <Link
                  href={LICENSE_LINKS[license] || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {HUMAN_CASED_MEDIA_LICENSES[license]}
                </Link>
              </div>
            )}
            {source && (
              <Link
                className="img-source"
                href={source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </Link>
            )}
          </Text>
        </div>
      </Theme>
      {children}
    </div>
  );
};
