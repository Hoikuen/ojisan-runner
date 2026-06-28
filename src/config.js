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
  playerHurt: 0xff5555, // 被弾（つまずき）時の点滅色
  playerPower: 0x37d0c4, // 無敵（ヘルシー）時の色
  dust: 0xcdb48a, // 着地の砂ぼこり
  sweat: 0x9fd8ff, // 必死の汗
  chaser: 0x7a2b4a, // 追手＝迫る健康診断/メタボ判定（プレースホルダー）
  chaserEye: 0xffe27a,
  gaugeGood: 0x4caf50,
  gaugeWarn: 0xe6b800,
  gaugeBad: 0xe23b3b,
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

// 追手（=逃げる理由）。プレイヤーの後方から迫る。gap = プレイヤーX - 追手X（前にいるほど大）。
// 仕組み：誘惑(障害物)に当たると gap が一気に縮む(つまずき)。きれいに避けると少し戻る。
// 距離が伸びるほど追手の基礎接近速度が上がり、いつかは必ず捕まる(エンドレスの幕引き)。
export const CHASER = {
  gapStart: 150, // 開始時に前にいる距離(px)
  gapMax: 200, // これ以上は引き離せない（報酬の上限）
  caughtGap: 0, // gap がこれ以下で捕まる→終了
  w: 52,
  h: 84, // プレイヤー(62)より大きく＝威圧感
  baseGain: 3, // 常時の接近速度(px/s)
  gainPerMeter: 0.013, // 距離(m)に比例して接近速度が増す（最終的に避けても捕まる）
  passReward: 15, // 障害物を1個きれいに避けるたび gap 回復(px)
  stumblePenalty: 55, // 障害物に当たるたび gap 喪失(px)
  iFrameMs: 600, // つまずき後の無敵(連続ヒットの理不尽防止)
  warnGap: 55, // これ以下で警告表示
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
  // 追加誘惑
  chocolate: { label: 'チョコレート', w: 44, h: 28, color: 0x5c2e0a, onGround: true },
  oil:       { label: 'サラダ油',     w: 24, h: 52, color: 0xd4b800, onGround: true },
  butter:    { label: 'バター',       w: 42, h: 24, color: 0xf0d050, onGround: true },
  mayo:      { label: 'マヨネーズ',   w: 28, h: 56, color: 0xf5f0d0, onGround: true },
};

// ヘルシーアイテム（=逃げる助け）。誘惑の逆。拾うと効果。
// kind:'gap' = 追手を引き離す(gap回復) / kind:'power' = 一定時間無敵(誘惑を素通り)。
export const ITEMS = {
  veggie: { label: '野菜', w: 30, h: 30, color: 0x5cb85c, kind: 'gap', gap: 30 },
  water: { label: '水', w: 26, h: 34, color: 0x39a8e6, kind: 'gap', gap: 22 },
  aojiru: { label: '青汁', w: 28, h: 36, color: 0x2e8b3d, kind: 'power', ms: 2200 },
  dumbbell: { label: 'ダンベル', w: 44, h: 18, color: 0x9aa0a6, kind: 'power', ms: 2600 },
};

// アイテム出現。障害物とは別カデンツ（少し稀）。floatChance=空中(ジャンプで取る)割合。
export const ITEM_SPAWN = {
  startCountdown: 760, // 最初のアイテムまでの距離(px)
  minGap: 540,
  randGap: 720,
  startAfterMeters: 60, // 序盤は出さない
  floatChance: 0.45,
  floatYMin: 70, // 床からの高さ(px)
  floatYMax: 150, // ジャンプ頂点(約216px)で届く範囲に収める
};

// コメディ味付けの台詞（=データ。足す＝配列に1行追加するだけ）。
export const FLAVOR = {
  intro: [
    '健康診断まであと3日…逃げろ！',
    '会社の健診、バックレ成功なるか!?',
    'メタボ判定から全力ダッシュ！',
    '内臓脂肪に追われる男',
    '今年こそ、受けない！',
  ],
  // 捕まった（通常）
  caught: [
    '人間ドックに連行された…',
    '妻に体重計を見られた',
    'メタボ判定、確定。',
    '先生「ちょっとお話が」',
    '問診票が追いついた',
    '再検査のお知らせ、到着',
    '血圧計の音が聞こえる…',
    'ビールの誘惑には勝てなかった',
  ],
  // よく逃げた（長距離/新記録）
  caughtFar: [
    '惜しい！あと一歩で逃げ切れた',
    'ここまで逃げたのは立派…でも捕まった',
    '伝説の逃走、ついに終わる',
  ],
  pickupGap: ['ヘルシー！', '健康！', 'うまい'],
  pickupPower: ['無敵だ！', 'みなぎる！', '青汁パワー！'],
  caughtFarMeters: 800, // これ以上走って捕まると caughtFar 寄りの台詞
};

export const BEST_KEY = 'ojisanRunner.best';
