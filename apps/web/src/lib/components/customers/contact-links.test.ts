import { describe, expect, it } from "vitest";
import { mailtoHref, telHref } from "./contact-links";

describe("mailtoHref", () => {
  it("links a plain address as it is", () => {
    expect(mailtoHref("ada@example.com")).toBe("mailto:ada@example.com");
    expect(mailtoHref("ada.lovelace-1_x@mail.example.co.uk")).toBe("mailto:ada.lovelace-1_x@mail.example.co.uk");
  });

  it("cannot add headers or a body", () => {
    const href = mailtoHref("ada@example.com?cc=eve@evil.test&body=hi");
    expect(href).toBe("mailto:ada@example.com%3Fcc%3Deve@evil.test%26body%3Dhi");
    const url = new URL(href);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  });

  it("encodes a plus, a space and a hash", () => {
    expect(mailtoHref("ada+tag@example.com")).toBe("mailto:ada%2Btag@example.com");
    expect(mailtoHref("a b#c@example.com")).toBe("mailto:a%20b%23c@example.com");
  });
});

describe("telHref", () => {
  it("keeps a plus, digits and dashes", () => {
    expect(telHref("+1-555-010-0000")).toBe("tel:+1-555-010-0000");
    expect(telHref("+1 (555) 010 0000")).toBe("tel:+15550100000");
  });

  it("drops everything else", () => {
    expect(telHref("555;phone-context=evil?x=1#y")).toBe("tel:555-1");
    expect(telHref("call me")).toBe("tel:");
  });
});
