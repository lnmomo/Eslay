declare module "react-native-maps" {
  import * as React from "react";
  import { ViewProps } from "react-native";

  export type LatLng = {
    latitude: number;
    longitude: number;
  };

  export type Region = LatLng & {
    latitudeDelta: number;
    longitudeDelta: number;
  };

  export class Marker extends React.Component<any> {}
  export class Polyline extends React.Component<any> {}

  export default class MapView extends React.Component<
    ViewProps & {
      initialRegion?: Region;
      onMapReady?: () => void;
      ref?: React.Ref<MapView>;
    }
  > {
    fitToCoordinates?: (
      coordinates: LatLng[],
      options?: {
        edgePadding?: {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
        animated?: boolean;
      },
    ) => void;
  }
}
