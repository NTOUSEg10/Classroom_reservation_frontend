<script lang="ts">
  import { onMount } from "svelte";
  import {
    initialize,
    identity,
    session,
    profile,
    api,
    json,
    message,
    refreshIdentity,
  } from "$lib/api";
  import type { Eligibility } from "$lib/types";
  import Icon from "$lib/components/Icon.svelte";
  let loading = $state(true);
  let busy = $state(false);
  let error = $state("");
  let success = $state("");
  let eligibility = $state<Eligibility | null>(null);
  let name = $state("");
  let phone = $state("");
  let department = $state("");
  let institutionalId = $state("");
  onMount(() => {
    void load();
  });
  async function load(): Promise<boolean> {
    loading = true;
    error = "";
    try {
      await initialize();
      if ($session) {
        await refreshIdentity();
        if ($profile) {
          institutionalId = $profile.institutional_id;
          const owner = $session?.user.id;
          const result = await api<Eligibility>("/me/eligibility");
          if ($session?.user.id === owner) eligibility = result;
        }
      }
      return true;
    } catch (cause) {
      error = message(cause);
      return false;
    } finally {
      loading = false;
    }
  }
  async function register() {
    busy = true;
    error = "";
    success = "";
    try {
      await api("/auth/register", {
        method: "POST",
        body: json({
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          institutional_id: institutionalId.trim(),
        }),
      });
      if (await load()) success = "基本資料已完成，您現在可以提出借用申請。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = false;
    }
  }
  async function verify() {
    busy = true;
    error = "";
    success = "";
    try {
      await api("/me/verify", {
        method: "POST",
        body: json({ institutional_id: institutionalId.trim() }),
      });
      if (await load()) success = "校園身分驗證完成，您現在可以提出借用申請。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>帳戶與身分驗證 | 海大教室借用平台</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>帳戶與身分驗證</h1>
    <p>確認校園身分與借用資格，讓借用流程順利完成。</p>
  </div>
</div>
{#if error}<div class="alert error" role="alert">
    {error}<button class="text-button" onclick={load}>重新載入</button>
  </div>{/if}
{#if success}<div class="alert" role="status">{success}</div>{/if}
{#if loading}
  <div class="panel loading-row" role="status">正在確認帳戶資訊…</div>
{:else if $identity?.onboarding_required}
  <div class="account-grid">
    <section class="panel panel-padding">
      <h2>完成基本資料</h2>
      <p>聯絡資訊供管理員處理借用與鑰匙交還。送出後即可查詢借用資格。</p>
      <form
        class="form-stack"
        onsubmit={(event) => {
          event.preventDefault();
          void register();
        }}
      >
        <label
          >已驗證的學校 Google 信箱<input
            type="email"
            value={$identity.email}
            readonly
            autocomplete="email"
          /><span class="form-help">信箱來自 Google 登入，無法在此修改。</span
          ></label
        >
        <div class="form-row">
          <label
            >姓名<input
              autocomplete="name"
              bind:value={name}
              minlength="1"
              maxlength="80"
              required
            /></label
          ><label
            >校園證號<input
              autocomplete="off"
              bind:value={institutionalId}
              pattern={"[A-Za-z0-9]{6,16}"}
              minlength="6"
              maxlength="16"
              required
            /><span class="form-help">學生或教職員證號，6–16 位英數字。</span
            ></label
          >
        </div>
        <div class="form-row">
          <label
            >聯絡電話<input
              type="tel"
              autocomplete="tel"
              bind:value={phone}
              minlength="8"
              maxlength="24"
              pattern={"[+0-9 \\(\\)\\-]+"}
              required
            /></label
          ><label
            >系所 / 單位<input
              autocomplete="organization"
              bind:value={department}
              minlength="1"
              maxlength="100"
              required
            /></label
          >
        </div>
        <button class="button" disabled={busy}
          >{busy ? "正在儲存…" : "完成資料並啟用借用"}<Icon
            name="arrow"
            size={18}
          /></button
        >
      </form>
    </section>
    <section class="panel panel-padding">
      <div class="section-head">
        <Icon name="shield" />
        <h2>學校帳號已確認</h2>
      </div>
      <p>
        您的 Google 帳號已通過學校信箱驗證。請填寫真實姓名、校園證號與聯絡資料。
      </p>
      <a class="text-link" href="/">先查詢教室</a>
    </section>
  </div>
{:else if !$profile}
  <div class="panel empty-state">
    <Icon name="user" size={34} />
    <h2>請先登入學校 Google 帳號</h2>
    <p>登入後可完成基本資料、確認借用資格。</p>
    <a class="button" href="/login">使用學校 Google 登入</a>
  </div>
{:else}
  <div class="account-grid">
    <section class="panel panel-padding">
      <h2>基本資料</h2>
      <dl class="description-list">
        <dt>姓名</dt>
        <dd>{$profile.name}</dd>
        <dt>校園證號</dt>
        <dd>{$profile.institutional_id}</dd>
        <dt>學校 Google 信箱</dt>
        <dd>{$profile.email}</dd>
        <dt>聯絡電話</dt>
        <dd>{$profile.phone}</dd>
        <dt>系所 / 單位</dt>
        <dd>{$profile.department}</dd>
        <dt>帳號角色</dt>
        <dd>{$profile.role === "admin" ? "系統管理員" : "借用人"}</dd>
      </dl>
      <p>如聯絡資料有誤，請聯絡平台管理員協助處理。</p>
    </section>
    <div class="detail-info">
      <section class="panel panel-padding">
        <div class="section-head">
          <Icon name="shield" />
          <h2>借用資格</h2>
        </div>
        {#if eligibility?.eligible}<div class="alert">
            <Icon name="check" size={18} />已驗證，可提出借用申請
          </div>{:else}<div class="alert warning">
            {eligibility?.reason || "尚未完成校園身分驗證"}
          </div>{/if}
        <p>
          身分驗證：{$profile.verified ? "已完成" : "待驗證"}<br
          />帳號狀態：{$profile.suspended ? "已停權" : "正常"}<br
          />有效違規：{eligibility?.violation_points ?? 0} 點
        </p>
        {#if $profile.suspended}<p class="record-note">
            違規累計 3 點會暫停借用資格，請聯絡管理員處理。
          </p>{/if}
      </section>
      {#if !$profile.verified}<section class="panel panel-padding">
          <h2>完成校園身分驗證</h2>
          <p style="margin-bottom:18px">
            請輸入您在基本資料中登記的學生或教職員證號。
          </p>
          <form
            class="form-stack"
            onsubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
          >
            <label
              >校園證號<input
                bind:value={institutionalId}
                pattern={"[A-Za-z0-9]{6,16}"}
                maxlength="16"
                required
              /></label
            ><button class="button" disabled={busy}
              >{busy ? "正在驗證…" : "確認校園身分"}</button
            >
          </form>
        </section>{:else}<a class="button" href="/"
          >查詢教室<Icon name="arrow" size={18} /></a
        >{/if}
    </div>
  </div>
{/if}
