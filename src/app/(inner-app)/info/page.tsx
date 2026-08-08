"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Map as MapIcon, FileText, Route } from "lucide-react";

export default function InfoPage() {
  const router = useRouter();

  const handleGoToMap = () => {
    // Označíme si, že uživatel už info viděl
    localStorage.setItem("knin_info_seen", "true");
    router.push("/mapa");
  };

  return (
    <div className="p-6 space-y-8 pb-25 min-h-full overflow-scroll h-[calc(100vh-18rem)]">
        <h1 className="w-full text-primary text-3xl font-bold flex items-center justify-center gap-4 mb-6 border-b-2 border-secondary pb-2">
          <BookOpen className="size-8" /> Informace o soutěži
        </h1>
        
        <div className="prose prose-slate">
          <p>Vítejte v aplikaci Sokol Cyklotrek, kterou pro Vás připravil Sokol Nový Knín. Zde jsou základní pravidla:</p>
          <ul>
            <li>Aplikaci je možné používat <strong>pouze v terénu</strong>.</li>
            <li>Aplikace vyžaduje <strong>povolení přístupu k poloze</strong>.</li>
            <li>Pro správnou funkčnost je potřeba mít <strong>zapnutou GPS a mobilní data</strong>.</li>
            <li>Na startu jste dostali mapu se základními informacemi k jednotlivým bodům.</li>
            <li>Jednotlivé body (POI) odemykáte <strong>přiblížením se k nim. Citlivost POI je nastavena na 10 m.</strong> Po odemčení POI se daný bod zobrazí na mapě.</li>
            <li>Sledování GPS se zapíná tlačítkem &laquo;Zahájit sledování&raquo;. Vypnout je možné stiskem tlačítka &laquo;Pauza&raquo;.</li>
            <li>V aplikaci je možné sledovat ujetou trasu. V tomto případě je potřeba zapnout sledování trasy (ikona <Route className="inline-block size-4 align-middle text-secondary" />).</li>
            <li>V případě, že máte sledování zapnuté, aplikace je nastavena tak, aby se telefon nevypnul. Je ale nutné, aby aplikace běžela na popředí a <strong>nebyla překryta jinou aplikací</strong> (SMS, telefon, WhatsApp, ...). Pokud k tomuto dojde, je potřeba trasování ukončit. Aplikaci vypnout a znovu zapnout. Pak je možné opět bez problémů sledovat trasu.</li>
            <li>Pokud trasování nebudete chtít zapnout, je možné telefon &laquo;vypnout&raquo;, dát do kapsy a <strong>trasování zapnout pouze, když se budete blížit k bodu.</strong></li>
            <li>U určitých POI může být slabý signál a nemusí se správně zobrazovat GPS poloha. Aplikaci by mělo stačit <strong>vypnout a znovu zapnout</strong>. Pak by se GPS poloha měla zobrazit již správně. Pokud by stále nefungovalo správné zobrazení GPS polohy, stačí dopsat <strong>kontrolní kód dané POI do průkazky na kontroly</strong>, kterou jste dostali na startu.</li>
          </ul>
        </div>

        <Button
          variant="outline"
          size="lgx"
          onClick={() => window.open("/pokraji-navod.pdf", "_blank")}
          className="mt-6">
            <FileText className="size-5" /> Stáhnout návod (PDF)
          </Button>
        <Button 
        variant="default"
        size="lgx"
        onClick={handleGoToMap} 
        >
          <MapIcon size={24} /> rozumím, přejít na mapu 
        </Button>
    </div>
  );
}