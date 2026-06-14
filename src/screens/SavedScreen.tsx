import React, { useState } from "react";
import { Alert, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PoiImageBackground } from "../components/PoiImageBackground";
import { HeroCard, Input, Pill, Screen, SectionTitle, SegmentedControl, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { t, textFor } from "../utils/i18n";
import { placeLineText, placeText } from "../utils/placeNames";
import { tripDisplayDateRange, tripDisplayLocation, tripDisplayNote, tripDisplayTitle } from "../utils/tripDisplay";

type Draft = {
  title: string;
  address: string;
  description: string;
};

type HistoryView = "gallery" | "summary";

export const SavedScreen = () => {
  const { state, theme, destinationsById, pastTrips } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [historyTripId, setHistoryTripId] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<HistoryView>("summary");
  const [hiddenMemoryPhotoUris, setHiddenMemoryPhotoUris] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>({ title: "", address: "", description: "" });
  const savedOptions = ["history", "wishlists"] as const;
  const zh = state.locale === "zh";
  const savedDestinations = state.savedDestinationIds
    .map((id) => destinationsById[id])
    .filter(Boolean);

  const startEdit = (destinationId: string) => {
    const destination = destinationsById[destinationId];
    if (!destination) {
      return;
    }
    setEditingId(destinationId);
    setDraft({
      title: destination.title,
      address: destination.address,
      description: destination.description,
    });
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }
    state.actions.updateDestinationDetails(editingId, draft);
    setEditingId(null);
  };
  const pendingDestination = pendingAddId ? destinationsById[pendingAddId] : undefined;
  const historyTrip = historyTripId ? state.trips.find((trip) => trip.id === historyTripId) : undefined;
  const tripDays = (trip: typeof state.trips[number]) => {
    const maxDay = trip.durationDays ?? trip.stops.reduce((max, stop) => Math.max(max, stop.day), 1);
    return Array.from({ length: maxDay }, (_, index) => index + 1);
  };

  const openHistoryView = (tripId: string, view: HistoryView) => {
    setHistoryTripId(tripId);
    setHistoryView(view);
    setHiddenMemoryPhotoUris([]);
  };

  const uploadMemoryPhotos = async () => {
    if (!historyTrip) {
      return;
    }
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          zh ? "需要照片权限" : "Photo permission required",
          zh ? "请允许 Eslay 访问相册后再上传照片。" : "Allow Eslay to access your photo library before uploading.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.55,
        base64: true,
      });
      const uris =
        result.assets
          ?.map((asset) =>
            asset.base64
              ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
              : asset.uri,
          )
          .filter(Boolean) ?? [];
      if (!result.canceled && uris.length > 0) {
        state.actions.addTripMemoryPhotos(historyTrip.id, uris);
      }
    } catch {
      Alert.alert(
        zh ? "图片选择器尚未安装" : "Image picker not installed",
        zh ? "请先运行 npx expo install expo-image-picker。" : "Run npx expo install expo-image-picker first.",
      );
    }
  };

  const deleteMemoryPhoto = (photoUri: string) => {
    if (!historyTrip) {
      return;
    }
    setHiddenMemoryPhotoUris((current) => [...current, photoUri]);
    state.actions.removeTripMemoryPhoto(historyTrip.id, photoUri);
  };

  if (historyTrip) {
    const visibleMemoryPhotos = Array.from(new Set(historyTrip.memoryPhotos ?? [])).filter(
      (uri) => Boolean(uri) && !hiddenMemoryPhotoUris.includes(uri),
    );
    const groupedHistoryStops = historyTrip.stops.reduce<Record<number, typeof historyTrip.stops>>((groups, stop) => {
      groups[stop.day] = [...(groups[stop.day] ?? []), stop];
      return groups;
    }, {});
    return (
      <Screen>
        <Pressable
          onPress={() => setHistoryTripId(null)}
          style={[styles.historyBack, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.historyBackText, { color: theme.colors.text }]}>{zh ? "返回历史行程" : "Back to trip history"}</Text>
        </Pressable>
        <HeroCard
          title={tripDisplayTitle(state.locale, historyTrip)}
          subtitle={`${tripDisplayLocation(state.locale, historyTrip)} · ${tripDisplayDateRange(state.locale, historyTrip)}`}
          image={historyTrip.coverImage}
          rightBadge={historyView === "gallery" ? (zh ? "回忆相册" : "MEMORIES") : (zh ? "行程总结" : "TRIP RECAP")}
        />

        {historyView === "gallery" ? (
          <View style={[styles.stack, styles.innerPad]}>
            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{zh ? "回忆相册" : "Memory gallery"}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>
                {zh ? "从手机相册选择照片，为这段旅程保存真实回忆。" : "Choose photos from your device to preserve memories from this trip."}
              </Text>
              <Pressable onPress={uploadMemoryPhotos} style={[styles.uploadButton, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.uploadButtonText}>{zh ? "上传旅行照片" : "Upload trip photos"}</Text>
              </Pressable>
            </SoftCard>
            {visibleMemoryPhotos.length > 0 ? (
              <View style={styles.memoryGrid}>
                {visibleMemoryPhotos.map((uri) => (
                  <View key={uri} style={styles.memoryTile}>
                    <Image source={{ uri }} style={styles.memoryImage} />
                    <Pressable
                      onPress={() => deleteMemoryPhoto(uri)}
                      style={styles.memoryDeleteButton}
                    >
                      <Text style={styles.memoryDeleteText}>{zh ? "删除" : "Delete"}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <SoftCard>
                <Text style={[styles.note, { color: theme.colors.subtext }]}>
                  {zh ? "还没有上传照片。" : "No photos uploaded yet."}
                </Text>
              </SoftCard>
            )}
          </View>
        ) : (
          <View style={[styles.stack, styles.innerPad]}>
            <View style={styles.summaryStats}>
              <View style={[styles.summaryStat, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.summaryStatValue, { color: theme.colors.accent }]}>{historyTrip.durationDays ?? Object.keys(groupedHistoryStops).length}</Text>
                <Text style={[styles.summaryStatLabel, { color: theme.colors.subtext }]}>{zh ? "旅行天数" : "Days"}</Text>
              </View>
              <View style={[styles.summaryStat, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.summaryStatValue, { color: theme.colors.accent }]}>{historyTrip.stops.length}</Text>
                <Text style={[styles.summaryStatLabel, { color: theme.colors.subtext }]}>{zh ? "到访景点" : "Stops"}</Text>
              </View>
            </View>
            <SoftCard>
              <Text style={[styles.heading, { color: theme.colors.text }]}>{zh ? "旅程回顾" : "Journey recap"}</Text>
              <Text style={[styles.body, { color: theme.colors.subtext }]}>{tripDisplayNote(state.locale, historyTrip)}</Text>
            </SoftCard>
            {Object.entries(groupedHistoryStops).map(([day, stops]) => (
              <SoftCard key={day}>
                <Text style={[styles.summaryDayTitle, { color: theme.colors.text }]}>{zh ? `第 ${day} 天` : `Day ${day}`}</Text>
                <View style={styles.summaryStopList}>
                  {stops.map((stop, index) => {
                    const destination = destinationsById[stop.destinationId];
                    return destination ? (
                      <View key={stop.id} style={[styles.summaryStop, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.summaryStopIndex, { color: theme.colors.accent }]}>{index + 1}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.summaryStopTitle, { color: theme.colors.text }]}>{placeText(state.locale, destination.title)}</Text>
                          <Text style={[styles.summaryStopMeta, { color: theme.colors.subtext }]}>{stop.time} · {destination.address}</Text>
                        </View>
                      </View>
                    ) : null;
                  })}
                </View>
              </SoftCard>
            ))}
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <HeroCard
        title={t(state.locale, "savedHeroTitle")}
        subtitle={t(state.locale, "savedHeroSub")}
        image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        rightBadge={t(state.locale, "savedTrips")}
      />

      <View style={styles.innerPad}>
        <SegmentedControl
          options={savedOptions.map((option) => t(state.locale, option))}
          value={t(state.locale, state.savedView)}
          onChange={(value) => {
            const next = savedOptions.find((option) => t(state.locale, option) === value) ?? "history";
            state.actions.setSavedView(next);
          }}
        />
      </View>

      {state.savedView === "history" ? (
        <>
          <SectionTitle title={t(state.locale, "pastTrips")} hint={`${pastTrips.length} ${t(state.locale, "archived")}`} />
          <View style={[styles.stack, styles.innerPad]}>
            {pastTrips.map((trip) => (
              <SoftCard key={trip.id}>
                <ImageBackground source={{ uri: trip.coverImage }} style={styles.tripImage} imageStyle={{ borderRadius: 24 }}>
                  <View style={styles.imageShade}>
                    <Text style={styles.imageKicker}>{trip.status.toUpperCase()}</Text>
                    <Text style={styles.imageTitle}>{tripDisplayLocation(state.locale, trip)}</Text>
                  </View>
                </ImageBackground>
                <Text style={[styles.title, { color: theme.colors.text }]}>{tripDisplayTitle(state.locale, trip)}</Text>
                <Text style={[styles.meta, { color: theme.colors.subtext }]}>
                  {tripDisplayLocation(state.locale, trip)}  {tripDisplayDateRange(state.locale, trip)}  {textFor(state.locale, trip.travelType ?? "Trip")}
                </Text>
                <Text style={[styles.note, { color: theme.colors.subtext }]}>{tripDisplayNote(state.locale, trip)}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => openHistoryView(trip.id, "gallery")}
                    style={[styles.historyAction, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.historyActionText, { color: theme.colors.text }]}>{t(state.locale, "memoryGallery")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openHistoryView(trip.id, "summary")}
                    style={[styles.historyAction, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                  >
                    <Text style={styles.historyActionPrimaryText}>{t(state.locale, "routePreview")}</Text>
                  </Pressable>
                </View>
              </SoftCard>
            ))}
          </View>
        </>
      ) : null}

      {state.savedView === "wishlists" ? (
        <>
          <SectionTitle
            title={zh ? "\u6536\u85cf\u7ba1\u7406" : "Saved manager"}
            hint={`${savedDestinations.length} ${t(state.locale, "items")}`}
          />
          <View style={[styles.managerPanel, styles.innerPad, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
            <View style={[styles.managerOrbit, { borderColor: theme.colors.accent }]} />
            <Text style={styles.managerKicker}>{zh ? "\u53ef\u7f16\u8f91\u6536\u85cf" : "EDITABLE SAVES"}</Text>
            <Text style={styles.managerTitle}>{zh ? "\u628a\u7075\u611f\u53d8\u6210\u884c\u7a0b" : "Turn saved ideas into a route"}</Text>
            <Text style={styles.managerMeta}>
              {zh
                ? "\u4fee\u6539\u4fe1\u606f\u3001\u79fb\u9664\u6536\u85cf\uff0c\u6216\u76f4\u63a5\u52a0\u5165\u5f53\u524d\u884c\u7a0b\u3002"
                : "Edit details, remove saved items, or add them directly to the active trip."}
            </Text>
          </View>

          <View style={[styles.stack, styles.innerPad]}>
            {savedDestinations.length === 0 ? (
              <SoftCard>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {zh ? "\u8fd8\u6ca1\u6709\u6536\u85cf" : "No saved items yet"}
                </Text>
                <Text style={[styles.note, { color: theme.colors.subtext }]}>
                  {zh ? "\u53bb\u9996\u9875\u4fdd\u5b58\u4e00\u4e2a\u60f3\u53bb\u7684\u5730\u65b9\u5427\u3002" : "Save a destination from Discover to manage it here."}
                </Text>
              </SoftCard>
            ) : null}

            {savedDestinations.map((destination, index) => {
              const editing = editingId === destination.id;
              return (
                <SoftCard key={destination.id}>
                  <PoiImageBackground
                    title={destination.title}
                    city={destination.city}
                    fallbackImage={destination.image}
                    style={styles.savedImage}
                    imageStyle={{ borderRadius: 24 }}
                  >
                    <View style={styles.imageShade}>
                      <Text style={styles.imageKicker}>{placeText(state.locale, destination.country).toUpperCase()}</Text>
                      <Text style={styles.imageTitle}>{placeText(state.locale, destination.city)}</Text>
                    </View>
                  </PoiImageBackground>
                  <View style={[styles.savedAura, { borderColor: theme.colors.border }]} />
                  <View style={styles.savedTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.savedIndex, { color: theme.colors.accent }]}>0{index + 1}</Text>
                      {editing ? (
                        <View style={styles.editStack}>
                          <Input
                            value={draft.title}
                            onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
                            placeholder={zh ? "\u6807\u9898" : "Title"}
                          />
                          <Input
                            value={draft.address}
                            onChangeText={(value) => setDraft((current) => ({ ...current, address: value }))}
                            placeholder={zh ? "\u5730\u5740" : "Address"}
                          />
                          <Input
                            value={draft.description}
                            onChangeText={(value) => setDraft((current) => ({ ...current, description: value }))}
                            placeholder={zh ? "\u5907\u6ce8" : "Description"}
                          />
                        </View>
                      ) : (
                        <>
                          <Text style={[styles.title, { color: theme.colors.text }]}>{placeText(state.locale, destination.title)}</Text>
                          <Text style={[styles.meta, { color: theme.colors.subtext }]}>
                            {placeText(state.locale, destination.city)}  {placeText(state.locale, destination.country)}
                          </Text>
                          <Text style={[styles.note, { color: theme.colors.subtext }]}>{destination.address}</Text>
                          <Text style={[styles.description, { color: theme.colors.subtext }]}>{destination.description}</Text>
                        </>
                      )}
                    </View>
                    <View style={[styles.savedBadge, { backgroundColor: theme.colors.accentSoft }]}>
                      <Text style={[styles.savedBadgeText, { color: theme.colors.accent }]}>{destination.category.slice(0, 3).toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.actionGrid}>
                    {editing ? (
                      <>
                        <Pressable onPress={saveEdit} style={[styles.actionButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}>
                          <Text style={styles.primaryActionText}>{zh ? "\u4fdd\u5b58" : "Save"}</Text>
                        </Pressable>
                        <Pressable onPress={() => setEditingId(null)} style={[styles.actionButton, { borderColor: theme.colors.border }]}>
                          <Text style={[styles.secondaryActionText, { color: theme.colors.text }]}>{zh ? "\u53d6\u6d88" : "Cancel"}</Text>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable onPress={() => startEdit(destination.id)} style={[styles.actionButton, { borderColor: theme.colors.border }]}>
                          <Text style={[styles.secondaryActionText, { color: theme.colors.text }]}>{zh ? "\u7f16\u8f91" : "Edit"}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setPendingAddId(destination.id)}
                          style={[styles.actionButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                        >
                          <Text style={styles.primaryActionText}>{zh ? "\u52a0\u5165\u884c\u7a0b" : "Add trip"}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => state.actions.removeSavedDestination(destination.id)}
                          style={[styles.actionButton, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}14` }]}
                        >
                          <Text style={[styles.secondaryActionText, { color: theme.colors.danger }]}>{zh ? "\u5220\u9664" : "Delete"}</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </SoftCard>
              );
            })}
          </View>
        </>
      ) : null}

      <Modal transparent visible={Boolean(pendingAddId)} animationType="slide" onRequestClose={() => setPendingAddId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.tripPicker, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
            </View>
            <Text style={[styles.tripPickerTitle, { color: theme.colors.text }]}>
              {zh ? "\u9009\u62e9\u52a0\u5165\u54ea\u4e2a\u884c\u7a0b" : "Choose an itinerary"}
            </Text>
            <Text style={[styles.tripPickerMeta, { color: theme.colors.subtext }]}>
              {pendingDestination ? placeText(state.locale, pendingDestination.title) : ""}
            </Text>
            <View style={styles.tripChoiceList}>
              {state.trips.map((trip) => (
                <View
                  key={trip.id}
                  style={[styles.tripChoice, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
                >
                  <View style={styles.tripChoiceHeader}>
                    <ImageBackground source={{ uri: trip.coverImage }} style={styles.tripChoiceImage} imageStyle={{ borderRadius: 16 }}>
                      <View style={styles.tripChoiceShade} />
                    </ImageBackground>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tripChoiceTitle, { color: theme.colors.text }]}>{tripDisplayTitle(state.locale, trip)}</Text>
                      <Text style={[styles.tripChoiceMeta, { color: theme.colors.subtext }]}>{tripDisplayLocation(state.locale, trip)}  {tripDisplayDateRange(state.locale, trip)}</Text>
                    </View>
                    <Text style={{ color: theme.colors.accent, fontWeight: "900" }}>{trip.stops.length}</Text>
                  </View>
                  <Text style={[styles.dayPickerLabel, { color: theme.colors.subtext }]}>
                    {zh ? "\u9009\u62e9\u52a0\u5165\u7684\u5929\u6570" : "Choose target day"}
                  </Text>
                  <View style={styles.dayChoiceRow}>
                    {tripDays(trip).map((day) => (
                      <Pressable
                        key={day}
                        onPress={() => {
                          if (pendingAddId) {
                            state.actions.addDestinationToTrip(trip.id, pendingAddId, day);
                          }
                          setPendingAddId(null);
                        }}
                        style={[styles.dayChoiceButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                      >
                        <Text style={[styles.dayChoiceText, { color: theme.colors.text }]}>
                          {zh ? `\u7b2c ${day} \u5929` : `Day ${day}`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <Pressable onPress={() => setPendingAddId(null)} style={[styles.cancelButton, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{zh ? "\u53d6\u6d88" : "Cancel"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  innerPad: {
    marginHorizontal: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  tripImage: {
    height: 142,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  savedImage: {
    height: 154,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  imageShade: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
    backgroundColor: "rgba(8, 20, 24, 0.28)",
  },
  imageKicker: {
    color: "#FFB98E",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  imageTitle: {
    color: "#FFF7EC",
    marginTop: 4,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  body: { marginTop: 7, fontSize: 13, lineHeight: 20 },
  meta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  gallery: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  galleryTile: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 28,
    alignItems: "center",
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  historyAction: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  historyActionText: { fontSize: 13, fontWeight: "900" },
  historyActionPrimaryText: { color: "#FFF7EC", fontSize: 13, fontWeight: "900" },
  historyBack: {
    marginHorizontal: spacing.md,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  historyBackText: { fontSize: 12, fontWeight: "900" },
  uploadButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  uploadButtonText: { color: "#FFF7EC", fontSize: 13, fontWeight: "900" },
  memoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  memoryTile: { width: "48%", aspectRatio: 1, position: "relative" },
  memoryImage: { width: "100%", height: "100%", borderRadius: 22, backgroundColor: "#DDE8E7" },
  memoryDeleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(25, 31, 33, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 4,
    elevation: 4,
  },
  memoryDeleteText: { color: "#FFF7EC", fontSize: 10, fontWeight: "900" },
  summaryStats: { flexDirection: "row", gap: spacing.sm },
  summaryStat: { flex: 1, borderWidth: 1, borderRadius: 24, padding: spacing.md },
  summaryStatValue: { fontSize: 30, lineHeight: 34, fontWeight: "900" },
  summaryStatLabel: { marginTop: 3, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  summaryDayTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  summaryStopList: { marginTop: spacing.sm },
  summaryStop: { flexDirection: "row", gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1 },
  summaryStopIndex: { width: 22, fontSize: 13, fontWeight: "900" },
  summaryStopTitle: { fontSize: 14, fontWeight: "900" },
  summaryStopMeta: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  managerPanel: {
    borderWidth: 1,
    borderRadius: 32,
    padding: spacing.md,
    minHeight: 132,
    overflow: "hidden",
    position: "relative",
  },
  managerOrbit: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    right: -42,
    top: -52,
    opacity: 0.72,
  },
  managerKicker: { color: "#FFB98E", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  managerTitle: { color: "#FFF7EC", marginTop: 8, fontSize: 24, lineHeight: 28, fontWeight: "900", letterSpacing: -0.6 },
  managerMeta: { color: "#FFD9C2", marginTop: 6, fontSize: 12, lineHeight: 18, fontWeight: "700", maxWidth: "82%" },
  savedTop: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  savedAura: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    right: -36,
    top: -44,
    opacity: 0.42,
  },
  savedIndex: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4, marginBottom: spacing.xs },
  savedBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 7, alignSelf: "flex-start" },
  savedBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  editStack: {
    gap: spacing.sm,
  },
  actionGrid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  primaryActionText: { color: "#FFF7EC", fontSize: 13, fontWeight: "900" },
  secondaryActionText: { fontSize: 13, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(2, 12, 16, 0.42)",
  },
  tripPicker: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: spacing.md,
    maxHeight: "82%",
  },
  sheetHandleWrap: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sheetHandle: {
    width: 56,
    height: 6,
    borderRadius: 3,
  },
  tripPickerTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  tripPickerMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  tripChoiceList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tripChoice: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  tripChoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tripChoiceImage: {
    width: 58,
    height: 58,
    overflow: "hidden",
  },
  tripChoiceShade: {
    flex: 1,
    backgroundColor: "rgba(8, 20, 24, 0.2)",
  },
  tripChoiceTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  tripChoiceMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  dayPickerLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dayChoiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  dayChoiceButton: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  dayChoiceText: {
    fontSize: 12,
    fontWeight: "900",
  },
  cancelButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
});
