export const CHARACTER_COOKIE = "zjd-character";

export function saveCharacterChoice(characterId: string): void {
  document.cookie = `${CHARACTER_COOKIE}=${encodeURIComponent(characterId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readCharacterChoice(): string | null {
  const prefix = `${CHARACTER_COOKIE}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
