"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../lib/api";

// ── Geo bubble map ────────────────────────────────────────────────────────────
// Approximate lat/lon centroids for ~90 common countries (ISO 3166-1 alpha-2)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  AD:[42.5,1.5],AE:[24,54],AF:[33,65],AG:[17.1,-61.8],AL:[41,20],AM:[40,45],
  AO:[-11.2,17.9],AR:[-34,-64],AT:[47.3,13.3],AU:[-27,133],AZ:[40.3,47.6],
  BA:[44,17.5],BD:[24,90],BE:[50.8,4],BF:[13,-2],BG:[43,25],BH:[26,50.5],
  BI:[-3.5,30],BJ:[9.3,2.3],BN:[4.9,115],BO:[-17,-65],BR:[-15,-47],BS:[24.3,-76],
  BT:[27.5,90.5],BW:[-22,24],BY:[53,28],BZ:[17.3,-88.7],CA:[56,-96],
  CD:[-4,25],CF:[7,21],CG:[-1,15],CH:[47,8],CI:[7.5,-5.5],CL:[-30,-71],
  CM:[6,12],CN:[35,103],CO:[4,-72],CR:[10,-84],CU:[21.5,-79.5],CV:[15,-24],
  CY:[35,33],CZ:[50,15.5],DE:[51,10],DJ:[11.5,42.5],DK:[56,10],DM:[15.4,-61.4],
  DO:[19,-70.7],DZ:[28,3],EC:[-2,-77.5],EE:[59,25],EG:[27,30],ER:[15,39],
  ES:[40,-4],ET:[8,38],FI:[64,26],FJ:[-18,178],FR:[46,2],GA:[-1,11.7],
  GB:[55.4,-3.4],GE:[42,43.5],GH:[8,-1],GM:[13.5,-15.5],GN:[11,-11.8],
  GQ:[2,10],GR:[39,22],GT:[15.5,-90.3],GW:[12,-15],GY:[5,-59],HN:[15,-86.5],
  HR:[45.2,16.5],HT:[19,-72.3],HU:[47,19.5],ID:[-5,120],IE:[53,-8],IL:[31.5,35],
  IN:[20,77],IQ:[33,44],IR:[32,53],IS:[65,-18],IT:[43,12],JM:[18,-77.3],
  JO:[31,36],JP:[36,138],KE:[1,38],KG:[41.2,74.8],KH:[12.5,104.9],KM:[-12.2,44.4],
  KP:[40,127],KR:[37,128],KW:[29,47.7],KZ:[48,68],LA:[18,103],LB:[33.9,35.5],
  LK:[7.9,80.8],LR:[6.4,-9.4],LS:[-29.5,28.5],LT:[56,24],LU:[49.8,6.1],
  LV:[57,25],LY:[27,17],MA:[32,-5],MD:[47,29],MG:[-20,47],MK:[41.6,21.7],
  ML:[17,-4],MM:[17,96],MN:[46,105],MR:[20,-12],MT:[35.9,14.4],MU:[-20.2,57.5],
  MV:[3.2,73],MW:[-13.5,34],MX:[24,-102],MY:[2.5,112.5],MZ:[-18,35],
  NA:[-22,17],NE:[16,8],NG:[10,8],NI:[13,-85],NL:[52.3,5.3],NO:[62,10],
  NP:[28,84],NZ:[-41,174],OM:[22,57],PA:[9,-80],PE:[-10,-76],PG:[-6,147],
  PH:[13,122],PK:[30,70],PL:[52,20],PT:[39.5,-8],PW:[7.5,134.6],PY:[-23,-58],
  QA:[25.5,51.2],RO:[46,25],RS:[44,21],RU:[60,100],RW:[-2,30],SA:[25,45],
  SB:[-8,160],SC:[-4.6,55.5],SD:[15,30],SE:[62,15],SG:[1.4,103.8],
  SI:[46,15],SK:[48.7,19.5],SL:[8.5,-11.8],SM:[43.9,12.5],SN:[14,-14],
  SO:[10,49],SR:[4,-56],ST:[1,7],SV:[14,-89],SY:[35,38],SZ:[-26.5,31.5],
  TD:[15,19],TG:[8,1.2],TH:[15,101],TJ:[39,71],TM:[40,60],TN:[34,9],
  TO:[-20.2,-175.2],TR:[39,35],TT:[11,-61],TW:[24,121],TZ:[-6,35],UA:[49,32],
  UG:[1,32],US:[38,-97],UY:[-33,-56],UZ:[41,64],VA:[41.9,12.5],VC:[13,-61.2],
  VE:[8,-66],VN:[16,108],VU:[-16,167],WS:[-13.6,-172.4],YE:[15,48],
  ZA:[-29,25],ZM:[-15,30],ZW:[-20,30],
};

