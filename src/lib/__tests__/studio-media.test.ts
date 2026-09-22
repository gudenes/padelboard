import { it, expect, vi } from "vitest";
import { stopMedia, cameraError, type StudioMediaError } from "../studio-media";
import en from "@/messages/en.json";
it("releases every camera track on stop/unmount", () => {
  const a = { stop: vi.fn() },
    b = { stop: vi.fn() };
  stopMedia({ getTracks: () => [a, b] } as unknown as MediaStream);
  expect(a.stop).toHaveBeenCalledOnce();
  expect(b.stop).toHaveBeenCalledOnce();
  expect(() => stopMedia(null)).not.toThrow();
});
it("explains permission, missing camera and busy-camera failures", () => {
  expect(cameraError({ name: "NotAllowedError" })).toBe("cameraBlocked");
  expect(cameraError({ name: "NotFoundError" })).toBe("cameraUnavailable");
  expect(cameraError({ name: "NotReadableError" })).toBe("cameraBusy");
  expect(cameraError({})).toBe("cameraFailed");
});
it("cada código de captura tem mensagem em en.json", () => {
  const codes: StudioMediaError[] = [
    "cameraBlocked",
    "cameraUnavailable",
    "cameraBusy",
    "cameraFailed",
    "screenCancelled",
    "screenUnreadable",
    "screenUnsupported",
  ];
  expect(codes.filter((code) => !(code in en.studio))).toEqual([]);
});

import { captureStudioSource, screenError } from "../studio-media";
it("requests screen video only without requesting a camera", async () => {
  const getDisplayMedia = vi.fn().mockResolvedValue("screen"),
    getUserMedia = vi.fn();
  expect(
    await captureStudioSource(
      { getDisplayMedia, getUserMedia } as unknown as MediaDevices,
      "screen",
    ),
  ).toBe("screen");
  expect(getDisplayMedia).toHaveBeenCalledWith({ video: true, audio: false });
  expect(getUserMedia).not.toHaveBeenCalled();
});
it("keeps explicit camera constraints for camera mode", async () => {
  const getUserMedia = vi.fn().mockResolvedValue("camera");
  await captureStudioSource(
    { getUserMedia } as unknown as MediaDevices,
    "camera",
    "usb",
  );
  expect(getUserMedia).toHaveBeenCalledWith({
    video: {
      deviceId: { exact: "usb" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });
});
it("handles unavailable screen capture and cancelled sharing", async () => {
  await expect(captureStudioSource(undefined, "screen")).rejects.toThrow(
    "screen-unsupported",
  );
  expect(screenError({ name: "NotAllowedError" })).toBe("screenCancelled");
  expect(screenError({ name: "NotReadableError" })).toBe("screenUnreadable");
  expect(screenError({})).toBe("screenUnsupported");
});
