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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {poi.title || poi.name}
          </DialogTitle>
          <DialogDescription>
            {isUnlocked
              ? "Bod úspěšně navštíven!"
              : "Tento bod je zatím zamčený."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isUnlocked ? (
            <p className="text-def-text italic">
              Musíš dojít k tomuto místu (v okruhu 20 m), abys odemkl jeho informace.
            </p>
          ) : (
            <div className="prose prose-slate prose-sm max-w-none">
              <div
                className="leading-relaxed text-def-text"
                dangerouslySetInnerHTML={{ __html: poi.history_text || "Žádné další informace." }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
