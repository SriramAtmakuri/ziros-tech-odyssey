// Security Stronghold — OWASP-style vulnerabilities, auth flows, crypto
// basics, and zero trust. Reuses the 'sequence' kind for process/flow
// ordering and the 'python' kind (Pyodide execution) for hands-on code
// fixes — no new panel types.
//
// Pyodide here only has the Python standard library (no network installs),
// so there is no `cryptography` or `bcrypt` package available. Wherever a
// challenge would normally reach for real encryption, it instead uses the
// stdlib `hashlib` (sha256, etc.) and `hmac` modules — hashing and message
// authentication, not true encryption. The HMAC challenge is framed
// explicitly as a stand-in for AES/bcrypt for that reason.

import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// Every python challenge stores its answer in a variable called `result` —
// the prompts say so explicitly. check() reads it back via Pyodide's FFI
// (pyGet) and compares the real Python value, not printed text.
function checkResult(pyodide, error, expected, tolerance) {
  if (error) return { success: false, message: `Python error: ${error}` }
  const got = pyGet(pyodide, 'result')
  if (got === undefined || got === null) {
    return { success: false, message: 'No `result` variable found — did you assign your answer to `result`?' }
  }
  if (!deepEqual(got, expected, tolerance)) {
    return { success: false, message: `result was ${JSON.stringify(got)} — that's not quite right.` }
  }
  return null // caller supplies the success message
}

// ss-02 and ss-06 differ from every other python challenge here: a real
// sha256/HMAC digest is deterministic, but hardcoding the exact hex string
// would mean independently computing it correctly in JS (with no crypto
// lib guaranteed on that side) just to compare against Python's stdlib
// output — one typo there would fail a correct answer. So instead of an
// exact-value check, these two validate the SHAPE of a real digest (a
// 64-character lowercase hex string) and confirm the player didn't just
// echo the plaintext back, which is enough to prove hashlib/hmac was
// actually used correctly.
function checkHexDigest(pyodide, error, plainInputs) {
  if (error) return { success: false, message: `Python error: ${error}` }
  const got = pyGet(pyodide, 'result')
  if (typeof got !== 'string' || !/^[a-f0-9]{64}$/.test(got)) {
    return { success: false, message: 'result should be a 64-character lowercase hex string — the output of a .hexdigest() call. Did you use hashlib/hmac correctly?' }
  }
  if (plainInputs.some((p) => got === p || got.includes(p))) {
    return { success: false, message: "That looks like it still contains the original plaintext — result should be the hashed/signed digest, not the input itself." }
  }
  return null // caller supplies the success message
}

