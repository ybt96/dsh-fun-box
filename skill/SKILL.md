---
name: fun-box
description: 彩蛋与娱乐小玩具（终端版）。当用户想放松一下、要彩蛋、撒花庆祝、掷骰子、问卜（8ball）、求夸夸、看今日运势、玩石头剪刀布、说「撒个花」「来点好玩的」「庆祝一下」时使用。任务大功告成、用户表达开心时也主动提议撒花。
---

# fun-box 彩蛋盒子 🎪

终端版彩蛋引擎。所有命令走 `scripts/fun.py`（纯 Python stdlib，无依赖）：

```bash
python3 ~/.agents/skills/fun-box/scripts/fun.py <command> [args...]
```

| 用户说 | 命令 | 效果 |
|---|---|---|
| 掷个骰子 / roll 2d20 | `dice [NdM\|N]` | 掷骰子，支持多面多枚 |
| 猜个拳 | `rps rock\|paper\|scissors` | 石头剪刀布 |
| 夸夸我 | `praise` | 随机夸夸 |
| 今天运势 | `fortune` | 今日运势（一天一签） |
| 8ball / 算一卦 | `8ball <问题>` | 魔法8球问卜 |
| 撒花 / 撒个花 | `confetti` | 终端彩带动画 |
| 庆祝一下 / 搞定了撒花 | `celebrate` | 彩带 + 随机鼓励语 |
| 彩蛋 / 暗号 | `egg <code>` | 暗号彩蛋（试 `uuddlrlrba`） |

## 使用要点

- **任务完成时**：用户说「撒花」「庆祝」「搞定了」或表达明显开心时，跑 `celebrate` 并把输出原样展示（保留 ANSI 转义即彩色效果）。
- **玩具类**（dice/8ball/praise/rps/fortune）：直接跑并展示结果，可以加一句轻松的点评，不要长篇大论。
- **彩蛋**：用户问「有什么彩蛋」时给提示（`egg` 不带参数会给出提示），不要直接剧透答案。
- 输出已含彩色 ANSI。若终端不支持颜色，用户仍能读懂文本。
- 文案想改就改 `data/phrases.json`（唯一文案源）；Harness Web 插件内嵌其快照，改完文案可提醒用户重新生成快照。
