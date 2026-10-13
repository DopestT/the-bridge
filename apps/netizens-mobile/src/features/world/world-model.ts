import { ApiError } from "../../api/netizens-repository.ts";
export type ReadState<T> = {
  phase:
    | "neverLoaded"
    | "cachedRefreshing"
    | "offlineCached"
    | "ready"
    | "unavailable"
    | "unauthorized";
  data: T | null;
};
export async function loadCached<T>(options: {
  cached: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  save: (data: T) => Promise<void>;
  clear: () => Promise<void>;
  emit: (state: ReadState<T>) => void;
}) {
  const data = await options.cached();
  options.emit({ phase: data ? "cachedRefreshing" : "neverLoaded", data });
  try {
    const fresh = await options.refresh();
    if (fresh === null) {
      await options.clear();
      options.emit({ phase: "unavailable", data: null });
      return;
    }
    await options.save(fresh);
    options.emit({ phase: "ready", data: fresh });
  } catch (e) {
    if (e instanceof ApiError && e.kind === "authorization") {
      await options.clear();
      options.emit({ phase: "unauthorized", data: null });
    } else {
      options.emit({ phase: data ? "offlineCached" : "unavailable", data });
    }
  }
}
