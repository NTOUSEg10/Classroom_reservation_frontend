---
name: "海大教室借用平台"
description: "以校園導引標誌為中心的繁體中文教室借用介面"
colors:
  ink: "#183640"
  muted: "#5c6f76"
  navy: "#123a4d"
  navy-soft: "#204d60"
  teal: "#087c75"
  teal-dark: "#08635e"
  teal-pale: "#e6f3ef"
  ground: "#f5f7f6"
  paper: "#ffffff"
  border: "#dce5e2"
  danger: "#a73333"
  danger-pale: "#fff0ee"
  amber: "#79571b"
  amber-pale: "#fbf2de"
typography:
  headline:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-.025em"
  title:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.5
  title-small:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.65
  body:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".82rem"
    fontWeight: 550
    lineHeight: 1.65
  action:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".87rem"
    fontWeight: 600
    lineHeight: 1.65
  action-compact:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".8rem"
    fontWeight: 600
    lineHeight: 1.65
  field:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".85rem"
    fontWeight: 400
    lineHeight: 1.65
  caption:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".77rem"
    fontWeight: 400
    lineHeight: 1.65
  status:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".75rem"
    fontWeight: 400
    lineHeight: 1.65
  navigation:
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', system-ui, sans-serif"
    fontSize: ".91rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "7px"
  panel: "14px"
  chip: "4px"
  segment-item: "5px"
  surface: "8px"
  map: "9px"
spacing:
  "6": "6px"
  "8": "8px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "26": "26px"
  "28": "28px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.teal-dark}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.teal-pale}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-danger-hover:
    backgroundColor: "#862626"
  button-compact:
    typography: "{typography.action-compact}"
    padding: "7px 14px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "25px 28px"
  navigation-item:
    textColor: "#e4eeef"
    typography: "{typography.navigation}"
    rounded: "{rounded.surface}"
    padding: "11px 14px"
  navigation-item-hover:
    backgroundColor: "{colors.navy-soft}"
  navigation-item-active:
    backgroundColor: "#e8f2ef"
    textColor: "{colors.navy}"
  equipment-chip:
    textColor: "{colors.muted}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  status:
    backgroundColor: "#eef2f0"
    textColor: "{colors.muted}"
    typography: "{typography.status}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  status-pending:
    backgroundColor: "{colors.amber-pale}"
    textColor: "{colors.amber}"
  status-approved:
    backgroundColor: "{colors.teal-pale}"
    textColor: "{colors.teal-dark}"
  status-completed:
    backgroundColor: "{colors.teal-pale}"
    textColor: "{colors.teal-dark}"
  status-checked-out:
    backgroundColor: "#e8eef8"
    textColor: "{colors.navy}"
  status-rejected:
    backgroundColor: "{colors.danger-pale}"
    textColor: "{colors.danger}"
  segmented:
    backgroundColor: "#e9efec"
    rounded: "{rounded.surface}"
    padding: "3px"
  segment-item:
    textColor: "{colors.muted}"
    rounded: "{rounded.segment-item}"
    padding: "6px 12px"
  segment-item-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  alert:
    backgroundColor: "{colors.teal-pale}"
    textColor: "{colors.teal-dark}"
    rounded: "{rounded.surface}"
    padding: "13px 17px"
  alert-error:
    backgroundColor: "{colors.danger-pale}"
    textColor: "{colors.danger}"
  alert-warning:
    backgroundColor: "{colors.amber-pale}"
    textColor: "{colors.amber}"
  map-fallback:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.muted}"
    rounded: "{rounded.surface}"
    padding: "25px"
---

# Design System: 海大教室借用平台

## Overview

**Creative North Star: "校園導引標誌"**

以校園導引標誌為視覺中心：深海藍承載導覽，白色工作面承載查詢、表單和紀錄，青綠指出可操作與已選取的項目。介面以繁體中文、原生日期與時間欄位、可比較資訊和細線圖示維持簡潔專業的校園服務感。

資訊密度偏向日常作業工具。主要內容先呈現任務與條件，再呈現結果；文字、數字、設備和狀態皆有固定層級。留白用來分隔資訊群，邊線用來維持列與欄的關係，位置示意圖則提供具體的方向感。

**Key Characteristics:**

- 深海藍導覽、白色工作面與青綠操作色。
- 單一在地中文字體堆疊，緊湊的標題與分層資訊。
- 平面邊線與淡色區塊建立層次。
- 位置點、教室代碼與常駐位置文字共同提供導引。
- 桌機比較欄位，手機依閱讀優先順序重排。

