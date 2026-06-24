import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface ListingLocationMapProps {
  /** Exact coordinates — provided only when the address is revealed. */
  lat?: number | null;
  lng?: number | null;
  /** Fuzzed approximate center for the public circle. */
  approxLat?: number | null;
  approxLng?: number | null;
  /** Radius (meters) of the approximate circle. */
  approxRadiusM: number;
  revealed: boolean;
  exactLabel: string;
  approxLabel: string;
}

/**
 * OpenStreetMap-based location map. When `revealed` is true and exact coords are
 * present, it shows a precise marker. Otherwise it shows only a fuzzed circle so
 * promoters never learn the exact building location before validation.
 */
export function ListingLocationMap({
  lat,
  lng,
  approxLat,
  approxLng,
  approxRadiusM,
  revealed,
  exactLabel,
  approxLabel,
}: ListingLocationMapProps) {
  const showExact = revealed && lat != null && lng != null;
  const center: [number, number] | null = showExact
    ? [lat!, lng!]
    : approxLat != null && approxLng != null
      ? [approxLat, approxLng]
      : null;

  if (!center) return null;

  return (
    <div className="overflow-hidden rounded-xl border" style={{ height: 320 }}>
      <MapContainer
        center={center}
        zoom={showExact ? 16 : 14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showExact ? (
          <CircleMarker
            center={center}
            radius={10}
            pathOptions={{ color: "#0F7B6C", fillColor: "#0F7B6C", fillOpacity: 0.9 }}
          >
            <Popup>{exactLabel}</Popup>
          </CircleMarker>
        ) : (
          <Circle
            center={center}
            radius={approxRadiusM}
            pathOptions={{ color: "#0E1B2A", fillColor: "#0E1B2A", fillOpacity: 0.15 }}
          >
            <Popup>{approxLabel}</Popup>
          </Circle>
        )}
      </MapContainer>
    </div>
  );
}
