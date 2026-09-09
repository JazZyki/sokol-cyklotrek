// src/data/results2026.ts
/**
 * Oficiální výsledky - Sokol Cyklotrek / Nový Knín Trek 2026
 * 
 * Tento soubor slouží jako zdroj pravdy pro statickou výsledkovou listinu.
 * Zde můžete kdykoliv jednoduše upravit:
 *  - body týmů (basePoints, bonusPoints, penaltyPoints, totalPoints)
 *  - počet kontrol (visitedCount)
 *  - časy dojezdu a celkovou dobu (finishTime, duration)
 *  - přidat poznámku (note - např. "Ručně uznán bod č. 14 dle papírové průkazky")
 *  - upravit členy nebo název týmu
 */

export interface TeamResultItem {
  id: string;
  name: string;
  category: "Hobíci" | "Profíci" | "Elektrokola";
  members: string[];
  visitedCount: number;
  totalPois: number;
  basePoints: number;
  completedGroups: string[];
  bonusPoints: number;
  penaltyPoints: number;
  finishTime?: string;
  duration?: string;
  totalPoints: number;
  note?: string;
  // Manuální přepsání pořadí, pokud by bylo potřeba (jinak se řadí automaticky dle bodů a času)
  customRank?: number;
}

export interface RaceInfo {
  title: string;
  subtitle: string;
  date: string;
  location: string;
  organizer: string;
  totalPoisCount: number;
  timeLimitHours: number;
  rulesSummary: string;
}

export const RACE_INFO: RaceInfo = {
  title: "Sokol Cyklotrek 2026",
  subtitle: "Nový Knín Trek • Oficiální výsledková listina",
  date: "Květen 2026",
  location: "Nový Knín a okolí",
  organizer: "T.J. Sokol Nový Knín",
  totalPoisCount: 24,
  timeLimitHours: 7,
  rulesSummary: "Body za projeté kontroly (1–3 b dle obtížnosti) + prémie za kompletní tematické skupiny (+5 b za každou ucelenou skupinu: Historické okénko, Vrcholy, Sloupy) – penalizace 1 b za každých i započatých 10 minut nad limit 7 hodin.",
};

