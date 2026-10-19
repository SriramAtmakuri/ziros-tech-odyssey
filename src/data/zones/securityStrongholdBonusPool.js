import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// The bonus reserve pool for Security Stronghold — 2x its 13 real chest
// positions (12 "required" + the pre-existing bonus:true "Breach Nobody
// Saw" sequence, which is itself a normal swappable chest position under
// this feature, same as every other zone's own bonus:true chests). Once a
// chest is solved and the player moves past it via "Next", that chest's
// challenge gets replaced with one drawn from here (see gameStore.js's
// BONUS_POOLS registry / swapChallenge / getLiveChallenges), same mechanic
// as every other zone in this rollout. Pre-authored, never AI-generated
// at runtime.
//
// Same stdlib-only constraint as the main pool: no `cryptography`/`bcrypt`
// package is available in Pyodide, so real encryption is out of reach —
// hashing (hashlib), message authentication (hmac), and secure randomness
// (secrets) stand in wherever a challenge would normally reach for it.
//
// Split three ways:
//   - 10 hands-on (5x kind: 'python' — same checkResult/pyGet convention
//     the main pool uses; 5x kind: 'sequence') covering ground the main
//     13 don't: generating a cryptographically secure token with `secrets`
//     (vs. the predictable `random` module), a login-attempt rate limiter,
//     path-traversal prevention, constant-time comparison to defeat timing
//     attacks, and an authorization/IDOR ownership check; plus sequence
//     challenges for the CSRF-token flow, session-fixation prevention,
//     security-header rollout, a penetration test's lifecycle, and PKI
//     certificate issuance.
//   - 8 MCQ (kind: 'mcq') on security concepts with no single runnable
//     snippet of their own: MFA factor categories, what a CSRF token
//     actually proves, IDOR, SSRF, insecure deserialization, CVSS's
//     purpose, defense in depth, and least privilege.
//   - 8 matching (kind: 'matching') pairing terms across security response
//     headers, OWASP Top 10-style vulnerability classes, common attack
//     types, authentication factors, PKI vocabulary, access control
//     models, vulnerability-management vocabulary, and encryption
//     terminology.

function checkResult(pyodide, error, expected, tolerance) {
  if (error) return { success: false, message: `Python error: ${error}` }
  const got = pyGet(pyodide, 'result')
  if (got === undefined || got === null) {
    return { success: false, message: 'No `result` variable found — did you assign your answer to `result`?' }
  }
  if (!deepEqual(got, expected, tolerance)) {
    return { success: false, message: `result was ${JSON.stringify(got)} — that's not quite right.` }
  }
  return null
}

// A `secrets.token_hex(n)` result is a real random value every run, so it
// can't be compared against one fixed expected string — instead, verify
// its SHAPE (the right length, valid hex) which is enough to prove the
// secrets module was actually used correctly, the same reasoning the main
// pool's checkHexDigest already uses for HMAC/hash digests.
function checkHexLength(pyodide, error, expectedLength) {
  if (error) return { success: false, message: `Python error: ${error}` }
  const got = pyGet(pyodide, 'result')
  if (typeof got !== 'string' || !/^[a-f0-9]+$/.test(got)) {
    return { success: false, message: 'result should be a lowercase hex string — the output of secrets.token_hex().' }
  }
  if (got.length !== expectedLength) {
    return { success: false, message: `result is ${got.length} hex characters — expected exactly ${expectedLength}.` }
  }
  return null
}

