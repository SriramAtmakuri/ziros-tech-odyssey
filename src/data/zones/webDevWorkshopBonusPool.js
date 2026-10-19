// The bonus reserve pool for Web Dev Workshop — 2x its 14 real chest positions.
// Once a chest is solved and the player moves past it via "Next", that
// chest's challenge gets replaced with one drawn from here (see
// gameStore.js's BONUS_POOLS registry / swapChallenge / getLiveChallenges),
// same mechanic as every other zone in this rollout. Pre-authored, never
// AI-generated at runtime.
//
// Split three ways:
//   - 10 hands-on (kind: 'code' — html/css/javascript, pattern-checked via
//     regex, same convention the main pool uses; kind: 'sequence' for
//     process ordering) covering ground the main 14 don't: CSS custom
//     properties, CSS transitions, localStorage persistence, Promise.all
//     for parallel fetches, an Array.prototype method chain bug, fetch
//     with try/catch error handling, CSS position/z-index stacking,
//     accessible form labeling, a CORS preflight lifecycle, and a service
//     worker caching lifecycle.
//   - 9 MCQ (kind: 'mcq') on web concepts with no single runnable snippet
//     of their own: HTTP status code families, REST verb semantics (PUT
//     vs PATCH vs DELETE), the same-origin policy and CORS, XSS vs CSRF,
//     localStorage vs sessionStorage vs cookies, CSS specificity, event
//     bubbling vs capturing, HTTP/1.1 vs HTTP/2 vs HTTP/3, and GraphQL
//     query vs mutation.
//   - 9 matching (kind: 'matching') pairing terms across HTTP status code
//     families, CSS units, web security terms, the CSS box model, JS
//     array methods, browser storage mechanisms, ARIA roles, HTTP caching
//     headers, and real-time/request-response communication styles.

