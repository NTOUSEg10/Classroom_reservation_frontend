import type { Profile } from "./types";

export function borrowerOptions(
  users: Profile[],
  selected: Profile | null,
): Profile[] {
  const borrowers = users.filter((user) => user.role === "borrower");
  return selected?.role === "borrower" &&
    !borrowers.some((user) => user.id === selected.id)
    ? [selected, ...borrowers]
    : borrowers;
}
