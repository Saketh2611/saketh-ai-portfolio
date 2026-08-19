import Image from "next/image";
import type { Profile } from "@/types";

export function IdentityStrip({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      {profile.photo_url ? (
        <Image
          src={profile.photo_url}
          alt={profile.full_name}
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-full border-2 border-ink-border object-cover"
        />
      ) : (
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-ink-border bg-ink-surface font-display text-xl text-paper-muted">
          {profile.full_name ? profile.full_name.charAt(0) : "S"}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper sm:text-3xl">
          {profile.full_name || "Loading…"}
        </h1>
        <p className="mt-1 font-mono text-sm text-signal-teal">{profile.headline}</p>
        {profile.location && (
          <p className="mt-1 text-sm text-paper-muted">{profile.location}</p>
        )}
      </div>
    </div>
  );
}
