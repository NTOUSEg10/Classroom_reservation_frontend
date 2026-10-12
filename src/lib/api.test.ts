import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "./types";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
const realtime = vi.hoisted(() => ({
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth, ...realtime })),
}));

const signedIn = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  user: { id: "borrower-1" },
} as Session;
const borrower = {
  id: "borrower-1",
  name: "借用人",
  role: "borrower",
} as Profile;
const storageKey = "sb-test-project-auth-token";
let storage: Map<string, string>;
let unsubscribe: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;
let platform: typeof import("./api");

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  storage = new Map([
    [storageKey, JSON.stringify(signedIn)],
    [`${storageKey}-user`, JSON.stringify(borrower)],
    [`${storageKey}-flow-login-code-verifier`, "verifier"],
    ["theme", "light"],
  ]);
  vi.stubGlobal("localStorage", {
    get length() {
      return storage.size;
    },
    key: (index: number) => [...storage.keys()][index] ?? null,
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  unsubscribe = vi.fn().mockResolvedValue(true);
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistration: vi.fn().mockResolvedValue({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue({
            endpoint: "https://push.example/device",
            unsubscribe,
          }),
        },
      }),
    },
  });
  fetchMock = vi.fn(async (path: string) => {
    if (path === "/api/config")
      return Response.json({
        supabase_url: "https://test-project.supabase.co",
        supabase_publishable_key: "public-key",
        vapid_public_key: "",
        demo_data: true,
      });
    if (path === "/api/auth/identity")
      return Response.json({
        email: "borrower@email.ntou.edu.tw",
        onboarding_required: false,
        profile: borrower,
      });
    return new Response(null, { status: 204 });
  });
  vi.stubGlobal("fetch", fetchMock);
  auth.getSession.mockResolvedValue({
    data: { session: signedIn },
    error: null,
  });
  auth.signOut.mockResolvedValue({ error: null });
  auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.com" },
    error: null,
  });
  auth.exchangeCodeForSession.mockResolvedValue({
    data: { session: signedIn },
    error: null,
  });
  vi.stubGlobal("window", {
    location: { origin: "https://classrooms.example" },
  });
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  realtime.channel.mockReturnValue(channel);
  realtime.removeChannel.mockResolvedValue("ok");
  platform = await import("./api");
  await platform.initialize();
  platform.notices.set([
    { id: "notice-1", title: "私人通知", body: "", created_at: "" },
  ]);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function expectSignedOut() {
  expect(get(platform.session)).toBeNull();
  expect(get(platform.profile)).toBeNull();
  expect(get(platform.identity)).toBeNull();
  expect(get(platform.notices)).toEqual([]);
  expect([...storage.entries()]).toEqual([["theme", "light"]]);
  expect(realtime.removeChannel).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
  await platform.api("/rooms");
  const request = fetchMock.mock.calls.at(-1) as unknown as [
    string,
    RequestInit,
  ];
  expect(new Headers(request[1].headers).has("Authorization")).toBe(false);
}

describe("logout clears private state and credentials independently of remote cleanup", () => {
  it("still unsubscribes push and signs out after push deletion returns 503", async () => {
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ detail: "暫時無法服務" }, { status: 503 }),
    );
    await expect(platform.signOut()).rejects.toThrow("暫時無法服務");
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    await expectSignedOut();
  });

  it("still signs out when the browser cannot remove its push subscription", async () => {
    unsubscribe.mockRejectedValue(new Error("push service offline"));
    await expect(platform.signOut()).rejects.toThrow("push service offline");
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    await expectSignedOut();
  });

  it.each(["returned", "thrown"])(
    "clears persisted credentials when the Auth error is %s",
    async (failure) => {
      const error = new Error("Auth service unavailable");
      if (failure === "returned") auth.signOut.mockResolvedValue({ error });
      else auth.signOut.mockRejectedValue(error);
      await expect(platform.signOut()).rejects.toThrow(
        "Auth service unavailable",
      );
      await expectSignedOut();
    },
  );

  it("does not restart private polling from a queued signed-in callback after logout", async () => {
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    callback("SIGNED_IN", signedIn);
    await platform.signOut();
    await vi.runOnlyPendingTimersAsync();
    expect(realtime.channel).toHaveBeenCalledOnce();
    await expectSignedOut();
  });
});

