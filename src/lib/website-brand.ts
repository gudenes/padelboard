import { lookup, resolve4 } from "node:dns/promises";
import { request } from "node:https";
import { logoDataUrl, websiteUrl } from "./ai-board-design";

// Pin a checked public IPv4 address to the TLS connection, including redirects.
// This prevents a supplied domain from reaching local services or rebinding DNS.
export function isPublicAddress(address: string) {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  )
    return false;
  const [a, b, c] = octets;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 &&
      (b === 168 || b === 0 || (b === 88 && c === 99) || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

export function extractBrand(html: string) {
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join(" ");
  const tokens = [
    ...styles.matchAll(
      /--(?:e-global-color|ast-global-color|primary|secondary|accent|brand)[\w-]*\s*:\s*(#[\da-f]{3,8})\b/gi,
    ),
  ].map((m) => m[0]);
  const text = html
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Math.min(Number(n), 0x10ffff)),
    )
    .replace(/&(?:nbsp|amp|quot|lt|gt);/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000);
  return { text, colors: [...new Set(tokens)].slice(0, 24) };
}

export function findBrandLogo(html: string): string | undefined {
  // Some site builders render the main logo as a CSS background image.
  const backgrounds = [
    ...html.matchAll(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi),
  ].map((m) => m[1]);
  const backgroundLogo = backgrounds.find(
    (url) => /logo/i.test(url) && !/gdpr|cookie|plugin/i.test(url),
  );
  if (backgroundLogo) return backgroundLogo.replace(/&amp;/g, "&");
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const candidate = images.find(
    (tag) => /logo/i.test(tag) && !/gdpr|cookie|plugin/i.test(tag),
  );
  return candidate
    ?.match(/\bsrc=["']([^"']+)["']/i)?.[1]
    ?.replace(/&amp;/g, "&");
}

// Workers cannot pin a Node HTTPS socket or call dns.lookup. Its fetch only
// reaches public networks; validate DNS and every redirect as an extra guard.
async function readWorkerAsset(initial: URL, kind: "html" | "logo", signal: AbortSignal) {
  let url = initial;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const addresses = await resolve4(url.hostname);
    if (!addresses.length || addresses.some(address => !isPublicAddress(address))) throw new Error("private_address");
    const res = await fetch(url, {redirect: "manual", signal, headers: {
      "User-Agent": "Padelboard/1.0 (brand preview)",
      Accept: kind === "html" ? "text/html" : "image/png,image/jpeg,image/webp",
    }});
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel();
      url = websiteUrl(new URL(res.headers.get("location")!, url).href);
      continue;
    }
    const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (res.status !== 200 || !(kind === "html" ? mime === "text/html" : ["image/png","image/jpeg","image/webp"].includes(mime))) {
      await res.body?.cancel(); throw new Error("unavailable");
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("unavailable");
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > (kind === "html" ? 1_000_000 : 250_000)) throw new Error("too_large");
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel(); }
    return {url: url.href, bytes: Buffer.concat(chunks), mime};
  }
  throw new Error("redirect_limit");
}

async function readPublicAsset(
  initial: URL,
  kind: "html" | "logo",
  signal: AbortSignal,
) {
  if (process.env.CLOUDFLARE_WORKER === "1") return readWorkerAsset(initial, kind, signal);
  let url = initial;
  for (let redirect = 0; redirect <= 3; redirect++) {
    const addresses = await Promise.race([
      lookup(url.hostname, { family: 4, all: true }),
      new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new Error("timeout"));
        else
          signal.addEventListener("abort", () => reject(new Error("timeout")), {
            once: true,
          });
      }),
    ]);
    if (
      !addresses.length ||
      addresses.some(({ address }) => !isPublicAddress(address))
    )
      throw new Error("private_address");
    const response = await new Promise<{
      location?: string;
      bytes: Buffer;
      mime: string;
    }>((resolve, reject) => {
      const req = request(
        url,
        {
          signal,
          family: 4,
          headers: {
            "User-Agent": "Padelboard/1.0 (brand preview)",
            Accept:
              kind === "html" ? "text/html" : "image/png,image/jpeg,image/webp",
            "Accept-Encoding": "identity",
          },
          lookup: (_host, _options, callback) =>
            callback(null, addresses[0].address, 4),
        },
        (res) => {
          const status = res.statusCode ?? 0;
          const mime = (res.headers["content-type"] ?? "").split(";")[0].trim();
          if (status >= 300 && status < 400 && res.headers.location) {
            resolve({
              location: res.headers.location,
              bytes: Buffer.alloc(0),
              mime,
            });
            res.destroy();
            return;
          }
          if (
            status !== 200 ||
            !(kind === "html"
              ? mime === "text/html"
              : ["image/png", "image/jpeg", "image/webp"].includes(mime))
          ) {
            reject(new Error("unavailable"));
            res.destroy();
            return;
          }
          let size = 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > (kind === "html" ? 1_000_000 : 250_000))
              res.destroy(new Error("too_large"));
            else chunks.push(chunk);
          });
          res.on("error", reject);
          res.on("end", () => resolve({ bytes: Buffer.concat(chunks), mime }));
        },
      );
      req.on("error", reject);
      req.end();
    });
    if (response.location) {
      url = websiteUrl(new URL(response.location, url).href);
      continue;
    }
    return { url: url.href, ...response };
  }
  throw new Error("redirect_limit");
}

export async function readWebsiteBrand(initial: URL): Promise<{
  url: string;
  text: string;
  colors: string[];
  logo?: string;
} | null> {
  const signal = AbortSignal.timeout(8000);
  try {
    const page = await readPublicAsset(initial, "html", signal);
    const html = page.bytes.toString("utf8");
    const brand = extractBrand(html);
    if (brand.text.length < 100) return null;
    let logo: string | undefined;
    const candidate = findBrandLogo(html);
    if (candidate) {
      try {
        const asset = await readPublicAsset(
          websiteUrl(new URL(candidate, page.url).href),
          "logo",
          signal,
        );
        logo = logoDataUrl(
          `data:${asset.mime};base64,${asset.bytes.toString("base64")}`,
        );
      } catch {
        /* A missing logo must not prevent a content-based design. */
      }
    }
    return { url: page.url, ...brand, ...(logo ? { logo } : {}) };
  } catch {
    return null;
  }
}
