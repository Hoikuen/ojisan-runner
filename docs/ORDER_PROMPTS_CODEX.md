# おじさんランナー — Codex(画像生成)用 完全発注プロンプト集

作成日: 2026-06-28 ／ 対象: ojisan-runner ／ 渡す先: Codex

> **Codexへの渡し方テンプレ（{ }を埋めてそのままコピペ）：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner （他ゲームに保存しないこと）。
> まず git pull で最新の docs/ORDER_PROMPTS_CODEX.md を取得（最新ならスキップ）。
> そのうえで {対象セクション 例: R0（主人公ランシート）} だけ生成してください。
> - キャラの緑シートは ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/ に保存
> - 背景の不透明1枚絵は ~/Developer/games/ojisan-runner/public/assets/sprites/background/ に保存
> - 1枚ごとにフルパスでファイル名を報告。
> このグループだけ。次は私が改めて指示します。
> ```
>
> ⚠️ 緑シートを extracted_v2/ に直接入れると壊れる。必ず raw_generated/ へ。
> 緑が濁る/崩れる時は「make each pose as a SEPARATE image」に切り替える。

---

## 0. 全体ルール

- **キャラ背景は純緑 `#00FF00`**（濃紺スーツ・黒髪と分離しやすい。白フチ問題を回避）
- **背景イラストは不透明な1枚絵**（緑不要）
- **横向き・右向き**（side view, facing right）。左向きはコードで反転
- 1グループ＝**全ポーズを横1列のシート1枚**（等間隔・足元をコマ下端に揃える）
- 連番アニメは**同じ立ち位置・同じ画角・同じ全身サイズ**（パラパラで動いて見える）

---

## 共通スタイルブロック（全キャラプロンプトに付ける）

```
Style: cute retro 16-bit pixel-art game sprite, bold dark outlines, flat cel shading, vibrant colors.
Side view, facing right, full body, feet resting on the very bottom edge of the frame.
Isolated on a SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no scenery,
no shadow, no floor, no text, no numbers, no watermarks. Single character only.
Lay out all poses in ONE horizontal row, evenly spaced, the SAME character at the SAME scale
in every pose, all feet aligned to the bottom. Output as a single image.
(If multi-pose layout is unreliable, output each pose as a separate image with this exact description.)
```

---

## 推奨発注順

| 順 | グループ | シート名 | コマ数 |
|---|---|---|---|
| ① | R0 主人公ラン | ojisan_run_sheet.png | 4 |
| ② | R1 主人公リアクション | ojisan_react_sheet.png | 4 |
| ③ | R2 追手おばさんラン | obasan_run_sheet.png | 5 |
| ④ | R3 障害物まとめ | obstacles_sheet.png | 8 |
| ⑤ | R4 アイテムまとめ | items_sheet.png | 4 |
| ⑥ | R5 背景（歩道） | background/sidewalk.png | 1枚絵 |

---

# R0：主人公おじさん・走行アニメ（★最優先）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/ojisan_run_sheet.png`
**抽出後の配置先：** `extracted_v2/player_ojisan/` → `run_1.png` `run_2.png` `run_3.png` `run_4.png`

### キャラ共通記述（毎シートに貼る）
```
CHARACTER "Ojisan Runner": a sweaty desperate Japanese salaryman, late 30s to early 40s.
Chubby round face with rosy red flushed cheeks, THICK BLACK MUSTACHE and short beard stubble,
slightly receding black hair, round glasses, wearing a dark navy business suit with jacket
slightly open, tie flying backward from the running speed, white dress shirt visible.
He is in full-sprint panic mode: wide terrified eyes, sweat drops flying everywhere,
arms pumping hard. Comical but endearing. 2-3 head body proportion, short plump limbs.
KEEP THE EXACT SAME character — same head-to-body ratio and SAME overall pixel size in every pose.
```

