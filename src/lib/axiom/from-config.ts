import { BUSINESS } from "@/config/business";
import { DEFAULT_HOURS, FOOD_HOURS } from "./hours";
import { NICHES } from "./niches";
import type { BusinessProfile, Offering, Post, TeamMember } from "./types";

/** Public shop painted from business.ts when Neon / PGLite is not available. */
export function profileFromConfig(): BusinessProfile {
  const hours = BUSINESS.niche === "food_truck" ? FOOD_HOURS : DEFAULT_HOURS;
  const team: TeamMember[] = BUSINESS.team.map((member, index) => ({
    id: index + 1,
    displayName: member.name,
    role: member.role,
    bio: member.bio,
    available: true,
    sortOrder: index,
    image: null,
  }));
  const offerings: Offering[] = BUSINESS.offerings.map((offering, index) => ({
    id: index + 1,
    memberId: team[offering.member]?.id ?? null,
    title: offering.title,
    description: offering.description,
    durationMin: offering.minutes,
    priceCents: offering.cents,
    image: null,
    kind: offering.kind,
  }));
  const posts: Post[] = BUSINESS.posts.map((body, index) => ({
    id: index + 1,
    body,
    image: null,
    createdAt: new Date().toISOString(),
  }));
  return {
    id: BUSINESS.id,
    name: BUSINESS.name,
    niche: BUSINESS.niche,
    tagline: BUSINESS.tagline,
    about: BUSINESS.about,
    haloTheme: BUSINESS.halo,
    haloColors: null,
    locationName: BUSINESS.locationName,
    locationNote: BUSINESS.locationNote,
    locationUpdatedAt: null,
    hoursJson: JSON.stringify(hours),
    heroImage: BUSINESS.heroImage ?? NICHES[BUSINESS.niche].hero,
    team,
    offerings,
    posts,
    takenSlots: [],
  };
}
