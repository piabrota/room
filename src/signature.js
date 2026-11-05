// Draws the name, tagline and links from config.signature. Built with
// DOM nodes and textContent, never innerHTML, so config text is text.
export function renderSignature(el, sig) {
  const h1 = document.createElement('h1'); h1.textContent = sig.name;
  const p = document.createElement('p'); p.textContent = sig.tagline;
  el.replaceChildren(h1, p);
  for (const l of sig.links) {
    const a = document.createElement('a');
    a.href = l.url; a.textContent = l.label; a.target = '_blank'; a.rel = 'noopener';
    el.append(a);
  }
}
