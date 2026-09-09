"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import React, { useEffect, useMemo } from "react";

export interface AdminVisitedPoi {
  poiId: string;
  catalogId?: number;
  name: string;
  title: string;
  points: number;
  group: string | null;
  unlockedAt: string;
  formattedTime: string;
  lat: number;
  lon: number;
  order: number;
  instruction?: string;
}

export interface AdminUnvisitedPoi {
  poiId: string;
  catalogId?: number;
  name: string;
  title: string;
  points: number;
  group: string | null;
  lat: number;
  lon: number;
  instruction?: string;
}

export interface AdminTeamMapProps {
  teamName: string;
  visitedPois: AdminVisitedPoi[];
  unvisitedPois: AdminUnvisitedPoi[];
  trackingPings: { lat_val: number; lon_val: number; created_at: string }[];
  routeCoordinates?: [number, number][];
}

function MapAutoFit({
  pings,
  visited,
  unvisited,
}: {
  pings: [number, number][];
  visited: AdminVisitedPoi[];
  unvisited: AdminUnvisitedPoi[];
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();

      const allCoords: [number, number][] = [
        ...pings,
        ...visited
          .filter((p) => p.lat && p.lon && p.lat !== 0 && p.lon !== 0)
          .map((p) => [p.lat, p.lon] as [number, number]),
      ];

      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 15 });
      } else if (unvisited.length > 0) {
        const unvCoords = unvisited
          .filter((p) => p.lat && p.lon && p.lat !== 0 && p.lon !== 0)
          .map((p) => [p.lat, p.lon] as [number, number]);
        if (unvCoords.length > 0) {
          map.fitBounds(unvCoords, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [map, pings, visited, unvisited]);

  return null;
}

export default function AdminTeamMap({
  teamName,
  visitedPois,
  unvisitedPois,
  trackingPings,
  routeCoordinates = [],
}: AdminTeamMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPY_API_KEY;

  const trackCoords = useMemo<[number, number][]>(() => {
    return (trackingPings || [])
      .filter((p) => p.lat_val && p.lon_val && p.lat_val !== 0 && p.lon_val !== 0)
      .map((p) => [p.lat_val, p.lon_val]);
  }, [trackingPings]);

  const lastPing = trackingPings && trackingPings.length > 0 ? trackingPings[trackingPings.length - 1] : null;

  const formatTimeStr = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative w-full h-[450px] md:h-[500px] rounded-lg overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer
        center={[49.811, 14.295]}
        zoom={12}
        style={{ height: "100%", width: "100%", minHeight: "400px", zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          url={`https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${apiKey}`}
          attribution='&copy; <a href="https://mapy.cz">Mapy.cz</a>'
        />

        <MapAutoFit
          pings={trackCoords}
          visited={visitedPois}
          unvisited={unvisitedPois}
        />

        {/* 1. Oficiální trasa závodu */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: "#1e3a8a", weight: 4, opacity: 0.5, dashArray: "6 6" }}
          />
        )}

        {/* 2. Skutečná ujetá stopa týmu */}
        {trackCoords.length > 1 && (
          <Polyline
            positions={trackCoords}
            pathOptions={{ color: "#ea580c", weight: 5, opacity: 0.85 }}
          />
        )}

        {/* 3. Nenavštívené kontrolní body (šedé kolečko) */}
        {unvisitedPois
          .filter((poi) => poi.lat && poi.lon && poi.lat !== 0 && poi.lon !== 0)
          .map((poi) => (
            <CircleMarker
              key={`unvisited-${poi.poiId}`}
              center={[poi.lat, poi.lon]}
              radius={8}
              pathOptions={{
                color: "#64748b",
                fillColor: "#cbd5e1",
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="text-xs font-semibold text-slate-700">
                  #{poi.catalogId || "?"} {poi.name} (Nenavštíveno)
                </span>
              </Tooltip>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-slate-800">
                    #{poi.catalogId || "?"} {poi.name}
                  </div>
                  <div className="text-slate-500">Hodnota: +{poi.points} b</div>
                  <div className="text-amber-600 font-medium">⚠️ Tento bod tým nenavštívil</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* 4. Projeté kontrolní body (zelené kolečko s číslem pořadí) */}
        {visitedPois
          .filter((poi) => poi.lat && poi.lon && poi.lat !== 0 && poi.lon !== 0)
          .map((poi) => (
            <CircleMarker
              key={`visited-${poi.poiId}`}
              center={[poi.lat, poi.lon]}
              radius={12}
              pathOptions={{
                color: "#15803d",
                fillColor: "#22c55e",
                fillOpacity: 0.95,
                weight: 3,
              }}
            >
              <Tooltip permanent={true} direction="center" className="bg-transparent border-0 shadow-none">
                <span className="text-[10px] font-black text-white pointer-events-none drop-shadow-md">
                  {poi.order}
                </span>
              </Tooltip>
              <Popup>
                <div className="p-1.5 space-y-1.5 text-xs max-w-[220px]">
                  <div className="font-black text-emerald-800 text-sm flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px]">
                      #{poi.order} v pořadí
                    </span>
                    <span>+{poi.points} b</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {poi.catalogId ? `${poi.catalogId}. ` : ""}{poi.name}
                  </div>
                  <div className="text-slate-600 bg-slate-100 p-1.5 rounded font-mono text-[11px]">
                    ⏱️ Čas průjezdu: <strong>{poi.formattedTime}</strong>
                  </div>
                  {poi.group && (
                    <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      Skupina: {poi.group}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* 5. Poslední známá poloha týmu (modrý pulzující bod) */}
        {lastPing && lastPing.lat_val && lastPing.lon_val && (
          <CircleMarker
            center={[lastPing.lat_val, lastPing.lon_val]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#2563eb",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="text-xs font-bold text-blue-700">
                Poslední ping: {formatTimeStr(lastPing.created_at)}
              </span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Legenda mapy */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Legenda ({teamName})</div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-500 border border-emerald-700"></span>
          <span className="text-slate-700">Projeté body ({visitedPois.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-slate-300 border border-slate-500"></span>
          <span className="text-slate-500">Nenavštívené ({unvisitedPois.length})</span>
        </div>
        {trackCoords.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-orange-500 rounded"></span>
            <span className="text-slate-700">Trasa týmu ({trackCoords.length} pings)</span>
          </div>
        )}
        {lastPing && (
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-600 border border-white"></span>
            <span className="text-slate-700">Poslední ping</span>
          </div>
        )}
      </div>
    </div>
  );
}
