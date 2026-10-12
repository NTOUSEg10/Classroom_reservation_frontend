<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    api,
    initialize,
    profile,
    session,
    ready,
    json,
    message,
  } from "$lib/api";
  import { formatDateTime, formatTime } from "$lib/time";
  import {
    statusLabels,
    type Reservation,
    type Collection,
    type Status,
  } from "$lib/types";
  import StatusBadge from "$lib/components/Status.svelte";
  import Icon from "$lib/components/Icon.svelte";
  let records = $state<Reservation[]>([]);
  let total = $state(0);
  let offset = $state(0);
  let status = $state("");
  let loading = $state(true);
  let busy = $state("");
  let error = $state("");
  let success = $state("");
  let cancelling = $state("");
  const limit = 10;
  let generation = 0;
  let active = true;
  onDestroy(() => {
    active = false;
    generation++;
  });
  $effect(() => {
    if ($profile?.id) void load();
    else loading = !$ready;
  });
  async function load() {
    if (!active) return;
    const current = ++generation;
    loading = true;
    error = "";
    try {
      await initialize();
      const owner = $session?.user.id;
      if (!active || current !== generation || !$profile || !owner) return;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (status) params.set("status", status);
      const result = await api<Collection<Reservation>>(
        `/reservations?${params}`,
      );
      if (active && current === generation && $session?.user.id === owner) {
        records = result.items;
        total = result.total ?? result.items.length;
      }
    } catch (cause) {
      if (active && current === generation) error = message(cause);
    } finally {
      if (active && current === generation) loading = false;
    }
  }
  async function cancel(id: string) {
    busy = id;
    error = "";
    try {
      await api(`/reservations/${id}/status`, {
        method: "PATCH",
        body: json({ status: "cancelled" }),
      });
      cancelling = "";
      await load();
      success = "借用申請已取消。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
</script>

<svelte:head><title>我的借用 | 海大教室借用平台</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>我的借用</h1>
    <p>追蹤申請進度、查看借用歷史，並掌握鑰匙交還情況。</p>
  </div>
  <a class="button" href="/">新增借用<Icon name="arrow" size={17} /></a>
</div>
{#if error}<div class="alert error" role="alert">
    {error}<button class="text-button" onclick={load}>重新載入</button>
  </div>{/if}{#if success}<div class="alert" role="status">{success}</div>{/if}
{#if loading}<div class="panel loading-row" role="status">
    正在載入借用紀錄…
  </div>{:else if !$profile}<div class="panel empty-state">
    <Icon name="calendar" size={34} />
    <h2>登入後查看借用紀錄</h2>
    <p>每筆申請、審核結果與鑰匙交還情況都會保存在這裡。</p>
    <a class="button" href="/login">登入 / 註冊</a>
  </div>{:else}<div class="admin-toolbar">
    <label
      >借用狀態<select
        bind:value={status}
        onchange={() => {
          offset = 0;
          void load();
        }}
        ><option value="">所有狀態</option
        >{#each Object.entries(statusLabels) as [value, label]}<option {value}
            >{label}</option
          >{/each}</select
      ></label
    ><button class="button secondary" onclick={load}
      ><Icon name="refresh" size={17} />重新整理</button
    >
  </div>
  {#if records.length}<section class="panel record-list" aria-label="借用歷史">
      {#each records as record}<article class="record">
          <div class="record-top">
            <h3>{record.room_name || "教室借用"}</h3>
            <StatusBadge status={record.status} />
          </div>
          <div class="record-details">
            <span
              ><Icon name="calendar" size={16} />{formatDateTime(
                record.starts_at,
              )}–{formatTime(record.ends_at)}</span
            ><span><Icon name="users" size={16} />{record.attendees} 人</span
            ><span>{record.mode === "immediate" ? "即時借用" : "預約借用"}</span
            >
          </div>
          <p class="record-purpose">{record.purpose}</p>
          {#if record.decision_reason}<p class="record-note">
              管理員說明：{record.decision_reason}
            </p>{/if}{#if record.key_handed_at}<p class="record-note">
              交付鑰匙：{formatDateTime(record.key_handed_at)}
            </p>{/if}{#if record.key_returned_at}<p class="record-note">
              歸還鑰匙：{formatDateTime(record.key_returned_at)}
            </p>{/if}{#if record.status === "pending" || record.status === "approved"}{#if cancelling === record.id}<div
                class="cancel-form"
              >
                <span>確定取消這筆借用？</span><button
                  class="button danger compact"
                  disabled={busy === record.id}
                  onclick={() => cancel(record.id)}
                  >{busy === record.id ? "取消中…" : "確認取消"}</button
                ><button
                  class="button secondary compact"
                  onclick={() => (cancelling = "")}>保留借用</button
                >
              </div>{:else}<button
                class="text-button"
                onclick={() => (cancelling = record.id)}>取消借用</button
              >{/if}{/if}
        </article>{/each}
    </section>
    <div class="pagination">
      <span>{offset + 1}–{Math.min(offset + limit, total)} / {total} 筆</span
      ><button
        class="button secondary compact"
        disabled={offset === 0}
        onclick={() => {
          offset -= limit;
          void load();
        }}>上一頁</button
      ><button
        class="button secondary compact"
        disabled={offset + limit >= total}
        onclick={() => {
          offset += limit;
          void load();
        }}>下一頁</button
      >
    </div>{:else}<div class="panel empty-state">
      <Icon name="calendar" size={34} />
      <h2>尚無{status ? statusLabels[status as Status] : ""}借用紀錄</h2>
      <p>選擇適合的教室與時段，開始您的第一筆借用。</p>
      <a class="button" href="/">查詢教室</a>
    </div>{/if}{/if}
