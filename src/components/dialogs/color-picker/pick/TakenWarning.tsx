import { LuTriangleAlert } from "react-icons/lu";
import "./TakenWarning.css";

type Props = {
  className?: string;
};

/** Marks a color with a small alert icon. */
export function TakenWarning({ className }: Props) {
  return (
    <LuTriangleAlert
      className={className ? `taken-warning ${className}` : "taken-warning"}
      aria-hidden
    />
  );
}
