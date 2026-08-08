"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SokolLoader } from "@/components/SokolLoader";
import { MapPin, Users, Clock, TrendingUp, Trophy, Trash2, Upload, Route, Zap } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import gpxParser from "gpxparser";

import { calculateScoreForTeam, calculatePenaltyPoints, POI_CATALOG } from "@/lib/poiScoring";

// Definice surových dat z DB
interface TeamRaw {
  id: string;
  team_name: string;
  members: string[];
  category?: string;
  created_at: string;
}

// Definice agregovaných statistik pro UI
interface TeamStats {
  teamId: string;
  name: string;
  category: string;
  members: string[];
  timeSeconds: number;
  visitedPois: number;
  totalPois: number;
  basePoints: number;
  completedGroups: string[];
  bonusPoints: number;
  penaltyPoints: number;
  overtimeMinutes: number;
  totalPoints: number;
  finishTime: string;
  calculatedDurationSeconds: number;
  lastPing: string | null;
  overallRank: number;
  categoryRank: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const poiFileInputRef = useRef<HTMLInputElement>(null);


  const [newTeamName, setNewTeamName] = useState("");
  const [newMembers, setNewMembers] = useState("");
  const [newCategory, setNewCategory] = useState("Hobíci");
  const [registering, setRegistering] = useState(false);

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newMembers.trim()) return;

    setRegistering(true);
    try {
      const { error } = await supabase
        .from("teams")
        .insert([
          {
            team_name: newTeamName.trim(),
            members: newMembers.split(",").map((m) => m.trim()).filter(Boolean),
            category: newCategory,
          },
        ]);

      if (error) {
        alert("Chyba při registraci týmu: " + error.message);
      } else {
        alert(`Tým "${newTeamName.trim()}" (${newCategory}) byl úspěšně zaregistrován!`);
        setNewTeamName("");
        setNewMembers("");
        setNewCategory("Hobíci");
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert("Neočekávaná chyba");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Opravdu chcete smazat tým "${teamName}"? Tím dojde ke smazání všech jeho naměřených GPS bodů, pokroku a odpovědí!`)) return;

    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) {
        alert("Chyba při mazání týmu: " + error.message);
      } else {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert("Neočekávaná chyba");
    }
  };

  const handleGpxPoiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xml = event.target?.result as string;
        const gpx = new gpxParser();
        gpx.parse(xml);

        let poisToInsert: { name: string; title: string; lat: number; lon: number; history_text: string; radius_reach: number }[] = [];

        if (gpx.waypoints && gpx.waypoints.length > 0) {
          poisToInsert = gpx.waypoints.map((wpt, idx) => ({
            name: wpt.name || `Bod ${idx + 1}`,
            title: wpt.name || `Bod ${idx + 1}`,
            lat: wpt.lat,
            lon: wpt.lon,
            history_text: wpt.desc || (wpt as any).cmt || "",
            radius_reach: 10,
          }));
        } else if (gpx.tracks && gpx.tracks.length > 0) {
          const trackPoints = gpx.tracks[0].points;
          poisToInsert = trackPoints.filter((_, idx) => idx % 25 === 0).map((pt, idx) => ({
            name: `Bod ${idx + 1}`,
            title: `Bod ${idx + 1}`,
            lat: pt.lat,
            lon: pt.lon,
            history_text: "",
            radius_reach: 10,
          }));
        }

        if (poisToInsert.length === 0) {
          alert("V GPX souboru nebyly nalezeny žádné body (waypoints).");
          return;
        }

        const { error } = await supabase.from("poi_points").insert(poisToInsert);

        if (error) {
          alert("Chyba při ukládání POI: " + error.message);
        } else {
          alert(`Úspěšně nahráno ${poisToInsert.length} POI bodů!`);
          fetchAdminData();
        }
      } catch (err: any) {
        alert("Chyba při čtení GPX: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleGpxRouteImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xml = event.target?.result as string;
        const gpx = new gpxParser();
        gpx.parse(xml);

        let coords: [number, number][] = [];
        if (gpx.tracks && gpx.tracks.length > 0) {
          gpx.tracks.forEach(track => {
            track.points.forEach(pt => coords.push([pt.lon, pt.lat]));
          });
        }

        if (coords.length === 0) {
          alert("V GPX souboru nebyly nalezeny žádné body stopy.");
          return;
        }

        const geojsonData = {
          type: "LineString",
          coordinates: coords,
        };

        await supabase.from("route_display").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { error } = await supabase.from("route_display").insert([{ geojson_data: geojsonData }]);

        if (error) {
          alert("Chyba při ukládání trasy: " + error.message);
        } else {
          alert(`Hlavní trasa byla úspěšně nahrána! (${coords.length} bodů)`);
        }
      } catch (err: any) {
        alert("Chyba při čtení GPX: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPsw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "sokol2026";
    if (password === adminPsw) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Nesprávné heslo");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const [massStartTime, setMassStartTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("knin_mass_start_time") || "09:00";
    }
    return "09:00";
  });

  const [finishTimes, setFinishTimes] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("knin_finish_times");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const handleMassStartChange = async (val: string) => {
    setMassStartTime(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("knin_mass_start_time", val);
    }
    try {
      await supabase.from("poi_points").upsert({
        id: "00000000-0000-0000-0000-000000000000",
        name: "RACE_SETTINGS_MASS_START",
        title: val,
        lat: 0,
        lon: 0,
        radius_reach: 0
      });
    } catch (e) {
      console.error("Error syncing mass start time to Supabase:", e);
    }
  };

  const handleFinishTimeChange = (teamId: string, val: string) => {
    const next = { ...finishTimes, [teamId]: val };
    setFinishTimes(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("knin_finish_times", JSON.stringify(next));
    }
  };

  const parseTimeToSeconds = (timeStr: string): number | null => {
    if (!timeStr || !timeStr.trim()) return null;
    const parts = timeStr.trim().split(":").map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 2) {
      return parts[0] * 3600 + parts[1] * 60;
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  };

  const [rawTeams, setRawTeams] = useState<TeamRaw[]>([]);
  const [rawPoiProgress, setRawPoiProgress] = useState<any[]>([]);
  const [rawDbPois, setRawDbPois] = useState<any[]>([]);
  const [rawTracking, setRawTracking] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*");
      
      if (teamsError) throw teamsError;

      // 2. Fetch POI progress and all POI records
      const { data: poiProgressData } = await supabase
        .from("team_poi_progress")
        .select("team_id, poi_id");

      const { data: dbPoisRaw } = await supabase
        .from("poi_points")
        .select("id, name, title, lat");

      const systemSetting = (dbPoisRaw || []).find(p => p.name === "RACE_SETTINGS_MASS_START");
      if (systemSetting?.title) {
        setMassStartTime(systemSetting.title);
        if (typeof window !== "undefined") {
          localStorage.setItem("knin_mass_start_time", systemSetting.title);
        }
      }

      const dbPoisData = (dbPoisRaw || []).filter(p => p.name !== "RACE_SETTINGS_MASS_START" && p.lat !== 0);

      // 3. Fetch Tracking data for all teams (PAGINATED)
      let allTrackingData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: chunk, error } = await supabase
          .from("team_tracking")
          .select("team_id, lat_val, lon_val, created_at, session_id")
          .order("created_at", { ascending: true })
          .range(from, from + step - 1);

        if (error) {
          console.error("Admin: Error fetching tracking data:", error);
          hasMore = false;
          break;
        }

        if (chunk && chunk.length > 0) {
          allTrackingData = [...allTrackingData, ...chunk];
          from += step;
          if (chunk.length < step) hasMore = false;
          if (allTrackingData.length > 50000) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setRawTeams(teamsData as TeamRaw[] || []);
      setRawPoiProgress(poiProgressData || []);
      setRawDbPois(dbPoisData || []);
      setRawTracking(allTrackingData || []);
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Výpočet statistik a výsledkové listiny v paměti bez načítacího přeblikávání
  const data = useMemo<TeamStats[]>(() => {
    if (!rawTeams || rawTeams.length === 0) return [];
    const totalPoiCount = rawDbPois.length > 0 ? rawDbPois.length : 24;

    const stats: TeamStats[] = rawTeams.map(team => {
      const teamPings = rawTracking.filter(p => p.team_id === team.id);
      const teamVisitedProgress = rawPoiProgress.filter(p => p.team_id === team.id);
      const visitedPoiIds = teamVisitedProgress.map(p => String(p.poi_id));

      // Výpočet bodů a skupinových prémií
      const scoreResult = calculateScoreForTeam(visitedPoiIds, rawDbPois);
      
      let timeSeconds = 0;
      let lastPing = null;

      if (teamPings.length > 0) {
        lastPing = teamPings[teamPings.length - 1].created_at;
        
        const sessions: Record<string, any[]> = {};
        teamPings.forEach(ping => {
          const sId = ping.session_id || "default";
          if (!sessions[sId]) sessions[sId] = [];
          sessions[sId].push(ping);
        });

        Object.values(sessions).forEach(pings => {
          if (pings.length > 1) {
            const start = new Date(pings[0].created_at).getTime();
            const end = new Date(pings[pings.length - 1].created_at).getTime();
            timeSeconds += (end - start) / 1000;
          }
        });
      }

      // Výpočet celkové doby dle hromadného startu a času dojezdu
      const fTime = finishTimes[team.id] || "";
      const mStartSec = parseTimeToSeconds(massStartTime);
      const fSec = parseTimeToSeconds(fTime);

      let calculatedDurationSeconds = timeSeconds;
      if (mStartSec !== null && fSec !== null) {
        let diff = fSec - mStartSec;
        if (diff < 0) diff += 24 * 3600;
        calculatedDurationSeconds = diff;
      }

      // Výpočet penalizace za překročení 7hodinového limitu (1b za každých i započatých 10 min)
      const penaltyInfo = calculatePenaltyPoints(calculatedDurationSeconds, 7);
      const netTotalPoints = Math.max(0, scoreResult.basePoints + scoreResult.bonusPoints - penaltyInfo.penaltyPoints);

      return {
        teamId: team.id,
        name: team.team_name,
        category: team.category || "Hobíci",
        members: team.members,
        timeSeconds,
        visitedPois: scoreResult.visitedCount,
        totalPois: totalPoiCount,
        basePoints: scoreResult.basePoints,
        completedGroups: scoreResult.completedGroups,
        bonusPoints: scoreResult.bonusPoints,
        penaltyPoints: penaltyInfo.penaltyPoints,
        overtimeMinutes: penaltyInfo.overtimeMinutes,
        totalPoints: netTotalPoints,
        finishTime: fTime,
        calculatedDurationSeconds,
        lastPing,
        overallRank: 0,
        categoryRank: 0
      };
    });

    // 1. Řazení všech týmů
    const sorted = stats.sort((a, b) => 
      b.totalPoints - a.totalPoints || 
      b.visitedPois - a.visitedPois || 
      (a.calculatedDurationSeconds || Infinity) - (b.calculatedDurationSeconds || Infinity)
    );

    // 2. Výpočet pořadí v rámci celé soutěže i v rámci jednotlivých kategorií (Hobíci, Profíci, Elektrokola)
    const categoryRanks: Record<string, number> = {};
    sorted.forEach((team, idx) => {
      team.overallRank = idx + 1;
      categoryRanks[team.category] = (categoryRanks[team.category] || 0) + 1;
      team.categoryRank = categoryRanks[team.category];
    });

    return sorted;
  }, [rawTeams, rawPoiProgress, rawDbPois, rawTracking, massStartTime, finishTimes]);

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("Všechny");

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Admin Přihlášení</CardTitle>
            <CardDescription>Zadejte administrátorské heslo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Heslo" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">Vstoupit</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Přehled závodu Nový Knín Trek</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAdminData} variant="outline" disabled={loading}>
              {loading ? "Aktualizuji..." : "Obnovit data"}
            </Button>
            <Button onClick={() => {
              sessionStorage.removeItem("admin_auth");
              setIsAuthenticated(false);
            }} variant="ghost">Odhlásit</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Týmy celkem</CardTitle>
              <Users className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Aktivní týmy na trati</CardTitle>
              <MapPin className="size-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.filter(d => d.lastPing && (new Date().getTime() - new Date(d.lastPing).getTime()) < 600000).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrace nového týmu</CardTitle>
            <CardDescription>Zadejte název týmu a jeho členy (oddělené čárkou)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterTeam} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Název týmu</label>
                <Input
                  required
                  placeholder="Např. Rychlé šípy"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Kategorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Hobíci">Hobíci</option>
                  <option value="Profíci">Profíci</option>
                  <option value="Elektrokola">Elektrokola</option>
                </select>
              </div>
              <div className="md:flex-2 flex-grow w-full space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Členové týmu (oddělení čárkou)</label>
                <Input
                  required
                  placeholder="Např. Mirek Dušín, Jarka Metelka"
                  value={newMembers}
                  onChange={(e) => setNewMembers(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={registering} className="w-full md:w-auto">
                {registering ? "Registruji..." : "Zaregistrovat"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nahrávání kontrolních bodů (POI) z GPX</CardTitle>
            <CardDescription>
              Vyberte GPX soubor s kontrolními body (Waypoints). Body se nahrají jako elektronické kontroly závodu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 font-bold cursor-pointer"
                size="lg"
                onClick={() => poiFileInputRef.current?.click()}
              >
                <MapPin className="size-5 text-primary" /> NAHRÁT KONTROLNÍ BODY (POI) Z GPX (.gpx)
              </Button>
              <input
                ref={poiFileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleGpxPoiImport}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Nastavení Hromadného Startu */}
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-secondary flex items-center gap-2">
                <Clock className="size-5 text-primary" /> Hromadný start & Časový limit (7 hod.)
              </CardTitle>
              <CardDescription>
                Při překročení 7hodinového limitu dostává tým penalizaci <strong>-1 bod za každých i započatých 10 minut</strong> navíc.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <label className="text-xs font-bold text-slate-600 uppercase">Čas startu:</label>
              <Input
                type="text"
                placeholder="10:00"
                value={massStartTime}
                onChange={(e) => handleMassStartChange(e.target.value)}
                className="w-28 font-mono font-bold text-base h-9 text-center"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Oddělené Výsledkové listiny pro jednotlivé kategorie */}
        {loading ? (
          <Card>
            <CardContent className="h-64 flex items-center justify-center">
              <SokolLoader />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {["Hobíci", "Profíci", "Elektrokola"].map((catName) => {
              const categoryTeams = data.filter((t) => t.category === catName);
              
              let catIcon = <Trophy className="size-6 text-amber-500" />;
              if (catName === "Hobíci") catIcon = <Users className="size-6 text-blue-500" />;
              if (catName === "Profíci") catIcon = <Trophy className="size-6 text-amber-500" />;
              if (catName === "Elektrokola") catIcon = <Zap className="size-6 text-purple-500" />;

              return (
                <Card key={catName} className="shadow-md border-slate-200 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-100/70 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      {catIcon}
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">
                          Výsledková listina: {catName}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          Samostatné pořadí 1.–3. místo pro kategorii {catName}
                        </CardDescription>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                      {categoryTeams.length} {categoryTeams.length === 1 ? "tým" : categoryTeams.length >= 2 && categoryTeams.length <= 4 ? "týmy" : "týmů"}
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    {categoryTeams.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-sm font-medium">
                        V kategorii {catName} zatím nejsou registrovány žádné týmy.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-[70px] text-center font-bold">Pořadí</TableHead>
                              <TableHead className="w-[180px]">Tým</TableHead>
                              <TableHead>Členové</TableHead>
                              <TableHead className="text-center">Kontroly</TableHead>
                              <TableHead className="text-right">Zák. body</TableHead>
                              <TableHead className="text-center">Prémie (+5b / skup.)</TableHead>
                              <TableHead className="text-center">Penalizace (&gt;7h)</TableHead>
                              <TableHead className="text-right font-bold text-primary">Celkem bodů</TableHead>
                              <TableHead className="text-center w-[120px]">Čas dojezdu</TableHead>
                              <TableHead className="text-right font-bold">Celková doba</TableHead>
                              <TableHead className="text-right text-xs">Poslední ping</TableHead>
                              <TableHead className="text-right">Akce</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryTeams.map((team) => {
                              const lastPingDate = team.lastPing ? new Date(team.lastPing) : null;
                              const cRank = team.categoryRank;
                              
                              let rankBadge = <span className="font-bold text-slate-500 text-xs">#{cRank}</span>;
                              if (cRank === 1) rankBadge = <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-xs border border-amber-300 shadow-xs" title="1. místo v kategorii">🥇 1.</span>;
                              if (cRank === 2) rankBadge = <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-black text-xs border border-slate-300 shadow-xs" title="2. místo v kategorii">🥈 2.</span>;
                              if (cRank === 3) rankBadge = <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-900 font-black text-xs border border-amber-700/30 shadow-xs" title="3. místo v kategorii">🥉 3.</span>;

                              return (
                                <TableRow key={team.teamId} className={cRank <= 3 ? "bg-amber-500/5 font-medium" : ""}>
                                  <TableCell className="text-center font-bold">{rankBadge}</TableCell>
                                  <TableCell className="font-bold text-slate-900">{team.name}</TableCell>
                                  <TableCell className="text-slate-500 text-xs max-w-[200px] truncate">
                                    {team.members.join(", ")}
                                  </TableCell>
                                  <TableCell className="text-center font-mono font-bold text-slate-700">
                                    {team.visitedPois} / {team.totalPois}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold text-slate-700">
                                    {team.basePoints} b
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {team.completedGroups.length > 0 ? (
                                      <div className="flex flex-wrap justify-center gap-1">
                                        {team.completedGroups.map((g, gIdx) => (
                                          <span key={gIdx} className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200" title={g}>
                                            +5b ({g.split('-')[0].trim()})
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 text-xs">–</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {team.penaltyPoints > 0 ? (
                                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200" title={`Překročeno o ${team.overtimeMinutes} min`}>
                                        -{team.penaltyPoints} b ({team.overtimeMinutes}m)
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 text-xs">0 b</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-black text-lg text-primary">
                                    {team.totalPoints} b
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="text"
                                      placeholder="14:25:00"
                                      value={finishTimes[team.teamId] || ""}
                                      onChange={(e) => handleFinishTimeChange(team.teamId, e.target.value)}
                                      className="w-24 text-center font-mono font-bold text-xs h-8 mx-auto"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold text-slate-800">
                                    {formatTime(team.calculatedDurationSeconds)}
                                  </TableCell>
                                  <TableCell className="text-right text-xs text-slate-400">
                                    {lastPingDate ? lastPingDate.toLocaleTimeString() : "nikdy"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 size-8 rounded-full"
                                      onClick={() => handleDeleteTeam(team.teamId, team.name)}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