export const RAW_RESULTS_2026: TeamResultItem[] = [
  // ==========================================
  // KATEGORIE: PROFÍCI
  // ==========================================
  {
    id: "e752b0c0-4f21-424f-81bd-decf0c1c8943",
    name: "Bébuláci",
    category: "Profíci",
    members: ["Jakub Šimek", "Matěj"],
    visitedCount: 21,
    totalPois: 24,
    basePoints: 40,
    completedGroups: ["Historické okénko", "Vrcholy", "Sloupy"],
    bonusPoints: 15,
    penaltyPoints: 0,
    finishTime: "11:11",
    duration: "1h 15m",
    totalPoints: 55,
    note: "Dokončeny všechny 3 prémiové skupiny (+15 b)"
  },
  {
    id: "b945ff2c-a6a4-41c5-8bcd-357f97cb7db9",
    name: "M2",
    category: "Profíci",
    members: ["Mirek", "Miloš"],
    visitedCount: 15,
    totalPois: 24,
    basePoints: 34,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:10",
    duration: "1h 47m",
    totalPoints: 34,
  },
  {
    id: "a8a240f4-ffc5-4b64-9064-62dadd6c589c",
    name: "Kokotým",
    category: "Profíci",
    members: ["Lukáš"],
    visitedCount: 17,
    totalPois: 24,
    basePoints: 28,
    completedGroups: ["Historické okénko"],
    bonusPoints: 5,
    penaltyPoints: 0,
    finishTime: "11:14",
    duration: "37m",
    totalPoints: 33,
    note: "Prémie za Historické okénko (+5 b)"
  },
  {
    id: "d0237af4-782c-4122-9398-e447242fe3c0",
    name: "Komici",
    category: "Profíci",
    members: ["Míla", "..."],
    visitedCount: 18,
    totalPois: 24,
    basePoints: 27,
    completedGroups: ["Sloupy"],
    bonusPoints: 5,
    penaltyPoints: 0,
    finishTime: "10:52",
    duration: "25m",
    totalPoints: 32,
    note: "Prémie za Sloupy (+5 b)"
  },
  {
    id: "3cdff18c-1748-466a-b91f-8215fd9b7d34",
    name: "Macík",
    category: "Profíci",
    members: ["Macík"],
    visitedCount: 14,
    totalPois: 24,
    basePoints: 20,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:07",
    duration: "1h 09m",
    totalPoints: 20,
  },
  {
    id: "a26dee27-df95-4eb6-a50a-228a7dc360dc",
    name: "PW",
    category: "Profíci",
    members: ["PW"],
    visitedCount: 0,
    totalPois: 24,
    basePoints: 27,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "",
    duration: "",
    totalPoints: 27,
    note: "Ručně doplněno: 27 bodů"
  },

  {
    id: "9dc0ed38-c324-4234-97dc-586d622747a7",
    name: "VK Blesk",
    category: "Profíci",
    members: ["Ladus", "Viutoun"],
    visitedCount: 24,
    totalPois: 24,
    basePoints: 45,
    completedGroups: ["Historické okénko", "Vrcholy", "Sloupy"],
    bonusPoints: 15,
    penaltyPoints: 0,
    finishTime: "",
    duration: "",
    totalPoints: 60,
    note: "Všechny kontroly projeté (doplněno ručně)"
  },


  // ==========================================
  // KATEGORIE: HOBÍCI
  // ==========================================
  {
    id: "866e75da-91e8-4d51-9516-e20f0cfaab8f",
    name: "Pandy z Vídně",
    category: "Hobíci",
    members: ["Dana", "Klára"],
    visitedCount: 16,
    totalPois: 24,
    basePoints: 26,
    completedGroups: ["Sloupy"],
    bonusPoints: 5,
    penaltyPoints: 0,
    finishTime: "11:18",
    duration: "1h 15m",
    totalPoints: 31,
    note: "Prémie za Sloupy (+5 b)"
  },
  {
    id: "0cf2ceb6-61d9-431c-954d-59f8486b292b",
    name: "Mokrošlapky",
    category: "Hobíci",
    members: ["Terezie", "Jiří", "Lenka"],
    visitedCount: 11,
    totalPois: 24,
    basePoints: 26,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:18",
    duration: "1h 06m",
    totalPoints: 26,
  },
  {
    id: "a9d0c38d-b3b3-4d1e-86cc-bfbbf8a0c26f",
    name: "Voyager",
    category: "Hobíci",
    members: ["Petra Šimková", "Albík"],
    visitedCount: 14,
    totalPois: 24,
    basePoints: 18,
    completedGroups: ["Sloupy", "2. prémie"],
    bonusPoints: 10,
    penaltyPoints: 0,
    finishTime: "11:18",
    duration: "43m",
    totalPoints: 28,
    note: "14 kontrol, 2 prémiové skupiny (+10 b)"
  },


  {
    id: "a1d57c33-50e5-4f74-aaca-054e12af34a9",
    name: "Ready Bedy",
    category: "Hobíci",
    members: ["Jirka", "Jan"],
    visitedCount: 13,
    totalPois: 24,
    basePoints: 17,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:15",
    duration: "1h 15m",
    totalPoints: 17,
  },
  {
    id: "832f6e25-3b5f-435d-a985-bb81100a9b98",
    name: "Lipičáci",
    category: "Hobíci",
    members: ["Pavlína", "Tomáš"],
    visitedCount: 13,
    totalPois: 24,
    basePoints: 17,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:03",
    duration: "27m",
    totalPoints: 17,
  },
  {
    id: "0656abe4-4513-433a-9dbd-0c21a333c50a",
    name: "Sudováci",
    category: "Hobíci",
    members: ["Pepa"],
    visitedCount: 12,
    totalPois: 24,
    basePoints: 16,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:17",
    duration: "1h 18m",
    totalPoints: 16,
    note: "Ručně přičten 1 bod"
  },

  {
    id: "c2de29e3-e0d8-4f1c-9ab2-14ecee065931",
    name: "Svatopolští",
    category: "Hobíci",
    members: ["Karolína", "Lukáš"],
    visitedCount: 11,
    totalPois: 24,
    basePoints: 14,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "",
    duration: "",
    totalPoints: 14,
  },
  {
    id: "705dcf0d-5da8-47ed-a68b-3722aa88fa1c",
    name: "Šelebíci",
    category: "Hobíci",
    members: ["Blanka"],
    visitedCount: 12,
    totalPois: 24,
    basePoints: 14,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:04",
    duration: "14m",
    totalPoints: 14,
  },
  {
    id: "fb76413c-eba7-44f6-98ae-2313c9276597",
    name: "Užovky",
    category: "Hobíci",
    members: ["Honza", "Žofka"],
    visitedCount: 10,
    totalPois: 24,
    basePoints: 14,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:15",
    duration: "1h 08m",
    totalPoints: 14,
  },
  {
    id: "23568bb5-761b-4601-bed2-aa304c459f16",
    name: "Poláčci",
    category: "Hobíci",
    members: ["Míla", "Karin"],
    visitedCount: 7,
    totalPois: 24,
    basePoints: 8,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:14",
    duration: "45m",
    totalPoints: 8,
  },

  // ==========================================
  // KATEGORIE: ELEKTROKOLA
  // ==========================================
  {
    id: "0e9c63ce-4b72-43d6-8a30-ff6819c06da8",
    name: "LM Team",
    category: "Elektrokola",
    members: ["Lenka", "Michal"],
    visitedCount: 18,
    totalPois: 24,
    basePoints: 28,
    completedGroups: ["Sloupy"],
    bonusPoints: 5,
    penaltyPoints: 0,
    finishTime: "11:01",
    duration: "1h 01m",
    totalPoints: 33,
    note: "Prémie za Sloupy (+5 b)"
  },
  {
    id: "3016eaaa-7fe7-443e-ae3c-2e24b12464e6",
    name: "SK Oplocenka",
    category: "Elektrokola",
    members: ["Oldrich Kupa", "Martina"],
    visitedCount: 4,
    totalPois: 24,
    basePoints: 5,
    completedGroups: [],
    bonusPoints: 0,
    penaltyPoints: 0,
    finishTime: "11:11",
    duration: "1h 11m",
    totalPoints: 5,
  }
];

export interface ProcessedTeamResult extends TeamResultItem {
  overallRank: number;
  categoryRank: number;
}

/**
 * Pomocná funkce pro seřazení a přiřazení pořadí (celkového i v rámci kategorie)
 */
export function getProcessedResults(items: TeamResultItem[] = RAW_RESULTS_2026): ProcessedTeamResult[] {
  // 1. Řadit podle bodů sestupně, pak podle počtu kontrol, případně podle času
  const sorted = [...items].sort((a, b) => {
    if (a.customRank && b.customRank) return a.customRank - b.customRank;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.visitedCount !== a.visitedCount) return b.visitedCount - a.visitedCount;
    return a.name.localeCompare(b.name, "cs");
  });

  // 2. Přiřadit pořadí
  const categoryCounters: Record<string, number> = {};

  return sorted.map((team, idx) => {
    const cat = team.category;
    categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;

    return {
      ...team,
      overallRank: team.customRank || idx + 1,
      categoryRank: categoryCounters[cat],
    };
  });
}
