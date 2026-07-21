"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Map as MapIcon, Download, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SokolText } from "@/components/SokolText";
import { SokolLoader } from "@/components/SokolLoader";
import { Footer } from "@/components/Footer";

// Rozhraní pro událost instalace (PWA)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

// Rozhraní pro iOS specifické vlastnosti navigátoru
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface RegisteredTeam {
  id: string;
  team_name: string;
  members: string[];
  category?: string;
}

export default function RegisterPage() {
  const [teamsList, setTeamsList] = useState<RegisteredTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingTeam, setExistingTeam] = useState<{
    id: string;
    name: string;
    members: string[];
    category?: string;
  } | null>(null);

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !isConfirmed) return;

    setLoading(true);
    const selectedTeam = teamsList.find((t) => t.id === selectedTeamId);

    if (selectedTeam) {
      document.cookie = `knin_team_id=${selectedTeam.id}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("knin_team_id", selectedTeam.id);
      localStorage.setItem("knin_team_name", selectedTeam.team_name);
      
      router.push("/info");
    } else {
      alert("Vybraný tým nebyl nalezen.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTeamsAndCheckRegistration = async () => {
      // 1. Stáhnout seznam všech registrovaných týmů
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, team_name, members, category")
        .order("team_name", { ascending: true });

      if (!teamsError && teamsData) {
        setTeamsList(teamsData);
      }

      // 2. Kontrola stávajícího přihlášení
      const savedId = localStorage.getItem("knin_team_id");
      const infoSeen = localStorage.getItem("knin_info_seen");

      if (savedId) {
        if (infoSeen === "true") {
          router.push("/mapa");
          return;
        }

        const { data, error } = await supabase
          .from("teams")
          .select("id, team_name, members, category")
          .eq("id", savedId)
          .single();

        if (data && !error) {
          setExistingTeam({
            id: data.id,
            name: data.team_name,
            members: data.members || [],
            category: data.category,
          });
        }
      }
      setLoading(false);
    };

    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as NavigatorStandalone).standalone === true;

    requestAnimationFrame(() => {
      if (!isStandalone) {
        setShowInstallBtn(true);
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    fetchTeamsAndCheckRegistration();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [router]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallBtn(false);
      }
    } else {
      alert(
        "Pro instalaci na iPhone: Klikněte na tlačítko sdílení (čtvereček s šipkou nahoru) a vyberte 'Přidat na plochu'.",
      );
    }
  };

  const handleLogout = () => {
    if (confirm("Opravdu chcete odhlásit tým?")) {
      localStorage.clear();
      setExistingTeam(null);
      setSelectedTeamId("");
      setIsConfirmed(false);
    }
  };

  const currentSelectedTeam = teamsList.find((t) => t.id === selectedTeamId);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background/70">
        <SokolLoader />
      </div>
    );

  return (
    <div className="min-h-screen bg-secondary/80 flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-6">
          <Image
            src="/pokraji_logo.png"
            alt="PoTrati Sokol Nový Knín"
            width={277}
            height={71}
            className="w-full h-auto mb-6 object-contain"
          />
        </div>
        <div className="flex flex-col gap-6">
          {showInstallBtn && (
            <Button onClick={handleInstallClick} variant="outline" size="lg">
              <Download className="size-4" /> INSTALOVAT JAKO APLIKACI
            </Button>
          )}

          {existingTeam ? (
            <div className="text-center space-y-6 py-2">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Tým připraven
                </p>
                <h2 className="text-3xl text-secondary font-black">
                  <SokolText text={existingTeam.name} />
                </h2>
                {existingTeam.category && (
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mt-1">
                    {existingTeam.category}
                  </span>
                )}
              </div>
              <div className="bg-slate-100 rounded-lg p-4 border border-slate-100">
                <div className="flex flex-wrap justify-center gap-2">
                  {existingTeam.members.map((m, i) => (
                    <span
                      key={i}
                      className="bg-white px-3 py-1 rounded-full text-sm shadow-sm border-2 border-secondary/90 text-secondary/90 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/mapa")}
                  variant={"secondary"}
                  size={"lg"}
                  className="w-full gap-2"
                >
                  <MapIcon className="size-5" /> VSTOUPIT DO MAPY
                </Button>
                <Button onClick={handleLogout} variant={"ghost"} size={"lg"}>
                  Odhlásit tým
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <p className="text-slate-600 text-center font-bold text-sm">
                  Vyber svůj tým ze seznamu přihlášených:
                </p>

                <div className="space-y-4">
                  <select
                    required
                    className="w-full p-3.5 border-2 border-secondary text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-secondary outline-none bg-white text-base"
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setIsConfirmed(false);
                    }}
                  >
                    <option value="">-- Vyber tým --</option>
                    {teamsList.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.team_name} {team.category ? `(${team.category})` : ""}
                      </option>
                    ))}
                  </select>

                  {currentSelectedTeam && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-center animate-in fade-in duration-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Členové týmu
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {currentSelectedTeam.members.map((m, idx) => (
                          <span
                            key={idx}
                            className="bg-white px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTeamId && (
                    <label className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl border border-secondary/20 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        className="size-5 rounded border-secondary text-secondary focus:ring-secondary accent-secondary cursor-pointer"
                      />
                      <span className="font-bold text-sm text-secondary">
                        Ano, to jsme my
                      </span>
                    </label>
                  )}
                </div>

                <Button
                  disabled={loading || !selectedTeamId || !isConfirmed}
                  type="submit"
                  variant={"secondary"}
                  size={"lg"}
                  className="w-full gap-2 font-bold"
                >
                  {loading ? (
                    <SokolLoader />
                  ) : (
                    <>
                      <Search className="size-5" /> VSTOUPIT DO HRY
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
