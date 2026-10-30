const octet = "(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)";
const ipv4 = `${octet}(?:\\.${octet}){3}`;

// RFC 3986: an IPv6 address is eight 16-bit groups, where a single "::" stands
// in for one or more all-zero groups and the final two groups may instead be
// written as a dotted IPv4 quad. Each line below is one arm of that grammar,
// ordered by how many groups sit to the right of the "::".
const h16 = "[0-9a-fA-F]{1,4}";
const ls32 = `(?:${h16}:${h16}|${ipv4})`;
const ipv6 = [
  `(?:${h16}:){6}${ls32}`,
  `::(?:${h16}:){5}${ls32}`,
  `(?:${h16})?::(?:${h16}:){4}${ls32}`,
  `(?:(?:${h16}:){0,1}${h16})?::(?:${h16}:){3}${ls32}`,
  `(?:(?:${h16}:){0,2}${h16})?::(?:${h16}:){2}${ls32}`,
  `(?:(?:${h16}:){0,3}${h16})?::${h16}:${ls32}`,
  `(?:(?:${h16}:){0,4}${h16})?::${ls32}`,
  `(?:(?:${h16}:){0,5}${h16})?::${h16}`,
  `(?:(?:${h16}:){0,6}${h16})?::`,
].join("|");

export const ipv4Regex = new RegExp(`^${ipv4}$`);
export const ipv6Regex = new RegExp(`^(?:${ipv6})$`);
export const domainRegex =
  /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const isIpAddress = (value) =>
  ipv4Regex.test(value) || ipv6Regex.test(value);

export const isValidQuery = (value) =>
  isIpAddress(value) || domainRegex.test(value);
