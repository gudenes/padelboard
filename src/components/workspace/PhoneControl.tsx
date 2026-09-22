"use client";
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function PhoneControl({ code }: { code: string }) {
  const t = useTranslations("workspace");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  async function open() {
    const link = `${location.origin}/m/${encodeURIComponent(code)}/remote`;
    setUrl(link);
    setMessage("");
    setQr("");
    dialog.current?.showModal();
    try {
      const QRCode = await import("qrcode");
      setQr(
        await QRCode.toDataURL(link, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#11120f", light: "#ffffff" },
        }),
      );
    } catch {
      setMessage(t("phoneQrError"));
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t("phoneCopied"));
    } catch {
      setMessage(t("phoneCopyError"));
    }
  }
  return (
    <>
      <button
        type="button"
        className="pbw-phone-trigger"
        onClick={() => void open()}
      >
        {t("phoneTrigger")}
      </button>
      <dialog
        ref={dialog}
        className="pbw-destination pbw-phone-dialog"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          type="button"
          className="pbw-secondary pbw-destination-close"
          aria-label={t("phoneCloseAria")}
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <span className="pbw-hand">{t("phoneHand")}</span>
        <h2 id={titleId}>{t("phoneTitle")}</h2>
        <p>{t("phoneLead")}</p>
        {qr ? (
          <img
            className="pbw-phone-qr"
            src={qr}
            width={240}
            height={240}
            alt={t("phoneQrAlt", { code })}
          />
        ) : (
          <p role="status">{t("phoneQrLoading")}</p>
        )}
        <p>{t("phoneCapabilities")}</p>
        <p className="pbw-muted">{t("phoneNote")}</p>
        <label>
          {t("phoneLinkLabel")}
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <button
          type="button"
          className="pbw-primary"
          onClick={() => void copy()}
        >
          {t("phoneCopyLink")}
        </button>
        {message && <p role="status">{message}</p>}
      </dialog>
    </>
  );
}
