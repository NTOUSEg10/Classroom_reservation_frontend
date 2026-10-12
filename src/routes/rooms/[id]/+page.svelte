<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { api, json, message, profile, initialize } from "$lib/api";
  import {
    dateInput,
    taipeiISO,
    validateSlot,
    formatDateTime,
  } from "$lib/time";
  import type { Room, Collection, Eligibility, Reservation } from "$lib/types";
  import Icon from "$lib/components/Icon.svelte";
  import RoomMap from "$lib/components/RoomMap.svelte";
  import Status from "$lib/components/Status.svelte";
  let room = $state<Room | null>(null);
  let eligibility = $state<Eligibility | null>(null);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state("");
  let formError = $state("");
  let date = $state(dateInput());
  let start = $state("09:00");
  let end = $state("11:00");
  let mode = $state<"scheduled" | "immediate">("scheduled");
  let attendees = $state(1);
  let purpose = $state("");
  let created = $state<Reservation | null>(null);
  let requestId = crypto.randomUUID();
  let lastPayload = "";
  onMount(() => {
    date = page.url.searchParams.get("date") || date;
    start = page.url.searchParams.get("start") || start;
    end = page.url.searchParams.get("end") || end;
    void load();
  });
  async function load() {
    loading = true;
    error = "";
    try {
      const result = await api<Collection<Room>>("/rooms");
      room = result.items.find((item) => item.id === page.params.id) || null;
      if (!room) throw new Error("找不到此教室，請回到教室列表重新選擇。");
      await initialize();
      if ($profile) eligibility = await api<Eligibility>("/me/eligibility");
    } catch (cause) {
      error = message(cause);
    } finally {
      loading = false;
    }
  }
  function setMode(value: "immediate" | "scheduled") {
    mode = value;
    formError = "";
    if (value === "immediate") {
      const now = new Date();
      const local = new Date(now.getTime() + 8 * 3600_000);
      const minutes =
        Math.ceil((local.getUTCHours() * 60 + local.getUTCMinutes()) / 5) * 5;
      date = dateInput(now);
      start = `${Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
      const ending = Math.min(minutes + 60, 1320);
      end = `${Math.floor(ending / 60)
        .toString()
        .padStart(2, "0")}:${(ending % 60).toString().padStart(2, "0")}`;
      if (minutes < 480 || minutes > 1290)
        formError = "目前不在可即時借用時段，請改用預約借用。";
    }
  }
  async function submit() {
    if (!room || submitting) return;
    formError = validateSlot(date, start, end, new Date(), true);
    if (!purpose.trim()) formError = "請填寫借用用途。";
    if (attendees < 1 || attendees > room.capacity)
      formError = `借用人數需介於 1 至 ${room.capacity} 人。`;
    if (formError) return;
    const payload = {
      room_id: room.id,
      starts_at: taipeiISO(date, start),
      ends_at: taipeiISO(date, end),
      purpose: purpose.trim(),
      attendees,
      mode,
    };
    const fingerprint = json(payload);
    if (lastPayload && lastPayload !== fingerprint)
      requestId = crypto.randomUUID();
    lastPayload = fingerprint;
    submitting = true;
    try {
      created = await api<Reservation>("/reservations", {
        method: "POST",
        body: json({
          ...payload,
          request_id: requestId,
        }),
      });
      requestId = crypto.randomUUID();
    } catch (cause) {
      formError = message(cause);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head
  ><title>{room?.name || "教室詳情"} | 海大教室借用平台</title></svelte:head
>
<a class="back-link" href="/"><Icon name="back" size={17} />返回教室列表</a>
{#if loading}<div class="panel loading-row" role="status">
    正在載入教室資訊…
  </div>
{:else if error}<div class="alert error" role="alert">
    {error}<button class="text-button" onclick={load}>重新載入</button>
  </div>
{:else if created}<div class="panel success-page" role="status">
    <div class="success-icon"><Icon name="check" size={27} /></div>
    <h1>借用申請已送出</h1>
    <p>
      {room?.name}・{formatDateTime(created.starts_at)}<br />目前狀態：<Status
        status={created.status}
      />。管理員審核後，您會收到通知。
    </p>
    <div class="success-actions">
      <a class="button" href="/reservations"
        >查看我的借用<Icon name="arrow" size={17} /></a
      ><a class="button secondary" href="/">繼續查詢教室</a>
    </div>
  </div>
{:else if room}<div class="page-heading">
    <div>
      <h1>{room.code}・{room.name}</h1>
      <p>{room.building}・{room.floor} 樓，依所需時段提出借用申請。</p>
    </div>
  </div>
  <div class="detail-grid">
    <div class="detail-info">
      <section class="panel panel-padding">
        <h2>教室資訊</h2>
        <div class="detail-facts">
          <div><Icon name="users" />可容納 {room.capacity} 人</div>
          <div><Icon name="clock" />開放 08:00–22:00</div>
        </div>
        <div class="equipment">
          {#each room.equipment as item}<span>{item}</span>{/each}
        </div>
        <p class="record-note">
          申請須經管理員審核。同時段可能有多筆申請，核准以通知結果為準。
        </p>
      </section>
      <section class="panel panel-padding">
        <div class="section-head">
          <Icon name="location" />
          <h2>教室位置</h2>
        </div>
        <RoomMap {room} />
      </section>
      <section class="panel panel-padding">
        <h2>借用提醒</h2>
        <p class="record-note">
          每次借用 30 分鐘至 8 小時，可預約未來 90
          天。借用前請向管理員領取鑰匙；使用結束後，請恢復教室並完成歸還。
        </p>
      </section>
    </div>
    <section class="panel panel-padding form-panel">
      <h2>提出借用申請</h2>
      <p class="form-help">時區：臺北（UTC+8）。即時借用仍須經管理員核准。</p>
      {#if !$profile}<div class="alert warning">
          請登入並完成校園身分驗證後提出申請。
        </div>
        <a class="button full-width" href="/login">登入 / 註冊</a
        >{:else if !eligibility?.eligible}<div class="alert warning">
          {eligibility?.reason || "請先完成校園身分驗證，確認借用資格。"}
        </div>
        <a class="button full-width" href="/account">查看帳戶與借用資格</a
        >{:else}<form
          class="form-stack"
          onsubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div class="segmented">
            <button
              type="button"
              class:active={mode === "scheduled"}
              aria-pressed={mode === "scheduled"}
              onclick={() => setMode("scheduled")}>預約借用</button
            ><button
              type="button"
              class:active={mode === "immediate"}
              aria-pressed={mode === "immediate"}
              onclick={() => setMode("immediate")}>即時借用</button
            >
          </div>
          <label
            >借用日期<input
              type="date"
              bind:value={date}
              min={dateInput()}
              readonly={mode === "immediate"}
              required
            /></label
          >
          <div class="form-row">
            <label
              >開始時間<input
                type="time"
                bind:value={start}
                min="08:00"
                max="21:30"
                readonly={mode === "immediate"}
                required
              /></label
            ><label
              >結束時間<input
                type="time"
                bind:value={end}
                min="08:30"
                max="22:00"
                required
              /></label
            >
          </div>
          <label
            >借用人數<input
              type="number"
              bind:value={attendees}
              min="1"
              max={room.capacity}
              required
            /><span class="form-help"
              >包含提出申請的借用人，最多 {room.capacity} 人。</span
            ></label
          ><label
            >借用用途<textarea
              bind:value={purpose}
              placeholder="例如：專題小組討論、系學會會議"
              minlength="2"
              maxlength="500"
              required></textarea></label
          >{#if formError}<div class="alert error" role="alert">
              {formError}
            </div>{/if}<button class="button" disabled={submitting}
            >{submitting ? "正在送出申請…" : "送出借用申請"}<Icon
              name="arrow"
              size={18}
            /></button
          >
          <p class="form-help">
            送出後為「申請中」，審核結果請至我的借用或通知中心確認。
          </p>
        </form>{/if}
    </section>
  </div>{/if}
