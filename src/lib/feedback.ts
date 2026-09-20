export function parseFeedback(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid feedback");
  const input = value as Record<string, unknown>;
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (
    !["idea", "problem", "other"].includes(String(input.category)) ||
    message.length < 10 ||
    message.length > 2000
  )
    throw new Error("Invalid feedback");
  const path =
    typeof input.page_path === "string" ? input.page_path.split(/[?#]/)[0] : "";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 200)
    throw new Error("Invalid path");
  return {
    category: input.category as "idea" | "problem" | "other",
    message,
    page_path: path,
  };
}
