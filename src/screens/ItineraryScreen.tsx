import React, { useState } from "react";
import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { PoiImageBackground } from "../components/PoiImageBackground";
import { HeroCard, Pill, Screen, SectionTitle, SoftCard } from "../components/Ui";
import { useAppContext } from "../context/AppContext";
import { radius, spacing } from "../theme/tokens";
import { Locale } from "../types";
import { t, textFor } from "../utils/i18n";
import { placeLineText, placeText } from "../utils/placeNames";
import { tripDisplayDateRange, tripDisplayLocation, tripDisplayNote, tripDisplayTitle } from "../utils/tripDisplay";

const copy = (zh: boolean, zhText: string, enText: string) => (zh ? zhText : enText);

const stopTypeLabel = (locale: Locale, type: string) =>
  locale === "zh"
    ? {
        flight: "\u822a\u73ed",
        hotel: "\u9152\u5e97",
        activity: "\u666f\u70b9",
        food: "\u9910\u996e",
        transport: "\u4ea4\u901a",
      }[type] ?? type
    : {
        flight: "Flight",
        hotel: "Hotel",
        activity: "Attraction",
        food: "Restaurant",
        transport: "Transport",
      }[type] ?? type;

export const ItineraryScreen = () => {
  const { state, activeTrip, destinationsById, theme } = useAppContext();
  const [editTimes, setEditTimes] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const zh = state.locale === "zh";
  const displayTitle = tripDisplayTitle(state.locale, activeTrip);
  const displayLocation = tripDisplayLocation(state.locale, activeTrip);
  const displayDateRange = tripDisplayDateRange(state.locale, activeTrip);
  const displayNote = tripDisplayNote(state.locale, activeTrip);
  const groupedStops = activeTrip.stops.reduce<Record<number, typeof activeTrip.stops>>((acc, stop) => {
    acc[stop.day] = [...(acc[stop.day] ?? []), stop];
    return acc;
  }, {});
  const dayKeys = Object.keys(groupedStops);
  const shiftTime = (time: string, minutes: number) => {
    const [hourText, minuteText] = time.split(":");
    const total = (Number(hourText) || 0) * 60 + (Number(minuteText) || 0) + minutes;
    const normalized = ((total % 1440) + 1440) % 1440;
    const hour = Math.floor(normalized / 60).toString().padStart(2, "0");
    const minute = (normalized % 60).toString().padStart(2, "0");
    return `${hour}:${minute}`;
  };
  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };
  const shareTrip = async () => {
    const stops = activeTrip.stops
      .map((stop, index) => {
        const destination = destinationsById[stop.destinationId];
        return destination ? `${index + 1}. ${stop.time} ${placeText(state.locale, destination.title)}` : "";
      })
      .filter(Boolean)
      .join("\n");
    const message = `${displayTitle}\n${displayLocation} · ${displayDateRange}\n${stops}`;
    try {
      await Share.share({ message, title: displayTitle });
      showNotice(copy(zh, "行程分享内容已生成。", "Itinerary share sheet opened."));
    } catch {
      showNotice(copy(zh, "当前设备暂不支持系统分享。", "Sharing is not available on this device."));
    }
  };

  return (
    <Screen>
      <HeroCard
        title={displayTitle}
        subtitle={`${displayLocation} \u00b7 ${displayDateRange}`}
        image={activeTrip.coverImage}
        rightBadge={t(state.locale, "tripPlanner")}
      />

      <View style={styles.innerPad}>
        <SoftCard>
          <View style={[styles.headerOrbit, { borderColor: theme.colors.border }]} />
          <View style={[styles.headerSignal, { backgroundColor: theme.colors.accent }]} />
          <Text style={[styles.noteLead, { color: theme.colors.text }]}>
            {copy(zh, "\u884c\u7a0b\u6982\u89c8", "Trip Header")}
          </Text>
          <Text style={[styles.noteBody, { color: theme.colors.subtext }]}>{displayNote}</Text>
          <View style={styles.inlineActions}>
            {false ? (
            <Pressable
              onPress={() => {
                state.actions.addActivityToTrip(activeTrip.id);
                showNotice(copy(zh, "已添加一个活动到当前行程。", "Activity added to this itinerary."));
              }}
              style={[styles.actionChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
            >
              <Text style={[styles.actionChipText, { color: theme.colors.text }]}>{copy(zh, "\u6dfb\u52a0\u6d3b\u52a8", "Add Activity")}</Text>
            </Pressable>
            ) : null}
            <Pressable onPress={shareTrip} style={[styles.actionChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={[styles.actionChipText, { color: theme.colors.text }]}>{copy(zh, "\u5206\u4eab\u884c\u7a0b", "Share Itinerary")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setEditTimes((current) => !current)}
              style={[
                styles.actionChip,
                {
                  borderColor: editTimes ? theme.colors.accent : theme.colors.border,
                  backgroundColor: editTimes ? theme.colors.accentSoft : theme.colors.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.actionChipText, { color: editTimes ? theme.colors.accent : theme.colors.text }]}>
                {editTimes ? copy(zh, "\u5b8c\u6210\u7f16\u8f91", "Done Editing") : copy(zh, "\u7f16\u8f91\u65f6\u95f4", "Edit Time")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDeleteOpen(true)}
              style={[styles.deleteChip, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}14` }]}
            >
              <Text style={[styles.deleteChipText, { color: theme.colors.danger }]}>
                {copy(zh, "\u5220\u9664\u5f53\u524d\u884c\u7a0b", "Delete trip")}
              </Text>
            </Pressable>
          </View>
          {notice ? (
            <View style={[styles.noticeBar, { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border }]}>
              <Text style={[styles.noticeText, { color: theme.colors.accent }]}>{notice}</Text>
            </View>
          ) : null}
        </SoftCard>
      </View>

      <SectionTitle
        title={copy(zh, "\u65e5\u671f\u9009\u62e9", "Date Selector")}
        hint={copy(zh, "\u6309\u5929\u89c4\u5212", "Day-by-day planning")}
      />
      <View style={[styles.daySelector, styles.innerPad]}>
        {dayKeys.length > 0 ? (
          dayKeys.map((dayKey) => (
            <Pill key={dayKey} label={zh ? `\u7b2c ${dayKey} \u5929` : `Day ${dayKey}`} selected={Number(dayKey) === 1} />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
            {copy(zh, "\u8fd9\u4e2a\u884c\u7a0b\u6682\u65e0\u666f\u70b9\uff0c\u53ef\u4ee5\u56de\u5230\u9996\u9875\u91cd\u65b0\u751f\u6210\u3002", "This trip has no stops yet. Generate a fresh route from Discover.")}
          </Text>
        )}
      </View>

      <SectionTitle
        title={copy(zh, "\u6574\u5408\u65f6\u95f4\u7ebf", "Integrated Timeline View")}
        hint={copy(zh, "\u957f\u6309\u53ef\u8c03\u6574\u987a\u5e8f", "Long press to rearrange")}
      />
      <View style={[styles.timelineWrap, styles.innerPad]}>
        {Object.entries(groupedStops).map(([dayKey, stops]) => {
          const day = Number(dayKey);
          const rearranging = state.rearrangeDay === day;
          return (
            <View key={day} style={styles.dayWrap}>
              <View style={styles.lineColumn}>
                <View style={[styles.dayDot, { backgroundColor: theme.colors.accent }]} />
                <View style={[styles.dayLine, { backgroundColor: theme.colors.border }]} />
              </View>
              <View style={styles.dayContent}>
                <View style={[styles.dayHeader, { backgroundColor: theme.colors.badge, borderColor: theme.colors.border }]}>
                  <View style={[styles.dayHeaderBeam, { backgroundColor: theme.colors.accent }]} />
                  <View style={styles.dayHeaderCopy}>
                    <Text style={styles.dayTitle}>
                      {zh ? `\u7b2c ${day} \u5929` : `Day ${day}`}
                    </Text>
                    <Text style={styles.dayMeta}>
                      {copy(
                        zh,
                        "\u5929\u6c14\u3001\u9884\u8ba2\u548c\u8def\u7ebf\u4fe1\u606f\u4f1a\u96c6\u4e2d\u5c55\u793a\u3002",
                        "Weather widgets, booking details, and route-aware nodes.",
                      )}
                    </Text>
                  </View>
                  <Pressable onPress={() => state.actions.setRearrangeDay(rearranging ? null : day)}>
                    <Text style={styles.dayAction}>
                      {rearranging ? copy(zh, "\u4fdd\u5b58\u987a\u5e8f", "Save order") : copy(zh, "\u8c03\u6574\u987a\u5e8f", "Rearrange")}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.cardList}>
                  {stops.map((stop) => {
                    const destination = destinationsById[stop.destinationId];
                    if (!destination) {
                      return null;
                    }
                    const statusColor =
                      stop.status === "Confirmed"
                        ? theme.colors.success
                        : stop.status === "Action Required" || stop.status === "Delayed"
                          ? theme.colors.warning
                          : theme.colors.accent;

                    return (
                      <Pressable
                        key={stop.id}
                        onLongPress={() => state.actions.setRearrangeDay(day)}
                        style={[
                          styles.stopCard,
                          {
                            backgroundColor: rearranging ? theme.colors.accentSoft : theme.colors.surface,
                            borderColor: theme.colors.border,
                            shadowColor: theme.colors.shadow,
                          },
                        ]}
                      >
                        <PoiImageBackground
                          title={destination.title}
                          city={destination.city}
                          fallbackImage={destination.image}
                          style={styles.stopImage}
                          imageStyle={{ borderRadius: 22 }}
                        >
                          <View style={styles.stopImageShade}>
                            <Text style={styles.stopImageKicker}>{placeText(state.locale, destination.city).toUpperCase()}</Text>
                            <Text style={styles.stopImageTitle}>{destination.category}</Text>
                          </View>
                        </PoiImageBackground>
                        <View style={[styles.stopAccentRail, { backgroundColor: statusColor }]} />
                        <View style={[styles.stopGhostCircle, { borderColor: rearranging ? theme.colors.accent : theme.colors.border }]} />
                        <View style={styles.stopTop}>
                          <View style={styles.stopCopy}>
                            <Text style={[styles.stopTime, { color: theme.colors.subtext }]}>{stop.time}</Text>
                            <Text style={[styles.stopTitle, { color: theme.colors.text }]}>{placeText(state.locale, destination.title)}</Text>
                            <Text style={[styles.confirmLine, { color: theme.colors.subtext }]}>
                              {copy(zh, "\u786e\u8ba4\u53f7", "Confirmation")} \u00b7 ET{stop.id.slice(-1)}82 \u00b7 {destination.address}
                            </Text>
                          </View>
                          <View style={[styles.statusTag, { backgroundColor: `${statusColor}22` }]}>
                            <Text style={{ color: statusColor, fontWeight: "800", fontSize: 12 }}>{textFor(state.locale, stop.status)}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <Pill label={stopTypeLabel(state.locale, stop.type)} />
                          {stop.weather ? <Pill label={stop.weather} /> : null}
                          <Pill label={`${destination.distanceKm} km`} />
                        </View>

                        <Text style={[styles.stopNote, { color: theme.colors.subtext }]}>{stop.note}</Text>

                        {editTimes ? (
                          <View style={styles.timeEditRow}>
                            <Pressable
                              onPress={() => state.actions.updateStopTime(activeTrip.id, stop.id, shiftTime(stop.time, -30))}
                              style={[styles.timeButton, { borderColor: theme.colors.border }]}
                            >
                              <Text style={[styles.timeButtonText, { color: theme.colors.text }]}>-30m</Text>
                            </Pressable>
                            <Text style={[styles.timeEditValue, { color: theme.colors.accent }]}>{stop.time}</Text>
                            <Pressable
                              onPress={() => state.actions.updateStopTime(activeTrip.id, stop.id, shiftTime(stop.time, 30))}
                              style={[styles.timeButton, { borderColor: theme.colors.border }]}
                            >
                              <Text style={[styles.timeButtonText, { color: theme.colors.text }]}>+30m</Text>
                            </Pressable>
                          </View>
                        ) : null}

                        {rearranging ? (
                          <View style={styles.rearrangeRow}>
                            <Pressable
                              onPress={() => state.actions.moveStop(activeTrip.id, stop.id, "up")}
                              style={[styles.arrowButton, { borderColor: theme.colors.border }]}
                            >
                              <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
                                {copy(zh, "\u4e0a\u79fb", "UP")}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => state.actions.moveStop(activeTrip.id, stop.id, "down")}
                              style={[styles.arrowButton, { borderColor: theme.colors.border }]}
                            >
                              <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
                                {copy(zh, "\u4e0b\u79fb", "DN")}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => state.actions.deleteStop(activeTrip.id, stop.id)}
                              style={[styles.deleteButton, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}14` }]}
                            >
                              <Text style={[styles.deleteButtonText, { color: theme.colors.danger }]}>
                                {copy(zh, "\u5220\u9664", "Delete")}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <SectionTitle
        title={copy(zh, "\u51c6\u5907\u4e0e\u8d44\u6e90", "Preparation & Resources")}
        hint={copy(zh, "\u51fa\u53d1\u5468\u652f\u6301", "Week-of-trip support")}
      />
      <View style={[styles.innerPad, styles.supportStack]}>
        <SoftCard>
          <Text style={[styles.noteLead, { color: theme.colors.text }]}>
            {copy(zh, "\u6e05\u5355\u6a21\u5757", "Checklist module")}
          </Text>
          <Text style={[styles.noteBody, { color: theme.colors.subtext }]}>
            {copy(
              zh,
              "\u7b7e\u8bc1\u3001\u62a4\u7167\u3001\u4fdd\u9669\u3001\u884c\u674e\u548c\u5f53\u5730\u4ea4\u901a\u4f1a\u6309\u51fa\u53d1\u65e5\u671f\u4e0e\u76ee\u7684\u5730\u7c7b\u578b\u6392\u5e8f\u3002",
              "Visa, passport, insurance, packing, and local transit items are prioritized by departure date and destination type.",
            )}
          </Text>
          <View style={styles.inlineActions}>
            <Pill label={copy(zh, "\u62a4\u7167\u63d0\u9192", "Passport reminder")} />
            <Pill label={copy(zh, "\u884c\u674e\u6e05\u5355", "Packing list")} />
            <Pill label={copy(zh, "\u65c5\u884c\u4fdd\u9669", "Travel insurance")} />
          </View>
        </SoftCard>
        <SoftCard>
          <Text style={[styles.noteLead, { color: theme.colors.text }]}>
            {copy(zh, "\u5ba2\u670d\u652f\u6301", "Customer support")}
          </Text>
          <Text style={[styles.noteBody, { color: theme.colors.subtext }]}>
            {copy(
              zh,
              "\u822a\u7a7a\u3001\u9152\u5e97\u3001FAQ \u548c\u5e94\u7528\u5185\u5ba2\u670d\u5165\u53e3\u4f1a\u9760\u8fd1\u884c\u7a0b\u5c55\u793a\uff0c\u65b9\u4fbf\u7d27\u6025\u72b6\u6001\u4e0b\u4f7f\u7528\u3002",
              "Airline, hotel, FAQ, and in-app support access remain close to the itinerary for high-stress states.",
            )}
          </Text>
        </SoftCard>
      </View>
      <Modal transparent visible={deleteOpen} animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
              {copy(zh, "\u5220\u9664\u5f53\u524d\u884c\u7a0b\uff1f", "Delete current itinerary?")}
            </Text>
            <Text style={[styles.confirmBody, { color: theme.colors.subtext }]}>
              {copy(zh, "\u5220\u9664\u540e\u4f1a\u5207\u6362\u5230\u4e0b\u4e00\u4e2a\u884c\u7a0b\uff0c\u4f46\u4e0d\u4f1a\u5220\u9664\u4f60\u6536\u85cf\u7684\u666f\u70b9\u3002", "After deletion, Eslay will switch to the next itinerary. Saved destinations will stay untouched.")}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setDeleteOpen(false)} style={[styles.confirmButton, { borderColor: theme.colors.border }]}>
                <Text style={[styles.confirmSecondaryText, { color: theme.colors.text }]}>{copy(zh, "\u53d6\u6d88", "Cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDeleteOpen(false);
                  state.actions.deleteTrip(activeTrip.id);
                }}
                style={[styles.confirmButton, { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger }]}
              >
                <Text style={styles.confirmPrimaryText}>{copy(zh, "\u786e\u8ba4\u5220\u9664", "Delete")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  innerPad: { marginHorizontal: spacing.md },
  headerOrbit: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 1,
    right: -42,
    top: -46,
    opacity: 0.66,
  },
  headerSignal: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    right: 32,
    top: 28,
  },
  noteLead: { fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  noteBody: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  inlineActions: { marginTop: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  actionChip: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  actionChipText: { fontSize: 12, fontWeight: "800" },
  noticeBar: { marginTop: spacing.md, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  noticeText: { fontSize: 12, lineHeight: 17, fontWeight: "800" },
  daySelector: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  emptyText: { fontSize: 14, lineHeight: 20 },
  timelineWrap: { gap: spacing.lg },
  dayWrap: { flexDirection: "row", gap: spacing.md },
  lineColumn: { width: 20, alignItems: "center" },
  dayDot: { width: 14, height: 14, borderRadius: 7, marginTop: 8 },
  dayLine: { flex: 1, width: 2, marginTop: 6 },
  dayContent: { flex: 1, gap: spacing.sm },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  dayHeaderBeam: {
    position: "absolute",
    width: 92,
    height: 5,
    right: -18,
    top: 18,
    borderRadius: 4,
    transform: [{ rotate: "-16deg" }],
  },
  dayHeaderCopy: { flex: 1 },
  dayTitle: { color: "#FFF7EC", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  dayMeta: { color: "#FFD9C2", fontSize: 13, marginTop: 4, lineHeight: 18, fontWeight: "700" },
  dayAction: { color: "#FFB98E", fontWeight: "900", fontSize: 12 },
  cardList: { gap: spacing.sm },
  stopCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: spacing.sm,
    overflow: "hidden",
    position: "relative",
  },
  stopImage: {
    height: 138,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 2,
  },
  stopImageShade: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
    backgroundColor: "rgba(8, 20, 24, 0.24)",
  },
  stopImageKicker: {
    color: "#FFB98E",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  stopImageTitle: {
    color: "#FFF7EC",
    marginTop: 4,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  stopAccentRail: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 5,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  stopGhostCircle: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    right: -36,
    bottom: -42,
    opacity: 0.5,
  },
  stopTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  stopCopy: { flex: 1 },
  stopTime: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  stopTitle: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  confirmLine: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  statusTag: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 8, alignSelf: "flex-start" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  stopNote: { fontSize: 14, lineHeight: 20 },
  timeEditRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeButton: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  timeButtonText: { fontSize: 12, fontWeight: "900" },
  timeEditValue: { minWidth: 58, textAlign: "center", fontSize: 16, fontWeight: "900" },
  rearrangeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  arrowButton: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  deleteButton: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  deleteButtonText: { fontWeight: "800" },
  deleteChip: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  deleteChipText: { fontSize: 12, fontWeight: "800" },
  supportStack: { gap: spacing.sm },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(2, 12, 16, 0.42)",
  },
  confirmSheet: {
    borderWidth: 1,
    borderRadius: 30,
    padding: spacing.lg,
  },
  confirmTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  confirmBody: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  confirmActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmSecondaryText: { fontSize: 13, fontWeight: "900" },
  confirmPrimaryText: { color: "#FFF7EC", fontSize: 13, fontWeight: "900" },
});
