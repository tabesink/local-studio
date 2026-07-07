"use client";

import { useSyncExternalStore } from "react";

export type SettingsRoute = "personal" | "administration";

type SettingsDialogState = {
  isOpen: boolean;
  route: SettingsRoute;
};

const listeners = new Set<() => void>();

let state: SettingsDialogState = {
  isOpen: false,
  route: "personal",
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<SettingsDialogState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useSettingsDialogStore<T = SettingsDialogState>(
  selector: (state: SettingsDialogState) => T = (value) => value as T,
): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
}

export function openSettingsDialog(route: SettingsRoute = "personal") {
  setState({ isOpen: true, route });
}

export function closeSettingsDialog() {
  setState({ isOpen: false });
}

export function setSettingsDialogRoute(route: SettingsRoute) {
  setState({ route });
}
