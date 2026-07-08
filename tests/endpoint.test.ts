import { describe, it, expect } from "vitest";
import Client, { RevenexxException } from "../lib/client.js";

describe("Client.setEndpoint cleartext guard", () => {
  it("accepts https:// endpoints", () => {
    expect(() =>
      new Client().setEndpoint("https://api.revenexx.com/v1"),
    ).not.toThrow();
  });

  it("allows cleartext http:// for loopback hosts (local dev)", () => {
    for (const endpoint of [
      "http://localhost/v1",
      "http://localhost:8080/v1",
      "http://127.0.0.1/v1",
      "http://[::1]:9000/v1",
    ]) {
      expect(() => new Client().setEndpoint(endpoint)).not.toThrow();
    }
  });

  it("refuses cleartext http:// to a remote host", () => {
    expect(() =>
      new Client().setEndpoint("http://api.revenexx.com/v1"),
    ).toThrow(RevenexxException);
    expect(() => new Client().setEndpoint("http://192.168.1.10/v1")).toThrow(
      /cleartext/i,
    );
    expect(() =>
      new Client().setEndpoint("http://127.0.0.1.evil.com/v1"),
    ).toThrow(/cleartext/i);
  });

  it("allows cleartext http:// when REVENEXX_ALLOW_CLEARTEXT=1", () => {
    const prev = process.env.REVENEXX_ALLOW_CLEARTEXT;
    process.env.REVENEXX_ALLOW_CLEARTEXT = "1";
    try {
      expect(() =>
        new Client().setEndpoint("http://api.revenexx.com/v1"),
      ).not.toThrow();
    } finally {
      if (prev === undefined) {
        delete process.env.REVENEXX_ALLOW_CLEARTEXT;
      } else {
        process.env.REVENEXX_ALLOW_CLEARTEXT = prev;
      }
    }
  });

  it("rejects malformed and non-http(s) URLs", () => {
    expect(() => new Client().setEndpoint("not-a-url")).toThrow(
      RevenexxException,
    );
    expect(() => new Client().setEndpoint("ftp://example.com")).toThrow(
      RevenexxException,
    );
  });
});
