import { Link, Text } from "@radix-ui/themes";
import { PiInfo } from "react-icons/pi";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  MEDIA_LICENSES,
} from "../db/utils/mediaLicense";

const LICENSE_LINKS: Record<(typeof MEDIA_LICENSES)[number], string> = {
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "cc-by": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
  "cc-by-nc": "https://creativecommons.org/licenses/by-nc/4.0/",
  "cc-by-nc-sa": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "cc-by-nd": "https://creativecommons.org/licenses/by-nd/4.0/",
  "cc-by-nc-nd": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  "all-rights-reserved": "",
};

export const AnnotationBubbleWrap = ({
  ownerName,
  license,
  source,
  spacing = "2",
  children,
}: {
  ownerName?: string;
  license?: string;
  source?: string;
  spacing?: "1" | "2" | "3" | "4";
  children: React.ReactNode;
}) => {
  if (!ownerName && !license && !source) return children;
  return (
    <div className={`annotation-bubble__wrapper spacing-${spacing}`}>
      <div className="annotation-bubble">
        <div className="annotation-bubble__indicator">
          <PiInfo />
        </div>
        <Text className="annotation-bubble__content" size="1" color="gray">
          {ownerName && <div className="owner-name">© {ownerName}</div>}
          {license && (
            <div className="license">
              <Link
                href={LICENSE_LINKS[license]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {HUMAN_CASED_MEDIA_LICENSES[license]}
              </Link>
            </div>
          )}
          {source && (
            <Link
              className="source"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source
            </Link>
          )}
        </Text>
      </div>
      {children}
    </div>
  );
};
