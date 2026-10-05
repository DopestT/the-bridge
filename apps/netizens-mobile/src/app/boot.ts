export type BootState = {
  phase: 'shell' | 'ready';
  hydrated: boolean;
};

export function createInitialBootState(): BootState {
  return { phase: 'shell', hydrated: false };
}
