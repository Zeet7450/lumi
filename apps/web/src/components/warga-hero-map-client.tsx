"use client";

import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

function IndonesiaBounds() {
  const map = useMap();
  useEffect(() => { map.fitBounds([[-11.2, 94.4], [6.4, 141.3]], { padding: [22, 22], animate: false }); }, [map]);
  return null;
}

export default function WargaHeroMapClient() {
  return <div className="warga-map-frame"><MapContainer center={[-2.5, 118]} zoom={4} minZoom={3} maxZoom={8} zoomControl={false} attributionControl className="warga-map-canvas" aria-label="Peta Indonesia dengan cakupan demo aktif di Kalimantan Barat"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><IndonesiaBounds /><Circle center={[-0.35, 110.25]} radius={190000} pathOptions={{ color: "#06B6D4", fillColor: "#06B6D4", fillOpacity: .12, weight: 1.5 }} /><CircleMarker center={[-0.35, 110.25]} radius={7} pathOptions={{ color: "#ffffff", fillColor: "#1E3A5F", fillOpacity: 1, weight: 2 }}><Tooltip permanent direction="top" offset={[0, -10]}>Kalimantan Barat</Tooltip></CircleMarker></MapContainer><aside className="warga-map-card"><strong>Cakupan aktif</strong><span>Kalimantan Barat</span><small>Visualisasi demo lokal</small></aside></div>;
}
