// fun-box client.js 冒烟测试：不依赖浏览器，验证工厂加载、apply 注册、Konami 处理器。
import { readFileSync } from 'node:fs';

let loaded = null;
const keydownHandlers = [];
globalThis.window = {
  __ModuleLoader__: { load: (m) => { loaded = m; } },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
};
globalThis.document = {
  addEventListener: (type, fn) => { if (type === 'keydown') keydownHandlers.push(fn); },
  removeEventListener: (type, fn) => {
    const i = keydownHandlers.indexOf(fn);
    if (i >= 0) keydownHandlers.splice(i, 1);
  },
};

const src = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
new Function(src)();

if (!loaded || loaded.id !== 'dsh-fun-box') throw new Error('factory not registered');
const fakeReact = { createElement: () => null, Fragment: Symbol('Fragment'), useState: () => [], useEffect: () => {}, useMemo: () => [] };
const mod = loaded.factory((name) => (name === 'react' ? fakeReact : (() => { throw new Error('unknown require ' + name); })));

if (!Array.isArray(mod.inject) || !mod.inject.includes('slots')) throw new Error('inject missing slots');

const injected = [];
const registered = [];
const effects = [];
const fakeCtx = {
  slots: {
    inject: (key, cb) => { injected.push(key); cb(); },
    register: (reg, comp) => { registered.push(reg); return () => {}; },
  },
  locale: {
    register: (ns, loc, dict) => { if (!dict || typeof dict !== 'object') throw new Error('bad dict'); },
    bind: () => (k) => k,
  },
  effect: (fn) => { effects.push(fn); },
};
mod.apply(fakeCtx);

const want = [
  ['shell.overlay', 'fun-box-overlay'],
  ['conversation.composer.dock', 'fun-box-widget'],
  ['conversation.chat.turnTail', 'fun-box-turnwatch'],
];
for (const [slot, id] of want) {
  if (!injected.includes(slot)) throw new Error('missing slot inject: ' + slot);
  const reg = registered.find((r) => r.name === slot && r.id === id);
  if (!reg) throw new Error('missing registration: ' + slot + '#' + id);
}
if (keydownHandlers.length !== 1) throw new Error('keydown listener not registered');

// Konami 处理器应无异常跑完
const handler = keydownHandlers[0];
for (const key of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) handler({ key });
// 处理器容错：随意输入不抛错
for (const key of ['x','ArrowUp','z','b','a']) handler({ key });

// effect 清理函数应能解除监听
for (const fn of effects) { const cleanup = fn(); if (typeof cleanup === 'function') cleanup(); }
if (keydownHandlers.length !== 0) throw new Error('cleanup did not remove keydown listener');

console.log('SMOKE OK: factory + 3 slot registrations + konami handler + cleanup all pass');
