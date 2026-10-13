export function toPublicLocation(location: {
  latitude?: number;
  longitude?: number;
  area: string;
}) {
  return { area: location.area.trim().slice(0, 100) };
}
