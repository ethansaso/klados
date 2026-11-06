import { Link, Text, Theme } from "@radix-ui/themes";
import { PiCopyrightFill } from "react-icons/pi";
import { LicenseLink } from "../LicenseLink";
import type { MediaDTO } from "../../lib/domain/media/types";
import type {
  ResponsiveSize,
  Size,
} from "../../lib/utils/types/responsiveSize";
import "./AnnotationBubbleWrap.css";
import { spacingClasses } from "./spacingClasses";

type MediaAnnotation = Pick<MediaDTO, "owner" | "license" | "source">;

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
                <LicenseLink license={license} />
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