export const WEB_DEV_WORKSHOP_BONUS_POOL = [
  // ---------- hands-on: code / sequence ----------
  {
    id: 'wd-pool-01-css-variables',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: 'The Same Blue, Copy-Pasted Nine Times',
    prompt: 'This stylesheet repeats #2563eb as a literal hex code in nine different rules — when the brand color changes, someone has to hunt down every copy. Define a custom property --brand-color on :root, and use var(--brand-color) for the .button background instead of the hardcoded hex.',
    starter: `:root {
  /* define --brand-color here */
}

.button {
  background: #2563eb;
  color: white;
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const root = (code.match(/:root\s*\{([^}]*)\}/) || [])[1] || ''
      const button = (code.match(/\.button\s*\{([^}]*)\}/) || [])[1] || ''
      const ok = /--brand-color\s*:/.test(root) && /var\(\s*--brand-color\s*\)/.test(button)
      return ok
        ? 'Rendered: button still the same blue. Change --brand-color once, every button updates.'
        : 'Rendered: button blue, but still hardcoded — changing the brand means editing nine separate rules.'
    },
    hints: [
      'A CSS custom property is defined like any other declaration, but with a name starting with two dashes: --brand-color: #2563eb;',
      'Define it once on :root so it\'s available everywhere, then reference it anywhere with var(--brand-color).',
      ':root {\n  --brand-color: #2563eb;\n}\n\n.button {\n  background: var(--brand-color);\n  color: white;\n}',
    ],
    xp: 55,
    tool: { name: 'CSS custom properties', icon: '🎨', description: '--name defines a reusable value once on :root; var(--name) references it anywhere — change it in one place.', fun: 3 },
    check({ code }) {
      const rootMatch = code.match(/:root\s*\{([^}]*)\}/)
      if (!rootMatch || !/--brand-color\s*:/.test(rootMatch[1])) {
        return { success: false, message: 'Define --brand-color as a custom property inside :root.' }
      }
      const buttonMatch = code.match(/\.button\s*\{([^}]*)\}/)
      if (!buttonMatch || !/var\(\s*--brand-color\s*\)/.test(buttonMatch[1])) {
        return { success: false, message: '.button should use var(--brand-color) instead of a hardcoded hex value.' }
      }
      return { success: true, message: 'One variable, referenced everywhere. The next rebrand is a one-line change.' }
    },
  },
  {
    id: 'wd-pool-02-css-transition',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: 'A Hover State That Just Snaps',
    prompt: 'This button changes color on :hover, but it just snaps instantly — no smoothness at all. Add a transition on .button so the background-color change animates over 0.2s.',
    starter: `.button {
  background: #2563eb;
  color: white;
}

.button:hover {
  background: #1e40af;
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const rule = (code.match(/\.button\s*\{([^}]*)\}/) || [])[1] || ''
      const ok = /transition:\s*background-color\s+0\.2s/.test(rule) || /transition:\s*[\w-]+\s+0\.2s/.test(rule)
      return ok
        ? 'Rendered: hovering the button now fades smoothly to the darker blue over 0.2s.'
        : 'Rendered: hovering the button snaps instantly to the darker blue — no animation at all.'
    },
    hints: [
      'transition tells the browser to animate a property change over time instead of applying it instantly.',
      'Add transition: background-color 0.2s; to the base .button rule (not the :hover rule).',
      '.button {\n  background: #2563eb;\n  color: white;\n  transition: background-color 0.2s;\n}\n\n.button:hover {\n  background: #1e40af;\n}',
    ],
    xp: 55,
    tool: { name: 'CSS transitions', icon: '🎞️', description: 'transition: property duration; animates a style change smoothly instead of snapping instantly.', fun: 3 },
    check({ code }) {
      const match = code.match(/\.button\s*\{([^}]*)\}/)
      if (!match || !/transition:\s*[\w-]+\s+0\.2s/.test(match[1])) {
        return { success: false, message: 'Add a transition declaration on the base .button rule — try transition: background-color 0.2s;' }
      }
      return { success: true, message: 'The hover state now eases in over 0.2s instead of snapping. Feels intentional.' }
    },
  },
  {
    id: 'wd-pool-03-local-storage',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'Forgotten on Every Refresh',
    prompt: 'This function saves a theme preference to a variable, but it vanishes on every page refresh — nothing is actually persisted. Rewrite saveTheme(theme) to store it in localStorage under the key "theme", and loadTheme() to read it back (returning null if nothing is stored).',
    starter: "function saveTheme(theme) {\n  currentTheme = theme;\n}\n\nfunction loadTheme() {\n  return currentTheme;\n}\n",
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /localStorage\.setItem\(\s*(['"])theme\1/.test(code) && /localStorage\.getItem\(\s*(['"])theme\1/.test(code)
      return ok
        ? 'saveTheme("dark") → refresh page → loadTheme() → "dark". Survives the refresh.'
        : 'saveTheme("dark") → refresh page → loadTheme() → undefined. Nothing was actually persisted.'
    },
    hints: [
      'A plain JS variable lives only in memory — it\'s gone the instant the page reloads. localStorage survives refreshes.',
      'localStorage.setItem(\'theme\', theme) saves it; localStorage.getItem(\'theme\') reads it back.',
      "function saveTheme(theme) {\n  localStorage.setItem('theme', theme);\n}\n\nfunction loadTheme() {\n  return localStorage.getItem('theme');\n}",
    ],
    xp: 60,
    tool: { name: 'localStorage', icon: '💾', description: 'localStorage.setItem/getItem persists data across page refreshes and browser restarts — a plain variable does not.', fun: 3 },
    check({ code }) {
      if (!/localStorage\.setItem\(\s*(['"])theme\1/.test(code)) {
        return { success: false, message: 'saveTheme should call localStorage.setItem(\'theme\', theme).' }
      }
      if (!/localStorage\.getItem\(\s*(['"])theme\1/.test(code)) {
        return { success: false, message: 'loadTheme should call localStorage.getItem(\'theme\') to read it back.' }
      }
      return { success: true, message: 'The preference now survives a refresh — it\'s actually stored, not just held in memory.' }
    },
  },
  {
    id: 'wd-pool-04-promise-all',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'Three Requests, One at a Time',
    prompt: 'loadDashboard() awaits three independent fetches one after another, so the page waits three times as long as it needs to — none of these requests depend on each other. Rewrite it to fire all three at once with Promise.all and await them together.',
    starter: "async function loadDashboard() {\n  const users = await fetch('/api/users').then(r => r.json());\n  const orders = await fetch('/api/orders').then(r => r.json());\n  const stats = await fetch('/api/stats').then(r => r.json());\n  return { users, orders, stats };\n}\n",
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /Promise\.all/.test(code)
      return ok
        ? 'loadDashboard() → all three requests fired at once → total wait ≈ the slowest single request.'
        : 'loadDashboard() → requests fired one after another → total wait ≈ the sum of all three.'
    },
    hints: [
      'Three independent awaits in a row run sequentially — each one waits for the previous to finish first, even though none of them depend on each other.',
      'Promise.all([...]) fires every promise at once and resolves once they\'ve all finished, so the total wait is just the slowest one.',
      "async function loadDashboard() {\n  const [users, orders, stats] = await Promise.all([\n    fetch('/api/users').then(r => r.json()),\n    fetch('/api/orders').then(r => r.json()),\n    fetch('/api/stats').then(r => r.json()),\n  ]);\n  return { users, orders, stats };\n}",
    ],
    xp: 75,
    tool: { name: 'Promise.all', icon: '⚡', description: 'Fires independent async operations concurrently instead of one after another — the wait becomes the slowest one, not the sum.', fun: 4 },
    check({ code }) {
      if (!/Promise\.all/.test(code)) {
        return { success: false, message: 'Use Promise.all([...]) to fire the three fetches concurrently instead of awaiting each one in sequence.' }
      }
      return { success: true, message: 'All three requests now fire at once. The dashboard loads roughly three times faster.' }
    },
  },
  {
    id: 'wd-pool-05-array-chain-bug',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'A Chain That Returns the Wrong Thing',
    prompt: 'getActiveUserNames(users) should return an array of names for every user where active is true. Right now it filters correctly but then uses forEach instead of map, so it returns undefined instead of the array of names. Fix the chain.',
    starter: "function getActiveUserNames(users) {\n  return users\n    .filter(u => u.active)\n    .forEach(u => u.name);\n}\n",
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /\.filter\([^)]*\)\s*\n?\s*\.map\(/.test(code) && !/\.filter\([^)]*\)\s*\n?\s*\.forEach\(/.test(code)
      return ok
        ? 'getActiveUserNames(users) → ["Nova", "Rex"] — the active users\' names, as an array.'
        : 'getActiveUserNames(users) → undefined. forEach always returns undefined, no matter what\'s inside it.'
    },
    hints: [
      'forEach runs a callback for its side effects and always returns undefined — it never builds a new array.',
      'map is the one that builds and returns a new array from each element\'s transformed value.',
      "function getActiveUserNames(users) {\n  return users\n    .filter(u => u.active)\n    .map(u => u.name);\n}",
    ],
    xp: 60,
    tool: { name: 'map vs forEach', icon: '🔗', description: 'map returns a new transformed array; forEach always returns undefined — using the wrong one silently breaks a chain.', fun: 3 },
    check({ code }) {
      if (/\.filter\([^)]*\)\s*\n?\s*\.forEach\(/.test(code)) {
        return { success: false, message: 'Still ending the chain with .forEach — that always returns undefined. Swap it for .map.' }
      }
      if (!/\.filter\([^)]*\)\s*\n?\s*\.map\(/.test(code)) {
        return { success: false, message: 'Keep .filter to select active users, then .map to pull out just their names.' }
      }
      return { success: true, message: 'filter selects the active users, map transforms them into names. The chain returns exactly what it should now.' }
    },
  },
  {
    id: 'wd-pool-06-fetch-try-catch',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'When the Network Just Dies',
    prompt: 'getUser(id) has no error handling at all — if the network fails or the fetch throws, the whole app crashes with an unhandled rejection. Wrap the fetch in a try/catch, and on failure return null instead of letting the error propagate.',
    starter: "async function getUser(id) {\n  const res = await fetch(`/api/users/${id}`);\n  const data = await res.json();\n  return data;\n}\n",
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /try\s*\{/.test(code) && /catch\s*\(/.test(code) && /return\s+null/.test(code)
      return ok
        ? 'getUser(99) with network offline → caught, logged, returns null. App keeps running.'
        : 'getUser(99) with network offline → uncaught rejection. App crashes.'
    },
    hints: [
      'A try/catch around the await calls lets you handle a network failure instead of letting it crash the caller.',
      'On the catch branch, return null so the caller gets a predictable value instead of an unhandled exception.',
      "async function getUser(id) {\n  try {\n    const res = await fetch(`/api/users/${id}`);\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    return null;\n  }\n}",
    ],
    xp: 65,
    tool: { name: 'try/catch with async/await', icon: '🧯', description: 'Wrapping await calls in try/catch turns a crash-causing network failure into a handled, predictable return value.', fun: 3 },
    check({ code }) {
      if (!/try\s*\{/.test(code) || !/catch\s*\(/.test(code)) {
        return { success: false, message: 'Wrap the fetch and JSON parsing in a try/catch block.' }
      }
      if (!/return\s+null/.test(code)) {
        return { success: false, message: 'In the catch block, return null instead of letting the error propagate.' }
      }
      return { success: true, message: 'A dropped connection now returns null instead of taking down the whole app.' }
    },
  },
  {
    id: 'wd-pool-07-z-index-stack',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: 'A Modal Hiding Behind the Page',
    prompt: 'This modal is supposed to float above everything else on the page, but it has no position or z-index set, so it renders behind the header. Give .modal a position and a z-index high enough to sit above .header (which has z-index: 10).',
    starter: `.header {
  position: fixed;
  z-index: 10;
}

.modal {
  /* needs a position and a higher z-index than .header */
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const rule = (code.match(/\.modal\s*\{([^}]*)\}/) || [])[1] || ''
      const hasPosition = /position:\s*(fixed|absolute|relative)/.test(rule)
      const zMatch = rule.match(/z-index:\s*(\d+)/)
      const ok = hasPosition && zMatch && Number(zMatch[1]) > 10
      return ok
        ? 'Rendered: modal floats above the header, exactly as expected.'
        : 'Rendered: modal renders behind the header — it\'s stuck in the background.'
    },
    hints: [
      'z-index only has an effect on elements with a position other than the default static — .modal needs a position value first.',
      'Give .modal a position (fixed or absolute both work) and a z-index greater than 10.',
      '.modal {\n  position: fixed;\n  z-index: 100;\n}',
    ],
    xp: 55,
    tool: { name: 'z-index stacking', icon: '📚', description: 'z-index only stacks positioned elements (not position: static) — and only wins against lower z-index values.', fun: 3 },
    check({ code }) {
      const match = code.match(/\.modal\s*\{([^}]*)\}/)
      if (!match || !/position:\s*(fixed|absolute|relative)/.test(match[1])) {
        return { success: false, message: '.modal needs a position (fixed or absolute) — z-index does nothing on a statically positioned element.' }
      }
      const zMatch = match[1].match(/z-index:\s*(\d+)/)
      if (!zMatch || Number(zMatch[1]) <= 10) {
        return { success: false, message: '.modal needs a z-index greater than 10 to render above .header.' }
      }
      return { success: true, message: 'Positioned and stacked above the header. The modal actually floats now.' }
    },
  },
  {
    id: 'wd-pool-08-accessible-form',
    kind: 'code',
    language: 'html',
    npc: 'Creative Director Pixel',
    title: 'A Form With Invisible Fields',
    prompt: 'This signup form has input fields with no associated <label> at all — a screen reader announces them only as "edit text", with no idea what to type. Add a <label> for each input, connected via a matching for/id pair.',
    starter: `<form>
  <input type="email" id="email" name="email">
  <input type="password" id="password" name="password">
  <button type="submit">Sign up</button>
</form>
`,
    runLabel: 'Run Lighthouse',
    simulate(code) {
      const hasEmailLabel = /<label[^>]*for=(['"])email\1[^>]*>/.test(code)
      const hasPasswordLabel = /<label[^>]*for=(['"])password\1[^>]*>/.test(code)
      const ok = hasEmailLabel && hasPasswordLabel
      return ok
        ? 'Lighthouse accessibility score: 96/100. Screen reader: "Email, edit text" / "Password, edit text".'
        : 'Lighthouse accessibility score: 58/100 — "Form elements do not have associated labels".'
    },
    hints: [
      'A <label for="id"> connects to an <input id="id"> by matching id — that\'s how a screen reader announces what the field is for.',
      'Add one <label> per input, each with a for attribute matching that input\'s id.',
      '<label for="email">Email</label>\n<input type="email" id="email" name="email">\n<label for="password">Password</label>\n<input type="password" id="password" name="password">',
    ],
    xp: 55,
    tool: { name: 'Accessible form labels', icon: '🏷️', description: '<label for="id"> matched to <input id="id"> tells assistive tech what a field is — without it, inputs are anonymous.', fun: 3 },
    check({ code }) {
      const hasEmailLabel = /<label[^>]*for=(['"])email\1[^>]*>/.test(code)
      const hasPasswordLabel = /<label[^>]*for=(['"])password\1[^>]*>/.test(code)
      if (!hasEmailLabel || !hasPasswordLabel) {
        return { success: false, message: 'Both the email and password inputs still need a <label for="..."> matching their id.' }
      }
      return { success: true, message: 'Every field now announces what it actually is. A screen reader user can fill this form out confidently.' }
    },
  },
  {
    id: 'wd-pool-09-cors-preflight',
    kind: 'sequence',
    npc: 'API Andy',
    title: 'Why the Browser Asks First',
    prompt: 'Order what happens when a browser makes a cross-origin request that triggers a CORS preflight.',
    items: [
      { id: 'attempt', label: 'JavaScript on site-a.com tries to call an API on site-b.com' },
      { id: 'options', label: 'Browser automatically sends an OPTIONS request first, asking permission' },
      { id: 'headers', label: 'Server on site-b.com responds with Access-Control-Allow-Origin headers' },
      { id: 'actual', label: 'If allowed, the browser sends the real request' },
    ],
    correctOrder: ['attempt', 'options', 'headers', 'actual'],
    successMessage: 'The browser never trusts a cross-origin request by default — it asks permission with OPTIONS first, and only proceeds if the server explicitly allows it.',
    hints: [
      'The browser itself inserts an extra step here — it happens automatically, before your actual request is ever sent.',
      'The real request only goes out AFTER the server has explicitly said, via headers, that it\'s allowed.',
      'JS tries a cross-origin call → Browser sends an OPTIONS preflight → Server responds with Access-Control-Allow-Origin → Browser sends the real request',
    ],
    xp: 60,
    tool: { name: 'CORS preflight', icon: '🚧', description: 'The browser automatically asks permission with an OPTIONS request before sending a cross-origin request it wasn\'t explicitly allowed to make.', fun: 3 },
  },
  {
    id: 'wd-pool-10-service-worker-cache',
    kind: 'sequence',
    npc: 'Creative Director Pixel',
    title: 'Working Without a Connection',
    prompt: 'Order how a service worker lets a page keep working offline.',
    items: [
      { id: 'register', label: 'Page registers a service worker on first visit' },
      { id: 'install', label: 'Service worker installs and caches key assets' },
      { id: 'intercept', label: 'On future visits, the service worker intercepts network requests' },
      { id: 'servecache', label: 'If offline, it serves the cached response instead of failing' },
    ],
    correctOrder: ['register', 'install', 'intercept', 'servecache'],
    successMessage: 'Nothing can be served from cache until it\'s registered and installed first — after that, the service worker sits between the page and the network on every request.',
    hints: [
      'A service worker can\'t intercept anything until it\'s been registered and has finished installing.',
      'It only reaches for the cache as a fallback — when the real network request would otherwise fail.',
      'Register the service worker → It installs and caches assets → It intercepts future requests → It serves cached responses when offline',
    ],
    xp: 65,
    tool: { name: 'Service worker offline caching', icon: '📡', description: 'A registered service worker intercepts requests and can serve cached responses when the network is unavailable — the basis of offline-capable PWAs.', fun: 4 },
  },

  // ---------- MCQ ----------
  {
    id: 'wd-pool-11-mcq-status-codes',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'What 404 Actually Means',
    prompt: 'A client requests a resource that doesn\'t exist on the server. Which HTTP status code family does that fall into, and why?',
    options: [
      '4xx — it\'s a client error: the client asked for something that isn\'t there',
      '5xx — it\'s a server error: the server failed to find the resource',
      '3xx — it\'s a redirect to a different resource',
      '2xx — a "success" as long as the server responded at all',
    ],
    correctIndex: 0,
    explanation: '4xx codes mean the client made a request that can\'t be fulfilled as-is — asking for a nonexistent resource is a client-side mistake (a bad URL, a deleted item), not a server malfunction, so it\'s 404, squarely in the 4xx family.',
    hints: [
      'The fault here is in what was asked for, not in the server itself failing to do its job.',
      'HTTP status codes group by who\'s "at fault" — 4xx is the client\'s side, 5xx is the server\'s side.',
      'The correct answer is: 4xx — a client error, since the client requested something that doesn\'t exist.',
    ],
    xp: 45,
    tool: { name: 'HTTP status code families', icon: '🔢', description: '1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error — the first digit tells you who\'s responsible.', fun: 3 },
  },
  {
    id: 'wd-pool-12-mcq-put-patch-delete',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'PUT vs. PATCH',
    prompt: 'A client wants to update just one field — a user\'s email — without resending the entire user object. Which REST verb is the semantically correct choice, and why?',
    options: [
      'PATCH — it\'s meant for a partial update, modifying only the fields provided',
      'PUT — it always accepts partial updates the same way PATCH does',
      'POST — updates of any kind always use POST',
      'DELETE followed by a fresh POST — that\'s the standard way to change one field',
    ],
    correctIndex: 0,
    explanation: 'PUT is defined as a full replacement of the resource — a PUT with only an email field, strictly interpreted, would wipe out every field the client didn\'t include. PATCH is exactly the verb meant for partial, field-level updates.',
    hints: [
      'One of these verbs semantically means "replace the whole resource with this"; the other means "apply this partial change".',
      'Sending just one field via the "replace the whole thing" verb would technically imply deleting everything else.',
      'The correct answer is: PATCH, since it\'s designed specifically for partial updates.',
    ],
    xp: 50,
    tool: { name: 'REST verb semantics', icon: '🔧', description: 'PUT replaces a whole resource; PATCH updates part of one — picking the wrong one has real semantic consequences.', fun: 3 },
  },
  {
    id: 'wd-pool-13-mcq-same-origin',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'Why the Browser Blocks It by Default',
    prompt: 'JavaScript running on site-a.com tries to read a response from an API on site-b.com, and the browser blocks it unless site-b.com explicitly allows it. What browser policy is this, and what is it protecting against?',
    options: [
      'The same-origin policy — it prevents a malicious script on one site from silently reading data from another site the user is logged into',
      'A firewall rule that only network admins can configure',
      'A DNS restriction that blocks requests to any domain other than the current one',
      'A JavaScript language limitation with no security purpose',
    ],
    correctIndex: 0,
    explanation: 'The same-origin policy is a browser security boundary: without it, a malicious script on any site you visit could silently make requests to your bank or email using your logged-in session and read the response. CORS headers are how a server explicitly opts out of that default block for specific origins.',
    hints: [
      'This is a browser-enforced boundary, not a network-level or DNS-level restriction.',
      'Think about what a malicious page could do if it could freely read responses from any other site you happen to be logged into.',
      'The correct answer is: the same-origin policy, protecting against a malicious site silently reading data from other sites.',
    ],
    xp: 55,
    tool: { name: 'Same-origin policy', icon: '🛡️', description: 'The browser blocks cross-origin reads by default to stop a malicious page from silently reading data from sites you\'re logged into elsewhere.', fun: 4 },
  },
  {
    id: 'wd-pool-14-mcq-xss-csrf',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'Two Different Attacks, Often Confused',
    prompt: 'What is the core difference between an XSS (cross-site scripting) attack and a CSRF (cross-site request forgery) attack?',
    options: [
      'XSS injects and runs attacker script inside your page; CSRF tricks a logged-in user\'s browser into sending an unwanted request to a site they\'re authenticated with',
      'They\'re two names for the exact same attack',
      'XSS only affects servers; CSRF only affects browsers',
      'CSRF injects malicious script; XSS forges requests using stolen cookies',
    ],
    correctIndex: 0,
    explanation: 'XSS is about getting attacker-controlled script to execute in the context of a trusted page (often via unescaped user input). CSRF doesn\'t inject anything — it exploits the fact that a browser automatically attaches cookies to any request, tricking the user\'s already-authenticated browser into firing off a request (like a form submit) the user never intended.',
    hints: [
      'One of these is about running attacker script INSIDE your page; the other is about forging a request using credentials the browser already has.',
      'CSRF doesn\'t need to inject any code at all — it just needs the victim to be logged in and to visit a malicious page or link.',
      'The correct answer is: XSS injects/runs script in your page; CSRF forges an authenticated request without needing to inject anything.',
    ],
    xp: 55,
    tool: { name: 'XSS vs. CSRF', icon: '⚔️', description: 'XSS runs attacker script in your page; CSRF forges a request using a victim\'s existing authenticated session — different mechanisms, different defenses.', fun: 4 },
  },
  {
    id: 'wd-pool-15-mcq-storage-types',
    kind: 'mcq',
    npc: 'JS Jack',
    title: 'Storage That Outlives the Tab',
    prompt: 'A site needs to remember a user\'s preference even after they close the browser entirely and reopen it days later. Which browser storage mechanism fits, and why not the alternatives?',
    options: [
      'localStorage — it persists with no expiration until explicitly cleared, unlike sessionStorage (cleared when the tab closes) or a cookie without an explicit long expiry',
      'sessionStorage — it\'s specifically designed to persist across browser restarts',
      'Neither — browsers can\'t store anything once the tab is closed',
      'Cookies are the only mechanism capable of surviving a browser restart',
    ],
    correctIndex: 0,
    explanation: 'sessionStorage is explicitly scoped to a single tab/session and clears when that tab closes — the opposite of what\'s needed here. localStorage has no built-in expiration and survives closing the browser entirely, making it the right fit (cookies can also persist with an explicit expiry, but aren\'t the best-fit answer among these options for simple client-side preference storage).',
    hints: [
      'One of these storage types is explicitly scoped to end when the tab/session ends — that rules it out immediately.',
      'The right answer here has no built-in expiration at all, unlike its session-scoped sibling.',
      'The correct answer is: localStorage, since it persists indefinitely until explicitly cleared.',
    ],
    xp: 50,
    tool: { name: 'localStorage vs. sessionStorage vs. cookies', icon: '🗄️', description: 'localStorage persists indefinitely, sessionStorage clears per-tab-session, cookies are sent with every request and can carry an expiry — pick based on lifetime and whether the server needs to see it.', fun: 3 },
  },
  {
    id: 'wd-pool-16-mcq-specificity',
    kind: 'mcq',
    npc: 'CSS Cassandra',
    title: 'Why Your CSS Rule Isn\'t Winning',
    prompt: 'You wrote .card { color: blue; } but the text is still red because of an earlier rule #main .card { color: red; }. Why does the ID-based selector win even though your rule appears later in the file?',
    options: [
      'CSS specificity ranks ID selectors above class selectors, regardless of source order — a more specific selector wins even if it comes first',
      'The rule that appears later in the file always wins, with no exceptions',
      'Class selectors are simply ignored whenever an ID selector exists anywhere in the stylesheet',
      'It\'s random which one applies — browsers pick arbitrarily'
    ],
    correctIndex: 0,
    explanation: 'CSS specificity is calculated per-selector (roughly: inline styles > IDs > classes/attributes/pseudo-classes > elements), and higher specificity wins regardless of where the rule appears in the file. Source order is only the tiebreaker when two rules have equal specificity — it never overrides a genuine specificity difference.',
    hints: [
      'This isn\'t about which rule comes later — it\'s about which selector is considered more "specific".',
      'An ID selector (#main) outranks a class selector (.card) in the specificity calculation, no matter the order they\'re written in.',
      'The correct answer is: CSS specificity ranks ID selectors above class selectors regardless of source order.',
    ],
    xp: 50,
    tool: { name: 'CSS specificity', icon: '⚖️', description: 'IDs beat classes beat elements in specificity — source order only breaks a tie between two equally specific rules.', fun: 3 },
  },
  {
    id: 'wd-pool-17-mcq-bubbling',
    kind: 'mcq',
    npc: 'JS Jack',
    title: 'Why One Click Triggers Two Handlers',
    prompt: 'A button inside a div both have click listeners. Clicking the button fires the button\'s handler, then the div\'s handler fires too — even though only the button was clicked. What DOM behavior explains this?',
    options: [
      'Event bubbling — after firing on the target element, the event propagates upward through each ancestor, triggering their listeners too',
      'A bug — clicks should never trigger a parent\'s handler under any circumstance',
      'Event capturing, which is the browser\'s default and only phase',
      'The two elements are treated as a single merged element by the DOM'
    ],
    correctIndex: 0,
    explanation: 'By default, DOM events bubble: after firing on the actual clicked target, the event propagates up through each ancestor in turn, firing any listeners registered there too. This is standard, intentional behavior (stoppable with event.stopPropagation()) — not a bug.',
    hints: [
      'This is standard, intentional DOM behavior — the event doesn\'t stop at the element it fired on.',
      'By default, an event travels UP from the target through its ancestors, firing listeners along the way.',
      'The correct answer is: event bubbling, where the event propagates upward through ancestor elements after firing on the target.',
    ],
    xp: 50,
    tool: { name: 'Event bubbling vs. capturing', icon: '🫧', description: 'Events bubble upward through ancestors by default after firing on their target — stoppable with stopPropagation(), and capturing is the opposite, top-down phase.', fun: 3 },
  },
  {
    id: 'wd-pool-18-mcq-http-versions',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'Why HTTP/2 Feels Faster',
    prompt: 'What is the key architectural change HTTP/2 introduced over HTTP/1.1 that improves page load performance?',
    options: [
      'Multiplexing — many requests and responses share a single TCP connection concurrently, instead of each needing its own connection or waiting in line',
      'It removed the need for a TCP connection entirely',
      'It made every response cacheable forever by default',
      'It replaced GET and POST with entirely new verbs'
    ],
    correctIndex: 0,
    explanation: 'HTTP/1.1 either opens multiple TCP connections per host (with browser-imposed limits) or serializes requests on one connection (head-of-line blocking). HTTP/2\'s multiplexing lets many requests/responses interleave over a single connection concurrently, cutting overhead and latency — this is the main perf win, distinct from HTTP/3\'s further move to QUIC/UDP to solve TCP-level head-of-line blocking.',
    hints: [
      'The key win is about how many requests can travel over one connection at the same time, not about caching or verbs.',
      'HTTP/1.1 tends to serialize or multiply connections; HTTP/2\'s big change lets requests interleave on one connection.',
      'The correct answer is: multiplexing, letting many requests/responses share one connection concurrently.',
    ],
    xp: 55,
    tool: { name: 'HTTP/1.1 vs. HTTP/2 vs. HTTP/3', icon: '🌐', description: 'HTTP/2 multiplexes many requests over one TCP connection; HTTP/3 goes further, moving off TCP entirely onto QUIC/UDP to avoid connection-level head-of-line blocking.', fun: 4 },
  },
  {
    id: 'wd-pool-19-mcq-graphql-mutation',
    kind: 'mcq',
    npc: 'API Andy',
    title: 'Reading vs. Changing Data in GraphQL',
    prompt: 'In GraphQL, what is the difference between a query and a mutation?',
    options: [
      'A query reads data without changing anything; a mutation is used specifically to create, update, or delete data',
      'They are interchangeable names for the same operation type',
      'A query can change data; a mutation can only read it',
      'Mutations are only used for authentication, never for any other data change'
    ],
    correctIndex: 0,
    explanation: 'GraphQL draws an explicit line between reads and writes: a query fetches data with no side effects, while a mutation is the operation type meant for anything that changes server-side state (create/update/delete) — the same distinction REST draws between GET and POST/PUT/PATCH/DELETE, just named differently.',
    hints: [
      'One of these is meant purely for fetching; the other is meant for anything that changes state on the server.',
      'This mirrors the REST distinction between GET (read-only) and POST/PUT/PATCH/DELETE (state-changing).',
      'The correct answer is: a query reads without side effects; a mutation is for creating, updating, or deleting data.',
    ],
    xp: 50,
    tool: { name: 'GraphQL query vs. mutation', icon: '🔀', description: 'A query is a read with no side effects; a mutation is the operation type for any create/update/delete — mirrors REST\'s GET vs. everything-else split.', fun: 3 },
  },

  // ---------- matching ----------
  {
    id: 'wd-pool-20-match-status-families',
    kind: 'matching',
    npc: 'API Andy',
    title: 'HTTP Status Code Families',
    prompt: 'Match each HTTP status code family to what it means.',
    pairs: [
      { id: 'a', left: '2xx', right: 'Success — the request was received, understood, and accepted' },
      { id: 'b', left: '3xx', right: 'Redirection — further action is needed to complete the request' },
      { id: 'c', left: '4xx', right: 'Client error — the request has bad syntax or can\'t be fulfilled as sent' },
      { id: 'd', left: '5xx', right: 'Server error — the server failed to fulfill a valid request' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'The first digit is the family — think of 2 as "good", and 4 vs. 5 as "whose fault is it".',
      '4xx is the client\'s fault (bad request); 5xx is the server\'s fault (it broke while handling a valid request).',
      '2xx → success, 3xx → redirection, 4xx → client error, 5xx → server error.',
    ],
    xp: 55,
    tool: { name: 'HTTP status code families', icon: '🔢', description: 'The first digit of a status code tells you the category: success, redirect, client error, or server error.', fun: 3 },
  },
  {
    id: 'wd-pool-21-match-css-units',
    kind: 'matching',
    npc: 'CSS Cassandra',
    title: 'CSS Units',
    prompt: 'Match each CSS unit to what it\'s relative to.',
    pairs: [
      { id: 'a', left: 'px', right: 'A fixed, absolute unit — not relative to anything else' },
      { id: 'b', left: '%', right: 'Relative to the parent element\'s size' },
      { id: 'c', left: 'rem', right: 'Relative to the root (<html>) element\'s font size' },
      { id: 'd', left: 'vh', right: 'Relative to 1% of the viewport\'s height' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'One of these is absolute; the other three are all relative to something different — a parent, the root, or the viewport.',
      'rem always traces back to the root <html> element specifically, unlike em which traces to its own parent.',
      'px → absolute, % → parent, rem → root font size, vh → viewport height.',
    ],
    xp: 55,
    tool: { name: 'CSS units', icon: '📏', description: 'px is absolute; %, rem, and vh are each relative to a different reference — parent, root font size, and viewport, respectively.', fun: 3 },
  },
  {
    id: 'wd-pool-22-match-security-terms',
    kind: 'matching',
    npc: 'API Andy',
    title: 'Web Security Vocabulary',
    prompt: 'Match each web security term to its definition.',
    pairs: [
      { id: 'a', left: 'XSS', right: 'Attacker script runs inside a trusted page, often via unescaped user input' },
      { id: 'b', left: 'CSRF', right: 'A victim\'s authenticated browser is tricked into sending an unwanted request' },
      { id: 'c', left: 'HTTPS', right: 'HTTP encrypted with TLS, protecting data in transit from eavesdropping' },
      { id: 'd', left: 'httpOnly cookie', right: 'A cookie flag that blocks JavaScript from ever reading its value' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two of these are attacks; two are defenses. XSS injects code, CSRF forges a request using existing trust.',
      'httpOnly specifically blocks JavaScript access — that\'s exactly why it protects a session token from being stolen via XSS.',
      'XSS → injected script, CSRF → forged trusted request, HTTPS → encrypted transport, httpOnly cookie → hidden from JS.',
    ],
    xp: 60,
    tool: { name: 'Web security vocabulary', icon: '🔐', description: 'XSS and CSRF are attacks; HTTPS and httpOnly cookies are defenses that limit what an attacker script can see or do.', fun: 4 },
  },
  {
    id: 'wd-pool-23-match-box-model',
    kind: 'matching',
    npc: 'CSS Cassandra',
    title: 'The CSS Box Model',
    prompt: 'Match each box model layer to its role, from the inside out.',
    pairs: [
      { id: 'a', left: 'Content', right: 'The actual text or image inside the element' },
      { id: 'b', left: 'Padding', right: 'Space between the content and the border' },
      { id: 'c', left: 'Border', right: 'A visible (or invisible) line wrapping the padding' },
      { id: 'd', left: 'Margin', right: 'Space between this element\'s border and its neighbors' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'These four layers wrap each other in a fixed order, from the innermost content outward.',
      'Padding sits inside the border; margin sits outside it, separating this element from its neighbors.',
      'Content → Padding → Border → Margin, innermost to outermost.',
    ],
    xp: 50,
    tool: { name: 'CSS box model', icon: '📦', description: 'Every element is content, wrapped by padding, wrapped by a border, wrapped by margin — innermost to outermost.', fun: 3 },
  },
  {
    id: 'wd-pool-24-match-array-methods',
    kind: 'matching',
    npc: 'JS Jack',
    title: 'JS Array Methods',
    prompt: 'Match each array method to what it does.',
    pairs: [
      { id: 'a', left: 'map', right: 'Transforms each element, returning a new array of the same length' },
      { id: 'b', left: 'filter', right: 'Keeps only elements that pass a test, returning a possibly shorter array' },
      { id: 'c', left: 'reduce', right: 'Combines every element into a single accumulated value' },
      { id: 'd', left: 'forEach', right: 'Runs a callback for side effects only — always returns undefined' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Three of these return a new array or value; one of them always returns undefined no matter what\'s inside it.',
      'reduce is the one that collapses an entire array down to one single value, like a sum or an object.',
      'map → transform (same length), filter → select (shorter), reduce → collapse to one value, forEach → side effects, no return.',
    ],
    xp: 55,
    tool: { name: 'JS array methods', icon: '🧮', description: 'map transforms, filter selects, reduce collapses to one value, forEach just runs side effects and returns nothing.', fun: 3 },
  },
  {
    id: 'wd-pool-25-match-storage-mechanisms',
    kind: 'matching',
    npc: 'JS Jack',
    title: 'Browser Storage Mechanisms',
    prompt: 'Match each browser storage mechanism to how long it lasts and where it\'s visible.',
    pairs: [
      { id: 'a', left: 'localStorage', right: 'Persists with no expiration until explicitly cleared; not sent to the server' },
      { id: 'b', left: 'sessionStorage', right: 'Cleared when the tab closes; not sent to the server' },
      { id: 'c', left: 'Cookie', right: 'Can have its own expiry; sent automatically with every matching request' },
      { id: 'd', left: 'In-memory variable', right: 'Gone the instant the page is refreshed or closed' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Only one of these is ever automatically sent along with an HTTP request — the other three stay purely client-side.',
      'The one with the shortest possible lifetime disappears on a simple refresh, not even needing the tab to close.',
      'localStorage → persists indefinitely, client-only; sessionStorage → per-tab, client-only; cookie → sent with requests; variable → gone on refresh.',
    ],
    xp: 60,
    tool: { name: 'Browser storage lifetimes', icon: '🗃️', description: 'localStorage, sessionStorage, cookies, and plain variables each have a different lifetime and visibility — pick based on both.', fun: 4 },
  },
  {
    id: 'wd-pool-26-match-aria-roles',
    kind: 'matching',
    npc: 'Creative Director Pixel',
    title: 'ARIA Roles and Attributes',
    prompt: 'Match each accessibility attribute to its purpose.',
    pairs: [
      { id: 'a', left: 'alt (on <img>)', right: 'Describes an image for screen readers when it can\'t be seen' },
      { id: 'b', left: 'aria-label', right: 'Provides an accessible name for an element with no visible text' },
      { id: 'c', left: 'role="button"', right: 'Tells assistive tech a non-<button> element behaves like a button' },
      { id: 'd', left: 'tabindex="0"', right: 'Makes an otherwise non-focusable element reachable via keyboard Tab' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'One of these is specific to images; another is for giving any element an accessible name when there\'s no visible label text.',
      'role tells assistive tech what something IS; tabindex controls whether keyboard users can even reach it.',
      'alt → describes an image, aria-label → accessible name, role="button" → describes behavior, tabindex="0" → keyboard-focusable.',
    ],
    xp: 55,
    tool: { name: 'ARIA accessibility attributes', icon: '♿', description: 'alt, aria-label, role, and tabindex each solve a different accessibility gap — missing description, missing name, wrong semantics, or unreachable by keyboard.', fun: 3 },
  },
  {
    id: 'wd-pool-27-match-cache-headers',
    kind: 'matching',
    npc: 'API Andy',
    title: 'HTTP Caching Headers',
    prompt: 'Match each HTTP caching header to its role.',
    pairs: [
      { id: 'a', left: 'Cache-Control: max-age', right: 'Tells the browser how long, in seconds, it can reuse a cached response without asking again' },
      { id: 'b', left: 'ETag', right: 'A fingerprint of the response content, used to check if it changed' },
      { id: 'c', left: 'If-None-Match', right: 'Sent by the browser with a previous ETag, asking "has this changed?"' },
      { id: 'd', left: '304 Not Modified', right: 'Server\'s reply when the cached version is still valid — no body needs resending' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'One header sets a time limit outright; the other two work as a pair — a fingerprint, then a follow-up question using it.',
      'The status code here signals "you already have the right thing" — the response body doesn\'t need to be sent again.',
      'max-age → time-based freshness, ETag → content fingerprint, If-None-Match → "did this change?", 304 → cached version still valid.',
    ],
    xp: 60,
    tool: { name: 'HTTP caching headers', icon: '🗂️', description: 'max-age sets a time-based cache lifetime; ETag + If-None-Match let a server confirm a cached response is still valid without resending it.', fun: 4 },
  },
  {
    id: 'wd-pool-28-match-communication-styles',
    kind: 'matching',
    npc: 'API Andy',
    title: 'Ways a Client and Server Talk',
    prompt: 'Match each communication style to how it behaves.',
    pairs: [
      { id: 'a', left: 'REST', right: 'Client requests a fixed resource shape from a specific endpoint' },
      { id: 'b', left: 'GraphQL', right: 'Client requests exactly the fields it needs from a single endpoint' },
      { id: 'c', left: 'WebSocket', right: 'A persistent, two-way connection — either side can send at any time' },
      { id: 'd', left: 'Server-Sent Events', right: 'A one-way stream from server to client over a single long-lived connection' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Two of these are request/response styles (fixed shape vs. client-chosen shape); two are long-lived connections (two-way vs. one-way only).',
      'WebSocket allows the server to push to the client AND the client to send to the server, at any time — SSE only flows one direction.',
      'REST → fixed shape per endpoint, GraphQL → client-shaped fields, WebSocket → two-way persistent, SSE → one-way server-to-client stream.',
    ],
    xp: 60,
    tool: { name: 'REST vs. GraphQL vs. WebSocket vs. SSE', icon: '📶', description: 'REST and GraphQL are request/response (differing in who shapes the response); WebSocket and SSE are persistent connections (differing in whether both sides can send).', fun: 4 },
  },
]
