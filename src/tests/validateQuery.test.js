import { ipv4Regex, isValidQuery } from "../utils/validateQuery";

describe("isValidQuery", () => {
  it.each(["8.8.8.8", "192.168.0.1", "0.0.0.0", "255.255.255.255"])(
    "accepts the IPv4 address %s",
    (value) => {
      expect(isValidQuery(value)).toBe(true);
      expect(ipv4Regex.test(value)).toBe(true);
    },
  );

  it.each(["example.com", "sub.domain.co.uk", "my-site.io"])(
    "accepts the domain %s",
    (value) => {
      expect(isValidQuery(value)).toBe(true);
      expect(ipv4Regex.test(value)).toBe(false);
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
    "2001:db8::1",
  ])("rejects %p", (value) => {
    expect(isValidQuery(value)).toBe(false);
  });
});
