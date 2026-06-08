import React, { useEffect, useState } from "react";
import { ImageBackground, ImageStyle, StyleProp, Text, View, ViewStyle } from "react-native";
import { resolvePoiImage } from "../utils/poiImageResolver";

type PoiImageBackgroundProps = {
  title: string;
  city: string;
  fallbackImage: string;
  style: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  children?: React.ReactNode;
};

export const PoiImageBackground = ({
  title,
  city,
  fallbackImage,
  style,
  imageStyle,
  children,
}: PoiImageBackgroundProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setImage(null);
    setFailed(false);

    resolvePoiImage(title, city, fallbackImage).then((resolvedImage) => {
      if (alive) {
        setImage(resolvedImage);
      }
    });

    return () => {
      alive = false;
    };
  }, [city, fallbackImage, title]);

  if (!image || failed) {
    return (
      <View style={[style, { alignItems: "center", backgroundColor: "#17343A", justifyContent: "center" }]}>
        {children}
        <Text style={{ color: "#FFF7EC", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 8 }}>
          {failed ? "IMAGE RETRY NEEDED" : "MATCHING POI PHOTO"}
        </Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: image }}
      style={style}
      imageStyle={imageStyle}
      onError={() => {
        setFailed(true);
      }}
    >
      {children}
    </ImageBackground>
  );
};
