import Phaser from 'phaser';
import { GAME_W, GAME_H, FLOOR_Y, COLORS, FLAVOR, BEST_KEY } from '../config.js';

const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // 空
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLORS.sky);

    // 路面（GameScene と同じ）
    const roadH = GAME_H - FLOOR_Y;
    this.add.rectangle(GAME_W / 2, FLOOR_Y + roadH / 2, GAME_W, roadH, 0x23232e);
    this.add.rectangle(GAME_W / 2, FLOOR_Y + 1, GAME_W, 3, 0x4a4a5a);

    // タイトル
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 100, 'おじさんランナー', {
        fontFamily: 'sans-serif',
        fontSize: '52px',
        color: '#c0354f',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // キャッチフレーズ（ランダム）
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 34, pick(FLAVOR.intro), {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#1d2a33',
      })
      .setOrigin(0.5);

    // ベスト記録
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (best > 0) {
      this.add
        .text(GAME_W / 2, GAME_H / 2 + 16, `ベスト記録  ${best} m`, {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#556677',
        })
        .setOrigin(0.5);
    }

    // スタート促し（点滅）
    const startText = this.add
      .text(GAME_W / 2, GAME_H / 2 + 60, 'タップ ／ スペースで開始！', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#1d5c8a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: startText,
      alpha: 0.25,
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 入力（最初の1回だけ反応）
    const go = () => this.scene.start('GameScene');
    this.input.once('pointerdown', go);
    const kb = this.input.keyboard;
    if (kb) {
      kb.once('keydown-SPACE', go);
      kb.once('keydown-UP', go);
      kb.once('keydown-W', go);
    }
  }
}
