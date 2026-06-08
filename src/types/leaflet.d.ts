declare module "leaflet" {
  export type Map = {
    fitBounds: (bounds: unknown, options?: unknown) => void;
    setView: (center: [number, number], zoom: number) => void;
    invalidateSize: () => void;
    remove: () => void;
  };

  export type LayerGroup = {
    addTo: (map: Map) => LayerGroup;
    clearLayers: () => void;
  };

  export const map: (element: HTMLElement, options?: unknown) => Map;
  export const tileLayer: (urlTemplate: string, options?: unknown) => { addTo: (map: Map) => void };
  export const layerGroup: () => LayerGroup;
  export const polyline: (latlngs: [number, number][], options?: unknown) => { addTo: (group: LayerGroup) => void };
  export const circleMarker: (
    latlng: [number, number],
    options?: unknown,
  ) => {
    addTo: (group: LayerGroup) => {
      bindPopup: (html: string) => void;
    };
    bindPopup: (html: string) => void;
  };
  export const latLngBounds: (latlngs: [number, number][]) => unknown;
}
