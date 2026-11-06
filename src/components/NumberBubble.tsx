import "./NumberBubble.css";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** A tiny notification-style badge, minimum circular, expanding if needed. */
export function NumberBubble({ children, className }: Props) {
  return (
    <span
      className={className ? `number-bubble ${className}` : "number-bubble"}
    >
      {children}
    </span>
  );
}
