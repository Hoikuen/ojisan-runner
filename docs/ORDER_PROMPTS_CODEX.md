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

# R5：背景（空＋遠景シルエット）★ゲームのパーラックス専用設計

> **⚠️ 旧R5（歩道シティ）との違い：**
> 旧版は下半分に歩道・電柱・建物を描いたため、ゲーム側の地面（FLOOR_Y）と速度差で二重に見えた。
> 新版は**地面・歩道を一切描かない**。下端まで空か遠景のみ。

**保存先：** `~/Developer/games/ojisan-runner/public/assets/sprites/background/sidewalk.png`
（同名で上書き。不透明・緑背景不要）

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R5（背景イラスト）を1枚生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/background/sidewalk.png
> フルパスでファイル名を報告。
> ```

```
A wide seamlessly-tileable side-scrolling 2D game background for a Japanese city endless runner.
Size: 1536 × 512 pixels. Fully opaque (no transparency, no green chroma key needed).

════ CRITICAL LAYOUT RULES ════
• TOP 65% (y=0 to y=332): bright blue daytime sky with fluffy white pixel-art clouds.
  A few clouds at different sizes and heights drifting across. Sun visible in upper-right area.
  Sky can have a subtle gradient from deep blue at top to lighter near the horizon.
• MIDDLE 25% (y=332 to y=460): distant Japanese city silhouettes — simplified skyscrapers,
  office towers, and a few rooftop water tanks. These are pure SILHOUETTES: flat dark navy/dark
  grey shapes with no window details, no signs, no poles. The skyline should be varied in
  height but all shapes are simplified block silhouettes, like ink stamps.
• BOTTOM 10% (y=460 to y=512): continue the silhouette or fade to a slightly lighter horizon.
  NO sidewalk. NO ground. NO floor tiles. NO road markings. NO telephone poles. NO trees
  in the foreground. NO close-up objects of any kind. The game renders its own ground line.

════ STYLE ════
Retro 16-bit pixel-art, flat cel shading, bold pixel outlines where needed.
The palette should feel like a clear Tokyo afternoon: bright sky blues, warm sun yellows,
cool dark navy building silhouettes.

════ TILING ════
Left edge and right edge must match seamlessly for infinite horizontal looping.
The clouds and skyline should NOT have obvious repeat patterns within one 1536px width.
Place cloud clusters asymmetrically (e.g., large group left-center, small group right).

════ FORBIDDEN ════
No ground, no sidewalk, no road, no floor tiles.
No telephone poles or powerlines.
No close foreground trees or fences.
No people, no characters, no text, no logos, no UI elements.
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

# R7：主人公おじさん・キャラリデザイン（おじさんX版に寄せる）★R0/R1の差し替え

> **目的：** 既存キャラのスプライトを「おじさんX」主人公に近いビジュアルへ更新。
> 白縁メガネ・太い口ひげ・赤ネクタイを追加。ポーズ・コマ構成はR0/R1と全く同じ。

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R7を2シート生成してください。
> 保存先:
>   ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/ojisan_run_v2_sheet.png  （4コマ）
>   ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/ojisan_react_v2_sheet.png（4コマ）
> 1枚ごとにフルパスでファイル名を報告。
> 参考キャラ画像（同じおじさん・別ゲーム版）:
>   ~/Developer/games/ojisan-x/public/assets/sprites/extracted_v2/player_ojisan/idle_1.png
>   ~/Developer/games/ojisan-x/public/assets/sprites/extracted_v2/player_ojisan/walk_2.png
> これらのキャラのビジュアル（メガネ・ひげ・ネクタイ・スーツ色）をランナーに適用してください。
> ```

### キャラ共通記述（R7用 — 参考画像の特徴を明記）
```
CHARACTER "Ojisan Runner" v2 — redesigned to match the "Ojisan-X" hero:
- Face: very round and chubby, rosy flushed cheeks, short black hair
- Glasses: THICK WHITE RECTANGULAR frames, large lenses covering most of the eye area
- Mustache: VERY THICK FULL BLACK MUSTACHE, wide and prominent, filling the area between nose and upper lip
- Clothes: dark navy business suit, gold buttons, WHITE DRESS SHIRT, RED TIE (visible at chest)
- Expression: wide terrified eyes, open mouth, sweat drops flying everywhere (panic/sprint mode)
- Proportions: 2-3 head body ratio, short plump limbs, chubby silhouette
- Size: same pixel size as previous version (~300×300 canvas per pose)
KEEP THE EXACT SAME character — same head-to-body ratio and SAME overall pixel size in every pose.
```

---

## R7a：走行シート（4コマ）

**保存先：** `public/assets/sprites/raw_generated/ojisan_run_v2_sheet.png`
**抽出後の上書き先：** `extracted_v2/player_ojisan/` → `run_1.png` `run_2.png` `run_3.png` `run_4.png`

```
[CHARACTER "Ojisan Runner" v2 — see above]

