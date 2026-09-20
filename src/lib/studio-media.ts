export function stopMedia(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
export function cameraError(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow it in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "That camera is unavailable. Connect a camera or choose another one.";
  if (name === "NotReadableError")
    return "The camera is busy. Close other apps using it, then try again.";
  return "Could not start the camera. Try again in Chrome or Edge over HTTPS (or localhost).";
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
export function screenError(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "AbortError")
    return "Screen sharing was cancelled or blocked. Choose a screen, window or tab to try again.";
  if (name === "NotReadableError")
    return "Couldn’t read that screen. Check your system’s screen-recording permission for this browser and try again.";
  return "Screen sharing isn’t available here. Open Studio in a desktop browser that supports screen sharing, such as Chrome or Edge.";
}
