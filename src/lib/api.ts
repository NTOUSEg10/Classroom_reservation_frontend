import { get, writable } from "svelte/store";
import type { Profile, Notice, Collection, AuthIdentity } from "./types";
import {
  createClient,
  type SupabaseClient,
  type Session,
  type RealtimeChannel,
} from "@supabase/supabase-js";

export interface PublicConfig {
  supabase_url: string;
  supabase_publishable_key: string;
  vapid_public_key: string;
  demo_data: boolean;
}
export const profile = writable<Profile | null>(null);
export const identity = writable<AuthIdentity | null>(null);
export const session = writable<Session | null>(null);
export const notices = writable<Notice[]>([]);
export const ready = writable(false);
export const connectionError = writable("");
export const config = writable<PublicConfig | null>(null);
let client: SupabaseClient | null = null;
let authStorageKey: string | undefined;
let initialization: Promise<void> | undefined;
let channel: RealtimeChannel | undefined;
let notificationTimer: ReturnType<typeof setInterval> | undefined;
let fetchingNotifications = false;
let notificationOwner: string | undefined;
let identityRequest:
  { token: string; promise: Promise<AuthIdentity> } | undefined;
let callbackRequest:
  { code: string; promise: Promise<AuthIdentity> } | undefined;
let authGeneration = 0;
let authTransition = false;
let authMutation: Promise<unknown> = Promise.resolve();
let activeAuthGeneration: number | undefined;
let callbackSessionPending = false;

// Serialize SDK writes too: a discarded PKCE result must not remain in browser storage.
function mutateAuth<T>(generation: number, work: () => Promise<T>): Promise<T> {
  const result = authMutation.then(async () => {
    activeAuthGeneration = generation;
    try {
      return await work();
    } finally {
      activeAuthGeneration = undefined;
    }
  });
  authMutation = result.catch(() => {});
  return result;
}
const supersededSignIn = () => new Error("登入流程已變更，請重新登入。");

