// Imperative full-screen color flash (correct = green, wrong = red) — a
// single reused DOM overlay so every challenge panel can just call
// flash('#22c55e') without any React state plumbing.
let el = null

function ensureEl() {
  if (el) return el
  el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.inset = '0'
  el.style.pointerEvents = 'none'
  el.style.zIndex = '9999'
  el.style.opacity = '0'
  el.style.transition = 'opacity 120ms ease-out'
  document.body.appendChild(el)
  return el
}

export function flash(color, peakOpacity = 0.18) {
  const node = ensureEl()
  node.style.background = color
  node.style.transition = 'none'
  node.style.opacity = String(peakOpacity)
  requestAnimationFrame(() => {
    node.style.transition = 'opacity 350ms ease-out'
    node.style.opacity = '0'
  })
}
