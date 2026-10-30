import {
  ipv4Regex,
  ipv6Regex,
  isIpAddress,
  isValidQuery,
} from "../utils/validateQuery";

describe("isValidQuery", () => {
  it.each(["8.8.8.8", "192.168.0.1", "0.0.0.0", "255.255.255.255"])(
    "accepts the IPv4 address %s",
    (value) => {
      expect(isValidQuery(value)).toBe(true);
      expect(ipv4Regex.test(value)).toBe(true);
      expect(ipv6Regex.test(value)).toBe(false);
      expect(isIpAddress(value)).toBe(true);
    },
  );

  it.each([
    "2001:db8::1",
    "1:2:3:4:5:6:7:8",
    "2001:0db8:0000:0000:0000:0000:0000:0001",
    "ABCD:EF01:2345:6789:abcd:ef01:2345:6789",
    "fe80::202:b3ff:fe1e:8329",
    "::",
    "::1",
    "1::",
    "1::8",
    "2606:4700:4700::1111",
    "::ffff:192.168.0.1",
    "0:0:0:0:0:ffff:1.2.3.4",
    "2001:db8::192.168.0.1",
    "1:2:3:4:5:6:1.2.3.4",
    "::1.2.3.4",
  ])("accepts the IPv6 address %s", (value) => {
    expect(isValidQuery(value)).toBe(true);
    expect(ipv6Regex.test(value)).toBe(true);
    expect(ipv4Regex.test(value)).toBe(false);
    expect(isIpAddress(value)).toBe(true);
  });

  it.each(["example.com", "sub.domain.co.uk", "my-site.io"])(
    "accepts the domain %s",
    (value) => {
      expect(isValidQuery(value)).toBe(true);
      expect(isIpAddress(value)).toBe(false);
    },
  );

  it.each([
    "",
    "   ",
    "256.1.1.1",
    "1.2.3",
    "1.2.3.4.5",
    "999.999.999.999",
    "localhost",
    "-bad.com",
    "https://example.com",
    "example.com/path",
  ])("rejects %p", (value) => {
    expect(isValidQuery(value)).toBe(false);
  });

  it.each([
    "2001:db8::1::2", // only one "::" is allowed
    "2001:db8:::1",
    "1:2:3:4:5:6:7:8:9", // too many groups
    "1:2:3:4:5:6:7", // too few without "::"
    ":1:2:3:4:5:6:7",
    "12345::", // group wider than 16 bits
    "gggg::1", // not hex
    "2001:db8::1%eth0", // zone id, not geolocatable
    "[2001:db8::1]", // brackets are stripped before validation, not accepted here
    "::ffff:300.1.1.1", // bad dotted quad
    "2001:db8::1.2.3",
    "1:2:3:4:5:1.2.3.4", // dotted quad fills the last two groups
    "2001:db8::/32", // a prefix is not an address
  ])("rejects the malformed IPv6 %p", (value) => {
    expect(isValidQuery(value)).toBe(false);
    expect(ipv6Regex.test(value)).toBe(false);
  });
});