function clearPrivateState() {
  identity.set(null);
  profile.set(null);
  notices.set([]);
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = undefined;
  if (channel && client) void client.removeChannel(channel).catch(() => {});
  channel = undefined;
  notificationOwner = undefined;
}
function clearAuthenticatedState() {
  session.set(null);
  clearPrivateState();
}
function clearPersistedCredentials() {
  if (authStorageKey && globalThis.localStorage) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key === authStorageKey || key?.startsWith(`${authStorageKey}-`))
        localStorage.removeItem(key);
    }
  }
}
function clearPkceCredentials() {
  if (!authStorageKey || !globalThis.localStorage) return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${authStorageKey}-`) && key.endsWith("-code-verifier"))
      localStorage.removeItem(key);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = get(session)?.access_token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const result = await response.json();
    if (!response.ok) {
      const detail =
        typeof result.detail === "string"
          ? result.detail
          : "資料格式不正確，請檢查欄位後再試。";
      throw new ApiError(detail, response.status);
    }
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("無法連線到平台，請確認網路後再試。", 0);
  } finally {
    clearTimeout(timer);
  }
}
export const json = (body: unknown) => JSON.stringify(body);
export const message = (error: unknown) =>
  error instanceof Error ? error.message : "操作失敗，請稍後再試。";
export async function refreshIdentity(): Promise<AuthIdentity> {
  const current = get(session);
  if (!current) throw new ApiError("請使用學校 Google 帳號登入。", 401);
  if (identityRequest?.token === current.access_token)
    return identityRequest.promise;
  const promise = (async () => {
    try {
      const result = await api<AuthIdentity>("/auth/identity");
      if (get(session)?.access_token === current.access_token) {
        connectionError.set("");
        identity.set(result);
        profile.set(result.profile ?? null);
        if (result.profile) subscribeNotifications(current.user.id);
        else {
          clearPrivateState();
          identity.set(result);
        }
      }
      return result;
    } catch (error) {
      if (get(session)?.access_token === current.access_token)
        clearPrivateState();
      throw error;
    }
  })();
  identityRequest = { token: current.access_token, promise };
  try {
    return await promise;
  } finally {
    if (identityRequest?.promise === promise) identityRequest = undefined;
  }
}
export async function refreshProfile() {
  await refreshIdentity();
}
export async function refreshNotifications() {
  const owner = get(session)?.user.id;
  if (!owner || fetchingNotifications) return;
  fetchingNotifications = true;
  try {
    const result = await api<Collection<Notice>>(
      "/notifications?limit=100&offset=0",
    );
    if (get(session)?.user.id === owner) notices.set(result.items);
  } finally {
    fetchingNotifications = false;
  }
}
function subscribeNotifications(userId: string) {
  if (!client || notificationOwner === userId) return;
  if (channel) void client.removeChannel(channel);
  channel = client
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        void refreshNotifications().catch(() => {});
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void refreshNotifications().catch(() => {});
    });
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = setInterval(() => {
    void refreshNotifications().catch(() => {});
  }, 2000);
  notificationOwner = userId;
}
export async function initialize() {
  if (initialization) return initialization;
  initialization = (async () => {
    const generation = authGeneration;
    connectionError.set("");
    try {
      const settings = await api<PublicConfig>("/config");
      config.set(settings);
      if (!settings.supabase_url || !settings.supabase_publishable_key)
        throw new Error("身分驗證服務尚未設定，請聯絡平台管理員。");
      authStorageKey = `sb-${new URL(settings.supabase_url).hostname.split(".")[0]}-auth-token`;
      client = createClient(
        settings.supabase_url,
        settings.supabase_publishable_key,
        {
          auth: {
            storageKey: authStorageKey,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: "pkce",
          },
        },
      );
      client.auth.onAuthStateChange((_event, nextSession) => {
        if (_event === "SIGNED_OUT" && activeAuthGeneration === undefined) {
          authGeneration++;
          authTransition = false;
          clearAuthenticatedState();
          return;
        }
        if (
          authTransition ||
          (activeAuthGeneration !== undefined &&
            activeAuthGeneration !== authGeneration)
        )
          return;
        if (get(session)?.user.id !== nextSession?.user.id) clearPrivateState();
        session.set(nextSession);
        // Auth callbacks must return before another auth/API operation starts.
        setTimeout(() => {
          if (get(session) !== nextSession) return;
          if (nextSession) {
            void refreshIdentity().catch((error) => {
              if (get(session) === nextSession)
                connectionError.set(message(error));
            });
          } else {
            clearAuthenticatedState();
          }
        }, 0);
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (generation === authGeneration && !authTransition) {
        session.set(data.session);
        if (data.session) await refreshIdentity();
      }
    } catch (error) {
      if (generation === authGeneration) connectionError.set(message(error));
      if (!client) initialization = undefined;
    } finally {
      ready.set(true);
    }
  })();
  return initialization;
}
export async function signInWithGoogle() {
  const generation = ++authGeneration;
  authTransition = true;
  await initialize();
  try {
    if (!client) throw new Error("身分驗證服務尚未連線，請稍後重試。");
    const auth = client.auth;
    await mutateAuth(generation, async () => {
      if (generation !== authGeneration) throw supersededSignIn();
      const previous = await auth.signOut({ scope: "local" });
      if (generation !== authGeneration) throw supersededSignIn();
      if (previous.error) throw new Error("無法清除前次登入，請稍後重試。");
      clearAuthenticatedState();
      clearPersistedCredentials();
      const { error } = await auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { hd: "email.ntou.edu.tw", prompt: "select_account" },
        },
      });
      if (error) throw new Error("無法啟動 Google 登入，請稍後重試。");
      if (generation === authGeneration) callbackSessionPending = false;
    });
  } catch (error) {
    if (generation === authGeneration) authTransition = false;
    throw error;
  }
}
export function completeGoogleSignIn(callbackUrl: URL): Promise<AuthIdentity> {
  const code = callbackUrl.searchParams.get("code");
  const flowId = callbackUrl.searchParams.get("sb_flow_id");
  const cancelled =
    callbackUrl.searchParams.has("error") ||
    callbackUrl.hash.includes("error=");
  if (cancelled || !code) {
    const removePendingSession = callbackSessionPending;
    const generation = ++authGeneration;
    authTransition = true;
    return (async () => {
      await initialize();
      await mutateAuth(generation, async () => {
        if (generation !== authGeneration) throw supersededSignIn();
        if (removePendingSession) {
          // The superseded exchange may already have persisted a session inside the SDK.
          try {
            await client?.auth.signOut({ scope: "local" });
          } catch {
            /* Local cleanup still completes while Auth is unavailable. */
          } finally {
            if (generation === authGeneration) {
              clearAuthenticatedState();
              clearPersistedCredentials();
              callbackSessionPending = false;
            }
          }
        } else clearPkceCredentials();
        if (generation !== authGeneration) throw supersededSignIn();
        authTransition = false;
      });
      throw new Error(
        cancelled
          ? "Google 登入已取消或未獲授權，請重新登入。"
          : "Google 登入資訊不完整，請重新登入。",
      );
    })();
  }
  if (callbackRequest?.code === code) return callbackRequest.promise;
  const generation = ++authGeneration;
  authTransition = true;
  callbackSessionPending = true;
  const promise = (async () => {
    await initialize();
    if (generation !== authGeneration) throw supersededSignIn();
    if (!client) {
      authTransition = false;
      throw new Error("身分驗證服務尚未連線，請稍後重試。");
    }
    const auth = client.auth;
    clearAuthenticatedState();
    connectionError.set("");
    try {
      const { data, error } = await mutateAuth(generation, async () => {
        if (generation !== authGeneration) throw supersededSignIn();
        return auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
      });
      if (generation !== authGeneration) throw supersededSignIn();
      if (error || !data.session)
        throw new Error("Google 登入未完成或已逾時，請重新登入。");
      session.set(data.session);
      const result = await refreshIdentity();
      if (generation !== authGeneration) throw supersededSignIn();
      authTransition = false;
      return result;
    } catch (error) {
      if (generation !== authGeneration) throw supersededSignIn();
      try {
        await mutateAuth(generation, async () => {
          if (generation === authGeneration)
            await auth.signOut({ scope: "local" });
        });
      } catch {
        /* Preserve the actionable callback error. */
      } finally {
        if (generation === authGeneration) {
          authTransition = false;
          clearAuthenticatedState();
          clearPersistedCredentials();
        }
      }
      throw error;
    }
  })().finally(() => {
    if (generation === authGeneration) callbackSessionPending = false;
  });
  callbackRequest = { code, promise };
  return promise;
}
export async function reconnect() {
  await initialize();
  if (get(session)) {
    try {
      await refreshIdentity();
    } catch (error) {
      connectionError.set(message(error));
    }
  }
}
export async function signOut() {
  const generation = ++authGeneration;
  authTransition = true;
  const token = get(session)?.access_token;
  clearAuthenticatedState();
  await mutateAuth(generation, async () => {
    try {
      const subscription =
        "serviceWorker" in navigator
          ? await (
              await navigator.serviceWorker.getRegistration()
            )?.pushManager.getSubscription()
          : null;
      if (subscription) {
        try {
          await api("/push-subscriptions", {
            method: "DELETE",
            body: json({ endpoint: subscription.endpoint }),
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
        } finally {
          await subscription.unsubscribe();
        }
      }
    } finally {
      try {
        const result = await client?.auth.signOut({ scope: "local" });
        if (result?.error) throw result.error;
      } finally {
        if (generation === authGeneration) {
          authTransition = false;
          callbackSessionPending = false;
          clearAuthenticatedState();
          // Clear this project's persisted credentials even if Auth cannot finish sign-out.
          clearPersistedCredentials();
        }
      }
    }
  });
}
export async function enablePush() {
  const key = get(config)?.vapid_public_key;
  if (!key)
    throw new Error("管理員尚未設定背景推播；您仍可在通知中心接收狀態更新。");
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    throw new Error("此瀏覽器不支援背景推播，請使用通知中心。");
  if ((await Notification.requestPermission()) !== "granted")
    throw new Error("尚未取得通知權限；請至瀏覽器設定允許通知。");
  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const bytes = Uint8Array.from(
    atob(key.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes,
    }));
  await api("/push-subscriptions", {
    method: "POST",
    body: json(subscription.toJSON()),
  });
}