export const SECURITY_STRONGHOLD_BONUS_POOL = [
  // ---------- hands-on: python / sequence ----------
  {
    id: 'ss-pool-01-secure-token',
    kind: 'python',
    npc: 'Cryptographer Claude',
    title: 'A Predictable "Random" Token',
    prompt: "generate_reset_token() uses Python's random module, which is fast but predictable — never safe for anything security-sensitive like a password-reset token. Rewrite it using the secrets module: return secrets.token_hex(16), which is cryptographically secure. Call generate_reset_token() and store the result in `result`.",
    starter: "import random\n\ndef generate_reset_token():\n    return ''.join(random.choice('0123456789abcdef') for _ in range(32))\n\nresult = generate_reset_token()\n",
    hints: [
      "Python's random module is a fast, deterministic PRNG — great for simulations, but an attacker who can guess or observe its internal state could predict future tokens.",
      'secrets.token_hex(n) draws from the OS\'s cryptographically secure random source and returns a hex string 2n characters long.',
      "import secrets\n\ndef generate_reset_token():\n    return secrets.token_hex(16)\n\nresult = generate_reset_token()",
    ],
    xp: 80,
    tool: { name: 'secrets module', icon: '🎲', description: 'secrets.token_hex() draws from a cryptographically secure random source — random.choice() is predictable and unsafe for tokens.', fun: 4 },
    check: ({ pyodide, error }) => checkHexLength(pyodide, error, 32) ?? { success: true, message: 'A real reset token now — unguessable, unlike anything random.choice() could ever produce.' },
  },
  {
    id: 'ss-pool-02-rate-limit-lockout',
    kind: 'python',
    npc: 'Security Chief Vera',
    title: 'Five Strikes, Then a Lockout',
    prompt: "attempts = [{'user': 'alice', 'success': False}, {'user': 'alice', 'success': False}, {'user': 'bob', 'success': True}, {'user': 'alice', 'success': False}, {'user': 'alice', 'success': False}, {'user': 'alice', 'success': False}]. Without rate limiting, an attacker can try unlimited passwords. Count each user's CONSECUTIVE failed attempts (resetting to 0 on any success) and store a list of usernames who have reached 5 or more consecutive failures in `result`.",
    starter: "attempts = [\n    {'user': 'alice', 'success': False},\n    {'user': 'alice', 'success': False},\n    {'user': 'bob', 'success': True},\n    {'user': 'alice', 'success': False},\n    {'user': 'alice', 'success': False},\n    {'user': 'alice', 'success': False},\n]\nresult = []\n",
    hints: [
      'Track a running failure count per username; a success resets that user\'s count back to 0.',
      'Walk the attempts in order, updating a dict of counts per user, and collect any user whose count reaches 5.',
      "counts = {}\nlocked = set()\nfor a in attempts:\n    if a['success']:\n        counts[a['user']] = 0\n    else:\n        counts[a['user']] = counts.get(a['user'], 0) + 1\n        if counts[a['user']] >= 5:\n            locked.add(a['user'])\nresult = list(locked)",
    ],
    xp: 75,
    tool: { name: 'Login rate limiting', icon: '🚧', description: "Locking an account after too many consecutive failures turns an unlimited password-guessing attack into a brief, self-defeating one.", fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['alice']) ?? { success: true, message: "alice is locked out after 5 failures in a row — bob's single success never even factors in." },
  },
  {
    id: 'ss-pool-03-path-traversal',
    kind: 'python',
    npc: 'Hacker Zero-Day',
    title: 'A Filename That Escapes Its Folder',
    prompt: "safe_path(base_dir, filename) is supposed to serve files only from base_dir, but it doesn't check anything — a filename like '../../etc/passwd' would escape the folder entirely. base_dir = '/app/uploads'. Using os.path.normpath and os.path.join, resolve the requested path and check whether it still starts with base_dir. Call safe_path('/app/uploads', '../../etc/passwd') and store the boolean (True if safe, False if it escapes) in `result`.",
    starter: "import os\n\ndef safe_path(base_dir, filename):\n    pass\n\nresult = safe_path('/app/uploads', '../../etc/passwd')\n",
    hints: [
      'os.path.join(base_dir, filename) builds the naive combined path; os.path.normpath collapses any \'..\' segments so you can see where it REALLY points.',
      'After normalizing, check whether the resolved path still starts with base_dir — if it doesn\'t, the filename escaped the intended folder.',
      "def safe_path(base_dir, filename):\n    resolved = os.path.normpath(os.path.join(base_dir, filename))\n    return resolved.startswith(base_dir)\n\nresult = safe_path('/app/uploads', '../../etc/passwd')",
    ],
    xp: 85,
    tool: { name: 'Path traversal prevention', icon: '📁', description: 'Normalizing a path and checking it still starts with the intended base directory catches \'../\' escapes before a file gets served.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, false) ?? { success: true, message: '\'../../etc/passwd\' resolves well outside /app/uploads — correctly flagged as unsafe, not served.' },
  },
  {
    id: 'ss-pool-04-constant-time-compare',
    kind: 'python',
    npc: 'Cryptographer Claude',
    title: 'A Comparison That Leaks Timing',
    prompt: "verify_token(input_token, real_token) currently does input_token == real_token — for security tokens, Python's == comparison exits on the first mismatched character, and that tiny timing difference can theoretically leak how many characters an attacker guessed correctly. Fix it using hmac.compare_digest(input_token, real_token), which always takes the same amount of time regardless of where the mismatch is. Call verify_token('abc123', 'abc999') and store the boolean result in `result`.",
    starter: "def verify_token(input_token, real_token):\n    return input_token == real_token\n\nresult = verify_token('abc123', 'abc999')\n",
    hints: [
      "hmac.compare_digest exists specifically to defeat timing attacks — it compares every character regardless of where the first difference is, so the time taken doesn't leak information.",
      'It\'s a drop-in replacement for ==, taking the same two arguments and returning the same True/False.',
      "import hmac\n\ndef verify_token(input_token, real_token):\n    return hmac.compare_digest(input_token, real_token)\n\nresult = verify_token('abc123', 'abc999')",
    ],
    xp: 85,
    tool: { name: 'Constant-time comparison', icon: '⏲️', description: 'hmac.compare_digest() takes the same time no matter where two strings differ — a plain == comparison can leak that information through timing.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, false) ?? { success: true, message: '\'abc123\' and \'abc999\' still don\'t match — but now the comparison itself can\'t be used to leak how close a guess was.' },
  },
  {
    id: 'ss-pool-05-idor-check',
    kind: 'python',
    npc: 'Security Chief Vera',
    title: 'Anyone\'s Invoice, Just by Changing a Number',
    prompt: "get_invoice(requested_user_id, invoice) fetches an invoice by ID with no ownership check at all — any logged-in user can view ANY invoice just by changing the URL's id parameter (an IDOR — Insecure Direct Object Reference). invoice = {'id': 42, 'owner_id': 7, 'total': 500}. Fix get_invoice so it only returns the invoice if invoice['owner_id'] == requested_user_id, otherwise returns None. Call get_invoice(99, invoice) (a different user trying to view user 7's invoice) and store the result in `result`.",
    starter: "invoice = {'id': 42, 'owner_id': 7, 'total': 500}\n\ndef get_invoice(requested_user_id, invoice):\n    return invoice\n\nresult = get_invoice(99, invoice)\n",
    hints: [
      "The bug is that this function returns the resource no matter WHO asked for it — it never checks that the requester actually owns it.",
      "Compare requested_user_id against invoice['owner_id'] — only return the invoice if they match, otherwise return None.",
      "def get_invoice(requested_user_id, invoice):\n    if invoice['owner_id'] == requested_user_id:\n        return invoice\n    return None\n\nresult = get_invoice(99, invoice)",
    ],
    xp: 90,
    tool: { name: 'Authorization / IDOR check', icon: '🔒', description: 'Checking that the requester actually owns a resource — not just that they\'re logged in at all — is what closes an IDOR vulnerability.', fun: 4 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      if (!pyodide.globals.has('result')) {
        return { success: false, message: 'No `result` variable found — did you assign your answer to `result`?' }
      }
      // Python None round-trips through Pyodide's globals.get() as JS
      // `undefined`, not `null` — so once `has('result')` confirms the
      // variable really was assigned, `undefined` here means it was
      // correctly set to None (exactly what this challenge expects).
      const got = pyGet(pyodide, 'result')
      if (got !== undefined) {
        return { success: false, message: `result was ${JSON.stringify(got)} — user 99 should get nothing back (None), not the invoice.` }
      }
      return { success: true, message: 'User 99 gets nothing back — owning a valid session is no longer enough to see someone else\'s invoice.' }
    },
  },
  {
    id: 'ss-pool-06-csrf-flow',
    kind: 'sequence',
    npc: 'Security Chief Vera',
    title: 'Proving a Request Really Came From Your Form',
    prompt: 'Order how a CSRF token protects a form submission from a forged cross-site request.',
    items: [
      { id: 'serve', label: 'Server embeds a unique, unpredictable CSRF token in the form' },
      { id: 'submit', label: 'User submits the form, sending the token back along with the data' },
      { id: 'compare', label: 'Server compares the submitted token against the one it issued' },
      { id: 'accept', label: 'Request is accepted only if the tokens match' },
    ],
    correctOrder: ['serve', 'submit', 'compare', 'accept'],
    successMessage: 'A malicious site can forge the request\'s cookies automatically, but it has no way to know the unpredictable token the real form was served — so the forged request never has a matching one.',
    hints: [
      'The token has to exist on the page before the user ever submits anything — the server hands it out first.',
      'A forged request from another site can carry the user\'s cookies automatically, but it can\'t know a token it was never shown.',
      'Server embeds a CSRF token in the form → User submits the form with the token → Server compares the submitted token to the issued one → Request accepted only if they match',
    ],
    xp: 60,
    tool: { name: 'CSRF token', icon: '🎫', description: 'An unpredictable per-form token that a forged cross-site request can\'t know — cookies alone aren\'t enough to prove a request is genuine.', fun: 3 },
  },
  {
    id: 'ss-pool-07-session-fixation',
    kind: 'sequence',
    npc: 'Hacker Zero-Day',
    title: 'The Session ID That Never Changed',
    prompt: 'Order the fix for session fixation — where an attacker tricks a victim into using a session ID the attacker already knows, then hijacks it once the victim logs in.',
    items: [
      { id: 'attacker', label: 'Attacker gets the victim to use a known session ID (e.g. via a crafted link)' },
      { id: 'login', label: 'Victim logs in, still using that same session ID' },
      { id: 'regenerate', label: 'Server generates a brand-new session ID at the moment of login' },
      { id: 'invalidate', label: 'The old, attacker-known session ID is invalidated' },
    ],
    correctOrder: ['attacker', 'login', 'regenerate', 'invalidate'],
    successMessage: 'The fix is simple but easy to miss: never keep using the SAME session ID across a login boundary — issue a fresh one the attacker never saw, and kill the old one.',
    hints: [
      'The vulnerability only works because the SAME session ID crosses the login boundary — the fix has to break that.',
      'A fresh ID has to be generated before the old, attacker-known one can safely be thrown away.',
      'Attacker plants a known session ID → Victim logs in using it → Server regenerates a new session ID at login → Old session ID is invalidated',
    ],
    xp: 65,
    tool: { name: 'Session fixation prevention', icon: '🔄', description: 'Regenerating the session ID at login — and invalidating the old one — stops an attacker from hijacking a session ID they planted before login.', fun: 4 },
  },
  {
    id: 'ss-pool-08-security-headers',
    kind: 'sequence',
    npc: 'Compliance Officer Norm',
    title: 'Headers That Do the Browser\'s Job For It',
    prompt: 'Order rolling out these HTTP security headers, from foundational to most specific.',
    items: [
      { id: 'hsts', label: 'Add Strict-Transport-Security (force HTTPS, never plain HTTP again)' },
      { id: 'csp', label: 'Add a Content-Security-Policy (restrict which scripts/resources can load)' },
      { id: 'xfo', label: 'Add X-Frame-Options (block the page from being framed by another site)' },
      { id: 'xcto', label: 'Add X-Content-Type-Options: nosniff (stop the browser from guessing MIME types)' },
    ],
    correctOrder: ['hsts', 'csp', 'xfo', 'xcto'],
    successMessage: 'There\'s no strict dependency here — but transport security (always HTTPS) is usually locked down first, then what content is even allowed to run, then framing and MIME-sniffing protections layer on top.',
    hints: [
      'There\'s no hard technical ordering between these four — but teams typically secure the transport layer (HTTPS enforcement) before layering on content and framing restrictions.',
      'HSTS is about the CONNECTION itself; the other three are about what happens once a legitimate HTTPS connection is already serving the page.',
      'Strict-Transport-Security → Content-Security-Policy → X-Frame-Options → X-Content-Type-Options',
    ],
    xp: 65,
    tool: { name: 'HTTP security headers', icon: '🛡️', description: 'HSTS, CSP, X-Frame-Options, and X-Content-Type-Options each close off a different class of browser-side attack.', fun: 3 },
  },
  {
    id: 'ss-pool-09-pentest-lifecycle',
    kind: 'sequence',
    npc: 'Compliance Officer Norm',
    title: 'Hacking It on Purpose, Safely',
    prompt: 'Order the standard phases of an authorized penetration test.',
    items: [
      { id: 'recon', label: 'Reconnaissance — gather information about the target' },
      { id: 'scan', label: 'Scanning — identify live hosts, open ports, and services' },
      { id: 'exploit', label: 'Exploitation — attempt to actually breach a found vulnerability' },
      { id: 'report', label: 'Reporting — document findings and remediation steps for the client' },
    ],
    correctOrder: ['recon', 'scan', 'exploit', 'report'],
    successMessage: 'You can\'t exploit what you haven\'t found, and you can\'t scan a target you know nothing about yet — recon, scan, exploit, then report it all back so it can actually get fixed.',
    hints: [
      'You have to know what\'s even out there (recon) before you can scan it, and scan it before you know what\'s exploitable.',
      'The entire point of a pentest is the report at the end — a vulnerability found but never documented never gets fixed.',
      'Reconnaissance → Scanning → Exploitation → Reporting',
    ],
    xp: 60,
    tool: { name: 'Penetration test lifecycle', icon: '🕵️', description: 'Recon, scan, exploit, report — an authorized, structured attempt to find what a real attacker would find first.', fun: 3 },
  },
  {
    id: 'ss-pool-10-pki-issuance',
    kind: 'sequence',
    npc: 'Cryptographer Claude',
    title: 'How a Certificate Gets Trusted',
    prompt: 'Order how a TLS certificate is issued and comes to be trusted by a browser.',
    items: [
      { id: 'keypair', label: 'Server generates a public/private key pair' },
      { id: 'csr', label: 'Server creates a Certificate Signing Request (CSR) containing the public key' },
      { id: 'validate', label: 'A Certificate Authority (CA) validates domain ownership' },
      { id: 'issue', label: 'The CA signs and issues the certificate' },
      { id: 'chain', label: 'Browsers trust it via the chain of trust back to a pre-installed root CA' },
    ],
    correctOrder: ['keypair', 'csr', 'validate', 'issue', 'chain'],
    successMessage: 'A key pair, a signing request, domain validation, a signed certificate, and a chain of trust all the way back to a root CA your browser already trusts — that\'s what the little padlock actually represents.',
    hints: [
      'The public key has to exist before it can be packaged into a signing request.',
      'A CA won\'t sign anything until it has verified domain ownership — trust has to be earned before it\'s granted.',
      'Generate key pair → Create CSR → CA validates domain ownership → CA signs and issues the certificate → Browser trusts it via the chain to a root CA',
    ],
    xp: 70,
    tool: { name: 'PKI certificate issuance', icon: '📜', description: 'A key pair, a signing request, CA validation, and a chain of trust back to a pre-installed root — the full path behind every trusted HTTPS certificate.', fun: 4 },
  },

  // ---------- MCQ ----------
  {
    id: 'ss-pool-11-mcq-mfa-factors',
    kind: 'mcq',
    npc: 'Security Chief Vera',
    title: 'Why Two Passwords Aren\'t "Two-Factor"',
    prompt: 'A system requires both a password and a secret PIN, both of which are just memorized. Why does this NOT qualify as true multi-factor authentication (MFA)?',
    options: [
      'True MFA requires factors from different categories (something you know, something you have, something you are) — two memorized secrets are both the same "something you know" category',
      'It does qualify, because there are two separate credentials required',
      'MFA requires exactly three factors, never two',
      'MFA only applies to biometric systems'
    ],
    correctIndex: 0,
    explanation: 'MFA\'s security benefit comes from requiring genuinely different KINDS of proof — something you know (password/PIN), something you have (a phone/hardware key), something you are (a fingerprint). Two memorized secrets both fall into the same "know" category, so compromising one method (e.g. phishing, a keylogger) likely compromises both — there\'s no independent second barrier.',
    hints: [
      'The point of MFA isn\'t "more than one credential" — it\'s combining fundamentally different TYPES of proof.',
      'A password and a PIN are both things you\'ve memorized — the same category of secret, vulnerable to the same kinds of attacks.',
      'The correct answer is: true MFA needs factors from different categories, and two memorized secrets are both "something you know."',
    ],
    xp: 50,
    tool: { name: 'MFA factor categories', icon: '🔑', description: 'Something you know, something you have, something you are — real MFA combines factors from different categories, not just more of the same one.', fun: 3 },
  },
  {
    id: 'ss-pool-12-mcq-csrf-token-proof',
    kind: 'mcq',
    npc: 'Security Chief Vera',
    title: 'What a CSRF Token Actually Proves',
    prompt: 'What does a valid CSRF token on a form submission actually prove to the server?',
    options: [
      'That the request originated from a page the server itself served — not a forged request from another site the user happened to be tricked into visiting',
      'That the user\'s identity has been cryptographically verified via a digital signature',
      'That the request was sent over HTTPS',
      'That the user\'s password is correct'
    ],
    correctIndex: 0,
    explanation: 'A CSRF token doesn\'t verify identity or encrypt anything — a browser automatically attaches cookies to same-site requests regardless of where the malicious page lives, so cookies alone can\'t prove genuine origin. The token proves the request came from a form the server itself actually rendered (and therefore knew the token to embed), since a forged request from an attacker\'s page has no way to know that value.',
    hints: [
      'This isn\'t about encryption or identity verification — cookies already handle "who is this," separately.',
      'The whole reason CSRF is possible at all is that the BROWSER attaches cookies automatically, regardless of which page triggered the request — the token compensates for exactly that gap.',
      'The correct answer is: it proves the request came from a page the server itself served, not a forged cross-site one.',
    ],
    xp: 55,
    tool: { name: 'What CSRF tokens prove', icon: '🎫', description: 'A CSRF token proves a request originated from the server\'s own form — cookies alone can\'t, since browsers attach them automatically regardless of origin.', fun: 4 },
  },
  {
    id: 'ss-pool-13-mcq-idor',
    kind: 'mcq',
    npc: 'Hacker Zero-Day',
    title: 'Changing One Number in a URL',
    prompt: 'A logged-in user changes /invoices/42 to /invoices/43 in the URL and sees someone else\'s invoice. What vulnerability class is this?',
    options: [
      'IDOR (Insecure Direct Object Reference) — the server returns the resource without checking the requester actually owns it',
      'SQL injection',
      'Cross-site scripting (XSS)',
      'A DNS misconfiguration'
    ],
    correctIndex: 0,
    explanation: 'IDOR happens when an application exposes a direct reference (like a raw database ID) to an internal object and fails to verify the requesting user is actually authorized to access that specific object — being logged in isn\'t the same as owning the resource being requested.',
    hints: [
      'This isn\'t about malicious code being injected anywhere — the request itself is completely well-formed.',
      'The bug is purely a missing OWNERSHIP check on an otherwise valid, authenticated request.',
      'The correct answer is: IDOR, since the object reference itself is exposed with no per-object authorization check.',
    ],
    xp: 50,
    tool: { name: 'IDOR', icon: '🔢', description: 'Insecure Direct Object Reference — exposing a raw internal ID without verifying the requester actually owns that specific object.', fun: 3 },
  },
  {
    id: 'ss-pool-14-mcq-ssrf',
    kind: 'mcq',
    npc: 'Hacker Zero-Day',
    title: 'Making the Server Attack Itself',
    prompt: 'An app lets users submit a URL to "preview a link," and the server fetches whatever URL is given — including internal-only addresses like http://169.254.169.254/ (a cloud metadata endpoint) or http://localhost:8080/admin. What is this vulnerability called?',
    options: [
      'SSRF (Server-Side Request Forgery) — the server itself is tricked into making a request to a target the attacker couldn\'t reach directly',
      'Cross-site scripting (XSS)',
      'A brute-force attack',
      'Session fixation'
    ],
    correctIndex: 0,
    explanation: 'SSRF exploits a server that makes outbound requests on the user\'s behalf, letting an attacker use the server itself as a proxy to reach internal-only resources (metadata endpoints, internal admin panels, private networks) it could never reach directly from outside.',
    hints: [
      'The key detail: it\'s the SERVER making the request, not the attacker\'s own browser — that\'s what lets it reach internal-only addresses.',
      'This is exactly why "fetch this URL for me" features are dangerous if the server can\'t distinguish public URLs from internal ones.',
      'The correct answer is: SSRF, where the server is tricked into requesting a target the attacker couldn\'t reach directly.',
    ],
    xp: 55,
    tool: { name: 'SSRF', icon: '🌐', description: 'Server-Side Request Forgery — tricking a server into making requests to internal-only targets on the attacker\'s behalf.', fun: 4 },
  },
  {
    id: 'ss-pool-15-mcq-insecure-deserialization',
    kind: 'mcq',
    npc: 'Cryptographer Claude',
    title: 'Data That Turns Into Code',
    prompt: 'Why is deserializing untrusted data (e.g. Python\'s pickle.loads() on data from an untrusted source) considered dangerous?',
    options: [
      'Some serialization formats can embed instructions that execute arbitrary code during deserialization — untrusted input can potentially run attacker-controlled code just by being loaded',
      'It\'s only a performance concern, never a security one',
      'Deserialization only fails silently, with no security implication',
      'It only affects data stored in plain text files, never over a network'
    ],
    correctIndex: 0,
    explanation: 'Formats like Python\'s pickle are designed to reconstruct arbitrary objects, which can include instructions executed during that reconstruction — an attacker who controls the serialized bytes can potentially achieve remote code execution the moment the victim application deserializes it. This is why deserializing untrusted input (vs. trusted, self-generated data) is treated as a genuine RCE risk, not just a data-integrity concern.',
    hints: [
      'The risk isn\'t about the data being wrong — it\'s about the deserialization process itself being able to execute code as a side effect.',
      'pickle is explicitly documented as unsafe to use on data from an untrusted source for exactly this reason.',
      'The correct answer is: some formats can embed code that executes during deserialization, enabling remote code execution on untrusted input.',
    ],
    xp: 60,
    tool: { name: 'Insecure deserialization', icon: '📦', description: 'Some serialization formats (like Python\'s pickle) can execute code during deserialization — never deserialize untrusted input with them.', fun: 4 },
  },
  {
    id: 'ss-pool-16-mcq-cvss',
    kind: 'mcq',
    npc: 'Compliance Officer Norm',
    title: 'Turning a Vulnerability Into a Number',
    prompt: 'What is CVSS (Common Vulnerability Scoring System) used for?',
    options: [
      'Producing a standardized numeric severity score (0–10) for a vulnerability, based on factors like exploitability and impact, to help prioritize which ones to fix first',
      'Uniquely identifying and cataloging a specific vulnerability (that\'s CVE\'s job, not CVSS\'s)',
      'Automatically patching vulnerabilities once they\'re scored',
      'Encrypting vulnerability reports so only authorized staff can read them'
    ],
    correctIndex: 0,
    explanation: 'CVSS produces a standardized severity score (typically 0.0–10.0) from metrics like attack vector, complexity, privileges required, and impact — it\'s a prioritization tool, distinct from CVE (which just assigns a unique identifier/catalog entry to a specific vulnerability). Neither CVSS nor CVE performs any patching or encryption themselves.',
    hints: [
      'This is a SCORING system, not an identification system — that distinction matters, since CVE is the one that assigns unique IDs.',
      'Think of it as a standardized way to answer "how bad is this, really, and how urgently should we fix it?"',
      'The correct answer is: CVSS produces a standardized numeric severity score to help prioritize which vulnerabilities to fix first.',
    ],
    xp: 55,
    tool: { name: 'CVSS scoring', icon: '📊', description: 'A standardized 0–10 severity score based on exploitability and impact — CVE identifies a vulnerability, CVSS scores how bad it is.', fun: 3 },
  },
  {
    id: 'ss-pool-17-mcq-defense-in-depth',
    kind: 'mcq',
    npc: 'Compliance Officer Norm',
    title: 'Why One Good Lock Isn\'t Enough',
    prompt: 'What does "defense in depth" mean as a security principle?',
    options: [
      'Layering multiple independent security controls so that if one fails, others still stand between an attacker and the target',
      'Investing all security budget into a single, maximally strong control',
      'Only defending the network perimeter, since that\'s where all attacks originate',
      'A synonym for encrypting data at rest'
    ],
    correctIndex: 0,
    explanation: 'Defense in depth assumes any single control CAN fail or be bypassed — a firewall, input validation, least-privilege access, monitoring, and encryption each cover for the others\' potential blind spots, so a single breach doesn\'t immediately mean total compromise.',
    hints: [
      'This principle explicitly assumes no single defense is perfect — the value is in having backups for when one fails.',
      'Think about the Security Stronghold\'s own hardening checklist: non-root, read-only filesystem, dropped capabilities, image scanning — several layers, not one.',
      'The correct answer is: layering multiple independent controls so no single failure means total compromise.',
    ],
    xp: 50,
    tool: { name: 'Defense in depth', icon: '🧱', description: 'Multiple independent, layered security controls — so one failure doesn\'t mean the whole system is compromised.', fun: 3 },
  },
  {
    id: 'ss-pool-18-mcq-least-privilege',
    kind: 'mcq',
    npc: 'Security Chief Vera',
    title: 'Giving Out Exactly Enough Access',
    prompt: 'What is the principle of least privilege?',
    options: [
      'Every user, process, or service should have only the minimum permissions necessary to do its job — nothing more',
      'Every account should share the same broad set of admin permissions, for simplicity',
      'Privileges should be granted generously up front and revoked only if abuse is detected',
      'Only the least experienced employees should have restricted access'
    ],
    correctIndex: 0,
    explanation: 'Least privilege minimizes the blast radius of any single compromised account, process, or service — if it only ever had the minimum access it actually needed, an attacker who compromises it inherits only that same limited access, not the run of the whole system.',
    hints: [
      'This is about minimizing what a compromised account or process could do, by never giving it more than it needs in the first place.',
      'It\'s the same idea Zero Trust\'s "least-privilege access on every request" step already applies at the request level.',
      'The correct answer is: grant only the minimum permissions necessary, nothing more.',
    ],
    xp: 50,
    tool: { name: 'Principle of least privilege', icon: '🔐', description: 'Grant only the minimum access needed to do the job — it limits what a compromised account or process could ever do.', fun: 3 },
  },

  // ---------- matching ----------
  {
    id: 'ss-pool-19-match-security-headers',
    kind: 'matching',
    npc: 'Compliance Officer Norm',
    title: 'HTTP Security Headers',
    prompt: 'Match each security header to what it protects against.',
    pairs: [
      { id: 'a', left: 'Strict-Transport-Security', right: 'Forces the browser to only ever connect over HTTPS, never plain HTTP' },
      { id: 'b', left: 'Content-Security-Policy', right: 'Restricts which scripts/resources are allowed to load, limiting XSS impact' },
      { id: 'c', left: 'X-Frame-Options', right: 'Blocks the page from being embedded in another site\'s <iframe> (clickjacking defense)' },
      { id: 'd', left: 'X-Content-Type-Options: nosniff', right: 'Stops the browser from guessing a file\'s type, ignoring a mismatched Content-Type' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'HSTS is about the CONNECTION itself (HTTP vs. HTTPS); the other three govern what happens once a page is already loading.',
      'X-Frame-Options specifically targets clickjacking — being embedded invisibly inside another site\'s frame.',
      'Strict-Transport-Security → forces HTTPS, Content-Security-Policy → restricts resource loading, X-Frame-Options → blocks framing, X-Content-Type-Options → stops MIME-sniffing.',
    ],
    xp: 60,
    tool: { name: 'HTTP security headers', icon: '🛡️', description: 'HSTS, CSP, X-Frame-Options, and X-Content-Type-Options each close off a different browser-side attack surface.', fun: 4 },
  },
  {
    id: 'ss-pool-20-match-vuln-classes',
    kind: 'matching',
    npc: 'Hacker Zero-Day',
    title: 'Common Vulnerability Classes',
    prompt: 'Match each vulnerability class to what actually goes wrong.',
    pairs: [
      { id: 'a', left: 'SQL injection', right: 'Untrusted input is concatenated directly into a query, changing its logic' },
      { id: 'b', left: 'XSS', right: 'Untrusted input is rendered as executable script in a page other users view' },
      { id: 'c', left: 'IDOR', right: 'A direct object reference is exposed with no per-object ownership check' },
      { id: 'd', left: 'SSRF', right: 'The server itself is tricked into requesting an internal-only target' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'SQL injection and XSS both involve untrusted input being interpreted as CODE (a query or a script) instead of plain data.',
      'IDOR and SSRF are both about reaching something the requester shouldn\'t be able to — one via a raw ID, one via the server acting as a proxy.',
      'SQL injection → query logic altered, XSS → script executes in the page, IDOR → missing ownership check, SSRF → server tricked into an internal request.',
    ],
    xp: 60,
    tool: { name: 'Common vulnerability classes', icon: '🐛', description: 'SQL injection and XSS turn data into code; IDOR and SSRF reach things a request shouldn\'t be able to.', fun: 4 },
  },
  {
    id: 'ss-pool-21-match-attack-types',
    kind: 'matching',
    npc: 'Hacker Zero-Day',
    title: 'Attack Types',
    prompt: 'Match each attack type to how it works.',
    pairs: [
      { id: 'a', left: 'Phishing', right: 'Tricks a person into revealing credentials or clicking something malicious' },
      { id: 'b', left: 'Brute force', right: 'Systematically tries many possible passwords until one works' },
      { id: 'c', left: 'Man-in-the-middle', right: 'Intercepts communication between two parties who believe they\'re talking directly' },
      { id: 'd', left: 'DDoS', right: 'Floods a target with traffic from many sources until it can\'t serve real users' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Phishing targets a PERSON\'s judgment; the other three target a system directly.',
      'Man-in-the-middle is about secretly sitting BETWEEN two parties; DDoS is about overwhelming a target with sheer volume.',
      'Phishing → tricks a person, brute force → tries many passwords, man-in-the-middle → intercepts communication, DDoS → floods with traffic.',
    ],
    xp: 55,
    tool: { name: 'Attack types', icon: '⚔️', description: 'Phishing targets people; brute force, man-in-the-middle, and DDoS each target a system in a different way.', fun: 3 },
  },
  {
    id: 'ss-pool-22-match-auth-factors',
    kind: 'matching',
    npc: 'Security Chief Vera',
    title: 'Authentication Factor Categories',
    prompt: 'Match each authentication factor category to an example.',
    pairs: [
      { id: 'a', left: 'Something you know', right: 'A password or PIN' },
      { id: 'b', left: 'Something you have', right: 'A phone receiving an SMS code, or a hardware security key' },
      { id: 'c', left: 'Something you are', right: 'A fingerprint or face scan' },
      { id: 'd', left: 'Somewhere you are', right: "A login allowed only from the office's known IP range" },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Three of these are the classic MFA categories; the fourth (location) is a less common but real supplementary factor.',
      'A password is memorized; a hardware key is physically possessed; a fingerprint is biological — each is a genuinely different KIND of proof.',
      'Something you know → password, something you have → phone/hardware key, something you are → biometric, somewhere you are → network location.',
    ],
    xp: 55,
    tool: { name: 'Authentication factor categories', icon: '🧬', description: 'Know, have, are — and sometimes where — real MFA combines genuinely different categories, not just more secrets of the same kind.', fun: 3 },
  },
  {
    id: 'ss-pool-23-match-pki',
    kind: 'matching',
    npc: 'Cryptographer Claude',
    title: 'PKI Vocabulary',
    prompt: 'Match each PKI (Public Key Infrastructure) term to its role.',
    pairs: [
      { id: 'a', left: 'Certificate Authority (CA)', right: 'A trusted organization that verifies identity and signs certificates' },
      { id: 'b', left: 'Certificate Signing Request (CSR)', right: 'A request containing a public key, sent to a CA to get it signed' },
      { id: 'c', left: 'Root certificate', right: "Pre-installed in browsers/OSes as an inherently trusted starting point" },
      { id: 'd', left: 'Chain of trust', right: 'The path of signatures from a server\'s certificate back up to a trusted root' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'A CSR is what gets SENT to a CA; the CA is the one doing the verifying and signing.',
      'The root certificate is the trust anchor everything else ultimately traces back to — the chain of trust is that whole traced path.',
      'Certificate Authority → verifies and signs, CSR → the request sent to a CA, root certificate → pre-trusted anchor, chain of trust → the path back to that anchor.',
    ],
    xp: 60,
    tool: { name: 'PKI vocabulary', icon: '📜', description: 'A CA verifies and signs a CSR into a certificate, ultimately trusted via a chain back to a pre-installed root.', fun: 4 },
  },
  {
    id: 'ss-pool-24-match-access-control',
    kind: 'matching',
    npc: 'Compliance Officer Norm',
    title: 'Access Control Models',
    prompt: 'Match each access control model to how it decides permissions.',
    pairs: [
      { id: 'a', left: 'RBAC (Role-Based)', right: 'Permissions are assigned to roles, and users inherit permissions via their assigned role' },
      { id: 'b', left: 'ABAC (Attribute-Based)', right: 'Permissions are decided dynamically from attributes — user, resource, time, location, etc.' },
      { id: 'c', left: 'DAC (Discretionary)', right: 'The resource\'s own owner decides who else gets access to it' },
      { id: 'd', left: 'MAC (Mandatory)', right: 'A central authority sets fixed access rules that individual users can\'t override' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'RBAC groups permissions by ROLE; ABAC is more flexible, deciding access from arbitrary attributes at request time.',
      'DAC lets an individual resource owner grant access; MAC removes that discretion entirely, enforced centrally.',
      'RBAC → role-based, ABAC → attribute-based, DAC → owner discretion, MAC → centrally mandated, no override.',
    ],
    xp: 60,
    tool: { name: 'Access control models', icon: '🗝️', description: 'RBAC by role, ABAC by attributes, DAC by owner discretion, MAC by central mandate — four different ways to decide who gets in.', fun: 4 },
  },
  {
    id: 'ss-pool-25-match-vuln-management',
    kind: 'matching',
    npc: 'Compliance Officer Norm',
    title: 'Vulnerability Management Vocabulary',
    prompt: 'Match each vulnerability-management term to its meaning.',
    pairs: [
      { id: 'a', left: 'CVE', right: 'A unique identifier cataloging one specific, publicly known vulnerability' },
      { id: 'b', left: 'CVSS', right: 'A standardized numeric score (0–10) rating how severe a vulnerability is' },
      { id: 'c', left: 'Zero-day', right: 'A vulnerability with no patch available yet — often first discovered only once it\'s already being exploited' },
      { id: 'd', left: 'Patch', right: "A vendor-released fix that closes a known vulnerability" },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'CVE identifies a vulnerability; CVSS scores how bad it is — different jobs, often used together.',
      'A zero-day is defined by the ABSENCE of a fix, not strictly by active exploitation — though the two are often discovered together.',
      'CVE → identifies, CVSS → scores severity, zero-day → no patch available yet, patch → the fix itself.',
    ],
    xp: 55,
    tool: { name: 'Vulnerability management vocabulary', icon: '📋', description: 'CVE identifies a vulnerability, CVSS scores its severity, a zero-day has no patch available yet, and a patch is that eventual fix.', fun: 3 },
  },
  {
    id: 'ss-pool-26-match-encryption-terms',
    kind: 'matching',
    npc: 'Cryptographer Claude',
    title: 'Encryption Vocabulary',
    prompt: 'Match each encryption term to its meaning.',
    pairs: [
      { id: 'a', left: 'Symmetric encryption', right: 'The same key both encrypts and decrypts — fast, but the key must be shared secretly' },
      { id: 'b', left: 'Asymmetric encryption', right: 'A public key encrypts, only the matching private key can decrypt' },
      { id: 'c', left: 'Encryption at rest', right: 'Protects stored data, e.g. on a disk or in a database' },
      { id: 'd', left: 'Encryption in transit', right: 'Protects data while it travels over a network, e.g. via TLS' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Symmetric uses ONE shared key for both directions; asymmetric uses a mathematically linked PAIR, public and private.',
      'One of these protects data sitting still; the other protects data actively moving across a network.',
      'Symmetric → one shared key, asymmetric → public/private key pair, at rest → stored data, in transit → data moving over a network.',
    ],
    xp: 60,
    tool: { name: 'Encryption vocabulary', icon: '🔐', description: 'Symmetric vs. asymmetric describes HOW encryption works; at rest vs. in transit describes WHEN data is protected.', fun: 4 },
  },
]
