# おじさんランナー — イラスト発注プロンプト集

作成日: 2026-06-28
対象AI: ChatGPT(DALL-E 3) / Nanobanana(Antigravity・画像入力でキャラ一貫性が強い)

> 使い方：下の各プロンプトをコピペして画像AIに投げる。
> 生成したら `raw_generated/` フォルダに保存 → extract_better.py で透過抽出 → `public/assets/sprites/` に配置。
> おじさんXのキャラ画像（idle_1.png等）を参照画像として添付すると一貫性が上がる。

---

## 0. 発注ルール（4つ守る）

1. **背景は純白 `#FFFFFF`** ─ 透過抽出（flood-fill）が確実に効く。影・グラデ背景を出さない
2. **キャラの足元をフレーム下端に揃える** ─ 床めり込み防止
3. **横向き・右向き**（side view, facing right）で統一 ─ ゲームは右向き基準
4. **抽出は `extract_better.py`**（しきい値除去は禁止）→ 生成後に目視確認

---

## 1. 共通スタイルブロック（全プロンプトに付ける）

```
STYLE: retro video game character sprite, clean cartoon pixel-art illustration,
bold dark outlines, flat cel shading, vibrant colors, side view facing right,
full body, character standing on the bottom edge of the frame,
isolated on a pure solid white background (#FFFFFF), no shadow, no floor,
no background scenery, no text, single character, high detail pixel art.
```

---

## 2. キャラクター定義

### 主人公 OJISAN（おじさん）
おじさんXをベースに、ランナー用にリデザイン。より若く（30代後半〜40代）、ひげあり、汗だく必死顔。

```
CHARACTER: "Ojisan Runner" — a sweaty desperate Japanese salaryman, late 30s to early 40s,
chubby round face with red flushed cheeks, thick black mustache AND short beard stubble,
slightly receding black hair, round glasses, wearing a dark navy business suit with jacket
slightly open, tie flying backward from the speed. White dress shirt visible.
He is in full-sprint panic mode: wide terrified eyes, sweat drops flying everywhere,
arms pumping hard while running. Comical but endearing. 2-3 head body proportion.
```

> ⭐ **一貫性のコツ**：まず run_1 を1枚確定させ、その画像を参照に他ポーズを作ると顔・服がブレない。
> おじさんXの `idle_1.png`（`ojisan-x/public/assets/sprites/extracted_v2/player_ojisan/idle_1.png`）を
> 参照として添付すると雰囲気を引き継ぎやすい。

---

### 追手 OBASAN（事務のおばさん）
会社の事務職おばさん。大仏顔・太っちょ・汗だくで必死に追いかける。

```
CHARACTER: "Obasan Chaser" — a stout Japanese female office worker, mid-to-late 40s,
round Buddha-like face (serene oval face, slightly droopy features) but with desperate
sweating panic expression and wide frantic eyes, chubby plump figure, short permed hair,
wearing business casual office clothes: plain blouse, dark slacks or knee-length skirt,
sensible low-heeled shoes. She is in full sprint chasing someone: face flushed deep red,
sweat drops everywhere, legs pumping frantically, arms swinging wildly.
Comical determined chaser energy. 2-3 head body proportion.
```

---

## 3. 主人公 OJISAN ポーズ発注（優先 9枚）

### 走行アニメ（run_1〜run_4）★最優先
> 4コマ全て「同じキャンバスサイズ・同じ足元位置・同じ全身サイズ」で出力（パラパラになるように）

```
[CHARACTER: Ojisan Runner]
POSE run_1: RUNNING — right leg fully forward and extended, left leg bent behind,
left arm punching forward, right arm pulled back. Full sprint. Sweat drops flying.
[STYLE]
```

```
[CHARACTER: Ojisan Runner]
POSE run_2: RUNNING — both feet near the ground, mid-stride transition, body leaning
slightly forward, arms crossing at center. Mouth open panting.
[STYLE]
```

```
[CHARACTER: Ojisan Runner]
POSE run_3: RUNNING — left leg fully forward and extended, right leg bent behind,
right arm punching forward, left arm pulled back. Full sprint. Sweat drops flying.
[STYLE]
```

```
[CHARACTER: Ojisan Runner]
POSE run_4: RUNNING — mid-stride transition opposite of run_2, body slightly upright,
arms re-crossing. Glasses slightly askew from the speed.
[STYLE]
```

---

### ジャンプ（jump・1枚）

```
[CHARACTER: Ojisan Runner]
POSE jump: JUMPING — airborne, both knees tucked up toward chest, arms raised slightly,
body compact in mid-air. Sweat drops arc outward from the momentum. Eyes wide.
[STYLE]
```

---

### 伏せ（duck・1枚）

```
[CHARACTER: Ojisan Runner]
POSE duck: DUCKING/CROUCHING — very low crouching slide, body flattened horizontally,
knees bent and close to the ground, head ducked low, arms extended slightly forward
for balance. Suit jacket hitched up. Desperate grimace. Full sprint crouch.
[STYLE]
```

---

### つまずき・被弾（hurt・2枚）

```
[CHARACTER: Ojisan Runner]
POSE hurt_1: STUMBLING — tripping forward off-balance, one foot caught, arms flailing
outward wildly, body lurching forward at an angle, glasses flying off slightly.
Shocked open-mouthed expression. Sweat flying everywhere.
[STYLE]
```

```
[CHARACTER: Ojisan Runner]
POSE hurt_2: STUMBLING RECOVERY — recovering from trip, hunched forward, one knee lower,
arms out for balance, pained desperate expression, sweat and tears mixing.
[STYLE]
```

---

### 待機（idle・2枚・オプション）

