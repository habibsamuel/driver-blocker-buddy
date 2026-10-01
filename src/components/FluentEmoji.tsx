import { cn } from "@/lib/utils";
import taxi from "@/assets/taxi.png.asset.json";
import oncomingTaxi from "@/assets/oncoming-taxi.png.asset.json";
import pin from "@/assets/pin.png.asset.json";
import check from "@/assets/check.png.asset.json";
import phone from "@/assets/phone.png.asset.json";
import shield from "@/assets/shield.png.asset.json";
import star from "@/assets/star.png.asset.json";

const emojiAssets = {
  taxi,
  "oncoming-taxi": oncomingTaxi,
  pin,
  check,
  phone,
  shield,
  star,
} as const;

export type FluentEmojiName = keyof typeof emojiAssets;

export function FluentEmoji({
  name,
  className,
  alt = "",
}: {
  name: FluentEmojiName;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={emojiAssets[name].url}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={cn("select-none object-contain drop-shadow-lg", className)}
      draggable={false}
    />
  );
}