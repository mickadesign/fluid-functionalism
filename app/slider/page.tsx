"use client";

import { useState } from "react";
import { Slider, SliderComfortable } from "@/registry/default/slider";
import { fontWeights } from "@/registry/default/lib/font-weight";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const qualityLabels = ["Off", "Low", "Medium", "High", "Ultra"];
const reverbTypes = ["Room", "Hall", "Plate", "Spring", "Chamber"];
const filterModes = ["LP", "BP", "HP", "Notch"];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SliderPage() {
  // --- Mixer channel strips ---
  const [volume, setVolume] = useState(78);
  const [bass, setBass] = useState(55);
  const [mid, setMid] = useState(50);
  const [treble, setTreble] = useState(62);
  const [presence, setPresence] = useState(45);

  // --- EQ knobs ---
  const [lowCut, setLowCut] = useState(30);
  const [lowShelf, setLowShelf] = useState(40);
  const [midFreq, setMidFreq] = useState(50);
  const [midGain, setMidGain] = useState(50);
  const [highShelf, setHighShelf] = useState(55);
  const [highCut, setHighCut] = useState(12000);

  // --- Effects sends ---
  const [reverbSend, setReverbSend] = useState(35);
  const [delaySend, setDelaySend] = useState(20);
  const [chorusSend, setChorusSend] = useState(0);

  // --- Compressor ---
  const [threshold, setThreshold] = useState(65);
  const [ratio, setRatio] = useState(30);
  const [attack, setAttack] = useState(15);
  const [release, setRelease] = useState(45);
  const [makeupGain, setMakeupGain] = useState(20);

  // --- Comfortable pips ---
  const [reverbType, setReverbType] = useState(1);
  const [quality, setQuality] = useState(3);
  const [filterMode, setFilterMode] = useState(0);
  const [oversample, setOversample] = useState(1);

  // --- Comfortable scrubber ---
  const [masterVol, setMasterVol] = useState(80);
  const [pan, setPan] = useState(50);
  const [tempo, setTempo] = useState(120);
  const [swing, setSwing] = useState(0);
  const [dryWet, setDryWet] = useState(50);
  const [feedback, setFeedback] = useState(35);

  // --- Range sliders ---
  const [freqRange, setFreqRange] = useState<[number, number]>([200, 8000]);
  const [dynamicRange, setDynamicRange] = useState<[number, number]>([20, 80]);

  return (
    <div className="flex flex-col gap-12 px-10 py-10 w-full max-w-[720px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[22px] text-foreground"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          Audio Mixer
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Slider variants styled as a music production control surface.
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Channel Strip                                                      */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Channel Strip
        </h2>
        <div className="flex flex-col gap-1">
          <Slider
            value={volume}
            onChange={(v) => setVolume(v as number)}
            label="Volume"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={bass}
            onChange={(v) => setBass(v as number)}
            label="Bass"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={mid}
            onChange={(v) => setMid(v as number)}
            label="Mid"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={treble}
            onChange={(v) => setTreble(v as number)}
            label="Treble"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={presence}
            onChange={(v) => setPresence(v as number)}
            label="Presence"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Parametric EQ                                                      */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Parametric EQ
        </h2>
        <div className="flex flex-col gap-1">
          <Slider
            value={lowCut}
            onChange={(v) => setLowCut(v as number)}
            min={20}
            max={500}
            step={10}
            label="Low Cut"
            valuePosition="right"
            formatValue={(v) => `${v} Hz`}
          />
          <Slider
            value={lowShelf}
            onChange={(v) => setLowShelf(v as number)}
            label="Low Shelf"
            valuePosition="right"
            formatValue={(v) => {
              const db = ((v - 50) / 50) * 12;
              return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
            }}
          />
          <Slider
            value={midFreq}
            onChange={(v) => setMidFreq(v as number)}
            min={200}
            max={8000}
            step={100}
            label="Mid Freq"
            valuePosition="right"
            formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`}
          />
          <Slider
            value={midGain}
            onChange={(v) => setMidGain(v as number)}
            label="Mid Gain"
            valuePosition="right"
            formatValue={(v) => {
              const db = ((v - 50) / 50) * 12;
              return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
            }}
          />
          <Slider
            value={highShelf}
            onChange={(v) => setHighShelf(v as number)}
            label="High Shelf"
            valuePosition="right"
            formatValue={(v) => {
              const db = ((v - 50) / 50) * 12;
              return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
            }}
          />
          <Slider
            value={highCut}
            onChange={(v) => setHighCut(v as number)}
            min={1000}
            max={20000}
            step={500}
            label="High Cut"
            valuePosition="right"
            formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Frequency & Dynamic Range                                          */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Range Selection
        </h2>
        <div className="flex flex-col gap-1">
          <Slider
            value={freqRange}
            onChange={(v) => setFreqRange(v as [number, number])}
            min={20}
            max={20000}
            step={100}
            label="Freq Band"
            valuePosition="right"
            formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
          />
          <Slider
            value={dynamicRange}
            onChange={(v) => setDynamicRange(v as [number, number])}
            label="Dynamics"
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Compressor                                                         */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Compressor
        </h2>
        <div className="flex flex-col gap-1">
          <Slider
            value={threshold}
            onChange={(v) => setThreshold(v as number)}
            label="Threshold"
            valuePosition="right"
            formatValue={(v) => `${-Math.round((100 - v) * 0.6)} dB`}
          />
          <Slider
            value={ratio}
            onChange={(v) => setRatio(v as number)}
            label="Ratio"
            valuePosition="right"
            step={5}
            showSteps
            formatValue={(v) => {
              const r = 1 + (v / 100) * 19;
              return `${r.toFixed(1)}:1`;
            }}
          />
          <Slider
            value={attack}
            onChange={(v) => setAttack(v as number)}
            label="Attack"
            valuePosition="right"
            formatValue={(v) => {
              const ms = 0.1 + (v / 100) * 99.9;
              return `${ms.toFixed(1)} ms`;
            }}
          />
          <Slider
            value={release}
            onChange={(v) => setRelease(v as number)}
            label="Release"
            valuePosition="right"
            formatValue={(v) => {
              const ms = 10 + (v / 100) * 990;
              return `${Math.round(ms)} ms`;
            }}
          />
          <Slider
            value={makeupGain}
            onChange={(v) => setMakeupGain(v as number)}
            label="Makeup"
            valuePosition="right"
            formatValue={(v) => {
              const db = (v / 100) * 24;
              return `+${db.toFixed(1)} dB`;
            }}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Effects Sends (with tooltip)                                       */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Effects Sends
        </h2>
        <div className="flex flex-col gap-1">
          <Slider
            value={reverbSend}
            onChange={(v) => setReverbSend(v as number)}
            label="Reverb"
            valuePosition="tooltip"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={delaySend}
            onChange={(v) => setDelaySend(v as number)}
            label="Delay"
            valuePosition="tooltip"
            formatValue={(v) => `${v}%`}
          />
          <Slider
            value={chorusSend}
            onChange={(v) => setChorusSend(v as number)}
            label="Chorus"
            valuePosition="tooltip"
            formatValue={(v) => `${v}%`}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Settings — Comfortable Pips (stepper)                              */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Settings
        </h2>
        <div className="flex flex-col gap-2">
          <SliderComfortable
            variant="pips"
            label="Reverb Type"
            value={reverbType}
            onChange={setReverbType}
            min={0}
            max={4}
            formatValue={(v) => reverbTypes[v]}
          />
          <SliderComfortable
            variant="pips"
            label="Quality"
            value={quality}
            onChange={setQuality}
            min={0}
            max={4}
            formatValue={(v) => qualityLabels[v]}
          />
          <SliderComfortable
            variant="pips"
            label="Filter"
            value={filterMode}
            onChange={setFilterMode}
            min={0}
            max={3}
            formatValue={(v) => filterModes[v]}
          />
          <SliderComfortable
            variant="pips"
            label="Oversample"
            value={oversample}
            onChange={setOversample}
            min={0}
            max={3}
            formatValue={(v) => `${Math.pow(2, v)}x`}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Master Controls — Comfortable Scrubber                             */}
      {/* ---------------------------------------------------------------- */}

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Master Controls
        </h2>
        <div className="flex flex-col gap-2">
          <SliderComfortable
            variant="scrubber"
            label="Master"
            value={masterVol}
            onChange={setMasterVol}
            min={0}
            max={100}
            formatValue={(v) => `${v}%`}
          />
          <SliderComfortable
            variant="scrubber"
            label="Pan"
            value={pan}
            onChange={setPan}
            min={0}
            max={100}
            formatValue={(v) => {
              if (v === 50) return "C";
              return v < 50 ? `L${50 - v}` : `R${v - 50}`;
            }}
          />
          <SliderComfortable
            variant="scrubber"
            label="Tempo"
            value={tempo}
            onChange={setTempo}
            min={60}
            max={200}
            formatValue={(v) => `${v} BPM`}
          />
          <SliderComfortable
            variant="scrubber"
            label="Swing"
            value={swing}
            onChange={setSwing}
            min={0}
            max={100}
            formatValue={(v) => `${v}%`}
          />
          <SliderComfortable
            variant="scrubber"
            label="Dry / Wet"
            value={dryWet}
            onChange={setDryWet}
            min={0}
            max={100}
            formatValue={(v) => `${v}%`}
          />
          <SliderComfortable
            variant="scrubber"
            label="Feedback"
            value={feedback}
            onChange={setFeedback}
            min={0}
            max={100}
            formatValue={(v) => `${v}%`}
          />
        </div>
      </section>
    </div>
  );
}
