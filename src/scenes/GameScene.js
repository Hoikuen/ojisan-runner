import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  FLOOR_Y,
  COLORS,
  TUNING,
  OBSTACLES,
  ITEMS,
  ITEM_SPAWN,
  CHASER,
  FLAVOR,
  BEST_KEY,
} from '../config.js';

const OBSTACLE_KEYS = Object.keys(OBSTACLES);
const ITEM_KEYS = Object.keys(ITEMS);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const hexColor = (n) => '#' + n.toString(16).padStart(6, '0');

// ステージ定義：走行距離(m)で切り替わる
const STAGES = [
  { minMeters: 0,    bgKey: 'bg_sidewalk', chaserPrefix: 'chaser_obasan', label: null },
  { minMeters: 500,  bgKey: 'bg_evening',  chaserPrefix: 'chaser_doctor', label: 'STAGE 2\nお医者さんが追ってくる！' },
  { minMeters: 1200, bgKey: 'bg_night',    chaserPrefix: 'chaser_wife',   label: 'STAGE 3\n奥さんが追ってくる！' },
];

// 手動物理のエンドレスランナー（チェイス型）。
// - プレイヤーはX固定。垂直は vy 変数 + 重力で手動制御（Arcade不使用＝床めり込み等の罠を回避）。
// - 障害物=誘惑は左へ流れる矩形。当たり判定は手動AABB。当たると即終了ではなく「つまずき」で
//   追手(gap)が縮む。きれいに避けると gap が少し回復。追手に捕まる(gap<=0)と終了。
// 状態: 'running' | 'gameover'
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    const base = 'assets/sprites/extracted_v2/';
    for (let i = 1; i <= 4; i++) this.load.image(`player_run_${i}`, `${base}player_ojisan/run_${i}.png`);
    this.load.image('player_jump',   `${base}player_ojisan/jump.png`);
    this.load.image('player_duck',   `${base}player_ojisan/duck.png`);
    this.load.image('player_hurt_1', `${base}player_ojisan/hurt_1.png`);
    this.load.image('player_hurt_2', `${base}player_ojisan/hurt_2.png`);
    for (const prefix of ['chaser_obasan', 'chaser_doctor', 'chaser_wife']) {
      for (let i = 1; i <= 4; i++) this.load.image(`${prefix}_run_${i}`, `${base}${prefix}/run_${i}.png`);
      this.load.image(`${prefix}_caught`, `${base}${prefix}/caught.png`);
    }
    for (const k of ['cone','barrier','bicycle','trash','vending','boxes','sign','tape'])
      this.load.image(`obs_${k}`, `${base}obstacles_street/${k}.png`);
    for (const k of ['karaage','ramen','mayo','beer'])
      this.load.image(`item_${k}`, `assets/sprites/extracted_v2/food_items/${k}.png`);
    this.load.image('bg_sidewalk', 'assets/sprites/background/sidewalk.png');
    this.load.image('bg_evening',  'assets/sprites/background/evening.png');
    this.load.image('bg_night',    'assets/sprites/background/night.png');
  }

  create() {
    this.state = 'running';

    // ベスト距離（localStorage）
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);

    // ── 背景（スクロールtileSprite）──────────────────────────────
    // sidewalk.png は 1536×512。ゲーム高さに合わせてスケール
    const bgScale = GAME_H / 512;
    this.bg = this.add
      .tileSprite(0, 0, GAME_W, GAME_H, 'bg_sidewalk')
      .setOrigin(0, 0)
      .setDepth(-1);
    this.bg.tileScaleX = bgScale;
    this.bg.tileScaleY = bgScale;

    // ── 路面（FLOOR_Y〜画面下端）：アスファルト＋縁石ライン ──────
    // 背景は空＋遠景シルエットのみなので、路面をコードで描いて接地感を出す
    const roadH = GAME_H - FLOOR_Y; // 78px
    this.add
      .rectangle(GAME_W / 2, FLOOR_Y + roadH / 2, GAME_W, roadH, 0x23232e) // アスファルト
      .setDepth(1);
    this.add
      .rectangle(GAME_W / 2, FLOOR_Y + 1, GAME_W, 3, 0x4a4a5a) // 縁石ライン（明るめ）
      .setDepth(2);

    // ── プレイヤー（おじさんスプライト）─────────────────────────
    // ヒットボックスは TUNING.standH(62) のまま。表示は少し大きめ。
    const PLAYER_DISPLAY_H = 88;
    this.player = this.add
      .image(TUNING.playerX, FLOOR_Y, 'player_run_1')
      .setOrigin(0.5, 1)
      .setDepth(5);
    this._playerBaseScale = PLAYER_DISPLAY_H / this.player.height;
    this.player.setScale(this._playerBaseScale);
    // アニメ状態（初回は run_1 をフル表示してから進める）
    this.animFrame = 0;
    this.animTimer = 0.12;

    this.vy = 0;
    this.onGround = true;
    this.prevOnGround = true;
    this.ducking = false;
    this.curH = TUNING.standH;
    this.landSquash = 0; // 着地スクワッシュの残り秒
    this.particles = []; // 着地ダスト/取得スパークル/汗（dt駆動）
    this.floatTexts = []; // 取得時の吹き出し（dt駆動）
    this.sweatTimer = 0.4; // 必死の汗のインターバル

    // ── 障害物 ──────────────────────────────────────────────────
    this.obstacles = [];
    this.spawnCountdown = 480; // 最初の障害物までの距離(px)

    // ── ヘルシーアイテム ────────────────────────────────────────
    this.items = [];
    this.itemSpawnCountdown = ITEM_SPAWN.startCountdown;

    // ── 追手（=逃げる理由）──────────────────────────────────────
    this.gap = CHASER.gapStart; // プレイヤーより前にいる距離
    this.invuln = 0; // 無敵の残り(ms)。つまずき後 or ヘルシー無敵で共有
    this.invulnIsPower = false; // true=ヘルシー無敵 / false=つまずき無敵
    this.turboBonus = 0; // パワーアイテム中の速度ボーナス(px/s)
    this.speedLines = []; // ターボ中のスピードライン
    this.chaserPrefix = 'chaser_obasan';
    this.chaser = this.add
      .image(0, FLOOR_Y, 'chaser_obasan_run_1')
      .setOrigin(0.5, 1)
      .setDepth(4);
    const CHASER_DISPLAY_H = 110;
    this.chaserBaseScale = CHASER_DISPLAY_H / this.chaser.height;
    this.chaser.setScale(this.chaserBaseScale);
    this.chaserAnimFrame = 0;
    this.chaserAnimTimer = 0;
    this.currentStage = 0;
    this.stageTransitioning = false;

    // ── 進行 ────────────────────────────────────────────────────
    this.speed = TUNING.startSpeed;
    this.distance = 0;

    // ── HUD ─────────────────────────────────────────────────────
    const hudStyle = { fontFamily: 'sans-serif', fontSize: '22px', color: '#23303a', fontStyle: 'bold' };
    this.scoreText = this.add.text(16, 12, '0 m', hudStyle).setDepth(20);
    this.bestText = this.add
      .text(GAME_W - 16, 12, `ベスト ${this.best} m`, { ...hudStyle, fontSize: '16px' })
      .setOrigin(1, 0)
      .setDepth(20);

    // 追手との距離ゲージ（どれだけ引き離せているか）
    this.gaugeW = 200;
    this.gaugeX = GAME_W / 2 - this.gaugeW / 2;
    this.gaugeY = 24;
    this.add
      .text(GAME_W / 2, 8, '逃走', { fontFamily: 'sans-serif', fontSize: '11px', color: '#23303a' })
      .setOrigin(0.5, 0)
      .setDepth(20);
    this.add
      .rectangle(this.gaugeX, this.gaugeY, this.gaugeW, 12, 0x000000, 0.25)
      .setOrigin(0, 0.5)
      .setDepth(20);
    this.gaugeFill = this.add
      .rectangle(this.gaugeX, this.gaugeY, this.gaugeW, 12, COLORS.gaugeGood)
      .setOrigin(0, 0.5)
      .setDepth(21);

    this.warnText = this.add
      .text(GAME_W / 2, GAME_H * 0.32, '迫ってる！', {
        fontFamily: 'sans-serif', fontSize: '30px', color: '#ff5a5a', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(22)
      .setAlpha(0);

    // 導入の煽り（コメディ味付け・ランダム）
    this.introText = this.add
      .text(GAME_W / 2, GAME_H / 2 - 96, pick(FLAVOR.intro), {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#c0354f', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: this.introText, alpha: 0, delay: 3600, duration: 900 });

    // 操作ヒント（数秒で消える）
    this.hint = this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, 'タップ：ジャンプ　下にスワイプ：伏せる\n（キーボード：スペース／↑↓）', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#1d2a33',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 3200, duration: 800 });

    // BGM スケジューラ状態
    this.bgmMasterGain = null;
    this.bgmPlaying = false;
    this.bgmMelStep = 0;
    this.bgmBasStep = 0;
    this.bgmNextMel = 0;
    this.bgmNextBas = 0;

    // ── 入力 ────────────────────────────────────────────────────
    this.setupInput();
  }

  setupInput() {
    // タップ＝ジャンプ、下スワイプ（40px超）＝しゃがむ
    // ptActive: 現セッションで pointerdown が来て初めて true。リスタート後の指残りで
    // 誤って duck/jump が発動しないよう、pointerdown 前は一切無視する。
    let ptStartY = 0;
    let ptDucked = false;
    let ptActive = false;

    this.input.on('pointerdown', (p) => {
      this.initAudio();
      ptStartY = p.y;
      ptDucked = false;
      ptActive = true;
      if (this.state === 'gameover') { this.restartGame(); return; }
    });
    this.input.on('pointermove', (p) => {
      if (!ptActive || this.state !== 'running' || ptDucked) return;
      if (p.y - ptStartY > 40) { ptDucked = true; this.startDuck(); }
    });
    this.input.on('pointerup', () => {
      if (!ptActive) return;
      if (this.state === 'running' && !ptDucked) this.jump();
      this.stopDuck();
      ptDucked = false;
      ptActive = false;
    });
    this.input.on('pointerupoutside', () => {
      this.stopDuck();
      ptDucked = false;
      ptActive = false;
    });

    // キーボード
    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown', () => this.initAudio());
      kb.on('keydown-SPACE', () => this.onActionKey());
      kb.on('keydown-UP', () => this.onActionKey());
      kb.on('keydown-W', () => this.onActionKey());
      kb.on('keydown-DOWN', () => this.startDuck());
      kb.on('keydown-S', () => this.startDuck());
      kb.on('keyup-DOWN', () => this.stopDuck());
      kb.on('keyup-S', () => this.stopDuck());
    }
  }

  onActionKey() {
    if (this.state === 'gameover') this.restartGame();
    else this.jump();
  }

  hideHint() {
    for (const t of [this.hint, this.introText]) {
      if (t && t.alpha > 0) {
        this.tweens.killTweensOf(t);
        t.setAlpha(0);
      }
    }
  }

  jump() {
    if (this.state !== 'running' || !this.onGround) return;
    this.vy = -TUNING.jumpVel;
    this.onGround = false;
    this.ducking = false;
    this.hideHint();
    this.sfxJump();
  }

  startDuck() {
    if (this.state !== 'running') return;
    this.ducking = true;
    this.hideHint();
  }

  stopDuck() {
    this.ducking = false;
  }

  // gap を増減（上限/下限クランプ）。プラス=引き離す / マイナス=詰められる。
  changeGap(amount) {
    this.gap = Math.min(CHASER.gapMax, this.gap + amount);
  }

  // 障害物=誘惑に当たった＝つまずき。即終了ではなく追手に距離を詰められる。
  stumble(o, idx) {
    this.changeGap(-CHASER.stumblePenalty);
    this.invuln = CHASER.iFrameMs;
    this.invulnIsPower = false;
    o.hit = true;
    o.rect.destroy();
    this.obstacles.splice(idx, 1);
    this.cameras.main.shake(120, 0.008);
    this.cameras.main.flash(90, 255, 90, 90);
    this.sfxStumble();
  }

  // 追手の見た目を gap から配置（前にいるほど画面左へ）＋接近で威圧演出
  updateChaser(dt) {
    const x = TUNING.playerX - this.gap;
    this.chaser.x = x;
    const close = this.gap < CHASER.warnGap;
    const t = Phaser.Math.Clamp(1 - this.gap / CHASER.gapMax, 0, 1);

    // ランアニメ
    this.chaserAnimTimer -= dt;
    if (this.chaserAnimTimer <= 0) {
      this.chaserAnimFrame = (this.chaserAnimFrame + 1) % 4;
      this.chaserAnimTimer = 0.10;
      this.chaser.setTexture(`${this.chaserPrefix}_run_${this.chaserAnimFrame + 1}`);
      this.chaserBaseScale = CHASER.h / this.chaser.height;
    }
    // 近いほど少し大きく
    this.chaser.scaleY = this.chaserBaseScale;
    this.chaser.scaleX = this.chaserBaseScale * (1 + t * 0.12);
    // 接近でティント（赤み）
    if (close) {
      this.chaser.setTint(0xff8888);
    } else {
      this.chaser.clearTint();
    }

    // 警告（近づくと点滅表示）
    if (close) {
      this.warnText.setAlpha(0.5 + 0.5 * Math.sin(this.time.now / 90));
    } else if (this.warnText.alpha > 0) {
      this.warnText.setAlpha(0);
    }
  }

  updateGauge() {
    const ratio = Phaser.Math.Clamp(this.gap / CHASER.gapMax, 0, 1);
    this.gaugeFill.displayWidth = Math.max(1, this.gaugeW * ratio);
    this.gaugeFill.fillColor =
      ratio > 0.5 ? COLORS.gaugeGood : ratio > 0.28 ? COLORS.gaugeWarn : COLORS.gaugeBad;
  }

  triggerStageTransition(newStage) {
    this.stageTransitioning = true;
    const st = STAGES[newStage];
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // 背景テクスチャ切り替え
      this.bg.setTexture(st.bgKey);
      // 追手キャラ切り替え
      this.chaserPrefix = st.chaserPrefix;
      this.chaser.setTexture(`${this.chaserPrefix}_run_1`);
      this.chaserAnimFrame = 0;
      this.chaserBaseScale = CHASER.h / this.chaser.height;
      this.chaser.setScale(this.chaserBaseScale);
      this.currentStage = newStage;
      this.cameras.main.fadeIn(350, 0, 0, 0);
      this.cameras.main.once('camerafadeincomplete', () => {
        this.stageTransitioning = false;
      });
      // ステージ開幕バナー
      if (st.label) {
        const banner = this.add
          .text(GAME_W / 2, GAME_H / 2, st.label, {
            fontFamily: 'sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(28)
          .setAlpha(0);
        this.tweens.add({
          targets: banner,
          alpha: { from: 0, to: 1 },
          duration: 280,
          yoyo: true,
          hold: 1400,
          onComplete: () => banner.destroy(),
        });
      }
    });
  }

  updatePlayerSprite(dt, squash, inv, powered) {
    const ducking = this.ducking && this.onGround;
    const airborne = !this.onGround;

    // テクスチャキー決定
    let key;
    if (airborne) {
      key = 'player_jump';
    } else if (ducking) {
      key = 'player_duck';
    } else if (inv && !powered) {
      // つまずき：hurt_1/hurt_2 を交互
      key = Math.floor(this.time.now / 120) % 2 === 0 ? 'player_hurt_1' : 'player_hurt_2';
    } else {
      // ラン：4コマループ
      this.animTimer -= dt;
      if (this.animTimer <= 0) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0.10;
      }
      key = `player_run_${this.animFrame + 1}`;
    }

    if (this.player.texture.key !== key) {
      this.player.setTexture(key);
      // 全テクスチャが同じ高さ(400px)なのでスケールは一定
    }

    // 着地スクワッシュ：scaleXだけ拡大
    this.player.scaleY = this._playerBaseScale;
    this.player.scaleX = this._playerBaseScale * (1 + (ducking || airborne ? 0 : 0.18 * squash));

    // ターボ変身：黄色ティント＋1.08倍スケール
    if (powered) {
      this.player.setTint(0xffee22);
      this.player.scaleX *= 1.08;
      this.player.scaleY *= 1.08;
    } else {
      this.player.clearTint();
    }

    // 無敵中の点滅（ターボ時は控えめに）
    this.player.setAlpha(
      inv && Math.floor(this.time.now / 80) % 2 === 0 ? (powered ? 0.82 : 0.45) : 1
    );
  }

  // ── オーディオ（アセット不要のWebAudio合成SFX）──────────────────
  initAudio() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      if (!this.bgmPlaying) this.startBgm();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = Ctx ? new Ctx() : null;
    } catch (e) {
      this.audioCtx = null;
    }
    this.startBgm();
  }

  beep(freq, freqEnd, dur, type = 'square', vol = 0.14) {
    const ctx = this.audioCtx;
    if (!ctx) return; // 未解禁（ユーザー操作前）なら無音
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  sfxJump() { this.beep(300, 560, 0.10, 'square', 0.11); }
  sfxStumble() { this.beep(190, 70, 0.20, 'sawtooth', 0.18); }
  sfxPickup() { this.beep(680, 1020, 0.09, 'sine', 0.14); }
  sfxPower() { this.beep(440, 880, 0.16, 'triangle', 0.14); }
  sfxCaught() { this.beep(320, 90, 0.42, 'square', 0.2); }

  // ── BGM（ルックアヘッドスケジューラ。update()から毎フレーム呼ぶ）─────────
  // メロディ [周波数Hz, 拍数] のシーケンス（ループ）
  static BGM_MELODY = [
    [659, 0.5], [523, 0.5], [659, 0.5], [784, 0.5], // E5 C5 E5 G5
    [880, 1.0],             [784, 0.5], [659, 0.5], // A5(長) G5 E5
    [587, 0.5], [659, 0.5], [523, 0.5], [440, 0.5], // D5 E5 C5 A4
    [523, 2.0],                                       // C5(長)
  ];
  // ベースライン [周波数Hz, 拍数]
  static BGM_BASS = [
    [130, 1.0], [196, 1.0], // C3 G3
    [130, 1.0], [175, 1.0], // C3 F3
    [146, 1.0], [196, 1.0], // D3 G3
    [130, 2.0],             // C3(長)
  ];

  startBgm() {
    const ctx = this.audioCtx;
    if (!ctx || this.bgmPlaying) return;
    this.bgmMasterGain = ctx.createGain();
    this.bgmMasterGain.gain.setValueAtTime(0.07, ctx.currentTime);
    this.bgmMasterGain.connect(ctx.destination);
    this.bgmPlaying = true;
    this.bgmMelStep = 0;
    this.bgmBasStep = 0;
    this.bgmNextMel = ctx.currentTime;
    this.bgmNextBas = ctx.currentTime;
  }

  stopBgm() {
    if (!this.bgmPlaying || !this.bgmMasterGain) return;
    this.bgmPlaying = false;
    const ctx = this.audioCtx;
    if (!ctx) return;
    const g = this.bgmMasterGain;
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
  }

  bgmNote(freq, startTime, dur, type, vol) {
    const ctx = this.audioCtx;
    if (!ctx || !this.bgmMasterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    osc.connect(gain).connect(this.bgmMasterGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.01);
  }

  scheduleBgmNotes() {
    const ctx = this.audioCtx;
    if (!ctx || !this.bgmPlaying || !this.bgmMasterGain) return;
    // 追手が近いとテンポ上昇（パニックモード）
    const panic = this.gap < CHASER.warnGap;
    const bps = (panic ? 200 : 170) / 60;
    const LOOK = 0.15;
    const now = ctx.currentTime;
    const mel = GameScene.BGM_MELODY;
    const bas = GameScene.BGM_BASS;

    while (this.bgmNextMel < now + LOOK) {
      const [freq, beats] = mel[this.bgmMelStep % mel.length];
      const dur = beats / bps;
      if (freq > 0) this.bgmNote(freq, this.bgmNextMel, dur * 0.8, 'square', 0.06);
      this.bgmNextMel += dur;
      this.bgmMelStep++;
    }
    while (this.bgmNextBas < now + LOOK) {
      const [freq, beats] = bas[this.bgmBasStep % bas.length];
      const dur = beats / bps;
      if (freq > 0) this.bgmNote(freq * 2, this.bgmNextBas, dur * 0.55, 'triangle', 0.045);
      this.bgmNextBas += dur;
      this.bgmBasStep++;
    }
  }

  // ── パーティクル（dt駆動。tweenを使わず game.step でも正しく動く）──
  spawnParticles(x, y, color, count, upward) {
    for (let i = 0; i < count; i++) {
      const r = this.add.rectangle(x, y, 5, 5, color).setDepth(6);
      const ang = upward
        ? -Math.PI / 2 + (Math.random() - 0.5) * 1.8
        : -Math.random() * Math.PI; // 上半分へ
      const spd = 60 + Math.random() * 130;
      this.particles.push({
        rect: r,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0,
        ttl: 0.28 + Math.random() * 0.25,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.vy += 620 * dt; // 重力
      p.rect.x += p.vx * dt;
      p.rect.y += p.vy * dt;
      p.rect.alpha = Math.max(0, 1 - p.life / p.ttl);
      if (p.life >= p.ttl) {
        p.rect.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  // 取得時の吹き出し（tweenでなくdt駆動。上に浮いて消える）
  spawnFloatText(x, y, str, colorHex) {
    const tx = this.add
      .text(x, y, str, { fontFamily: 'sans-serif', fontSize: '18px', color: colorHex, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(7);
    this.floatTexts.push({ t: tx, life: 0, ttl: 0.8, vy: -55 });
  }

  updateFloatTexts(dt) {
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life += dt;
      f.t.y += f.vy * dt;
      f.t.alpha = Math.max(0, 1 - f.life / f.ttl);
      if (f.life >= f.ttl) {
        f.t.destroy();
        this.floatTexts.splice(i, 1);
      }
    }
  }

  spawnItem(meters) {
    const def = ITEMS[ITEM_KEYS[(Math.random() * ITEM_KEYS.length) | 0]];
    const x = GAME_W + 50;
    const float = Math.random() < ITEM_SPAWN.floatChance;
    const TARGET_ITEM_H = 52;
    const cy = float
      ? FLOOR_Y - (ITEM_SPAWN.floatYMin + Math.random() * (ITEM_SPAWN.floatYMax - ITEM_SPAWN.floatYMin))
      : FLOOR_Y - TARGET_ITEM_H / 2 - 8; // 視覚高さ基準＋bob(±7px)分マージン
    const tk = def.textureKey;
    let rect, iVisW, iVisH; // 全アイテム統一高さ（自然なアスペクト比で幅は可変）
    if (tk && this.textures.exists(tk)) {
      rect = this.add.image(x, cy, tk).setDepth(4);
      const sc = TARGET_ITEM_H / rect.height;
      rect.setScale(sc);
      iVisH = TARGET_ITEM_H;
      iVisW = Math.round(rect.width * sc);
    } else {
      iVisW = Math.round(def.w * 1.5);
      iVisH = Math.round(def.h * 1.5);
      rect = this.add.rectangle(x, cy, iVisW, iVisH, def.color).setDepth(4);
    }
    this.items.push({ x, y: cy, baseY: cy, w: def.w, h: def.h, def, rect });
  }

  collectItem(it) {
    const def = it.def;
    if (def.kind === 'gap') {
      this.changeGap(def.gap);
      this.sfxPickup();
      this.spawnFloatText(it.x, it.y - 16, pick(def.texts), hexColor(def.color));
    } else {
      this.invuln = def.ms; // ヘルシー無敵：誘惑を素通り
      this.invulnIsPower = true;
      this.turboBonus = 180; // ターボ速度ボーナス
      this.sfxPower();
      this.spawnFloatText(it.x, it.y - 16, pick(def.texts), '#ffee22');
      this.cameras.main.flash(80, 255, 238, 0, true); // 変身フラッシュ
    }
    this.spawnParticles(it.x, it.y, def.color, 16, true); // パワー時は多め
    it.rect.destroy();
  }

  update(time, delta) {
    if (this.state !== 'running') return;
    const dt = Math.min(delta, 50) / 1000; // タブ復帰時の巨大dtを抑制
    this.scheduleBgmNotes();

    // 速度アップ＆距離
    this.speed = Math.min(TUNING.maxSpeed, this.speed + TUNING.speedAccel * dt);
    this.distance += (this.speed + this.turboBonus) * dt;
    const meters = Math.floor(this.distance * TUNING.metersPerPx);
    this.scoreText.setText(`${meters} m`);

    // ステージ切り替えチェック
    const targetStage = STAGES.reduce((acc, s, i) => meters >= s.minMeters ? i : acc, 0);
    if (targetStage !== this.currentStage && !this.stageTransitioning) {
      this.triggerStageTransition(targetStage);
    }

    // 追手の接近：常時 + 距離に比例して加速（＝最終的にはミスなしでも捕まる）
    const gainRate = CHASER.baseGain + meters * CHASER.gainPerMeter;
    this.changeGap(-gainRate * dt);
    if (this.invuln > 0) this.invuln -= delta; // 無敵の減衰
    if (this.invuln <= 0) { this.invulnIsPower = false; this.turboBonus = 0; }

    // プレイヤー垂直物理
    this.vy += TUNING.gravity * dt;
    this.player.y += this.vy * dt;
    if (this.player.y >= FLOOR_Y) {
      this.player.y = FLOOR_Y;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    // 着地した瞬間：砂ぼこり＋スクワッシュ
    if (this.onGround && !this.prevOnGround) {
      this.landSquash = 0.16;
      this.spawnParticles(this.player.x, FLOOR_Y - 2, COLORS.dust, 5, false);
    }
    this.prevOnGround = this.onGround;
    if (this.landSquash > 0) this.landSquash -= dt;

    // 伏せ当たり判定（スプライトの見た目はupdatePlayerSpriteで制御）
    const targetH = this.ducking && this.onGround ? TUNING.duckH : TUNING.standH;
    this.curH = targetH;
    const sq = this.landSquash > 0 ? Math.max(0, this.landSquash) / 0.16 : 0;
    const inv = this.invuln > 0;
    const powered = inv && this.invulnIsPower;
    const spd = this.speed + this.turboBonus; // ターボ中は+180px/s
    this.updatePlayerSprite(dt, sq, inv, powered);

    // ターボ中：スピードライン生成
    if (powered && Math.random() < 0.55) {
      const ly = this.player.y - 12 - Math.random() * 65;
      const len = 38 + Math.random() * 52;
      const col = Math.random() < 0.6 ? 0xffee44 : 0xffffff;
      const line = this.add.rectangle(this.player.x - 30, ly, len, 2, col, 0.9).setDepth(4.5);
      this.speedLines.push({ rect: line, life: 0.14 });
    }
    // スピードライン更新（常に走らせて自動消滅）
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const sl = this.speedLines[i];
      sl.life -= dt;
      sl.rect.x -= (spd + 380) * dt;
      sl.rect.setAlpha(Math.max(0, sl.life / 0.14 * 0.9));
      if (sl.life <= 0) { sl.rect.destroy(); this.speedLines.splice(i, 1); }
    }
    if (!powered && this.speedLines.length > 0) {
      this.speedLines.forEach(sl => sl.rect.destroy());
      this.speedLines = [];
    }
    const panic = this.gap < CHASER.warnGap;
    this.sweatTimer -= dt;
    if (this.sweatTimer <= 0) {
      this.spawnParticles(this.player.x - 8, this.player.y - this.curH + 6, COLORS.sweat, 1, true);
      this.sweatTimer = panic ? 0.1 + Math.random() * 0.08 : 0.55 + Math.random() * 0.4;
    }

    // 背景スクロール
    this.bg.tilePositionX += spd * 0.4 * dt; // 背景パーラックス（遠景シルエット想定）

    // 障害物スポーン
    this.spawnCountdown -= spd * dt;
    if (this.spawnCountdown <= 0) {
      this.spawnObstacle(meters);
      const minGap = Math.max(270, spd * 0.82);
      this.spawnCountdown = minGap + Math.random() * 300;
    }

    // ヘルシーアイテムのスポーン（障害物とは別カデンツ）
    this.itemSpawnCountdown -= spd * dt;
    if (this.itemSpawnCountdown <= 0) {
      if (meters >= ITEM_SPAWN.startAfterMeters) this.spawnItem(meters);
      this.itemSpawnCountdown = ITEM_SPAWN.minGap + Math.random() * ITEM_SPAWN.randGap;
    }

    // 障害物移動＆当たり判定
    const pLeft = this.player.x - TUNING.playerW / 2 + TUNING.hitInsetX;
    const pRight = this.player.x + TUNING.playerW / 2 - TUNING.hitInsetX;
    const pBottom = this.player.y;
    const pTop = this.player.y - this.curH + TUNING.hitInsetTop;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= spd * dt;
      o.rect.x = o.x;
      // 当たり判定（手動AABB）
      const oLeft = o.x - o.w / 2;
      const oRight = o.x + o.w / 2;
      const overlap =
        pRight > oLeft && pLeft < oRight && pBottom > o.top && pTop < o.bottom;

      if (overlap && !o.hit) {
        if (this.invuln <= 0) {
          this.stumble(o, i); // 即終了ではなく追手に詰められる
          continue; // o は破棄済み
        }
        o.hit = true; // 無敵中の接触はノーカウント
      }

      // きれいに避けて通過 → gap 回復
      if (!o.hit && !o.counted && o.x < TUNING.playerX - o.w / 2 - 6) {
        o.counted = true;
        this.changeGap(CHASER.passReward);
      }

      // 画面外で破棄
      if (o.x < -80) {
        o.rect.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // ヘルシーアイテム移動＆取得（プレイヤーAABBは上で算出済み）
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.x -= spd * dt;
      // 上下浮遊アニメ
      const bob = 7 * Math.sin(this.time.now / 420 + it.x * 0.008);
      it.y = it.baseY + bob;
      it.rect.x = it.x;
      it.rect.y = it.y;
      const iL = it.x - it.w / 2;
      const iR = it.x + it.w / 2;
      const iT = it.y - it.h / 2;
      const iB = it.y + it.h / 2;
      if (pRight > iL && pLeft < iR && pBottom > iT && pTop < iB) {
        this.collectItem(it);
        this.items.splice(i, 1);
        continue;
      }
      if (it.x < -60) {
        it.rect.destroy();
        this.items.splice(i, 1);
      }
    }

    this.updateParticles(dt);
    this.updateFloatTexts(dt);

    // 追手の見た目・ゲージ更新 → 捕まったら終了
    this.updateChaser(dt);
    this.updateGauge();
    if (this.gap <= CHASER.caughtGap) {
      this.gameOver(meters);
    }
  }

  spawnObstacle(meters) {
    // 最初の数百mはジャンプ障害物だけ（伏せは後から登場）にして優しく
    let key;
    if (meters < 250) {
      const ground = OBSTACLE_KEYS.filter((k) => OBSTACLES[k].onGround);
      key = ground[(Math.random() * ground.length) | 0];
    } else {
      key = OBSTACLE_KEYS[(Math.random() * OBSTACLE_KEYS.length) | 0];
    }
    const def = OBSTACLES[key];
    const x = GAME_W + 60;

    // ヒットボックス（当たり判定用）
    const hitBottom = def.onGround ? FLOOR_Y : FLOOR_Y - def.clearance;
    const hitTop = hitBottom - def.h;

    // ビジュアル：スプライトは常に地面から立つ（poleがある障害物も含む）
    const visualBottom = FLOOR_Y;

    const tk = def.textureKey;
    let rect, visW, visH;
    if (tk && this.textures.exists(tk)) {
      rect = this.add.image(x, visualBottom, tk).setOrigin(0.5, 1).setDepth(4);
      // 自然なアスペクト比を保ちつつ適切な高さに縮小表示（大きすぎると背景に浮く）
      // clearance障害物（テープ等）はポール込みの全体高さを表示
      const targetH = def.onGround
        ? Math.min(def.h * 1.4, 72)
        : Math.min((def.clearance + def.h) * 1.0, 80);
      const scale = targetH / rect.height;
      rect.setScale(scale);
      visH = Math.round(rect.height * scale);
      visW = Math.round(rect.width * scale);
    } else {
      visH = Math.min(def.h * 2, 96);
      visW = Math.round(def.w * (visH / def.h));
      rect = this.add.rectangle(x, visualBottom, visW, visH, def.color).setOrigin(0.5, 1).setDepth(4);
    }
    this.obstacles.push({ x, w: def.w, h: def.h, top: hitTop, bottom: hitBottom, rect });
  }

  gameOver(meters) {
    this.state = 'gameover';
    this.stopBgm();
    this.hideHint();
    this.warnText.setAlpha(0);
    this.player.setAlpha(1);
    this.cameras.main.shake(180, 0.012);
    this.cameras.main.flash(120, 255, 120, 120);
    this.sfxCaught();

    // プレイヤー → hurt ポーズ、追手 → caught ポーズ
    this.speedLines.forEach(sl => sl.rect.destroy());
    this.speedLines = [];
    this.player.setTexture('player_hurt_1');
    this.player.setScale(this._playerBaseScale);
    this.player.clearTint();
    this.chaser.setTexture(`${this.chaserPrefix}_caught`);
    this.chaser.setScale(CHASER.h / this.chaser.height);
    this.chaser.clearTint();

    if (meters > this.best) {
      this.best = meters;
      localStorage.setItem(BEST_KEY, String(meters));
    }

    // オーバーレイ
    const ov = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.45).setDepth(30);
    const isNewBest = meters >= this.best && meters > 0;
    // コメディ台詞（距離で寄せる）
    const pool = meters >= FLAVOR.caughtFarMeters ? FLAVOR.caughtFar : FLAVOR.caught;
    const flavorLine = pick(pool);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 86, 'つかまった！', {
        fontFamily: 'sans-serif', fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 44, `「${flavorLine}」`, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd9a0',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 2, `距離 ${meters} m${isNewBest ? '  🎉ベスト更新!' : ''}`, {
        fontFamily: 'sans-serif', fontSize: '24px', color: '#ffe9a8',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 + 32, `ベスト ${this.best} m`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 + 74, 'タップ／スペースでリトライ', {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#bfe3ff',
      })
      .setOrigin(0.5)
      .setDepth(31);

    // 誤タップ即リスタート防止に一瞬だけ無効化
    this.canRetry = false;
    this.time.delayedCall(350, () => (this.canRetry = true));
    ov.setData('guard', true);
  }

  restartGame() {
    if (this.canRetry === false) return;
    this.scene.restart();
  }
}
