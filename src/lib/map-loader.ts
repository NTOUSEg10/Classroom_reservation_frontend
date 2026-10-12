export type MapState = "loading" | "ready" | "fallback";
export function watchMap(update: (state: MapState) => void, timeout = 2000) {
  let completed = false;
  const finish = (state: MapState) => {
    if (completed) return;
    completed = true;
    clearTimeout(timer);
    update(state);
  };
  const timer = setTimeout(() => finish("fallback"), timeout);
  return {
    loaded: () => finish("ready"),
    failed: () => finish("fallback"),
    dispose: () => {
      completed = true;
      clearTimeout(timer);
    },
  };
}
