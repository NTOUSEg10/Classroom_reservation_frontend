<script lang="ts">
  import { onDestroy } from "svelte";
  import { afterNavigate, goto, replaceState } from "$app/navigation";
  import { page } from "$app/state";
  import { completeGoogleSignIn, message } from "$lib/api";
  import Icon from "$lib/components/Icon.svelte";
  let error = $state("");
  let handled = false;
  let active = true;
  onDestroy(() => {
    active = false;
  });
  afterNavigate(async ({ complete }) => {
    if (handled) return;
    handled = true;
    const callback = new URL(window.location.href);
    await complete;
    if (!active) return;
    replaceState("/auth/callback", page.state);
    void completeGoogleSignIn(callback)
      .then(() => {
        if (active) return goto("/account", { replaceState: true });
      })
      .catch((cause) => {
        if (active) error = message(cause);
      });
  });
</script>

<svelte:head><title>確認 Google 登入 | 海大教室借用平台</title></svelte:head>
<div class="auth-wrapper">
  <div class="page-heading">
    <div>
      <h1>確認學校 Google 登入</h1>
      <p>登入完成後，將帶您前往帳戶。</p>
    </div>
  </div>
  {#if error}
    <section class="panel form-stack">
      <div class="alert error" role="alert">{error}</div>
      <a class="button" href="/login">重新登入<Icon name="arrow" size={18} /></a
      ><a class="text-link" href="/">先查詢教室</a>
    </section>
  {:else}
    <div class="panel loading-row" role="status">正在確認登入資訊…</div>
  {/if}
</div>
