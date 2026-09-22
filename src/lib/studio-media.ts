/**
 * Códigos estáveis de falha de captura.
 *
 * Esta é uma função pura, sem acesso a hooks: não pode traduzir. Devolve o
 * PROBLEMA; quem tem `useTranslations` resolve a frase (`messages.studio`),
 * tal como `src/lib/api-errors.ts` faz para a API.
 */
export type StudioMediaError =
  | "cameraBlocked"
  | "cameraUnavailable"
  | "cameraBusy"
  | "cameraFailed"
  | "screenCancelled"
  | "screenUnreadable"
  | "screenUnsupported";

export function stopMedia(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
export function cameraError(error: unknown): StudioMediaError {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "cameraBlocked";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "cameraUnavailable";
  if (name === "NotReadableError") return "cameraBusy";
  return "cameraFailed";
}

export async function captureStudioSource(
  media: MediaDevices | undefined,
  source: "camera" | "screen",
  device = "",
) {
  if (source === "screen") {
    if (!media?.getDisplayMedia) throw new Error("screen-unsupported");
    return media.getDisplayMedia({ video: true, audio: false });
  }
  if (!media?.getUserMedia) throw new Error("camera-unsupported");
  return media.getUserMedia({
    video: device
      ? {
          deviceId: { exact: device },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      : { width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
}
export function screenError(error: unknown): StudioMediaError {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "AbortError")
    return "screenCancelled";
  if (name === "NotReadableError") return "screenUnreadable";
  return "screenUnsupported";
}
