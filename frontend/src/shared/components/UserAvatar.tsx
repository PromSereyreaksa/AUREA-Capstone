import { useState } from "react";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  seed?: string | number | null;
  className?: string;
  imageClassName?: string;
  initialsClassName?: string;
  title?: string;
}

const AVATAR_PALETTES = [
  {
    base: "#FB923C",
    accent: "#FDE68A",
    highlight: "#FFF7ED",
    shadow: "#C2410C",
    ink: "#1C1917",
  },
  {
    base: "#38BDF8",
    accent: "#A5F3FC",
    highlight: "#F0FDFF",
    shadow: "#0369A1",
    ink: "#082F49",
  },
  {
    base: "#22C55E",
    accent: "#BBF7D0",
    highlight: "#F0FDF4",
    shadow: "#15803D",
    ink: "#052E16",
  },
  {
    base: "#F472B6",
    accent: "#FBCFE8",
    highlight: "#FDF2F8",
    shadow: "#BE185D",
    ink: "#500724",
  },
  {
    base: "#A78BFA",
    accent: "#DDD6FE",
    highlight: "#F5F3FF",
    shadow: "#6D28D9",
    ink: "#2E1065",
  },
  {
    base: "#F87171",
    accent: "#FECACA",
    highlight: "#FEF2F2",
    shadow: "#B91C1C",
    ink: "#450A0A",
  },
  {
    base: "#2DD4BF",
    accent: "#99F6E4",
    highlight: "#F0FDFA",
    shadow: "#0F766E",
    ink: "#042F2E",
  },
  {
    base: "#FACC15",
    accent: "#FEF08A",
    highlight: "#FEFCE8",
    shadow: "#A16207",
    ink: "#422006",
  },
];

const joinClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getInitials = (name?: string | null, email?: string | null) => {
  const normalizedName = name?.trim();

  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return (parts[0][0] || "U").toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  const emailLocalPart = email?.trim().split("@")[0]?.replace(/[^A-Za-z0-9]/g, "");
  return (emailLocalPart?.[0] || "U").toUpperCase();
};

export default function UserAvatar({
  name,
  email,
  imageUrl,
  seed,
  className,
  imageClassName,
  initialsClassName,
  title,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const label = name?.trim() || email?.trim() || "User";
  const initials = getInitials(name, email);
  const paletteSeed = `${seed ?? ""}:${label}:${imageUrl ?? ""}`;
  const palette = AVATAR_PALETTES[hashString(paletteSeed) % AVATAR_PALETTES.length];

  return (
    <div
      className={joinClasses(
        "relative isolate flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${palette.base} 0%, ${palette.accent} 100%)`,
      }}
      title={title ?? label}
      aria-label={title ?? label}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={label}
          className={joinClasses("h-full w-full object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute -left-[18%] top-[-14%] h-3/4 w-3/4 rounded-full opacity-35"
            style={{ backgroundColor: palette.highlight }}
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[-32%] right-[-20%] h-4/5 w-4/5 rounded-full opacity-30"
            style={{ backgroundColor: palette.shadow }}
          />
          <span
            className={joinClasses(
              "relative z-10 select-none font-black uppercase leading-none",
              initialsClassName,
            )}
            style={{ color: palette.ink }}
          >
            {initials}
          </span>
        </>
      )}
    </div>
  );
}
