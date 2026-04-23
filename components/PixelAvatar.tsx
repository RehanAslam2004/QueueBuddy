"use client";

import { useIdentity } from "@/hooks/useIdentity";

interface PixelAvatarProps {
  username?: string | null;
  mcUsername?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PixelAvatar({ username, mcUsername, size = "md", className = "" }: PixelAvatarProps) {
  const { username: currentUsername, mcUsername: currentMcUsername } = useIdentity();
  
  const effectiveUsername = username || currentUsername;
  const effectiveMcUsername = mcUsername || currentMcUsername;

  const sizeMap = {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const avatarUrl = effectiveMcUsername 
    ? `https://mc-heads.net/avatar/${effectiveMcUsername}`
    : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${effectiveUsername || 'user'}`;

  return (
    <div className={`${sizeMap[size]} bg-black/10 voxel-border flex items-center justify-center p-0.5 overflow-hidden ${className}`}>
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-full h-full image-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
