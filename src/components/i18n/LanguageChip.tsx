"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";

export function LanguageChip() {
  const t = useTranslations("common");
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>(".pb-lang-list button.is-active")
      ?.focus();
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    // Fire-and-forget: sem sessão devolve 401 e não há nada a fazer. A troca
    // de língua nunca espera por isto — o cookie e a navegação é que contam.
    void fetch("/api/profile/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
    // O pathname do next-intl vem sem prefixo, por isso a página é preservada:
    // /it/help -> /pt/help, e não /pt.
    router.replace(pathname, { locale: next });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>(".pb-lang-chip")?.focus();
      return;
    }
    if (!open) return;

    const items = [
      ...(root.current?.querySelectorAll<HTMLButtonElement>(
        ".pb-lang-list button",
      ) ?? []),
    ];
    if (!items.length) return;

    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      e.key === "ArrowDown"
        ? (at + 1) % items.length
        : e.key === "ArrowUp"
          ? (at - 1 + items.length) % items.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : -1;

    if (to === -1) return;
    e.preventDefault();
    items[to].focus();
  }

  return (
    <div className="pb-lang" ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="pb-lang-chip"
        aria-label={t("languageAria")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="pb-lang-list"
        onClick={() => setOpen((v) => !v)}
      >
        {active.toUpperCase()}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="pb-lang-list" id="pb-lang-list" role="listbox">
          {locales.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                role="option"
                aria-selected={locale === active}
                className={locale === active ? "is-active" : undefined}
                onClick={() => choose(locale)}
              >
                <span lang={locale}>{localeNames[locale]}</span>
                <span aria-hidden="true">{locale.toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
