---
version: 1
slug: "frontend-src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets:
  [
    "src/routes/admin/+page.svelte",
    "src/routes/rooms/[id]/+page.svelte",
    "src/routes/login/+page.svelte",
    "src/routes/auth/callback/+page.svelte",
    "src/routes/account/+page.svelte",
    "src/lib/motion.ts",
  ]
---

# 教室借用介面方向契約

## Direction contract

**THESIS:** 可比較的教室資訊與明確借用狀態；主畫面直接開始查詢，不增加行銷型大標或裝飾統計。

**OWN-WORLD:** 白色工作面、深海藍導覽、青綠選取，中文系統字體、統一線條圖示與克制留白。

**STORY:** 師生選擇時段、確認容量與設備、完成身分驗證後申請；管理員依状态完成審核與鑰匙交還。

**FIRST VIEWPORT:** 左側 252 px 導覽；主區上方日期與時段表單，下方可比較資訊列，查詢按鈕緊鄰篩選。手機頂部導覽，單日課表。

**FORM:** 校園導引標誌，候選排序第 3，seed key 5de9e9fc。位置點連結教室代碼與常駐位置文字是一處簽名。

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## SCOPE & MODE

Operate：SvelteKit 前端全流程；入口為教室查詢，延伸至申請、帳戶、借用歷史、通知及管理台。以同層後端 repository 的 `../backend/docs/SPEC.md` 為業務真實來源。使用者明確授權未明確事項自行判斷，因此未增加風格選擇或確認步驟。採 code-led 製作。

## AUDIENCE & TASK

師生在桌機或手機上挑選日期、時段與教室，確認容量設備後申請；管理員快速識別申請人、時段、狀態並完成審核與鑰匙交還。成功依 API 結果呈現，無生產示範登入或虛構可用性。

## WORLD & DIRECTION

文化方向候選依序為校園課表、圖書目錄、校園導引標誌、課程講義、海岸研究筆記、學校出版物、港區安全導引。concept-seed key **5de9e9fc** 指定第 3 項。採校園導引標誌：白色工作面、海洋深藍導覽、青綠選取、系統中文無外部字體。Operate 的導覽、表格、日期欄位及按鈕使用熟悉的網頁控件；方向透過字體、調色、資訊密度與位置導引一處簽名表現。由固定需求保留白底與深藍，不增添無關風格裝飾。

## FIRST VIEWPORT

桌機左侧深藍導覽，右侧白色頂栏與主工作區。主要內容依序為查詢標題、日期起迄與系館篩選、設備與容量、列表/週課表切換、具有教室位置/設備/容量/可借用狀態/查看動作的可比較資訊列。手機導覽移至頂部，原生時間欄位兩欄，教室資訊按優先順序重排；課表按日切換，不縮小七日欄位。任何 API 錯誤附恢復操作，初次無資料及未登入皆有可執行下一步。

## SIGNATURE & BEHAVIOR

簽名是教室位置的本地幾何校園示意圖：單一精確座標點連結教室代碼與常駐的位置文字。2 秒 timeout/error 立即切換文字位置，遲到圖片不能覆蓋備案。未獲校方確認的位置明示示範。狀態以文字及顏色共同呈現。管理員危險的狀態改動使用就地確認，不以額外模態框打斷閱讀。

## CHALLENGERS & RAISES

- 角色商品目錄：declined，校園認同與教室可比性均較弱；保留每個項目同等完整資訊的紀律，避免只有漂亮的首項。
- 航空時刻表：competitive，數值密度可讀；採時段統一臺北時區、數字對齊的紀律，避免斜面與玻璃材質。
- 植物生命階段圖譜：declined；保留借用生命周期連續且可追溯的紀律，歷史顯示交付與歸還時間。
- 午夜交通導引：competitive，位置方向識別強；將底色轉譯為明亮校園場景，保留清楚位置與導覽上下文。
- 卡帶曲目表：declined；保留容量、借用長度限制可直接查見的紀律，不使用仿紙或翻面控件。
- 黑白數據場：declined；保留選取聚焦的紀律，避免閃爍與無資訊裝飾。

## CONSTRAINTS & EVIDENCE

