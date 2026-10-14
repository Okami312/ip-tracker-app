const normalizeKey = (query) => query.trim().toLowerCase();

export const createLookupCache = ({ ttl, max, now = Date.now }) => {
  const entries = new Map();

  return {
    get(query) {
      const key = normalizeKey(query);
      const entry = entries.get(key);
      if (!entry) return undefined;

      if (now() - entry.storedAt >= ttl) {
        entries.delete(key);
        return undefined;
      }

      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },

    set(query, value) {
      const key = normalizeKey(query);
      entries.delete(key);
      entries.set(key, { value, storedAt: now() });

      if (entries.size > max) {
        entries.delete(entries.keys().next().value);
      }
    },
  };
};