// US state centroids keyed by 2-letter code (geoip-lite format)
const US_STATE_COORDS: Record<string, [number, number]> = {
  AL:[32.8,-86.8],AK:[64,-153],AZ:[34.3,-111.1],AR:[34.8,-92.2],CA:[36.8,-119.4],
  CO:[39,-105.5],CT:[41.6,-72.7],DE:[39,-75.5],FL:[28.6,-82.4],GA:[32.7,-83.4],
  HI:[20.3,-156.4],ID:[44.4,-114.6],IL:[40,-89.2],IN:[39.8,-86.1],IA:[42,-93.2],
  KS:[38.5,-98.4],KY:[37.5,-85],LA:[30.9,-91.8],ME:[45.4,-69.2],MD:[39,-76.8],
  MA:[42.3,-71.8],MI:[43.3,-84.5],MN:[46.4,-93.1],MS:[32.7,-89.7],MO:[38.5,-92.5],
  MT:[46.9,-110.5],NE:[41.5,-99.9],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40,-74.5],
  NM:[34.5,-106],NY:[42.9,-75.6],NC:[35.6,-79.8],ND:[47.5,-100.4],OH:[40.4,-82.7],
  OK:[35.5,-97.5],OR:[43.9,-120.6],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.8,-80.9],
  SD:[44.4,-100.2],TN:[35.8,-86.3],TX:[31,-100],UT:[39.3,-111.1],VT:[44,-72.7],
  VA:[37.5,-78.5],WA:[47.4,-120.5],WV:[38.6,-80.6],WI:[44.3,-89.8],WY:[43,-107.5],
  DC:[38.9,-77],PR:[18.2,-66.4],
};

// Other country region codes → lat/lon (geoip-lite uses ISO 3166-2 subdivision codes)
// Key format: "COUNTRY:REGION_CODE"
const REGION_COORDS: Record<string, [number, number]> = {
  // Canada provinces
  "CA:AB":[53.9,-116.6],"CA:BC":[53.7,-127.6],"CA:MB":[55,-97],"CA:NB":[46.6,-66.5],
  "CA:NL":[53.1,-57.7],"CA:NS":[45,-63],"CA:NT":[64.8,-124.8],"CA:NU":[70,-86],
  "CA:ON":[51.3,-85.3],"CA:PE":[46.4,-63.2],"CA:QC":[53.1,-70.3],"CA:SK":[54,-106],
  "CA:YT":[63,-136],
  // UK regions
  "GB:ENG":[52.6,-1.5],"GB:SCT":[57,-4],"GB:WLS":[52.3,-3.8],"GB:NIR":[54.6,-6.8],
  // Germany states
  "DE:BY":[48.5,11.5],"DE:NW":[51.5,7.5],"DE:BW":[48.5,9],"DE:HE":[50.6,9],
  "DE:NI":[52.6,9.8],"DE:BE":[52.5,13.4],"DE:HH":[53.5,10],"DE:SN":[51,13],
  // Australia states
  "AU:NSW":[-32,147],"AU:VIC":[-36.9,144.5],"AU:QLD":[-22,144],"AU:WA":[-26,122],
  "AU:SA":[-30,135.8],"AU:TAS":[-42,146.5],"AU:ACT":[-35.5,149.1],"AU:NT":[-20,133],
  // France regions
  "FR:IDF":[48.8,2.4],"FR:ARA":[45.7,4.8],"FR:HDF":[50.5,2.8],"FR:OCC":[43.7,2.2],
  "FR:NAQ":[44.8,-0.6],"FR:BRE":[48.2,-2.9],"FR:NOR":[49.2,0.5],"FR:PAC":[43.8,5.8],
  // India states
  "IN:MH":[19.3,75.7],"IN:UP":[27,80.6],"IN:TN":[11,78.7],"IN:KA":[14.5,75.5],
  "IN:GJ":[22.4,71.5],"IN:RJ":[27,74],"IN:WB":[23,87.9],"IN:AP":[15.9,79.7],
  // Brazil states
  "BR:SP":[-22,-47.7],"BR:RJ":[-22.2,-42.7],"BR:MG":[-18,-44.7],"BR:RS":[-29.5,-53.2],
  "BR:PR":[-24.7,-51.5],"BR:BA":[-12,-41.7],"BR:GO":[-15.8,-49.6],"BR:CE":[-5.2,-39.2],
  // Mexico states
  "MX:CMX":[19.4,-99.1],"MX:JAL":[20.7,-103.4],"MX:NLE":[25.5,-99.9],"MX:PUE":[19,-97.9],
  "MX:MEX":[19.4,-99.7],"MX:VER":[19,-96.1],"MX:YUC":[20.9,-89.1],"MX:TAM":[24.5,-98.5],
};

