/*
 * AudioManager.tsx
 * Design: "Surgical Theater" — Sound design using Web Audio API
 * Synthesized heartbeat, ambient drone, and transition sounds
 * No external audio files needed — all procedurally generated
 */

import { useEffect, useRef, useCallback } from "react";

interface AudioManagerProps {
  activeScene: number;
  enabled: boolean;
}

export default function AudioManager({ activeScene, enabled }: AudioManagerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const prevSceneRef = useRef(activeScene);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Ambient drone
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();
    droneOsc.type = "sine";
    droneOsc.frequency.value = 55;
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 200;
    droneGain.gain.value = 0;
    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
    droneOscRef.current = droneOsc;
    droneGainRef.current = droneGain;

    return ctx;
  }, []);

  // Heartbeat sound
  const playHeartbeat = useCallback((rate: number, intensity: number) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    const beat = () => {
      const now = ctx.currentTime;

      // Lub sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(60, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain1.gain.setValueAtTime(intensity * 0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Dub sound (delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(50, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(25, now + 0.25);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(intensity * 0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.25);
    };

    beat();
    heartbeatIntervalRef.current = setInterval(beat, 60000 / rate);
  }, []);

  // Transition whoosh sound
  const playWhoosh = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.3);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(now);
    noise.stop(now + 0.3);
  }, []);

  // Scene-based audio updates
  useEffect(() => {
    if (!enabled) return;

    const ctx = initAudio();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const droneGain = droneGainRef.current;

    // Play whoosh on scene change
    if (prevSceneRef.current !== activeScene) {
      playWhoosh();
      prevSceneRef.current = activeScene;
    }

    // Adjust audio based on scene
    if (activeScene <= 1) {
      // Calm heartbeat, gentle drone
      playHeartbeat(60, 0.3);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.08, (ctx.currentTime || 0) + 0.5);
      }
    } else if (activeScene === 2) {
      // Brain reveal - slightly elevated
      playHeartbeat(65, 0.4);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.1, (ctx.currentTime || 0) + 0.5);
      }
    } else if (activeScene === 3) {
      // Vessels - flowing feel
      playHeartbeat(70, 0.5);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.12, (ctx.currentTime || 0) + 0.5);
      }
    } else if (activeScene === 4) {
      // Ischemic stroke - distressed heartbeat
      playHeartbeat(90, 0.7);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.15, (ctx.currentTime || 0) + 0.5);
      }
    } else if (activeScene === 5) {
      // Hemorrhagic stroke - rapid, intense
      playHeartbeat(110, 0.9);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.18, (ctx.currentTime || 0) + 0.5);
      }
    } else {
      // Impact/Recovery - calming down
      playHeartbeat(65, 0.3);
      if (droneGain) {
        droneGain.gain.linearRampToValueAtTime(0.06, (ctx.currentTime || 0) + 0.5);
      }
    }
  }, [activeScene, enabled, initAudio, playHeartbeat, playWhoosh]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (droneOscRef.current) {
        try { droneOscRef.current.stop(); } catch {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Mute/unmute
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(
        enabled ? 0.15 : 0,
        (audioCtxRef.current?.currentTime || 0) + 0.3
      );
    }
  }, [enabled]);

  return null;
}
