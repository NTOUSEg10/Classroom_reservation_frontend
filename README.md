# 海大教室借用平台 — 前端

SvelteKit 2、Svelte 5、TypeScript、Tailwind CSS；業務與權限驗證由 [FastAPI 後端](https://github.com/NTOUSEg10/Classroom_reservation_backend) 提供。

Node.js 22.12 以上（建議 24），先執行 `npm ci`，再執行 `npm run dev`。開發 API 預設指向 `http://127.0.0.1:8000`，可用環境變數 `API_PROXY_TARGET` 調整。前端公開設定來自 `/api/config`，不得放入 Supabase secret key、Google client secret 或 `DISPATCH_SECRET`。

```powershell
npm run format:check
npm run check
npm test
npm run build
```

格式使用 [Prettier](https://prettier.io/docs/configuration) 與 [Svelte plugin](https://github.com/sveltejs/prettier-plugin-svelte)：2 格縮排、雙引號、分號、行寬 80、LF。`npm run format` 統一格式；`format:check` 在 CI 驗證。Python 在後端使用 Ruff。

只接受學校 Google 帳號。Supabase 啟用 Google provider，Redirect allow list 加入正式 HTTPS 與開發用 `http://127.0.0.1:5173/auth/callback`。前端採 PKCE，手動交換 callback code 且移除 URL 敏感參數；信箱、Google provider 與角色由後端驗證，`hd` 僅是 Google 帳號選擇提示。

首次登入在 `/account` 完成姓名、電話、系所、證號；學校信箱不可修改。實際 Google OAuth、校園帳號與正式環境驗收方式參見後端 `docs/SPEC.md`。`npm run build` 同時驗證靜態 SPA 的 CSP 雜湊。

GSAP 僅用於導覽標題、查詢結果／課表切換、借用狀態變更與地圖位置文字的短過渡，160–280ms，不延後操作。`prefers-reduced-motion: reduce` 下保留直接呈現；Svelte action 在切頁、更新與卸載時 revert matchMedia，避免殘留動畫。
