import React from "react";
import { cn } from "../../utils/cn";
import { Avatar, AvatarFallback } from "./avatar";

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

// Always initials-over-gradient, never a real image - so this only uses
// Avatar/AvatarFallback (no AvatarImage). The size-derived radius (0.32 of
// size, not a full circle) and font size are this app's own "squircle" look,
// kept exactly as before the shadcn adoption.
export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ name, accent, size = 32, className }) => (
  <Avatar
    className={cn("flex-shrink-0 shadow-sm", className)}
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
  >
    <AvatarFallback
      className={cn("text-white font-semibold", !accent && "bg-gemini-logo")}
      style={{
        fontSize: size * 0.4,
        borderRadius: Math.round(size * 0.32),
        ...(accent ? { background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` } : {}),
      }}
    >
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);
