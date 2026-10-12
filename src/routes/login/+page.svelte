<script lang="ts">
  import { signInWithGoogle, message, identity } from "$lib/api";
  import Icon from "$lib/components/Icon.svelte";
  let busy = $state(false);
  let error = $state("");
  async function login() {
    busy = true;
    error = "";
    try {
      await signInWithGoogle();
    } catch (cause) {
      error = message(cause);
      busy = false;
    }
  }
</script>

<svelte:head><title>學校 Google 登入 | 海大教室借用平台</title></svelte:head>
<div class="auth-wrapper">
  <div class="page-heading">
    <div>
      <h1>開始使用教室借用服務</h1>
      <p>使用學校 Google 帳號，管理每一筆借用。</p>
    </div>
  </div>
  {#if $identity}
    <div class="alert">
      您已登入為 {$identity.email}。<a class="text-link" href="/account"
        >{$identity.onboarding_required ? "完成基本資料" : "前往帳戶"}</a
      >
    </div>
  {/if}
  <section class="panel form-stack" aria-label="學校 Google 登入">
    <div>
      <h2>使用學校 Google 帳號</h2>
      <p>
        請選擇以 <strong>@email.ntou.edu.tw</strong> 結尾的學校帳號。首次登入後，再填寫基本資料即可申請教室。
      </p>
    </div>
    {#if error}<div class="alert error" role="alert">{error}</div>{/if}
    <button class="button" onclick={login} disabled={busy}
      >{busy ? "正在前往 Google…" : "使用學校 Google 登入"}<Icon
        name="arrow"
        size={18}
      /></button
    >
    <a class="text-link" href="/">先查詢教室</a>
  </section>
  <p class="auth-footnote">
    登入由 Google 與 Supabase 驗證。平台不接收您的 Google 密碼。
  </p>
</div>
