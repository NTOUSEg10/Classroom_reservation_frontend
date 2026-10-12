import { afterEach, describe, expect, it, vi } from "vitest";
import { watchMap } from "./map-loader";
afterEach(() => {
  vi.useRealTimers();
});
describe("地圖 2 秒降級（NFR-007 / NFR-008）", () => {
  it("1999ms 前等待，2000ms 時顯示文字備案，忽略遲到圖資", () => {
    vi.useFakeTimers();
    const update = vi.fn();
    const map = watchMap(update);
    vi.advanceTimersByTime(1999);
    expect(update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(update).toHaveBeenCalledExactlyOnceWith("fallback");
    map.loaded();
    expect(update).toHaveBeenCalledTimes(1);
  });
  it("圖資出錯立即降級，成功載入清除期限", () => {
    vi.useFakeTimers();
    const failed = vi.fn();
    watchMap(failed).failed();
    expect(failed).toHaveBeenCalledExactlyOnceWith("fallback");
    const loaded = vi.fn();
    watchMap(loaded).loaded();
    vi.advanceTimersByTime(2000);
    expect(loaded).toHaveBeenCalledExactlyOnceWith("ready");
  });
  it("元件卸載後不更新狀態", () => {
    vi.useFakeTimers();
    const update = vi.fn();
    const map = watchMap(update);
    map.dispose();
    vi.advanceTimersByTime(2000);
    map.failed();
    expect(update).not.toHaveBeenCalled();
  });
});
