import { describe, expect, it } from "vitest";
import { addDays, dateInput, taipeiISO, validateSlot, weekDates } from "./time";
const now = new Date("2026-10-11T01:00:00Z");
describe("借用時段防呆", () => {
  it("接受同日合法時段，拒絕倒置、超出開放時間與無效格式", () => {
    expect(validateSlot("2026-10-11", "09:00", "10:00", now, true)).toBe("");
    expect(validateSlot("2026-10-11", "10:00", "09:00", now, true)).toContain(
      "晚於",
    );
    expect(validateSlot("2026-10-11", "07:00", "10:00", now, true)).toContain(
      "08:00",
    );
    expect(validateSlot("", "09:00", "10:00", now, true)).toContain("完整");
    expect(validateSlot("2026-02-30", "09:00", "10:00", now)).toContain(
      "有效日期",
    );
  });
  it("限制30分鐘到8小時、過期與90天預約上限", () => {
    expect(validateSlot("2026-10-11", "09:00", "09:15", now, true)).toContain(
      "30 分鐘",
    );
    expect(validateSlot("2026-10-11", "09:00", "18:00", now, true)).toContain(
      "8 小時",
    );
    expect(validateSlot("2026-10-10", "09:00", "10:00", now, true)).toContain(
      "已過",
    );
    expect(validateSlot("2027-03-01", "09:00", "10:00", now, true)).toContain(
      "90 天",
    );
  });
  it("查詢不阻擋歷史日期，臺北跨日及週一課表邊界正確", () => {
    expect(validateSlot("2026-10-10", "09:00", "10:00", now)).toBe("");
    expect(dateInput(new Date("2026-10-11T20:00:00Z"))).toBe("2026-10-12");
    expect(weekDates("2026-10-11")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(taipeiISO("2026-10-11", "09:00")).toBe("2026-10-11T09:00:00+08:00");
  });
  it("課表前後週與排他結束時間涵蓋完整七日，跨月年與閏日正確", () => {
    const days = weekDates("2026-10-14");
    expect(addDays(days[6], 1)).toBe("2026-10-19");
    expect(weekDates(addDays("2026-10-14", 7))[0]).toBe("2026-10-19");
    expect(weekDates(addDays("2026-10-14", -7))[0]).toBe("2026-10-05");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });
});