繁體中文、RWD、鍵盤可見焦點、44 px 基本觸控目標、reduced-motion、無遠端圖片或字體。所有業務寫入 FastAPI；Supabase client 僅 Google PKCE Auth session / Realtime。正式 Google OAuth、Supabase 與實機推播需部署驗收。`npm run check`、`npm run build`、`npm test` 及 `../backend/tests/e2e.cjs` 是驗證入口；桌機與手機截圖由測試工作產生，最後由獨立 reviewer 檢查與 documenter 寫 DESIGN.md 及 design.json。

## 2026-10-12 登入與動畫延伸

沿用既有 Operate 介面與 token。登入只保留學校 Google 按鈕；基本資料集中在帳戶頁，校園信箱唯讀；取消或 PKCE 失效顯示重新登入操作。GSAP 的重點是查詢清單更新時，資訊列以總計不超過 280ms 的次序回到閱讀位置；頁面標題切換維持導覽連續性，借用狀態只在變更時提示，課表切換與地圖位置文字有短過渡。只動畫 transform／opacity，起始仍可見且可操作；減少動態設定不執行 tween，卸載／更新 revert matchMedia。Prettier 預設雙引號、80 欄、2 格與 LF 為已確認程式碼格式。

## SOURCE & REPOSITORY EVIDENCE

前端根目錄為 `C:/Project/ntouse-g10/frontend`，後端根目錄為 `C:/Project/ntouse-g10/backend`。`../backend/` 路徑是本次並列工作區的證據位置，不假設獨立 clone 前端會附帶 sibling reports；後端入口為 [Classroom_reservation_backend](https://github.com/NTOUSEg10/Classroom_reservation_backend)。本 surface 的 target 路徑以 frontend 根目錄解析。登入／回呼／基本資料的來源分別為 `src/routes/login/+page.svelte`、`src/routes/auth/callback/+page.svelte`、`src/routes/account/+page.svelte`；動態值與清理流程取自 `src/lib/motion.ts`，而非新增視覺方向。

GSAP 的四種來源行為為 page（0.24秒）、results（0.22秒加總量0.06秒的前12列錯開）、status（僅變更時0.16秒）與 location（教室代碼0.24秒），皆使用 expo.out。現有顏色、字階與圓角未變。元件 primitives 與動態延伸記錄於 `DESIGN.md`、`.impeccable/design.json`。

最終來源另外包含 `src/lib/api.ts` 的 callback／cancelPKCE 清理、`src/routes/auth/callback/+page.svelte` 的 afterNavigate 完成後處理、`src/routes/+layout.svelte` 的 UUID／role keyed 私密內容，以及 `src/routes/+page.svelte` 的送出條件 snapshot。這些修正維持既有 UI 文字、tokens 與 GSAP 值。`reports/callback-browser-validation.json` 記錄 2026-10-12 的五項 Chrome／PKCE HTTP fixture 檢查；此 JSON 不是截圖或正式 Google OAuth 驗收。

本輪 rendered evidence 使用 2026-10-12 的 `../backend/reports/upgrade-e2e-browser.json`（31 checks passed）與其八張 `upgrade-e2e-*.png`，以及 `../backend/reports/upgrade-caddy-browser.json`／`upgrade-caddy-home-desktop.png`。已核對首頁桌機／手機、教室申請與位置備案、管理台、違規獨立分頁及 Google 完成基本資料後的帳戶畫面，與既有 tokens／布局一致。

登入、callback 與完成前的 readonly 信箱／四欄表單另外已核對五張 `../backend/reports/upgrade-auth-*.png`，exact names 與 capture scope 見 `../backend/reports/upgrade-auth-ui-captures.json`（2026-10-12T02:48:03.053Z）。桌機登入單一 Google 操作、取消／失效回呼的重新登入 CTA，以及桌機／手機的唯讀校園信箱與四欄基本資料均與最終 source 相符；另以 Chrome DOM／PKCE／七路由 hydration 記錄驗證行為。GSAP normal／reduce 與快切頁 cleanup 的證據是 browser JSON，靜態圖不作動畫或鍵盤證明。獨立視覺 verdict 位於 `../backend/docs/UPGRADE_UI_REVIEW.md`，不沿用歷史密碼版圖或 ship verdict。
