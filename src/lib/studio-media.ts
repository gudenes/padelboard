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
