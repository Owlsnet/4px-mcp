// Client for the public endpoint behind https://track.4px.com

const ENDPOINT = "https://track.4px.com/track/v2/front/listTrackV3";
const MAX_CODES_PER_REQUEST = 40;

interface RawEvent {
  tkCode: string | null;
  tkDesc: string | null;
  tkTranslatedDesc: string | null;
  tkLocation: string | null;
  tkTimezone: string | null;
  tkDate: string | null;
  tkDateStr: string | null;
  tkCategoryName: string | null;
}

interface RawParcel {
  queryCode: string;
  serverCode: string | null;
  shipperCode: string | null;
  channelTrackCode: string | null;
  ctStartName: string | null;
  ctEndName: string | null;
  status: number | null;
  duration: number | null;
  tracks: RawEvent[] | null;
}

interface RawResponse {
  result: number;
  message: string;
  data: RawParcel[] | null;
}

export interface TrackingEvent {
  time: string | null;
  timezone: string | null;
  description: string;
  location: string | null;
  category: string | null;
}

export interface Parcel {
  trackingNumber: string;
  found: boolean;
  origin: string | null;
  destination: string | null;
  lastMileTrackingNumber: string | null;
  daysInTransit: number | null;
  latestEvent: TrackingEvent | null;
  events: TrackingEvent[];
  trackingUrl: string;
}

function normalizeEvent(e: RawEvent): TrackingEvent {
  return {
    time: e.tkDateStr ?? e.tkDate,
    timezone: e.tkTimezone || null,
    description: e.tkTranslatedDesc || e.tkDesc || "",
    location: e.tkLocation || null,
    category: e.tkCategoryName || null,
  };
}

function normalizeParcel(code: string, raw: RawParcel | undefined): Parcel {
  const events = (raw?.tracks ?? []).map(normalizeEvent);
  return {
    trackingNumber: code,
    found: events.length > 0,
    origin: raw?.ctStartName ?? null,
    destination: raw?.ctEndName ?? null,
    lastMileTrackingNumber: raw?.channelTrackCode ?? null,
    daysInTransit: raw?.duration ?? null,
    latestEvent: events[0] ?? null,
    events,
    trackingUrl: `https://track.4px.com/#/result/0/${encodeURIComponent(code)}`,
  };
}

async function fetchBatch(codes: string[], language: string): Promise<Parcel[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://track.4px.com/",
      "User-Agent": "Mozilla/5.0 (compatible; 4px-mcp/0.1)",
    },
    body: JSON.stringify({ queryCodes: codes, language, translateLanguage: language }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`4PX returned HTTP ${res.status}`);
  const body = (await res.json()) as RawResponse;
  if (body.result !== 1) throw new Error(`4PX error: ${body.message}`);
  const byCode = new Map((body.data ?? []).map((p) => [p.queryCode.toUpperCase(), p]));
  return codes.map((c) => normalizeParcel(c, byCode.get(c)));
}

export async function trackParcels(codes: string[], language = "en-us"): Promise<Parcel[]> {
  const unique = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  const results: Parcel[] = [];
  for (let i = 0; i < unique.length; i += MAX_CODES_PER_REQUEST) {
    results.push(...(await fetchBatch(unique.slice(i, i + MAX_CODES_PER_REQUEST), language)));
  }
  return results;
}

export function formatParcel(p: Parcel, maxEvents?: number): string {
  if (!p.found) {
    return `${p.trackingNumber}: no tracking information found yet.\n${p.trackingUrl}`;
  }
  const lines = [
    `${p.trackingNumber} (${p.origin ?? "?"} → ${p.destination ?? "?"})`,
    p.lastMileTrackingNumber ? `Last-mile tracking number: ${p.lastMileTrackingNumber}` : null,
    p.daysInTransit != null ? `Days in transit: ${p.daysInTransit}` : null,
    `Latest: ${describe(p.latestEvent!)}`,
    "",
    "History:",
    ...p.events.slice(0, maxEvents).map((e) => `- ${describe(e)}`),
    "",
    p.trackingUrl,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

function describe(e: TrackingEvent): string {
  const when = [e.time, e.timezone].filter(Boolean).join(" ");
  const where = e.location ? ` @ ${e.location}` : "";
  return `${when} — ${e.description}${where}`;
}
