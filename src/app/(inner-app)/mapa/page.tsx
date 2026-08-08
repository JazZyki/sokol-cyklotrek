"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { SokolLoader } from "@/components/SokolLoader";
import { PoiModal } from "@/components/PoiModal";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, Route } from "lucide-react";
import { useTracking, TrackPoint } from "@/lib/TrackingContext";
import { calculateDistance } from "@/lib/utils";

const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <SokolLoader />,
});

interface GeoJSONData {
  coordinates: [number, number][];
}

interface QuizQuestion {
  q: string;
  a: string[];
  c: number;
}

interface PoiPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  description?: string;
  history_text?: string;
  quiz_data?: QuizQuestion | QuizQuestion[] | string; // JSON column from Supabase
}

interface TeamTrackingRecord {
  lat_val: number;
  lon_val: number;
  distance_from_route: number;
  session_id: string;
  created_at: string;
}

export default function MapPage() {
  const { 
    isTracking, 
    segments, setSegments, 
    userLocation, 
    elapsedTime, setElapsedTime, 
    debugMsg, setDebugMsg,
    handleToggleTracking 
  } = useTracking();

  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [poiPoints, setPoiPoints] = useState<PoiPoint[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [selectedPoi, setSelectedPoi] = useState<PoiPoint | null>(null);
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showTrackHistory, setShowTrackHistory] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("knin_show_track_history");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const toggleTrackHistory = () => {
    setShowTrackHistory((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("knin_show_track_history", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    // Najdeme elementy podle ID nebo tagů (v layoutu je musíme označit)
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (isFullScreen) {
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
    } else {
      if (header) header.style.display = 'flex';
      if (footer) footer.style.display = 'flex';
    }

    return () => {
      if (header) header.style.display = 'flex';
      if (footer) footer.style.display = 'flex';
    };
  }, [isFullScreen]);

  // Pomocná funkce pro formátování času (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
  };

  // Výpočet celkové vzdálenosti (používáme segments z contextu)
  const totalDistance = segments.reduce((acc, segment) => {
    const segmentDist = segment.points.reduce((segAcc, point, idx) => {
      if (idx === 0) return 0;
      const prev = segment.points[idx - 1];
      const dist = calculateDistance(
        prev.coords[0],
        prev.coords[1],
        point.coords[0],
        point.coords[1],
      );
      // Ignorujeme nereálné skoky (např. > 0.5 km mezi dvěma bezprostředně po sobě jdoucími body)
      if (dist > 0.5) return segAcc;
      return segAcc + dist;
    }, 0);
    return acc + segmentDist;
  }, 0);

  // Načtení historických dat
  useEffect(() => {
    const teamId = localStorage.getItem("knin_team_id");
    console.log("🔍 Inicializace Mapy pro tým:", teamId);
    
    if (!teamId) {
      console.warn("⚠️ Žádné teamId v localStorage, přesměrovávám...");
      router.push("/");
      return;
    }
    
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // 1. Načtení trasy
        const { data: routeData } = await supabase
          .from("route_display")
          .select("geojson_data")
          .maybeSingle();

        if (routeData?.geojson_data) {
          const coords = (routeData.geojson_data as GeoJSONData).coordinates;
          setRoute(coords.map(([lon, lat]: [number, number]) => [lat, lon]));
          console.log("✅ Trasa načtena, počet bodů:", coords.length);
        }

        // 2. Načtení historie jen pokud ještě nemáme segments (např. při prvním loadu)
        if (segments.length === 0) {
          console.log("🛰️ Stahuji historii z team_tracking...");
          
          let allHistory: TeamTrackingRecord[] = [];
          let from = 0;
          const step = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data: historyChunk, error: histError } = await supabase
              .from("team_tracking")
              .select(
                "lat_val, lon_val, distance_from_route, session_id, created_at",
              )
              .eq("team_id", teamId)
              .order("created_at", { ascending: true })
              .range(from, from + step - 1);

            if (histError) {
              console.error("❌ Chyba při načítání historie:", histError.message);
              hasMore = false;
              break;
            }

            if (historyChunk && historyChunk.length > 0) {
              allHistory = [...allHistory, ...historyChunk];
              from += step;
              // Pokud jsme dostali méně bodů než je krok, znamená to, že jsme na konci
              if (historyChunk.length < step) hasMore = false;
              // Bezpečnostní pojistka proti nekonečné smyčce
              if (allHistory.length > 20000) hasMore = false;
            } else {
              hasMore = false;
            }
          }

          if (allHistory.length > 0) {
            console.log(`📊 Celkem staženo ${allHistory.length} bodů historie.`);
            
            const processedSegments: { points: TrackPoint[] }[] = [];
            let currentPoints: TrackPoint[] = [];
            let lastTime = 0;
            let lastLat = 0;
            let lastLon = 0;
            let lastSessionId = "";

            allHistory.forEach((h) => {
              const currentTime = new Date(h.created_at).getTime();
              const sId = h.session_id || "missing";
              
              let isNewSegment = false;
              
              if (currentPoints.length === 0) {
                isNewSegment = true;
              } else {
                // Skok 1: Změna ID vycházky (session_id)
                if (sId !== lastSessionId) isNewSegment = true;
                
                // Skok 2: Časová proluka větší než 15 minut mezi body
                if (currentTime - lastTime > 15 * 60 * 1000) isNewSegment = true;
                
                // Skok 3: Nereálná vzdálenost - pokud bod uskočí o více než 1 km
                const distToLast = calculateDistance(lastLat, lastLon, h.lat_val, h.lon_val);
                if (distToLast > 1) isNewSegment = true;
              }
              
              if (isNewSegment && currentPoints.length > 0) {
                processedSegments.push({ points: currentPoints });
                currentPoints = [];
              }
              
              currentPoints.push({
                coords: [h.lat_val, h.lon_val],
                dist: h.distance_from_route || 0,
                sessionId: sId,
                created_at: h.created_at
              });
              
              lastTime = currentTime;
              lastLat = h.lat_val;
              lastLon = h.lon_val;
              lastSessionId = sId;
            });
            
            if (currentPoints.length > 0) {
              processedSegments.push({ points: currentPoints });
            }
            
            console.log("🧩 Zpracované segmenty:", processedSegments.length, processedSegments);
            setSegments(processedSegments);

            let totalSecondsFromHistory = 0;
            processedSegments.forEach((segment) => {
              if (segment.points.length > 1) {
                const start = new Date(segment.points[0].created_at || "").getTime();
                const end = new Date(
                  segment.points[segment.points.length - 1].created_at || "",
                ).getTime();
                totalSecondsFromHistory += Math.floor((end - start) / 1000);
              }
            });

            setElapsedTime(totalSecondsFromHistory);
          }
        }

        // 3. POI Body
        const { data: pois } = await supabase.from("poi_points").select("*");
        if (pois) {
          setPoiPoints(pois);
          console.log("📍 Načteno POI bodů:", pois.length);
        }

        // 4. Progres týmu
        const { data: progress } = await supabase
          .from("team_poi_progress")
          .select("poi_id")
          .eq("team_id", teamId);

        const teamName = (localStorage.getItem("knin_team_name") || "").trim().toLowerCase();
        const isAdminTeam = teamName === "admin" || teamName === "krakonos";
        setShowRoute(isAdminTeam);

        if (progress || isAdminTeam) {
          const ids = new Set(progress ? progress.map((p) => String(p.poi_id)) : []);
          
          // Speciální bypass pro testera / administrátora (Admin / Krakonoš)
          if (isAdminTeam && pois) {
            pois.forEach(p => ids.add(String(p.id)));
            console.log("🔑 Admin/Test tým detekován: Všechny POI body odemčeny.");
          }

          setUnlockedIds(ids);
          if (typeof window !== "undefined") {
            localStorage.setItem("knin_unlocked_pois", JSON.stringify(Array.from(ids)));
          }
          console.log("🔓 Odemčené body:", ids.size);
        }

        setDebugMsg("GPS připravena");
      } catch (err) {
        console.error("🔥 Fatální chyba v fetchInitialData:", err);
        setDebugMsg("❌ Chyba při inicializaci");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router, segments.length, setElapsedTime, setSegments, setDebugMsg]);

  // POI Proximity Check (provádíme i v Mapa page, protože tady chceme UI feedback)
  useEffect(() => {
    if (!userLocation || poiPoints.length === 0) return;

    const checkPois = async () => {
      const [lat, lon] = userLocation;
      for (const poi of poiPoints) {
        if (unlockedIds.has(String(poi.id))) continue;

        const distToPoi = calculateDistance(lat, lon, poi.lat, poi.lon) * 1000;

        if (distToPoi <= 10) {
          const teamId = localStorage.getItem("knin_team_id");
          if (teamId) {
            const { error } = await supabase
              .from("team_poi_progress")
              .insert({ team_id: teamId, poi_id: poi.id });

            if (!error || (error && "code" in error && error.code === "23505")) {
              setUnlockedIds((prev) => {
                const next = new Set([...prev, String(poi.id)]);
                if (typeof window !== "undefined") {
                  localStorage.setItem("knin_unlocked_pois", JSON.stringify(Array.from(next)));
                }
                return next;
              });
              setDebugMsg(`🌟 BOD ODEMČEN: ${poi.name}`);
              
              // Haptická odezva: dvě krátká zavibrování
              if ("vibrate" in navigator) {
                navigator.vibrate([100, 50, 100]);
              }
            }
          }
        }
      }
    };
    checkPois();
  }, [userLocation, poiPoints, unlockedIds, setDebugMsg]);

  const calculatePace = () => {
    if (totalDistance === 0 || elapsedTime === 0) return "--:--";
    const paceDecimal = elapsedTime / 60 / totalDistance;
    const mins = Math.floor(paceDecimal);
    const secs = Math.round((paceDecimal - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };



  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background/70">
        <SokolLoader />
      </div>
    );

  return (
    <main className="h-screen w-full flex flex-col overflow-hidden">
      {/* Info bar */}
      <div className="flex justify-between items-center absolute bottom-20 p-3 z-1000">
        <div className="hidden flex gap-4 sm:gap-8">
          {/* Čas */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-def-text uppercase leading-none mb-1">
              Čistý čas
            </span>
            <span className="text-2xl font-black text-secondary leading-none font-mono">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleToggleTracking}
          variant={isTracking ? "secondary" : "default"}
          className="px-6 h-10 rounded-full font-bold shadow-md uppercase text-xs"
        >
          {isTracking ? "Pauza" : "Zahájit sledování"}
        </Button>
      </div>
      
      {/* Map Container */}
      <div className={`grow relative bg-slate-200 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-1001' : ''}`}>
        <div className="flex gap-2 absolute top-5 right-5 z-1000 bg-white p-2 rounded-full shadow-md">
          <Button
            onClick={toggleTrackHistory}
            variant={showTrackHistory ? "default" : "outline"}
            size="icon"
            className="rounded-full size-8"
            title={showTrackHistory ? "Skrýt trasu" : "Zobrazit trasu"}
          >
            <Route className="size-4" />
          </Button>
          <Button
            onClick={() => setIsFullScreen(!isFullScreen)}
            variant="outline"
            size="icon"
            className="rounded-full size-8"
          >
            {isFullScreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
          </Button>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-full px-10 text-center pointer-events-none">
          <div className="inline-block bg-black/70 text-white px-4 py-1 rounded-full text-[10px] backdrop-blur-md border border-white/20">
            {debugMsg}
          </div>
        </div>
        <PoiModal
          poi={selectedPoi}
          isOpen={!!selectedPoi}
          onClose={() => setSelectedPoi(null)}
          isUnlocked={selectedPoi ? unlockedIds.has(selectedPoi.id) : false}
        />
        <MapWithNoSSR
          routeCoordinates={route}
          userLocation={userLocation}
          segments={segments}
          poiPoints={poiPoints}
          unlockedIds={unlockedIds}
          onPoiClick={(poi) => setSelectedPoi(poi)}
          isTracking={isTracking}
          showRoute={showRoute}
          showTrackHistory={showTrackHistory}
        />
      </div>
    </main>
  );
}
