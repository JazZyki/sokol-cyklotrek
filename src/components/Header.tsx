"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Map as MapIcon,
  BookOpen,
  LogOut,
  RefreshCw,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Hourglass,
  Trophy,
} from "lucide-react";
import { useTracking, ActiveModal } from "@/lib/TrackingContext";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setActiveModal, activeModal } = useTracking();

  const [now, setNow] = useState<Date>(new Date());
  const [unlockedCount, setUnlockedCount] = useState<number>(0);
  const [massStart, setMassStart] = useState<string>("10:00");

  useEffect(() => {
    // 1. Stáhnout globální čas startu ze Supabase DB
    const fetchGlobalStart = async () => {
      try {
        const { data } = await supabase
          .from("poi_points")
          .select("title")
          .eq("name", "RACE_SETTINGS_MASS_START")
          .single();
        if (data?.title) {
          setMassStart(data.title);
          if (typeof window !== "undefined") {
            localStorage.setItem("knin_mass_start_time", data.title);
          }
        }
      } catch (e) {}
    };
    fetchGlobalStart();

    const updateStats = async () => {
      setNow(new Date());
      if (typeof window !== "undefined") {
        const teamId = localStorage.getItem("knin_team_id");
        if (teamId) {
          try {
            const { data: progressData } = await supabase
              .from("team_poi_progress")
              .select("poi_id")
              .eq("team_id", teamId);

            if (progressData) {
              setUnlockedCount(progressData.length);
              localStorage.setItem("knin_unlocked_pois", JSON.stringify(progressData.map(p => String(p.poi_id))));
            }
          } catch (e) {}
        } else {
          const savedPois = localStorage.getItem("knin_unlocked_pois");
          if (savedPois) {
            try {
              const arr = JSON.parse(savedPois);
              setUnlockedCount(arr.length);
            } catch (e) {}
          }
        }

        const savedStart = localStorage.getItem("knin_mass_start_time");
        if (savedStart) setMassStart(savedStart);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTimeData = () => {
    const parts = massStart.split(":").map(Number);
    const startHour = isNaN(parts[0]) ? 10 : parts[0];
    const startMin = isNaN(parts[1]) ? 0 : parts[1];

    const limitDate = new Date(now);
    limitDate.setHours(startHour + 7, startMin, 0, 0);

    const diffMs = limitDate.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec > 0) {
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      return { text: `Zbývá ${h}h ${m}m`, isOver: false };
    } else {
      const overSec = Math.abs(diffSec);
      const m = Math.ceil(overSec / 60);
      return { text: `+${m}m přes limit`, isOver: true };
    }
  };

  const remainingInfo = getRemainingTimeData();

  interface NavItem {
    name: string;
    href: string;
    modal: ActiveModal | undefined;
    icon: typeof MapIcon;
  }

  const navItems: NavItem[] = [
    { name: "Mapa trasy", href: "/mapa", modal: undefined, icon: MapIcon },
    {
      name: "Pravidla a Info",
      href: "/info",
      modal: "info",
      icon: BookOpen,
    },
  ];

  const handleNavigate = (item: NavItem) => {
    setIsOpen(false);
    if (item.modal) {
      setActiveModal(item.modal);
    } else {
      setActiveModal(null);
      router.push(item.href);
    }
  };

  const handleLogout = () => {
    if (confirm("Opravdu se chcete odhlásit?")) {
      localStorage.clear();
      router.push("/");
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 1. HLAVNÍ HLAVIČKA (Pouze Logo vlevo + Tlačítko Menu vpravo) */}
      <header className="w-full h-16 bg-background border-b-2 border-secondary px-4 flex items-center justify-between relative shadow-sm z-30">
        <Image
          src="/cyklotrek_logo.png"
          alt="Sokol Cyklotrek Logo"
          width={140}
          height={60}
          className="h-10 w-auto cursor-pointer object-contain"
          onClick={() => {
            setActiveModal(null);
            router.push("/mapa");
          }}
        />

        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-menu-btn hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Otevřít menu"
        >
          <Menu className="size-7" />
        </button>
      </header>

      {/* 2. STATISTIKY LIŠTA (Samostatný řádek POD hlavní hlavičkou) */}
      <div className="w-full bg-slate-100 text-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] sm:text-xs font-mono font-bold shadow-inner relative z-20">
        <div className="flex items-center gap-1.5 text-amber-600">
          <Clock className="size-3.5" />
          <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${remainingInfo.isOver ? 'text-red-500 font-extrabold animate-pulse' : 'text-emerald-500'}`}>
          <Hourglass className="size-3.5" />
          <span>{remainingInfo.text}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-600">
          <Trophy className="size-3.5" />
          <span>{unlockedCount} / 24 POI</span>
        </div>
      </div>

      {/* --- OFF-CANVAS MENU OVERLAY --- */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-2000 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- OFF-CANVAS PANEL --- */}
      <div
        className={`fixed top-0 right-0 h-full  min-w-75 w-[75%] max-w-sm bg-background z-2001 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header menu */}
          <div className="p-10 flex justify-between items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 bg-background-2 rounded-full absolute top-4 right-4 hover:bg-slate-100 transition-colors"
            >
              <X className="size-6 text-menu-btn" />
            </button>
          </div>

          {/* Navigační položky */}
          <nav className="flex-grow p-4 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = (item.modal === activeModal) || (item.href === "/mapa" && !activeModal);
              return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item)}
                className={`w-full flex items-center p-4 rounded-2xl border transition-all bg-menu-btns text-def-text uppercase ${
                  isActive
                    ? "border-secondary shadow-md ring-1 ring-secondary/20 text-primary"
                    : "border-slate-100 shadow-sm active:scale-95"
                }`}
              >
                <div className={`p-3 rounded-xl text-white bg-secondary mr-4`}>
                  <item.icon className="size-6" />
                </div>
                <div className="flex-grow text-left">
                  <span
                    className={`font-bold block ${isActive ? "text-def-text" : "text-def-text"}`}
                  >
                    {item.name}
                  </span>
                </div>
                <ChevronRight
                  className={`size-5 ${isActive ? "text-secondary" : "text-slate-300"}`}
                />
              </button>
            )})}
          </nav>

          {/* Footer menu */}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 ml-1 tracking-widest text-center">
                Režim zobrazení
              </p>
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                {[
                  { id: "light", icon: Sun, label: "Jasný" },
                  { id: "dark", icon: Moon, label: "Tmavý" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${
                      theme === t.id
                        ? "bg-secondary text-white shadow-md scale-105"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                    }`}
                  >
                    <t.icon className="size-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 p-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className="size-4" /> Obnovit aplikaci
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-3 text-secondary dark:text-white text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="size-4" /> ODHLÁSIT TÝM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
