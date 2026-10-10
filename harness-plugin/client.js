window.__ModuleLoader__.load({
  id: 'dsh-fun-box',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo } = React;

    // ============ tunables ============
    const KEYWORDS = [
      '完成', '搞定', '已修复', '已解决', '已通过', '全部通过', '收工', '大功告成',
      'done', 'finished', 'fixed', 'completed', 'all tests pass', 'success',
    ];
    const AUTO_CELEBRATE = true; // 每个新完成的回合轻庆祝；命中关键词升级为大庆祝
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    // ============ phrases (SNAPSHOT of ~/.agents/skills/fun-box/data/phrases.json) ============
    const CHEERS = ['干得漂亮！🎉', '今晚加鸡腿 🍗', '这波稳了 ✅', '漂亮收尾，收工！', '效率拉满 ⚡', '问题解决，鸣金收兵 🏁', '又一个里程碑 🏔️', '丝滑，太丝滑了 🧈', '战绩 +1 📈', '可以，很有精神 💪'];
    const PRAISE = ['你今天状态很好，思路特别清晰 ✨', '这个问题被你安排得明明白白 👏', '你的判断力一直很准 🎯', '和你协作效率超高 🚀', '细节都被你抓住了 🔍', '这波操作很秀 🌟', '你的坚持让事情变得简单 💎', '冷静、果断、靠谱 —— 说的就是你 🧭', '今天的你也值得一句夸夸 🌈', '进步是看得见的 📐'];
    const EIGHTBALL = ['大吉，可以冲 🟢', '答案是肯定的 ✅', '迹象都指向 yes 👍', '大概率没问题 🎲', '先干了再说 😎', '天机不可泄露 🤫', '再想想，答案在路上 🛤️', '不太妙，谨慎为上 ⚠️', '结论：达咩 🚫', '今晚再问我 🌙', '摇一摇，重问一次 🎱', '命运说：看你心情 😄'];
    const EGG_UNLOCK = '🎉✨ 彩蛋猎人徽章解锁！你发现了 Konami 的秘密：↑↑↓↓←→←→BA ✨🎉';

    // 彩带/烟花属于 artwork，可用自由配色
    const ART_COLORS = ['#ff4d6d', '#ffb703', '#00d4ff', '#7c5cff', '#22c55e', '#ff7ac6', '#ff9f1c', '#4cc9f0', '#f72585', '#ffd60a'];

    // ============ locale ============
    const DICT = {
      zh: {
        title: '彩蛋盒子', dice: '掷骰子', ask: '问一卦', praise: '夸夸', rps: '猜拳',
        celebrate: '撒花', badge: '彩蛋猎人', expand: '展开彩蛋盒子', collapse: '收起',
        diceResult: '掷出', points: '点', round: '本局', you: '你', me: '我',
        win: '你赢了！厉害。', lose: '这局我拿下了，再来？', draw: '平局！心有灵犀。',
        cheered: '🎊 撒花！',
      },
      en: {
        title: 'Fun Box', dice: 'Roll', ask: '8-ball', praise: 'Praise', rps: 'RPS',
        celebrate: 'Confetti', badge: 'Egg Hunter', expand: 'Open Fun Box', collapse: 'Collapse',
        diceResult: 'rolled', points: '', round: 'Round', you: 'You', me: 'Me',
        win: 'You win! Nice.', lose: 'Mine! Rematch?', draw: 'A draw! Great minds.',
        cheered: '🎊 Confetti!',
      },
    };
    let tr = (k) => DICT.zh[k] || k;

    // ============ celebration bus ============
    const burstListeners = new Set();
    const badgeListeners = new Set();
    let burstSeq = 0;
    let badgeUnlocked = false;
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function celebrate(big, message) {
      const detail = { id: ++burstSeq, big: !!big, message: message || (big ? rand(CHEERS) : null) };
      burstListeners.forEach((fn) => fn(detail));
    }
    function unlockBadge() {
      if (badgeUnlocked) return;
      badgeUnlocked = true;
      badgeListeners.forEach((fn) => fn());
    }

    // ============ styles (chrome 用主题令牌; 彩带烟花属 artwork 自由配色) ============
    const STYLE = [
      '/* ---- falling pieces (3D flutter) ---- */',
      '@keyframes funbox-fall { 0% { transform: translate3d(0,-10vh,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg); opacity: 0; } 8% { opacity: 1; } 55% { transform: translate3d(calc(var(--funbox-drift,0px) * .55),52vh,0) rotateX(var(--funbox-rx,360deg)) rotateY(var(--funbox-ry,240deg)) rotateZ(calc(var(--funbox-spin,360deg) * .5)); } 100% { transform: translate3d(var(--funbox-drift,0px),112vh,0) rotateX(var(--funbox-rx,360deg)) rotateY(var(--funbox-ry,240deg)) rotateZ(var(--funbox-spin,360deg)); opacity: .95; } }',
      '.funbox-piece { position: fixed; top: -10vh; z-index: 1; pointer-events: none; user-select: none; animation-name: funbox-fall; animation-timing-function: cubic-bezier(.28,.55,.38,1); animation-fill-mode: both; }',
      '.funbox-shape { display: block; }',
      '/* ---- fireworks ---- */',
      '@keyframes funbox-fw { 0% { transform: translate(0,0) scale(1); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--funbox-fx,0px), var(--funbox-fy,0px)) scale(.15); opacity: 0; } }',
      '.funbox-fw { position: fixed; z-index: 1; border-radius: 999px; pointer-events: none; animation: funbox-fw 1.15s cubic-bezier(.16,.8,.4,1) both; box-shadow: 0 0 8px currentColor; }',
      '/* ---- balloons ---- */',
      '@keyframes funbox-balloon { 0% { transform: translate(0,10vh) rotate(-6deg); opacity: 0; } 12% { opacity: .95; } 50% { transform: translate(var(--funbox-sway,40px),-48vh) rotate(7deg); } 100% { transform: translate(0,-116vh) rotate(-8deg); opacity: .9; } }',
      '.funbox-balloon { position: fixed; z-index: 1; pointer-events: none; user-select: none; animation: funbox-balloon 6.5s ease-in-out both; }',
      '/* ---- toast (bounce-in + gradient accent) ---- */',
      '@keyframes funbox-bounce-in { 0% { transform: translate(-50%,-16px) scale(.7); opacity: 0; } 60% { transform: translate(-50%,2px) scale(1.06); opacity: 1; } 80% { transform: translate(-50%,-2px) scale(.98); } 100% { transform: translate(-50%,0) scale(1); opacity: 1; } }',
      '.funbox-toast { position: fixed; top: 10vh; left: 50%; z-index: 2; max-width: min(72vw, 520px); padding: 12px 20px 12px 18px; border-radius: 14px; background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l1); box-shadow: 0 12px 40px color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, transparent); font-size: 15px; font-weight: 700; text-align: center; animation: funbox-bounce-in .5s cubic-bezier(.2,1.35,.4,1) both; overflow: hidden; }',
      '.funbox-toast::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 5px; background: linear-gradient(180deg, var(--dsw-alias-brand-primary), var(--dsw-alias-state-warn-primary), var(--dsw-alias-state-success-primary)); }',
      '/* ---- widget: glass card + flowing gradient border ---- */',
      '@keyframes funbox-border-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }',
      '.funbox-widget-wrap { display: inline-flex; padding: 2px; border-radius: 15px; background: linear-gradient(120deg, var(--dsw-alias-brand-primary), var(--dsw-alias-state-warn-primary), var(--dsw-alias-state-success-primary), var(--dsw-alias-brand-primary)); background-size: 300% 300%; animation: funbox-border-flow 9s linear infinite; box-shadow: 0 6px 26px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent); }',
      '.funbox-widget { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; width: 100%; padding: 9px 11px; border-radius: 13px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); backdrop-filter: blur(14px) saturate(1.5); -webkit-backdrop-filter: blur(14px) saturate(1.5); color: var(--dsw-alias-label-primary); }',
      '/* ---- buttons: glow + squish ---- */',
      '.funbox-btn { position: relative; display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 82%, transparent); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l2); font-size: 12px; line-height: 18px; cursor: pointer; transition: transform .16s cubic-bezier(.2,1.3,.4,1), box-shadow .16s ease, border-color .16s ease; }',
      '.funbox-btn:hover { transform: translateY(-2px) scale(1.06); border-color: var(--dsw-alias-brand-primary); box-shadow: 0 4px 16px color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent); }',
      '.funbox-btn:active { transform: scale(.92); transition-duration: .06s; }',
      '.funbox-btn-primary { border-color: var(--dsw-alias-brand-primary); background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent), color-mix(in srgb, var(--dsw-alias-state-warn-primary) 26%, transparent)); }',
      '@keyframes funbox-breathe { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-brand-primary) 0%, transparent); } 50% { box-shadow: 0 0 18px 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); } }',
      '.funbox-btn-primary { animation: funbox-breathe 2.8s ease-in-out infinite; }',
      '/* ---- brand / line / badge ---- */',
      '.funbox-brand { font-size: 12px; font-weight: 700; background: linear-gradient(90deg, var(--dsw-alias-brand-primary), var(--dsw-alias-state-warn-primary)); -webkit-background-clip: text; background-clip: text; color: transparent; }',
      '.funbox-line { flex: 1 1 160px; min-width: 120px; font-size: 12px; color: var(--dsw-alias-label-secondary); }',
      '@keyframes funbox-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }',
      '.funbox-badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-state-warn-primary); background: linear-gradient(110deg, var(--dsw-alias-bg-layer-2) 28%, color-mix(in srgb, var(--dsw-alias-state-warn-primary) 42%, var(--dsw-alias-bg-layer-2)) 45%, var(--dsw-alias-bg-layer-2) 62%); background-size: 200% 100%; animation: funbox-shimmer 2.6s linear infinite; }',
    ].join('\n');
    function StyleTag() { return h('style', null, STYLE); }

    // ============ overlay: confetti waves + fireworks + balloons + toast ============
    function Burst(props) {
      const burst = props.burst;
      const fx = useMemo(() => {
        const big = burst.big;
        const shapes = ['circle', 'rect', 'ribbon'];
        const emojis = big ? ['🎉', '🎊', '✨', '⭐️', '🍬', '🌈', '💫'] : ['✨', '🎉', '⭐️'];
        // 多波次飘落件
        const waves = big ? 3 : 1;
        const perWave = big ? 38 : 26;
        const falls = [];
        for (let w = 0; w < waves; w++) {
          for (let i = 0; i < perWave; i++) {
            const isEmoji = Math.random() < 0.42;
            const shape = rand(shapes);
            falls.push({
              key: `w${w}-${i}`,
              left: Math.random() * 100,
              delay: w * 0.38 + Math.random() * 0.3,
              duration: (big ? 2.8 : 1.7) + Math.random() * 1.9,
              size: isEmoji ? 15 + Math.random() * 19 : 7 + Math.random() * 12,
              drift: (Math.random() * 2 - 1) * (big ? 240 : 100),
              spin: (Math.random() * 2 - 1) * 900,
              rx: (Math.random() * 2 - 1) * 720,
              ry: (Math.random() * 2 - 1) * 540,
              isEmoji, shape,
              emoji: isEmoji ? rand(emojis) : '',
              color: rand(ART_COLORS),
            });
          }
        }
        // 烟花爆裂（仅大庆祝）
        const fireworks = [];
        if (big) {
          const bursts = 2 + Math.floor(Math.random() * 2);
          for (let b = 0; b < bursts; b++) {
            const cx = 18 + Math.random() * 64;
            const cy = 18 + Math.random() * 38;
            const n = 22 + Math.floor(Math.random() * 12);
            const color = rand(ART_COLORS);
            for (let i = 0; i < n; i++) {
              const angle = (Math.PI * 2 * i) / n + Math.random() * 0.25;
              const r = 90 + Math.random() * 170;
              fireworks.push({
                key: `fw${b}-${i}`, left: cx, top: cy,
                fx: Math.cos(angle) * r, fy: Math.sin(angle) * r + 40,
                size: 3 + Math.random() * 5,
                delay: 0.15 + b * 0.42 + Math.random() * 0.12,
                color, glow: rand(ART_COLORS),
              });
            }
          }
        }
        // 升空气球（仅大庆祝）
        const balloons = [];
        if (big) {
          for (let i = 0; i < 5; i++) {
            balloons.push({
              key: `b${i}`, left: 6 + Math.random() * 88,
              size: 22 + Math.random() * 22,
              delay: Math.random() * 1.4,
              sway: (Math.random() * 2 - 1) * 90,
              emoji: rand(['🎈', '🎈', '🎈', '🎉', '⭐️']),
            });
          }
        }
        return { falls, fireworks, balloons };
      }, [burst]);

      return h('div', { 'aria-hidden': true, style: { position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' } },
        fx.falls.map((p) => h('span', {
          key: p.key,
          className: 'funbox-piece',
          style: {
            left: p.left + '%', fontSize: p.size + 'px',
            animationDelay: p.delay + 's', animationDuration: p.duration + 's',
            '--funbox-drift': p.drift + 'px', '--funbox-spin': p.spin + 'deg',
            '--funbox-rx': p.rx + 'deg', '--funbox-ry': p.ry + 'deg',
          },
        }, p.isEmoji
          ? p.emoji
          : h('i', {
            className: 'funbox-shape',
            style: {
              width: p.size + 'px',
              height: p.shape === 'circle' ? p.size + 'px' : (p.shape === 'ribbon' ? p.size * 2.2 : p.size * 1.5) + 'px',
              background: p.color,
              borderRadius: p.shape === 'circle' ? '999px' : (p.shape === 'ribbon' ? '2px' : '3px'),
              boxShadow: '0 0 6px ' + p.color,
            },
          }))),
        fx.fireworks.map((p) => h('span', {
          key: p.key,
          className: 'funbox-fw',
          style: {
            left: p.left + '%', top: p.top + '%',
            width: p.size + 'px', height: p.size + 'px',
            background: p.color, color: p.glow,
            animationDelay: p.delay + 's',
            '--funbox-fx': p.fx + 'px', '--funbox-fy': p.fy + 'px',
          },
        })),
        fx.balloons.map((p) => h('span', {
          key: p.key,
          className: 'funbox-balloon',
          style: {
            left: p.left + '%', top: '82vh', fontSize: p.size + 'px',
            animationDelay: p.delay + 's', '--funbox-sway': p.sway + 'px',
          },
        }, p.emoji)));
    }

    function FunBoxOverlay() {
      const [bursts, setBursts] = useState([]);
      useEffect(() => {
        const fn = (detail) => {
          setBursts((bs) => bs.concat(detail));
          window.setTimeout(() => setBursts((bs) => bs.filter((b) => b.id !== detail.id)), detail.big ? 7000 : 3400);
        };
        burstListeners.add(fn);
        return () => { burstListeners.delete(fn); };
      }, []);
      const toast = bursts.filter((b) => b.message).slice(-1);
      return h(React.Fragment, null,
        h(StyleTag, null),
        bursts.map((b) => h(Burst, { key: b.id, burst: b })),
        toast.map((b) => h('div', { key: 't' + b.id, className: 'funbox-toast', role: 'status' }, b.message)));
    }

    // ============ widget: toys under the composer ============
    const RPS = { rock: '✊', paper: '✋', scissors: '✌️' };
    const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

    function FunBoxWidget() {
      const [collapsed, setCollapsed] = useState(false);
      const [line, setLine] = useState('');
      const [badge, setBadge] = useState(badgeUnlocked);
      useEffect(() => {
        const fn = () => setBadge(true);
        badgeListeners.add(fn);
        return () => { badgeListeners.delete(fn); };
      }, []);

      const btn = (label, title, onClick, primary) =>
        h('button', { className: primary ? 'funbox-btn funbox-btn-primary' : 'funbox-btn', type: 'button', title, onClick }, label);

      const playRps = () => {
        const you = rand(Object.keys(RPS));
        const me = rand(Object.keys(RPS));
        const verdict = you === me ? tr('draw') : (BEATS[you] === me ? tr('win') : tr('lose'));
        setLine(tr('round') + '：' + tr('you') + ' ' + RPS[you] + ' · ' + tr('me') + ' ' + RPS[me] + ' — ' + verdict);
      };

      const body = [
        h('span', { key: 'brand', className: 'funbox-brand' }, '🎪 ' + tr('title')),
        btn('🎲 ' + tr('dice'), tr('dice'), () => setLine('🎲 ' + tr('diceResult') + ' ' + (1 + Math.floor(Math.random() * 6)) + ' ' + tr('points'))),
        btn('🎱 ' + tr('ask'), tr('ask'), () => setLine('🎱 ' + rand(EIGHTBALL))),
        btn('💬 ' + tr('praise'), tr('praise'), () => setLine('💬 ' + rand(PRAISE))),
        btn('✊ ' + tr('rps'), tr('rps'), playRps),
        btn('🎉 ' + tr('celebrate'), tr('celebrate'), () => { celebrate(true); setLine(tr('cheered')); }, true),
        badge ? h('span', { key: 'badge', className: 'funbox-badge' }, '🏅 ' + tr('badge')) : null,
        line ? h('span', { key: 'line', className: 'funbox-line' }, line) : null,
        btn(collapsed ? '▲' : '▼', collapsed ? tr('expand') : tr('collapse'), () => setCollapsed(!collapsed)),
      ].filter(Boolean);

      if (collapsed) {
        return h(React.Fragment, null, h(StyleTag, null),
          h('div', { className: 'funbox-widget-wrap' },
            h('div', { className: 'funbox-widget' },
              btn('🎪', tr('expand'), () => setCollapsed(false), true),
              badge ? h('span', { className: 'funbox-badge' }, '🏅') : null)));
      }
      return h(React.Fragment, null, h(StyleTag, null),
        h('div', { className: 'funbox-widget-wrap' },
          h('div', { className: 'funbox-widget' }, body)));
    }

    // ============ turn watch: celebrate completed turns ============
    const LOAD_AT = Date.now();
    const maxSeqBySession = new Map();

    function collectStrings(value, out, depth) {
      if (depth > 4 || out.length >= 200 || value == null) return;
      if (typeof value === 'string') { out.push(value); return; }
      if (typeof value !== 'object') return;
      if (Array.isArray(value)) { value.slice(0, 40).forEach((v) => collectStrings(v, out, depth + 1)); return; }
      Object.keys(value).slice(0, 40).forEach((k) => collectStrings(value[k], out, depth + 1));
    }
    function eventTimeMs(e) {
      if (!e || typeof e !== 'object') return NaN;
      const t = e.at != null ? e.at : e.time != null ? e.time : e.timestamp != null ? e.timestamp
        : (e.envelope && (e.envelope.at != null ? e.envelope.at : e.envelope.time));
      if (typeof t === 'number') return t < 1e12 ? t * 1000 : t;
      if (typeof t === 'string') { const ms = Date.parse(t); return Number.isNaN(ms) ? NaN : ms; }
      return NaN;
    }

    function FunBoxTurnWatch(props) {
      const seq = props.seq;
      const turn = props.turn;
      const sessionId = props.sessionId || 'default';
      useEffect(() => {
        if (!turn || turn.status !== 'closed') return;
        const prev = maxSeqBySession.get(sessionId);
        if (prev !== undefined && seq <= prev) return;
        maxSeqBySession.set(sessionId, seq);
        const endedAt = eventTimeMs(turn.end);
        if (!Number.isNaN(endedAt) && endedAt < LOAD_AT) return; // 历史回合回放不庆祝
        const strings = [];
        collectStrings(turn.end, strings, 0);
        const text = strings.join('\n').toLowerCase();
        const hit = KEYWORDS.some((k) => text.includes(k.toLowerCase()));
        if (!hit && !AUTO_CELEBRATE) return;
        const timer = window.setTimeout(() => celebrate(hit, hit ? undefined : rand(CHEERS)), 300);
        return () => window.clearTimeout(timer);
      }, [seq, turn, sessionId]);
      return null;
    }

    // ============ module ============
    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        if (ctx.locale && typeof ctx.locale.register === 'function') {
          try {
            ctx.locale.register('funbox', 'zh', DICT.zh);
            ctx.locale.register('funbox', 'en', DICT.en);
            if (typeof ctx.locale.bind === 'function') {
              const bound = ctx.locale.bind('funbox');
              if (typeof bound === 'function') {
                tr = (k) => { const v = bound(k); return v == null || v === k ? (DICT.zh[k] || k) : v; };
              }
            }
          } catch (e) { /* locale 不可用时退回内置文案 */ }
        }

        // Konami code: ↑↑↓↓←→←→BA
        let pos = 0;
        let lastKeyAt = 0;
        const onKeyDown = (e) => {
          const now = Date.now();
          if (now - lastKeyAt > 3000) pos = 0;
          lastKeyAt = now;
          const key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
          if (key === KONAMI[pos]) {
            pos += 1;
            if (pos === KONAMI.length) {
              pos = 0;
              unlockBadge();
              celebrate(true, EGG_UNLOCK);
            }
          } else {
            pos = key === KONAMI[0] ? 1 : 0;
          }
        };
        document.addEventListener('keydown', onKeyDown);
        ctx.effect(() => () => document.removeEventListener('keydown', onKeyDown));

        ctx.slots.inject('shell.overlay', () => ctx.slots.register(
          { name: 'shell.overlay', id: 'fun-box-overlay', order: 90 }, FunBoxOverlay));
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
          { name: 'conversation.composer.dock', id: 'fun-box-widget', order: 40 }, FunBoxWidget));
        ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register(
          { name: 'conversation.chat.turnTail', id: 'fun-box-turnwatch', order: 95 }, FunBoxTurnWatch));
      },
    };
  },
});
