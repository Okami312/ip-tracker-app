import { ipv6Regex } from "./validateQuery";

// The same IPv6 address has many spellings: leading zeros are optional, hex is
// case-insensitive, and one run of zero groups may collapse to "::". These
// helpers reduce a valid address to the single RFC 5952 form, so that the cache
// and the request URL see "2001:db8::1" however the user typed it.

const groupsOf = (part) => (part === "" ? [] : part.split(":"));

// The longest run of zero groups, leftmost on a tie (RFC 5952 4.2.3). A run of
// one is left alone (4.2.2), so runs shorter than two are not reported.
const longestZeroRun = (groups) => {
  let best = { start: 0, length: 0 };
  let start = -1;

  groups.forEach((group, index) => {
    if (group !== "0") {
      start = -1;
      return;
    }
    if (start === -1) start = index;
    const length = index - start + 1;
    if (length > best.length) best = { start, length };
  });

  return best.length < 2 ? null : best;
};

export const canonicalizeIpv6 = (value) => {
  const marker = value.indexOf("::");
  const head = groupsOf(marker === -1 ? value : value.slice(0, marker));
  const tail = marker === -1 ? [] : groupsOf(value.slice(marker + 2));

  // A trailing dotted quad is the last two groups and keeps that mixed form
  // (RFC 5952 5), so it counts double when working out how many groups "::" hid.
  const written = [...head, ...tail];
  const dotted = written[written.length - 1]?.includes(".") ?? false;
  const hidden = marker === -1 ? 0 : 8 - written.length - (dotted ? 1 : 0);
  const groups = [...head, ...Array(hidden).fill("0"), ...tail].map((group) =>
    group.includes(".") ? group : parseInt(group, 16).toString(16),
  );

  const run = longestZeroRun(groups);
  if (!run) return groups.join(":");
  return `${groups.slice(0, run.start).join(":")}::${groups
    .slice(run.start + run.length)
    .join(":")}`;
};

// Trims the query and, for an IPv6 address, accepts the bracketed URL form
// ("[2001:db8::1]") and reduces it to its canonical spelling. Anything else is
// returned trimmed and otherwise untouched.
export const normalizeQuery = (value) => {
  const trimmed = value.trim();
  const bracketed = /^\[(.+)\]$/.exec(trimmed);
  const candidate = bracketed ? bracketed[1] : trimmed;
  return ipv6Regex.test(candidate) ? canonicalizeIpv6(candidate) : trimmed;
};
