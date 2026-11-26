/** Reminder offsets offered in the UI (days before the event). Backend accepts 0..30. */
export const REMINDER_OPTIONS = [0, 1, 3, 7];

export function reminderLabel(daysBefore: number): string {
  return daysBefore === 0 ? 'Đúng ngày' : `Trước ${daysBefore} ngày`;
}
