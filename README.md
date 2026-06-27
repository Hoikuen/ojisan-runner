# おじさんランナー (ojisan-runner)

健康診断／メタボから必死に逃げるおじさんのエンドレスランナー。コミカル・可愛い・必死。

- ステータス：最小ループ実装済み（図形プレースホルダー）。走る→ジャンプ/伏せで避ける→当たると終わる→距離スコア＋ベスト保存→リトライ
- 技術：Phaser 3 + Vite。垂直は手動物理＋手動AABB（Arcade不使用＝床めり込み等の罠を回避）
- 起動：`npm install`（cacheで詰まる場合 `npm install --cache ./.npm-cache`）→ `npm run dev`
- 設計：docs/GAME_DESIGN.md
- 制作の正本：~/Developer/games/GAME_CRAFT_GUIDE.md

## 操作
- タップ／クリック／スペース／↑：ジャンプ
- 画面下を長押し／↓：伏せる（スライド）

## 次の課題（絵が固まる前のロジック調整 → その後アート）
- 絵の差し替え：色→textureキーに替えるだけ（src/config.js の COLORS / OBSTACLES）
- 追手（体重計/医者/メタボ判定）が後ろから迫る演出：未実装
- ヘルシーアイテム（加速/無敵/スコア）：未実装
- 音（ジャンプ/被弾/BGM）：未実装
