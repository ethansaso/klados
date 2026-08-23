import classNames from "classnames";
import type { ComponentProps } from "react";
import "./ColorBubble.css";

interface ColorBubbleProps extends ComponentProps<"span"> {
  hexColor: string;
  size?: number;
}

export const ColorBubble = ({
  className,
  style,
  hexColor,
  size = 8,
  ...props
}: ColorBubbleProps) => {
  const resolvedClassname = classNames("color-bubble", className);
  return (
    <span
      className={resolvedClassname}
      style={{ backgroundColor: hexColor, width: size, height: size, ...style }}
      {...props}
    />
  );
};
