"use client";

// Client-only wrapper for MapLeaflet. Leaflet reads `window` at import time,
// which crashes during server rendering. Loading it via next/dynamic with
// ssr:false is only allowed inside a Client Component, so this thin wrapper is
// that boundary. FooterContactDetails (a Server Component) renders this instead
// of importing MapLeaflet directly.
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapLeaflet } from "./MapLeaflet";

const MapLeaflet_ = dynamic(() => import("./MapLeaflet").then((m) => m.MapLeaflet), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-full md:h-[460px] rounded-card bg-mauve/20 animate-pulse" />
  ),
});

export function MapLeafletClient(props: ComponentProps<typeof MapLeaflet>) {
  return <MapLeaflet_ {...props} />;
}
