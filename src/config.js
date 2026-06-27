// ── ゲーム定数・チューニング・コンテンツ（=データ）─────────────────────────
// 数値の調整はここだけ見れば済むようにまとめる。エンジン(GameScene)はこれを読むだけ。
// 絵が来たら OBSTACLES の color を texture キーに差し替える想定（コア変更ゼロ）。

export const GAME_W = 800;
export const GAME_H = 450;

// 足元（プレイヤーの origin(0.5,1) の基準線）。ここから下が地面。
export const FLOOR_Y = 372;

// 色（プレースホルダー）
export const COLORS = {
  sky: 0xbfe3ff,
  ground: 0x6b4f2a,
  groundTop: 0x4f7a36,
  stripe: 0x3f6029,
  cloud: 0xffffff,
  player: 0xf2a23c, // おじさん＝オレンジの四角
  playerDuck: 0xe08a22,
};

export const TUNING = {
  playerX: 150, // プレイヤーの固定X
  playerW: 44,
  standH: 62, // 立ち姿の高さ
  duckH: 32, // 伏せ（スライド）時の高さ

  gravity: 2900, // px/s^2
  jumpVel: 1120, // ジャンプ初速 px/s（高さ ≈ 1120^2/(2*2900) ≈ 216px）

  startSpeed: 330, // 開始スクロール速度 px/s
  speedAccel: 10, // 1秒ごとに増える速度 px/s
  maxSpeed: 650,

  metersPerPx: 0.1, // 距離→スコア(m)換算

  // 当たり判定の甘さ（見た目より小さいhitboxで理不尽さを減らす）
  hitInsetX: 7,
  hitInsetTop: 6,
};

// 障害物＝誘惑（高カロリー）。onGround=地面置き(ジャンプで避ける) /
// clearance 指定=浮いてる(スライドで潜る)。w,h はプレースホルダーの矩形サイズ。
export const OBSTACLES = {
  ramen: { label: 'ラーメン', w: 40, h: 40, color: 0xe24b4b, onGround: true },
  beer: { label: 'ビール', w: 26, h: 64, color: 0xe2a93b, onGround: true },
  karaage: { label: '唐揚げ', w: 54, h: 34, color: 0xc8742a, onGround: true },
  // 浮遊（看板/自販機の上など）→ 立ったままだと当たる。伏せて潜る。
  // clearance=床から障害物の下端までの隙間。duckH(32) < clearance(40) < standH(62) で
  // 「立つと当たる／伏せると通れる」を保証。
  vending: { label: '自販機の看板', w: 60, h: 30, color: 0x4b78e2, clearance: 40 },
};

export const BEST_KEY = 'ojisanRunner.best';
