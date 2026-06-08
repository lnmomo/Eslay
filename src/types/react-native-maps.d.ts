declare module "react-native-maps" {
  import React from "react";
  import { StyleProp, ViewStyle } from "react-native";

  export type LatLng = {
    latitude: number;
    longitude: number;
  };

  export class Marker extends React.Component<any> {}
  export class Polyline extends React.Component<any> {}

  export default class MapView extends React.Component<{
    ref?: React.Ref<MapView>;
    style?: StyleProp<ViewStyle>;
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    onMapReady?: () => void;
    children?: React.ReactNode;
  }> {
    fitToCoordinates?: (
      coordinates: LatLng[],
      options?: {
        edgePadding?: { top: number; right: number; bottom: number; left: number };
        animated?: boolean;
      },
    ) => void;
  }
}
