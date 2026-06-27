import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from './config.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game',
  backgroundColor: COLORS.sky,
  scale: {
    mode: Phaser.Scale.FIT, // どの画面でもレターボックスで収める
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

// dev時のみ：検証用にゲームインスタンスを公開（背景タブでrAFが止まる環境で
// game.step() で実ループを手動駆動して確認するため）。本番ビルドには出ない。
if (import.meta.env.DEV) window.__game = game;
