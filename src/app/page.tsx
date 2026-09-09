"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Printer, 
  Trophy, 
  Users, 
  Zap, 
  Search, 
  MapPin, 
  Clock, 
  Award, 
  Info,
  ShieldCheck,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  RACE_INFO, 
  RAW_RESULTS_2026, 
  getProcessedResults, 
  ProcessedTeamResult 
} from "@/data/results2026";

export default function ResultsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allProcessedResults = useMemo(() => {
    return getProcessedResults(RAW_RESULTS_2026);
  }, []);

  const filteredResults = useMemo(() => {
    return allProcessedResults.filter((team) => {
      const matchesSearch = 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.members.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (team.note && team.note.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory === "all" || selectedCategory === "overall") return true;
      return team.category === selectedCategory;
    });
  }, [allProcessedResults, searchQuery, selectedCategory]);

  const categories = ["Hobíci", "Profíci", "Elektrokola"] as const;

  const totalTeams = allProcessedResults.length;
  const totalVisited = allProcessedResults.reduce((acc, t) => acc + t.visitedCount, 0);
  const bestScore = Math.max(...allProcessedResults.map((t) => t.totalPoints), 0);

  const handlePrint = () => {
    window.print();
  };

  const handlePrintCategory = (cat: string) => {
    setSelectedCategory(cat);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const printButtonLabel = useMemo(() => {
    if (selectedCategory === "all") return "Vytisknout všechny kategorie";
    if (selectedCategory === "overall") return "Vytisknout celkové pořadí";
    return `Vytisknout kategorii ${selectedCategory}`;
  }, [selectedCategory]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs sm:text-sm border border-amber-300 shadow-xs">
          🥇 1.
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 font-black text-xs sm:text-sm border border-slate-300 shadow-xs">
          🥈 2.
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-700/10 text-amber-950 font-black text-xs sm:text-sm border border-amber-700/30 shadow-xs">
          🥉 3.
        </span>
      );
    }
    return <span className="font-bold text-slate-500 text-xs sm:text-sm">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 print:bg-white print:p-0">
      {/* ========================================================================= */}
      {/* HLAVIČKA ZÁVODU (WEB & TISK) */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 shadow-xs print:border-b-2 print:border-black print:shadow-none print:py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative w-48 sm:w-56 h-14 shrink-0">
              <Image
                src="/cyklotrek_logo.png"
                alt="Sokol Cyklotrek Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="border-t sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-5 pt-3 sm:pt-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-1 print:border print:border-slate-300">
                <Award className="size-3.5" /> Oficiální výsledky
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {RACE_INFO.title}
              </h1>
              <p className="text-sm font-medium text-slate-500 print:text-slate-700">
                {RACE_INFO.subtitle} • {RACE_INFO.location}
              </p>
              {selectedCategory !== "all" && (
                <p className="text-xs font-bold text-slate-900 print:block hidden mt-1">
                  {selectedCategory === "overall" ? "Výsledková listina: Celkové pořadí" : `Výsledková listina: Kategorie ${selectedCategory}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <Button
              onClick={handlePrint}
              variant="default"
              size="lg"
              className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Printer className="size-5" /> {printButtonLabel}
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* OBSAH VÝSLEDKŮ */}
      {/* ========================================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 print:p-0 print:space-y-4">
        
        {/* STATISTICKÉ KARTY (POUZE PRO WEB) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Týmů celkem</p>
                <p className="text-xl font-black text-slate-900">{totalTeams}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projetých kontrol</p>
                <p className="text-xl font-black text-slate-900">{totalVisited}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nejvyšší zisk</p>
                <p className="text-xl font-black text-amber-600">{bestScore} b</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Časový limit</p>
                <p className="text-xl font-black text-slate-900">{RACE_INFO.timeLimitHours} h</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRAVIDLA & VYSVĚTLIVKY BODOVÁNÍ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2 print:border-none print:p-2 print:shadow-none">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
            <Info className="size-4 text-primary shrink-0" />
            <span>Pravidla hodnocení &amp; bodování ročníku 2026</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {RACE_INFO.rulesSummary}
          </p>
        </div>

        {/* AKČNÍ LIŠTA S FILTRY A HLEDÁNÍM (POUZE PRO WEB) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="font-bold text-xs"
            >
              Všechny kategorie
            </Button>
            <Button
              variant={selectedCategory === "Hobíci" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Hobíci")}
              className="font-bold text-xs gap-1"
            >
              <Users className="size-3.5" /> Hobíci
            </Button>
            <Button
              variant={selectedCategory === "Profíci" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Profíci")}
              className="font-bold text-xs gap-1"
            >
              <Trophy className="size-3.5" /> Profíci
            </Button>
            <Button
              variant={selectedCategory === "Elektrokola" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Elektrokola")}
              className="font-bold text-xs gap-1"
            >
              <Zap className="size-3.5" /> Elektrokola
            </Button>
            <Button
              variant={selectedCategory === "overall" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("overall")}
              className="font-bold text-xs"
            >
              Celkové pořadí
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Hledat tým nebo člena..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TABULKY VÝSLEDKŮ */}
        {/* ===================================================================== */}
        {selectedCategory === "overall" ? (
          /* Zobrazení všech týmů dohromady v jednom celkovém žebříčku */
          <CategoryTable
            title="Celkové pořadí (bez rozdílu kategorií)"
            subtitle="Kompletní přehled všech zúčastněných týmů"
            teams={filteredResults}
            icon={<Trophy className="size-5 text-amber-500" />}
            useOverallRank={true}
            getRankBadge={getRankBadge}
            onPrintThis={() => handlePrintCategory("overall")}
          />
        ) : selectedCategory === "all" ? (
          /* Výchozí zobrazení i zobrazení pro tisk: Každá kategorie v samostatném bloku */
          <div className="space-y-8 print:space-y-0">
            {categories.map((catName, idx) => {
              const catTeams = filteredResults.filter((t) => t.category === catName);
              if (catTeams.length === 0 && searchQuery) return null;

              let catIcon = <Trophy className="size-5 text-amber-500" />;
              if (catName === "Hobíci") catIcon = <Users className="size-5 text-blue-500" />;
              if (catName === "Elektrokola") catIcon = <Zap className="size-5 text-purple-500" />;

              return (
                <CategoryTable
                  key={catName}
                  title={`Kategorie: ${catName}`}
                  subtitle={`Oficiální pořadí kategorie ${catName}`}
                  teams={catTeams}
                  icon={catIcon}
                  useOverallRank={false}
                  getRankBadge={getRankBadge}
                  onPrintThis={() => handlePrintCategory(catName)}
                  isPageBreak={idx < categories.length - 1}
                />
              );
            })}
          </div>
        ) : (
          /* Vybraná samostatná kategorie */
          <CategoryTable
            title={`Kategorie: ${selectedCategory}`}
            subtitle={`Oficiální pořadí kategorie ${selectedCategory}`}
            teams={filteredResults}
            icon={
              selectedCategory === "Hobíci" ? (
                <Users className="size-5 text-blue-500" />
              ) : selectedCategory === "Profíci" ? (
                <Trophy className="size-5 text-amber-500" />
              ) : (
                <Zap className="size-5 text-purple-500" />
              )
            }
            useOverallRank={false}
            getRankBadge={getRankBadge}
            onPrintThis={() => handlePrintCategory(selectedCategory)}
          />
        )}

      </main>

      {/* ========================================================================= */}
      {/* PATIČKA S ADMIN ODKAZEM A AUTORSKÝMI PRÁVY */}
      {/* ========================================================================= */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700">
              © 2026 T.J. Sokol Nový Knín • Všechna práva vyhrazena
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generováno ze zabezpečeného systému Sokol Cyklotrek
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-medium text-xs border border-slate-200"
              title="Vstup do administrace pro organizátory"
            >
              <Lock className="size-3.5 text-slate-400" /> Správa závodu (Admin)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// KOMPONENTA TABULKY KATEGORIE
// =============================================================================
interface CategoryTableProps {
  title: string;
  subtitle: string;
  teams: ProcessedTeamResult[];
  icon: React.ReactNode;
  useOverallRank: boolean;
  getRankBadge: (rank: number) => React.ReactNode;
  onPrintThis?: () => void;
  isPageBreak?: boolean;
}

function CategoryTable({
  title,
  subtitle,
  teams,
  icon,
  useOverallRank,
  getRankBadge,
  onPrintThis,
  isPageBreak = false,
}: CategoryTableProps) {
  return (
    <Card className={`print-card shadow-sm border-slate-200 overflow-hidden bg-white ${isPageBreak ? "print-page-break" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/80 border-b border-slate-200 print:bg-white print:border-b-2 print:border-slate-800 print:py-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs print:border-none print:p-0">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 print:hidden">
              {subtitle}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 print:border-none print:text-black">
            {teams.length} {teams.length === 1 ? "tým" : teams.length >= 2 && teams.length <= 4 ? "týmy" : "týmů"}
          </span>
          {onPrintThis && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintThis}
              className="no-print gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 cursor-pointer h-7 px-2.5"
              title={`Vytisknout pouze ${title}`}
            >
              <Printer className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Vytisknout</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {teams.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm font-medium">
            Nebyly nalezeny žádné týmy odpovídající zadaným kritériím.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 print:bg-slate-100">
                  <TableHead className="w-[80px] text-center font-bold">Pořadí</TableHead>
                  <TableHead className="font-bold">Tým</TableHead>
                  <TableHead className="text-center w-[120px]">Kontroly</TableHead>
                  <TableHead className="text-right w-[120px]">Základ</TableHead>
                  <TableHead className="text-center w-[140px]">Prémie</TableHead>
                  <TableHead className="text-right w-[140px] font-black text-slate-900">Celkem bodů</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => {
                  const rank = useOverallRank ? team.overallRank : team.categoryRank;
                  const isPodium = rank <= 3;

                  return (
                    <TableRow 
                      key={team.id}
                      className={
                        isPodium 
                          ? "bg-amber-500/5 font-medium hover:bg-slate-100/70 print:bg-transparent" 
                          : "hover:bg-slate-100/70"
                      }
                    >
                      <TableCell className="text-center font-bold">
                        {getRankBadge(rank)}
                      </TableCell>

                      <TableCell className="font-bold text-slate-900 text-sm sm:text-base">
                        {team.name}
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold text-xs sm:text-sm text-slate-700">
                        {team.visitedCount > 0 ? `${team.visitedCount} / ${team.totalPois}` : "–"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-semibold text-xs sm:text-sm text-slate-700">
                        {team.basePoints} b
                      </TableCell>

                      <TableCell className="text-center">
                        {team.bonusPoints > 0 ? (
                          <span 
                            className="inline-block px-2.5 py-0.5 rounded text-xs font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 print:border-none print:p-0"
                            title={team.completedGroups.join(", ")}
                          >
                            +{team.bonusPoints} b
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">–</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-mono font-black text-base sm:text-lg text-primary print:text-black">
                        {team.totalPoints} b
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
}
