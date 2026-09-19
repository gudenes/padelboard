"use client";
import { useId, useRef, useState } from "react";

export function PhoneControl({ code }: { code: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  async function open() {
    const link = `${location.origin}/m/${encodeURIComponent(code)}`;
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
      setMessage("QR unavailable. Copy the link to your phone instead.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied. Open it on your phone.");
    } catch {
      setMessage("Select and copy the link below.");
    }
  }
  return (
    <>
      <button
        type="button"
        className="pbw-phone-trigger"
        onClick={() => void open()}
      >
        Control from phone ↗
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
          aria-label="Close phone controls"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <span className="pbw-hand">YOUR PHONE. YOUR COURT.</span>
        <h2 id={titleId}>Tap from the sidelines.</h2>
        <p>
          Scan with your phone’s camera and sign in with the same account.
          You’ll open this match directly.
        </p>
        {qr ? (
          <img
            className="pbw-phone-qr"
            src={qr}
            width={240}
            height={240}
            alt={`QR code to control match ${code}`}
          />
        ) : (
          <p role="status">Preparing your QR code…</p>
        )}
        <p>
          Score points, undo, choose the server, pause the clock, show or hide
          the scoreboard and time, and finish the match.
        </p>
        <p className="pbw-muted">
          Keep Studio or OBS running on your streaming computer. Changes from
          your phone sync live. This link requires your account; it does not
          grant access to anyone else.
        </p>
        <label>
          Match control link
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <button
          type="button"
          className="pbw-primary"
          onClick={() => void copy()}
        >
          Copy phone link
        </button>
        {message && <p role="status">{message}</p>}
      </dialog>
    </>
  );
}
