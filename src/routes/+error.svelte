<script lang="ts">
  import { page } from "$app/state";
  import Icon from "$lib/components/Icon.svelte";
</script>

<div class="panel empty-state">
  <Icon name="location" size={34} />
  <h1>{page.status === 404 ? "找不到這個頁面" : "頁面暫時無法載入"}</h1>
  <p>
    {page.status === 404
      ? "網址可能已變更，請回到教室查詢繼續操作。"
      : "請稍後重新整理，或回到教室查詢。"}
  </p>
  <a class="button" href="/">返回教室查詢</a>
</div>
