export interface PoiDefinition {
  id: number;
  code: string;
  name: string;
  instruction: string;
  type: string | null;
  points: number;
  group: string | null;
}

export const POI_CATALOG: PoiDefinition[] = [
  {
    "id": 1,
    "code": "1.1.4",
    "name": "cedule o spolufinancování EU",
    "instruction": "- napiš číslo podopatření pozemkové úpravy (3 číslice)",
    "type": null,
    "points": 1,
    "group": null
  },
  {
    "id": 2,
    "code": "28",
    "name": "rohový kůl oplocení 3m západně pres cestu od sochy sv huberta",
    "instruction": "- napiš číslo na kůlu ohrady, cedulka s číslem je ze začátku žlutá a pak rezavá (2 číslice)",
    "type": null,
    "points": 1,
    "group": null
  },
  {
    "id": 3,
    "code": "R8",
    "name": "elektrorozvaděč, 3 schránky - jedna dvojkřídlá schránka a dvě jednodílné schránky (při příjezdu seshora je to druhý rozvaděč na pravé straně)",
    "instruction": "- napiš číslici, která následuje po písmenu R na dvířkách, která jsou na kraji napravo",
    "type": null,
    "points": 2,
    "group": null
  },
  {
    "id": 4,
    "code": "2011",
    "name": "značka, směrovka Křeničná na silnici od Živohošti",
    "instruction": "- na zadní straně, napiš rok (větší bílé číslice) na modrém pruhu",
    "type": "dopravní značka",
    "points": 1,
    "group": null
  },
  {
    "id": 5,
    "code": "2008",
    "name": "značka pozor krávy, dodatková cedulka \"koně\"",
    "instruction": "- na zadní straně, napiš rok (větší bílé číslice) na modrém pruhu",
    "type": "dopravní značka",
    "points": 1,
    "group": null
  },
  {
    "id": 6,
    "code": "2005",
    "name": "značka ZONA (zakaz stání), při příjezdu od Slap",
    "instruction": "- na zadni straně, napiš rok (větší červené číslice) na bílem pozadí",
    "type": "dopravní značka",
    "points": 3,
    "group": null
  },
  {
    "id": 7,
    "code": "0708",
    "name": "lávka ke stavidlu na malém rybníku v lese u cesty",
    "instruction": "- napiš poslední čtyři číslice objednávky, cedulka je uprostřed lávky na boku, na sloupku zabradlí uplně dole, lze přečíst i ze štěrku z hráze",
    "type": "lávka ke stavidlu",
    "points": 2,
    "group": null
  },
  {
    "id": 8,
    "code": "AB",
    "name": "pluh, památník sedlákům",
    "instruction": "- napiš dvě písmena na páčce na levé rukojeti pluhu, páčkou se nastavuje hloubka orby",
    "type": null,
    "points": 2,
    "group": "historické okénko - kostelíky, hřbitovy, památníky"
  },
  {
    "id": 9,
    "code": "8G",
    "name": "rozhledna (vstup nahoru na rozhlednu)",
    "instruction": "- napiš kod \"číslice písmeno\" pod písmenem K, který je na šroubech, ktere kotví konstrukci rozhledny k betonovým patkám (jsou tam 4 patky) = u každé patky je 8 těchto šroubů a na všech šroubech je stejný kod \"číslice písmeno\" pod písmenem K",
    "type": null,
    "points": 3,
    "group": "vrcholy"
  },
  {
    "id": 10,
    "code": "7",
    "name": "bílá cedule křížovnické lesy",
    "instruction": "- napiš číslo před slovem \"years\" (z přední strany)",
    "type": null,
    "points": 1,
    "group": null
  },
  {
    "id": 11,
    "code": "30480",
    "name": "zelený kontejner vedle křižovatky, z čelní strany",
    "instruction": "- napiš hmotnost v KG, která je uvedena jako \"MAX GROSS\" z přední strany (5 číslic)",
    "type": null,
    "points": 2,
    "group": "vrcholy"
  },
  {
    "id": 12,
    "code": "2017",
    "name": "na sloupu el. vedení u cesty je dálkově ovládaná stanice",
    "instruction": "- napiš rok výroby (na boku dálkově ovládané stanice)",
    "type": "sloup el. vedení",
    "points": 1,
    "group": "sloupy"
  },
  {
    "id": 13,
    "code": "2005",
    "name": "značka Dej přednost v jízdě",
    "instruction": "- na zadní straně, napiš rok (větší bílé číslice) na modrém pozadí",
    "type": "dopravní značka",
    "points": 1,
    "group": null
  },
  {
    "id": 14,
    "code": "V. ŠKVÁRA",
    "name": "židovský hřbitov na kraji lesa - náhrobek Moses Klein",
    "instruction": "- napiš jméno úplně dole vpravo (osoba z Dobříše)",
    "type": null,
    "points": 1,
    "group": "historické okénko - kostelíky, hřbitovy, památníky"
  },
  {
    "id": 15,
    "code": "20 4 22",
    "name": "betonový sloup el. vedení u cesty, asi 3m jižně od cesty",
    "instruction": "- napiš 5 číslic v řádku DAT., podle štítku Sloupárna Majdalena",
    "type": "sloup el. vedení",
    "points": 2,
    "group": "sloupy"
  },
  {
    "id": 16,
    "code": "19 9-7",
    "name": "betonový sloup el. vedení, zhruba 80m vzdušnou čarou na jih od památníku sv. Václava",
    "instruction": "- napiš poslední 4 číslice v řádku VYR (z toho mezi posledními 2 číslicemi je pomlčka), podle štítku Sloupárna Majdalena",
    "type": "sloup el. vedení",
    "points": 3,
    "group": "vrcholy"
  },
  {
    "id": 17,
    "code": "621",
    "name": "dopravní značka zákaz vjezdu nákladním vozům delším než 8m, před lesním přejezdem kolejí",
    "instruction": "- napiš poslední 3 číslice v řádku \" tel.\" na zadní straně",
    "type": "dopravní značka",
    "points": 2,
    "group": null
  },
  {
    "id": 18,
    "code": "767",
    "name": "značka zákaz vjezdu motorovým vozidlům s dodatkovou tabulkou \"mimo vozidel s povolením vlastníka komunikace\", z křižovatky směrem na Kytín",
    "instruction": "- napiš poslední 3 číslice v řádku \" Tel.\" na zadní straně dodatkové tabulky \"mimo vozidel s povolením vlastníka komunikace\"",
    "type": "dopravní značka",
    "points": 3,
    "group": null
  },
  {
    "id": 19,
    "code": "MODUS",
    "name": "světlo na stromě k osvícení čelní části kaple sv Jana a Pavla",
    "instruction": "- napiš největší nápis na světle na stromě",
    "type": null,
    "points": 1,
    "group": "historické okénko - kostelíky, hřbitovy, památníky"
  },
  {
    "id": 20,
    "code": "5.5.1878",
    "name": "střed Království českého - prostřední kříž",
    "instruction": "- napiš datum na zadní traně prostředního kříže",
    "type": null,
    "points": 2,
    "group": "historické okénko - kostelíky, hřbitovy, památníky"
  },
  {
    "id": 21,
    "code": "SC 8.8",
    "name": "lávka ke stavidlu na malém rybníku v lese u cesty",
    "instruction": "- napiš kod na šroubech, kterými je přidělané zábradlí (vzdálenější od cesty)",
    "type": "lávka ke stavidlu",
    "points": 3,
    "group": null
  },
  {
    "id": 22,
    "code": "1994",
    "name": "betonový sloup el. vedení u cesty, naproti křížku",
    "instruction": "- napiš poslední 4 číslice v řádku VYR, podle štítku Sloupárna Majdalena",
    "type": "sloup el. vedení",
    "points": 1,
    "group": "sloupy"
  },
  {
    "id": 23,
    "code": "104",
    "name": "kostel sv. Kiliána - boční vchodové dveře na severní straně",
    "instruction": "- napiš poslední 3 číslice v posledním řádku na malé žluté destičce v horní části dvěří",
    "type": null,
    "points": 3,
    "group": "historické okénko - kostelíky, hřbitovy, památníky"
  },
  {
    "id": 24,
    "code": "2019",
    "name": "značka konec obce Hvozdnice",
    "instruction": "- napiš rok (větší bílé číslice na modrém pozadí) na zadní straně značky",
    "type": "dopravní značka",
    "points": 3,
    "group": null
  }
];

