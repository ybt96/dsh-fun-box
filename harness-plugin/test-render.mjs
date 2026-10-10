// fun-box 炫酷版渲染契约测试：假 React 生成元素树，断言新视觉的 DOM 结构与 CSS 契约。
import { readFileSync } from 'node:fs';

// ---- 假 React：生成可遍历的元素树 ----
const stateQueue = [];
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  Fragment: 'Fragment',
  useState: (init) => [stateQueue.length ? stateQueue.shift() : init, () => {}],
  useEffect: () => {},
  useMemo: (fn) => fn(),
};

let loaded = null;
globalThis.window = {
  __ModuleLoader__: { load: (m) => { loaded = m; } },
  setTimeout: () => 0,
};
globalThis.document = { addEventListener: () => {}, removeEventListener: () => {} };

const src = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
new Function(src)();
const mod = loaded.factory((name) => {
  if (name === 'react') return fakeReact;
  throw new Error('unknown require ' + name);
});

const registrations = [];
const fakeCtx = {
  slots: {
    inject: (key, cb) => cb(),
    register: (reg, comp) => { registrations.push({ reg, comp }); return () => {}; },
  },
  locale: { register: () => {}, bind: () => (k) => k },
  effect: () => () => {},
};
mod.apply(fakeCtx);

const byId = Object.fromEntries(registrations.map((r) => [r.reg.id, r.comp]));
const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } console.log('ok - ' + msg); };

// ---- 遍历工具 ----
function walk(node, fn) {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walk(n, fn)); return; }
  fn(node);
  if (typeof node.type === 'function') { walk(node.type(node.props), fn); return; }
  walk(node.children, fn);
}

// ---- 1. CSS 契约 ----
stateQueue.length = 0;
const widgetTree = byId['fun-box-widget']();
let css = '';
walk(widgetTree, (n) => { if (n.type === 'style') css += n.children.join(''); });
assert(css.length > 2000, `CSS 样式表已渲染 (${css.length} chars)`);
assert((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'CSS 花括号配对完整');
for (const kf of ['funbox-fall', 'funbox-fw', 'funbox-balloon', 'funbox-bounce-in', 'funbox-border-flow', 'funbox-shimmer', 'funbox-breathe']) {
  assert(css.includes('@keyframes ' + kf), `keyframes ${kf} 存在`);
}
for (const sel of ['funbox-widget-wrap', 'funbox-btn-primary', 'funbox-toast::before', 'funbox-shape', 'funbox-fw', 'funbox-balloon']) {
  assert(css.includes('.' + sel), `样式类 .${sel} 存在`);
}
assert(css.includes('backdrop-filter: blur'), '玻璃拟态 backdrop-filter 存在');
assert(css.includes('color-mix(in srgb'), '主题令牌 color-mix 半透明处理存在');
assert(!/--dsw-alias-[a-z0-9-]*\s*:\s*#/.test(css), '未硬编码主题令牌颜色');
const varsUsed = new Set((css.match(/var\((--funbox-[a-z]+)/g) || []).map((s) => s.slice(4)));
for (const v of ['--funbox-drift', '--funbox-spin', '--funbox-rx', '--funbox-ry', '--funbox-fx', '--funbox-fy', '--funbox-sway']) {
  assert(varsUsed.has(v) || css.includes(v), `动画变量 ${v} 在 CSS 中被引用`);
}

// ---- 2. 挂件 DOM 契约 ----
const classes = new Set();
const buttonLabels = [];
walk(widgetTree, (n) => {
  if (n.props && n.props.className) String(n.props.className).split(' ').forEach((c) => c && classes.add(c));
  if (n.type === 'button') buttonLabels.push(String(n.children && n.children.join ? n.children.join('') : ''));
});
assert(classes.has('funbox-widget-wrap'), '挂件渐变描边容器存在');
assert(classes.has('funbox-widget'), '挂件玻璃卡片存在');
assert(classes.has('funbox-brand'), '渐变品牌标题存在');
assert(classes.has('funbox-btn-primary'), '主按钮(撒花)发光样式存在');
assert(buttonLabels.some((l) => l.includes('撒花')), '撒花按钮存在');
assert(buttonLabels.some((l) => l.includes('掷骰子')) && buttonLabels.some((l) => l.includes('问一卦')), '玩具按钮齐全');

// ---- 3. 大庆祝 burst 契约（114 彩片 + 烟花 + 气球）----
stateQueue.push([{ id: 1, big: true, message: 'test' }]);
const overlayTree = byId['fun-box-overlay']();
let pieces = 0, fws = 0, balloons = 0, toast = 0;
const customVars = new Set();
walk(overlayTree, (n) => {
  const cls = n.props && n.props.className ? String(n.props.className) : '';
  if (cls === 'funbox-piece') pieces++;
  if (cls === 'funbox-fw') fws++;
  if (cls === 'funbox-balloon') balloons++;
  if (cls === 'funbox-toast') toast++;
  if (n.props && n.props.style) Object.keys(n.props.style).forEach((k) => { if (k.startsWith('--funbox-')) customVars.add(k); });
});
assert(pieces >= 100, `大庆祝彩片 ${pieces} 片 (≥100, 三波次)`);
assert(fws >= 40, `烟花粒子 ${fws} 个 (≥40, 爆裂式)`);
assert(balloons === 5, `升空气球 ${balloons} 个`);
assert(toast === 1, '鼓励语 toast 渲染');
for (const v of ['--funbox-drift', '--funbox-spin', '--funbox-rx', '--funbox-ry', '--funbox-fx', '--funbox-fy', '--funbox-sway']) {
  assert(customVars.has(v), `运行时注入动画变量 ${v}`);
}

console.log('\nRENDER CONTRACT OK: 炫酷视觉的 DOM/CSS 契约全部通过');
