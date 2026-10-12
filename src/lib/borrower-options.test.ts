import { describe, expect, it } from "vitest";
import { borrowerOptions } from "./borrower-options";
import type { Profile } from "./types";

const borrower = (id: string, name = id) =>
  ({ id, name, role: "borrower" }) as Profile;

describe("borrower selection across user pages", () => {
  it("retains the selected UUID when the next page does not contain that borrower", () => {
    const selected = borrower("user-101");
    expect(
      borrowerOptions([borrower("user-1"), borrower("user-2")], selected).map(
        (user) => user.id,
      ),
    ).toEqual(["user-101", "user-1", "user-2"]);
    expect(borrowerOptions([], selected)).toEqual([selected]);
  });

  it("uses the current page record without duplicating the selected UUID", () => {
    const current = borrower("user-101", "Updated name");
    expect(borrowerOptions([current], borrower("user-101"))).toEqual([current]);
  });

  it("does not select a borrower by default or offer admin accounts", () => {
    const admin = { id: "admin-1", role: "admin" } as Profile;
    expect(borrowerOptions([admin, borrower("user-2")], null)).toEqual([
      borrower("user-2"),
    ]);
    expect(borrowerOptions([admin], admin)).toEqual([]);
  });
});
