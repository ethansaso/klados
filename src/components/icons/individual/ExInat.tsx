export const ExInat = ({
  size,
  color = "white",
}: {
  size?: number;
  color?: "white" | "green";
}) => {
  const src =
    color === "white"
      ? "/logos/external/inat-favicon-white.png"
      : "/logos/external/inat-favicon.png";

  return (
    <img
      src={src}
      alt="iNaturalist Logo"
      width={size ?? "100%"}
      height={size ?? "100%"}
    />
  );
};