本文件由完成後的程式與桌機／手機實測畫面萃取；Google 登入、帳戶基本資料與 GSAP 延伸沿用既有視覺系統。色彩命名與氣氛用語依既有方向契約作描述；frontmatter 的值才是規範。尺寸與字型取自目前 CSS，未新增應用程式 token。

本文件中的 `src/` 與 `static/` 以 frontend repository 根目錄解析。`../backend/` 證據路徑只描述本次 `C:/Project/ntouse-g10/frontend`／`C:/Project/ntouse-g10/backend` 的並列工作區；獨立 clone 前端時不預設有同層 backend 或 reports。後端入口為 [Classroom_reservation_backend](https://github.com/NTOUSEg10/Classroom_reservation_backend)，測試圖片與 JSON 的本機來源保留在下方 evidence 記錄。

## Colors

調色以海洋深色、青綠操作色與低彩度中性色構成；紅與琥珀用於有意義的錯誤、警告和狀態。

### Primary

- **青綠操作色**（`teal`）：主要查詢與提交動作、焦點、未讀提示和課表日期選取。
- **深青綠**（`teal-dark`）：主要按鈕 hover、可借用文字、核准與完成狀態文字。
- **青綠淡底**（`teal-pale`）：核准狀態、成功提示、教室圖示底與次要按鈕 hover。

### Secondary

- **深海藍**（`navy`）：整體導覽背景，以及已選取導覽與鑰匙交付狀態的文字。
- **海藍淡層**（`navy-soft`）：深色導覽中的 hover 區塊。

### Tertiary

- **警示紅／警示淡底**（`danger`、`danger-pale`）：錯誤訊息、拒絕狀態、危險操作及地圖位置點。
- **琥珀／琥珀淡底**（`amber`、`amber-pale`）：已占用、待審和借用資格提醒。這些是語意色，不是額外裝飾色。

### Neutral

- **深色正文**（`ink`）：標題、正文、欄位值與選取項目的主要文字。
- **灰綠次文**（`muted`）：說明、位置文字、標籤和時間資訊。
- **灰綠底**（`ground`）：工作區背景與地圖備案底色。
- **白色工作面**（`paper`）：頂欄、表單、列表、詳情與主要內容容器。
- **淡灰綠邊線**（`border`）：容器輪廓、分隔線與次要操作邊線。

**The State Has Words Rule.** 每個借用狀態都保留文字。色點、淡底與顏色提供第二層提示，不能單獨承擔狀態意義。

元件中的既有單次淡底和邊線值保留在元件 token 或 sidecar CSS，不延伸為新的全域色系。Sidecar 的八階色帶由上述色相推算，只供調色檢視；它們不是新增的應用色票。

## Typography

**Body Font:** Noto Sans TC、Microsoft JhengHei、PingFang TC、system-ui、sans-serif，依使用者裝置可用的本機字型回退。介面不載入外部字型。

**Character:** 同一無襯線中文字體貫穿工作介面。標題清楚但克制，操作文字較重；正文採舒適行高，細小資訊使用灰綠次文。沒有獨立的宣傳 display 字體。

### Hierarchy

- **Headline**：頁面 h1 使用 `headline`，隨可用寬度伸縮；緊字距與較短行高維持任務標題的清楚輪廓。
- **Title / Title Small**：區塊 h2 與 h3 使用 `title`、`title-small`。列表標題與結果標題有來源 CSS 的緊湊調整，避免放大成展示文字。
- **Body**：根字級使用 `body`。頁面說明與表單／紀錄文字依元件降低字級；頁面說明最大行長為 65ch。
- **Label / Field**：`label` 用於表單標示，`field` 用於輸入值；標示比欄位值略重。
- **Action / Action Compact**：一般按鈕與列表按鈕使用相應操作角色。
- **Caption / Status**：`caption` 承載補充資訊，`status` 承載短狀態。容量與課表時間使用等寬數字對齊，保留中文單位。

**The One Reading Voice Rule.** 延伸介面沿用同一中文字體堆疊；用尺寸、字重和數字對齊區分層級。

## Layout

桌機採兩欄殼層：導覽固定寬（252px），工作區可伸縮；主內容置中且最大寬（1440px），一般水平內距（46px）。頂欄高（83px）。表單、資料列與詳情以 CSS grid 和 flex 編排，所有伸縮欄位允許縮小至內容區。

目前不是嚴格的 8px 倍數系統。Frontmatter 的數值 spacing key 摘錄重複使用的間距；小間距連接圖示和標示，中間距分隔欄位，大間距分隔容器。一般內容容器內距（25px 28px）；查詢容器（25px 26px）；資訊列（18px 24px）。這些是來源中不同密度的既有變體。

### Responsive behavior

- **1250px 以下**：側欄縮至（215px），主區水平內距降至（28px）；查詢表單換為四欄，教室動作與狀態共用末欄。
- **900px 以下**：深色導覽移到頁首並水平排列；詳情改為單欄，申請面板取消 sticky；主區水平內距（26px）。
- **600px 以下**：主區水平內距（17px）；查詢日期與系館整列，開始／結束時間並列，查詢按鈕整列。資訊列改成兩欄，教室身分先占滿整列。帳戶改單欄，通知動作換到內容下方，課表一次顯示一天，七個日期切換保留清楚觸控範圍。

一般按鈕、欄位、圖示按鈕及行動導覽保留（44px）基本操作尺寸；既有 compact 按鈕的最小高度是（40px），分段切換的最小高度是（36px）。不要把這些來源差異改寫成每個控件都具有相同高度。

## Elevation & Depth

本系統沒有 box-shadow。白色工作面從灰綠底中浮現，細邊線維持容器與資訊列的結構；淡色選取、深色導覽和清楚的文字階層提供深度。主要互動以色彩回饋完成，元件不因 hover 位移。

**The Flat Work Surface Rule.** 工作面以背景、邊線與留白分層；沿用目前無陰影的容器與控制項。

按鈕、導覽與資訊列採短暫色彩變化（160ms ease-out）。焦點以青綠外框（3px）及外距（4px）標示，與容器層次分開處理。

GSAP 只為閱讀位置與資料變更提供短過渡，沿用目前 `motion.ts` 的四種行為：

- **Page**：路徑切換後的 h1 從水平位移（8px）、不透明度（0.88）回到正常位置與不透明度（1），耗時（0.24秒）。
- **Results**：查詢資訊列從垂直位移（4px）、不透明度（0.84）回到正常；單列耗時（0.22秒），前 12 列的錯開總量（0.06秒），整段最長（0.28秒）。週課表在教室或日期切換時沿用同一 results 行為，不含清單列時作用於整個課表格線。
- **Status**：首次呈現不播放；狀態變更時從縮放（0.97）、不透明度（0.8）回到正常，耗時（0.16秒）。
- **Location**：地圖就緒後的教室代碼標示採相同縮放與不透明度變化，耗時（0.24秒）；位置點本身保留原有座標錨定。

四者使用（expo.out），完成後清除 transform／opacity。更新或卸載時 revert 既有 matchMedia 範圍；快速切頁不保留失效的動畫樣式。`prefers-reduced-motion: reduce` 時不執行 GSAP tween；CSS 同時關閉 transition／animation，並維持自動捲動行為。

**The Motion Keeps the Task Visible Rule.** 起始內容保持可見且可操作；動態只提示閱讀位置或資料變化，不延遲下一個操作。

## Shapes

形狀是克制的圓角矩形。一般控制項使用 `control`，主要容器使用較寬的 `panel`；短設備與狀態標籤使用 `chip`。分段選項內側使用 `segment-item`，導覽、提示和備案區使用 `surface`，位置圖框使用 `map`。細邊框維持清楚邊界。圓形只用於小狀態點與成功圖示，不把一般操作做成膠囊。

圖示採同一線條 SVG 語彙，預設（20px），線寬（1.7），圓形端點與轉角；不同情境依來源使用較小或較大的尺寸。沿用建築、時鐘、位置、人物、日曆等具體圖示。

## Components

### Buttons

直接、穩定的作業控制項。Primary 為青綠底配白字，hover 轉深青綠。Secondary 為白底、淡邊線與深色文字，hover 轉青綠淡底並略加深邊線。Danger 使用警示紅，hover 使用來源中較深的紅。Compact 只改變內距、字級與最小高度。圖示與文字間距（8px），一般內距（10px 18px）。

鍵盤焦點沿用全域外框。Disabled 降低不透明度（0.5）並使用禁止游標；狀態中的文字會同步改為「查詢中…」或「正在處理…」等。文字動作採深青綠與底線，圖示按鈕使用有邊框的方形範圍。

### Chips

設備標籤是細邊框、灰綠字、低密度內距（2px 7px）的短資訊。狀態標籤用淡底、短文字和小色點；待審為琥珀，核准／完成為青綠，已交付鑰匙為海藍，拒絕為警示紅，取消沿用中性底。它們傳達資料，不是按鈕。

### Cards / Containers

白色、淡邊線與 `panel` 圓角組成共通工作面。詳情、查詢和驗證容器按任務密度調整內距；表格式內容共用一個外框，列內以細線分隔，保留完整且同等的資料層級。列表 hover 只提供極淡的背景變化。

### Inputs / Fields

欄位為白底、細灰綠線與 `control` 圓角，內距（9px 11px），最小高度（44px）。Hover 加深邊線，焦點仍以全域青綠外框標示；placeholder 使用灰綠次文。使用可見 label、就近輔助文字、原生 date／time／select 與青綠 checkbox。Textarea 保留垂直調整尺寸。

錯誤以欄位附近的警示紅文字或警示淡底提示呈現，並保留具體的恢復操作；目前沒有獨立的紅色欄位邊框變體。

### Navigation

深海藍導覽的預設文字是淡色；hover 使用海藍淡層，active 使用淡青綠灰底、深海藍文字與較重字重。桌機列高至少（48px），手機至少（44px）；選取項目始終保持與圖示、標題一致的辨識。管理台頁內項目頁籤使用細底線與青綠 active，與殼層導覽層級分開。

### Segmented controls

列表／週課表和預約／即時借用使用灰綠底的短分段控制。選取項目為白色工作面、深色文字與較重字重，圓角較小。保留 pressed 語意和鍵盤焦點；不要用陰影表達選取。

### Alerts and empty states

成功、錯誤、警告各自使用語意淡底與對應文字，允許文字與恢復動作換行。空狀態有簡短標題、原因或下一步；無資料、載入中、失敗和未登入各自具備可讀文字，不用空白取代狀態。

### School Google sign-in and account onboarding

登入沿用置中的單欄工作面（最大寬 560px）、既有 h1／h2、白色 panel 和整列青綠按鈕。單一「使用學校 Google 登入」按鈕後接「先查詢教室」文字動作，校園網域說明與驗證來源腳註留在工作面附近。登入頁沒有平台密碼欄位或登入／註冊分段切換；既有 segmented 語彙仍用於教室結果與借用模式。

`/auth/callback` 沿用同一 auth-wrapper。確認中顯示帶文字的 loading-row；失敗時顯示警示淡底、重新登入按鈕及先查詢教室的文字動作。

首次登入的基本資料位於帳戶頁：主要表單與學校帳號提示使用既有 account-grid，桌機比例（1.1fr / 1fr）、間距（26px），600px 以下改為單欄。已驗證學校 Google 信箱唯讀，其餘欄位為姓名、校園證號、聯絡電話與系所／單位；label、原生欄位、form-help 與整列提交按鈕皆沿用現有元件，沒有新增字階或色票。

### Room location

位置圖是既有系統的簽名：本地幾何校園示意、單一位置點及教室代碼，同時保留系館、樓層和常駐位置文字。圖框比例（700 / 440）；紅色位置點從背景區分，代碼在小白色標示上。

圖資錯誤、缺少座標或載入超過（2秒）時，轉為灰綠底的文字位置備案；常駐位置文字與示範註記仍然存在。預覽使用來源 SVG 和靜態位置點；點的實際座標由教室資料決定。

## Do's and Don'ts

### Do:

- **Do** 沿用 frontmatter 的色彩與圓角；元件狀態以來源 CSS 為準。
- **Do** 保留可見的青綠鍵盤焦點、文字狀態和原生表單語意。
- **Do** 在一般操作使用既有觸控尺寸；列表內緊湊操作沿用已實作的 compact 變體。
- **Do** 在手機重排資訊與表單，並讓課表按日切換。
- **Do** 動態保留內容可見與操作可用，尊重減少動態偏好，並在更新或卸載時清理樣式。
- **Do** 讓位置文字常駐；地圖失敗時保留可辨識的文字備案與示範資料註記。

### Don't:

- **Don't** 只靠色彩區分可借用、已占用、待審或拒絕。
- **Don't** 把設備標籤或狀態標籤畫成主要操作按鈕。
- **Don't** 為一般工作面加入目前系統沒有的陰影、漸層或玻璃材質。
- **Don't** 以裝飾性大標、無資訊統計或外部字體取代既有任務層級。
- **Don't** 把未經校方確認的位置示意當成官方圖資。

<!-- Extraction evidence:
Frontend repository root: C:/Project/ntouse-g10/frontend.
Backend repository root: C:/Project/ntouse-g10/backend.
Tokens and shared component states: src/app.css.
Shell and navigation: src/routes/+layout.svelte.
Query/list variants: src/routes/+page.svelte.
Detail and application composition: src/routes/rooms/[id]/+page.svelte.
School Google sign-in and callback UI: src/routes/login/+page.svelte, src/routes/auth/callback/+page.svelte.
Final callback and identity source: src/lib/api.ts and src/routes/auth/callback/+page.svelte (afterNavigate completion, cancelled-flow cleanup); src/routes/+layout.svelte (UUID/role keyed content); src/routes/+page.svelte (submitted query snapshot).
Callback browser source check: reports/callback-browser-validation.json, 2026-10-12; real Chrome and the actual browser PKCE SDK with HTTP fixtures, not rendered screenshots or formal Google OAuth acceptance.
Account onboarding: src/routes/account/+page.svelte.
GSAP motion and cleanup: src/lib/motion.ts, src/lib/motion.test.ts.
Motion consumers: src/routes/+layout.svelte, src/routes/+page.svelte, src/lib/components/WeekSchedule.svelte, src/lib/components/Status.svelte, src/lib/components/RoomMap.svelte.
Admin tabs, pagination, and inline decisions: src/routes/admin/+page.svelte.
Status labels: src/lib/components/Status.svelte and src/lib/types.ts.
Location and failure behavior: src/lib/components/RoomMap.svelte, src/lib/map-loader.ts, static/campus-map.svg.
Line-icon language: src/lib/components/Icon.svelte.
Preview location sample: ../backend/supabase/seed.sql (ENG-201, map_x=35, map_y=45).
Business specification: ../backend/docs/SPEC.md.
Rendered evidence: ../backend/reports/upgrade-e2e-home-desktop.png, ../backend/reports/upgrade-e2e-home-mobile.png, ../backend/reports/upgrade-e2e-room-mobile.png, ../backend/reports/upgrade-e2e-admin-desktop.png, ../backend/reports/upgrade-e2e-violations-desktop.png, ../backend/reports/upgrade-e2e-violations-mobile.png, ../backend/reports/upgrade-e2e-map-fallback-mobile.png, ../backend/reports/upgrade-e2e-onboarding-completed.png; ../backend/reports/upgrade-caddy-home-desktop.png.
Browser behavior evidence: ../backend/reports/upgrade-e2e-browser.json (2026-10-12T03:01:20.626Z, 31 passing checks after the final Auth cleanup change; real TCP FastAPI/PostgreSQL with test-only upstream Auth); ../backend/reports/upgrade-caddy-browser.json (2026-10-12T03:02:37.760Z, latest built SPA/native Caddy, seven hydrated routes, guest prompts and strict CSP).
Auth visual evidence: ../backend/reports/upgrade-auth-login-desktop.png, ../backend/reports/upgrade-auth-callback-cancel-desktop.png, ../backend/reports/upgrade-auth-callback-invalid-code-desktop.png, ../backend/reports/upgrade-auth-onboarding-desktop.png, ../backend/reports/upgrade-auth-onboarding-mobile.png; ../backend/reports/upgrade-auth-ui-captures.json (2026-10-12T02:48:03.053Z, actual app UI with genuine FastAPI TCP/PostgreSQL and test-only upstream Google/Supabase).
Rendered coverage: classroom home, room application/location/fallback, admin and independent pagers, Google sign-in, cancelled/invalid callback retry, pre-completion onboarding on desktop/mobile, completed Google onboarding, and the built-SPA home. All 14 PNGs were inspected against source and incumbent tokens; historical password-login captures are excluded. Animation and keyboard claims come from the browser JSON, not static PNGs.
Evidence path convention: src/ and static/ resolve from frontend root. ../backend/ paths refer only to this paired workspace; a standalone frontend clone is not assumed to contain sibling backend/reports. Backend origin: https://github.com/NTOUSEg10/Classroom_reservation_backend.
Independent visual review: ../backend/docs/UPGRADE_UI_REVIEW.md.
Qualitative assumptions: modern campus and 校園導引標誌 follow PRODUCT.md and the existing direction contract; no new world was chosen.
Spacing and literal radii are extracted values, not existing CSS custom-property names. Tonal ramps in the sidecar are synthesized preview aids, not normative application tokens.
-->
