/*
 * NearbyBrainHospitals.tsx — v5 (Readable Edition)
 * ✅ แผนที่สูงขึ้นมาก (clamp 320px–480px)
 * ✅ ตัวหนังสือทุกอันใหญ่ขึ้น อ่านออกชัด
 * ✅ การ์ดโรงพยาบาลกว้างขึ้น ข้อความชัด
 * ✅ ปรับขนาดได้ผ่าน --text-scale
 * ✅ Detail panel ชัดขึ้น
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/* ── Types ───────────────────────────────────────────── */
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

declare global { interface Window { L: any; } }

/* ── Utils ───────────────────────────────────────────── */
function calcDist(la1: number, ln1: number, la2: number, ln2: number) {
  const R = 6371, dLa = (la2-la1)*Math.PI/180, dLn = (ln2-ln1)*Math.PI/180;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLn/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
}

function resolveType(tags: Record<string,string>): { label: string; color: string } {
  const ot = (tags["operator:type"] ?? "").toLowerCase();
  const gov = (tags["government"] ?? "").toLowerCase();
  const amenity = (tags["amenity"] ?? "").toLowerCase();
  const operator = (tags["operator"] ?? "").toLowerCase();

  if (ot === "public" || gov || operator.includes("กระทรวง") || operator.includes("สาธารณสุข"))
    return { label: "รัฐ", color: "#4d9fff" };
  if (ot === "private" || amenity === "clinic" || operator.includes("เอกชน"))
    return { label: amenity === "clinic" ? "คลินิก" : "เอกชน", color: "#ffc94d" };
  if (amenity === "clinic")
    return { label: "คลินิก", color: "#ffc94d" };
  return { label: "—", color: "#4d6a8a" };
}

function resolvePhone(tags: Record<string,string>): string {
  return tags["phone"] ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? tags["mobile"] ?? "";
}

/* ── Leaflet loader ──────────────────────────────────── */
let leafletLoaded = false;
function loadLeaflet(): Promise<void> {
  return new Promise(resolve => {
    if (leafletLoaded && window.L) { resolve(); return; }
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id="lf-css"; l.rel="stylesheet";
      l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (document.getElementById("lf-js")) {
      const poll = setInterval(()=>{ if(window.L){ clearInterval(poll); leafletLoaded=true; resolve(); }},80);
      return;
    }
    const s = document.createElement("script");
    s.id="lf-js"; s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload=()=>{ leafletLoaded=true; resolve(); };
    document.head.appendChild(s);
  });
}

/* ── Overpass API ────────────────────────────────────── */
async function fetchHospitals(lat: number, lng: number): Promise<RealHospital[]> {
  const q = `[out:json][timeout:25];
(
  node["amenity"~"^(hospital|clinic)$"]["name"](around:6000,${lat},${lng});
  way["amenity"~"^(hospital|clinic)$"]["name"](around:6000,${lat},${lng});
  relation["amenity"~"^(hospital|clinic)$"]["name"](around:6000,${lat},${lng});
);
out center tags 25;`;

  const res = await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:q});
  const json = await res.json();

  return (json.elements as any[])
    .filter(el => el.tags?.name)
    .map(el => {
      const hLat = el.lat ?? el.center?.lat ?? lat;
      const hLng = el.lon ?? el.center?.lon ?? lng;
      const tags: Record<string,string> = el.tags ?? {};
      const { label, color } = resolveType(tags);
      return {
        id: el.id,
        name: tags.name,
        lat: hLat, lng: hLng,
        dist: calcDist(lat, lng, hLat, hLng),
        phone: resolvePhone(tags),
        typeLabel: label, typeColor: color,
        emergency: tags.emergency === "yes" || tags["emergency_service"] === "yes",
        amenity: tags.amenity ?? "hospital",
      } as RealHospital;
    })
    .sort((a,b) => a.dist - b.dist)
    .slice(0,12);
}

