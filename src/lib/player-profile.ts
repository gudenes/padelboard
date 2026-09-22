import { locales } from "@/i18n/routing";

export const AVATAR_COLORS = [
  "#f5ff36",
  "#ff95c7",
  "#9af0ce",
  "#99caff",
] as const;
export const AVATAR_STYLES = ["headband", "cap", "sunny"] as const;
export function parsePlayerProfile(value: unknown) {
  const v = value as Record<string, unknown> | null;
  if (
    !v ||
    typeof v.name !== "string" ||
    !v.name.trim() ||
    v.name.trim().length > 60
  )
    throw new Error("Add your name (up to 60 characters).");
  if (!["player", "club", "organizer", "federation"].includes(String(v.role)))
    throw new Error("Choose how you use Padelboard.");
  if (typeof v.club !== "string" || v.club.length > 80)
    throw new Error("Club name must be under 80 characters.");
  if (
    !AVATAR_COLORS.includes(v.color as (typeof AVATAR_COLORS)[number]) ||
    !AVATAR_STYLES.includes(v.style as (typeof AVATAR_STYLES)[number])
  )
    throw new Error("Choose a valid avatar.");
  return {
    name: v.name.trim(),
    role: String(v.role),
    club: v.club.trim(),
    color: String(v.color),
    style: String(v.style),
    // Opcional de propósito: os perfis gravados antes do seletor não o têm,
    // e uma preferência de língua inválida não deve impedir guardar o perfil.
    locale: locales.includes(v.locale as (typeof locales)[number])
      ? (v.locale as string)
      : undefined,
  };
}
