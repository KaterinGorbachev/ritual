"use client";

// react-leaflet map. It's client-only (react-leaflet touches the DOM at import
// time). All salon data — coordinates, address, translated text — is passed in
// as props from FooterContactDetails, which already fetches it server-side.
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { GoogleMapButton } from "./GoogleMapButton";

// Leaflet's own CSS + a shim that fixes the default marker icon paths in bundlers.
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

type MapLeafletProps = {
  /** Salon coordinates (from Firestore). */
  lat: number;
  lng: number;
  /** Address shown in the pin popup. */
  address: string;
  /** Initial zoom level (higher = closer). */
  zoom?: number;
  /** Translated text (owns i18n). */
  popupTitle: string;
  ariaLabel: string;
  googleMapLabel?: string;
  className?: string;
};

// On-brand pin built once (not per render) — a DOM icon instead of an image,
// so there are no broken icon-path issues.
const salonIcon = divIcon({
  className: "",
  html:
    '<span class="salon-pin">' +
    '<svg width="38" height="50" viewBox="0 0 38 50" xmlns="http://www.w3.org/2000/svg" class="text-blush">' +
    '<path d="M19 49S35 30 35 17A16 16 0 1 0 3 17C3 30 19 49 19 49Z" fill="currentColor" stroke="#DA1884" stroke-width="1"/>' +
    '<circle cx="19" cy="17" r="6" fill="#F6F3EE"/></svg></span>',
  iconSize: [38, 50],
  iconAnchor: [19, 49],
  popupAnchor: [0, -44],
});

// Custom controls live inside <MapContainer>, so they can grab the map instance
// via the useMap() hook and drive zoom / recenter imperatively.
function MapControls({ posix, zoom }: { posix: LatLngExpression; zoom: number }) {
  const map = useMap();

  const btn =
    "flex h-10 w-10 items-center justify-center rounded-pill bg-cream shadow-sm border-2 border-transparent transition duration-300 hover:border-magenta hover:brightness-95 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="absolute right-4 bottom-6 z-[500] flex flex-col gap-2">
      <button type="button" aria-label="Zoom in" className={btn} onClick={() => map.zoomIn()}>
        +
      </button>
      <button type="button" aria-label="Zoom out" className={btn} onClick={() => map.zoomOut()}>
        −
      </button>
      <button
        type="button"
        aria-label="Recenter on salon"
        className={btn}
        onClick={() => map.flyTo(posix, zoom, { animate: true, duration: 0.5 })}
      >
        ⌖
      </button>
    </div>
  );
}

export function MapLeaflet({
  lat,
  lng,
  address,
  zoom = 16,
  popupTitle,
  ariaLabel,
  googleMapLabel = "Google Maps",
  className = "",
}: MapLeafletProps) {
  const posix: LatLngExpression = [lat, lng];
  const googleMapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`relative w-full ${className}`}>
      {/* The map itself. react-leaflet handles init + cleanup for us. */}
      <div className="h-[340px] w-full md:h-[460px]" role="region" aria-label={ariaLabel}>
        <MapContainer
          center={posix}
          zoom={zoom}
          scrollWheelZoom={false} // don't trap page scroll
          zoomControl={false} // we render our own controls below
          style={{ height: "100%", width: "100%", borderRadius: "20px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />

          {/* Branded pin with a popup at the salon location. */}
          <Marker position={posix} icon={salonIcon} title={popupTitle}>
            <Popup>
              <strong>{popupTitle}</strong>
              <br />
              {address}
            </Popup>
          </Marker>

          {/* Zoom + recenter buttons (need the map instance via useMap). */}
          <MapControls posix={posix} zoom={zoom} />
        </MapContainer>
      </div>

      {/* Google Maps button — absolutely positioned on top of the map. */}
      <GoogleMapButton link={googleMapLink} className="absolute left-4 top-4 z-[500]">
        {googleMapLabel}
      </GoogleMapButton>
    </div>
  );
}
