"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SokolLoader } from "@/components/SokolLoader";

export default function InnerAppLayout() {
  const router = useRouter();

  useEffect(() => {
    // Ročník je ukončen – přesměrovat na oficiální výsledky
    router.replace("/");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <SokolLoader />
    </div>
  );
}