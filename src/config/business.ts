import type { HaloTheme, Niche } from "@/lib/axiom/types";

/**
 * THIS IS THE ONLY FILE YOU EDIT TO MAKE A CLIENT SHOP.
 */
export const BUSINESS: {
  active: boolean;
  id: string;
  name: string;
  niche: Niche;
  tagline: string;
  about: string;
  halo: HaloTheme;
  pin: string;
  locationName: string;
  locationNote: string;
  heroImage: string | null;
  team: { name: string; role: string; bio: string }[];
  offerings: {
    member: number;
    title: string;
    description: string;
    minutes: number;
    cents: number;
    kind: "service" | "menu";
  }[];
  posts: string[];
} = {
  active: true,
  id: "ritual-evolution",
  name: "Ritual Evolution",
  niche: "tattoo",
  tagline: "Fine jewelry, piercing, and tattoo in Ashland.",
  about:
    "Established in 2008. Ceremonial piercing, implant-grade jewelry, and custom tattoo. The owner fills hours, artists, and albums in Desk.",
  halo: "ink",
  pin: "4242",
  locationName: "77 N Main St, Ashland, OR",
  locationNote: "Downtown Ashland. Book after hours through the app.",
  heroImage: "/hero-tattoo.jpg",
  team: [
    { name: "Chari", role: "Piercer", bio: "Owner replaces this in Desk." },
    { name: "Artist 2", role: "Tattoo", bio: "Owner replaces this in Desk." },
  ],
  offerings: [
    { member: 0, title: "Piercing session", description: "Consult and placement.", minutes: 45, cents: 8000, kind: "service" },
    { member: 1, title: "Tattoo consult", description: "Draw, place, and hold the date.", minutes: 30, cents: 5000, kind: "service" },
  ],
  posts: [],
};
