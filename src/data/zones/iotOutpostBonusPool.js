import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// The bonus reserve pool for IoT Outpost — 2x its 13 real chest positions.
// Once a chest is solved and the player moves past it via "Next", that
// chest's challenge gets replaced with one drawn from here (see
// gameStore.js's BONUS_POOLS registry / swapChallenge / getLiveChallenges),
// same mechanic as every other zone in this rollout. Pre-authored, never
// AI-generated at runtime.
//
// Split three ways:
//   - 8 hands-on (4x kind: 'python' — same `result`-variable/checkResult
//     convention the main pool uses, Pyodide stdlib only, no real network;
//     4x kind: 'sequence') covering ground the main 13 don't: MQTT message
//     deduplication (QoS 1's at-least-once delivery can duplicate),
//     smoothing noisy sensor readings with a moving average, a battery-life
//     estimate, a payload compression ratio, a digital twin's data flow,
//     bulk device fleet provisioning at scale, a time-series database's
//     write/downsample/query path, and MQTT's publish/broker/deliver
//     fan-out.
//   - 9 MCQ (kind: 'mcq') on IoT concepts with no single runnable snippet
//     of their own: why IoT devices are resource-constrained, MQTT QoS
//     levels (0/1/2), edge computing's purpose, what a digital twin is,
//     why OTA updates use staged/canary rollouts, why fleet provisioning
//     has to be automated at scale, what a time-series database is
//     optimized for, the three-way distinction between reactive/
//     preventive/predictive maintenance, and what an LPWAN is for.
//   - 9 matching (kind: 'matching') pairing terms across IoT stack layers,
//     wireless protocol tradeoffs, AWS IoT vocabulary, maintenance
//     strategies, MQTT vocabulary, Industrial IoT terms, OTA rollout
//     terms, time-series/storage terms, and edge-vs-cloud vocabulary.

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

