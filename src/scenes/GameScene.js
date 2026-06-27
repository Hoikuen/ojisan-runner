import Phaser from 'phaser';
import {
  GAME_W,
  GAME_H,
  FLOOR_Y,
  COLORS,
  TUNING,
  OBSTACLES,
  BEST_KEY,
} from '../config.js';

const OBSTACLE_KEYS = Object.keys(OBSTACLES);

// 手動物理のエンドレスランナー。
// - プレイヤーはX固定。垂直は vy 変数 + 重力で手動制御（Arcade不使用＝床めり込み等の罠を回避）。
// - 障害物は左へ流れる矩形。当たり判定は手動AABB。
// 状態: 'running' | 'gameover'
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.state = 'running';

    // ベスト距離（localStorage）
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);

    // ── 背景（雲）────────────────────────────────────────────────
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add
        .ellipse(80 + i * 220, 70 + (i % 2) * 40, 110, 46, COLORS.cloud, 0.85)
        .setDepth(0);
      this.clouds.push(c);
    }

    // ── 地面 ────────────────────────────────────────────────────
    this.add
      .rectangle(GAME_W / 2, FLOOR_Y, GAME_W, 6, COLORS.groundTop)
      .setDepth(2);
    this.add
      .rectangle(GAME_W / 2, (FLOOR_Y + GAME_H) / 2 + 3, GAME_W, GAME_H - FLOOR_Y, COLORS.ground)
      .setDepth(1);

    // 地面のスクロール縞（スピード感）
    this.stripes = [];
    const stripeGap = 70;
    for (let x = 0; x < GAME_W + stripeGap; x += stripeGap) {
      const s = this.add
        .rectangle(x, FLOOR_Y + 18, 34, 10, COLORS.stripe)
        .setDepth(2);
      this.stripes.push(s);
    }
    this.stripeSpan = GAME_W + stripeGap;

    // ── プレイヤー（おじさん＝四角）──────────────────────────────
    this.player = this.add
      .rectangle(TUNING.playerX, FLOOR_Y, TUNING.playerW, TUNING.standH, COLORS.player)
      .setOrigin(0.5, 1) // 足元基準
      .setDepth(5);
    // 顔っぽい目印（向きが分かるように前方に小さな目）
    this.eye = this.add.rectangle(0, 0, 7, 7, 0x222222).setDepth(6);

    this.vy = 0;
    this.onGround = true;
    this.ducking = false;
    this.curH = TUNING.standH;

    // ── 障害物 ──────────────────────────────────────────────────
    this.obstacles = [];
    this.spawnCountdown = 480; // 最初の障害物までの距離(px)

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

    // 操作ヒント（数秒で消える）
    this.hint = this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, 'タップ／クリック：ジャンプ\n画面下を長押し（または↓）：伏せる', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#1d2a33',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 3200, duration: 800 });

    // ── 入力 ────────────────────────────────────────────────────
    this.setupInput();
  }

  setupInput() {
    // ポインタ：画面下 1/3 は「伏せる」ゾーン、それ以外は「ジャンプ」
    this.input.on('pointerdown', (p) => {
      if (this.state === 'gameover') {
        this.restartGame();
        return;
      }
      if (p.y > GAME_H * 0.66) this.startDuck();
      else this.jump();
    });
    this.input.on('pointerup', () => this.stopDuck());
    this.input.on('pointerupoutside', () => this.stopDuck());

    // キーボード
    const kb = this.input.keyboard;
    if (kb) {
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
    if (this.hint && this.hint.alpha > 0) {
      this.tweens.killTweensOf(this.hint);
      this.hint.setAlpha(0);
    }
  }

  jump() {
    if (this.state !== 'running' || !this.onGround) return;
    this.vy = -TUNING.jumpVel;
    this.onGround = false;
    this.ducking = false;
    this.hideHint();
  }

  startDuck() {
    if (this.state !== 'running') return;
    this.ducking = true;
    this.hideHint();
  }

  stopDuck() {
    this.ducking = false;
  }

  update(time, delta) {
    if (this.state !== 'running') return;
    const dt = Math.min(delta, 50) / 1000; // タブ復帰時の巨大dtを抑制

    // 速度アップ＆距離
    this.speed = Math.min(TUNING.maxSpeed, this.speed + TUNING.speedAccel * dt);
    this.distance += this.speed * dt;
    const meters = Math.floor(this.distance * TUNING.metersPerPx);
    this.scoreText.setText(`${meters} m`);

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

    // 伏せ（地上のみ有効。空中は立ち姿で当たり判定フル）
    const targetH = this.ducking && this.onGround ? TUNING.duckH : TUNING.standH;
    this.curH = targetH;
    this.player.displayHeight = targetH; // origin(0.5,1) で足元固定のまま縮む
    this.player.fillColor = targetH === TUNING.duckH ? COLORS.playerDuck : COLORS.player;
    // 目を前方上部に追従
    this.eye.x = this.player.x + TUNING.playerW / 2 - 9;
    this.eye.y = this.player.y - this.curH + 12;

    // 背景スクロール
    for (const c of this.clouds) {
      c.x -= this.speed * 0.15 * dt;
      if (c.x < -70) c.x += GAME_W + 140;
    }
    for (const s of this.stripes) {
      s.x -= this.speed * dt;
      if (s.x < -34) s.x += this.stripeSpan;
    }

    // 障害物スポーン
    this.spawnCountdown -= this.speed * dt;
    if (this.spawnCountdown <= 0) {
      this.spawnObstacle(meters);
      // 次までの間隔：速いほど広げて理不尽防止（反応時間を確保）
      const minGap = Math.max(270, this.speed * 0.82);
      this.spawnCountdown = minGap + Math.random() * 300;
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

      // 当たり判定（手動AABB）
      const oLeft = o.x - o.w / 2;
      const oRight = o.x + o.w / 2;
      if (
        pRight > oLeft &&
        pLeft < oRight &&
        pBottom > o.top &&
        pTop < o.bottom
      ) {
        this.gameOver(meters);
        return;
      }

      // 画面外で破棄
      if (o.x < -80) {
        o.rect.destroy();
        this.obstacles.splice(i, 1);
      }
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

    const rect = this.add
      .rectangle(x, bottom, def.w, def.h, def.color)
      .setOrigin(0.5, 1)
      .setDepth(4);

    this.obstacles.push({ x, w: def.w, h: def.h, top, bottom, rect });
  }

  gameOver(meters) {
    this.state = 'gameover';
    this.hideHint();
    this.cameras.main.shake(180, 0.012);
    this.cameras.main.flash(120, 255, 120, 120);

    if (meters > this.best) {
      this.best = meters;
      localStorage.setItem(BEST_KEY, String(meters));
    }

    // オーバーレイ
    const ov = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.45).setDepth(30);
    const isNewBest = meters >= this.best && meters > 0;
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 70, 'つかまった！', {
        fontFamily: 'sans-serif', fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 14, `距離 ${meters} m${isNewBest ? '  🎉ベスト更新!' : ''}`, {
        fontFamily: 'sans-serif', fontSize: '24px', color: '#ffe9a8',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 + 22, `ベスト ${this.best} m`, {
        fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_W / 2, GAME_H / 2 + 70, 'タップ／スペースでリトライ', {
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
