import { it, expect, vi } from "vitest";
import { stopMedia, cameraError } from "../studio-media";
it("releases every camera track on stop/unmount", () => {
  const a = { stop: vi.fn() },
    b = { stop: vi.fn() };
  stopMedia({ getTracks: () => [a, b] } as unknown as MediaStream);
  expect(a.stop).toHaveBeenCalledOnce();
  expect(b.stop).toHaveBeenCalledOnce();
  expect(() => stopMedia(null)).not.toThrow();
});
it("explains permission, missing camera and busy-camera failures", () => {
  expect(cameraError({ name: "NotAllowedError" })).toContain("blocked");
  expect(cameraError({ name: "NotFoundError" })).toContain("unavailable");
  expect(cameraError({ name: "NotReadableError" })).toContain("busy");
});
