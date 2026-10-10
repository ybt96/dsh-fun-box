# 🎪 dsh-fun-box — 彩蛋盒子

**一套彩蛋引擎，两种形态**：给 [DeepSeek Harness](https://github.com/deepseek-ai) 的可视化彩蛋插件（撒彩带、互动小挂件、Konami 隐秘彩蛋），以及给 Hermes / Claude Code / Codex 等 coding agent 的终端版彩蛋 skill（掷骰子、问卜、夸夸、运势、猜拳、撒花）。

MIT Licensed · 无外部依赖 · 明暗主题自适应

---

## 你想怎么用？（分档入口）

| 你想要 | 去哪 | 花多久 |
|---|---|---|
| 终端里撒个花、掷个骰子 | [装 skill](#1-终端版-skillhermes--claude-code--codex) | 1 分钟 |
| Harness 界面里点按钮撒彩带 | [装插件](#2-harness-可视化插件web--桌面) | 1 分钟 |
| 两个都要 | 两个都装，互不干扰 | 2 分钟 |
| 改文案 / 调彩带密度 | [自定义](#自定义) | 5 分钟 |
| 二次开发 | 直接读源码，两个目录都是一屏读完的小文件 | — |

---

## 1. 终端版 skill（Hermes / Claude Code / Codex）

**快速开始**（共享 skill 池安装）：

```bash
cp -R skill ~/.agents/skills/fun-box
~/bin/skills-manager.sh install fun-box   # 同步到 hermes/claude/codex 视图
```

没有 `skills-manager.sh` 的话，直接把 `skill/` 目录拷进目标 agent 的 skills 目录（`~/.claude/skills/`、`~/.codex/skills/`、`~/.hermes/skills/`）即可。

**玩法**：对 agent 说——

| 说 | 效果 |
|---|---|
| 撒个花 / 庆祝一下 | 🎊 终端彩带 + 随机鼓励语 |
| 掷个骰子 / roll 2d20 | 🎲 支持 NdM 多面多枚 |
| 夸夸我 | 💬 随机夸夸 |
| 今天运势 | 🔮 一天一签 |
| 算一卦 | 🎱 魔法 8 球 |
| 猜拳 | ✊ 石头剪刀布 |
| 有什么彩蛋 | 🔒 给提示不剧透（答案：`uuddlrlrba`） |

## 2. Harness 可视化插件（Web + 桌面）

**快速开始**：

```bash
# Web 桌面端插件面板 → 安装 → 粘贴本仓库的 harness-plugin/ 目录路径
# 或在会话里让 agent 执行 plugin_manager install_bundle，target 为该目录
```

装好后打开任一会话：

- 输入框下方出现 🎪 **彩蛋盒子**：🎲 掷骰子 / 🎱 问一卦 / 💬 夸夸 / ✊ 猜拳 / 🎉 撒花
- 🎉 **撒花** = 三波 3D 彩带雨 + 烟花爆裂 + 气球升空 + 弹跳 toast
- 任意位置按 **`↑↑↓↓←→←→BA`** → 彩蛋雨 + 🏅彩蛋猎人徽章
- 任务完成自动轻庆祝；收尾命中「完成 / 搞定 / done…」自动大庆祝（历史回放不误触发）

> Harness 插件从 npm 安装：`npm i -g dsh-fun-box` 或在插件面板直接搜包名（发布后生效）。

## 自定义

- **文案**：`skill/data/phrases.json`（唯一文案源）；插件内置其快照，在 `harness-plugin/client.js` 顶部 `CHEERS / PRAISE / EIGHTBALL` 同步
- **触发关键词**：`client.js` 顶部 `KEYWORDS`
- **彩带密度 / 烟花数**：`client.js` 中 `perWave`、`waves`、`bursts`
- **颜色盘**：`ART_COLORS`（彩带属 artwork 可自由配色；界面 chrome 全部走 `--dsw-alias-*` 主题令牌）

## 测试

```bash
cd harness-plugin
node test-smoke.mjs    # 工厂 + 插槽注册 + Konami + 清理（零依赖）
node test-render.mjs   # 渲染契约：CSS 完整性 + DOM 结构 + 彩带/烟花/气球生成（零依赖）
```

## 踩坑清单

1. **Harness 插件改完代码没生效**：bundle 是 link 安装的，Web 端刷新页面即可；桌面端要 `⌘Q` 完全退出重启应用。
2. **`desktop` profile 装不进**：桌面 profile 由 Electron 应用独占管理，CLI 会拒绝——请在桌面应用内的插件面板安装。
3. **skill 装了 agent 看不到**：技能目录是会话启动时扫描的，新开会话即可；或确认目标 agent 的 skills 目录里有软链。
4. **彩带没出来**：确认在会话里（小挂件是 session 级插槽，空白首页不渲染）；点「🎉 撒花」必出。
5. **py 编译报缓存权限错**：受限环境跑 `python3 -B` 或设 `PYTHONPYCACHEPREFIX`。
6. **Konami 失效**：10 个键要 3 秒内连按，大小写不敏感（`ba` 小写）。

## License

[MIT](LICENSE)
