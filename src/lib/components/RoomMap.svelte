<script lang="ts">
  import { onMount } from "svelte";
  import type { Room } from "$lib/types";
  import { watchMap, type MapState } from "$lib/map-loader";
  import Icon from "./Icon.svelte";
  import { motion } from "$lib/motion";
  let { room }: { room: Room } = $props();
  let mapState = $state<MapState>("loading");
  let watcher: ReturnType<typeof watchMap> | undefined;
  let mapImage = $state<HTMLImageElement>();
  const source = $derived(room.map_url || "/campus-map.svg");
  const hasCoordinates = $derived(
    Number.isFinite(room.map_x) && Number.isFinite(room.map_y),
  );
  onMount(() => {
    watcher = watchMap((next) => (mapState = next));
    if (mapImage?.complete && mapImage.naturalWidth) watcher.loaded();
    if (!hasCoordinates) watcher.failed();
    return () => watcher?.dispose();
  });
</script>

<div class="room-map">
  {#if mapState !== "fallback"}
    <div class="map-frame" aria-busy={mapState === "loading"}>
      <img
        bind:this={mapImage}
        src={source}
        alt="校園幾何位置示意圖，教室位置詳見下方文字"
        width="700"
        height="440"
        onload={() => watcher?.loaded()}
        onerror={() => watcher?.failed()}
      />
      {#if mapState === "ready" && hasCoordinates}<div
          class="map-pin"
          style:left="{Math.max(0, Math.min(100, room.map_x!))}%"
          style:top="{Math.max(0, Math.min(100, room.map_y!))}%"
        >
          <Icon name="location" size={26} /><span
            use:motion={{ kind: "location" }}>{room.code}</span
          >
        </div>{/if}
      {#if mapState === "loading"}<span class="map-loading"
          >正在載入教室位置…</span
        >{/if}
    </div>
  {:else}<div class="map-fallback" role="status">
      <Icon name="location" size={28} /><strong>文字版位置描述</strong>
      <p>地圖暫時無法載入，請依下方位置前往教室。</p>
    </div>{/if}
  <div class="map-caption">
    <strong>{room.building}・{room.floor} 樓</strong>
    <p>{room.location_text}</p>
    {#if !room.location_verified}<small
        >示範位置，尚未經校方確認。請向系所確認實際位置。</small
      >{/if}{#if room.latitude != null && room.longitude != null}<small
        >座標 {room.latitude.toFixed(6)}, {room.longitude.toFixed(6)}</small
      >{/if}
  </div>
</div>