describe("school Google PKCE and onboarding", () => {
  it("uses manual PKCE exchange and the school domain only as a Google picker hint", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        auth: {
          storageKey,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      },
    );
    await platform.signInWithGoogle();
    expect(auth.signInWithOAuth).toHaveBeenCalledExactlyOnceWith({
      provider: "google",
      options: {
        redirectTo: "https://classrooms.example/auth/callback",
        queryParams: { hd: "email.ntou.edu.tw", prompt: "select_account" },
      },
    });
    expect(
      fetchMock.mock.calls.some(([path]) => path === "/api/auth/login"),
    ).toBe(false);
  });

  it("exchanges a callback code once even when consumers enter concurrently", async () => {
    const callback = new URL(
      "https://classrooms.example/auth/callback?code=one-use-code&sb_flow_id=selected-flow",
    );
    const [first, second] = await Promise.all([
      platform.completeGoogleSignIn(callback),
      platform.completeGoogleSignIn(callback),
    ]);
    expect(first).toEqual(second);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith(
      "one-use-code",
      { flowId: "selected-flow" },
    );
    expect(get(platform.profile)).toEqual(borrower);
  });

  it.each([
    [
      "?error=access_denied&error_description=private-provider-details",
      "登入已取消",
    ],
    ["", "登入資訊不完整"],
  ])(
    "offers a clean retry for a cancelled or incomplete callback %s",
    async (query, explanation) => {
      storage.set(`${storageKey}-code-verifier`, "fixed verifier");
      storage.set(`${storageKey}-flows-code-verifier`, '["login"]');
      const otherProject =
        "sb-another-project-auth-token-flow-login-code-verifier";
      storage.set(otherProject, "other verifier");
      const result = platform.completeGoogleSignIn(
        new URL(`https://classrooms.example/auth/callback${query}`),
      );
      await expect(result).rejects.toThrow(explanation);
      await expect(result).rejects.not.toThrow("private-provider-details");
      expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(
        [...storage.keys()].filter(
          (key) =>
            key.startsWith(`${storageKey}-`) && key.endsWith("-code-verifier"),
        ),
      ).toEqual([]);
      expect(storage.get(otherProject)).toBe("other verifier");
      expect(storage.has(storageKey)).toBe(true);
      expect(get(platform.profile)).toEqual(borrower);
      expect(auth.signOut).not.toHaveBeenCalled();
    },
  );

  it("clears rejected PKCE credentials without exposing the provider error", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: new Error("private PKCE verifier details"),
    });
    const result = platform.completeGoogleSignIn(
      new URL("https://classrooms.example/auth/callback?code=expired"),
    );
    await expect(result).rejects.toThrow(
      "Google 登入未完成或已逾時，請重新登入。",
    );
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    await expectSignedOut();
  });

  it("treats a verified identity without a profile as onboarding and stops private polling", async () => {
    fetchMock.mockImplementationOnce(async () =>
      Response.json({
        email: "new@email.ntou.edu.tw",
        onboarding_required: true,
      }),
    );
    const result = await platform.refreshIdentity();
    expect(result.onboarding_required).toBe(true);
    expect(get(platform.identity)?.email).toBe("new@email.ntou.edu.tw");
    expect(get(platform.profile)).toBeNull();
    expect(get(platform.notices)).toEqual([]);
    expect(get(platform.connectionError)).toBe("");
    expect(vi.getTimerCount()).toBe(0);
    expect(fetchMock.mock.calls.some(([path]) => path === "/api/me")).toBe(
      false,
    );
  });

  it("does not restore a profile when an identity request finishes after logout", async () => {
    let resolve!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const pending = platform.refreshIdentity();
    await platform.signOut();
    resolve(
      Response.json({
        email: "borrower@email.ntou.edu.tw",
        onboarding_required: false,
        profile: borrower,
      }),
    );
    await pending;
    await expectSignedOut();
  });

  it("cleans up a Google session rejected by the server school identity policy", async () => {
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ detail: "請使用學校 Google 帳號登入" }, { status: 403 }),
    );
    await expect(
      platform.completeGoogleSignIn(
        new URL("https://classrooms.example/auth/callback?code=not-school"),
      ),
    ).rejects.toThrow("請使用學校 Google 帳號登入");
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
    await expectSignedOut();
  });

  it("cannot restore an SDK-persisted PKCE session after logout starts", async () => {
    let finish!: () => void;
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    auth.exchangeCodeForSession.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finish = () => {
            // The installed SDK saves credentials and emits SIGNED_IN before resolving.
            storage.set(storageKey, JSON.stringify(signedIn));
            callback("SIGNED_IN", signedIn);
            done({ data: { session: signedIn }, error: null });
          };
        }),
    );
    const old = platform
      .completeGoogleSignIn(
        new URL(
          "https://classrooms.example/auth/callback?code=late-after-logout",
        ),
      )
      .catch((error) => error);
    await vi.waitFor(() =>
      expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce(),
    );
    const logout = platform.signOut();
    expect(get(platform.session)).toBeNull();
    finish();
    expect(await old).toEqual(new Error("登入流程已變更，請重新登入。"));
    await logout;
    await vi.runOnlyPendingTimersAsync();
    await expectSignedOut();
  });

  it("serializes SDK writes so a later callback keeps its session and profile", async () => {
    let finish!: () => void;
    const newer = {
      ...signedIn,
      access_token: "new-access",
      refresh_token: "new-refresh",
      user: { id: "borrower-2" },
    } as Session;
    const newerProfile = {
      ...borrower,
      id: "borrower-2",
      name: "後來登入的人",
    };
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    auth.exchangeCodeForSession
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            finish = () => {
              storage.set(storageKey, JSON.stringify(signedIn));
              callback("SIGNED_IN", signedIn);
              done({ data: { session: signedIn }, error: null });
            };
          }),
      )
      .mockImplementationOnce(async () => {
        storage.set(storageKey, JSON.stringify(newer));
        callback("SIGNED_IN", newer);
        return { data: { session: newer }, error: null };
      });
    const old = platform
      .completeGoogleSignIn(
        new URL("https://classrooms.example/auth/callback?code=older"),
      )
      .catch((error) => error);
    await vi.waitFor(() =>
      expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce(),
    );
    fetchMock.mockImplementationOnce(async () =>
      Response.json({
        email: "new@email.ntou.edu.tw",
        onboarding_required: false,
        profile: newerProfile,
      }),
    );
    const latest = platform.completeGoogleSignIn(
      new URL("https://classrooms.example/auth/callback?code=latest"),
    );
    await Promise.resolve();
    expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce();
    finish();
    expect(await old).toEqual(new Error("登入流程已變更，請重新登入。"));
    await latest;
    await vi.runOnlyPendingTimersAsync();
    expect(get(platform.session)).toEqual(newer);
    expect(get(platform.profile)).toEqual(newerProfile);
    expect(JSON.parse(storage.get(storageKey)!)).toEqual(newer);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("does not let an older identity failure clear a newer successful callback", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          finish = done;
        }),
    );
    const old = platform
      .completeGoogleSignIn(
        new URL(
          "https://classrooms.example/auth/callback?code=identity-pending",
        ),
      )
      .catch((error) => error);
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([path]) => path === "/api/auth/identity"),
      ).toHaveLength(2),
    );
    const newer = {
      ...signedIn,
      access_token: "new-access",
      user: { id: "borrower-2" },
    } as Session;
    const newerProfile = { ...borrower, id: "borrower-2" };
    auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { session: newer },
      error: null,
    });
    fetchMock.mockImplementationOnce(async () =>
      Response.json({
        email: "new@email.ntou.edu.tw",
        onboarding_required: false,
        profile: newerProfile,
      }),
    );
    await platform.completeGoogleSignIn(
      new URL("https://classrooms.example/auth/callback?code=identity-latest"),
    );
    finish(
      Response.json({ detail: "請使用學校 Google 帳號登入" }, { status: 403 }),
    );
    expect(await old).toEqual(new Error("登入流程已變更，請重新登入。"));
    expect(get(platform.session)).toEqual(newer);
    expect(get(platform.profile)).toEqual(newerProfile);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("discards a pending callback before launching another Google sign-in", async () => {
    let finish!: () => void;
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    auth.exchangeCodeForSession.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finish = () => {
            storage.set(storageKey, JSON.stringify(signedIn));
            callback("SIGNED_IN", signedIn);
            done({ data: { session: signedIn }, error: null });
          };
        }),
    );
    const old = platform
      .completeGoogleSignIn(
        new URL(
          "https://classrooms.example/auth/callback?code=before-new-signin",
        ),
      )
      .catch((error) => error);
    await vi.waitFor(() =>
      expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce(),
    );
    const latest = platform.signInWithGoogle();
    finish();
    expect(await old).toEqual(new Error("登入流程已變更，請重新登入。"));
    await latest;
    expect(get(platform.session)).toBeNull();
    expect(get(platform.profile)).toBeNull();
    expect([...storage.keys()]).toEqual(["theme"]);
    expect(auth.signInWithOAuth).toHaveBeenCalledOnce();
  });

  it("does not publish an older identity error after a cross-tab account change", async () => {
    let finish!: (response: Response) => void;
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          finish = done;
        }),
    );
    callback("SIGNED_IN", signedIn);
    await vi.advanceTimersByTimeAsync(0);
    const newer = {
      ...signedIn,
      access_token: "new-access",
      user: { id: "borrower-2" },
    } as Session;
    const newerProfile = { ...borrower, id: "borrower-2" };
    fetchMock.mockImplementationOnce(async () =>
      Response.json({
        email: "new@email.ntou.edu.tw",
        onboarding_required: false,
        profile: newerProfile,
      }),
    );
    callback("SIGNED_IN", newer);
    await vi.advanceTimersByTimeAsync(0);
    finish(Response.json({ detail: "前一個帳戶已失效" }, { status: 401 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(get(platform.profile)).toEqual(newerProfile);
    expect(get(platform.connectionError)).toBe("");
  });

  it.each([
    ["?error=access_denied", "Google 登入已取消"],
    ["", "Google 登入資訊不完整"],
  ])(
    "clears late SDK credentials after a pending callback is replaced by %s",
    async (query, explanation) => {
      let finish!: () => void;
      const callback = auth.onAuthStateChange.mock.calls[0][0];
      auth.exchangeCodeForSession.mockImplementationOnce(
        () =>
          new Promise((done) => {
            finish = () => {
              storage.set(storageKey, JSON.stringify(signedIn));
              callback("SIGNED_IN", signedIn);
              done({ data: { session: signedIn }, error: null });
            };
          }),
      );
      const pending = platform
        .completeGoogleSignIn(
          new URL("https://classrooms.example/auth/callback?code=late-save"),
        )
        .catch((error) => error);
      await vi.waitFor(() =>
        expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce(),
      );
      const cancelled = platform
        .completeGoogleSignIn(
          new URL(`https://classrooms.example/auth/callback${query}`),
        )
        .catch((error) => error);
      await Promise.resolve();
      expect(auth.signOut).not.toHaveBeenCalled();
      finish();
      expect(await pending).toEqual(new Error("登入流程已變更，請重新登入。"));
      expect((await cancelled).message).toContain(explanation);
      expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
      await vi.runOnlyPendingTimersAsync();
      await expectSignedOut();
    },
  );

  it("does not clear a newer callback while cancellation cleanup waits for an old SDK write", async () => {
    let finish!: () => void;
    const newer = {
      ...signedIn,
      access_token: "new-access",
      user: { id: "borrower-2" },
    } as Session;
    const newerProfile = { ...borrower, id: "borrower-2" };
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    auth.exchangeCodeForSession
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            finish = () => {
              storage.set(storageKey, JSON.stringify(signedIn));
              callback("SIGNED_IN", signedIn);
              done({ data: { session: signedIn }, error: null });
            };
          }),
      )
      .mockImplementationOnce(async () => {
        storage.set(storageKey, JSON.stringify(newer));
        callback("SIGNED_IN", newer);
        return { data: { session: newer }, error: null };
      });
    const old = platform
      .completeGoogleSignIn(
        new URL(
          "https://classrooms.example/auth/callback?code=old-before-cancel",
        ),
      )
      .catch((error) => error);
    await vi.waitFor(() =>
      expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce(),
    );
    const cancelled = platform
      .completeGoogleSignIn(
        new URL("https://classrooms.example/auth/callback?error=access_denied"),
      )
      .catch((error) => error);
    fetchMock.mockImplementationOnce(async () =>
      Response.json({
        email: "new@email.ntou.edu.tw",
        onboarding_required: false,
        profile: newerProfile,
      }),
    );
    const latest = platform.completeGoogleSignIn(
      new URL(
        "https://classrooms.example/auth/callback?code=latest-after-cancel",
      ),
    );
    await Promise.resolve();
    finish();
    expect(await old).toEqual(new Error("登入流程已變更，請重新登入。"));
    expect(await cancelled).toEqual(new Error("登入流程已變更，請重新登入。"));
    await latest;
    expect(get(platform.session)).toEqual(newer);
    expect(get(platform.profile)).toEqual(newerProfile);
    expect(JSON.parse(storage.get(storageKey)!)).toEqual(newer);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
