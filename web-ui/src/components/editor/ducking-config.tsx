"use client";

import { useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useVideoEditorStore } from "../../stores/video-editor-store";
import { NumericInput } from "../tooscut-ui/numeric-input";
import { Button } from "../tooscut-ui/button";
import type { DuckingConfig } from "../../lib/render-engine";

interface DuckingConfigPopoverProps {
  trackId: string;
  onClose: () => void;
}

export function DuckingConfigPopover({ trackId, onClose }: DuckingConfigPopoverProps) {
  const tracks = useVideoEditorStore((s) => s.tracks);
  const setTrackDucking = useVideoEditorStore((s) => s.setTrackDucking);

  const track = tracks.find((t) => t.id === trackId);
  const ducking = track?.ducking;

  // Other audio tracks that can be used as a trigger
  const otherAudioTracks = useMemo(
    () => tracks.filter((t) => t.type === "audio" && t.id !== trackId),
    [tracks, trackId],
  );

  const updateDucking = useCallback(
    (updates: Partial<DuckingConfig>) => {
      const current: DuckingConfig = ducking ?? {
        enabled: false,
        triggerTrackId: otherAudioTracks[0]?.id ?? "",
        duckAmountDb: -12,
        attackMs: 50,
        releaseMs: 300,
        threshold: 0.1,
      };
      setTrackDucking(trackId, { ...current, ...updates });
    },
    [ducking, trackId, setTrackDucking, otherAudioTracks],
  );

  const toggleEnabled = useCallback(() => {
    if (ducking?.enabled) {
      updateDucking({ enabled: false });
    } else {
      updateDucking({ enabled: true });
    }
  }, [ducking, updateDucking]);

  const removeDucking = useCallback(() => {
    setTrackDucking(trackId, undefined);
    onClose();
  }, [trackId, setTrackDucking, onClose]);

  const trackName = track?.name || `Audio ${track?.index ?? 0 + 1}`;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border border-neutral-700 bg-neutral-800 p-3 shadow-xl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          Ducking - {trackName}
        </h3>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Enable toggle */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-neutral-400">Enable Ducking</span>
        <button
          onClick={toggleEnabled}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            ducking?.enabled ? "bg-purple-600" : "bg-neutral-600"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              ducking?.enabled ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Trigger track selector */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="shrink-0 text-xs text-neutral-400">Trigger</span>
        <select
          value={ducking?.triggerTrackId ?? otherAudioTracks[0]?.id ?? ""}
          onChange={(e) => updateDucking({ triggerTrackId: e.target.value })}
          className="h-6 flex-1 truncate rounded border border-neutral-600 bg-neutral-700 px-1.5 text-xs text-neutral-300 outline-none focus:border-neutral-500"
        >
          {otherAudioTracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || `Audio ${t.index + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">Amount</span>
          <NumericInput
            value={ducking?.duckAmountDb ?? -12}
            onChange={(v) => updateDucking({ duckAmountDb: v })}
            min={-30}
            max={-1}
            step={1}
            suffix="dB"
            precision={0}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">Attack</span>
          <NumericInput
            value={ducking?.attackMs ?? 50}
            onChange={(v) => updateDucking({ attackMs: v })}
            min={1}
            max={500}
            step={5}
            suffix="ms"
            precision={0}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">Release</span>
          <NumericInput
            value={ducking?.releaseMs ?? 300}
            onChange={(v) => updateDucking({ releaseMs: v })}
            min={10}
            max={2000}
            step={10}
            suffix="ms"
            precision={0}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">Threshold</span>
          <NumericInput
            value={ducking?.threshold ?? 0.1}
            onChange={(v) => updateDucking({ threshold: v })}
            min={0}
            max={1}
            step={0.05}
            precision={2}
          />
        </div>
      </div>

      {/* Remove button */}
      {ducking && (
        <div className="mt-3 border-t border-neutral-700 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs text-red-400 hover:text-red-300"
            onClick={removeDucking}
          >
            Remove Ducking
          </Button>
        </div>
      )}
    </div>
  );
}