### Codex用プロンプト（R0）
```
[CHARACTER "Ojisan Runner" — see above]

Draw these 4 RUNNING poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) run_1 — full sprint: RIGHT leg fully extended forward, left leg bent behind,
             left arm punching forward, right arm pulled back. Sweat drops flying.
(2) run_2 — mid-stride transition: both feet near ground level, arms crossing at center,
             mouth open panting, leaning slightly forward.
(3) run_3 — full sprint: LEFT leg fully extended forward, right leg bent behind,
             right arm punching forward, left arm pulled back. Sweat drops flying.
(4) run_4 — mid-stride transition: weight shifting, arms re-crossing, glasses slightly
             askew from the speed.

[STYLE — see common block above]
```

---

# R1：主人公おじさん・リアクション（★最優先）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/ojisan_react_sheet.png`
**抽出後の配置先：** `extracted_v2/player_ojisan/` → `jump.png` `duck.png` `hurt_1.png` `hurt_2.png`

### Codex用プロンプト（R1）
```
[CHARACTER "Ojisan Runner" — same as R0]

Draw these 4 poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) jump — AIRBORNE: both knees tucked up toward chest, arms raised, body compact in mid-air,
            sweat drops arcing outward from momentum. Eyes wide with fear.
(2) duck — CROUCHING SLIDE: very low flat crouch, body flattened horizontally, knees bent
            close to the ground, head ducked, arms slightly extended forward for balance.
            Suit jacket hitched up. Desperate grimace. Clearly much lower than standing height.
(3) hurt_1 — STUMBLING: tripping forward off-balance, one foot caught mid-step, arms flailing
              outward, body lurching forward at an angle, glasses flying slightly askew.
              Shocked open-mouthed expression. Sweat and speed lines everywhere.
(4) hurt_2 — STUMBLE RECOVERY: hunched forward recovering, one knee lower, arms out for balance,
              pained desperate expression, sweat and tears mixing.

[STYLE — see common block above]
```

---

# R2：追手おばさん・走行アニメ（次優先）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/obasan_run_sheet.png`
**抽出後の配置先：** `extracted_v2/chaser_obasan/` → `run_1.png` `run_2.png` `run_3.png` `run_4.png` `caught.png`

### Codex用プロンプト（R2）
```
CHARACTER "Obasan Chaser": a stout Japanese female office worker, mid-to-late 40s.
Round Buddha-like face — serene oval shape, slightly droopy features — but NOW with desperate
sweating panic expression and wide frantic eyes chasing someone.
Chubby plump figure, short permed hair, wearing business casual office clothes:
plain blouse, dark slacks or knee-length skirt, sensible low-heeled shoes.
Face flushed deep red, sweat drops everywhere. 2-3 head body proportion, stocky short limbs.
KEEP THE EXACT SAME character — same head-to-body ratio and SAME overall pixel size in every pose.

Draw these 5 poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) run_1 — full sprint CHASING: RIGHT leg fully extended forward, left leg back,
             left arm forward, right arm back. Cheeks jiggling, sweat flying, determined glare.
(2) run_2 — mid-stride: both feet near ground, arms crossing, mouth open in a shout or heavy panting.
             Skirt/slacks swishing from the speed.
(3) run_3 — full sprint CHASING: LEFT leg fully extended forward, right leg back,
             right arm forward, left arm back. Sweat droplets arc outward.
(4) run_4 — mid-stride transition: body slightly upright, arms re-crossing, expression
             single-minded and furious.
(5) caught — TRIUMPHANT LUNGE: both arms outstretched reaching forward, one foot off the ground
             in a final pounce, mouth open in a victorious shout. Comical but unstoppable energy.

Style: cute retro 16-bit pixel-art game sprite, bold dark outlines, flat cel shading, vibrant colors.
Side view, facing right, full body, feet on the very bottom edge.
SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no scenery, no shadow,
no floor, no text, no numbers, no watermarks.
All 5 poses in ONE horizontal row at the same scale. Output as a single image.
```

