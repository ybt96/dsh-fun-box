#!/usr/bin/env python3
"""fun-box 彩蛋引擎：终端版玩具。纯 stdlib，任何 coding agent 可直接调用。

用法: fun.py <command> [args...]
命令:
  dice [NdM|N]        掷骰子, 默认 1d6, 例如 2d20 / 6
  8ball <问题>        魔法8球问卜
  praise              随机夸夸
  rps <rock|paper|scissors>  石头剪刀布
  fortune             今日运势(按日期定种, 一天一签)
  confetti            终端彩带动画
  celebrate           任务完成撒花: 彩带 + 随机鼓励语
  egg <code>          暗号彩蛋 (试试: uuddlrlrba)
"""
import datetime as _dt
import json
import random
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "phrases.json"


def phrases():
    with open(DATA, encoding="utf-8") as f:
        return json.load(f)


def pick(key, seed=None):
    rng = random.Random(seed) if seed is not None else random
    return rng.choice(phrases()[key])


# ---------- ANSI helpers ----------
C = {
    "reset": "\033[0m", "bold": "\033[1m", "dim": "\033[2m",
    "red": "\033[31m", "green": "\033[32m", "yellow": "\033[33m",
    "blue": "\033[34m", "magenta": "\033[35m", "cyan": "\033[36m",
}
PALETTE = [C["red"], C["green"], C["yellow"], C["blue"], C["magenta"], C["cyan"]]


def paint(text, color="cyan", bold=False):
    return f"{C['bold'] if bold else ''}{color}{text}{C['reset']}"


# ---------- commands ----------
def cmd_dice(args):
    spec = args[0] if args else "1d6"
    try:
        if "d" in spec.lower():
            n, m = spec.lower().split("d", 1)
            n, m = int(n or 1), int(m)
        else:
            n, m = 1, int(spec)
        if not (1 <= n <= 100 and 2 <= m <= 1000):
            raise ValueError
    except ValueError:
        print("用法: dice [NdM|N]，例如 dice 2d20"); return 2
    rolls = [random.randint(1, m) for _ in range(n)]
    face = " ".join(paint(f"[{r}]", random.choice(PALETTE), bold=True) for r in rolls)
    total = f" = {paint(str(sum(rolls)), C['yellow'], bold=True)}" if n > 1 else ""
    print(f"🎲 {spec}: {face}{total}")
    return 0


def cmd_8ball(args):
    if not args:
        print("用法: 8ball <问题>"); return 2
    q = " ".join(args)
    ans = pick("eightball")
    print(f"🎱 问：{q}\n   答：{paint(ans, C['magenta'], bold=True)}")
    return 0


def cmd_praise(_args):
    print(f"💬 {paint(pick('praise'), C['cyan'], bold=True)}")
    return 0


def cmd_rps(args):
    beats = {"rock": "scissors", "paper": "rock", "scissors": "paper"}
    zh = {"rock": "✊ 石头", "paper": "✋ 布", "scissors": "✌️ 剪刀"}
    if not args or args[0].lower() not in beats:
        print("用法: rps <rock|paper|scissors>"); return 2
    you, me = args[0].lower(), random.choice(list(beats))
    print(f"你: {zh[you]}   我: {zh[me]}")
    if you == me:
        print("🤝 平局！心有灵犀。")
    elif beats[you] == me:
        print(paint("🏆 你赢了！厉害。", C["green"], bold=True))
    else:
        print(paint("😎 这局我拿下了，再来？", C["yellow"], bold=True))
    return 0


def cmd_fortune(_args):
    today = _dt.date.today().isoformat()
    print(f"🔮 今日运势 {paint(today, C['dim'])}")
    print(f"   {pick('fortunes', seed=today)}")
    return 0


def cmd_confetti(_args):
    width = 60
    print(paint("🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊", C["magenta"], bold=True))
    for _ in range(8):
        line = []
        for _ in range(width):
            r = random.random()
            ch = random.choice(["*", "✦", "·", "▪", "◆", "+" if r < 0.5 else " "])
            line.append(paint(ch, random.choice(PALETTE), bold=r < 0.3))
        print("".join(line))
    print(paint("🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊🎊", C["magenta"], bold=True))
    return 0


def cmd_celebrate(_args):
    cmd_confetti([])
    print()
    print(paint("✨ " + pick("cheers") + " ✨", C["yellow"], bold=True))
    return 0


def cmd_egg(args):
    code = "".join(args).lower().replace(" ", "")
    if code in ("uuddlrlrba", "↑↑↓↓←→←→ba", "konami"):
        print(paint(phrases()["egg_unlock"], C["magenta"], bold=True))
        cmd_confetti([])
    else:
        print("🔒 暗号不对。" + pick("egg_hints"))
    return 0


def cmd_help(_args):
    print(__doc__)
    return 0


COMMANDS = {
    "dice": cmd_dice, "8ball": cmd_8ball, "praise": cmd_praise,
    "rps": cmd_rps, "fortune": cmd_fortune, "confetti": cmd_confetti,
    "celebrate": cmd_celebrate, "egg": cmd_egg, "help": cmd_help,
}


def main(argv):
    if not argv:
        return cmd_help([])
    fn = COMMANDS.get(argv[0].lower())
    if fn is None:
        print(f"未知命令: {argv[0]}"); return cmd_help([])
    return fn(argv[1:])


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except BrokenPipeError:
        sys.exit(0)  # 输出被 head 等截断属正常
