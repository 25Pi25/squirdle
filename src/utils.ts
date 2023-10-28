export function getCookie(cookieName: string, isDaily = false): string {
  cookieName = (isDaily ? "d_" : "") + cookieName;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (cookieName == name) return value;
  }
  return "";
}

export function setCookie(cookieName: string, cookieValue: string, expireDays = 1, isDaily = false, streak = false) {
  cookieName = (isDaily ? "d_" : "") + cookieName;
  const d = new Date();
  if (isDaily || streak) d.setHours(23, 59, 59, 0);
  if (streak) d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
  else if (!isDaily) d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
  document.cookie = `${cookieName}=${cookieValue};expires=${d.toUTCString()};path=/;samesite=strict`;
}

export function getLocalDateDay(): string {
  const date = new Date();
  const localOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - localOffsetMs).toISOString().split("T")[0];
}