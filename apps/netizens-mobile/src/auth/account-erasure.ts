// Process-local tombstones prevent late responses from restoring erased identities.
// Credentials and SQLite rows are separately removed; no identity data is persisted here.
const erased = new Set<string>();
export const isAccountErased = (userId: string): boolean => erased.has(userId);
export const markAccountErased = (userId: string): void => { erased.add(userId); };