---

# R3：障害物まとめシート（8種）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/obstacles_sheet.png`
**抽出後の配置先：** `extracted_v2/obstacles/` → 各ファイル名は下記

```
Draw these 8 small obstacle ICONS in ONE horizontal row, evenly spaced, each on the same cell height.
All items clearly recognizable, slightly stylized and cute. Each cell shows ONE item only.

(1) ramen    → a steaming bowl of Japanese ramen, tonkotsu style, chopsticks resting on top, rich broth.
(2) beer     → a tall foaming glass mug of cold beer, golden amber, thick white foam spilling over the top.
(3) karaage  → a pile of Japanese karaage fried chicken in a small paper basket, golden-brown crispy.
(4) vending  → a wide rectangular sign hanging in mid-air (like a vending machine ad banner), colorful,
               hanging by two chains from above. Wide and low — wider than tall.
(5) choco    → a chocolate bar, dark brown, partially unwrapped in gold foil, one row broken off.
(6) oil      → a Japanese vegetable cooking oil PET bottle, clear golden oil inside, label on front.
(7) butter   → a rectangular stick of butter on white paper wrapper, golden-yellow, soft-looking.
(8) mayo     → a Kewpie-style Japanese mayonnaise squeeze bottle, white body, yellow cap, slightly squeezed.

Style: cute retro 16-bit pixel-art icons, bold dark outlines, flat cel shading, vibrant colors.
Each item facing slightly angled (3/4 view) or side view — whichever shows it best.
SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no shadow, no floor, no text.
All 8 icons in ONE horizontal row, same cell height, evenly spaced. Output as a single image.

File names after extraction (in order): ramen.png, beer.png, karaage.png, vending.png,
chocolate.png, oil.png, butter.png, mayo.png
```

---

# R4：ヘルシーアイテムまとめシート（4種）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/items_sheet.png`
**抽出後の配置先：** `extracted_v2/items/` → `veggie.png` `water.png` `aojiru.png` `dumbbell.png`

```
Draw these 4 small PICKUP ITEM icons in ONE horizontal row, evenly spaced, same cell height.
These are "healthy items" — they should look bright, fresh, and beneficial. Each cell = one item.

(1) veggie    → a fresh bunch of green vegetables: broccoli or carrot, bright healthy green/orange,
                small sparkles around it suggesting a health bonus.
(2) water     → a clear plastic water bottle, fresh blue water inside, small bubbles, clean blue cap.
(3) aojiru    → a small glass of aojiru (Japanese green vegetable juice), vivid neon green,
                slightly frothy, a small leaf garnish, healthy glow around it.
(4) dumbbell  → a classic black dumbbell (small hand weight), both weights visible, slightly shiny metallic.

Style: cute retro 16-bit pixel-art icons, bold dark outlines, flat cel shading, vibrant colors.
Each item facing slightly angled or side view — whichever shows it best.
SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no shadow, no floor, no text.
All 4 icons in ONE horizontal row, same cell height, evenly spaced. Output as a single image.
```

---

# R5：背景（歩道・シティ）

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/background/sidewalk.png`
（不透明・緑背景不要）

```
A side-scrolling 2D game background: a Japanese city sidewalk, daytime.
Wide concrete sidewalk in the foreground, office buildings and shops in the background,
powerlines above, blue sky. Some street trees or poles. Sunny and cheerful but slightly hectic.
The mood is "a salaryman running desperately through an ordinary Japanese city street."
NO characters, no people, no text, no logos.
Retro 16-bit pixel-art game background, flat colors, bold outlines, horizontal layout designed
to tile/repeat left-to-right seamlessly.
Keep the middle-and-lower band (where the character runs) relatively clear and low in detail
so the running character stands out.
Size 1536x512 (wide and short — runner game aspect). Fully opaque, no transparency.
```

---

# R6：街路障害物まとめシート（8種）★R3の差し替え

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/obstacles_street_sheet.png`
**抽出後の配置先：** `extracted_v2/obstacles_street/` → 各ファイル名は下記

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R6（街路障害物シート）だけ生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/obstacles_street_sheet.png
> 1枚ごとにフルパスでファイル名を報告。
> ```

```
Draw these 8 small STREET OBSTACLE icons in ONE horizontal row, evenly spaced, each on the same cell height.
All items should look clearly dangerous/blocking — the player must jump over or duck under them.
Each cell shows ONE item only.