Draw these 4 RUNNING poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) run_1 — full sprint: RIGHT leg fully extended forward, left leg bent behind,
             left arm punching forward, right arm pulled back.
             Red tie whipping backward from speed. Sweat drops flying.
(2) run_2 — mid-stride transition: both feet near ground level, arms crossing at center,
             mouth wide open panting, leaning slightly forward. Tie still flapping.
(3) run_3 — full sprint: LEFT leg fully extended forward, right leg bent behind,
             right arm punching forward, left arm pulled back. Sweat drops flying.
(4) run_4 — mid-stride transition: weight shifting, arms re-crossing, WHITE GLASSES
             slightly askew from the speed, tie lashing to the side.

[STYLE — see common block above]
```

---

## R7b：リアクションシート（4コマ）

**保存先：** `public/assets/sprites/raw_generated/ojisan_react_v2_sheet.png`
**抽出後の上書き先：** `extracted_v2/player_ojisan/` → `jump.png` `duck.png` `hurt_1.png` `hurt_2.png`

```
[CHARACTER "Ojisan Runner" v2 — see above]

Draw these 4 poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) jump — AIRBORNE: both knees tucked up toward chest, arms raised high, body compact in mid-air,
            sweat drops arcing outward. Red tie floats upward. Eyes wide with fear/excitement.
            White glasses catching the light.
(2) duck — CROUCHING SLIDE: very low flat crouch, body flattened horizontally close to ground,
            knees bent, head tucked, arms slightly extended forward for balance.
            Suit jacket hitched up, red tie dragging on the floor. Desperate grimace.
            Clearly much lower than standing height.
(3) hurt_1 — STUMBLING: tripping forward off-balance, one foot caught mid-step, arms flailing
              outward, body lurching forward at an angle. WHITE GLASSES flying slightly askew.
              Shocked open-mouthed expression. Sweat and speed lines everywhere.
(4) hurt_2 — STUMBLE RECOVERY: hunched forward recovering from the trip, one knee lower,
              arms out for balance, glasses completely crooked, pained desperate expression,
              sweat and tears mixing. Red tie hanging loose.

[STYLE — see common block above]
```

---

**抽出コマンド（シート到着後）：**
```bash
cd ~/Developer/games/ojisan-runner

# 走行シート（4コマ）
python3 tools/extract_row_sheet.py \
  public/assets/sprites/raw_generated/ojisan_run_v2_sheet.png \
  --cuts 4 --bg green \
  --out public/assets/sprites/extracted_v2/player_ojisan/ \
  --names run_1 run_2 run_3 run_4

# リアクションシート（4コマ）
python3 tools/extract_row_sheet.py \
  public/assets/sprites/raw_generated/ojisan_react_v2_sheet.png \
  --cuts 4 --bg green \
  --out public/assets/sprites/extracted_v2/player_ojisan/ \
  --names jump duck hurt_1 hurt_2
```

> `extract_row_sheet.py` が `--names` オプションに対応していない場合は、
> 抽出後に `0.png→run_1.png` のようにリネームすればOK。

---

# R6v2：街路障害物・真横サイドビュー版（R6の差し替え）

> **⚠️ R6との違い：** R6は一部スプライトが3/4俯瞰視点で描かれ地面と合わなかった。
> 今回は**全8種を厳密な真横サイドビュー専用**で再発注。上面・奥行き・パース完全禁止。

**保存先：** `public/assets/sprites/raw_generated/obstacles_street_v2_sheet.png`
**抽出後の上書き先：** `extracted_v2/obstacles_street/` → 各ファイル名は下記

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R6v2（街路障害物・真横版）だけ生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/obstacles_street_v2_sheet.png
> フルパスで報告。
> ```

