import type { ReactNode } from "react";

type Variant = "default" | "primary" | "success" | "outline";

export default function Chip({
  children, variant = "default", className = "", onClick,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
}) {
  const klass =
    variant === "primary" ? "chip chip-primary" :
    variant === "success" ? "chip chip-success" :
    variant === "outline" ? "chip chip-outline" :
    "chip";
  const Tag = onClick ? "button" : "span";
  return (
    <Tag onClick={onClick} className={`${klass} ${onClick ? "press" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
