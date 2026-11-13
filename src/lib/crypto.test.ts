import { describe, expect, it } from "vitest";
import { isSealed, seal, unseal } from "./crypto";

describe("sync encryption", () => {
  it("round-trips, rejects a wrong passphrase, passes plain text through", async () => {
    const env = await seal('{"hello":"film"}', "correct horse");
    expect(isSealed(env)).toBe(true);
    expect(env).not.toContain("hello");
    expect(await unseal(env, "correct horse")).toBe('{"hello":"film"}');
    await expect(unseal(env, "wrong")).rejects.toThrow(/doesn't match/);
    await expect(unseal(env, null)).rejects.toThrow(/encrypted/);
    expect(await unseal('{"plain":1}', null)).toBe('{"plain":1}');
  });
});
