import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface RealHospital {
  id: number;
  name: string;
  lat: number;
  lng: number;
  dist: number;
  phone: string;
  typeLabel: string;
  typeColor: string;
  emergency: boolean;
  amenity: string;
}

declare global {
  interface Window {
    L: any;
  }
}

function calcDist(la1: number, ln1: number, la2: number, ln2: number) {
  const R = 6371;
  const dLa = ((la2 - la1) * Math.PI) / 180;
  const dLn = ((ln2 - ln1) * Math.PI) / 180;
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dLn / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function resolveType(tags: Record<string, string>) {
  const operatorType = (tags["operator:type"] ?? "").toLowerCase();
  const gov = (tags.government ?? "").toLowerCase();
  const amenity = (tags.amenity ?? "").toLowerCase();
  const operator = (tags.operator ?? "").toLowerCase();

  if (operatorType === "public" || gov || operator.includes("กระทรวง") || operator.includes("สาธารณสุข")) {
    return { label: "รัฐ", color: "#4d9fff" };
  }
  if (operatorType === "private" || amenity === "clinic" || operator.includes("เอกชน")) {
    return { label: amenity === "clinic" ? "คลินิก" : "เอกชน", color: "#ffc94d" };
  }
  if (amenity === "clinic") {
    return { label: "คลินิก", color: "#ffc94d" };
  }
  return { label: "-", color: "#4d6a8a" };
}

function resolvePhone(tags: Record<string, string>) {
  return tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? tags.mobile ?? "";
}

let leafletReady = false;
function loadLeaflet(): Promise<void> {
  return new Promise((ok) => {
    if (leafletReady && window.L) { ok(); return; }
    if (!document.getElementById("lf-css")) {
      const link = document.createElement("link");
      link.id = "lf-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (document.getElementById("lf-js")) {
      const poll = setInterval(() => { if (window.L) { clearInterval(poll); leafletReady = true; ok(); } }, 80);
      return;
    }
    const script = document.createElement("script");
    script.id = "lf-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => { leafletReady = true; ok(); };
    document.head.appendChild(script);
  });
}

async function fetchHospitals(lat: number, lng: number): Promise<RealHospital[]> {
  // Cache check
  const cacheKey = `hosp_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const query = `[out:json][timeout:15];
(
  node["amenity"~"^(hospital|clinic)$"]["name"](around:10000,${lat},${lng});
  way["amenity"~"^(hospital|clinic)$"]["name"](around:10000,${lat},${lng});
  relation["amenity"~"^(hospital|clinic)$"]["name"](around:10000,${lat},${lng});
);
out center tags 20;`;

  const doFetch = () => Promise.any([
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query }),
    fetch("https://overpass.kumi.systems/api/interpreter", { method: "POST", body: query }),
  ]);

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    res = await doFetch();
  }

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();

  const list = (json.elements as any[])
    .filter((item) => item.tags?.name)
    .map((item) => {
      const hLat = item.lat ?? item.center?.lat ?? lat;
      const hLng = item.lon ?? item.center?.lon ?? lng;
      const tags: Record<string, string> = item.tags ?? {};
      const { label, color } = resolveType(tags);
      return {
        id: item.id,
        name: tags.name,
        lat: hLat,
        lng: hLng,
        dist: +(calcDist(lat, lng, hLat, hLng) * 1.4).toFixed(1),
        phone: resolvePhone(tags),
        typeLabel: label,
        typeColor: color,
        emergency: tags.emergency === "yes" || tags["opening_hours:emergency"] === "24/7",
        amenity: tags.amenity ?? "hospital",
      } as RealHospital;
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 20);

  try { sessionStorage.setItem(cacheKey, JSON.stringify(list)); } catch {}
  return list;
}

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .nbh-pop .leaflet-popup-content-wrapper {
      background: rgba(6,16,36,0.97) !important;
      border: 1px solid rgba(32,220,200,0.30) !important;
      box-shadow: 0 16px 48px rgba(0,0,0,.75), 0 0 28px rgba(32,220,200,.10) !important;
      border-radius: 16px !important; padding: 0 !important;
    }
    .nbh-pop .leaflet-popup-content { margin: 0 !important; }
    .nbh-pop .leaflet-popup-tip { background: rgba(6,16,36,0.97) !important; }
    .nbh-pop .leaflet-popup-close-button { color: rgba(104,200,255,.45) !important; font-size: 18px !important; top: 10px !important; right: 10px !important; padding: 0 !important; }
    .leaflet-control-zoom { border: none !important; margin-right: 16px !important; margin-top: 16px !important; display: flex !important; flex-direction: column !important; gap: 4px !important; }
    .leaflet-control-zoom a { background: rgba(6,16,34,0.92) !important; color: rgba(104,200,255,.75) !important; border: 1px solid rgba(32,160,200,0.20) !important; font-size: 18px !important; width: 40px !important; height: 40px !important; line-height: 40px !important; border-radius: 10px !important; }
    .leaflet-control-zoom a:hover { background: rgba(32,200,220,0.14) !important; color: #68f6ff !important; }
    .leaflet-control-attribution { display: none !important; }
    .nbh-mapwrap .leaflet-tile-pane { filter: brightness(0.7) saturate(0.56) hue-rotate(198deg); background: #020810; }
    .nbh-mapwrap .leaflet-tile { background: #020810; }
    @keyframes nbh-spin { to { transform: rotate(360deg) } }
    @keyframes nbh-ripple { 0% { transform: scale(0.8); opacity: .6 } 100% { transform: scale(2.6); opacity: 0 } }
    @keyframes nbh-glow { 0%,100% { box-shadow: 0 0 18px rgba(32,220,200,.8), 0 4px 16px rgba(0,0,0,.5) } 50% { box-shadow: 0 0 30px rgba(32,220,200,1), 0 4px 16px rgba(0,0,0,.5) } }
  `;
  document.head.appendChild(style);
}

export default function NearbyBrainHospitals() {
  const [phase, setPhase] = useState<"idle" | "gps" | "fetch" | "map" | "done" | "error">("idle");
  const { textScale } = useTheme();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [hospitals, setHospitals] = useState<RealHospital[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markers = useRef<{ id: number; m: any }[]>([]);
  const userMarkerRef = useRef<any>(null);
  const mapMinHeight = 310;

  // โหลด Leaflet + CSS ล่วงหน้าทันทีที่ mount
  useEffect(() => {
    loadLeaflet();
    injectCSS();
  }, []);

  const init = useCallback(async () => {
    setPhase("gps");
    setErrMsg("");
    setGpsAccuracy(null);

    let lat: number;
    let lng: number;

    try {
      const pos = await new Promise<GeolocationPosition>((ok, fail) =>
        navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }),
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      setGpsAccuracy(Math.round(pos.coords.accuracy));
    } catch (gpsErr: any) {
      const isDenied = gpsErr?.code === 1;
      const msg = isDenied
        ? "GPS ถูกปิดอยู่ กรุณาอนุญาต Location แล้วลองใหม่"
        : "ระบุตำแหน่ง GPS ไม่ได้ กรุณาลองใหม่";
      setErrMsg(msg);
      setPhase("error");
      return;
    }

    setUserLat(lat);
    setUserLng(lng);
    setPhase("fetch");

    let list: RealHospital[] = [];
    try {
      list = await fetchHospitals(lat, lng);
    } catch {
      setErrMsg("โหลดข้อมูลโรงพยาบาลไม่ได้ กรุณาลองใหม่");
      setPhase("error");
      return;
    }

    if (list.length === 0) {
      setErrMsg("ไม่พบโรงพยาบาลหรือคลินิกในรัศมี 10 กม. ลองขยับตำแหน่งแล้วรีเฟรช");
      setPhase("error");
      return;
    }

    setHospitals(list);
    setSelId(list[0].id);
    setPhase("map");
    await loadLeaflet(); // จะ resolve ทันทีถ้าโหลดไปแล้ว
    injectCSS();
    setPhase("done");
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (phase !== "done" || !mapDiv.current || !window.L || userLat === null || userLng === null) return;
    const L = window.L;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(mapDiv.current, { zoomControl: false, attributionControl: false }).setView([userLat, userLng], 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    const pinHtml = `
      <div style="position:relative;width:52px;height:62px;pointer-events:none;">
        <div style="position:absolute;top:6px;left:5px;width:42px;height:42px;border-radius:50%;border:2px solid rgba(32,220,195,0.55);animation:nbh-ripple 2.2s ease-out infinite;"></div>
        <div style="position:absolute;top:6px;left:5px;width:42px;height:42px;border-radius:50%;border:2px solid rgba(32,220,195,0.35);animation:nbh-ripple 2.2s ease-out infinite;animation-delay:.75s;"></div>
        <div style="position:absolute;top:2px;left:50%;transform:translateX(-50%) rotate(45deg);width:40px;height:40px;border-radius:6px 50% 6px 50%;background:linear-gradient(135deg,#18d8c0,#0bb8e8);border:2.5px solid rgba(255,255,255,0.30);box-shadow:0 0 20px rgba(24,220,192,.95),0 4px 14px rgba(0,0,0,.55);animation:nbh-glow 2.5s ease-in-out infinite;display:flex;align-items:center;justify-content:center;">
          <div style="transform:rotate(-45deg)">
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white'><circle cx='12' cy='7' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' stroke='white' stroke-width='0' fill='white'/></svg>
          </div>
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:16px;height:5px;border-radius:50%;background:rgba(0,0,0,.38);filter:blur(3px);"></div>
      </div>`;

    userMarkerRef.current = L.marker([userLat, userLng], {
      icon: L.divIcon({ className: "", iconSize: [52, 62], iconAnchor: [26, 58], popupAnchor: [0, -56], html: pinHtml }),
      zIndexOffset: 2000,
    }).addTo(map).bindPopup(
      `<div style="padding:16px 18px;font-family:'Sarabun',sans-serif;">
        <div style="font-weight:700;font-size:17px;color:#fff">📍 ตำแหน่งของคุณ</div>
        ${gpsAccuracy !== null ? `<div style="font-size:13px;color:#4d9fff;margin-top:4px;font-family:monospace;">ความแม่นยำ ~${gpsAccuracy}m</div>` : ""}
      </div>`,
      { className: "nbh-pop" },
    );

    markers.current = hospitals.map((hospital, idx) => {
      const isClosest = idx === 0;
      const icon = L.divIcon({
        className: "",
        iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16],
        html: `<div style="width:32px;height:32px;border-radius:50%;background:rgba(5,16,36,0.92);border:2px solid ${isClosest ? "#18d8c0" : "rgba(77,159,255,0.5)"};display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;box-shadow:0 0 ${isClosest ? "14px" : "5px"} ${isClosest ? "rgba(24,216,192,0.65)" : "rgba(77,159,255,0.25)"};">🏥</div>`,
      });

      const dirUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
      const popHtml = `
        <div style="padding:18px 18px 16px;font-family:'Sarabun',sans-serif;min-width:240px;">
          <div style="font-weight:700;font-size:18px;color:#fff;line-height:1.4;margin-bottom:8px;padding-right:20px">${hospital.name}</div>
          <div style="display:flex;align-items:center;gap:6px;color:#7aaac4;font-size:17px;margin-bottom:14px;">
            <span style="color:#18d8c0">📍</span> ${hospital.dist} กม. จากที่นี่
          </div>
          <a href="${dirUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 14px;background:rgba(24,180,210,0.16);border:1px solid rgba(24,220,200,0.40);border-radius:11px;color:#68f6ff;font-size:17px;font-weight:700;text-decoration:none;letter-spacing:.03em;">
            <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='#68f6ff' stroke-width='2.5'><polygon points='3 11 22 2 13 21 11 13 3 11'/></svg>
            ดูเส้นทาง
          </a>
          ${hospital.phone ? `<a href="tel:${hospital.phone}" style="display:block;margin-top:10px;color:#00d4aa;font-size:16px;font-family:monospace;text-decoration:none;text-align:center;">📞 ${hospital.phone}</a>` : ""}
        </div>`;

      const marker = L.marker([hospital.lat, hospital.lng], { icon })
        .addTo(map)
        .bindPopup(popHtml, { className: "nbh-pop", maxWidth: 320 })
        .on("click", () => setSelId(hospital.id));

      return { id: hospital.id, m: marker };
    });

    setTimeout(() => {
      map.invalidateSize();
      if (markers.current[0]) {
        map.setView(markers.current[0].m.getLatLng(), 15);
        markers.current[0].m.openPopup();
      }
    }, 220);
  }, [phase, hospitals, userLat, userLng, gpsAccuracy]);

  useEffect(() => {
    if (!mapRef.current || !selId) return;
    const selected = markers.current.find((m) => m.id === selId);
    if (!selected) return;
    mapRef.current.panTo(selected.m.getLatLng(), { animate: true, duration: 0.4 });
    selected.m.openPopup();
  }, [selId]);

  useEffect(() => {
    if (!mapRef.current) return;

    const onScroll = () => mapRef.current?.invalidateSize(true);
    window.addEventListener("scroll", onScroll, true);

    setTimeout(() => mapRef.current?.invalidateSize(true), 60);
    setTimeout(() => mapRef.current?.invalidateSize(true), 320);

    return () => window.removeEventListener("scroll", onScroll, true);
  }, [textScale]);

  const recenter = useCallback(() => {
    if (userLat === null || userLng === null) return;
    mapRef.current?.flyTo([userLat, userLng], 14, { animate: true, duration: 0.7 });
    userMarkerRef.current?.openPopup();
  }, [userLat, userLng]);

  const loading = phase !== "done" && phase !== "error";

  return (
    <div style={{ background: "linear-gradient(160deg,rgba(4,12,26,0.96),rgba(2,8,18,0.98))", border: "1px solid rgba(32,200,220,0.15)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 430 }}>
      <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(32,200,220,0.09)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontFamily: "monospace", color: "#4d9fff", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>Patient Locator</div>
          <div style={{ fontSize: 14, fontFamily: "monospace", color: "rgba(77,159,255,0.42)", marginTop: 4, lineHeight: 1.45 }}>
            {phase === "done" && hospitals.length > 0
              ? `พบ ${hospitals.length} แห่ง ภายใน 10 กม.`
              : phase === "gps" ? "กำลังระบุตำแหน่ง GPS..."
              : phase === "fetch" ? "กำลังค้นหาโรงพยาบาลใกล้บ้าน..."
              : phase === "map" ? "กำลังโหลดแผนที่..."
              : phase === "error" ? errMsg
              : "Medical Grid"}
          </div>
        </div>
        <button onClick={init} disabled={loading} title="รีเฟรช" style={{ background: "rgba(77,159,255,.06)", border: "1px solid rgba(77,159,255,.15)", borderRadius: 9, color: "#4d9fff", width: 40, height: 40, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.35 : 1, transition: "opacity .2s" }}>↻</button>
      </div>

      <div className="nbh-mapwrap" style={{ position: "relative", flex: "1 1 auto", minHeight: mapMinHeight, background: "#020810" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(24,216,192,0.08), transparent 32%),linear-gradient(180deg, rgba(12,25,48,0.5), rgba(4,10,20,0.82))", pointerEvents: "none", zIndex: 0 }} />
        <svg viewBox="0 0 1000 540" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22, pointerEvents: "none", zIndex: 0 }}>
          {Array.from({ length: 10 }).map((_, i) => <line key={`h-${i}`} x1="0" x2="1000" y1={i * 60} y2={i * 60} stroke="rgba(104,246,255,0.25)" strokeWidth="1" />)}
          {Array.from({ length: 14 }).map((_, i) => <line key={`v-${i}`} x1={i * 76} x2={i * 76} y1="0" y2="540" stroke="rgba(104,246,255,0.18)" strokeWidth="1" />)}
          <path d="M110 410 C220 320 340 355 430 250 C525 138 655 182 820 96" fill="none" stroke="rgba(104,246,255,0.55)" strokeWidth="4" strokeDasharray="10 10" />
          <circle cx="110" cy="410" r="8" fill="#21ffd0" />
          <circle cx="820" cy="96" r="9" fill="#68f6ff" />
        </svg>
        <div ref={mapDiv} style={{ width: "100%", height: "100%", minHeight: mapMinHeight }} />

        {phase === "done" && (
          <button onClick={recenter} style={{ position: "absolute", top: 128, right: 16, zIndex: 900, width: 40, height: 40, borderRadius: 10, background: "rgba(6,16,34,0.92)", border: "1px solid rgba(32,160,200,0.20)", color: "rgba(104,200,255,.75)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, transition: "all .2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(32,200,220,0.14)"; e.currentTarget.style.color = "#68f6ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(6,16,34,0.92)"; e.currentTarget.style.color = "rgba(104,200,255,.75)"; }}>⊙</button>
        )}

        {loading && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1000, background: "rgba(2,6,16,.94)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(24,216,192,.1)", borderTop: "3px solid #18d8c0", animation: "nbh-spin .9s linear infinite" }} />
            <div style={{ fontSize: 17, fontFamily: "monospace", color: "#2a6a7a", letterSpacing: ".12em" }}>
              {phase === "gps" ? "LOCATING GPS..." : phase === "fetch" ? "QUERYING OSM..." : "LOADING MAP..."}
            </div>
          </div>
        )}

        {phase === "error" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1000, background: "rgba(2,6,16,.94)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 30 }}>⚠️</div>
            <div style={{ fontSize: 17, color: "#ff5252", fontFamily: "monospace", textAlign: "center", padding: "0 20px", lineHeight: 1.5 }}>{errMsg}</div>
            <button onClick={init} style={{ background: "rgba(255,82,82,.1)", border: "1px solid rgba(255,82,82,.3)", color: "#ff5252", borderRadius: 8, padding: "8px 18px", fontSize: 17, fontFamily: "monospace", cursor: "pointer" }}>ลองใหม่</button>
          </div>
        )}

        {phase === "done" && (
          <div style={{ position: "absolute", bottom: 14, left: 14, zIndex: 900, background: "rgba(3,9,20,0.84)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#18d8c0", boxShadow: "0 0 7px #18d8c0" }} />
              <span style={{ fontSize: 17, color: "#6a98b4", fontFamily: "monospace" }}>ตำแหน่งปัจจุบัน</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", border: "2px solid #4d9fff", background: "transparent" }} />
              <span style={{ fontSize: 17, color: "#6a98b4", fontFamily: "monospace" }}>โรงพยาบาล</span>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div style={{ position: "absolute", bottom: 14, right: 16, zIndex: 900, fontSize: 15, color: "rgba(110,150,170,0.5)", fontFamily: "monospace", pointerEvents: "none" }}>
            Powered by Google Maps
          </div>
        )}
      </div>

      {phase === "done" && hospitals.length > 0 && (
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(24,200,210,0.08)", background: "rgba(2,8,18,0.78)", position: "relative" }}>
          <div style={{ padding: "12px 16px 4px", fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "rgba(77,159,255,0.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>Nearby Facilities</div>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 48, background: "linear-gradient(to right, transparent, rgba(2,8,18,0.92))", pointerEvents: "none", zIndex: 10 }} />
          <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", padding: "6px 16px 16px", WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}>
            {hospitals.map((hospital) => {
              const active = hospital.id === selId;
              return (
                <button key={hospital.id} onClick={() => setSelId(hospital.id)} style={{ flexShrink: 0, width: 220, scrollSnapAlign: "start", background: active ? "rgba(24,200,210,0.09)" : "rgba(255,255,255,0.022)", border: `1px solid ${active ? "rgba(24,220,200,0.42)" : "rgba(255,255,255,0.055)"}`, borderRadius: 11, padding: "14px 14px", textAlign: "left", cursor: "pointer", transition: "all .18s", boxShadow: active ? "0 0 14px rgba(24,220,200,0.09)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: active ? "rgba(24,200,210,0.10)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(24,220,200,0.28)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: active ? "#c8eeff" : "#5a7a94", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{hospital.name}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    {hospital.typeLabel !== "-" ? (
                      <span style={{ fontSize: 12, color: hospital.typeColor, background: `${hospital.typeColor}14`, border: `1px solid ${hospital.typeColor}26`, borderRadius: 4, padding: "3px 8px", fontFamily: "monospace" }}>{hospital.typeLabel}</span>
                    ) : <span />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: active ? "#18d8c0" : "#264860", fontFamily: "monospace" }}>{hospital.dist} กม.</span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(77,159,255,0.38)", fontFamily: "monospace" }}>
                    {hospital.emergency ? <span style={{ color: "#ff5252" }}>24H ฉุกเฉิน</span> : "เปิดให้บริการ"}
                  </div>
                </button>
              );
            })}
            <div style={{ flexShrink: 0, width: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}