"use client";

import { useState, useEffect, useRef } from "react";
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
import { MapPin, Users, Clock, TrendingUp, Trophy, Trash2, Upload, Route } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import gpxParser from "gpxparser";

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
  lastPing: string | null;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TeamStats[]>([]);
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
            history_text: wpt.desc || (wpt as any).cmt || "Navštívený bod.",
            radius_reach: 30,
          }));
        } else if (gpx.tracks && gpx.tracks.length > 0) {
          const trackPoints = gpx.tracks[0].points;
          poisToInsert = trackPoints.filter((_, idx) => idx % 25 === 0).map((pt, idx) => ({
            name: `Bod ${idx + 1}`,
            title: `Bod ${idx + 1}`,
            lat: pt.lat,
            lon: pt.lon,
            history_text: "Navštívený bod trasy.",
            radius_reach: 30,
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

      // 2. Fetch POI progress and total POI count
      const { data: poiProgressData } = await supabase
        .from("team_poi_progress")
        .select("team_id, poi_id");

      const { count: totalPoiCount } = await supabase
        .from("poi_points")
        .select("id", { count: "exact", head: true });

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

      // Agregace dat
      const stats: TeamStats[] = (teamsData as TeamRaw[]).map(team => {
        const teamPings = allTrackingData.filter(p => p.team_id === team.id);
        const visitedPois = (poiProgressData || []).filter(p => p.team_id === team.id).length;
        
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

        return {
          teamId: team.id,
          name: team.team_name,
          category: team.category || "Hobíci",
          members: team.members,
          timeSeconds,
          visitedPois,
          totalPois: totalPoiCount || 0,
          lastPing
        };
      });

      setData(stats.sort((a, b) => b.visitedPois - a.visitedPois || a.timeSeconds - b.timeSeconds));
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard & Statistiky</CardTitle>
            <CardDescription>Aktuální pořadí podle ušlé vzdálenosti</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <SokolLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Tým</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Členové</TableHead>
                      <TableHead className="text-right">Čas</TableHead>
                      <TableHead className="text-right">Projeté body</TableHead>
                      <TableHead className="text-right">Poslední ping</TableHead>
                      <TableHead className="text-right">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((team) => {
                      const lastPingDate = team.lastPing ? new Date(team.lastPing) : null;
                      
                      return (
                        <TableRow key={team.teamId}>
                          <TableCell className="font-bold">{team.name}</TableCell>
                          <TableCell>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              {team.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {team.members.join(", ")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatTime(team.timeSeconds)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary">
                            {team.visitedPois} / {team.totalPois}
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
      </div>
    </div>
  );
}
