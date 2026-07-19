"use client";

import { cn } from "@/lib/utils";

const avatarColors = [
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-cyan-400 to-indigo-600",
];

const tilePastels = [
  "bg-rose-50",
  "bg-sky-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-violet-50",
  "bg-orange-50",
];

function productInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface ProductAvatarProps {
  name: string;
  imageUrl?: string | null;
  productId?: number;
  size?: "sm" | "md" | "lg" | "tile";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-xs rounded-xl",
  md: "h-14 w-14 text-sm rounded-2xl",
  lg: "h-20 w-20 text-lg rounded-2xl",
  tile: "h-full w-full text-3xl rounded-xl",
};

export default function ProductAvatar({
  name,
  imageUrl,
  productId = 0,
  size = "md",
  className,
}: ProductAvatarProps) {
  const gradient = avatarColors[productId % avatarColors.length];
  const pastel = tilePastels[productId % tilePastels.length];

  if (size === "tile") {
    return (
      <div
        className={cn(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl",
          pastel,
          className
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-extrabold text-white shadow-md",
              gradient
            )}
          >
            {productInitials(name || "?")}
          </div>
        )}
      </div>
    );
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className={cn(
          "shrink-0 object-cover shadow-md ring-1 ring-black/5",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-extrabold text-white shadow-md",
        sizeClasses[size],
        gradient,
        className
      )}
    >
      {productInitials(name || "?")}
    </div>
  );
}
