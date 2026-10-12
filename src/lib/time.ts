export const dateInput = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const taipeiISO = (date: string, time: string) =>
  `${date}T${time}:00+08:00`;
export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
export const formatTime = (value: string) =>
  new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
export function validateSlot(
  date: string,
  start: string,
  end: string,
  now = new Date(),
  reservation = false,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(start) ||
    !/^\d{2}:\d{2}$/.test(end)
  )
    return "請填寫完整日期與起迄時間。";
  const begins = new Date(taipeiISO(date, start));
  const finishes = new Date(taipeiISO(date, end));
  const minutes = (finishes.getTime() - begins.getTime()) / 60_000;
  if (Number.isFinite(begins.getTime()) && dateInput(begins) !== date)
    return "請填寫有效日期。";
  if (!Number.isFinite(minutes) || minutes <= 0)
    return "結束時間必須晚於開始時間。";
  if (start < "08:00" || end > "22:00") return "教室開放時間為 08:00–22:00。";
  if (reservation && (minutes < 30 || minutes > 480))
    return "每次借用需介於 30 分鐘至 8 小時。";
  if (reservation && begins.getTime() < now.getTime() - 300_000)
    return "開始時間已過，請重新選擇時段。";
  if (reservation && begins.getTime() > now.getTime() + 90 * 86_400_000)
    return "最多可預約未來 90 天的教室。";
  return "";
}
export function weekDates(date: string) {
  const anchor = new Date(`${date}T12:00:00+08:00`);
  const weekday = (anchor.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) =>
    dateInput(new Date(anchor.getTime() + (index - weekday) * 86_400_000)),
  );
}
export function addDays(date: string, days: number) {
  return dateInput(
    new Date(new Date(`${date}T12:00:00+08:00`).getTime() + days * 86_400_000),
  );
}
