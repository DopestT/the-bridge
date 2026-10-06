export const colors = {
  background: '#0b0c0d',
  surface: '#141619',
  text: '#f3efe5',
  muted: '#b9b3a7',
  border: '#2a2d31',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export function motionDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 180;
}