(1) cone     → a bright orange traffic safety cone (カラーコーン), reflective white band in the middle,
               solid and sturdy, tilted very slightly from wind. Classic Japanese roadwork cone.
(2) barrier  → a yellow-and-black striped construction barricade (工事バリケード), two A-frame legs,
               wide horizontal board across the top with warning stripes. Solid obstacle.
(3) bicycle  → an abandoned bicycle (放置自転車) parked carelessly on the sidewalk, leaning against
               an invisible pole or just standing. Handlebar visible, wheel spokes, a basket maybe.
               Slightly rusty, clearly in the way.
(4) trash    → a pile of dark garbage bags (ゴミ袋) stacked messily on the sidewalk, tied at the top,
               two or three bags in a heap. Slightly bulging. Japanese-style rubbish pileup.
(5) vending  → a tall narrow Japanese vending machine (自動販売機), colorful drink buttons and product
               display window, coin slot and dispensing tray at the bottom. Brightly lit.
               Taller than wide. Unmissable on the sidewalk.
(6) boxes    → a stack of collapsed or bulging cardboard boxes (ダンボール) piled on the sidewalk,
               two or three boxes stacked, taped shut, slightly irregular. Brown corrugated cardboard.
(7) sign     → a freestanding A-frame sandwich board / standing sign (立て看板), narrow wooden frame
               with a rectangular sign face showing bold text or arrow graphic. Easily knocked over.
(8) tape     → bright yellow construction caution tape (工事テープ) strung horizontally between two
               orange poles or pylons, low to the ground with a small gap below it. Wide and low.
               The player must DUCK UNDER it (not jump over).

Style: cute retro 16-bit pixel-art icons, bold dark outlines, flat cel shading, vibrant colors.
Each item side view or very slight 3/4 angle — whichever reads most clearly as a real obstacle.
SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no shadow, no floor,
no text, no numbers, no watermarks.
All 8 icons in ONE horizontal row, same cell height (~200–250px), evenly spaced. Output as a single image.

File names after extraction (in order, left to right):
cone.png, barrier.png, bicycle.png, trash.png, vending.png, boxes.png, sign.png, tape.png
```

**抽出コマンド（シート到着後）：**
```bash
cd ~/Developer/games/ojisan-runner
python3 tools/extract_row_sheet.py \
  public/assets/sprites/raw_generated/obstacles_street_sheet.png \
  --cuts 8 --bg green \
  --out public/assets/sprites/extracted_v2/obstacles_street/
# → cone.png, barrier.png, ... tape.png (左から順に命名)
```

**GameScene.js preload() 追加（抽出後）：**
```js
for (const k of ['cone','barrier','bicycle','trash','vending','boxes','sign','tape'])
  this.load.image(`obs_${k}`, `assets/sprites/extracted_v2/obstacles_street/${k}.png`);
```

---

## 抽出後の作業（Claudeが対応）

1. 緑シート → `extract_sheet.py --bg green --cols N` で分割・透過抽出
2. `extracted_v2/` の各フォルダへ配置
3. `src/scenes/GameScene.js` でテクスチャ読み込み追加
4. `src/config.js` の OBSTACLES/ITEMS の `color` を `textureKey` に差し替え
5. ビルド確認 → push → GitHub Pages に自動反映
