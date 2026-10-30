import { canonicalizeIpv6, normalizeQuery } from "../utils/normalizeQuery";
import { ipv6Regex } from "../utils/validateQuery";

describe("canonicalizeIpv6", () => {
  it.each([
    // leading zeros dropped, hex lowercased
    ["2001:0db8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
    ["2001:DB8::1", "2001:db8::1"],
    ["fe80::0202:B3FF:FE1E:8329", "fe80::202:b3ff:fe1e:8329"],
    // a run of zero groups collapses to "::"
    ["0:0:0:0:0:0:0:0", "::"],
    ["0:0:0:0:0:0:0:1", "::1"],
    ["1:0:0:0:0:0:0:0", "1::"],
    ["2001:db8:0:0:0:0:0:1", "2001:db8::1"],
    // already canonical, left alone
    ["::", "::"],
    ["::1", "::1"],
    ["1::", "1::"],
    ["1:2:3:4:5:6:7:8", "1:2:3:4:5:6:7:8"],
    // RFC 5952 4.2.2: a single zero group is never shortened
    ["1:2:3:4:5:6:0:8", "1:2:3:4:5:6:0:8"],
    // RFC 5952 4.2.3: the longest run wins
    ["1:0:0:2:0:0:0:3", "1:0:0:2::3"],
    // ...and the leftmost of two equal runs
    ["1:0:0:2:0:0:3:4", "1::2:0:0:3:4"],
    // RFC 5952 5: a dotted quad keeps its mixed form and fills two groups
    ["::ffff:192.168.0.1", "::ffff:192.168.0.1"],
    ["0:0:0:0:0:ffff:1.2.3.4", "::ffff:1.2.3.4"],
    ["2001:db8::192.168.0.1", "2001:db8::192.168.0.1"],
    ["::1.2.3.4", "::1.2.3.4"],
    ["1:2:3:4:5:6:1.2.3.4", "1:2:3:4:5:6:1.2.3.4"],
  ])("rewrites %s as %s", (value, expected) => {
    expect(canonicalizeIpv6(value)).toBe(expected);
  });

  it("is idempotent and always produces a valid address", () => {
    const values = [
      "2001:0db8::0:1",
      "::",
      "1:0:0:2:0:0:0:3",
      "::ffff:192.168.0.1",
      "fe80:0:0:0:0:0:0:1",
    ];

    values.forEach((value) => {
      const once = canonicalizeIpv6(value);
      expect(ipv6Regex.test(once)).toBe(true);
      expect(canonicalizeIpv6(once)).toBe(once);
    });
  });

  it("gives every spelling of one address the same canonical form", () => {
    // 2001:db8:0:0:0:0:0:1, written every way the grammar allows
    const spellings = [
      "2001:0db8:0000:0000:0000:0000:0000:0001",
      "2001:db8:0:0:0:0:0:1",
      "2001:DB8:0:0:0:0:0:1",
      "2001:db8::1",
      "2001:db8:0::1",
      "2001:db8:0:0::1",
      "2001:db8:0:0:0::1",
      "2001:db8:0:0:0:0::1",
      "2001:db8::0:1",
      "2001:db8::0:0:1",
    ];

    spellings.forEach((value) => expect(ipv6Regex.test(value)).toBe(true));
    expect(new Set(spellings.map(canonicalizeIpv6))).toEqual(
      new Set(["2001:db8::1"]),
    );
  });
});

describe("normalizeQuery", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeQuery("  8.8.8.8  ")).toBe("8.8.8.8");
    expect(normalizeQuery("  example.com  ")).toBe("example.com");
    expect(normalizeQuery("  2001:db8::1  ")).toBe("2001:db8::1");
  });

  it("canonicalizes an IPv6 address", () => {
    expect(normalizeQuery("2001:0DB8:0000::0001")).toBe("2001:db8::1");
  });

  it("accepts the bracketed URL form of an IPv6 address", () => {
    expect(normalizeQuery("[2001:db8::1]")).toBe("2001:db8::1");
    expect(normalizeQuery("  [2001:0DB8::0001]  ")).toBe("2001:db8::1");
  });

  it("leaves IPv4 addresses, domains and invalid input untouched", () => {
    expect(normalizeQuery("8.8.8.8")).toBe("8.8.8.8");
    expect(normalizeQuery("Example.COM")).toBe("Example.COM");
    expect(normalizeQuery("")).toBe("");
    expect(normalizeQuery("   ")).toBe("");
    expect(normalizeQuery("not a query")).toBe("not a query");
    // brackets around anything that is not an IPv6 address are kept, so the
    // value still fails validation instead of silently becoming a domain
    expect(normalizeQuery("[example.com]")).toBe("[example.com]");
    expect(normalizeQuery("[]")).toBe("[]");
  });
});