export const IOT_OUTPOST_BONUS_POOL = [
  // ---------- hands-on: python / sequence ----------
  {
    id: 'iot-pool-01-mqtt-dedup',
    kind: 'python',
    npc: 'Sensor Sally',
    title: 'When "At Least Once" Means Twice',
    prompt: "MQTT QoS 1 guarantees 'at least once' delivery — which can mean the same message arrives more than once. incoming = [{'id': 'm1', 'temp': 21.5}, {'id': 'm2', 'temp': 22.0}, {'id': 'm1', 'temp': 21.5}, {'id': 'm3', 'temp': 21.8}]. Deduplicate by 'id', keeping only each message's first occurrence. Store the deduplicated list in `result`.",
    starter: "incoming = [\n    {'id': 'm1', 'temp': 21.5},\n    {'id': 'm2', 'temp': 22.0},\n    {'id': 'm1', 'temp': 21.5},\n    {'id': 'm3', 'temp': 21.8},\n]\nseen = set()\nresult = []\n",
    hints: [
      'Track which message ids you\'ve already kept, in a set — if an id is already in that set, skip it.',
      'Walk the list in order; for each message, only append it (and mark its id as seen) the first time that id appears.',
      "for msg in incoming:\n    if msg['id'] not in seen:\n        seen.add(msg['id'])\n        result.append(msg)",
    ],
    xp: 70,
    tool: { name: 'MQTT message deduplication', icon: '🔁', description: 'QoS 1\'s "at least once" guarantee can duplicate messages — dedupe by id before processing.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [
      { id: 'm1', temp: 21.5 },
      { id: 'm2', temp: 22.0 },
      { id: 'm3', temp: 21.8 },
    ]) ?? { success: true, message: 'Three unique messages, the duplicate quietly dropped.' },
  },
  {
    id: 'iot-pool-02-moving-average',
    kind: 'python',
    npc: 'Data Deva',
    title: 'Smoothing Out the Noise',
    prompt: 'readings = [20, 22, 21, 45, 20, 21, 22] — one clearly noisy spike. Before feeding this into anomaly detection, compute a simple 3-reading moving average for every position where a full window of 3 fits (starting at index 2). Store the list of moving averages in `result`.',
    starter: 'readings = [20, 22, 21, 45, 20, 21, 22]\nresult = []\n',
    hints: [
      'For each index i from 2 to the end, average readings[i-2], readings[i-1], and readings[i].',
      'A simple loop over range(2, len(readings)) works — compute the average of the three most recent readings each time.',
      "for i in range(2, len(readings)):\n    result.append((readings[i-2] + readings[i-1] + readings[i]) / 3)",
    ],
    xp: 65,
    tool: { name: 'Moving average smoothing', icon: '📉', description: 'Averages a small trailing window of readings — smooths out noise before it reaches anomaly detection.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [21.0, 29.33, 28.67, 28.67, 21.0], 0.01) ?? { success: true, message: 'The spike is still visible in the average, but nowhere near as sharp — exactly the point of smoothing.' },
  },
  {
    id: 'iot-pool-03-battery-life',
    kind: 'python',
    npc: 'Edge Eddie',
    title: 'How Long Before It Dies',
    prompt: 'battery_capacity_mah = 2000, avg_current_draw_ma = 15. Estimate the battery life in hours: capacity divided by average current draw. Store the float in `result`.',
    starter: 'battery_capacity_mah = 2000\navg_current_draw_ma = 15\nresult = None\n',
    hints: [
      'Milliamp-hours divided by milliamps gives you hours directly.',
      'It\'s a single division.',
      'result = battery_capacity_mah / avg_current_draw_ma',
    ],
    xp: 60,
    tool: { name: 'Battery life estimate', icon: '🔋', description: 'Capacity ÷ average current draw — a first-pass estimate of how long a device runs before it dies.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 133.33, 0.1) ?? { success: true, message: 'About 133 hours — just over 5 days on one charge, at this draw rate.' },
  },
  {
    id: 'iot-pool-04-compression-ratio',
    kind: 'python',
    npc: 'Sensor Sally',
    title: 'Making the Payload Fit',
    prompt: 'A sensor payload is being squeezed to fit over a bandwidth-constrained LoRaWAN link: raw_bytes = 4096, compressed_bytes = 512. Compute the compression ratio: raw_bytes / compressed_bytes. Store the float in `result`.',
    starter: 'raw_bytes = 4096\ncompressed_bytes = 512\nresult = None\n',
    hints: [
      'The ratio just compares the original size to the squeezed-down size.',
      'It\'s a single division.',
      'result = raw_bytes / compressed_bytes',
    ],
    xp: 60,
    tool: { name: 'Compression ratio', icon: '🗜️', description: 'Original size ÷ compressed size — how much smaller a payload got before it had to cross a slow link.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 8.0, 0.01) ?? { success: true, message: '8x smaller — exactly the kind of squeeze a low-bandwidth link like LoRaWAN needs.' },
  },
  {
    id: 'iot-pool-05-digital-twin',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'A Copy That Lives in the Computer',
    prompt: 'Order the data flow behind a digital twin — a virtual model kept in sync with a real physical asset.',
    items: [
      { id: 'instrument', label: 'A physical asset is instrumented with sensors' },
      { id: 'feed', label: 'Real-time sensor data feeds a virtual model of that asset' },
      { id: 'simulate', label: 'The virtual model is used to simulate or predict behavior' },
      { id: 'apply', label: 'Insights from the simulation are applied back to the physical asset' },
    ],
    correctOrder: ['instrument', 'feed', 'simulate', 'apply'],
    successMessage: 'The virtual model only stays useful because it\'s constantly fed real data — and the loop closes when its predictions actually change what happens to the real machine.',
    hints: [
      'Nothing can be modeled virtually until real sensors are actually feeding it real data.',
      'The whole point of simulating on the virtual model is to learn something that then gets applied back to the REAL asset.',
      'Instrument the physical asset → Real-time data feeds the virtual model → Simulate/predict on the model → Apply insights back to the real asset',
    ],
    xp: 75,
    tool: { name: 'Digital twin', icon: '👥', description: 'A virtual model kept in sync with a real asset, used to simulate and predict, then feed insights back.', fun: 4 },
  },
  {
    id: 'iot-pool-06-fleet-provisioning',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'Onboarding 50,000 Devices Without Touching One',
    prompt: 'Order how device fleet provisioning actually works at scale — nobody manually registers 50,000 individual devices.',
    items: [
      { id: 'manufacture', label: 'During manufacturing, each device is burned with a unique certificate' },
      { id: 'ship', label: 'Devices are shipped out to the field' },
      { id: 'poweron', label: 'A device powers on and connects using its own unique certificate' },
      { id: 'autoregister', label: 'The cloud automatically registers the device via fleet provisioning — no manual step needed' },
    ],
    correctOrder: ['manufacture', 'ship', 'poweron', 'autoregister'],
    successMessage: 'Every device arrives pre-trusted, and the cloud recognizes it the instant it powers on — nobody typed in 50,000 device IDs by hand.',
    hints: [
      'A device needs its unique identity burned in at the factory, long before it ever reaches the field.',
      'The cloud only ever "meets" a device the moment it actually powers on and connects for the first time.',
      'Certificate burned in at manufacturing → Devices shipped → Device powers on and connects → Cloud auto-registers via fleet provisioning',
    ],
    xp: 75,
    tool: { name: 'Fleet provisioning', icon: '🏭', description: 'Automated, certificate-based onboarding — the only way to trust thousands of devices without touching each one.', fun: 4 },
  },
  {
    id: 'iot-pool-07-timeseries-path',
    kind: 'sequence',
    npc: 'Data Deva',
    title: 'Where All This Data Actually Lives',
    prompt: 'Order the write path for high-frequency sensor data landing in a time-series database.',
    items: [
      { id: 'ingest', label: 'High-frequency sensor data arrives continuously' },
      { id: 'write', label: 'Written into a time-series database, optimized for exactly that write pattern' },
      { id: 'downsample', label: 'Older data is downsampled/aggregated to save long-term storage space' },
      { id: 'query', label: 'Dashboards query the time-series database for visualization' },
    ],
    correctOrder: ['ingest', 'write', 'downsample', 'query'],
    successMessage: 'Written fast, aged gracefully into coarser summaries, and still queryable years later — that\'s what a time-series database is actually built for.',
    hints: [
      'Data has to actually arrive and get written before anything can be downsampled or queried.',
      'Downsampling happens to OLDER data, over time — recent data stays at full resolution.',
      'High-frequency data arrives → Written to time-series DB → Older data downsampled/aggregated → Dashboards query it',
    ],
    xp: 75,
    tool: { name: 'Time-series storage path', icon: '📊', description: 'Optimized for fast writes now, and cheap, coarser storage of the same data years later.', fun: 4 },
  },
  {
    id: 'iot-pool-08-pubsub-fanout',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'One Message, Many Listeners',
    prompt: 'Order MQTT\'s publish/subscribe fan-out — one device publishing to many independent listeners.',
    items: [
      { id: 'publish', label: 'A device publishes a message to one MQTT topic' },
      { id: 'broker', label: 'The broker receives it and looks up every subscriber to that topic' },
      { id: 'deliver', label: 'The broker delivers a copy of the message to each subscriber' },
      { id: 'process', label: 'Each subscriber processes the message independently, unaware of the others' },
    ],
    correctOrder: ['publish', 'broker', 'deliver', 'process'],
    successMessage: 'One publish, any number of listeners — none of them even know how many others got the same message.',
    hints: [
      'The broker has to know who\'s subscribed to a topic before it can deliver anything to them.',
      'Every subscriber gets its own independent copy — they don\'t coordinate with each other at all.',
      'Device publishes to a topic → Broker looks up subscribers → Broker delivers to each → Each subscriber processes independently',
    ],
    xp: 70,
    tool: { name: 'MQTT pub/sub fan-out', icon: '📡', description: 'One publish, delivered independently to every subscriber of that topic.', fun: 4 },
  },

  // ---------- MCQ: IoT concepts ----------
  {
    id: 'iot-pool-09-mcq-device-constraints',
    kind: 'mcq',
    npc: 'Sensor Sally',
    title: 'Why IoT Devices Are So Limited',
    prompt: 'Why do IoT devices typically have much less compute power, memory, and energy budget than a server?',
    options: [
      'Cost, battery life, and physical form factor all push toward the cheapest, smallest, lowest-power hardware that can still do the job — not toward maximum capability',
      'IoT devices are technically incapable of ever having more resources, for physical reasons that can never change',
      'It\'s a deliberate security measure with no other purpose',
      'Server-grade hardware doesn\'t exist in a small enough physical size'
    ],
    correctIndex: 0,
    explanation: 'A sensor that costs $2 and runs for years on a coin-cell battery has to be tiny and low-power by design — every added chip, every extra clock cycle, costs money and battery life the device usually doesn\'t have room for.',
    hints: [
      'It\'s an economic and physical design choice, not a hard technical limit that can never be crossed.',
      'Think about what a coin-cell-battery-powered sensor actually needs to survive for years in the field.',
      'The correct answer is: cost, battery life, and form factor push toward minimal hardware, not maximum capability.',
    ],
    xp: 45,
    tool: { name: 'IoT device constraints', icon: '🔋', description: 'Cost, battery life, and form factor push IoT hardware toward minimal, not maximal, capability.', fun: 3 },
  },
  {
    id: 'iot-pool-10-mcq-mqtt-qos',
    kind: 'mcq',
    npc: 'Sensor Sally',
    title: 'MQTT Quality of Service Levels',
    prompt: "What do MQTT's three QoS (Quality of Service) levels — 0, 1, and 2 — actually guarantee?",
    options: [
      'QoS 0 = at most once (may be lost); QoS 1 = at least once (may duplicate); QoS 2 = exactly once (guaranteed, no loss or duplication, at the highest overhead)',
      'QoS levels only control how fast a message travels, nothing about reliability',
      'QoS 2 is always the worst option and should never be used',
      'QoS levels are unrelated to message delivery guarantees at all'
    ],
    correctIndex: 0,
    explanation: 'QoS 0 is fire-and-forget (fastest, least reliable). QoS 1 guarantees delivery but can duplicate (exactly the scenario the dedup challenge simulated). QoS 2 guarantees exactly-once delivery, at the cost of more protocol overhead — the right choice depends on whether occasional loss or occasional duplication is more acceptable for that data.',
    hints: [
      'The three levels trade off reliability against overhead — higher QoS means stronger guarantees, but more protocol chatter.',
      'One level can lose messages, one can duplicate them, and one guarantees neither happens.',
      'The correct answer is: QoS 0 = at most once, QoS 1 = at least once (can duplicate), QoS 2 = exactly once.',
    ],
    xp: 50,
    tool: { name: 'MQTT QoS levels', icon: '📶', description: 'At most once, at least once, or exactly once — three different delivery guarantees, three different costs.', fun: 3 },
  },
  {
    id: 'iot-pool-11-mcq-edge-purpose',
    kind: 'mcq',
    npc: 'Edge Eddie',
    title: 'Why Process at the Edge At All',
    prompt: "What problem does edge computing solve that sending everything to the cloud doesn't?",
    options: [
      'It processes data close to where it\'s generated, cutting the latency and bandwidth cost of a round trip to the cloud for decisions that need to happen fast, locally',
      'Edge computing is always cheaper than cloud computing in every situation, with no tradeoffs',
      'Edge computing eliminates the need for any cloud infrastructure whatsoever',
      'It exists purely to reduce the number of sensors a company needs to buy'
    ],
    correctIndex: 0,
    explanation: 'Sending every reading to the cloud and waiting for a response adds latency and consumes bandwidth — for something like autonomous vehicle braking, that round trip is far too slow. Processing right at (or near) the device cuts both the latency and the data volume that needs to travel anywhere.',
    hints: [
      'Think back to the autonomous vehicle braking example — why couldn\'t that decision wait for a round trip to the cloud?',
      'It\'s about two specific costs of sending everything to the cloud: latency and bandwidth.',
      'The correct answer is: processes data close to its source, cutting the latency and bandwidth cost of a cloud round trip.',
    ],
    xp: 45,
    tool: { name: 'Edge computing purpose', icon: '🧠', description: 'Cuts the latency and bandwidth cost of a round trip to the cloud, for decisions that need to happen fast.', fun: 3 },
  },
  {
    id: 'iot-pool-12-mcq-digital-twin',
    kind: 'mcq',
    npc: 'Chief Engineer Vega',
    title: 'What a Digital Twin Actually Is',
    prompt: 'What is a "digital twin"?',
    options: [
      'A virtual model of a physical asset, kept in sync with real-time data from it, used to simulate and predict its behavior',
      'A backup copy of a device\'s firmware, stored for disaster recovery',
      'Two identical physical devices running side by side for redundancy',
      'A second, unrelated dashboard showing the same data twice'
    ],
    correctIndex: 0,
    explanation: 'A digital twin is a live, virtual representation of a real asset — continuously updated from real sensor data — that lets you simulate scenarios or predict behavior (like remaining useful life) without touching the physical thing itself.',
    hints: [
      'It\'s specifically about a VIRTUAL model, kept continuously in sync with a REAL physical asset — not two physical copies.',
      'The whole value is in being able to simulate/predict on the virtual model without touching the real one.',
      'The correct answer is: a virtual model of a physical asset, kept in sync with real-time data, used to simulate and predict.',
    ],
    xp: 50,
    tool: { name: 'Digital twin', icon: '👥', description: 'A live virtual model of a real asset, kept in sync with real data, for simulation and prediction.', fun: 3 },
  },
  {
    id: 'iot-pool-13-mcq-ota-risk',
    kind: 'mcq',
    npc: 'Data Deva',
    title: 'Why Not Just Push the Update to Everyone at Once',
    prompt: 'Why do OTA (over-the-air) firmware rollouts use a staged/canary approach instead of pushing to every device simultaneously?',
    options: [
      'A bad firmware push sent to every device at once could brick or malfunction the entire fleet simultaneously; a small canary group first limits the blast radius if something is wrong',
      'Staged rollouts are always faster than pushing to everyone at once',
      'Devices physically can\'t all download an update at the same time, for bandwidth reasons alone',
      'Canary rollouts are only used for cosmetic UI changes, never for real firmware'
    ],
    correctIndex: 0,
    explanation: 'Pushing untested firmware to 200,000 devices at once means a single bug could take down (or brick) the entire fleet instantly. A small canary group first, watched closely, limits how much damage a bad release can do before it\'s caught and rolled back.',
    hints: [
      'Think about the worst-case outcome if the new firmware has a bug that bricks a device — how many devices would you want exposed to that risk at once?',
      'It\'s about limiting the "blast radius" of a bad release, not about bandwidth or speed.',
      'The correct answer is: limits the blast radius of a bad firmware push, instead of risking the entire fleet at once.',
    ],
    xp: 50,
    tool: { name: 'Staged OTA rollout risk', icon: '📲', description: 'Limits how many devices a bad firmware push can affect, instead of risking the whole fleet at once.', fun: 3 },
  },
  {
    id: 'iot-pool-14-mcq-fleet-scale',
    kind: 'mcq',
    npc: 'Chief Engineer Vega',
    title: 'Why Provisioning Has to Be Automated',
    prompt: 'Why does device provisioning need to be fully automated at scale, instead of manually registering each device?',
    options: [
      'It\'s physically and economically impractical for a human to manually configure thousands or millions of individual devices — automated, certificate-based provisioning is the only way that scales',
      'Manual registration is actually faster than automated provisioning for any fleet size',
      'Automation is only relevant for fleets smaller than 10 devices',
      'Fleet provisioning has nothing to do with the number of devices involved'
    ],
    correctIndex: 0,
    explanation: 'At a scale of tens or hundreds of thousands of devices, manually registering each one simply isn\'t feasible — automated provisioning, using a unique certificate burned in at manufacturing, is what makes onboarding an entire fleet possible without a human touching each device.',
    hints: [
      'Think about literally trying to manually type in configuration for 50,000 separate devices — where does that break down?',
      'The certificate burned in at manufacturing is exactly what makes automatic recognition possible later.',
      'The correct answer is: manual per-device setup doesn\'t scale; automated, certificate-based provisioning is the only practical option.',
    ],
    xp: 45,
    tool: { name: 'Fleet provisioning at scale', icon: '🏭', description: 'Automated, certificate-based onboarding is the only way to register a massive device fleet.', fun: 3 },
  },
  {
    id: 'iot-pool-15-mcq-timeseries-db',
    kind: 'mcq',
    npc: 'Data Deva',
    title: 'Why Not Just Use a Regular Database',
    prompt: 'What is a time-series database specifically optimized for, that a general-purpose relational database isn\'t?',
    options: [
      'Extremely high-volume, append-heavy writes of timestamped data, plus efficient range queries and downsampling/aggregation over time — patterns that overwhelm a typical general-purpose database',
      'Storing only text data, never numbers',
      'It\'s identical to a relational database, just renamed',
      'It can only store exactly one data point per day'
    ],
    correctIndex: 0,
    explanation: 'Sensor data is a firehose of timestamped writes with very specific query patterns (recent data at full resolution, older data summarized). Time-series databases are purpose-built for exactly that write volume and those query/downsampling patterns — a general relational database would struggle at real IoT scale.',
    hints: [
      'Think about the SHAPE of the workload: massive volumes of timestamped writes, plus queries that often want a RANGE of time, not one exact row.',
      'It\'s a different tool because the write and query PATTERNS are different, not because the data type itself is special.',
      'The correct answer is: optimized for high-volume timestamped writes and efficient time-range queries/downsampling.',
    ],
    xp: 50,
    tool: { name: 'Time-series databases', icon: '📊', description: 'Purpose-built for high-volume timestamped writes and time-range queries, unlike a general relational database.', fun: 3 },
  },
  {
    id: 'iot-pool-16-mcq-maintenance-types',
    kind: 'mcq',
    npc: 'Data Deva',
    title: 'Three Ways to Maintain a Machine',
    prompt: "What's the difference between reactive, preventive, and predictive maintenance?",
    options: [
      'Reactive fixes a machine only after it fails; preventive services it on a fixed schedule regardless of actual condition; predictive services it based on real sensor data showing it actually needs attention',
      'They are three names for the exact same maintenance approach',
      'Predictive maintenance means guessing randomly when to service a machine',
      'Reactive maintenance means servicing a machine before it\'s even installed'
    ],
    correctIndex: 0,
    explanation: 'Reactive maintenance waits for failure (often costly). Preventive maintenance services on a fixed calendar/usage schedule, whether it\'s actually needed or not (can waste effort, or still miss unexpected failures). Predictive maintenance uses real sensor data trends to service exactly when the machine\'s actual condition warrants it — the approach this whole zone\'s predictive maintenance flow is built around.',
    hints: [
      'One waits for failure; one follows a fixed calendar regardless of real condition; one follows the machine\'s ACTUAL, real-time condition.',
      'Predictive is specifically data-driven — using real sensor trends, not a calendar or a guess.',
      'The correct answer is: reactive = after failure, preventive = fixed schedule regardless of condition, predictive = based on real condition data.',
    ],
    xp: 55,
    tool: { name: 'Reactive vs. preventive vs. predictive maintenance', icon: '🔧', description: 'After failure, on a fixed schedule, or based on real condition data — three very different strategies.', fun: 4 },
  },
  {
    id: 'iot-pool-17-mcq-lpwan',
    kind: 'mcq',
    npc: 'Sensor Sally',
    title: 'What LPWAN Is Actually For',
    prompt: 'What is an LPWAN (Low-Power Wide-Area Network), like LoRaWAN, designed for?',
    options: [
      'Long-range, low-bandwidth communication for battery-powered sensors that report infrequently — trading speed and data volume for range and years of battery life',
      'The fastest possible data transfer for high-definition video streaming',
      'Only works within a single room, like Bluetooth',
      'Requires the device to be plugged into mains power at all times'
    ],
    correctIndex: 0,
    explanation: 'LPWAN technologies like LoRaWAN are built for the opposite priorities of WiFi — they trade away bandwidth and speed in exchange for covering miles of range on a battery that can last years, which fits infrequent sensor readings (like a field moisture sensor) far better than a data-hungry protocol would.',
    hints: [
      'It deliberately trades away bandwidth/speed for something else entirely — think about what kind of sensor would actually want that tradeoff.',
      'A remote field sensor reporting once an hour doesn\'t need speed — it needs range and years of battery life.',
      'The correct answer is: long-range, low-bandwidth communication for infrequent-reporting, battery-powered sensors.',
    ],
    xp: 45,
    tool: { name: 'LPWAN', icon: '📡', description: 'Trades bandwidth and speed for long range and years of battery life — built for infrequent sensor reports.', fun: 3 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'iot-pool-18-match-stacklayers',
    kind: 'matching',
    npc: 'Chief Engineer Vega',
    title: 'IoT Stack Layers',
    prompt: 'Match each IoT stack layer to its role.',
    pairs: [
      { id: 'a', left: 'Device/Sensor', right: 'Reads the physical world — temperature, vibration, a door opening' },
      { id: 'b', left: 'Connectivity', right: 'Carries the reading off the device, e.g. via MQTT' },
      { id: 'c', left: 'Edge', right: 'Processes data close to the device, before it reaches the cloud' },
      { id: 'd', left: 'Cloud', right: 'Ingests, stores, and makes data available for dashboards and further processing' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Device and Connectivity are the FIRST two steps — reading the world, then getting the reading off the device; Edge and Cloud are what happens to it AFTER that.',
      'Edge processes near the device, before the cloud ever sees the data.',
      'Device/Sensor → reads the physical world. Connectivity → carries the reading off-device. Edge → processes near the device. Cloud → ingests/stores/serves.',
    ],
    xp: 60,
    successMessage: 'Every layer a single sensor reading passes through, matched to its exact job.',
    tool: { name: 'IoT stack layers', icon: '🗼', description: 'Device, connectivity, edge, and cloud compared.', fun: 3 },
  },
  {
    id: 'iot-pool-19-match-wirelessprotocols',
    kind: 'matching',
    npc: 'Sensor Sally',
    title: 'Wireless Protocol Tradeoffs',
    prompt: 'Match each wireless protocol to its actual tradeoff.',
    pairs: [
      { id: 'a', left: 'Zigbee', right: 'Short range, low power — smart home devices within one building' },
      { id: 'b', left: 'WiFi', right: 'Medium range, higher power draw — everyday consumer devices' },
      { id: 'c', left: 'LoRaWAN', right: 'Very long range, very low power, low bandwidth — remote field sensors reporting infrequently' },
      { id: 'd', left: 'Bluetooth', right: 'Very short range, very low power — direct device-to-device pairing' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'These four span a real range/power spectrum — Bluetooth and Zigbee are both short-range, but Bluetooth is typically a direct pairing, not a whole mesh network.',
      'LoRaWAN sacrifices bandwidth entirely in exchange for the longest range and lowest power of the four.',
      'Zigbee → short range, low power, smart home. WiFi → medium range, higher power. LoRaWAN → very long range, very low power/bandwidth. Bluetooth → very short range, direct pairing.',
    ],
    xp: 65,
    successMessage: 'Four wireless protocols, each with a genuinely different range/power/bandwidth tradeoff, matched up.',
    tool: { name: 'Wireless protocol tradeoffs', icon: '📶', description: 'Zigbee, WiFi, LoRaWAN, and Bluetooth compared.', fun: 4 },
  },
  {
    id: 'iot-pool-20-match-awsiotvocab',
    kind: 'matching',
    npc: 'Chief Engineer Vega',
    title: 'AWS IoT Vocabulary',
    prompt: 'Match each AWS IoT term to its meaning.',
    pairs: [
      { id: 'a', left: 'IoT Core', right: 'Ingests device messages over MQTT and manages device connections' },
      { id: 'b', left: 'Rules Engine', right: 'Routes incoming messages to the right destination — S3, DynamoDB, Lambda' },
      { id: 'c', left: 'Device Shadow', right: 'A cached last-known state of a device, queryable even while the device is offline' },
      { id: 'd', left: 'Fleet Provisioning', right: 'Automatically registers new devices at scale, using certificates burned in at manufacturing' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'IoT Core and Rules Engine both handle a message the MOMENT it arrives; Device Shadow and Fleet Provisioning both deal with device STATE and ONBOARDING respectively.',
      'A Device Shadow lets you query or even set a device\'s state without needing it to be online right now.',
      'IoT Core → ingests messages, manages connections. Rules Engine → routes messages onward. Device Shadow → cached device state, works offline. Fleet Provisioning → automated bulk onboarding.',
    ],
    xp: 65,
    successMessage: 'The core AWS IoT vocabulary, matched to its exact role.',
    tool: { name: 'AWS IoT vocabulary', icon: '☁️', description: 'IoT Core, Rules Engine, Device Shadow, and Fleet Provisioning.', fun: 4 },
  },
  {
    id: 'iot-pool-21-match-maintenancestrategies',
    kind: 'matching',
    npc: 'Data Deva',
    title: 'Maintenance Strategies',
    prompt: 'Match each maintenance strategy to how it actually decides when to act.',
    pairs: [
      { id: 'a', left: 'Reactive maintenance', right: 'Fix it only after it has already failed' },
      { id: 'b', left: 'Preventive maintenance', right: 'Service on a fixed schedule, whether it\'s actually needed or not' },
      { id: 'c', left: 'Predictive maintenance', right: 'Service based on real sensor data showing it actually needs attention' },
      { id: 'd', left: 'Condition-based maintenance', right: 'Service triggered by a specific measured threshold being crossed, checked periodically rather than continuously modeled' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Reactive and Preventive both ignore real-time condition data (one waits for failure, one follows a calendar); Predictive and Condition-based both react to actual measurements, just with different levels of sophistication.',
      'Predictive typically uses trend/pattern analysis over time; condition-based is often a simpler threshold check.',
      'Reactive → after failure. Preventive → fixed schedule regardless of condition. Predictive → data-driven trend analysis. Condition-based → triggered by a measured threshold.',
    ],
    xp: 70,
    successMessage: 'Four ways to decide when a machine needs attention, matched to what actually triggers each one.',
    tool: { name: 'Maintenance strategies', icon: '🔧', description: 'Reactive, preventive, predictive, and condition-based maintenance compared.', fun: 4 },
  },
  {
    id: 'iot-pool-22-match-mqttvocab',
    kind: 'matching',
    npc: 'Sensor Sally',
    title: 'MQTT Vocabulary',
    prompt: 'Match each MQTT term to its meaning.',
    pairs: [
      { id: 'a', left: 'Topic', right: 'The named channel a message is published to and subscribed from' },
      { id: 'b', left: 'Payload', right: 'The actual data carried inside a message' },
      { id: 'c', left: 'Broker', right: 'The server that routes messages from publishers to subscribers' },
      { id: 'd', left: 'QoS (Quality of Service)', right: 'The delivery guarantee level — at most once, at least once, or exactly once' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Topic and Payload describe the pieces of ONE message; Broker and QoS describe HOW that message actually gets delivered.',
      'The broker is the middleman doing the routing; QoS is the promise about HOW RELIABLY it does that routing.',
      'Topic → the named channel. Payload → the actual data. Broker → routes messages between pub/sub. QoS → the delivery guarantee level.',
    ],
    xp: 60,
    successMessage: 'The core MQTT vocabulary, matched to its exact role in every message.',
    tool: { name: 'MQTT vocabulary', icon: '📤', description: 'Topic, payload, broker, and QoS.', fun: 3 },
  },
  {
    id: 'iot-pool-23-match-iiotterms',
    kind: 'matching',
    npc: 'Data Deva',
    title: 'Industrial IoT Vocabulary',
    prompt: 'Match each Industrial IoT term to its meaning.',
    pairs: [
      { id: 'a', left: 'PLC', right: 'The machine\'s own onboard controller — its "brain"' },
      { id: 'b', left: 'SCADA', right: 'A system that supervises and controls industrial processes across a whole facility' },
      { id: 'c', left: 'OPC-UA', right: 'An industrial protocol that carries data from a PLC to other industrial systems' },
      { id: 'd', left: 'Historian', right: 'A database specifically built to archive years of industrial process data' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'PLC and SCADA describe two different SCOPES of control (one machine vs. a whole facility); OPC-UA and Historian describe how data actually MOVES and gets STORED between them.',
      'OPC-UA is specifically the protocol carrying data between industrial systems; a Historian is where that data ends up archived.',
      'PLC → one machine\'s onboard controller. SCADA → supervises a whole facility. OPC-UA → industrial data protocol. Historian → archives long-term process data.',
    ],
    xp: 65,
    successMessage: 'The core Industrial IoT vocabulary, matched to its exact role on the factory floor.',
    tool: { name: 'Industrial IoT vocabulary', icon: '🏭', description: 'PLC, SCADA, OPC-UA, and Historian.', fun: 4 },
  },
  {
    id: 'iot-pool-24-match-otavocab',
    kind: 'matching',
    npc: 'Edge Eddie',
    title: 'OTA Rollout Vocabulary',
    prompt: 'Match each OTA (over-the-air) rollout term to its meaning.',
    pairs: [
      { id: 'a', left: 'Canary release', right: 'Rolling a new firmware out to a small subset of devices first, to limit risk' },
      { id: 'b', left: 'Rollback', right: 'Reverting devices back to the previous firmware version if something goes wrong' },
      { id: 'c', left: 'Fleet', right: 'The full set of devices a rollout is targeting' },
      { id: 'd', left: 'Firmware', right: 'The low-level software running directly on the device itself' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Canary release and Rollback are both about MANAGING RISK during a rollout; Fleet and Firmware describe WHAT is actually being rolled out, and to whom.',
      'A canary release limits risk going forward; a rollback undoes it after the fact if something already went wrong.',
      'Canary release → small-subset rollout first. Rollback → reverts to the previous version. Fleet → the full set of targeted devices. Firmware → the device\'s own low-level software.',
    ],
    xp: 60,
    successMessage: 'The core OTA rollout vocabulary, matched to its exact role in safely updating a fleet.',
    tool: { name: 'OTA rollout vocabulary', icon: '📲', description: 'Canary release, rollback, fleet, and firmware.', fun: 3 },
  },
  {
    id: 'iot-pool-25-match-timeseriesvocab',
    kind: 'matching',
    npc: 'Data Deva',
    title: 'Time-Series & Storage Vocabulary',
    prompt: 'Match each time-series/storage term to its meaning.',
    pairs: [
      { id: 'a', left: 'Time-series database', right: 'A database purpose-built for high-volume, timestamped writes and time-range queries' },
      { id: 'b', left: 'Downsampling', right: 'Reducing data resolution over time — e.g. keeping one average per hour instead of every raw reading' },
      { id: 'c', left: 'Aggregation', right: 'Combining many data points into a summary value, like a sum or average' },
      { id: 'd', left: 'Retention policy', right: 'A rule defining how long data is kept before it\'s automatically deleted or downsampled further' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Time-series database is the STORAGE SYSTEM itself; Downsampling, Aggregation, and Retention policy are all TECHNIQUES applied to data living inside it.',
      'Downsampling and Aggregation are closely related — downsampling is essentially applying aggregation across a coarser time window.',
      'Time-series database → purpose-built for timestamped writes/queries. Downsampling → reduces resolution over time. Aggregation → combines points into a summary. Retention policy → how long data is kept before it\'s reduced/deleted.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind how sensor data actually gets stored long-term, matched up.',
    tool: { name: 'Time-series & storage vocabulary', icon: '📊', description: 'Time-series databases, downsampling, aggregation, and retention policies.', fun: 4 },
  },
  {
    id: 'iot-pool-26-match-edgecloud',
    kind: 'matching',
    npc: 'Edge Eddie',
    title: 'Edge vs. Cloud Vocabulary',
    prompt: 'Match each edge-vs-cloud term to its meaning.',
    pairs: [
      { id: 'a', left: 'Edge computing', right: 'Processing data physically close to where it\'s generated' },
      { id: 'b', left: 'Cloud computing', right: 'Processing data in large, centralized data centers, farther from the source' },
      { id: 'c', left: 'Latency', right: 'The delay between something happening and a system reacting to it' },
      { id: 'd', left: 'Bandwidth', right: 'How much data can actually be transmitted over a connection in a given time' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Edge computing and Cloud computing are the two PLACES processing can happen; Latency and Bandwidth are the two COSTS that decide which place makes sense for a given task.',
      'Strict latency requirements push processing toward the edge; bandwidth-constrained links push toward filtering data before it ever needs to travel far.',
      'Edge computing → processes near the source. Cloud computing → processes in centralized data centers. Latency → delay before a reaction. Bandwidth → how much data a connection can carry.',
    ],
    xp: 60,
    successMessage: 'The core vocabulary behind every edge-vs-cloud tradeoff, matched up.',
    tool: { name: 'Edge vs. cloud vocabulary', icon: '⚖️', description: 'Edge computing, cloud computing, latency, and bandwidth.', fun: 3 },
  },
]
