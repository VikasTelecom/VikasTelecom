import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("fetchProducts pricing", () => {
  beforeEach(() => {
    localStorage.removeItem("auth_token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the lowest priced variant when the product price is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                title: "Power bank",
                price: 0,
                mrp: 0,
                variants: [
                  { name: "White", price: 1800, mrp: 2500 },
                  { name: "Black", price: 1649, mrp: 2649 },
                ],
              },
            ],
            page: 1,
            pages: 1,
            total: 1,
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const { items } = await api.fetchProducts();

    expect(items[0]).toMatchObject({
      price: 1649,
      mrp: 2649,
      discount: 38,
    });
  });

  it("does not invent a price when neither the product nor variants have one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [{ title: "Unknown price", price: 0, mrp: 0, variants: [] }],
            page: 1,
            pages: 1,
            total: 1,
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const { items } = await api.fetchProducts();

    expect(items[0]).toMatchObject({
      price: 0,
      mrp: 0,
      discount: 0,
    });
  });
});