```
Draw these 8 small STREET OBSTACLE icons in ONE horizontal row, evenly spaced, same cell height.

════ CRITICAL VIEW RULE ════
ALL items must be drawn in STRICT FLAT SIDE VIEW (真横・サイドビュー専用):
• NO top surface visible — you must NOT see the top of any object
• NO perspective depth — objects have NO 3D foreshortening
• NO isometric or 3/4 angle — pure flat left-to-right silhouette only
• Think: how would the object look if photographed from perfectly eye level on the street

(1) cone     → orange traffic safety cone, flat side profile: triangle-like shape, white band visible
               on the side only. NO visible top circle. Feet of the cone as a flat base.
(2) barrier  → yellow-and-black striped construction barricade: two A-frame legs visible from the side,
               horizontal board across the top. Side view — no perspective on the legs.
(3) bicycle  → abandoned bicycle, strict side view: one wheel in front, one behind, frame visible,
               handlebar and saddle shown from side. A basket on front handle. Clean silhouette.
(4) trash    → pile of dark garbage bags, side view: 2–3 bags heaped together, seen from the side.
               Round blob-like shapes stacked horizontally. No top surface.
(5) vending  → tall narrow Japanese vending machine, strict side/front view: rectangle taller than wide,
               colorful drink display visible on front face. Flat frontal look, no depth.
(6) boxes    → stack of cardboard boxes, side view: 2–3 boxes piled, flat rectangular stacked shapes.
               Box edges visible from the side, tape lines horizontal. No top surface.
(7) sign     → A-frame sandwich board, side view: shows the narrow side of the A-frame — two angled legs
               meeting at top, sign face between them. Very thin profile from the side.
(8) tape     → construction caution tape strung between two poles, side view: two vertical poles with
               a horizontal yellow tape stretching between them at mid-height. Wide and low shape.
               The gap below the tape (duck-under obstacle) must be clearly visible.

Style: cute retro 16-bit pixel-art icons, bold dark outlines, flat cel shading, vibrant colors.
SOLID FLAT pure green chroma-key background (#00FF00) — no gradient, no shadow, no floor, no text.
All 8 icons in ONE horizontal row, same cell height (~200–250px), evenly spaced. Output as a single image.

File names after extraction (in order, left to right):
cone.png, barrier.png, bicycle.png, trash.png, vending.png, boxes.png, sign.png, tape.png
```

---

# R8：追手２・お医者さん（Stage 2）

> **Stage 2（500m〜）の追手。** 白衣・聴診器・険しい顔。おばさんより速い。

**保存先：** `public/assets/sprites/raw_generated/doctor_run_sheet.png`
**抽出後の配置先：** `extracted_v2/chaser_doctor/` → `run_1〜run_4.png` + `caught.png`

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R8（お医者さん追手シート）だけ生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/doctor_run_sheet.png
> フルパスで報告。
> ```

```
CHARACTER "Doctor Chaser": a Japanese male doctor, 40s, pursuing the player.
Round face, short black hair, stern determined expression, sweat drops everywhere.
Wearing a WHITE LAB COAT (white coat flapping behind from the speed), stethoscope around neck,
dark trousers, dress shoes. Chubby build, short stature. Holding a clipboard or health report.
2-3 head body proportion, stocky limbs. Face flushed red, furious expression.
KEEP THE EXACT SAME character — same head-to-body ratio and SAME overall pixel size in every pose.

Draw these 5 poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) run_1 — full sprint CHASING: RIGHT leg fully extended forward, left leg back,
             left arm forward (clipboard in hand), right arm back. White coat flapping.
             Stethoscope bouncing. Angry determined glare. Sweat drops flying.
(2) run_2 — mid-stride: both feet near ground, arms crossing, mouth open shouting.
             White coat swishing from speed.
(3) run_3 — full sprint CHASING: LEFT leg fully extended forward, right leg back,
             right arm forward, left arm back. More sweat, furious eyes.
(4) run_4 — mid-stride transition: body slightly upright, face shouting, coat billowing.
(5) caught — TRIUMPHANT GRAB: both arms outstretched reaching forward, mouth open wide in a shout,
             clipboard raised in one hand. One foot off the ground in a final pounce. "CAUGHT YOU!"

