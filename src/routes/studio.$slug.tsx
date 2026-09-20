import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useHalo, useHaloMood, useHaloTheme } from "@/components/axiom-shell";
import { HeroField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HALO_THEME_LIST, HALO_THEMES, sanitizeHaloColors } from "@/lib/axiom/halo";
import { parseHours } from "@/lib/axiom/hours";
import { NICHES } from "@/lib/axiom/niches";
import {
  addMember,
  addOffering,
  addPost,
  getStudio,
  setLocation,
  updateStudio,
} from "@/lib/axiom/server";
import { useStudioSession } from "@/lib/axiom/store";
import type { HaloTheme, StudioPayload } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio/$slug")({
  component: StudioPage,
});

function StudioPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const session = useStudioSession((s) => s.session);
  const ready = useStudioSession((s) => s.ready);
  const leave = useStudioSession((s) => s.leave);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["studio", slug],
    enabled: ready && session?.slug === slug,
    queryFn: () => getStudio({ data: { slug, pin: session!.pin } }),
    refetchInterval: 12_000,
  });

  useHaloMood("focus");
  useHaloTheme(
    (query.data?.haloTheme as HaloTheme | undefined) ?? "spectrum",
    query.data?.haloColors ?? null,
  );

  useEffect(() => {
    if (ready && session?.slug !== slug) {
      void navigate({ to: "/admin" });
    }
  }, [ready, session, slug, navigate]);

  if (!ready || session?.slug !== slug) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Opening studio…</p>;
  }
  if (query.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading the book…</p>;
  }
  if (query.error || !query.data) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Could not open this studio.</p>
        <Button className="mt-4" variant="outline" onClick={() => leave()}>
          Leave
        </Button>
      </main>
    );
  }

  const studio = query.data;
  const copy = NICHES[studio.niche];
  const pin = session.pin;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["studio", slug] });
  }

  return (
    <main className="flex flex-col gap-4 px-4 pb-8 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{copy.label}</p>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-display">{studio.name}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            leave();
            void navigate({ to: "/admin" });
          }}
        >
          Lock
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Changes land on the public page as soon as you save.</p>
      <Tabs defaultValue="presence">
        <TabsList>
          <TabsTrigger value="presence">Presence</TabsTrigger>
          <TabsTrigger value="team">{copy.teamLabel}</TabsTrigger>
          <TabsTrigger value="offer">{copy.offeringLabel}</TabsTrigger>
          <TabsTrigger value="place">Place</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="book">Book</TabsTrigger>
        </TabsList>
        <TabsContent value="presence">
          <PresenceForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="team">
          <TeamForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="offer">
          <OfferingForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="place">
          <PlaceForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="posts">
          <PostForm studio={studio} slug={slug} pin={pin} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="book">
          <BookingsList studio={studio} />
        </TabsContent>
      </Tabs>
      <Button asChild variant="outline">
        <Link to="/b/$slug" params={{ slug }}>
          View public page
        </Link>
      </Button>
    </main>
  );
}

function PresenceForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(studio.name);
  const [tagline, setTagline] = useState(studio.tagline);
  const [about, setAbout] = useState(studio.about);
  const [haloTheme, setHaloTheme] = useState<HaloTheme>(studio.haloTheme);
  const [hoursJson, setHoursJson] = useState(studio.hoursJson);
  const [heroImage, setHeroImage] = useState<string | null>(studio.heroImage);
  const seeded = studio.haloColors ?? HALO_THEMES[studio.haloTheme];
  const [tube, setTube] = useState(seeded[0] ?? "#5ce1e6");
  const [pulse, setPulse] = useState(seeded[1] ?? "#7a6cff");
  const [ember, setEmber] = useState(seeded[2] ?? "#ff5c8a");
  const [busy, setBusy] = useState(false);
  const { setColors, setTheme } = useHalo();

  useEffect(() => {
    const next = sanitizeHaloColors([tube, pulse, ember, tube, pulse, ember]);
    if (next) setColors(next);
  }, [tube, pulse, ember, setColors]);

  function applyColors(nextTheme: HaloTheme, next: string[]) {
    setHaloTheme(nextTheme);
    setTheme(nextTheme);
    setTube(next[0]);
    setPulse(next[1] ?? next[0]);
    setEmber(next[2] ?? next[0]);
    setColors(next);
  }

  async function save() {
    setBusy(true);
    try {
      parseHours(hoursJson);
      const haloColors = sanitizeHaloColors([tube, pulse, ember, tube, pulse, ember]);
      await updateStudio({
        data: { slug, pin, name, tagline, about, haloTheme, hoursJson, heroImage, haloColors },
      });
      if (haloColors) setColors(haloColors);
      toast.success("Presence saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Tagline" value={tagline} onChange={setTagline} />
      <HeroField label="Hero image" value={heroImage} onChange={setHeroImage} />
      <div className="flex flex-col gap-1.5">
        <Label>About</Label>
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={600} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {HALO_THEME_LIST.map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => applyColors(theme, HALO_THEMES[theme])}
            className={cn(
              "rounded-md border px-2 py-2 text-xs capitalize",
              haloTheme === theme ? "border-accent bg-card" : "border-border bg-muted",
            )}
          >
            {theme}
          </button>
        ))}
      </div>
      <Button onClick={save} disabled={busy}>
        Save presence
      </Button>
    </div>
  );
}

function TeamForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const copy = NICHES[studio.niche];
  return (
    <div className="flex flex-col gap-3">
      {(studio.team ?? []).map((member) => (
        <div key={member.id} className="rounded-lg border border-border bg-card p-3">
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>
      ))}
      <Field label={`New ${copy.teamSingular}`} value={name} onChange={setName} />
      <Field label="Role" value={role} onChange={setRole} />
      <Button
        onClick={() => {
          void addMember({ data: { slug, pin, name, role } })
            .then(() => {
              toast.success("Added");
              setName("");
              setRole("");
              onSaved();
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add"));
        }}
      >
        Add {copy.teamSingular}
      </Button>
    </div>
  );
}

function OfferingForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [cents, setCents] = useState("0");
  const copy = NICHES[studio.niche];
  return (
    <div className="flex flex-col gap-3">
      {(studio.offerings ?? []).map((offering) => (
        <div key={offering.id} className="rounded-lg border border-border bg-card p-3">
          <p className="font-medium">{offering.title}</p>
        </div>
      ))}
      <Field label={copy.offeringSingular} value={title} onChange={setTitle} />
      <Field label="Price in cents" value={cents} onChange={setCents} />
      <Button
        onClick={() => {
          void addOffering({
            data: {
              slug,
              pin,
              title,
              priceCents: Number(cents) || 0,
              durationMin: 30,
              kind: studio.niche === "food_truck" ? "menu" : "service",
            },
          })
            .then(() => {
              toast.success("Added");
              setTitle("");
              onSaved();
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add"));
        }}
      >
        Add {copy.offeringSingular}
      </Button>
    </div>
  );
}

function PlaceForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [locationName, setLocationName] = useState(studio.locationName ?? "");
  const [locationNote, setLocationNote] = useState(studio.locationNote ?? "");
  return (
    <div className="flex flex-col gap-3">
      <Field label="Place" value={locationName} onChange={setLocationName} />
      <Field label="Note" value={locationNote} onChange={setLocationNote} />
      <Button
        onClick={() => {
          void setLocation({ data: { slug, pin, locationName, locationNote } })
            .then(() => {
              toast.success("Place saved");
              onSaved();
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"));
        }}
      >
        Save place
      </Button>
    </div>
  );
}

function PostForm({
  studio,
  slug,
  pin,
  onSaved,
}: {
  studio: StudioPayload;
  slug: string;
  pin: string;
  onSaved: () => void;
}) {
  const [body, setBody] = useState("");
  return (
    <div className="flex flex-col gap-3">
      {(studio.posts ?? []).map((post) => (
        <p key={post.id} className="rounded-lg border border-border bg-card p-3 text-sm">
          {post.body}
        </p>
      ))}
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
      <Button
        onClick={() => {
          void addPost({ data: { slug, pin, body } })
            .then(() => {
              toast.success("Posted");
              setBody("");
              onSaved();
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Could not post"));
        }}
      >
        Post
      </Button>
    </div>
  );
}

function BookingsList({ studio }: { studio: StudioPayload }) {
  const rows = studio.bookings ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No bookings yet.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((booking) => (
        <div key={booking.id} className="rounded-lg border border-border bg-card p-3 text-sm">
          {booking.name ?? "Hold"}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
