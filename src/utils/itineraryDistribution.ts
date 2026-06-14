export type BalancedStopSlot = {
  day: number;
  position: number;
  daySize: number;
};

export const buildBalancedStopSlots = (stopCount: number, durationDays: number): BalancedStopSlot[] => {
  const days = Math.max(1, Math.floor(durationDays));
  const baseSize = Math.floor(stopCount / days);
  const extraStops = stopCount % days;
  const slots: BalancedStopSlot[] = [];

  for (let day = 1; day <= days; day += 1) {
    const daySize = baseSize + (day <= extraStops ? 1 : 0);
    for (let position = 0; position < daySize; position += 1) {
      slots.push({ day, position, daySize });
    }
  }

  return slots;
};