type GeoEntry = { country: string; count: number };
type RegionEntry = { country: string; region: string; count: number };

type TooltipState = { x: number; y: number; label: string; count: number; type: "country" | "region" };

function GeoVisitorMap({
  topCountries,
  topRegions,
}: {
  topCountries: GeoEntry[];
  topRegions: RegionEntry[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const W = 800;
  const H = 400;

  const maxCountryCount = Math.max(...topCountries.map((c) => c.count), 1);
  const maxRegionCount = Math.max(...topRegions.map((r) => r.count), 1);

  const latLon = (lat: number, lon: number) => ({
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  });

  // Country ghost rings (dim outline showing country presence)
  const countryBubbles = topCountries
    .filter((c) => COUNTRY_COORDS[c.country])
    .map((c) => {
      const [lat, lon] = COUNTRY_COORDS[c.country];
      const { x, y } = latLon(lat, lon);
      const r = 5 + Math.sqrt(c.count / maxCountryCount) * 18;
      return { ...c, x, y, r };
    });

  // Region-level filled bubbles
  const regionBubbles = topRegions.map((r) => {
    const key = `${r.country}:${r.region}`;
    // US states get their own lookup; others use REGION_COORDS
    let coords: [number, number] | undefined;
    if (r.country === "US") {
      coords = US_STATE_COORDS[r.region];
    } else {
      coords = REGION_COORDS[key];
    }
    if (!coords) return null;
    const [lat, lon] = coords;
    const { x, y } = latLon(lat, lon);
    const rv = 3 + Math.sqrt(r.count / maxRegionCount) * 14;
    return { ...r, x, y, r: rv };
  }).filter(Boolean) as (RegionEntry & { x: number; y: number; r: number })[];

  const handleEnter = (
    e: React.MouseEvent,
    label: string,
    count: number,
    type: "country" | "region"
  ) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label, count, type });
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-[#0d1117] border border-gray-800"
      style={{ paddingBottom: "50%" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = ((90 - lat) / 180) * H;
          return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="#1f2937" strokeWidth={0.5} />;
        })}
        {[-120, -60, 0, 60, 120].map((lon) => {
          const x = ((lon + 180) / 360) * W;
          return <line key={lon} x1={x} y1={0} x2={x} y2={H} stroke="#1f2937" strokeWidth={0.5} />;
        })}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#374151" strokeWidth={1} strokeDasharray="4 4" />

        {/* Country ghost rings */}
        {countryBubbles.map((b) => (
          <circle
            key={`country-${b.country}`}
            cx={b.x}
            cy={b.y}
            r={b.r}
            fill="rgba(99,102,241,0.08)"
            stroke="rgba(99,102,241,0.25)"
            strokeWidth={1}
            strokeDasharray="3 2"
            className="cursor-pointer"
            onMouseEnter={(e) => handleEnter(e, b.country, b.count, "country")}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Region filled bubbles */}
        {regionBubbles.map((b) => (
          <g key={`region-${b.country}-${b.region}`}>
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r}
              fill="rgba(99,102,241,0.5)"
              stroke="rgba(165,180,252,0.9)"
              strokeWidth={1}
              className="cursor-pointer"
              onMouseEnter={(e) =>
                handleEnter(e, `${b.country} · ${b.region}`, b.count, "region")
              }
              onMouseLeave={() => setTooltip(null)}
            />
            {b.r > 10 && (
              <text
                x={b.x}
                y={b.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill="rgba(255,255,255,0.9)"
                className="pointer-events-none select-none"
              >
                {b.region}
              </text>
            )}
          </g>
        ))}

        {/* Country labels for countries with no region breakdown */}
        {countryBubbles
          .filter((b) => !regionBubbles.some((rb) => rb.country === b.country))
          .map((b) => (
            b.r > 12 ? (
              <text
                key={`label-${b.country}`}
                x={b.x}
                y={b.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="rgba(129,140,248,0.9)"
                className="pointer-events-none select-none"
              >
                {b.country}
              </text>
            ) : null
          ))}

        {/* Axis labels */}
        <text x={4} y={12} fontSize={8} fill="#6b7280">60°N</text>
        <text x={4} y={H / 2 - 4} fontSize={8} fill="#6b7280">EQ</text>
        <text x={4} y={H - 4} fontSize={8} fill="#6b7280">60°S</text>

        {/* Legend */}
        <circle cx={W - 120} cy={H - 20} r={5} fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.25)" strokeWidth={1} strokeDasharray="3 2"/>
        <text x={W - 113} y={H - 19} fontSize={7} fill="#6b7280" dominantBaseline="middle">Country</text>
        <circle cx={W - 68} cy={H - 20} r={5} fill="rgba(99,102,241,0.5)" stroke="rgba(165,180,252,0.9)" strokeWidth={1}/>
        <text x={W - 61} y={H - 19} fontSize={7} fill="#6b7280" dominantBaseline="middle">Region</text>
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-black/90 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <span className="font-semibold">{tooltip.label}</span>
          <span className="ml-2 text-indigo-400">{tooltip.count.toLocaleString()} events</span>
          <span className="ml-1 text-gray-500">({tooltip.type})</span>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type AnalyticsSummary = {
  from: string;
  to: string;
  totals: {
    events: number;
    pageViews: number;
    clicks: number;
    formSubmits: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    avgSessionDurationSec: number;
  };
  supportBot: {
    answered: number;
    unanswered: number;
    contactClicks: number;
    questions: number;
    answerRatePct: number;
  };
  topPages: { path: string; count: number }[];
  topClicks: { label: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topRegions: { country: string; region: string; count: number }[];
  topCities: { city: string; count: number }[];
  funnel: {
    key: string;
    label: string;
    count: number;
    conversionFromPrevPct: number;
    dropOffFromPrevPct: number;
  }[];
  sourceFunnel: {
    source: string;
    landing: number;
    checkout: number;
    bookingSubmit: number;
    bookingConfirmed: number;
    register: number;
    checkoutRate: number;
    bookingRate: number;
    confirmRate: number;
    signupRate: number;
  }[];
};

type AnalyticsJourney = {
  key: string;
  source: string;
  visitorId: string | null;
  sessionId: string;
  firstSeen: string;
  lastSeen: string;
  durationSec: number;
  eventCount: number;
  user?: { id: string; email: string; name: string; role: string } | null;
  events: {
    id: string;
    createdAt: string;
    eventType: string;
    path: string | null;
    label: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
  }[];
};

type AnalyticsEvent = {
  id: string;
  eventType: "PAGE_VIEW" | "CLICK" | "FORM_SUBMIT" | "CUSTOM";
  path: string | null;
  element: string | null;
  label: string | null;
  sessionId: string;
  visitorId: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userId: string | null;
  referrer: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; email: string; name: string; role: string } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function escapeCsv(value: unknown) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [journeys, setJourneys] = useState<AnalyticsJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    setLoadError("");

    try {
      const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined;
      const toIso = dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined;

      const [summaryData, eventData, journeyData] = await Promise.all([
        adminApi.getAnalyticsSummary(accessToken, fromIso, toIso),
        adminApi.listAnalyticsEvents(accessToken, {
          limit: 300,
          eventType: eventTypeFilter === "ALL" ? undefined : eventTypeFilter,
          path: pathFilter || undefined,
          query: query || undefined,
          from: fromIso,
          to: toIso,
        }),
        adminApi.listAnalyticsJourneys(accessToken, {
          limit: 30,
          from: fromIso,
          to: toIso,
          query: query || undefined,
        }),
      ]);

      setSummary(summaryData as AnalyticsSummary);
      setEvents(eventData as AnalyticsEvent[]);
      setJourneys(journeyData as AnalyticsJourney[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const applyTodayPreset = () => {
    const today = toDateInputValue(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  const applyLastDaysPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateFrom(toDateInputValue(from));
    setDateTo(toDateInputValue(to));
  };

  const isTodayPreset = dateFrom && dateTo && dateFrom === dateTo && dateFrom === toDateInputValue(new Date());
  const isLast7Preset = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  }, [dateFrom, dateTo]);

  const isLast30Preset = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  }, [dateFrom, dateTo]);

  const clearFilters = () => {
    setQuery("");
    setPathFilter("");
    setEventTypeFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const exportCsv = () => {
    const headers = [
      "timestamp",
      "eventType",
      "path",
      "label",
      "element",
      "country",
      "region",
      "city",
      "visitorId",
      "sessionId",
      "userName",
      "userEmail",
      "referrer",
    ];

    const rows = events.map((event) => [
      event.createdAt,
      event.eventType,
      event.path ?? "",
      event.label ?? "",
      event.element ?? "",
      event.country ?? "",
      event.region ?? "",
      event.city ?? "",
      event.visitorId ?? "",
      event.sessionId,
      event.user?.name ?? "",
      event.user?.email ?? "",
      event.referrer ?? "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const fromPart = dateFrom || "all";
    const toPart = dateTo || "all";
    const link = document.createElement("a");
    link.href = url;
    link.download = `cookforme-analytics-${fromPart}-to-${toPart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_14%_10%,#f7fcf9_0,#ffffff_46%,#f8fbff_100%)] dark:bg-[radial-gradient(circle_at_14%_10%,#101916_0,#0a0f0d_55%,#070b09_100%)] text-slate-900 dark:text-slate-100">
      <div className="bg-white/95 backdrop-blur border-b border-emerald-100 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 shadow-[0_10px_30px_-25px_rgba(6,78,59,0.45)] dark:bg-zinc-950/95 dark:border-emerald-900/60 dark:shadow-none">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-bold text-lg sm:text-xl">Analytics</h1>
            <button
              onClick={() => void loadData()}
              className="text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
            >
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
            <Link href="/" className="shrink-0 text-xs text-slate-600 dark:text-slate-300 border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
              Home
            </Link>
            <Link href="/admin-compliance" className="shrink-0 text-xs text-slate-600 dark:text-slate-300 border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
              Compliance
            </Link>
            <Link href="/admin-users" className="shrink-0 text-xs text-slate-600 dark:text-slate-300 border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
              User Roles
            </Link>
            <Link href="/admin-audit" className="shrink-0 text-xs text-slate-600 dark:text-slate-300 border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition">
              Audit Logs
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {loadError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {loadError}
          </div>
        )}

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={applyTodayPreset}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isTodayPreset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => applyLastDaysPreset(7)}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isLast7Preset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => applyLastDaysPreset(30)}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isLast30Preset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Last 30 Days
              </button>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              >
                <option value="ALL">All Events</option>
                <option value="PAGE_VIEW">Page Views</option>
                <option value="CLICK">Clicks</option>
                <option value="FORM_SUBMIT">Form Submits</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              />
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => void loadData()}
                className="text-xs px-3 py-2 rounded-lg border border-black dark:border-white"
              >
                Apply
              </button>
              <button
                onClick={exportCsv}
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
              >
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                placeholder="Filter path (e.g. /chef)"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search label, element, user, visitor"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.events ?? 0}</p>
            <p className="text-xs text-gray-500">Total Events</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.totals.pageViews ?? 0}</p>
            <p className="text-xs text-gray-500">Page Views</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary?.totals.clicks ?? 0}</p>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary?.totals.formSubmits ?? 0}</p>
            <p className="text-xs text-gray-500">Form Submits</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.uniqueVisitors ?? 0}</p>
            <p className="text-xs text-gray-500">Unique Visitors</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.uniqueSessions ?? 0}</p>
            <p className="text-xs text-gray-500">Unique Sessions</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{formatDuration(summary?.totals.avgSessionDurationSec ?? 0)}</p>
            <p className="text-xs text-gray-500">Avg Session Duration</p>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Support Bot Performance</h2>
            <span className="text-xs text-gray-500">CUSTOM events</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{summary?.supportBot.answered ?? 0}</p>
              <p className="text-xs text-gray-500">Answered</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary?.supportBot.unanswered ?? 0}</p>
              <p className="text-xs text-gray-500">Unanswered</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xl font-bold">{summary?.supportBot.questions ?? 0}</p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary?.supportBot.answerRatePct ?? 0}%</p>
              <p className="text-xs text-gray-500">Answer Rate</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{summary?.supportBot.contactClicks ?? 0}</p>
              <p className="text-xs text-gray-500">Contact Clicks</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="font-semibold mb-3">Funnel Drop-off</h2>
          {(summary?.funnel?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No funnel data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary?.funnel.map((step) => (
                <div key={step.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.label}</span>
                    <span>
                      {step.count} sessions · {step.conversionFromPrevPct}% kept · {step.dropOffFromPrevPct}% drop
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white"
                      style={{ width: `${Math.max(2, step.conversionFromPrevPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">Funnel By Traffic Source</h2>
          {(summary?.sourceFunnel?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No source funnel data yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 pr-2">Source</th>
                  <th className="text-right py-2 px-2">Landing</th>
                  <th className="text-right py-2 px-2">Checkout</th>
                  <th className="text-right py-2 px-2">Booking</th>
                  <th className="text-right py-2 px-2">Confirmed</th>
                  <th className="text-right py-2 px-2">Signup</th>
                  <th className="text-right py-2 px-2">Checkout %</th>
                  <th className="text-right py-2 pl-2">Signup %</th>
                </tr>
              </thead>
              <tbody>
                {summary?.sourceFunnel.map((row) => (
                  <tr key={row.source} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-2 pr-2 font-semibold">{row.source}</td>
                    <td className="py-2 px-2 text-right">{row.landing}</td>
                    <td className="py-2 px-2 text-right">{row.checkout}</td>
                    <td className="py-2 px-2 text-right">{row.bookingSubmit}</td>
                    <td className="py-2 px-2 text-right">{row.bookingConfirmed}</td>
                    <td className="py-2 px-2 text-right">{row.register}</td>
                    <td className="py-2 px-2 text-right">{row.checkoutRate}%</td>
                    <td className="py-2 pl-2 text-right">{row.signupRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Pages</h2>
            {(summary?.topPages?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No page view data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topPages.map((item) => (
                  <div key={item.path} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.path}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Click Labels</h2>
            {(summary?.topClicks?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No click data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topClicks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Geo bubble map */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Visitor Geo Map</h2>
            <span className="text-xs text-gray-500">bubble size = event volume</span>
          </div>
          {(summary?.topCountries?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No geo data yet.</p>
          ) : (
            <GeoVisitorMap topCountries={summary!.topCountries} topRegions={summary!.topRegions} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Countries</h2>
            {(summary?.topCountries?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No geo data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topCountries.map((item) => (
                  <div key={item.country} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.country}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Regions</h2>
            {(summary?.topRegions?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No region data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topRegions.map((item) => (
                  <div key={`${item.country}-${item.region}`} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.country ? `${item.country} · ` : ""}{item.region}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Cities</h2>
            {(summary?.topCities?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No city data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topCities.map((item) => (
                  <div key={item.city} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.city}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="font-semibold mb-3">User/Visitor Journeys</h2>
          {journeys.length === 0 ? (
            <p className="text-sm text-gray-500">No journey data yet.</p>
          ) : (
            <div className="space-y-4">
              {journeys.map((journey) => (
                <div key={journey.key} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                    <span className="px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700 font-semibold">{journey.source}</span>
                    <span>{journey.user?.email ?? `visitor:${journey.visitorId ?? 'anonymous'}`}</span>
                    <span className="text-gray-500">{journey.eventCount} events</span>
                    <span className="text-gray-500">{formatDuration(journey.durationSec)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {journey.events.map((event) => (
                      <span key={event.id} className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                        {event.eventType}:{event.path ?? event.label ?? 'event'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-900">
            <div className="col-span-2">When</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-3">Path / Label</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Visitor / Session</div>
            <div className="col-span-1">User</div>
            <div className="col-span-1">Element / Referrer</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading analytics events…</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No analytics events found.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-900 items-start">
                <div className="col-span-2 text-xs text-gray-500">{formatDateTime(event.createdAt)}</div>
                <div className="col-span-1">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                    {event.eventType}
                  </span>
                </div>
                <div className="col-span-3 text-xs">
                  <p className="font-medium truncate">{event.path ?? "—"}</p>
                  <p className="text-gray-500 truncate">{event.label ?? "—"}</p>
                </div>
                <div className="col-span-2 text-xs">
                  <p className="truncate">{event.country ?? "—"}</p>
                  <p className="text-gray-500 truncate">{[event.region, event.city].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <div className="col-span-2 text-xs">
                  <p className="truncate">v: {event.visitorId ?? "—"}</p>
                  <p className="text-gray-500 truncate">s: {event.sessionId}</p>
                </div>
                <div className="col-span-1 text-xs">
                  <p className="font-medium truncate">{event.user?.name ?? "Anonymous"}</p>
                  <p className="text-gray-500 truncate">{event.user?.email ?? "—"}</p>
                </div>
                <div className="col-span-1 text-xs text-gray-500">
                  <p className="truncate">{event.element ?? "—"}</p>
                  <p className="truncate">{event.referrer ?? "—"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
