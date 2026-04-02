"use client";

import { useCallback } from "react";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useVideoEditorStore } from "../../stores/video-editor-store";
import { Slider } from "../tooscut-ui/slider";
import { NumericInput } from "../tooscut-ui/numeric-input";
import { cn } from "../../lib/utils";

function linearToDb(linear: number): string {
  if (linear <= 0) return "-inf";
  const db = 20 * Math.log10(linear);
  return `${db.toFixed(1)} dB`;
}

function panLabel(pan: number): string {
  if (Math.abs(pan) < 0.01) return "C";
  if (pan < 0) return `L${Math.round(Math.abs(pan) * 100)}`;
  return `R${Math.round(pan * 100)}`;
}

interface ChannelStripProps {
  trackId: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  hasDucking: boolean;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onDuckingClick: () => void;
}

function ChannelStrip({
  name,
  volume,
  pan,
  muted,
  solo,
  hasDucking,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onDuckingClick,
}: ChannelStripProps) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 border-r border-neutral-700 px-2 py-2">
      {/* Track name */}
      <span className="w-full truncate text-center text-[10px] text-neutral-400">{name}</span>

      {/* Solo / Mute buttons */}
      <div className="flex gap-1">
        <button
          onClick={onSoloToggle}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold transition-colors",
            solo
              ? "bg-yellow-500 text-black"
              : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600",
          )}
        >
          S
        </button>
        <button
          onClick={onMuteToggle}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded transition-colors",
            muted
              ? "bg-red-500 text-white"
              : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600",
          )}
        >
          {muted ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Pan control */}
      <div className="flex w-full flex-col items-center gap-0.5">
        <span className="text-[9px] text-neutral-500">Pan</span>
        <Slider
          min={-100}
          max={100}
          value={[Math.round(pan * 100)]}
          onValueChange={([v]) => onPanChange(v / 100)}
          className="w-full"
        />
        <span className="text-[9px] text-neutral-500">{panLabel(pan)}</span>
      </div>

      {/* Volume fader */}
      <div className="flex flex-1 flex-col items-center gap-0.5">
        <Slider
          orientation="vertical"
          min={0}
          max={200}
          value={[Math.round(volume * 100)]}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className="h-full min-h-[60px]"
        />
      </div>

      {/* Volume readout */}
      <NumericInput
        value={volume}
        onChange={onVolumeChange}
        min={0}
        max={2}
        step={0.01}
        suffix="%"
        precision={0}
        className="w-full text-[10px]"
      />
      <span className="text-[9px] text-neutral-500">{linearToDb(volume)}</span>

      {/* Ducking indicator */}
      <button
        onClick={onDuckingClick}
        className={cn(
          "flex h-4 w-full items-center justify-center gap-0.5 rounded text-[9px] transition-colors",
          hasDucking
            ? "bg-purple-600/30 text-purple-300"
            : "bg-neutral-700/50 text-neutral-500 hover:bg-neutral-600/50",
        )}
      >
        Duck
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

interface MasterStripProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

function MasterStrip({ volume, onVolumeChange }: MasterStripProps) {
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 border-l-2 border-neutral-600 bg-neutral-800/80 px-2 py-2">
      {/* Label */}
      <span className="w-full text-center text-[10px] font-bold text-neutral-300">Master</span>

      {/* Spacer to align with channel strip layout */}
      <div className="h-5" />
      <div className="h-[34px]" />

      {/* Volume fader */}
      <div className="flex flex-1 flex-col items-center gap-0.5">
        <Slider
          orientation="vertical"
          min={0}
          max={100}
          value={[Math.round(volume * 100)]}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className="h-full min-h-[60px]"
        />
      </div>

      {/* Volume readout */}
      <NumericInput
        value={volume}
        onChange={onVolumeChange}
        min={0}
        max={1}
        step={0.01}
        suffix="%"
        precision={0}
        className="w-full text-[10px]"
      />
      <span className="text-[9px] text-neutral-500">{linearToDb(volume)}</span>
    </div>
  );
}

interface AudioMixerPanelProps {
  onDuckingClick?: (trackId: string) => void;
}

export function AudioMixerPanel({ onDuckingClick }: AudioMixerPanelProps) {
  const tracks = useVideoEditorStore((s) => s.tracks);
  const masterVolume = useVideoEditorStore((s) => s.masterVolume);
  const setTrackVolume = useVideoEditorStore((s) => s.setTrackVolume);
  const setTrackPan = useVideoEditorStore((s) => s.setTrackPan);
  const toggleTrackMuted = useVideoEditorStore((s) => s.toggleTrackMuted);
  const toggleTrackSolo = useVideoEditorStore((s) => s.toggleTrackSolo);
  const setMasterVolume = useVideoEditorStore((s) => s.setMasterVolume);

  const audioTracks = tracks.filter((t) => t.type === "audio");

  const handleDuckingClick = useCallback(
    (trackId: string) => {
      onDuckingClick?.(trackId);
    },
    [onDuckingClick],
  );

  if (audioTracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-neutral-500">
        No audio tracks
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-x-auto overflow-y-hidden bg-neutral-850 border-b border-neutral-700">
      {audioTracks.map((track) => (
        <ChannelStrip
          key={track.id}
          trackId={track.id}
          name={track.name || `Audio ${track.index + 1}`}
          volume={track.volume}
          pan={track.pan ?? 0}
          muted={track.muted}
          solo={track.solo ?? false}
          hasDucking={track.ducking?.enabled ?? false}
          onVolumeChange={(v) => setTrackVolume(track.id, v)}
          onPanChange={(p) => setTrackPan(track.id, p)}
          onMuteToggle={() => toggleTrackMuted(track.id)}
          onSoloToggle={() => toggleTrackSolo(track.id)}
          onDuckingClick={() => handleDuckingClick(track.id)}
        />
      ))}
      <MasterStrip volume={masterVolume} onVolumeChange={setMasterVolume} />
    </div>
  );
}
