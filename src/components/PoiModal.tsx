"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Poi {
  id: string;
  name: string;
  title?: string;
  history_text?: string;
}

interface PoiModalProps {
  poi: Poi | null;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
}

export function PoiModal({
  poi,
  isOpen,
  onClose,
  isUnlocked,
}: PoiModalProps) {
  if (!poi) return null;

  const fullTitle = (poi.title || poi.name || "").trim();
  const hyphenMatch = fullTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  
  const mainTitle = hyphenMatch ? hyphenMatch[1].trim() : fullTitle;
  const subTitle = hyphenMatch ? hyphenMatch[2].trim() : undefined;

  // Ignorujeme automaticky generované / duplicitní texty
  const cleanHistory = poi.history_text?.trim();
  const hasCustomHistory = 
    cleanHistory && 
    cleanHistory !== "" && 
    !cleanHistory.toLowerCase().startsWith("navštívený bod");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {mainTitle}
          </DialogTitle>
          {subTitle && (
            <p className="text-base font-semibold text-secondary mt-1">
              {subTitle}
            </p>
          )}
          <DialogDescription className="mt-2">
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                ✓ Bod navštíven
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full">
                🔒 Zamčený bod
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isUnlocked ? (
            <p className="text-def-text italic text-sm">
              Musíš dojít k tomuto místu (v okruhu 10 m), abys odemkl jeho informace.
            </p>
          ) : hasCustomHistory ? (
            <div className="prose prose-slate prose-sm max-w-none">
              <div
                className="leading-relaxed text-def-text"
                dangerouslySetInnerHTML={{ __html: cleanHistory }}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
