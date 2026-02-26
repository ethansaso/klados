interface ColorBubbleProps {
  hexColor: string;
  size?: number;
}

export const ColorBubble = ({ hexColor, size = 16 }: ColorBubbleProps) => {
  return (
    <span
      className="color-bubble"
      style={{ backgroundColor: hexColor, width: size, height: size }}
    />
  );
};
