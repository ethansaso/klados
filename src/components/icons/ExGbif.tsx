import { CSSProperties } from "react";

export const ExGbif = ({
  size,
  style,
}: {
  size?: number;
  style?: CSSProperties;
}) => {
  return (
    <img
      src="/logos/external/gbif-mark-white-logo.svg"
      alt="GBIF Logo"
      width={size ?? "100%"}
      height={size ?? "100%"}
      style={style}
    />
  );
};
