import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth })),
}));

let platform: typeof import("./api");
let fetchMock: ReturnType<typeof vi.fn>;
let storageRead: ReturnType<typeof vi.fn>;
let settings: {
  demo_data: boolean;
  supabase_url: string;
  supabase_publishable_key: string;
  vapid_public_key: string;
};

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  settings = {
    demo_data: false,
    supabase_url: "",
    supabase_publishable_key: "",
    vapid_public_key: "",
  };
  storageRead = vi.fn(() => "previous-device-session");
  vi.stubGlobal("localStorage", { getItem: storageRead });
  fetchMock = vi.fn(async (path: string) =>
    Response.json(path === "/api/config" ? settings : { items: [] }),
  );
  vi.stubGlobal("fetch", fetchMock);
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  platform = await import("./api");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([false, true])(
  "Auth configuration (sample data=%s)",
  (sampleData) => {
    beforeEach(() => {
      settings.demo_data = sampleData;
    });

    it.each([
      ["", ""],
      ["https://test-project.supabase.co", ""],
      ["", "public-key"],
    ])(
      "reports incomplete configuration (url=%s, key=%s)",
      async (url, key) => {
        settings.supabase_url = url;
        settings.supabase_publishable_key = key;
        await platform.initialize();
        const { createClient } = await import("@supabase/supabase-js");
        expect(get(platform.ready)).toBe(true);
        expect(get(platform.connectionError)).toContain("尚未設定");
        expect(createClient).not.toHaveBeenCalled();
        expect(auth.getSession).not.toHaveBeenCalled();
        expect(storageRead).not.toHaveBeenCalled();
        expect(get(platform.session)).toBeNull();
        expect(get(platform.profile)).toBeNull();
        expect(get(platform.identity)).toBeNull();
        expect(get(platform.notices)).toEqual([]);

        await platform.api("/rooms");
        const request = fetchMock.mock.calls.at(-1) as unknown as [
          string,
          RequestInit,
        ];
        expect(request[0]).toBe("/api/rooms");
        expect(new Headers(request[1].headers).has("Authorization")).toBe(
          false,
        );
      },
    );

    it("rejects Google login and callback without configured Auth", async () => {
      await platform.initialize();
      await expect(platform.signInWithGoogle()).rejects.toThrow("尚未連線");
      await expect(
        platform.completeGoogleSignIn(
          new URL("https://classrooms.example/auth/callback?code=invalid"),
        ),
      ).rejects.toThrow("尚未連線");
      expect(auth.signInWithOAuth).not.toHaveBeenCalled();
      expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(get(platform.session)).toBeNull();
      expect(get(platform.connectionError)).toContain("尚未設定");
      expect(get(platform.ready)).toBe(true);
    });

    it("initializes Auth with a complete Supabase configuration", async () => {
      settings.supabase_url = "https://test-project.supabase.co";
      settings.supabase_publishable_key = "public-key";
      await platform.initialize();
      const { createClient } = await import("@supabase/supabase-js");
      expect(createClient).toHaveBeenCalledOnce();
      expect(auth.getSession).toHaveBeenCalledOnce();
      expect(auth.onAuthStateChange).toHaveBeenCalledOnce();
      expect(get(platform.connectionError)).toBe("");
      expect(get(platform.ready)).toBe(true);
    });
  },
);
