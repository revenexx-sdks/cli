import { describe, it, expect, afterEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import Client, { RevenexxException } from "../lib/client.js";

/**
 * Transport-resilience behavior (DX-103), exercised end-to-end through the
 * public `call()` API against a throwaway loopback HTTP server. No mocking of
 * fetch/undici — we assert on real timeouts, retries, and captured headers.
 */

type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => void;

let server: http.Server | undefined;

const startServer = async (handler: Handler): Promise<string> => {
  server = http.createServer(handler);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const { port } = server!.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
};

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
});

describe("Client transport resilience", () => {
  it("aborts a slow request and reports a clear timeout error", async () => {
    // Server never responds within the client's timeout window.
    const timers: NodeJS.Timeout[] = [];
    const endpoint = await startServer((_req, res) => {
      timers.push(setTimeout(() => res.end("{}"), 1_000));
    });
    const client = new Client().setEndpoint(endpoint).setTimeout(80);

    await expect(client.call("GET", "/slow")).rejects.toThrow(/timed out/i);
    timers.forEach(clearTimeout);
  });

  it("retries an idempotent GET on 503 and honors Retry-After", async () => {
    let hits = 0;
    const endpoint = await startServer((_req, res) => {
      hits++;
      if (hits < 3) {
        res.writeHead(503, { "retry-after": "0", "x-request-id": "req-503" });
        res.end("{}");
        return;
      }
      res.writeHead(200, {
        "content-type": "application/json",
        "x-request-id": "req-ok",
      });
      res.end(JSON.stringify({ ok: true }));
    });

    const client = new Client().setEndpoint(endpoint);
    const result = await client.call<{ ok: boolean }>("GET", "/flaky");

    expect(result.ok).toBe(true);
    expect(hits).toBe(3); // two 503s, then success
  });

  it("does not retry a non-idempotent POST", async () => {
    let hits = 0;
    const endpoint = await startServer((_req, res) => {
      hits++;
      res.writeHead(503, { "retry-after": "0" });
      res.end(JSON.stringify({ message: "unavailable", code: 503 }));
    });

    const client = new Client().setEndpoint(endpoint);
    await expect(client.call("POST", "/create", {}, {})).rejects.toThrow(
      RevenexxException,
    );
    expect(hits).toBe(1); // POST is attempted exactly once
  });

  it("gives up after the retry budget and surfaces the last error", async () => {
    let hits = 0;
    const endpoint = await startServer((_req, res) => {
      hits++;
      res.writeHead(503, { "retry-after": "0" });
      res.end(JSON.stringify({ message: "still down", code: 503 }));
    });

    const client = new Client().setEndpoint(endpoint);
    await expect(client.call("GET", "/down")).rejects.toThrow(
      RevenexxException,
    );
    expect(hits).toBe(4); // initial attempt + 3 retries
  });

  it("--no-retry disables retries for idempotent requests", async () => {
    let hits = 0;
    const endpoint = await startServer((_req, res) => {
      hits++;
      res.writeHead(503, { "retry-after": "0" });
      res.end(JSON.stringify({ message: "down", code: 503 }));
    });

    const client = new Client().setEndpoint(endpoint).setRetry(false);
    await expect(client.call("GET", "/down")).rejects.toThrow(
      RevenexxException,
    );
    expect(hits).toBe(1);
  });

  it("captures the gateway x-request-id on a failed request", async () => {
    const endpoint = await startServer((_req, res) => {
      res.writeHead(400, {
        "content-type": "application/json",
        "x-request-id": "corr-abc-123",
      });
      res.end(JSON.stringify({ message: "bad request", code: 400 }));
    });

    const client = new Client().setEndpoint(endpoint);
    try {
      await client.call("GET", "/bad");
      throw new Error("expected the request to reject");
    } catch (err) {
      expect(err).toBeInstanceOf(RevenexxException);
      expect((err as RevenexxException).requestId).toBe("corr-abc-123");
    }
  });
});
