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
  baseGain: 2.2, // 常時の接近速度(px/s)
  gainPerMeter: 0.010, // 距離(m)に比例して接近速度が増す（最終的に避けても捕まる）
  passReward: 18, // 障害物を1個きれいに避けるたび gap 回復(px)
  stumblePenalty: 44, // 障害物に当たるたび gap 喪失(px)
  iFrameMs: 600, // つまずき後の無敵(連続ヒットの理不尽防止)
  warnGap: 55, // これ以下で警告表示
};

// 障害物＝日本の歩道にある実在の障害物。onGround=地面置き(ジャンプで避ける) /
// clearance 指定=浮いてる(スライドで潜る)。w,h はヒットボックスサイズ。
// textureKey は raw_generated/obstacles_street_sheet.png 抽出後に有効になる。
export const OBSTACLES = {
  cone:    { label: 'カラーコーン',   w: 28, h: 44, color: 0xf07020, onGround: true,   textureKey: 'obs_cone' },
  barrier: { label: '工事バリケード', w: 62, h: 48, color: 0xf07020, onGround: true,   textureKey: 'obs_barrier' },
  bicycle: { label: '放置自転車',     w: 56, h: 50, color: 0x888888, onGround: true,   textureKey: 'obs_bicycle' },
  trash:   { label: 'ゴミ袋',         w: 52, h: 44, color: 0x333333, onGround: true,   textureKey: 'obs_trash' },
  vending: { label: '自動販売機',     w: 42, h: 70, color: 0x3a9ad9, onGround: true,   textureKey: 'obs_vending' },
  boxes:   { label: 'ダンボール',     w: 48, h: 56, color: 0xc8903c, onGround: true,   textureKey: 'obs_boxes' },
  sign:    { label: '立て看板',       w: 44, h: 54, color: 0x444444, onGround: true,   textureKey: 'obs_sign' },
  // 伏せて潜る障害物：clearance=床から下端の隙間。duckH(32) < clearance(44) < standH(62)
  tape:    { label: '工事テープ',     w: 72, h: 22, color: 0xf5c800, clearance: 44,    textureKey: 'obs_tape' },
};

// ヘルシーアイテム（=逃げる助け）。誘惑の逆。拾うと効果。
// kind:'gap' = 追手を引き離す(gap回復) / kind:'power' = 一定時間無敵(障害物を素通り)。
// 食べ物アイテム：拾うと元気が出てパワーアップ！（ゲームのコメディ味付け）
export const ITEMS = {
  karaage: { label: '唐揚げ',     w: 42, h: 38, color: 0xc8721e, kind: 'gap',   gap: 40,  textureKey: 'item_karaage', texts: ['うまい！', '唐揚げで充電！', 'ガッツリ回復！'] },
  ramen:   { label: 'ラーメン',   w: 44, h: 36, color: 0xe8c080, kind: 'gap',   gap: 28,  textureKey: 'item_ramen',   texts: ['ラーメン補給！', '体があったまる！', '麺で回復！'] },
  mayo:    { label: 'マヨネーズ', w: 26, h: 44, color: 0xfffff0, kind: 'power', ms: 2500, textureKey: 'item_mayo',    texts: ['マヨパワー！', 'マヨで無敵！', '俺を止めるな！'] },
  beer:    { label: 'ビール',     w: 30, h: 44, color: 0xe8c020, kind: 'power', ms: 2000, textureKey: 'item_beer',    texts: ['ビール無敵！', 'アルコール燃料！', '最高や！'] },
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
  pickupGap: ['うまい！', '唐揚げで充電！', 'ガッツリ回復！', 'ラーメン補給！'],
  pickupPower: ['マヨパワー！', 'ビール無敵！', 'パワーアップ！', '俺を止めるな！'],
  caughtFarMeters: 800, // これ以上走って捕まると caughtFar 寄りの台詞
};

export const BEST_KEY = 'ojisanRunner.best';
