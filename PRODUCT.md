# 海大教室借用平台

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

使用者固定：FastAPI、Svelte、Supabase。指定前端 TypeScript 與 Tailwind；採 SvelteKit。

## Users

國立臺灣海洋大學學生、教職員借用人，及管理員。借用人查詢並申請；管理員核准、管理鑰匙、帳號和違規。

## Product Purpose

提供透明、高效的教室借用流程，防止重複核准、追蹤鑰匙責任並即時通知。

## Operating Context

桌機與行動瀏覽器。日期時段查詢、每週課表、位置查找、即時與預約借用、歷史、審核。具體行為以後端 repository 的 docs/SPEC.md 為準。

## Capabilities and Constraints

完整 FR/FRA 與 NFR；每個寫入由 FastAPI 驗證權限及資格。規格先於實作。使用者授權不明處合理決定、記錄假設，不中斷詢問。

## Brand Commitments

名稱海大教室借用平台；現代校園、簡潔專業、繁體中文。團隊林品希、陳佳昀、林良承、李曜年、侯屏嘉、洪于宸。

## Evidence on Hand

使用者需求與後端 docs/SPEC.md。尚無校方 logo、官方教室清單、精確位置／樓層圖；測試資料須明確標示。校園身分採學校 Google 帳號（精確網域 email.ntou.edu.tw），首次登入補齊基本資料，不再依賴名冊。正式 Google OAuth、Supabase 與實機推播仍需部署驗收。

## Product Principles

- 資料庫維護唯一核准與可追溯狀態。
- 權限由服務端依即時資料判斷。
- 介面把可用性、位置和下一個操作說清楚。
- 網路或圖資失敗時提供明確恢復方法與文字資訊。

## Accessibility & Inclusion

手機與桌機、鍵盤操作、可見焦點、文字狀態而非只用顏色。假設符合 WCAG AA 作為實作標準。