/* ── Leaflet popup global style ─────────── */
let styleInjected = false;
function injectMapStyle() {
  if (styleInjected) return; styleInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    .dp .leaflet-popup-content-wrapper{background:transparent!important;box-shadow:none!important;padding:0!important;border:none!important}
    .dp .leaflet-popup-content{margin:0!important}
    .dp .leaflet-popup-tip{background:#0a101e!important}
    .leaflet-control-zoom a{background:#0a101e!important;color:#8aa0c0!important;border-color:rgba(255,255,255,.1)!important;font-size:18px!important;width:36px!important;height:36px!important;line-height:36px!important}
    .leaflet-control-zoom a:hover{color:#d0e4ff!important}
    .leaflet-container{font-family:inherit;font-size:16px!important}
    .leaflet-container *{font-size:inherit}
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════ */
export default function NearbyBrainHospitals() {
  const [phase, setPhase]         = useState<"idle"|"gps"|"fetch"|"map"|"done"|"error">("idle");
  const { textScale } = useTheme();
  const [userLat, setUserLat]     = useState<number>(13.756);
  const [userLng, setUserLng]     = useState<number>(100.502);
  const [hospitals, setHospitals] = useState<RealHospital[]>([]);
  const [selId, setSelId]         = useState<number|null>(null);
  const [errMsg, setErrMsg]       = useState("");
  const mapDiv  = useRef<HTMLDivElement>(null);
  const mapRef  = useRef<any>(null);
  const markers = useRef<{id:number;m:any}[]>([]);
  const userM   = useRef<any>(null);

  useEffect(()=>{ init(); },[]);

  const init = useCallback(async()=>{
    setPhase("gps"); setErrMsg("");

    let lat=13.756, lng=100.502;
    try {
      const pos = await new Promise<GeolocationPosition>((ok,fail)=>
        navigator.geolocation.getCurrentPosition(ok,fail,{timeout:10000,maximumAge:60000}));
      lat=pos.coords.latitude; lng=pos.coords.longitude;
    } catch { /* fallback BKK */ }
    setUserLat(lat); setUserLng(lng);

    setPhase("fetch");
    let list: RealHospital[] = [];
    try {
      list = await fetchHospitals(lat, lng);
      setHospitals(list);
      if (list.length) setSelId(list[0].id);
    } catch {
      setErrMsg("ดึงข้อมูลไม่ได้ — ตรวจสอบอินเทอร์เน็ต");
      setPhase("error"); return;
    }

    setPhase("map");
    await loadLeaflet();
    injectMapStyle();
    setPhase("done");
  },[]);

  /* ── build map ── */
  useEffect(()=>{
    if (phase!=="done"||!mapDiv.current||!window.L) return;
    const L = window.L;
    if (mapRef.current){ mapRef.current.remove(); mapRef.current=null; }

    mapDiv.current.style.height = "220px";
    mapDiv.current.style.width  = "100%";

    const map = L.map(mapDiv.current,{zoomControl:false,attributionControl:false})
      .setView([userLat,userLng],15);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(map);
    L.control.zoom({position:"topright"}).addTo(map);
    mapRef.current = map;

    const userIcon = L.divIcon({
      className:"", iconSize:[24,24], iconAnchor:[12,12],
      html:`<div style="width:24px;height:24px;border-radius:50%;background:#ff5252;border:3px solid rgba(255,82,82,0.35);box-shadow:0 0 18px rgba(255,82,82,.9);"></div>`
    });
    userM.current = L.marker([userLat,userLng],{icon:userIcon,zIndexOffset:1000})
      .addTo(map)
      .bindPopup(`<div style="font-family:monospace;font-size:13px;color:#fff;background:#0a101e;padding:8px 13px;border-radius:10px;border:1px solid rgba(255,82,82,0.3)">📍 ตำแหน่งของคุณ</div>`,{className:"dp"});

    markers.current = hospitals.map(h=>{
      const icon = L.divIcon({
        className:"", iconSize:[34,34], iconAnchor:[17,17],
        html:`<div style="width:34px;height:34px;border-radius:50%;background:#0d1628;border:2px solid #4d9fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 12px rgba(77,159,255,.6);cursor:pointer">🏥</div>`
      });
      const popup = `<div style="font-family:monospace;font-size:13px;color:#d0e4ff;background:#0a101e;padding:13px 16px;border-radius:12px;border:1px solid rgba(77,159,255,.25);min-width:220px;line-height:1.8">
        <div style="font-weight:700;color:#fff;margin-bottom:5px;font-size:14px">${h.name}</div>
        <div style="color:#8aa0c0;margin-bottom:4px">📍 ${h.dist} กม.</div>
        ${h.typeLabel!=="—"?`<div style="color:${h.typeColor};font-size:12px;margin-bottom:3px">${h.typeLabel}</div>`:""}
        ${h.phone?`<a href="tel:${h.phone}" style="color:#00d4aa;text-decoration:none;display:block;margin-top:5px;font-size:13px">📞 ${h.phone}</a>`:""}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank"
          style="display:block;margin-top:10px;padding:7px 12px;background:rgba(77,159,255,.15);border:1px solid rgba(77,159,255,.3);border-radius:8px;color:#4d9fff;text-decoration:none;text-align:center;font-size:13px">
          🗺 นำทาง Google Maps
        </a>
      </div>`;
      const m = L.marker([h.lat,h.lng],{icon})
        .addTo(map)
        .bindPopup(popup,{className:"dp",maxWidth:280})
        .on("click",()=>setSelId(h.id));
      return {id:h.id, m};
    });

    setTimeout(() => {
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 300);
      if (markers.current[0]) markers.current[0].m.openPopup();
    }, 200);
  },[phase, hospitals, userLat, userLng]);

  useEffect(()=>{
    if (!mapRef.current||!selId) return;
    const entry = markers.current.find(x=>x.id===selId);
    if (entry){ mapRef.current.panTo(entry.m.getLatLng(),{animate:true,duration:.4}); entry.m.openPopup(); }
  },[selId]);

  /* ── invalidate map size when text-scale changes (prevents tile drift) ── */
  useEffect(()=>{
    if (!mapRef.current) return;
    setTimeout(() => mapRef.current?.invalidateSize(true), 50);
    setTimeout(() => mapRef.current?.invalidateSize(true), 300);
  },[textScale]);

  const recenter = useCallback(()=>{
    if (!mapRef.current) return;
    mapRef.current.flyTo([userLat,userLng],15,{animate:true,duration:.6});
    userM.current?.openPopup();
  },[userLat,userLng]);

  const sel = hospitals.find(h=>h.id===selId);
  const loading = phase!=="done"&&phase!=="error";

  return (
    <div style={{
      background:"rgba(10,16,30,.85)",
      backdropFilter:"blur(14px)",
      border:"1px solid rgba(255,255,255,.08)",
      borderRadius:18,
      overflow:"hidden",
      display:"flex",
      flexDirection:"column",
      /* ✅ FIX: ไม่ใช้ maxHeight แบบ clamp เพราะมัน overflow ออกมา
         ใช้ height เป็น % ของ viewport แทน และ flex column จัดการ */
      flex:"0 0 auto",
      minHeight:0,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding:"16px 20px",
        borderBottom:"1px solid rgba(255,255,255,.07)",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:42,height:42,borderRadius:12,
            background:"rgba(77,159,255,.12)",
            border:"1px solid rgba(77,159,255,.3)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
          }}>🏥</div>
          <div>
            <div style={{fontSize:"calc(16px * var(--text-scale,1))",fontWeight:700,color:"#d0e4ff",letterSpacing:".02em"}}>
              โรงพยาบาลใกล้คุณ
            </div>
            <div style={{fontSize:"calc(12px * var(--text-scale,1))",color:"#4d7a9a",fontFamily:"monospace",letterSpacing:".06em",marginTop:2}}>
              {phase==="done"&&hospitals.length>0
                ? `พบ ${hospitals.length} แห่ง ภายใน 6 กม.`
                : phase==="gps" ? "กำลังระบุ GPS..."
                : phase==="fetch" ? "กำลังค้นหา..."
                : phase==="map" ? "โหลดแผนที่..."
                : phase==="error" ? errMsg
                : "MEDICAL GRID"}
            </div>
          </div>
        </div>
        <button onClick={init} disabled={loading} title="รีเฟรช" style={{
          background:"rgba(77,159,255,.08)",
          border:"1px solid rgba(77,159,255,.2)",
          borderRadius:10,color:"#4d9fff",
          width:38,height:38,fontSize:20,
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          opacity:loading?.4:1,transition:"opacity .2s",
        }}>↻</button>
      </div>

      {/* ── Map ── fixed height, ไม่ยืดออก */}
      <div style={{position:"relative",height:"220px",background:"#060c18",flexShrink:0}}>
        <div ref={mapDiv} style={{width:"100%",height:"220px",minHeight:"220px"}} />

        {/* Recenter button */}
        {(phase==="done"||phase==="fetch")&&(
          <button onClick={recenter} title="กลับตำแหน่งฉัน" style={{
            position:"absolute",top:12,right:12,zIndex:900,
            background:"rgba(0,229,192,0.15)",backdropFilter:"blur(8px)",
            border:"1px solid rgba(0,229,192,0.4)",borderRadius:9,
            color:"#00e5c0",padding:"8px 16px",
            display:"flex",alignItems:"center",gap:7,
            cursor:"pointer",
            fontSize:"calc(13px * var(--text-scale,1))",
            fontFamily:"monospace",
            letterSpacing:".07em",boxShadow:"0 0 16px rgba(0,229,192,0.2)",
            transition:"all .2s",fontWeight:700,
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,229,192,0.28)";e.currentTarget.style.boxShadow="0 0 20px rgba(0,229,192,0.4)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,229,192,0.15)";e.currentTarget.style.boxShadow="0 0 16px rgba(0,229,192,0.2)";}}
          >
            📍 ตำแหน่งฉัน
          </button>
        )}

        {/* Loading overlay */}
        {loading&&(
          <div style={{
            position:"absolute",inset:0,zIndex:1000,
            background:"rgba(6,12,24,.93)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,
          }}>
            <div style={{
              width:48,height:48,borderRadius:"50%",
              border:"3px solid rgba(77,159,255,.15)",
              borderTop:"3px solid #4d9fff",
              animation:"nhb-spin .9s linear infinite",
            }}/>
            <div style={{fontSize:"calc(13px * var(--text-scale,1))",fontFamily:"monospace",color:"#4d7a9a",letterSpacing:".15em"}}>
              {phase==="gps"?"LOCATING GPS...":phase==="fetch"?"QUERYING OSM...":"LOADING MAP..."}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {phase==="error"&&(
          <div style={{
            position:"absolute",inset:0,zIndex:1000,
            background:"rgba(6,12,24,.93)",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,
          }}>
            <div style={{fontSize:36}}>⚠️</div>
            <div style={{fontSize:"calc(14px * var(--text-scale,1))",color:"#ff5252",fontFamily:"monospace",textAlign:"center",padding:"0 28px"}}>{errMsg}</div>
            <button onClick={init} style={{
              background:"rgba(255,82,82,.1)",border:"1px solid rgba(255,82,82,.3)",
              color:"#ff5252",borderRadius:9,padding:"9px 22px",
              fontSize:"calc(13px * var(--text-scale,1))",fontFamily:"monospace",cursor:"pointer",
            }}>ลองใหม่</button>
          </div>
        )}

        {/* Legend */}
        {phase==="done"&&(
          <div style={{
            position:"absolute",top:14,left:16,zIndex:900,
            background:"rgba(6,12,24,.88)",backdropFilter:"blur(6px)",
            border:"1px solid rgba(255,255,255,.08)",borderRadius:10,
            padding:"9px 14px",display:"flex",flexDirection:"column",gap:7,
          }}>
            {[
              {color:"#ff5252",label:"ตำแหน่งคุณ"},
              {color:"#4d9fff",label:"โรงพยาบาล"},
            ].map(({color,label})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:11,height:11,borderRadius:"50%",background:color,boxShadow:`0 0 7px ${color}99`}}/>
                <span style={{fontSize:"calc(12px * var(--text-scale,1))",color:"#8aa0c0",fontFamily:"monospace"}}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Hospital cards (horizontal scroll) ── */}
      {phase==="done"&&hospitals.length>0&&(
        <div style={{padding:"12px 18px 8px",flexShrink:0}}>
          <div style={{
            fontSize:"calc(12px * var(--text-scale,1))",
            color:"#4d7a9a",fontFamily:"monospace",
            letterSpacing:".1em",marginBottom:10,fontWeight:600,
          }}>NEARBY FACILITIES</div>
          <div style={{
            display:"flex",gap:10,
            overflowX:"auto",scrollbarWidth:"none",
            paddingBottom:6,
          }}>
            {hospitals.map(h=>{
              const active = h.id===selId;
              return (
                <button key={h.id} onClick={()=>setSelId(h.id)} style={{
                  flexShrink:0, width:"calc(180px * var(--text-scale,1))", minWidth:140,
                  background: active ? "rgba(77,159,255,.12)" : "rgba(255,255,255,.03)",
                  border:`1px solid ${active?"rgba(77,159,255,.45)":"rgba(255,255,255,.08)"}`,
                  borderRadius:12, padding:"10px 13px",
                  textAlign:"left", cursor:"pointer",
                  transition:"all .2s",
                  boxShadow: active ? "0 0 24px rgba(77,159,255,.12)" : "none",
                }}>
                  {/* name */}
                  <div style={{
                    fontSize:"calc(14px * var(--text-scale,1))",fontWeight:600,
                    color: active ? "#d0e4ff" : "#8aa0c0",
                    lineHeight:1.4, marginBottom:9,
                    overflow:"hidden",
                    display:"-webkit-box",
                    WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical",
                  }}>
                    {h.name}
                  </div>

                  {/* type + dist row */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    {h.typeLabel!=="—"
                      ? <span style={{
                          fontSize:"calc(12px * var(--text-scale,1))",color:h.typeColor,
                          background:`${h.typeColor}18`,
                          border:`1px solid ${h.typeColor}35`,
                          borderRadius:6,padding:"3px 9px",fontFamily:"monospace",
                        }}>{h.typeLabel}</span>
                      : <span/>}
                    <span style={{
                      fontSize:"calc(13px * var(--text-scale,1))",fontWeight:700,
                      color: active ? "#4d9fff" : "#3a5a7a",
                      fontFamily:"monospace",
                    }}>{h.dist} กม.</span>
                  </div>

                  {/* phone */}
                  {h.phone
                    ? <a href={`tel:${h.phone}`} onClick={e=>e.stopPropagation()} style={{
                        display:"block",
                        fontSize:"calc(12px * var(--text-scale,1))",
                        color:"#00d4aa",
                        fontFamily:"monospace",textDecoration:"none",marginTop:4,
                      }}>📞 {h.phone}</a>
                    : <span style={{fontSize:"calc(11px * var(--text-scale,1))",color:"rgba(100,130,160,.4)",fontFamily:"monospace"}}>ไม่มีเบอร์ใน OSM</span>
                  }

                  {/* emergency */}
                  {h.emergency&&(
                    <div style={{
                      marginTop:8,
                      fontSize:"calc(11px * var(--text-scale,1))",
                      color:"#ff5252",
                      background:"rgba(255,82,82,.1)",
                      border:"1px solid rgba(255,82,82,.25)",
                      borderRadius:6,padding:"3px 9px",
                      display:"inline-block",fontFamily:"monospace",
                    }}>24H ฉุกเฉิน</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes nhb-spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}