Style: cute retro 16-bit pixel-art game sprite, bold dark outlines, flat cel shading, vibrant colors.
Side view, facing right, full body, feet on the very bottom edge.
SOLID FLAT pure green chroma-key background (#00FF00). All 5 poses ONE row. Output single image.
```

---

# R9：追手３・奥さん（Stage 3）

> **Stage 3（1200m〜）の追手。** 割烹着or主婦スタイル・体重計を持つ・最強追手。

**保存先：** `public/assets/sprites/raw_generated/wife_run_sheet.png`
**抽出後の配置先：** `extracted_v2/chaser_wife/` → `run_1〜run_4.png` + `caught.png`

> **Codexへの渡し方：**
> ```
> 作業リポジトリは ~/Developer/games/ojisan-runner（他ゲームに保存しないこと）。
> R9（奥さん追手シート）だけ生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/raw_generated/wife_run_sheet.png
> フルパスで報告。
> ```

```
CHARACTER "Wife Chaser": a Japanese housewife, late 30s, the most terrifying pursuer of all.
Round face, short hair (housewife perm), terrifyingly calm-yet-angry expression.
Wearing a KAPPOGI (割烹着 — traditional Japanese housewife apron over clothes), or a casual
floral blouse with an apron, holding a SCALE (体重計 — bathroom weight scale) in one hand
like a weapon. Plump build, short stature. Face flushed, deadly serious.
2-3 head body proportion. She is FASTER than the other chasers — her stride is powerful.
KEEP THE EXACT SAME character — same head-to-body ratio and SAME overall pixel size in every pose.

Draw these 5 poses in ONE horizontal row, evenly spaced, same character same scale, feet aligned to the bottom:

(1) run_1 — full sprint: RIGHT leg forward, left leg back, scale held forward like a torch,
             apron flapping. Deadpan-furious expression. Sweat drops.
(2) run_2 — mid-stride: arms crossing, scale swinging, mouth open ("あなた！止まりなさい！").
(3) run_3 — full sprint: LEFT leg forward, right leg back, scale raised. More determined.
(4) run_4 — mid-stride: body upright, scale pressed to chest, expression absolutely murderous.
(5) caught — TRIUMPHANT CAPTURE: scale held high in one hand like a trophy, other hand grabbing,
             expression shifts to cold satisfaction. One foot planted, standing over the player.

Style: cute retro 16-bit pixel-art game sprite, bold dark outlines, flat cel shading, vibrant colors.
Side view, facing right, full body, feet on the very bottom edge.
SOLID FLAT pure green chroma-key background (#00FF00). All 5 poses ONE row. Output single image.
```

---

# R5a/b/c：ステージ別背景3種（昼/夕方/夜）

> **Stage 1=昼（現在のsidewalk.png）** は既存を流用。以下の2種を追加発注する。
> 全て同じ構図（空＋遠景シルエット・地面なし）でカラーパレットだけ変える。

## R5b：夕方背景（Stage 2）

**保存先：** `public/assets/sprites/background/evening.png`

> **Codexへの渡し方：**
> ```
> R5b（夕方背景）を1枚生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/background/evening.png
> ```

```
[R5と同じ構図・同じレイアウトルール。カラーパレットのみ変更]

A wide seamlessly-tileable side-scrolling 2D game background. Size: 1536 × 512 pixels. Fully opaque.

════ LAYOUT (same as R5) ════
• TOP 65%: evening sky — deep orange-red at the horizon fading to dark purple/indigo at the top.
  Dramatic sunset clouds in orange, pink, purple. No sun visible (just below horizon).
• MIDDLE 25%: same city silhouette shapes as R5 but rendered as DARK SILHOUETTES against the
  sunset sky. The buildings are nearly black/very dark navy, no detail, pure shapes.
• BOTTOM 10%: darkening horizon. NO floor, NO sidewalk, NO road, NO poles, NO trees.

════ MOOD ════ Dramatic Tokyo sunset. Warm orange glow, slightly ominous. The chase is getting serious.

Style: retro 16-bit pixel-art, flat colors, seamlessly tileable left-right. 1536×512, fully opaque.
```

## R5c：夜背景（Stage 3）

**保存先：** `public/assets/sprites/background/night.png`

> **Codexへの渡し方：**
> ```
> R5c（夜背景）を1枚生成してください。
> 保存先: ~/Developer/games/ojisan-runner/public/assets/sprites/background/night.png
> ```

```
[R5と同じ構図。夜バージョン]

A wide seamlessly-tileable side-scrolling 2D game background. Size: 1536 × 512 pixels. Fully opaque.

════ LAYOUT (same as R5) ════
• TOP 65%: dark night sky — deep navy to black. A large bright full moon in the upper area.
  Several bright stars scattered across the sky. Perhaps a few wisps of dark cloud.
• MIDDLE 25%: city skyline silhouettes, now with a few tiny lit windows (2–3 pixels of warm yellow
  light per building, randomly placed). Buildings are very dark navy/black shapes against the
  night sky. The moon casts a faint glow on the rooftops (slightly lighter top edges).
• BOTTOM 10%: dark horizon. NO floor, NO sidewalk, NO road, NO poles, NO trees.

════ MOOD ════ Late night chase. Tense and dramatic. The wife is catching up.

Style: retro 16-bit pixel-art, flat colors, seamlessly tileable left-right. 1536×512, fully opaque.
```

---

## 抽出後の作業（Claudeが対応）

1. 緑シート → `extract_sheet.py --bg green --cols N` で分割・透過抽出
2. `extracted_v2/` の各フォルダへ配置
3. `src/scenes/GameScene.js` でテクスチャ読み込み追加
4. `src/config.js` の OBSTACLES/ITEMS の `color` を `textureKey` に差し替え
5. ビルド確認 → push → GitHub Pages に自動反映
