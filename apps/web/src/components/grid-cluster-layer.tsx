"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useMap } from "react-leaflet";

export const SMALL_CLUSTER_MAX = 15;

type GridPoint = { lat: number; lng: number };

/**
 * Deterministic grid clustering with the product's small-cluster rule: a grid
 * cell holding more than maxPerCell points renders one cluster icon; a cell
 * with maxPerCell or fewer renders every point as its own marker at its real
 * position. So a cluster never hides a handful of locations that could be
 * shown directly: the smallest cluster is always bigger than the max, and one
 * zoom step is enough to see individual locations.
 *
 * Implemented directly on the map (no markercluster internals): the layout is
 * recomputed on every zoom/move from screen-space grid cells, cluster clicks
 * zoom toward the group, and everything is removed cleanly on unmount.
 */
export function GridClusterLayer<T extends GridPoint>({
  points,
  pointId,
  createMarker,
  clusterIcon,
  onSelect,
  selectedId,
  maxPerCell = SMALL_CLUSTER_MAX,
  cellSize = 64
}: {
  points: readonly T[];
  pointId: (point: T) => string;
  createMarker: (point: T, isSelected: boolean) => L.Layer;
  clusterIcon: (count: number, members: readonly T[]) => L.DivIcon;
  onSelect: (point: T) => void;
  selectedId?: string | null;
  maxPerCell?: number;
  cellSize?: number;
}) {
  const map = useMap();
  const callbacks = useRef({ pointId, createMarker, clusterIcon, onSelect });
  useEffect(() => { callbacks.current = { pointId, createMarker, clusterIcon, onSelect }; });

  useEffect(() => {
    const layer = L.layerGroup().addTo(map);
    let frame = 0;

    const recompute = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { pointId: idOf, createMarker: make, clusterIcon: icon, onSelect: pick } = callbacks.current;
        layer.clearLayers();
        const bounds = map.getBounds().pad(0.25);
        const cells = new Map<string, T[]>();
        for (const point of points) {
          if (!bounds.contains([point.lat, point.lng])) continue;
          const p = map.latLngToLayerPoint([point.lat, point.lng]);
          const key = `${Math.floor(p.x / cellSize)}:${Math.floor(p.y / cellSize)}`;
          const bucket = cells.get(key);
          if (bucket) bucket.push(point);
          else cells.set(key, [point]);
        }
        for (const members of cells.values()) {
          if (members.length > maxPerCell) {
            const lat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
            const lng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;
            const marker = L.marker([lat, lng], { icon: icon(members.length, members) });
            marker.on("click", () => map.setView([lat, lng], Math.min(16, map.getZoom() + 2), { animate: true }));
            layer.addLayer(marker);
          } else {
            for (const member of members) {
              const marker = make(member, idOf(member) === selectedId);
              marker.on("click", () => pick(member));
              layer.addLayer(marker);
            }
          }
        }
      });
    };

    recompute();
    map.on("zoomend", recompute);
    map.on("moveend", recompute);
    map.on("resize", recompute);
    return () => {
      cancelAnimationFrame(frame);
      map.off("zoomend", recompute);
      map.off("moveend", recompute);
      map.off("resize", recompute);
      layer.remove();
    };
  }, [map, points, selectedId, maxPerCell, cellSize]);

  return null;
}
