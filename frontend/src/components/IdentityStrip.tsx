import Image from "next/image";
import type { Profile } from "@/types";

export function IdentityStrip({ profile }: { profile: Profile }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center">
      <div className="relative aspect-square w-[72%] overflow-hidden rounded-full border border-white/10 bg-ink-raised">
        {profile.photo_url ? (
          <Image
            src={profile.photo_url}
            alt={profile.full_name}
            width={640}
            height={640}
            priority
            className="h-full w-full object-cover object-top grayscale"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-7xl font-bold text-paper/80">
              {profile.full_name ? profile.full_name.charAt(0) : "S"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
