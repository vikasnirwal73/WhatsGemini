import React from "react";
import { cn } from "../../utils/cn";

const getInitials = (name?: string) => {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

interface CharacterAvatarProps {
  name?: string;
  accent?: [string, string];
  size?: number;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ name, accent, size = 32, className }) => (
  <div
    className={cn(
      "flex items-center justify-center flex-shrink-0 text-white font-semibold shadow-sm",
      !accent && "bg-gemini-logo",
      className
    )}
    style={{
      width: size,
      height: size,
      fontSize: size * 0.4,
      borderRadius: Math.round(size * 0.32),
      ...(accent ? { background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` } : {}),
    }}
  >
    {getInitials(name)}
  </div>
);
