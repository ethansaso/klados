import type { CSSProperties } from "react";

export const ExGbif = ({
  size,
  style,
  color = "white",
}: {
  size?: number;
  style?: CSSProperties;
  color?: "white" | "gray" | "green";
}) => {
  const src =
    color === "white"
      ? "/logos/external/gbif-mark-white-logo.svg"
      : color === "gray"
        ? "/logos/external/gbif-mark-grey-logo.svg"
        : "/logos/external/gbif-mark-green-logo.svg";

  return (
    <img
      src={src}
      alt="GBIF Logo"
      width={size ?? "100%"}
      height={size ?? "100%"}
      style={style}
    />
  );
};