```
[CHARACTER: Ojisan Runner]
POSE idle_1: CATCHING BREATH — bent forward slightly, hands on knees, panting and sweating
heavily. Looking back over one shoulder with terror. Full body visible.
[STYLE]
```

```
[CHARACTER: Ojisan Runner]
POSE idle_2: NERVOUS WAIT — same bent-forward stance, slightly shifted weight, still sweating.
[STYLE]
```

---

## 4. 追手 OBASAN ポーズ発注（優先 5枚）

### 走行アニメ（run_1〜run_4）★最優先

```
[CHARACTER: Obasan Chaser]
POSE run_1: CHASING RUN — right leg forward fully extended, left leg back, left arm
forward, right arm back. Determined furious sprint. Cheeks jiggling, sweat flying.
[STYLE]
```

```
[CHARACTER: Obasan Chaser]
POSE run_2: CHASING RUN — mid-stride, both feet near ground, arms crossing center,
mouth open yelling or determined. Skirt/slacks swishing.
[STYLE]
```

```
[CHARACTER: Obasan Chaser]
POSE run_3: CHASING RUN — left leg forward fully extended, right leg back, right arm
forward, left arm back. Sweat droplets arc outward.
[STYLE]
```

```
[CHARACTER: Obasan Chaser]
POSE run_4: CHASING RUN — mid-stride transition, body slightly upright, arms re-crossing,
expression intense and single-minded.
[STYLE]
```

---

### 捕まえた（caught・1枚・オプション）

```
[CHARACTER: Obasan Chaser]
POSE caught: GRABBING — lunging forward triumphantly with both arms outstretched,
mouth open in a shout, one foot off the ground in final pounce. Victorious but comical.
[STYLE]
```

---

## 5. 障害物（8種・各1枚）

> キャラと違い小さなアイテム図。**側面か正面やや斜め・全体が見える・白背景**で発注。

### 既存4種

```
ITEM obstacle: a steaming bowl of Japanese ramen (tonkotsu style), chopsticks resting on top,
rich broth visible, noodles, tempting and delicious looking. Small icon size.
Side view. isolated on pure solid white background (#FFFFFF), no shadow,
clean pixel-art style, bold outlines, flat colors.
```

```
ITEM obstacle: a tall foaming glass mug of cold beer, golden amber beer, thick white foam
spilling over the top, a few bubbles. Tempting and cold looking. Small icon.
Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM obstacle: a pile of Japanese karaage fried chicken pieces in a small paper basket,
golden-brown crispy coating, steam rising, mouth-watering. Small icon.
Slightly angled top-down view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art.
```

```
ITEM obstacle: a rectangular sign hanging in the air (like a vending machine advertisement sign),
colorful Japanese vending machine graphic, hanging by two chains from above.
Wide and low. Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art.
```

---

### 新規4種（追加障害物）

```
ITEM obstacle: a tempting chocolate bar, dark brown, partially unwrapped in gold foil,
one row broken off revealing the chocolate inside. Small icon.
Slightly angled view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM obstacle: a Japanese vegetable cooking oil bottle (PET bottle style),
clear golden oil inside, Japanese label, cap on top. Small icon.
Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM obstacle: a rectangular stick of butter on a small wrapper/paper,
golden-yellow, slightly soft-looking, a small knife or pat mark on top. Small icon.
Slightly angled view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM obstacle: a Kewpie-style Japanese mayonnaise squeeze bottle, white body,
yellow cap, red kewpie logo area, slightly squeezed. Small icon.
Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

---

## 6. ヘルシーアイテム（4種・各1枚）

```
ITEM pickup: a fresh bunch of green vegetables — broccoli floret or carrot,
bright healthy green/orange, glowing with health energy, small sparkles around it.
Small icon. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM pickup: a clear plastic water bottle, fresh blue water inside, small bubbles,
clean and refreshing looking, blue cap. Small icon.
Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM pickup: a small glass of aojiru (Japanese green vegetable juice), vivid neon green,
slightly frothy, healthy glow around it, small leaf garnish.
Small icon. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

```
ITEM pickup: a classic black dumbbell (small hand weight), both weights visible,
slightly shiny metallic. Small icon.
Side view. isolated on pure solid white background (#FFFFFF), no shadow, pixel art, bold outlines.
```

---

## 7. 背景

```
SCENE: a Japanese city sidewalk street scene, daytime, the character runs from left to right.
Wide concrete sidewalk, buildings in the background (office buildings, shops), powerlines above,
a bit of sky. Sunny. Slightly comedic/cartoonish mood. NO characters, no people.
Horizontal layout for side-scrolling. retro pixel-art game background,
flat colors, clean bold outlines.
Width much greater than height (panoramic). Can tile horizontally.
```

---

## 8. 発注優先順

| 優先 | 内容 | 枚数 |
|---|---|---|
| ① 最優先 | おじさん走行4コマ（run_1〜4） | 4 |
| ② 最優先 | おじさんジャンプ・伏せ・つまずき | 4 |
| ③ 次優先 | おばさん走行4コマ（run_1〜4） | 4 |
| ④ その次 | 障害物8種 | 8 |
| ⑤ その次 | アイテム4種 | 4 |
| ⑥ オプション | 背景・おじさんidle・おばさんcaught | 3+ |

**合計：最低24枚。多めに発注してもコード変更不要（config.js の color を textureキーに差し替えるだけ）。**

---

## 9. 生成後の手順

1. 生成画像を `raw_generated/` に保存（ファイル名は `run_1.png` `duck.png` など）
2. `extract_better.py`（ojisan-xの tools/ にある）で透過抽出
3. 抽出後は目視確認（服の白・薄い部分が消えていないか）
4. `public/assets/sprites/` に配置
5. `src/scenes/GameScene.js` でテクスチャキーに差し替え（`config.js` の OBSTACLES/ITEMS の color → textureキー）