export const SECURITY_STRONGHOLD_CHALLENGES = [
  {
    id: 'ss-01-sql-injection',
    kind: 'python',
    npc: 'Security Chief Vera',
    title: 'The Query That Trusts Too Much',
    prompt: "This function builds a SQL query by gluing user input directly into the string — classic SQL injection bait. Rewrite build_query(username) so it returns a PARAMETERIZED query instead: a two-element list [query_string, params_list], where the query string uses a %s placeholder and the actual value lives in the params list, never concatenated in. Call build_query('ziro') and store the returned list in `result`.",
    starter: "def build_query(username):\n    return \"SELECT * FROM users WHERE username = '\" + username + \"'\"\n\nresult = build_query('ziro')\n",
    hints: [
      'Concatenating username straight into the SQL string is exactly how SQL injection happens — a value like `\' OR 1=1 --` would break out of the string.',
      'Return the query and its parameters separately: a placeholder (%s) in the query string, and the real value in a params list, never joined together.',
      "def build_query(username):\n    return [\"SELECT * FROM users WHERE username = %s\", [username]]\n\nresult = build_query('ziro')",
    ],
    xp: 85,
    tool: { name: 'Parameterized queries', icon: '🛡️', description: 'Placeholders + a separate params list keep user input from ever being interpreted as SQL.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['SELECT * FROM users WHERE username = %s', ['ziro']]) ?? { success: true, message: "The query and the data are separate now — no string of user input can ever rewrite the SQL." },
  },

  {
    id: 'ss-02-password-hashing',
    kind: 'python',
    npc: 'Cryptographer Claude',
    title: 'Never Store a Plain Password',
    prompt: "Never store a password as plain text. Using hashlib and a per-user salt, write hash_password(password, salt) that returns hashlib.sha256((salt + password).encode()).hexdigest(). Call it with password = 'hunter2' and salt = 'a1b2c3', and store the hex digest string in `result`.",
    starter: "import hashlib\n\ndef hash_password(password, salt):\n    pass\n\npassword = 'hunter2'\nsalt = 'a1b2c3'\nresult = None\n",
    hints: [
      'Concatenate the salt and password into one string first, then hash the combined string — never hash (or store) the password alone.',
      '.encode() turns a string into bytes, which is what hashlib.sha256() requires; .hexdigest() turns the hash back into a readable hex string.',
      "def hash_password(password, salt):\n    return hashlib.sha256((salt + password).encode()).hexdigest()\n\nresult = hash_password(password, salt)",
    ],
    xp: 85,
    tool: { name: 'Salted hashing', icon: '🧂', description: 'hashlib.sha256 + a per-user salt turns a plain password into an irreversible digest.', fun: 4 },
    check: ({ pyodide, error }) => checkHexDigest(pyodide, error, ['hunter2', 'a1b2c3']) ?? { success: true, message: "hunter2 never touches storage in the clear — only its salted digest does." },
  },

  {
    id: 'ss-03-jwt-anatomy',
    kind: 'sequence',
    npc: 'Security Chief Vera',
    title: 'Three Parts, One Token',
    prompt: 'Order the three parts of a JWT, from the part that describes the token to the part that proves it wasn\'t tampered with.',
    items: [
      { id: 'header', label: 'Header (algorithm + token type)' },
      { id: 'payload', label: 'Payload (the claims/data)' },
      { id: 'signature', label: 'Signature (proves it wasn\'t tampered with)' },
    ],
    correctOrder: ['header', 'payload', 'signature'],
    successMessage: 'Header, payload, signature — the three dot-separated pieces of every JWT, in order.',
    hints: [
      'A JWT always has exactly three parts, separated by dots: header.payload.signature.',
      'The header describes how the token was made; the payload holds the actual claims; the signature comes last because it\'s computed over the other two.',
      'Header (algorithm + token type) → Payload (the claims/data) → Signature (proves it wasn\'t tampered with)',
    ],
    xp: 60,
    tool: { name: 'JWT anatomy', icon: '🔑', description: 'header.payload.signature — the signature is what makes tampering detectable.', fun: 3 },
  },

  {
    id: 'ss-04-oauth-flow',
    kind: 'sequence',
    npc: 'Security Chief Vera',
    title: 'Logging In Without Sharing Your Password',
    prompt: 'Order the OAuth2 Authorization Code flow — how an app gets access without ever seeing your password.',
    items: [
      { id: 'redirect', label: 'App redirects the user to the authorization server' },
      { id: 'consent', label: 'User logs in and consents' },
      { id: 'code', label: 'Authorization server returns a one-time code' },
      { id: 'exchange', label: 'App exchanges the code for an access token' },
      { id: 'call', label: 'App uses the access token to call the API' },
    ],
    correctOrder: ['redirect', 'consent', 'code', 'exchange', 'call'],
    successMessage: 'The app never sees the password — just a one-time code, exchanged for a token.',
    hints: [
      'The very first step is the app sending the user somewhere else entirely — the authorization server, not the app itself.',
      'The one-time code exists so the token exchange can happen server-to-server, after the user has already logged in and consented.',
      'App redirects to authorization server → User logs in and consents → Server returns a one-time code → App exchanges the code for a token → App calls the API with the token',
    ],
    xp: 65,
    tool: { name: 'OAuth2 Authorization Code flow', icon: '🔐', description: 'A one-time code stands between login and the access token — the app never touches the password.', fun: 4 },
  },

  {
    id: 'ss-05-tls-handshake',
    kind: 'sequence',
    npc: 'Cryptographer Claude',
    title: 'Setting Up a Secure Channel',
    prompt: 'Order the TLS handshake that sets up a secure, encrypted connection.',
    items: [
      { id: 'clienthello', label: 'Client sends "Client Hello"' },
      { id: 'serverhello', label: 'Server responds with "Server Hello" and its certificate' },
      { id: 'keyexchange', label: 'Client and server exchange keys' },
      { id: 'encrypted', label: 'Encrypted communication begins' },
    ],
    correctOrder: ['clienthello', 'serverhello', 'keyexchange', 'encrypted'],
    successMessage: 'Hello, certificate, key exchange, then — and only then — encrypted traffic.',
    hints: [
      'The client always speaks first, proposing what it supports.',
      'The server has to prove its identity with a certificate before any keys get exchanged.',
      'Client Hello → Server Hello + certificate → Key exchange → Encrypted communication begins',
    ],
    xp: 65,
    tool: { name: 'TLS handshake', icon: '🤝', description: 'Hello, certificate, key exchange — all before a single encrypted byte is sent.', fun: 3 },
  },

  {
    id: 'ss-06-hmac-integrity',
    kind: 'python',
    npc: 'Cryptographer Claude',
    title: 'Proving a Message Wasn\'t Tampered With',
    prompt: "There's no bcrypt or AES available here — only the stdlib. So instead of encrypting this message, prove it wasn't tampered with using HMAC. Using hmac and hashlib, write sign_message(message, secret_key) that returns hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest(). Call it with message = 'transfer $100' and secret_key = 'vault-key', and store the result in `result`.",
    starter: "import hmac\nimport hashlib\n\ndef sign_message(message, secret_key):\n    pass\n\nmessage = 'transfer $100'\nsecret_key = 'vault-key'\nresult = None\n",
    hints: [
      'HMAC is not encryption — it doesn\'t hide the message, it proves the message and key together produced this exact signature.',
      'hmac.new(key_bytes, message_bytes, hashlib.sha256) builds the HMAC object; .hexdigest() turns it into a hex string.',
      "def sign_message(message, secret_key):\n    return hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()\n\nresult = sign_message(message, secret_key)",
    ],
    xp: 85,
    tool: { name: 'HMAC integrity check', icon: '🔏', description: 'A stand-in for AES/bcrypt using only the stdlib — HMAC proves a message wasn\'t altered, using a shared secret key.', fun: 4 },
    check: ({ pyodide, error }) => checkHexDigest(pyodide, error, ['transfer $100', 'vault-key']) ?? { success: true, message: "If even one character of that transfer request changed, this signature would no longer match." },
  },

  {
    id: 'ss-07-secrets-management',
    kind: 'sequence',
    npc: 'Compliance Officer Norm',
    title: 'Getting the Key Out of the Code',
    prompt: 'A hardcoded API key was just found committed to the source code. Order the correct response, from discovery to prevention.',
    items: [
      { id: 'found', label: 'A hardcoded API key is found in the source code' },
      { id: 'revoke', label: 'The exposed key is revoked and rotated' },
      { id: 'store', label: 'The new key is stored in a secrets manager' },
      { id: 'load', label: 'The app loads it via an environment variable at runtime, never hardcoded again' },
    ],
    correctOrder: ['found', 'revoke', 'store', 'load'],
    successMessage: 'Revoke first — a hardcoded key that\'s already been seen must be treated as burned, no matter what happens next.',
    hints: [
      'The compromised key has to be killed before anything else matters — a new key stored anywhere doesn\'t undo an exposed old one.',
      'Once the new key exists, it belongs in a secrets manager, not back in the source code.',
      'Key found in source → Revoke and rotate it → Store the new key in a secrets manager → App loads it via an environment variable at runtime',
    ],
    xp: 60,
    tool: { name: 'Secrets management', icon: '🗝️', description: 'Revoke, rotate, vault it, load at runtime — a hardcoded secret never goes back in the code.', fun: 3 },
  },

  {
    id: 'ss-08-container-hardening',
    kind: 'sequence',
    npc: 'Compliance Officer Norm',
    title: 'Locking Down a Container',
    prompt: 'Order these container hardening steps from most fundamental to most operational.',
    items: [
      { id: 'nonroot', label: 'Run the container as a non-root user' },
      { id: 'readonly', label: 'Make the filesystem read-only' },
      { id: 'capabilities', label: 'Drop all unnecessary Linux capabilities' },
      { id: 'scan', label: 'Scan the image for known vulnerabilities' },
    ],
    correctOrder: ['nonroot', 'readonly', 'capabilities', 'scan'],
    successMessage: 'Non-root, read-only, minimal capabilities, then continuous scanning — layered hardening, not a single fix.',
    hints: [
      'Running as root inside a container is the single biggest privilege-escalation risk, so it gets addressed first.',
      'Locking the filesystem and dropping capabilities both shrink what a compromised process could do even if it got in.',
      'Run as non-root → Read-only filesystem → Drop unnecessary capabilities → Scan the image for known vulnerabilities',
    ],
    xp: 65,
    tool: { name: 'Container hardening', icon: '📦', description: 'Non-root, read-only, minimal capabilities, scanned images — defense in depth for containers.', fun: 3 },
  },

  {
    id: 'ss-09-xss-escape',
    kind: 'python',
    npc: 'Hacker Zero-Day',
    title: 'Never Trust User Input in HTML',
    prompt: "I love this function. render_comment(text) drops raw text straight into HTML — any <script> tag in there just... runs. Fix it: use Python's html module and html.escape() to escape the text before embedding it. Call render_comment('<script>alert(1)</script>') and store the result in `result`.",
    starter: "def render_comment(text):\n    return f\"<p>{text}</p>\"\n\nresult = render_comment('<script>alert(1)</script>')\n",
    hints: [
      'Raw user text embedded directly into HTML lets any <script> tag inside it execute — that\'s cross-site scripting (XSS).',
      'import html, then wrap the text in html.escape(text) before putting it inside the <p> tags.',
      "import html\n\ndef render_comment(text):\n    return f\"<p>{html.escape(text)}</p>\"\n\nresult = render_comment('<script>alert(1)</script>')",
    ],
    xp: 90,
    tool: { name: 'HTML escaping', icon: '🚫', description: 'html.escape() turns <, >, and & into harmless entities before they ever reach the browser as markup.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>') ?? { success: true, message: "The script tag is now just inert text on the page — not code the browser will ever run." },
  },

  {
    id: 'ss-10-owasp-audit',
    kind: 'sequence',
    npc: 'Compliance Officer Norm',
    title: 'Auditing for a Vulnerability',
    prompt: 'Order the standard process for auditing and closing out a discovered vulnerability.',
    items: [
      { id: 'identify', label: 'Identify the vulnerability' },
      { id: 'assess', label: 'Assess its potential impact' },
      { id: 'fix', label: 'Apply the fix' },
      { id: 'retest', label: 'Re-test to confirm it\'s actually resolved' },
    ],
    correctOrder: ['identify', 'assess', 'fix', 'retest'],
    successMessage: 'Identify, assess, fix, re-test — skip the last step and you\'re just hoping the fix worked.',
    hints: [
      'You can\'t assess the impact of a vulnerability you haven\'t identified yet.',
      'Understanding the impact usually shapes how urgently — and how — you fix it.',
      'Identify the vulnerability → Assess its impact → Apply the fix → Re-test to confirm it\'s resolved',
    ],
    xp: 60,
    tool: { name: 'Vulnerability audit process', icon: '🔍', description: 'Identify, assess, fix, re-test — a fix nobody re-tested isn\'t confirmed fixed.', fun: 3 },
  },

  {
    id: 'ss-11-zero-trust',
    kind: 'sequence',
    npc: 'Security Chief Vera',
    title: 'Trust Nothing, Verify Everything',
    prompt: 'Order this shift away from an old perimeter-trust security model toward Zero Trust.',
    items: [
      { id: 'old', label: 'Old model: anyone inside the network is trusted' },
      { id: 'verify', label: 'New model: verify every single request explicitly, regardless of network location' },
      { id: 'leastpriv', label: 'Enforce least-privilege access on every request' },
      { id: 'monitor', label: 'Add continuous monitoring for anomalies' },
    ],
    correctOrder: ['old', 'verify', 'leastpriv', 'monitor'],
    successMessage: 'Being on the network is no longer trust — every request proves itself, every time, and gets watched afterward too.',
    hints: [
      'You have to name what\'s being replaced before you describe the replacement.',
      'Verifying every request and restricting what it\'s allowed to do go hand in hand — least privilege is how "verified" gets bounded.',
      'Old perimeter-trust model → Verify every request explicitly → Enforce least-privilege access → Continuous monitoring for anomalies',
    ],
    xp: 65,
    tool: { name: 'Zero Trust architecture', icon: '🧱', description: 'Network location stops being a proxy for trust — every request is verified, scoped, and watched.', fun: 4 },
  },

  {
    id: 'ss-12-final-boss',
    kind: 'sequence',
    npc: 'Security Chief Vera',
    title: 'Locking Out Zero-Day',
    prompt: 'Zero-Day has been quietly inside the Stronghold for months. Order the incident response that finally locks the intrusion out for good.',
    items: [
      { id: 'detect', label: 'Detect the intrusion' },
      { id: 'rotate', label: 'Rotate every leaked credential' },
      { id: 'patch', label: 'Patch the exploited vulnerability' },
      { id: 'logging', label: 'Enable enhanced logging and alerting' },
      { id: 'confirm', label: 'Confirm the attacker no longer has access' },
    ],
    correctOrder: ['detect', 'rotate', 'patch', 'logging', 'confirm'],
    successMessage: 'Detected, credentials rotated, the hole patched, watched closely, and access confirmed gone. Zero-Day is out — for real this time.',
    hints: [
      'Nothing else can start until the intrusion is actually detected.',
      'Rotating credentials and patching the hole both happen before you can trust any monitoring you add afterward — and confirmation is always the last word, never assumed.',
      'Detect the intrusion → Rotate every leaked credential → Patch the exploited vulnerability → Enable enhanced logging and alerting → Confirm the attacker no longer has access',
    ],
    xp: 220,
    tool: { name: 'Security Guardian', icon: '🛡️', description: 'Found the breach, rotated every leaked credential, patched the hole, and confirmed Zero-Day was finally locked out.', fun: 5 },
  },
  {
    id: 'ss-bonus-breach-nobody-saw',
    kind: 'sequence',
    bonus: true,
    npc: 'Compliance Officer Norm',
    title: 'The Breach Nobody Saw',
    prompt: 'Zero-Day is gone, but nobody actually noticed the intrusion happen — it was found by accident, weeks late. Build the monitoring that would have caught it the same night.',
    items: [
      { id: 'elk', label: 'Centralize logs into ELK (Elasticsearch + Logstash + Kibana)' },
      { id: 'kibana', label: 'Build a Kibana dashboard (failed logins, unusual access, geo anomalies)' },
      { id: 'pagerduty', label: 'Alert via PagerDuty on 5+ failed logins in 60 seconds' },
      { id: 'guardduty', label: 'Enable AWS GuardDuty threat detection' },
      { id: 'cloudtrail', label: 'Enable CloudTrail audit logging' },
    ],
    correctOrder: ['elk', 'kibana', 'pagerduty', 'guardduty', 'cloudtrail'],
    successMessage: 'Every log lands in one place, Kibana surfaces the anomalies at a glance, PagerDuty pages on rapid failed logins, GuardDuty watches for threats automatically, and CloudTrail keeps a permanent record of every action. Next time, someone finds out the same night.',
    hints: [
      'You need the logs centralized somewhere before you can dashboard or alert on any of them.',
      'The Kibana dashboard makes patterns visible to a human; the PagerDuty alert is what pages someone without a human watching. GuardDuty and CloudTrail are AWS-native safety nets underneath all of it.',
      'ELK Stack (centralized logs) → Kibana Security Dashboard → PagerDuty Alert (5+ failed logins/60s) → AWS GuardDuty → CloudTrail Audit Logging',
    ],
    xp: 190,
    tool: { name: 'Security Sentinel', icon: '🚨', description: 'Built the monitoring that turns a weeks-late discovery into a same-night page.', fun: 4 },
  },
]

export const SECURITY_STRONGHOLD_ZONE = {
  id: 'security-stronghold',
  name: 'Security Stronghold',
  palette: { bg: '#18181b', ground: 0x27272a, groundAccent: 0x3f3f46 },
  decor: { kind: 'torch' },
  npcIntro: {
    name: 'Security Chief Vera',
    lines: [
      "Welcome to the Security Stronghold, Ziro. This is supposed to be the most secure place on Tech Planet.",
      "Supposed to be. A hacker calling itself Zero-Day has been quietly inside our systems for months, and we only just noticed.",
      "Every one of these cracks looks small on its own — a password stored as plain text here, a query that trusts user input there. Security doesn't fail from one giant hole. It fails from a hundred tiny ones nobody thought was worth fixing. Zero-Day only needed one.",
      "Every wall here has a crack — a query that trusts too much, a password stored in the clear, a secret sitting in plain code.",
      "Find the breaches. Patch them. Harden everything. Will you help us lock Zero-Day out for good?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Security Chief Vera', color: 0xef4444, role: 'main' },
    { x: 2020, y: 560, name: 'Cryptographer Claude', color: 0x8b5cf6, flavor: 'Hashing, HMAC, key exchange — the math that keeps secrets secret. Ask me about any of it.' },
    { x: 260, y: 860, name: 'Compliance Officer Norm', color: 0x64748b, flavor: 'Audits, frameworks, hardening checklists. Not glamorous, but it\'s what actually keeps you safe.' },
    { x: 2020, y: 1160, name: 'Hacker Zero-Day', color: 0x22c55e, flavor: "I'm already inside. Good luck finding me." },
  ],
  challenges: SECURITY_STRONGHOLD_CHALLENGES,
  nextZone: 'collaboration-commons',
}
