<script lang="ts">
  import { statusLabels, type Status } from "$lib/types";
  import { motion } from "$lib/motion";
  let { status }: { status: Status } = $props();
</script>

<span class="status {status}" use:motion={{ kind: "status", key: status }}
  ><span class="status-dot"></span>{statusLabels[status]}</span
>
