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
    refreshNotifications,
  } from "$lib/api";
  import { formatDateTime, formatTime } from "$lib/time";
  import { borrowerOptions } from "$lib/borrower-options";
  import {
    type Reservation,
    type Profile,
    type Violation,
    type Room,
    type Collection,
    type Status,
    statusLabels,
  } from "$lib/types";
  import StatusBadge from "$lib/components/Status.svelte";
  import Icon from "$lib/components/Icon.svelte";
  type Tab = "pending" | "records" | "users" | "violations" | "maps";
  let tab = $state<Tab>("pending");
  let loading = $state(true);
  let busy = $state("");
  let error = $state("");
  let success = $state("");
  let records = $state<Reservation[]>([]);
  let users = $state<Profile[]>([]);
  let violations = $state<Violation[]>([]);
  let rooms = $state<Room[]>([]);
  let recordTotal = $state(0);
  let userTotal = $state(0);
  let violationTotal = $state(0);
  let recordOffset = $state(0);
  let userOffset = $state(0);
  let violationOffset = $state(0);
  let filterStatus = $state("");
  let decision = $state<{ id: string; status: Status } | null>(null);
  let reason = $state("");
  let violationUser = $state("");
  let violationReservation = $state("");
  let violationPoints = $state(1);
  let violationReason = $state("");
  let selectedViolationUser = $state<Profile | null>(null);
  const violationChoices = $derived(
    borrowerOptions(users, selectedViolationUser),
  );
  let mapRoom = $state("");
  let file = $state<File | null>(null);
  let inputFile = $state<HTMLInputElement>();
  const limit = 20;
  let generation = 0;
  let active = true;
  onDestroy(() => {
    active = false;
    generation++;
  });
  $effect(() => {
    if ($profile?.role === "admin") void load();
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
      if (
        !active ||
        current !== generation ||
        !owner ||
        $profile?.role !== "admin"
      )
        return;
      const valid = () =>
        active &&
        current === generation &&
        $session?.user.id === owner &&
        $profile?.role === "admin";
      if (tab === "pending" || tab === "records") {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(recordOffset),
        });
        if (tab === "pending") params.set("status", "pending");
        else if (filterStatus) params.set("status", filterStatus);
        const result = await api<Collection<Reservation>>(
          `/reservations?${params}`,
        );
        if (!valid()) return;
        records = result.items;
        recordTotal = result.total ?? result.items.length;
      } else if (tab === "users") {
        const result = await api<Collection<Profile>>(
          `/admin/users?limit=${limit}&offset=${userOffset}`,
        );
        if (!valid()) return;
        users = result.items;
        userTotal = result.total ?? result.items.length;
      } else if (tab === "violations") {
        const [result, userResult] = await Promise.all([
          api<Collection<Violation>>(
            `/admin/violations?limit=${limit}&offset=${violationOffset}`,
          ),
          api<Collection<Profile>>(
            `/admin/users?limit=${limit}&offset=${userOffset}`,
          ),
        ]);
        if (!valid()) return;
        violations = result.items;
        violationTotal = result.total ?? result.items.length;
        users = userResult.items;
        userTotal = userResult.total ?? userResult.items.length;
        selectedViolationUser =
          users.find((user) => user.id === violationUser) ??
          selectedViolationUser;
      } else {
        const result = await api<Collection<Room>>("/rooms");
        if (!valid()) return;
        rooms = result.items;
        mapRoom ||= rooms[0]?.id || "";
      }
    } catch (cause) {
      if (active && current === generation) error = message(cause);
    } finally {
      if (active && current === generation) loading = false;
    }
  }
  function changeTab(value: Tab) {
    tab = value;
    decision = null;
    recordOffset = 0;
    userOffset = 0;
    violationOffset = 0;
    success = "";
    void load();
  }
  function chooseStatus(id: string, status: Status) {
    decision = { id, status };
    reason = "";
  }
  async function updateStatus() {
    if (!decision) return;
    if (decision.status === "rejected" && !reason.trim()) {
      error = "拒絕申請時，請填寫原因。";
      return;
    }
    busy = decision.id;
    error = "";
    success = "";
    try {
      const updated = await api<Reservation>(
        `/reservations/${decision.id}/status`,
        {
          method: "PATCH",
          body: json({
            status: decision.status,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          }),
        },
      );
      decision = null;
      await load();
      await refreshNotifications();
      success = `借用紀錄已更新為「${statusLabels[updated.status]}」。`;
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  async function suspend(user: Profile) {
    busy = user.id;
    error = "";
    success = "";
    try {
      await api(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: json({ suspended: !user.suspended }),
      });
      await load();
      success = user.suspended
        ? "帳號已恢復借用資格。"
        : "帳號已停權，新的借用申請將立即被阻擋。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  async function addViolation() {
    busy = "violation";
    error = "";
    success = "";
    try {
      await api("/admin/violations", {
        method: "POST",
        body: json({
          user_id: violationUser,
          points: violationPoints,
          reason: violationReason.trim(),
          ...(violationReservation.trim()
            ? { reservation_id: violationReservation.trim() }
            : {}),
        }),
      });
      violationReason = "";
      violationReservation = "";
      violationOffset = 0;
      await load();
      success = "違規已記錄；有效違規達 3 點的帳號會自動停權。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  async function resolve(id: string) {
    busy = id;
    error = "";
    success = "";
    try {
      await api(`/admin/violations/${id}`, {
        method: "PATCH",
        body: json({ resolved: true }),
      });
      await load();
      success = "違規已結案。確認有效違規點數後，可至使用者頁恢復帳號。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  async function uploadMap() {
    if (!file) return;
    if (
      !["image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      error = "請上傳 2 MB 以內的 PNG 或 WebP 圖檔。";
      return;
    }
    busy = "map";
    error = "";
    success = "";
    try {
      const form = new FormData();
      form.append("file", file);
      await api(`/admin/rooms/${mapRoom}/map`, { method: "POST", body: form });
      file = null;
      if (inputFile) inputFile.value = "";
      await load();
      success = "教室圖資已上傳至受保護的儲存空間。";
    } catch (cause) {
      error = message(cause);
    } finally {
      busy = "";
    }
  }
  const transitions: Record<
    Status,
    { label: string; next: Status; icon: string }[]
  > = {
    pending: [
      { label: "核准", next: "approved", icon: "check" },
      { label: "拒絕", next: "rejected", icon: "close" },
      { label: "取消借用", next: "cancelled", icon: "close" },
    ],
    approved: [
      { label: "交付鑰匙", next: "checked_out", icon: "key" },
      { label: "取消借用", next: "cancelled", icon: "close" },
    ],
    checked_out: [{ label: "記錄歸還", next: "completed", icon: "key" }],
    completed: [],
    cancelled: [],
    rejected: [],
  };
</script>

<svelte:head><title>管理台 | 海大教室借用平台</title></svelte:head>
<div class="page-heading">
  <div>
    <h1>借用管理台</h1>
    <p>審核借用申請、追蹤鑰匙交還，並管理借用資格。</p>
  </div>
  {#if $profile?.role === "admin"}<button
      class="button secondary"
      onclick={load}><Icon name="refresh" size={17} />重新整理</button
    >{/if}
</div>
{#if error}<div class="alert error" role="alert">
    {error}
  </div>{/if}{#if success}<div class="alert" role="status">{success}</div>{/if}
{#if !$profile && !loading}<div class="panel empty-state">
    <Icon name="shield" size={34} />
    <h2>請登入管理員帳號</h2>
    <p>此頁面僅供授權的系統管理員使用。</p>
    <a class="button" href="/login">前往登入</a>
  </div>{:else if $profile && $profile.role !== "admin"}<div
    class="panel empty-state"
  >
    <Icon name="shield" size={34} />
    <h2>您沒有管理台存取權限</h2>
    <p>若需要管理權限，請聯絡系統管理員。</p>
    <a class="button" href="/">返回教室查詢</a>
  </div>{:else}<div class="admin-tabs" aria-label="管理項目">
    <button
      class:active={tab === "pending"}
      aria-pressed={tab === "pending"}
      onclick={() => changeTab("pending")}>待審申請</button
    ><button
      class:active={tab === "records"}
      aria-pressed={tab === "records"}
      onclick={() => changeTab("records")}>借用紀錄</button
    ><button
      class:active={tab === "users"}
      aria-pressed={tab === "users"}
      onclick={() => changeTab("users")}>使用者</button
    ><button
      class:active={tab === "violations"}
      aria-pressed={tab === "violations"}
      onclick={() => changeTab("violations")}>違規管理</button
    ><button
      class:active={tab === "maps"}
      aria-pressed={tab === "maps"}
      onclick={() => changeTab("maps")}>教室圖資</button
    >
  </div>
  {#if loading}<div class="panel loading-row" role="status">
      正在載入管理資料…
    </div>{:else if tab === "pending" || tab === "records"}
    {#if tab === "records"}<div class="admin-toolbar">
        <label
          >借用狀態<select
            bind:value={filterStatus}
            onchange={() => {
              recordOffset = 0;
              void load();
            }}
            ><option value="">所有狀態</option
            >{#each Object.entries(statusLabels) as [value, label]}<option
                {value}>{label}</option
              >{/each}</select
          ></label
        >
      </div>{/if}
    {#if records.length}<section
        class="panel record-list"
        aria-label="管理借用紀錄"
      >
        {#each records as record}<article class="record">
            <div class="record-top">
              <h3>{record.room_name || "教室借用"}</h3>
              <StatusBadge status={record.status} />
            </div>
            <div class="record-details">
              <span
                ><Icon name="user" size={16} />{record.user_name ||
                  record.user_id}</span
              ><span
                ><Icon name="calendar" size={16} />{formatDateTime(
                  record.starts_at,
                )}–{formatTime(record.ends_at)}</span
              ><span><Icon name="users" size={16} />{record.attendees} 人</span>
            </div>
            <p class="record-purpose">{record.purpose}</p>
            {#if record.decision_reason}<p class="record-note">
                審核說明：{record.decision_reason}
              </p>{/if}{#if record.key_handed_at}<p class="record-note">
                交付鑰匙：{formatDateTime(record.key_handed_at)}
              </p>{/if}{#if record.key_returned_at}<p class="record-note">
                歸還鑰匙：{formatDateTime(record.key_returned_at)}
              </p>{/if}{#if decision?.id === record.id}<form
                class="inline-form"
                onsubmit={(event) => {
                  event.preventDefault();
                  void updateStatus();
                }}
              >
                <label
                  >{decision.status === "rejected"
                    ? "拒絕原因（必填）"
                    : "操作說明（選填）"}<input
                    bind:value={reason}
                    required={decision.status === "rejected"}
                    maxlength="500"
                    placeholder={decision.status === "rejected"
                      ? "請說明無法核准的原因"
                      : "備註操作原因"}
                  /></label
                ><button class="button compact" disabled={busy === record.id}
                  >{busy === record.id
                    ? "更新中…"
                    : `確認${transitions[record.status].find((item) => item.next === decision?.status)?.label || "更新"}`}</button
                ><button
                  type="button"
                  class="button secondary compact"
                  onclick={() => (decision = null)}>返回</button
                >
              </form>{:else}<div class="record-actions">
                {#each transitions[record.status] as action}<button
                    class="button compact"
                    class:secondary={action.next === "cancelled" ||
                      action.next === "rejected"}
                    onclick={() => chooseStatus(record.id, action.next)}
                    ><Icon name={action.icon} size={16} />{action.label}</button
                  >{/each}
              </div>{/if}
            <p class="record-note">紀錄編號：{record.id}</p>
          </article>{/each}
      </section>
      <div class="pagination">
        <span
          >{recordOffset + 1}–{Math.min(recordOffset + limit, recordTotal)} / {recordTotal}
          筆</span
        ><button
          class="button secondary compact"
          disabled={!recordOffset}
          onclick={() => {
            recordOffset -= limit;
            void load();
          }}>上一頁</button
        ><button
          class="button secondary compact"
          disabled={recordOffset + limit >= recordTotal}
          onclick={() => {
            recordOffset += limit;
            void load();
          }}>下一頁</button
        >
      </div>{:else}<div class="panel empty-state">
        <Icon name="check" size={34} />
        <h2>
          {tab === "pending" ? "目前沒有待審申請" : "沒有符合條件的借用紀錄"}
        </h2>
        <p>新的借用申請會顯示於待審申請。</p>
      </div>{/if}
  {:else if tab === "users"}<section
      class="panel record-list"
      aria-label="使用者列表"
    >
      {#each users as user}<article class="user-row">
          <div class="record-top">
            <div>
              <h3>
                {user.name}<span class="role-tag"
                  >{user.role === "admin" ? "管理員" : "借用人"}</span
                >
              </h3>
              <p>{user.department}・{user.institutional_id}</p>
              <p>{user.email}・{user.phone}</p>
              <p>
                身分：{user.verified
                  ? "已驗證"
                  : "未驗證"}・帳號：{user.suspended ? "已停權" : "正常"}
              </p>
            </div>
            <button
              class="button compact"
              class:secondary={!user.suspended}
              disabled={busy === user.id || user.id === $profile?.id}
              onclick={() => suspend(user)}
              >{busy === user.id
                ? "更新中…"
                : user.suspended
                  ? "恢復帳號"
                  : "停權帳號"}</button
            >
          </div>
        </article>{/each}
    </section>
    <div class="pagination">
      <span
        >{userOffset + 1}–{Math.min(userOffset + limit, userTotal)} / {userTotal}
        人</span
      ><button
        class="button secondary compact"
        disabled={!userOffset}
        onclick={() => {
          userOffset -= limit;
          void load();
        }}>上一頁</button
      ><button
        class="button secondary compact"
        disabled={userOffset + limit >= userTotal}
        onclick={() => {
          userOffset += limit;
          void load();
        }}>下一頁</button
      >
    </div>
  {:else if tab === "violations"}<section
      class="panel panel-padding"
      style="margin-bottom:25px"
    >
      <h2>記錄違規</h2>
      <p class="record-note">
        有效違規達 3 點時自動停權；結案後，可由管理員恢復帳號。
      </p>
      <nav class="pagination" aria-label="違規借用人名單分頁">
        <span id="violation-user-page"
          >使用者 {userTotal ? userOffset + 1 : 0}–{Math.min(
            userOffset + limit,
            userTotal,
          )} / {userTotal} 人</span
        ><button
          type="button"
          class="button secondary compact"
          aria-label="上一頁使用者"
          disabled={!userOffset || busy !== ""}
          onclick={() => {
            userOffset -= limit;
            void load();
          }}>上一頁</button
        ><button
          type="button"
          class="button secondary compact"
          aria-label="下一頁使用者"
          disabled={userOffset + limit >= userTotal || busy !== ""}
          onclick={() => {
            userOffset += limit;
            void load();
          }}>下一頁</button
        >
      </nav>
      <form
        class="form-stack"
        style="margin-top:20px"
        onsubmit={(event) => {
          event.preventDefault();
          void addViolation();
        }}
      >
        <div class="form-row">
          <label
            >違規借用人<select
              bind:value={violationUser}
              onchange={(event) =>
                (selectedViolationUser =
                  violationChoices.find(
                    (user) => user.id === event.currentTarget.value,
                  ) ?? null)}
              aria-describedby="violation-user-page violation-user-help"
              required
              ><option value="">請選擇使用者</option
              >{#each violationChoices as user (user.id)}<option value={user.id}
                  >{user.name}・{user.institutional_id}{#if user.id === violationUser && !users.some((current) => current.id === user.id)}（已選擇）{/if}</option
                >{/each}</select
            ><span id="violation-user-help" class="form-help"
              >切換名單頁次時，已選擇的借用人會保留。</span
            ></label
          ><label
            >違規點數<input
              type="number"
              bind:value={violationPoints}
              min="1"
              max="3"
              required
            /></label
          >
        </div>
        <label
          >關聯借用編號（選填）<input
            bind:value={violationReservation}
            placeholder="借用紀錄 UUID"
          /></label
        ><label
          >違規原因<textarea
            bind:value={violationReason}
            minlength="2"
            maxlength="500"
            required
            placeholder="例如：未依時歸還鑰匙"></textarea></label
        ><button class="button" disabled={busy === "violation"}
          >{busy === "violation" ? "正在記錄…" : "新增違規"}</button
        >
      </form>
    </section>
    {#if violations.length}<section
        class="panel record-list"
        aria-label="違規紀錄"
      >
        {#each violations as violation (violation.id)}<article class="record">
            <div class="record-top">
              <h3>
                {violation.user_name ||
                  users.find((user) => user.id === violation.user_id)?.name ||
                  violation.user_id}・{violation.points} 點
              </h3>
              <span class="status" class:pending={!violation.resolved}
                >{violation.resolved ? "已結案" : "未結案"}</span
              >
            </div>
            <p class="record-purpose">{violation.reason}</p>
            {#if violation.institutional_id}<p class="record-note">
                借用人編號：{violation.institutional_id}
              </p>{/if}
            <p class="record-note">
              記錄時間：{formatDateTime(violation.created_at)}
            </p>
            {#if !violation.resolved}<button
                class="button secondary compact"
                style="margin-top:12px"
                disabled={busy === violation.id}
                onclick={() => resolve(violation.id)}
                >{busy === violation.id ? "更新中…" : "違規結案"}</button
              >{/if}
          </article>{/each}
      </section>
      <nav class="pagination" aria-label="違規紀錄分頁">
        <span
          >{violationOffset + 1}–{Math.min(
            violationOffset + limit,
            violationTotal,
          )} / {violationTotal} 筆</span
        ><button
          type="button"
          class="button secondary compact"
          aria-label="上一頁違規紀錄"
          disabled={!violationOffset || busy !== ""}
          onclick={() => {
            violationOffset -= limit;
            void load();
          }}>上一頁</button
        ><button
          type="button"
          class="button secondary compact"
          aria-label="下一頁違規紀錄"
          disabled={violationOffset + limit >= violationTotal || busy !== ""}
          onclick={() => {
            violationOffset += limit;
            void load();
          }}>下一頁</button
        >
      </nav>{:else}<div class="panel empty-state">
        <h2>目前沒有違規紀錄</h2>
        <p>新增的違規及結案情況會保存在這裡。</p>
      </div>{/if}
  {:else if tab === "maps"}<section
      class="panel panel-padding"
      style="max-width:650px"
    >
      <h2>上傳教室位置圖</h2>
      <p class="record-note">
        使用經校方確認的平面圖。限 PNG 或 WebP、2 MB 以內，儲存在 Supabase
        的受保護空間。
      </p>
      <form
        class="form-stack"
        style="margin-top:20px"
        onsubmit={(event) => {
          event.preventDefault();
          void uploadMap();
        }}
      >
        <label
          >教室<select bind:value={mapRoom} required
            >{#each rooms as room}<option value={room.id}
                >{room.code}・{room.name}</option
              >{/each}</select
          ></label
        ><label
          >教室圖資<input
            bind:this={inputFile}
            type="file"
            accept="image/png,image/webp"
            required
            onchange={(event) =>
              (file = event.currentTarget.files?.[0] ?? null)}
          /></label
        >{#if rooms.find((room) => room.id === mapRoom)?.map_url}<p
            class="form-help"
          >
            此教室已設定圖資；上傳後會取代目前圖檔。
          </p>{/if}<button class="button" disabled={!file || busy === "map"}
          >{busy === "map" ? "正在上傳…" : "上傳圖資"}</button
        >
      </form>
    </section>{/if}{/if}
