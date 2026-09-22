import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/lib/api-errors";
import en from "@/messages/en.json";

describe("códigos de erro", () => {
  // `unknown` no meio porque en.json tem namespaces aninhados (wizard.accent).
  const messages =
    (en as unknown as Record<string, Record<string, string>>).errors ?? {};

  it("cada código tem uma mensagem em en.json", () => {
    const missing = API_ERROR_CODES.filter((code) => !(code in messages));
    expect(missing).toEqual([]);
  });

  it("não há mensagens órfãs sem código", () => {
    const extra = Object.keys(messages).filter(
      (key) => !(API_ERROR_CODES as readonly string[]).includes(key),
    );
    expect(extra).toEqual([]);
  });
});
