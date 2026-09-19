// Store a small raster with the design so saved overlays do not rely on hotlinks.
export async function prepareBoardLogo(file: Blob): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("Choose a PNG, JPG or WebP logo, up to 2 MB.");
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 320 / image.width, 160 / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare this logo.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    image.close();
  }
}
