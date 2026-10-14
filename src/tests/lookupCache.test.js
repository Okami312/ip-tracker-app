import { createLookupCache } from "../utils/lookupCache";

const setup = (options = {}) => {
  let time = 0;
  const cache = createLookupCache({
    ttl: 1000,
    max: 3,
    now: () => time,
    ...options,
  });
  return { cache, advance: (ms) => (time += ms) };
};

describe("createLookupCache", () => {
  it("returns undefined for an unknown query", () => {
    const { cache } = setup();

    expect(cache.get("8.8.8.8")).toBeUndefined();
  });

  it("returns what was stored", () => {
    const { cache } = setup();
    cache.set("8.8.8.8", { ip: "8.8.8.8" });

    expect(cache.get("8.8.8.8")).toEqual({ ip: "8.8.8.8" });
  });

  it("ignores case and surrounding whitespace in the query", () => {
    const { cache } = setup();
    cache.set("  Example.COM ", "value");

    expect(cache.get("example.com")).toBe("value");
  });

  it("stores the own-IP lookup under the empty query", () => {
    const { cache } = setup();
    cache.set("", "mine");

    expect(cache.get("")).toBe("mine");
  });

  it("expires entries once the ttl has passed", () => {
    const { cache, advance } = setup();
    cache.set("a.com", "value");

    advance(999);
    expect(cache.get("a.com")).toBe("value");
    advance(1);
    expect(cache.get("a.com")).toBeUndefined();
  });

  it("evicts the oldest entry when full", () => {
    const { cache } = setup();
    ["a.com", "b.com", "c.com", "d.com"].forEach((q) => cache.set(q, q));

    expect(cache.get("a.com")).toBeUndefined();
    expect(cache.get("b.com")).toBe("b.com");
    expect(cache.get("d.com")).toBe("d.com");
  });

  it("keeps recently read entries when evicting", () => {
    const { cache } = setup();
    ["a.com", "b.com", "c.com"].forEach((q) => cache.set(q, q));

    cache.get("a.com");
    cache.set("d.com", "d.com");

    expect(cache.get("a.com")).toBe("a.com");
    expect(cache.get("b.com")).toBeUndefined();
  });

  it("replaces an existing entry and refreshes its age", () => {
    const { cache, advance } = setup();
    cache.set("a.com", "old");
    advance(900);
    cache.set("a.com", "new");
    advance(900);

    expect(cache.get("a.com")).toBe("new");
  });

  it("uses Date.now by default", () => {
    const cache = createLookupCache({ ttl: 1000, max: 3 });
    cache.set("a.com", "value");

    expect(cache.get("a.com")).toBe("value");
  });
});
