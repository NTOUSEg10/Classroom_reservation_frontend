<script lang="ts">
  import {
    initialize,
    notices,
    profile,
    api,
    json,
    message,
    refreshNotifications,
    enablePush,
  } from "$lib/api";
  import { formatDateTime } from "$lib/time";
  import Icon from "$lib/components/Icon.svelte";
  let loading = $state(true);
  let busy = $state("");
  let error = $state("");
  let success = $state("");
  $effect(() => {
    if ($profile?.id) void load();
    else loading = false;
  });
  async function load() {
    loading = true;
    error = "";
    try {
      await initialize();
      if ($profile) await refreshNotifications();
    } catch (cause) {
      error = message(cause);
    } finally {
      loading = false;
    }
  }
  async function read(id: string) {
    busy = id;
    try {
      await api(`/notifications/${id}/read`, {
        method: "PATCH",
        body: json({}),
      });
      await refreshNotifications();
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  async function push() {
    busy = "push";
    error = "";
    try {
      await enablePush();
      success = "背景推播已啟用，您可以在此裝置接收借用狀態通知。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
</script>

<svelte:head><title>通知中心 | 海大教室借用平台</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>通知中心</h1>
    <p>借用審核、鑰匙交還與帳號資格的最新消息。</p>
  </div>
  {#if $profile}<button
      class="button secondary"
      disabled={busy === "push"}
      onclick={push}
      ><Icon name="bell" size={17} />{busy === "push"
        ? "正在啟用…"
        : "啟用裝置推播"}</button
    >{/if}
</div>
{#if error}<div class="alert error" role="alert">
    {error}
  </div>{/if}{#if success}<div class="alert" role="status">{success}</div>{/if}
{#if loading}<div class="panel loading-row" role="status">
    正在載入通知…
  </div>{:else if !$profile}<div class="panel empty-state">
    <Icon name="bell" size={34} />
    <h2>登入後查看通知</h2>
    <p>申請狀態變更時，我們會將消息保存在通知中心。</p>
    <a class="button" href="/login">登入 / 註冊</a>
  </div>{:else if !$notices.length}<div class="panel empty-state">
    <Icon name="bell" size={34} />
    <h2>目前沒有新消息</h2>
    <p>借用申請與審核更新會顯示在這裡。</p>
    <button class="button secondary" onclick={load}>重新整理</button>
  </div>{:else}<section
    class="panel record-list"
    aria-label="通知列表"
    aria-live="polite"
  >
    {#each $notices as notice}<article
        class="notification-row"
        class:unread={!notice.read_at}
      >
        <span class="notice-dot" aria-label={notice.read_at ? "已讀" : "未讀"}
        ></span>
        <div>
          <h3>{notice.title}</h3>
          <p>{notice.body}</p>
          <time datetime={notice.created_at}
            >{formatDateTime(notice.created_at)}</time
          >{#if notice.reservation_id}<a class="text-link" href="/reservations"
              >查看借用紀錄</a
            >{/if}
        </div>
        {#if !notice.read_at}<button
            class="button secondary compact"
            disabled={busy === notice.id}
            onclick={() => read(notice.id)}>標記已讀</button
          >{/if}
      </article>{/each}
  </section>{/if}
