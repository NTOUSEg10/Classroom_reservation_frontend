<script lang="ts">
  import { api, message } from "$lib/api";
  import {
    weekDates,
    addDays,
    taipeiISO,
    dateInput,
    formatTime,
  } from "$lib/time";
  import type { Room, Collection, Reservation } from "$lib/types";
  import { motion } from "$lib/motion";
  let { rooms, date }: { rooms: Room[]; date: string } = $props();
  let selected = $state("");
  let events = $state<Reservation[]>([]);
  let error = $state("");
  let loading = $state(false);
  let activeDay = $state("");
  let weekOffset = $state(0);
  const preferredDay = $derived(addDays(date, weekOffset * 7));
  const days = $derived(weekDates(preferredDay));
  const currentDay = $derived(
    days.includes(activeDay) ? activeDay : preferredDay,
  );
  const currentRoom = $derived(
    rooms.some((room) => room.id === selected) ? selected : rooms[0]?.id || "",
  );
  let generation = 0;
  $effect(() => {
    date;
    weekOffset = 0;
  });
  $effect(() => {
    const id = currentRoom;
    const dates = days;
    if (id) void load(id, dates);
    else {
      events = [];
      loading = false;
      error = "";
    }
    return () => {
      generation++;
    };
  });
  async function load(id: string, dates: string[]) {
    const request = ++generation;
    loading = true;
    error = "";
    events = [];
    try {
      const result = await api<Collection<Reservation>>(
        `/rooms/${id}/schedule?${new URLSearchParams({ start: taipeiISO(dates[0], "00:00"), end: taipeiISO(addDays(dates[6], 1), "00:00") })}`,
      );
      if (request === generation) events = result.items;
    } catch (cause) {
      if (request === generation) {
        events = [];
        error = message(cause);
      }
    } finally {
      if (request === generation) loading = false;
    }
  }
  function eventStyle(event: Reservation) {
    const local = new Date(new Date(event.starts_at).getTime() + 8 * 3600_000);
    const minutes = local.getUTCHours() * 60 + local.getUTCMinutes() - 480;
    const duration =
      (new Date(event.ends_at).getTime() -
        new Date(event.starts_at).getTime()) /
      60_000;
    return `top:${(minutes / 840) * 100}%;height:${Math.max((duration / 840) * 100, 3)}%`;
  }
</script>

<section class="week-section" aria-label="教室週課表">
  <div class="week-tools">
    <label
      >選擇教室<select
        value={currentRoom}
        onchange={(event) => (selected = event.currentTarget.value)}
        disabled={!rooms.length}
        >{#each rooms as room}<option value={room.id}
            >{room.code}・{room.name}</option
          >{/each}</select
      ></label
    >
    <p>
      僅顯示已核准、已交付鑰匙的借用。<span class="legend-dot"></span>已占用
    </p>
  </div>
  <div class="week-navigation" aria-label="切換課表週次">
    <strong>{days[0]}–{days[6]}</strong>
    <div>
      <button
        type="button"
        class="button secondary compact"
        onclick={() => (weekOffset -= 1)}>上一週</button
      >
      <button
        type="button"
        class="button secondary compact"
        disabled={weekOffset === 0}
        onclick={() => (weekOffset = 0)}>回查詢日期當週</button
      >
      <button
        type="button"
        class="button secondary compact"
        onclick={() => (weekOffset += 1)}>下一週</button
      >
    </div>
  </div>
  {#if loading}<p class="muted" role="status">正在更新本週課表…</p>{/if}
  {#if error}<div class="alert error" role="alert">
      {error}<button class="text-button" onclick={() => load(currentRoom, days)}
        >重新載入課表</button
      >
    </div>{/if}
  <div class="day-switch" aria-label="切換課表日期">
    {#each days as day}<button
        class:active={currentDay === day}
        aria-pressed={currentDay === day}
        onclick={() => (activeDay = day)}>{day.slice(5)}</button
      >{/each}
  </div>
  <div
    class="week-grid"
    aria-busy={loading}
    use:motion={{ kind: "results", key: `${currentRoom}:${currentDay}` }}
  >
    <div class="time-column">
      <div class="day-heading">時間</div>
      {#each Array.from({ length: 15 }, (_, i) => i + 8) as hour}<span
          style:top="{((hour - 8) / 14) * 100}%"
          >{hour.toString().padStart(2, "0")}:00</span
        >{/each}
    </div>
    {#each days as day}
      <div class="day-column" class:mobile-current={currentDay === day}>
        <div class="day-heading" class:today={day === dateInput()}>
          <strong
            >{new Intl.DateTimeFormat("zh-TW", {
              weekday: "short",
              timeZone: "Asia/Taipei",
            }).format(new Date(`${day}T12:00:00+08:00`))}</strong
          ><span>{day.slice(5)}</span>
        </div>
        <div class="day-track">
          {#each Array.from({ length: 15 }, (_, i) => i) as index}<i
              style:top="{(index / 14) * 100}%"

            ></i>{/each}{#each events.filter((event) => dateInput(new Date(event.starts_at)) === day) as event}<div
              class="schedule-event"
              style={eventStyle(event)}
            >
              <strong>已占用</strong><span
                >{formatTime(event.starts_at)}–{formatTime(event.ends_at)}</span
              >
            </div>{/each}
        </div>
      </div>
    {/each}
  </div>
  {#if !currentRoom}<p class="muted">請先查詢並選擇教室。</p>
  {:else if !loading && !error && !events.length}<p class="muted">
      本週沒有已核准的借用，您可以選擇時段提出申請。
    </p>
  {:else if !loading && !error}<p class="muted">
      空白時段代表沒有已核准的借用。
    </p>{/if}
</section>

<style>
  .week-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }
  .week-navigation strong {
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  .week-navigation > div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .week-navigation button {
    min-height: 44px;
  }
  .time-column {
    height: 560px;
    margin-bottom: 0;
  }
</style>
