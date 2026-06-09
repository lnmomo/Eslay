import React, { useEffect, useState } from "react";
import { ImageBackground, ImageStyle, StyleProp, Text, View, ViewStyle } from "react-native";
import { resolvePoiImage, searchPoiThumbnailUrl } from "../utils/poiImageResolver";

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
  const [image, setImage] = useState(() => searchPoiThumbnailUrl(title, city));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setImage(searchPoiThumbnailUrl(title, city));
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

  if (failed) {
    const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    return (
      <View style={[style, { backgroundColor: "#17343A", overflow: "hidden" }]}>
        <View
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 75,
            right: -36,
            top: -42,
            backgroundColor: "rgba(255, 143, 87, 0.78)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: 65,
            left: -40,
            bottom: -46,
            borderWidth: 1,
            borderColor: "rgba(255, 247, 236, 0.34)",
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
            padding: 14,
            backgroundColor: "rgba(8, 20, 24, 0.12)",
          }}
        >
          <Text style={{ color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }}>
            {city || "ESLAY"}
          </Text>
          <View>
            <Text style={{ color: "#FFF7EC", fontSize: 28, lineHeight: 30, fontWeight: "900", letterSpacing: -0.8 }}>
              {initials || "ES"}
            </Text>
            <Text style={{ color: "#FFE2CC", fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 3 }}>
              {title}
            </Text>
          </View>
        </View>
        <View style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: image }}
      style={style}
      imageStyle={imageStyle}
      onError={() => {
        if (image !== fallbackImage) {
          setImage(fallbackImage);
          return;
        }
        setFailed(true);
      }}
    >
      {children}
    </ImageBackground>
  );
};