export interface TeamScoreResult {
  visitedCount: number;
  totalPoisCount: number;
  basePoints: number;
  completedGroups: string[];
  bonusPoints: number;
  totalPoints: number;
}

export function calculatePenaltyPoints(
  durationSeconds: number,
  timeLimitHours: number = 7
): { overtimeMinutes: number; penaltyPoints: number } {
  const limitSeconds = timeLimitHours * 3600;
  if (durationSeconds <= limitSeconds) {
    return { overtimeMinutes: 0, penaltyPoints: 0 };
  }

  const overtimeSeconds = durationSeconds - limitSeconds;
  const overtimeMinutes = Math.ceil(overtimeSeconds / 60);
  const penaltyPoints = Math.ceil(overtimeMinutes / 10);

  return { overtimeMinutes, penaltyPoints };
}

export function calculateScoreForTeam(
  visitedPoiIds: string[], 
  dbPoisList: { id: string; name?: string; title?: string }[]
): TeamScoreResult {
  const visitedDbPois = dbPoisList.filter(p => visitedPoiIds.includes(String(p.id)));
  
  let basePoints = 0;
  const visitedCatalogIds = new Set<number>();

  visitedDbPois.forEach(dbPoi => {
    const dbName = (dbPoi.name || dbPoi.title || "").toLowerCase();
    // Párování podle jména v katalogu
    const match = POI_CATALOG.find(cat => {
      const catName = cat.name.toLowerCase();
      return dbName.includes(catName.substring(0, 15)) || catName.includes(dbName.substring(0, 15));
    });

    if (match) {
      basePoints += match.points;
      visitedCatalogIds.add(match.id);
    } else {
      basePoints += 1; // záložní hodnota 1 bod
    }
  });

  // Skupinové prémie (každá kompletní skupina = +5 bodů)
  const groupTotals: Record<string, number> = {};
  const groupVisited: Record<string, number> = {};

  POI_CATALOG.forEach(cat => {
    if (cat.group) {
      groupTotals[cat.group] = (groupTotals[cat.group] || 0) + 1;
      if (visitedCatalogIds.has(cat.id)) {
        groupVisited[cat.group] = (groupVisited[cat.group] || 0) + 1;
      }
    }
  });

  const completedGroups: string[] = [];
  Object.keys(groupTotals).forEach(groupName => {
    if (groupVisited[groupName] && groupVisited[groupName] === groupTotals[groupName]) {
      completedGroups.push(groupName);
    }
  });

  const bonusPoints = completedGroups.length * 5;
  const totalPoints = basePoints + bonusPoints;

  return {
    visitedCount: visitedDbPois.length,
    totalPoisCount: dbPoisList.length || 24,
    basePoints,
    completedGroups,
    bonusPoints,
    totalPoints
  };
}
