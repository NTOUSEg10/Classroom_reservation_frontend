<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    initialize,
    identity,
    session,
    profile,
    notices,
    config,
    connectionError,
    signOut,
    message,
    reconnect,
  } from "$lib/api";
  import Icon from "$lib/components/Icon.svelte";
  import { motion } from "$lib/motion";
  let { children } = $props();
  let logoutError = $state("");
  const unread = $derived($notices.filter((item) => !item.read_at).length);
  onMount(() => {
    void initialize();
  });
  async function logout() {
    logoutError = "";
    try {
      await signOut();
    } catch (cause) {
      logoutError = `已在此裝置登出，但遠端清理未完成：${message(cause)}`;
    }
  }
</script>

<svelte:head
  ><title>海大教室借用平台</title><meta
    name="description"
    content="國立臺灣海洋大學教室查詢、借用申請、課表與借用管理。"
  /></svelte:head
>
<a class="skip-link" href="#main">跳至主要內容</a>
<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/"
      ><div class="brand-mark"><Icon name="building" size={25} /></div>
      <span
        ><strong>海大教室借用平台</strong><small>國立臺灣海洋大學</small></span
      ></a
    >
    <nav aria-label="主要導覽">
      <a
        class:active={page.url.pathname === "/" ||
          page.url.pathname.startsWith("/rooms")}
        href="/"><Icon name="search" />查詢教室</a
      >
      <a
        class:active={page.url.pathname === "/reservations"}
        href="/reservations"><Icon name="calendar" />我的借用</a
      >
      <a
        class:active={page.url.pathname === "/notifications"}
        href="/notifications"
        ><Icon name="bell" />通知中心{#if unread}<span
            class="nav-count"
            aria-label="{unread} 則未讀">{unread}</span
          >{/if}</a
      >
      {#if $profile?.role === "admin"}<a
          class:active={page.url.pathname === "/admin"}
          href="/admin"><Icon name="shield" />管理台</a
        >{/if}
    </nav>
    <div class="sidebar-bottom">
      <p>借用前，請確認教室設備<br />與系所開放規範。</p>
      <a href="/account" class="sidebar-account"
        ><Icon name="user" />{$profile ? $profile.name : "登入與身分驗證"}<Icon
          name="arrow"
          size={16}
        /></a
      >
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar">
      <span class="campus-label">教室借用服務</span>
      <div class="header-actions">
        {#if $session}<span class="account-name"
            >{$profile?.name || "Google 帳號"}<small
              >{$profile
                ? $profile.role === "admin"
                  ? "管理員"
                  : "借用人"
                : $identity?.onboarding_required
                  ? "待完成資料"
                  : "待確認身分"}</small
            ></span
          ><button class="icon-button" onclick={logout} aria-label="登出"
            ><Icon name="logout" /></button
          >{:else}<a class="button secondary compact" href="/login"
            ><Icon name="user" size={17} />登入 / 註冊</a
          >{/if}
      </div>
    </header>
    <main id="main" use:motion={{ kind: "page", key: page.url.pathname }}>
      {#if $config?.demo_data}<div class="demo-banner">
          此環境使用示範教室資料；位置尚未經校方確認。
        </div>{/if}
      {#if $connectionError}<div class="alert error" role="alert">
          {$connectionError}<button class="text-button" onclick={reconnect}
            >重新連線</button
          >
        </div>{/if}
      {#if logoutError}<div class="alert error" role="alert">
          {logoutError}
        </div>{/if}
      {#key page.url.pathname === "/auth/callback" ? "callback" : `${$session?.user.id ?? "guest"}:${$profile?.role === "admin" ? "admin" : "borrower"}`}
        {@render children()}
      {/key}
    </main>
    <footer>
      <span>海大教室借用平台</span><span
        >發展者：林品希、陳佳昀、林良承、李曜年、侯屏嘉、洪于宸</span
      >
    </footer>
  </div>
</div>
