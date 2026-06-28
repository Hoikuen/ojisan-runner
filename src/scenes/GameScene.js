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
    for (let i = 1; i <= 4; i++) this.load.image(`chaser_run_${i}`, `${base}chaser_obasan/run_${i}.png`);
    this.load.image('chaser_caught', `${base}chaser_obasan/caught.png`);
    for (const k of ['ramen','beer','karaage','vending','chocolate','oil','butter','mayo'])
      this.load.image(`obs_${k}`, `${base}obstacles/${k}.png`);
    for (const k of ['veggie','water','aojiru','dumbbell'])
      this.load.image(`item_${k}`, `${base}items/${k}.png`);
    this.load.image('bg_sidewalk', 'assets/sprites/background/sidewalk.png');
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

    // ── 地面ライン（走る基準線：6px）──────────────────────────────
    this.add
      .rectangle(GAME_W / 2, FLOOR_Y, GAME_W, 6, COLORS.groundTop)
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
    this.chaser = this.add
      .image(0, FLOOR_Y, 'chaser_run_1')
      .setOrigin(0.5, 1)
      .setDepth(4);
    const CHASER_DISPLAY_H = 110;
    this.chaserBaseScale = CHASER_DISPLAY_H / this.chaser.height;
    this.chaser.setScale(this.chaserBaseScale);
    this.chaserAnimFrame = 0;
    this.chaserAnimTimer = 0;

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
    let ptStartY = 0;
    let ptDucked = false;

    this.input.on('pointerdown', (p) => {
      this.initAudio();
      ptStartY = p.y;
      ptDucked = false;
      if (this.state === 'gameover') { this.restartGame(); return; }
    });
    this.input.on('pointermove', (p) => {
      if (this.state !== 'running' || ptDucked) return;
      if (p.y - ptStartY > 40) { ptDucked = true; this.startDuck(); }
    });
    this.input.on('pointerup', () => {
      if (this.state === 'running' && !ptDucked) this.jump();
      this.stopDuck();
      ptDucked = false;
    });
    this.input.on('pointerupoutside', () => { this.stopDuck(); ptDucked = false; });

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
    o.glow.destroy();
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
      this.chaser.setTexture(`chaser_run_${this.chaserAnimFrame + 1}`);
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

    // ヘルシー無敵ティント
    if (powered) {
      this.player.setTint(COLORS.playerPower);
    } else {
      this.player.clearTint();
    }

    // 無敵中の点滅
    this.player.setAlpha(
      inv && Math.floor(this.time.now / 80) % 2 === 0 ? (powered ? 0.7 : 0.45) : 1
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
    const cy = float
      ? FLOOR_Y - (ITEM_SPAWN.floatYMin + Math.random() * (ITEM_SPAWN.floatYMax - ITEM_SPAWN.floatYMin))
      : FLOOR_Y - def.h / 2 - 4;
    const tk = def.textureKey;
    let rect;
    // アイテムは1.5倍表示
    const iVisW = Math.round(def.w * 1.5);
    const iVisH = Math.round(def.h * 1.5);
    if (tk && this.textures.exists(tk)) {
      rect = this.add.image(x, cy, tk).setDepth(4);
      rect.setDisplaySize(iVisW, iVisH);
    } else {
      rect = this.add.rectangle(x, cy, iVisW, iVisH, def.color).setDepth(4);
    }
    // 黄金グロー（アイテムを障害物と明確に区別）
    const aura = this.add.rectangle(x, cy, iVisW + 16, iVisH + 16, 0xffd700, 0.55).setDepth(3);
    this.items.push({ x, y: cy, baseY: cy, w: def.w, h: def.h, def, rect, aura });
  }

  collectItem(it) {
    const def = it.def;
    if (def.kind === 'gap') {
      this.changeGap(def.gap);
      this.sfxPickup();
      this.spawnFloatText(it.x, it.y - 16, pick(FLAVOR.pickupGap), hexColor(def.color));
    } else {
      this.invuln = def.ms; // ヘルシー無敵：誘惑を素通り
      this.invulnIsPower = true;
      this.sfxPower();
      this.spawnFloatText(it.x, it.y - 16, pick(FLAVOR.pickupPower), hexColor(COLORS.playerPower));
    }
    this.spawnParticles(it.x, it.y, def.color, 8, true);
    it.aura.destroy();
    it.rect.destroy();
  }

  update(time, delta) {
    if (this.state !== 'running') return;
    const dt = Math.min(delta, 50) / 1000; // タブ復帰時の巨大dtを抑制
    this.scheduleBgmNotes();

    // 速度アップ＆距離
    this.speed = Math.min(TUNING.maxSpeed, this.speed + TUNING.speedAccel * dt);
    this.distance += this.speed * dt;
    const meters = Math.floor(this.distance * TUNING.metersPerPx);
    this.scoreText.setText(`${meters} m`);

    // 追手の接近：常時 + 距離に比例して加速（＝最終的にはミスなしでも捕まる）
    const gainRate = CHASER.baseGain + meters * CHASER.gainPerMeter;
    this.changeGap(-gainRate * dt);
    if (this.invuln > 0) this.invuln -= delta; // 無敵の減衰
    if (this.invuln <= 0) this.invulnIsPower = false;

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
    this.updatePlayerSprite(dt, sq, inv, powered);
    const panic = this.gap < CHASER.warnGap;
    this.sweatTimer -= dt;
    if (this.sweatTimer <= 0) {
      this.spawnParticles(this.player.x - 8, this.player.y - this.curH + 6, COLORS.sweat, 1, true);
      this.sweatTimer = panic ? 0.1 + Math.random() * 0.08 : 0.55 + Math.random() * 0.4;
    }

    // 背景スクロール
    this.bg.tilePositionX += this.speed * dt;

    // 障害物スポーン
    this.spawnCountdown -= this.speed * dt;
    if (this.spawnCountdown <= 0) {
      this.spawnObstacle(meters);
      // 次までの間隔：速いほど広げて理不尽防止（反応時間を確保）
      const minGap = Math.max(270, this.speed * 0.82);
      this.spawnCountdown = minGap + Math.random() * 300;
    }

    // ヘルシーアイテムのスポーン（障害物とは別カデンツ）
    this.itemSpawnCountdown -= this.speed * dt;
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
      o.x -= this.speed * dt;
      o.rect.x = o.x;
      o.glow.x = o.x;
      o.glow.setAlpha(0.35 + 0.35 * Math.abs(Math.sin(this.time.now / 320)));

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
        o.glow.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // ヘルシーアイテム移動＆取得（プレイヤーAABBは上で算出済み）
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.x -= this.speed * dt;
      // 上下浮遊アニメ
      const bob = 7 * Math.sin(this.time.now / 420 + it.x * 0.008);
      it.y = it.baseY + bob;
      it.rect.x = it.x;
      it.rect.y = it.y;
      it.aura.x = it.x;
      it.aura.y = it.y;
      it.aura.setAlpha(0.35 + 0.35 * Math.abs(Math.sin(this.time.now / 480)));
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
        it.aura.destroy();
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

    let bottom; // 障害物の下端Y
    if (def.onGround) {
      bottom = FLOOR_Y;
    } else {
      bottom = FLOOR_Y - def.clearance; // 床から clearance だけ浮く
    }
    const top = bottom - def.h;

    const tk = def.textureKey;
    let rect;
    // 見た目は2倍サイズ（最大96px）。ヒットボックスは def.w/h のまま。
    const visH = Math.min(def.h * 2, 96);
    const visW = Math.round(def.w * (visH / def.h));
    if (tk && this.textures.exists(tk)) {
      rect = this.add.image(x, bottom, tk).setOrigin(0.5, 1).setDepth(4);
      rect.setDisplaySize(visW, visH);
    } else {
      rect = this.add.rectangle(x, bottom, visW, visH, def.color).setOrigin(0.5, 1).setDepth(4);
    }
    // 赤いハザードグロー（障害物の視認性向上）
    const glow = this.add
      .rectangle(x, bottom, visW + 18, visH + 18, 0xff2200, 0.55)
      .setOrigin(0.5, 1)
      .setDepth(3);

    this.obstacles.push({ x, w: def.w, h: def.h, top, bottom, rect, glow });
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
    this.player.setTexture('player_hurt_1');
    this.player.setScale(this._playerBaseScale);
    this.player.clearTint();
    this.chaser.setTexture('chaser_caught');
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
