"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SokolLoader } from "@/components/SokolLoader";
import { 
  MapPin, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Map as MapIcon, 
  ListOrdered,
  Users,
  Award,
  Zap,
  HelpCircle
} from "lucide-react";
import { AdminVisitedPoi, AdminUnvisitedPoi } from "@/components/AdminTeamMap";

const AdminTeamMap = dynamic(() => import("@/components/AdminTeamMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] flex items-center justify-center bg-slate-100 rounded-lg">
      <SokolLoader />
    </div>
  ),
});

export interface TeamPoiModalData {
  teamId: string;
  name: string;
  category: string;
  members: string[];
  visitedPoisList: AdminVisitedPoi[];
  unvisitedPoisList: AdminUnvisitedPoi[];
  basePoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  completedGroups: string[];
  calculatedDurationSeconds: number;
  finishTime: string;
  trackingPings: { lat_val: number; lon_val: number; created_at: string }[];
  routeCoordinates?: [number, number][];
}

interface TeamPoiModalProps {
  data: TeamPoiModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamPoiModal({ data, isOpen, onClose }: TeamPoiModalProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "map">("timeline");
  const [showUnvisited, setShowUnvisited] = useState(false);

  if (!data) return null;

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const totalPoisCount = data.visitedPoisList.length + data.unvisitedPoisList.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-2xl font-black text-slate-900">
                  {data.name}
                </DialogTitle>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  data.category === "Hobíci"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : data.category === "Profíci"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  {data.category}
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Users className="size-3.5 inline" />
                <span>{data.members.join(", ")}</span>
              </DialogDescription>
            </div>

            {/* Přehled výsledků */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Kontroly</div>
                <div className="font-mono font-black text-base text-slate-800">
                  {data.visitedPoisList.length} <span className="text-slate-400 font-normal text-xs">/ {totalPoisCount}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Zák. body</div>
                <div className="font-mono font-bold text-base text-slate-700">
                  {data.basePoints} b
                </div>
              </div>
              {data.bonusPoints > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-indigo-500">Prémie</div>
                    <div className="font-mono font-bold text-base text-indigo-600">
                      +{data.bonusPoints} b
                    </div>
                  </div>
                </>
              )}
              {data.penaltyPoints > 0 && (
                <>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-red-500">Penále</div>
                    <div className="font-mono font-bold text-base text-red-600">
                      -{data.penaltyPoints} b
                    </div>
                  </div>
                </>
              )}
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-primary">Celkem</div>
                <div className="font-mono font-black text-lg text-primary">
                  {data.totalPoints} b
                </div>
              </div>
            </div>
          </div>

          {/* Přepínač záložek */}
          <div className="flex items-center gap-2 mt-4 pt-2">
            <Button
              type="button"
              variant={activeTab === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("timeline")}
              className="gap-1.5 font-bold text-xs"
            >
              <ListOrdered className="size-4" />
              Časová osa průjezdů ({data.visitedPoisList.length})
            </Button>
            <Button
              type="button"
              variant={activeTab === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("map")}
              className="gap-1.5 font-bold text-xs"
            >
              <MapIcon className="size-4" />
              Interaktivní mapa ({data.trackingPings.length} GPS bodů)
            </Button>
          </div>
        </DialogHeader>

        {/* OBSAH TABS */}
        <div className="mt-4">
          {activeTab === "timeline" ? (
            <div className="space-y-6">
              {/* Splněné prémiové skupiny */}
              {data.completedGroups.length > 0 && (
                <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-xl flex items-center gap-3">
                  <Award className="size-5 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Dokončené prémiové skupiny (+{data.bonusPoints} bodů)
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {data.completedGroups.map((grp, gIdx) => (
                        <span
                          key={gIdx}
                          className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 text-xs font-bold rounded-md shadow-2xs"
                        >
                          🎉 +5 b za skupinu: {grp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Seznam projetých kontrol */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Chronologický záznam projetých bodů ({data.visitedPoisList.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Seřazeno dle přesného času projetí
                  </span>
                </div>

                {data.visitedPoisList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <MapPin className="size-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Tým zatím neprojel žádným kontrolním bodem.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Body se automaticky zaznamenávají při přiblížení na méně než 10 metrů.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.visitedPoisList.map((poi) => (
                      <div
                        key={poi.poiId}
                        className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3 sm:p-3.5 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            {poi.order}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                {poi.catalogId ? `Bod #${poi.catalogId}: ` : ""}{poi.name}
                              </span>
                              {poi.group && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {poi.group}
                                </span>
                              )}
                            </div>
                            {poi.instruction && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 italic">
                                {poi.instruction}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              ⏱️ {poi.formattedTime}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            +{poi.points} {poi.points === 1 ? "bod" : poi.points < 5 ? "body" : "bodů"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nenavštívené body */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUnvisited(!showUnvisited)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold gap-1.5 p-0"
                  >
                    <XCircle className="size-4 text-slate-400" />
                    {showUnvisited ? "Skrýt" : "Zobrazit"} nenavštívené kontrolní body ({data.unvisitedPoisList.length})
                  </Button>
                </div>

                {showUnvisited && (
                  <div className="mt-3 space-y-2">
                    {data.unvisitedPoisList.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-bold p-3 bg-emerald-50 rounded-lg">
                        🎉 Skvělé! Tým projel všechny dostupné kontrolní body!
                      </p>
                    ) : (
                      data.unvisitedPoisList.map((poi) => (
                        <div
                          key={poi.poiId}
                          className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs opacity-80"
                        >
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                              {poi.catalogId || "–"}
                            </span>
                            <span className="font-medium text-slate-700">
                              {poi.name}
                            </span>
                            {poi.group && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-600">
                                {poi.group}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-400 shrink-0">
                            +{poi.points} b
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Mapa zobrazuje projeté kontroly (zeleně v pořadí průjezdu) a zaznamenanou GPS trasu týmu (oranžově).
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {data.visitedPoisList.length} / {totalPoisCount} bodů
                </span>
              </div>
              <AdminTeamMap
                teamName={data.name}
                visitedPois={data.visitedPoisList}
                unvisitedPois={data.unvisitedPoisList}
                trackingPings={data.trackingPings}
                routeCoordinates={data.routeCoordinates}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
