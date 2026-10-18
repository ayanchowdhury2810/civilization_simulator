"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { MayorView, SimEvent, WorldSnapshot } from "./types";

export interface CivilizationState {
  world: WorldSnapshot | null;
  events: SimEvent[];
  mayor: MayorView | null;
  connected: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
}

export function useCivilization(pollMs = 2500): CivilizationState {
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [mayor, setMayor] = useState<MayorView | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const [worldData, eventData, mayorData] = await Promise.all([
        api.getWorld(),
        api.getEvents(80),
        api.getMayor(),
      ]);
      setWorld(worldData);
      setEvents(eventData);
      setMayor(mayorData);
      setConnected(true);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : "Unknown error");
      setWorld(null);
      setEvents([]);
      setMayor(null);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = () => {
      if (active) void refresh();
    };
    run();
    const handle = setInterval(run, pollMs);
    return () => {
      active = false;
      clearInterval(handle);
    };
  }, [refresh, pollMs]);

  return {
    world,
    events,
    mayor,
    connected,
    error,
    lastUpdated,
    refresh,
  };
}
