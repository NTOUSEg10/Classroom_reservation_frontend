import { beforeEach, describe, expect, it, vi } from "vitest";

const engine = vi.hoisted(() => ({
  fromTo: vi.fn(),
  matchMedia: vi.fn(),
  add: vi.fn(),
  revert: vi.fn(),
  reduce: false,
}));
vi.mock("gsap", () => ({ gsap: engine }));
import { motion } from "./motion";

let node: HTMLElement;
beforeEach(() => {
  vi.resetAllMocks();
  engine.reduce = false;
  engine.matchMedia.mockReturnValue({ add: engine.add, revert: engine.revert });
  engine.add.mockImplementation((_query, callback) => {
    if (!engine.reduce) callback();
  });
  node = {
    isConnected: true,
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  } as unknown as HTMLElement;
});
const flush = () => new Promise<void>((done) => queueMicrotask(done));

describe("motion respects preferences and component lifetime", () => {
  it("does not animate, hide or delay results with reduced motion", async () => {
    engine.reduce = true;
    const action = motion(node, { kind: "results" });
    await flush();
    expect(engine.add).toHaveBeenCalledWith(
      "(prefers-reduced-motion: no-preference)",
      expect.any(Function),
      node,
    );
    expect(engine.fromTo).not.toHaveBeenCalled();
    action.destroy();
    expect(engine.revert).toHaveBeenCalledOnce();
  });
  it("cancels an entrance before it can start on a detached component", async () => {
    const action = motion(node, { kind: "results" });
    action.destroy();
    await flush();
    expect(engine.matchMedia).not.toHaveBeenCalled();
    expect(engine.fromTo).not.toHaveBeenCalled();
  });
  it("reverts rapid updates and never hides status controls", async () => {
    const action = motion(node, { kind: "status", key: "pending" });
    await flush();
    expect(engine.fromTo).not.toHaveBeenCalled();
    action.update({ kind: "status", key: "approved" });
    await flush();
    action.update({ kind: "status", key: "checked_out" });
    await flush();
    expect(engine.fromTo).toHaveBeenCalledTimes(2);
    expect(engine.fromTo).toHaveBeenLastCalledWith(
      node,
      { scale: 0.97, opacity: 0.8 },
      expect.objectContaining({
        duration: 0.16,
        opacity: 1,
        clearProps: "transform,opacity",
      }),
    );
    action.destroy();
    expect(engine.revert).toHaveBeenCalledTimes(2);
  });
  it("caps large result lists so stagger ends within 280 milliseconds", async () => {
    const rows = Array.from({ length: 100 }, () => ({}));
    vi.mocked(node.querySelectorAll).mockReturnValue(
      rows as unknown as NodeListOf<Element>,
    );
    const action = motion(node, { kind: "results" });
    await flush();
    expect(engine.fromTo.mock.calls[0][0]).toHaveLength(12);
    expect(engine.fromTo.mock.calls[0][2]).toMatchObject({
      duration: 0.22,
      stagger: { amount: 0.06 },
    });
    action.destroy();
  });
});
