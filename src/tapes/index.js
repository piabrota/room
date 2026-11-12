// The index tapes: one module for the three of them. Each lists the public
// repositories of one GitHub account, a line each, a page at a time: the
// account is the tape's own (`tape.account` in config.tapes), and the list,
// the colours and every word come from config.catalogue. A click on a line
// opens the repository; the deck's REW and FF, or a click on the foot of the
// screen, turn the page. It makes no sound, no timer and no listener, so
// stop() only lets go of the list.
import { FONT_MONO, FONT_TITLE } from '../art.js';

const PER = 6, TOP = 80, ROW = 45, FOOT = 356, X = 26; // lines a page, and where they lie on the 512 × 384 screen
let W, H, words, account, rows = [], page = 0, boxes = [], fresh = 0;

const pages = () => Math.max(1, Math.ceil(rows.length / PER));
function turn(by) { page = (page + by + pages()) % pages(); fresh = 0; }
// a text cut to a width, with an ellipsis; the font is the one set
function cut(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let s = text; while (s.length > 1 && ctx.measureText(s + '…').width > max) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

export default {
  mount({ width, height, config, tape }) {
    W = width; H = height; words = config.catalogue.words;
    account = config.catalogue.accounts[tape.account];
    rows = account?.repos?.() ?? []; page = 0; boxes = []; fresh = 0;
  },

  frame(ctx, t, dt) {
    fresh = Math.min(1, fresh + dt * 2.5); // a turned page comes up line by line
    ctx.fillStyle = '#0b0e13'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.16; ctx.fillStyle = account.color; ctx.fillRect(0, 0, W, 64); ctx.globalAlpha = 1;
    ctx.fillStyle = account.color; ctx.fillRect(0, 64, W, 3);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

    // the header: whose index this is, and how long
    ctx.fillStyle = '#f3ead8'; ctx.font = `30px ${FONT_TITLE}`; ctx.fillText(account.name, X, 46);
    ctx.textAlign = 'right'; ctx.font = `12px ${FONT_MONO}`;
    ctx.fillStyle = account.color; ctx.fillText(words.title.toUpperCase(), W - X, 30);
    ctx.fillStyle = '#9aa3b2'; ctx.fillText(words.count(rows.length), W - X, 48);
    ctx.textAlign = 'left';

    // the page: a number, the name, and under it the line that says what it is
    boxes = [];
    rows.slice(page * PER, page * PER + PER).forEach((r, k) => {
      const y = TOP + k * ROW, n = page * PER + k + 1;
      ctx.globalAlpha = Math.min(1, Math.max(0, fresh * (PER + 2) - k) / 2);
      ctx.fillStyle = account.color; ctx.font = `13px ${FONT_MONO}`; ctx.fillText(String(n).padStart(2, '0'), X, y + 17);
      ctx.fillStyle = r.archived ? '#8b93a1' : '#f3ead8'; ctx.font = `bold 18px ${FONT_MONO}`;
      const name = cut(ctx, r.name, W - X * 2 - 120); ctx.fillText(name, X + 30, y + 17);
      if (r.archived) { const w = ctx.measureText(name).width; ctx.font = `12px ${FONT_MONO}`; ctx.fillText(words.archived, X + 40 + w, y + 17); }
      ctx.fillStyle = '#aab2bf'; ctx.font = `14px ${FONT_MONO}`; ctx.fillText(cut(ctx, r.line || words.none, W - X * 2 - 30), X + 30, y + 35);
      ctx.fillStyle = '#f3d27a'; ctx.textAlign = 'right'; ctx.fillText('↗', W - X, y + 17); ctx.textAlign = 'left';
      boxes.push({ y0: y - 2, y1: y + ROW - 2, url: r.url });
    });
    ctx.globalAlpha = 1;

    // the foot: the page, and the two ways to turn it
    ctx.fillStyle = '#1b222c'; ctx.fillRect(X, FOOT - 9, W - X * 2, 1);
    ctx.font = `12px ${FONT_MONO}`; ctx.fillStyle = '#f3d27a';
    if (pages() > 1) { ctx.fillText(words.prev, X, FOOT + 8); ctx.textAlign = 'right'; ctx.fillText(words.next, W - X, FOOT + 8); }
    ctx.textAlign = 'center'; ctx.fillStyle = '#9aa3b2';
    ctx.fillText(`${words.page(page + 1, pages())}  ·  ${words.open}`, W / 2, FOOT + 8);
    ctx.textAlign = 'left';
  },

  input({ type, x, y }) {
    if (type === 'rew') return turn(-1);
    if (type === 'ff') return turn(1);
    if (type !== 'click') return;
    if (y >= FOOT - 9) { if (x < W / 3) turn(-1); else if (x > (W * 2) / 3) turn(1); return; }
    const hit = boxes.find((b) => y >= b.y0 && y < b.y1);
    if (hit) window.open(hit.url, '_blank', 'noopener');
  },

  stop() { rows = []; boxes = []; account = null; },
};
