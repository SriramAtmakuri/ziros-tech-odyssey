// Web Dev Workshop — HTML/CSS/JavaScript, REST vs GraphQL, web performance, auth.
// Reuses the 'sequence' kind for architecture/process ordering and the 'code' kind
// (HTML/CSS/JS, pattern-checked via regex, no live DOM or JS execution engine) —
// no new panel types, same mechanics as Data Realm and Code Kingdom.

export const WEB_DEV_WORKSHOP_CHALLENGES = [
  {
    id: 'wd-01-semantic-html',
    kind: 'code',
    language: 'html',
    npc: 'Creative Director Pixel',
    title: 'Divs All the Way Down',
    prompt: 'This homepage is built entirely out of generic divs — a screen reader has no idea what any part of this page actually is. Replace the header, nav, main, and footer divs with real semantic elements: <header>, <nav>, <main>, and <footer>.',
    starter: `<div class="header">
  <h1>My Website</h1>
</div>
<div class="nav">
  <a href="/">Home</a>
  <a href="/about">About</a>
</div>
<div class="main">
  <p>Welcome to my site.</p>
</div>
<div class="footer">
  <p>&copy; 2026 My Website</p>
</div>
`,
    runLabel: 'Run Lighthouse',
    simulate(code) {
      const hasHeader = /<header/i.test(code)
      const hasNav = /<nav/i.test(code)
      const hasMain = /<main/i.test(code)
      const hasFooter = /<footer/i.test(code)
      const ok = hasHeader && hasNav && hasMain && hasFooter
      return ok
        ? 'Lighthouse accessibility score: 94/100 (was 61/100).'
        : "Lighthouse accessibility score: 61/100 — screen readers can't identify the page structure."
    },
    hints: [
      'A div with a class name means nothing to a screen reader — semantic tags describe what a section actually is.',
      'You need four real elements in place of the divs: <header>, <nav>, <main>, <footer>.',
      '<header>...</header>\n<nav>...</nav>\n<main>...</main>\n<footer>...</footer>',
    ],
    xp: 50,
    tool: { name: 'Semantic HTML', icon: '🏷️', description: '<header>, <nav>, <main>, <footer> tell browsers and screen readers what a section actually is.', fun: 3 },
    check({ code }) {
      const hasHeader = /<header/i.test(code)
      const hasNav = /<nav/i.test(code)
      const hasMain = /<main/i.test(code)
      const hasFooter = /<footer/i.test(code)
      if (!hasHeader || !hasNav || !hasMain || !hasFooter) {
        return { success: false, message: 'Still missing semantic tags — you need <header>, <nav>, <main>, and <footer> all present.' }
      }
      return { success: true, message: 'Real structure now. A screen reader — or any tool — can tell exactly what each part of the page is.' }
    },
  },

  {
    id: 'wd-02-flexbox-nav',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: "A Navigation Bar That Won't Behave",
    prompt: 'This navbar has no display property at all, so its links just stack vertically down the page instead of sitting in a row. Make .navbar a flex container, spread its children apart, and center them vertically.',
    starter: `.navbar {
  background: #1f2937;
  padding: 1rem;
}

.navbar a {
  color: white;
  text-decoration: none;
  margin-right: 1rem;
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const rule = (code.match(/\.navbar\s*\{([^}]*)\}/) || [])[1] || ''
      const ok = /display:\s*flex/.test(rule) && /justify-content:\s*space-between/.test(rule)
      return ok
        ? 'Rendered: nav links in a row, evenly spaced. Looks intentional now.'
        : 'Rendered: nav links stacked vertically down the left edge of the page.'
    },
    hints: [
      'Without a display property, .navbar is just a plain block element — its children stack like paragraphs.',
      'display: flex turns it into a flex container; justify-content: space-between spreads the children apart.',
      '.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  background: #1f2937;\n  padding: 1rem;\n}',
    ],
    xp: 50,
    tool: { name: 'Flexbox', icon: '📐', description: 'display: flex + justify-content/align-items turns a stack of elements into a real layout.', fun: 3 },
    check({ code }) {
      const match = code.match(/\.navbar\s*\{([^}]*)\}/)
      if (!match) {
        return { success: false, message: 'No .navbar rule found — the block seems to have disappeared.' }
      }
      const rule = match[1]
      if (!/display:\s*flex/.test(rule)) {
        return { success: false, message: '.navbar still needs display: flex to lay its children out in a row.' }
      }
      if (!/justify-content:\s*space-between/.test(rule)) {
        return { success: false, message: 'Add justify-content: space-between so the links spread across the bar instead of bunching up.' }
      }
      return { success: true, message: 'The nav links sit in a row, evenly spaced, like a real navigation bar should.' }
    },
  },

  {
    id: 'wd-03-css-grid',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: 'Three Columns, One Featured',
    prompt: 'Build a photo gallery: .gallery should lay its children out in three equal columns, and one special item with class .featured should stretch across two of those columns.',
    starter: `.gallery {
  /* lay out children in three equal columns */
}

.featured {
  /* make this item span two columns */
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const gallery = (code.match(/\.gallery\s*\{([^}]*)\}/) || [])[1] || ''
      const featured = (code.match(/\.featured\s*\{([^}]*)\}/) || [])[1] || ''
      const ok = /grid-template-columns/.test(gallery) && /grid-column:\s*span\s*2/.test(featured)
      return ok
        ? 'Rendered: a clean 3-column grid, with the featured photo stretched across two columns.'
        : 'Rendered: every photo the same size, stacked without any real grid layout.'
    },
    hints: [
      'CSS Grid lays a container out in rows and columns; grid-template-columns defines how many columns and how wide.',
      'repeat(3, 1fr) gives you three equal-width columns on .gallery.',
      '.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}\n\n.featured {\n  grid-column: span 2;\n}',
    ],
    xp: 65,
    tool: { name: 'CSS Grid', icon: '🔲', description: 'grid-template-columns defines the grid; grid-column: span lets an item stretch across more than one column.', fun: 4 },
    check({ code }) {
      const galleryMatch = code.match(/\.gallery\s*\{([^}]*)\}/)
      const featuredMatch = code.match(/\.featured\s*\{([^}]*)\}/)
      if (!galleryMatch || !/grid-template-columns/.test(galleryMatch[1])) {
        return { success: false, message: '.gallery needs a grid-template-columns declaration — try repeat(3, 1fr).' }
      }
      if (!featuredMatch || !/grid-column:\s*span\s*2/.test(featuredMatch[1])) {
        return { success: false, message: '.featured needs grid-column: span 2 so it stretches across two columns.' }
      }
      return { success: true, message: 'Three even columns, one photo standing out. That\'s the grid working as intended.' }
    },
  },

  {
    id: 'wd-04-responsive-media-query',
    kind: 'code',
    language: 'css',
    npc: 'CSS Cassandra',
    title: 'Broken on Mobile',
    prompt: 'This page forces a fixed 1200px width no matter how small the screen is — on a phone it just gets clipped. Add a media query for screens 768px wide or narrower that gives .container a mobile-friendly width instead.',
    starter: `.container {
  width: 1200px;
  margin: 0 auto;
}
`,
    runLabel: 'Render Page',
    simulate(code) {
      const mediaBlock = code.match(/@media\s*\(\s*max-width:\s*768px\s*\)\s*\{\s*\.container\s*\{([^}]*)\}/i)
      const ok = mediaBlock && /width:\s*(?!1200px)/i.test(mediaBlock[1])
      return ok
        ? 'Rendered at 375px wide: .container fits the screen. No horizontal scrollbar.'
        : 'Rendered at 375px wide: .container overflows the screen — horizontal scrollbar appears.'
    },
    hints: [
      'A media query lets you override styles only when the screen matches a condition, like being narrow.',
      '@media (max-width: 768px) { .container { ... } } applies only on small screens.',
      '@media (max-width: 768px) {\n  .container {\n    width: 100%;\n  }\n}',
    ],
    xp: 60,
    tool: { name: 'Media queries', icon: '📱', description: '@media (max-width: ...) overrides styles only below a given screen width — the basis of responsive design.', fun: 3 },
    check({ code }) {
      const mediaBlock = code.match(/@media\s*\(\s*max-width:\s*768px\s*\)\s*\{\s*\.container\s*\{([^}]*)\}/i)
      if (!mediaBlock) {
        return { success: false, message: 'Add an @media (max-width: 768px) block containing a .container rule.' }
      }
      const widthMatch = mediaBlock[1].match(/width:\s*([^;]+);/i)
      if (!widthMatch || widthMatch[1].trim() === '1200px') {
        return { success: false, message: 'Inside the media query, give .container a different, mobile-friendly width — like 100% or 95%.' }
      }
      return { success: true, message: 'Under 768px, the container now shrinks to fit instead of forcing a fixed 1200px on every phone.' }
    },
  },

  {
    id: 'wd-05-dom-events',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'A Button That Does Nothing',
    prompt: 'This save button is wired up in the DOM but nothing happens when you click it — there\'s no event listener at all. Add a click listener that actually does something when it fires.',
    starter: "const btn = document.querySelector('#save-btn');\n\n// add an event listener that runs when the button is clicked\n",
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /addEventListener/.test(code) && /(['"])click\1/.test(code)
      return ok
        ? 'Clicked #save-btn → listener fired → "Saved!" logged to console.'
        : 'Clicked #save-btn → nothing happened. No listener attached.'
    },
    hints: [
      'A DOM element needs an event listener attached before it will react to anything.',
      'btn.addEventListener(\'click\', () => { ... }) runs the callback every time the button is clicked.',
      "btn.addEventListener('click', () => {\n  console.log('Saved!');\n});",
    ],
    xp: 45,
    tool: { name: 'DOM events', icon: '🖱️', description: 'addEventListener wires a callback to a real user action — no listener, no reaction.', fun: 3 },
    check({ code }) {
      if (!/addEventListener/.test(code)) {
        return { success: false, message: 'Still no addEventListener call — the button has no way to react to a click.' }
      }
      if (!/(['"])click\1/.test(code)) {
        return { success: false, message: 'The listener needs to be registered for the \'click\' event specifically.' }
      }
      return { success: true, message: 'Click the button now and something actually happens. That\'s a wired-up UI.' }
    },
  },

  {
    id: 'wd-06-fetch-async',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'Waiting for the Server, Properly',
    prompt: 'This function fetches data but never actually parses the JSON body, and never returns anything — whoever calls loadData() just gets undefined. Rewrite it using async/await so it correctly awaits the fetch, awaits the parsed JSON, and returns the data.',
    starter: "function loadData(url) {\n  fetch(url)\n    .then(res => {\n      console.log(res);\n    });\n}\n",
    runLabel: 'Run Script',
    simulate(code) {
      const hasAsync = /async\s+function/.test(code) || /async\s*\(/.test(code) || /async\s+\w+\s*=>/.test(code)
      const awaitCount = (code.match(/\bawait\b/g) || []).length
      const ok = hasAsync && awaitCount >= 2
      return ok
        ? 'loadData(url) → awaited fetch → awaited res.json() → returned parsed data.'
        : 'loadData(url) → returned undefined. The caller never got the parsed data.'
    },
    hints: [
      'The response from fetch() is not the data itself — it still needs res.json() to parse the body, and that\'s also asynchronous.',
      'async/await lets you write this top to bottom: await the fetch, then await res.json(), then return it.',
      'async function loadData(url) {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n}',
    ],
    xp: 70,
    tool: { name: 'async/await', icon: '⏳', description: 'await pauses until a Promise resolves — turning nested .then() chains into readable top-to-bottom code.', fun: 4 },
    check({ code }) {
      const hasAsync = /async\s+function/.test(code) || /async\s*\(/.test(code) || /async\s+\w+\s*=>/.test(code)
      if (!hasAsync) {
        return { success: false, message: 'Rewrite this as an async function (or async arrow function).' }
      }
      const awaitCount = (code.match(/\bawait\b/g) || []).length
      if (awaitCount < 2) {
        return { success: false, message: 'You need two awaits: one for the fetch call, one for parsing the JSON response.' }
      }
      return { success: true, message: 'Clean, readable, and it actually returns the data now — no dangling .then() required.' }
    },
  },

  {
    id: 'wd-07-es6-debug',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'A File Full of ES6 Mistakes',
    prompt: 'This file has three broken ES6 features: an arrow function that forgets to return anything, a destructure that treats an array like an object, and a spread merge missing its brackets. Fix all three.',
    starter: `const double = (x) => {
  x * 2
}

const user = ['Nova', 29]
const { name, age } = user

const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]
const merged = ...arr1, ...arr2
`,
    runLabel: 'Run Script',
    simulate(code) {
      const fixedDouble = /const\s+double\s*=\s*\(x\)\s*=>\s*x\s*\*\s*2/.test(code) ||
        /const\s+double\s*=\s*\(x\)\s*=>\s*\{[^}]*return\s+x\s*\*\s*2/.test(code)
      const fixedDestructure = /const\s*\[\s*name\s*,\s*age\s*\]\s*=\s*user/.test(code)
      const fixedSpread = /const\s+merged\s*=\s*\[\s*\.\.\.arr1\s*,\s*\.\.\.arr2\s*\]/.test(code)
      const ok = fixedDouble && fixedDestructure && fixedSpread
      return ok
        ? 'double(4) → 8\nname → "Nova", age → 29\nmerged → [1, 2, 3, 4, 5, 6]'
        : 'SyntaxError or undefined values — one or more of these still doesn\'t behave as written.'
    },
    hints: [
      'An arrow function with a { } body doesn\'t return anything unless you say return — or you can drop the braces for an implicit return.',
      'user is an array, not an object — [name, age] destructures it by position, not by property name.',
      'const double = (x) => x * 2\nconst [name, age] = user\nconst merged = [...arr1, ...arr2]',
    ],
    xp: 80,
    tool: { name: 'ES6 syntax', icon: '🐛', description: 'Arrow function returns, array vs. object destructuring, and spread syntax — small syntax slips, big silent bugs.', fun: 4 },
    check({ code }) {
      const fixedDouble = /const\s+double\s*=\s*\(x\)\s*=>\s*x\s*\*\s*2/.test(code) ||
        /const\s+double\s*=\s*\(x\)\s*=>\s*\{[^}]*return\s+x\s*\*\s*2/.test(code)
      if (!fixedDouble) {
        return { success: false, message: 'double still doesn\'t return anything — add a return, or drop the braces for an implicit return.' }
      }
      const fixedDestructure = /const\s*\[\s*name\s*,\s*age\s*\]\s*=\s*user/.test(code)
      if (!fixedDestructure) {
        return { success: false, message: 'user is an array — destructure it with [name, age], not { name, age }.' }
      }
      const fixedSpread = /const\s+merged\s*=\s*\[\s*\.\.\.arr1\s*,\s*\.\.\.arr2\s*\]/.test(code)
      if (!fixedSpread) {
        return { success: false, message: 'The spread merge needs brackets around it: [...arr1, ...arr2].' }
      }
      return { success: true, message: 'All three fixed. Small syntax slips, and they would\'ve broken production silently.' }
    },
  },

  {
    id: 'wd-08-http-lifecycle',
    kind: 'sequence',
    npc: 'API Andy',
    title: "A Request's Full Lifecycle",
    prompt: 'Order the journey of a single HTTP request, from the moment the client sends it to the moment it gets a response.',
    items: [
      { id: 'get', label: 'Client sends a GET request' },
      { id: 'route', label: 'Server routes it to the right handler' },
      { id: 'query', label: 'Server queries the database' },
      { id: 'response', label: 'Server returns a 200 response with JSON' },
    ],
    correctOrder: ['get', 'route', 'query', 'response'],
    successMessage: 'Request in, routed, queried, answered. That\'s every API call, every time.',
    hints: [
      'Nothing happens on the server until a request actually arrives.',
      'The server has to know which handler to run before that handler can touch the database.',
      'Client sends a GET request → Server routes it to the right handler → Server queries the database → Server returns a 200 response with JSON',
    ],
    xp: 45,
    tool: { name: 'HTTP request lifecycle', icon: '🔁', description: 'Request → routing → data lookup → response — the shape of nearly every API call.', fun: 3 },
  },

  {
    id: 'wd-09-graphql-vs-rest',
    kind: 'sequence',
    npc: 'API Andy',
    title: 'Asking for Exactly What You Need',
    prompt: 'Order why GraphQL avoids the over-fetching problem that plain REST endpoints often have.',
    items: [
      { id: 'query', label: 'Client sends a query naming only the fields it needs' },
      { id: 'resolve', label: 'Server resolves only those specific fields' },
      { id: 'respond', label: 'A single response comes back with no extra unused data' },
    ],
    correctOrder: ['query', 'resolve', 'respond'],
    successMessage: 'Ask for exactly what you need, get exactly that back. No more, no less.',
    hints: [
      'GraphQL starts with the client describing its own data shape, not the server dictating one.',
      'The server only resolves the fields actually named in the query — nothing extra.',
      'Client sends a query naming only the fields it needs → Server resolves only those specific fields → A single response comes back with no extra unused data',
    ],
    xp: 50,
    tool: { name: 'GraphQL', icon: '🕸️', description: 'The client shapes the query, so responses contain exactly the fields asked for — no over-fetching.', fun: 4 },
  },

  {
    id: 'wd-10-closures-counter',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'State Without a Framework',
    prompt: 'Write createCounter() using a closure — no global variables. It should return an object with increment() (bumps an internal count) and getValue() (returns the current count).',
    starter: '// write createCounter() here, using a closure to hold the count\n',
    runLabel: 'Run Script',
    simulate(code) {
      const hasFn = /function\s+createCounter/.test(code) || /const\s+createCounter\s*=/.test(code)
      const returnIdx = code.search(/return\s*\{/)
      const afterReturn = returnIdx === -1 ? '' : code.slice(returnIdx)
      const ok = hasFn && /increment/.test(afterReturn) && /getValue/.test(afterReturn)
      return ok
        ? 'const c = createCounter()\nc.increment(); c.increment();\nc.getValue() → 2'
        : 'createCounter() does not expose the expected increment/getValue interface.'
    },
    hints: [
      'A closure lets an inner function remember a variable from its outer scope even after the outer function returns.',
      'Keep a local `count` variable inside createCounter, and return an object exposing increment and getValue as methods.',
      "function createCounter() {\n  let count = 0;\n  return {\n    increment() { count++; },\n    getValue() { return count; },\n  };\n}",
    ],
    xp: 80,
    tool: { name: 'Closures', icon: '🔒', description: 'A closure keeps private state alive in memory without a single global variable.', fun: 4 },
    check({ code }) {
      const hasFn = /function\s+createCounter/.test(code) || /const\s+createCounter\s*=/.test(code)
      if (!hasFn) {
        return { success: false, message: 'Define createCounter as a function (or const createCounter = ...).' }
      }
      const returnIdx = code.search(/return\s*\{/)
      const afterReturn = returnIdx === -1 ? '' : code.slice(returnIdx)
      if (!afterReturn || !/increment/.test(afterReturn) || !/getValue/.test(afterReturn)) {
        return { success: false, message: 'createCounter needs to return an object exposing both increment and getValue.' }
      }
      return { success: true, message: 'Private state, no globals. The closure remembers the count all on its own.' }
    },
  },

  {
    id: 'wd-11-debounce',
    kind: 'code',
    language: 'javascript',
    npc: 'JS Jack',
    title: 'Stop Firing on Every Keystroke',
    prompt: 'Write debounce(fn, delay) — it returns a new function that only actually calls fn after delay milliseconds have passed without being called again. Use setTimeout and clearTimeout.',
    starter: '// write debounce(fn, delay) here\n',
    runLabel: 'Run Script',
    simulate(code) {
      const ok = /setTimeout/.test(code) && /clearTimeout/.test(code) &&
        (/function\s+debounce/.test(code) || /const\s+debounce\s*=/.test(code))
      return ok
        ? 'Typed "hello" fast → search fired once, 300ms after the last keystroke.'
        : 'Typed "hello" fast → search fired 5 times, once per keystroke.'
    },
    hints: [
      'Every call needs to cancel the previous pending timer before starting a new one — that\'s what clearTimeout is for.',
      'Store the timer id in a variable the returned function can see via closure, and clear it on every new call.',
      "function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}",
    ],
    xp: 85,
    tool: { name: 'Debounce', icon: '⏱️', description: 'clearTimeout + setTimeout together delay a function until the caller actually stops calling it.', fun: 4 },
    check({ code }) {
      const hasFn = /function\s+debounce/.test(code) || /const\s+debounce\s*=/.test(code)
      if (!hasFn) {
        return { success: false, message: 'Define debounce as a function (or const debounce = ...) that returns a new function.' }
      }
      if (!/setTimeout/.test(code) || !/clearTimeout/.test(code)) {
        return { success: false, message: 'You need both setTimeout (to delay the call) and clearTimeout (to cancel the previous pending one).' }
      }
      return { success: true, message: 'One call, 300ms after the typing stops — not five calls for five keystrokes.' }
    },
  },

  {
    id: 'wd-12-perf-checklist',
    kind: 'sequence',
    npc: 'Creative Director Pixel',
    title: 'Fixing a 45/100 Lighthouse Score',
    prompt: 'Order this web performance fix checklist for a page that scores 45/100 on Lighthouse.',
    items: [
      { id: 'lazy', label: 'Add lazy loading to images' },
      { id: 'split', label: 'Split the JavaScript bundle so pages load only what they need' },
      { id: 'defer', label: 'Defer non-critical scripts' },
      { id: 'alt', label: 'Add alt text to every image' },
    ],
    correctOrder: ['lazy', 'split', 'defer', 'alt'],
    successMessage: 'Lighter images, smaller bundles, scripts out of the critical path, and accessible to boot.',
    hints: [
      'There\'s no strict dependency between these — but the biggest load-time wins (images, bundle size) tend to get tackled before script scheduling and accessibility polish.',
      'Images and bundle size are usually the heaviest cost on a page, so they come first.',
      'Add lazy loading to images → Split the JavaScript bundle → Defer non-critical scripts → Add alt text to every image',
    ],
    xp: 55,
    tool: { name: 'Web performance checklist', icon: '🚀', description: 'Lazy loading, code splitting, deferred scripts, and accessible images — the standard Lighthouse fix list.', fun: 3 },
  },

  {
    id: 'wd-13-auth-flow',
    kind: 'sequence',
    npc: 'API Andy',
    title: 'Logging In, Securely',
    prompt: 'Order a secure login flow, from the moment a user submits the form to every request afterward.',
    items: [
      { id: 'submit', label: 'User submits the login form' },
      { id: 'post', label: 'Credentials POST to the server' },
      { id: 'jwt', label: 'Server returns a JWT' },
      { id: 'cookie', label: 'Token is stored in an httpOnly cookie' },
      { id: 'send', label: 'Token is sent automatically on every future request' },
    ],
    correctOrder: ['submit', 'post', 'jwt', 'cookie', 'send'],
    successMessage: 'Credentials in once, a token stored where JavaScript can\'t touch it, sent automatically from then on.',
    hints: [
      'The server can\'t issue a token before it has received and verified credentials.',
      'An httpOnly cookie can\'t be read by JavaScript — that\'s exactly why it\'s safer than storing the token in localStorage.',
      'User submits the login form → Credentials POST to the server → Server returns a JWT → Token is stored in an httpOnly cookie → Token is sent automatically on every future request',
    ],
    xp: 60,
    tool: { name: 'JWT auth flow', icon: '🔑', description: 'A JWT in an httpOnly cookie: issued once, sent automatically, never touchable by JavaScript.', fun: 4 },
  },

  {
    id: 'wd-14-final-boss',
    kind: 'code',
    language: 'javascript',
    npc: 'Creative Director Pixel',
    title: 'One Script, Everything Together',
    prompt: 'Write loadUserProfile(userId): an async function that fetches from `/api/users/${userId}`, checks res.ok and throws an error if the request failed, parses the JSON body, and returns it — async/await, error handling, and fetch, all in one function.',
    starter: 'async function loadUserProfile(userId) {\n  // TODO: fetch the user, handle a failed response, and return the parsed data\n}\n',
    runLabel: 'Run Script',
    simulate(code) {
      const hasAsyncFn = /async\s+function\s+loadUserProfile/.test(code) || /const\s+loadUserProfile\s*=\s*async/.test(code)
      const hasFetch = /fetch\(/.test(code)
      const hasAwait = /\bawait\b/.test(code)
      const hasErrorCheck = /throw/.test(code) || /\.ok\b/.test(code)
      const ok = hasAsyncFn && hasFetch && hasAwait && hasErrorCheck
      return ok
        ? 'loadUserProfile(42) → GET /api/users/42 → 200 OK → { id: 42, name: "Nova" }'
        : 'loadUserProfile(42) → request sent, but errors or the response body aren\'t handled correctly.'
    },
    hints: [
      'This combines everything from the Workshop: async/await for the fetch, a check on res.ok before trusting the body, and returning the parsed JSON.',
      'A failed fetch doesn\'t throw on its own — you have to check res.ok and throw an Error yourself if it\'s false.',
      'async function loadUserProfile(userId) {\n  const res = await fetch(`/api/users/${userId}`);\n  if (!res.ok) throw new Error(\'Failed to load user\');\n  const data = await res.json();\n  return data;\n}',
    ],
    xp: 220,
    tool: { name: 'Full Stack Builder', icon: '🌐', description: 'async/await, error handling, and the fetch API, combined into one production-ready function.', fun: 5 },
    check({ code }) {
      const hasAsyncFn = /async\s+function\s+loadUserProfile/.test(code) || /const\s+loadUserProfile\s*=\s*async/.test(code)
      if (!hasAsyncFn) {
        return { success: false, message: 'loadUserProfile needs to be an async function (or async arrow function assigned to that name).' }
      }
      if (!/fetch\(/.test(code)) {
        return { success: false, message: 'Still no fetch( ) call — this needs to actually request /api/users/{userId}.' }
      }
      if (!/\bawait\b/.test(code)) {
        return { success: false, message: 'Use await on the fetch call (and on parsing the JSON body).' }
      }
      if (!/throw/.test(code) && !/\.ok\b/.test(code)) {
        return { success: false, message: 'Check res.ok and throw an error if the request failed — don\'t assume every response succeeded.' }
      }
      return { success: true, message: 'Fetch, error handling, and async/await, all working together. This is production-ready.' }
    },
  },
]

export const WEB_DEV_WORKSHOP_ZONE = {
  id: 'web-dev-workshop',
  name: 'Web Dev Workshop',
  palette: { bg: '#fef3c7', ground: 0xfde68a, groundAccent: 0xfbbf24 },
  decor: { kind: 'studio' },
  npcIntro: {
    name: 'Creative Director Pixel',
    lines: [
      "Welcome to the Web Dev Workshop, Ziro.",
      "Every interface on Tech Planet gets built here — but our codebase hasn't been touched since 2005. Non-semantic HTML, no CSS organization, broken JavaScript, and no build tooling to speak of.",
      "A webpage is just instructions for a browser — what to show, how to arrange it, how to react when someone clicks. When those instructions are sloppy, the browser still tries its best, which is exactly why this place looks like it's held together with tape: everything technically runs, it just barely works.",
      "Pages are slow, layouts break on phones, and half our scripts don't even run correctly anymore.",
      "Help us modernize the Workshop — semantic markup, real layouts, working JavaScript, APIs, performance, and security. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Creative Director Pixel', color: 0xf59e0b, role: 'main' },
    { x: 2020, y: 560, name: 'CSS Cassandra', color: 0xec4899, flavor: 'A layout shouldn\'t be a fight. Flexbox and Grid exist so you never have to guess.' },
    { x: 260, y: 860, name: 'JS Jack', color: 0xfacc15, flavor: 'Half these scripts are one missing keyword away from working. Let\'s track them down.' },
    { x: 2020, y: 1160, name: 'API Andy', color: 0x60a5fa, flavor: 'REST, GraphQL, auth — every interface here talks to a server somehow. Let\'s get the requests right.' },
  ],
  challenges: WEB_DEV_WORKSHOP_CHALLENGES,
  nextZone: 'security-stronghold',
}
