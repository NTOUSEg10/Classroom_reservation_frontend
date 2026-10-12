<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { api, message } from "$lib/api";
  import { dateInput, taipeiISO, validateSlot } from "$lib/time";
  import type { Room, Collection } from "$lib/types";
  import Icon from "$lib/components/Icon.svelte";
  import WeekSchedule from "$lib/components/WeekSchedule.svelte";
  import { motion } from "$lib/motion";
  let date = $state(dateInput());
  let start = $state("09:00");
  let end = $state("11:00");
  let building = $state("");
  let capacity = $state<number | undefined>(undefined);
  let equipment = $state<string[]>([]);
  let allRooms = $state<Room[]>([]);
  let rooms = $state<Room[]>([]);
  let view = $state<"list" | "week">("list");
  let loading = $state(true);
  let error = $state("");
  let queried = $state({ date: dateInput(), start: "09:00", end: "11:00" });
  const buildings = $derived([
    ...new Set(allRooms.map((room) => room.building)),
  ]);
  const equipmentChoices = $derived([
    ...new Set(allRooms.flatMap((room) => room.equipment)),
  ]);
  const availableCount = $derived(
    rooms.filter((room) => room.available).length,
  );
  let request = 0;
  onMount(() => {
    date = page.url.searchParams.get("date") || date;
    start = page.url.searchParams.get("start") || start;
    end = page.url.searchParams.get("end") || end;
    void load();
  });
  async function load() {
    const currentRequest = ++request;
    const snapshot = {
      date,
      start,
      end,
      building,
      capacity,
      equipment: [...equipment],
    };
    error = validateSlot(snapshot.date, snapshot.start, snapshot.end);
    if (error) {
      loading = false;
      return;
    }
    loading = true;
    try {
      const params = new URLSearchParams({
        start: taipeiISO(snapshot.date, snapshot.start),
        end: taipeiISO(snapshot.date, snapshot.end),
      });
      if (snapshot.building) params.set("building", snapshot.building);
      if (snapshot.capacity) params.set("capacity", String(snapshot.capacity));
      snapshot.equipment.forEach((item) => params.append("equipment", item));
      const [result, catalogue] = await Promise.all([
        api<Collection<Room>>(`/rooms/availability?${params}`),
        allRooms.length
          ? Promise.resolve({ items: allRooms })
          : api<Collection<Room>>("/rooms"),
      ]);
      if (currentRequest === request) {
        rooms = result.items;
        allRooms = catalogue.items;
        queried = {
          date: snapshot.date,
          start: snapshot.start,
          end: snapshot.end,
        };
      }
    } catch (cause) {
      if (currentRequest === request) {
        rooms = [];
        error = message(cause);
      }
    } finally {
      if (currentRequest === request) loading = false;
    }
  }
  function reset() {
    building = "";
    capacity = undefined;
    equipment = [];
    void load();
  }
  const roomLink = (room: Room) =>
    `/rooms/${room.id}?${new URLSearchParams({ date: queried.date, start: queried.start, end: queried.end })}`;
</script>

<svelte:head><title>查詢教室 | 海大教室借用平台</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>找到適合的教室</h1>
    <p>選擇日期與時段，查看教室空間、設備與借用狀況。</p>
  </div>
</div>
<form
  class="panel filter-panel"
  onsubmit={(event) => {
    event.preventDefault();
    void load();
  }}
>
  <div class="filter-top">
    <label
      >借用日期<input
        aria-label="借用日期"
        type="date"
        bind:value={date}
        required
      /></label
    >
    <label
      >開始時間<input
        aria-label="開始時間"
        type="time"
        bind:value={start}
        min="08:00"
        max="22:00"
        required
      /></label
    >
    <label
      >結束時間<input
        aria-label="結束時間"
        type="time"
        bind:value={end}
        min="08:00"
        max="22:00"
        required
      /></label
    >
    <label
      >系館<select aria-label="系館" bind:value={building}
        ><option value="">所有系館</option>{#each buildings as item}<option
            value={item}>{item}</option
          >{/each}</select
      ></label
    >
    <button class="button" disabled={loading}
      ><Icon name="search" size={18} />{loading
        ? "查詢中…"
        : "查詢教室"}</button
    >
  </div>
  <div class="filter-bottom">
    <label
      >容納人數<input
        aria-label="容納人數"
        type="number"
        min="1"
        max="1000"
        bind:value={capacity}
        placeholder="不限"
      /> 人以上</label
    >
    {#each equipmentChoices.slice(0, 4) as item}<label class="check-label"
        ><input
          type="checkbox"
          value={item}
          bind:group={equipment}
        />{item}</label
      >{/each}
    <button class="text-button reset" type="button" onclick={reset}
      >清除條件</button
    >
  </div>
</form>
{#if error}<div class="alert error" role="alert">
    {error}<button class="text-button" onclick={load}>重新查詢</button>
  </div>{/if}
<div class="results-heading">
  <h2>
    教室查詢結果<span
      >{loading
        ? "正在更新使用狀況"
        : `${queried.date}・${queried.start}–${queried.end}・${availableCount} 間可借用`}</span
    >
  </h2>
  <div class="segmented" aria-label="結果顯示方式">
    <button
      class:active={view === "list"}
      aria-pressed={view === "list"}
      onclick={() => (view = "list")}
      ><Icon name="list" size={16} />教室列表</button
    ><button
      class:active={view === "week"}
      aria-pressed={view === "week"}
      onclick={() => (view = "week")}
      ><Icon name="calendar" size={16} />週課表</button
    >
  </div>
</div>
{#if loading}<div class="panel loading-row" role="status">
    正在查詢教室使用狀況…
  </div>
{:else if !rooms.length}<div class="panel empty-state">
    <Icon name="search" size={34} />
    <h2>{error ? "目前無法取得教室資訊" : "沒有符合條件的教室"}</h2>
    <p>
      {error
        ? "請重新查詢，或稍後再試。"
        : "試著減少設備或人數限制，或選擇其他系館。"}
    </p>
    <button class="button secondary" onclick={reset}>重新查詢</button>
  </div>
{:else if view === "week"}<WeekSchedule {rooms} date={queried.date} />
{:else}<section
    class="panel room-list"
    aria-label="教室列表"
    use:motion={{ kind: "results" }}
  >
    <div class="room-list-header">
      <span>教室 / 位置</span><span>設備</span><span>容量</span><span
        >時段狀態</span
      ><span></span>
    </div>
    {#each rooms as room}<article class="room-row">
        <div class="room-identity">
          <div class="room-monogram"><Icon name="building" size={24} /></div>
          <div>
            <h3><span class="room-code">{room.code}</span>{room.name}</h3>
            <p>{room.building}・{room.floor} 樓</p>
          </div>
        </div>
        <div class="equipment">
          {#each room.equipment as item}<span>{item}</span>{/each}
        </div>
        <div class="capacity">{room.capacity}<small>人</small></div>
        <div class="availability" class:busy={!room.available}>
          <span class="availability-dot"></span>{room.available
            ? "可借用"
            : "已占用"}
        </div>
        <a class="button secondary compact" href={roomLink(room)}
          >查看教室<Icon name="arrow" size={15} /></a
        >
      </article>{/each}
  </section>{/if}
<div class="help-strip">
  <Icon name="shield" size={18} />
  <p>
    借用申請需完成校園身分驗證，並由管理員審核。可借用狀態會隨審核結果更新；送出申請後，請留意通知中心。
  </p>
</div>
