"use client";
import { useTranslations } from "next-intl";

/**
 * Traduz um código de erro da API (ver `src/lib/api-errors.ts`).
 *
 * Um código desconhecido — versão nova do servidor, resposta sem `error`,
 * falha de rede — cai no `fallback` do sítio, ou na mensagem genérica. Nunca
 * se mostra o código cru: `match_not_found` no ecrã não diz nada a ninguém.
 */
export function useApiErrorMessage() {
  const t = useTranslations("errors");
  return (code: unknown, fallback?: string) =>
    typeof code === "string" && t.has(code)
      ? t(code)
      : (fallback ?? t("unknown"));
}
