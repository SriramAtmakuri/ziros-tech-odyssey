// IoT Outpost — MQTT, edge computing, AWS IoT, device security, predictive
// maintenance. Reuses the 'sequence' kind for architecture/process ordering
// and the 'python' kind (Pyodide execution, plain stdlib only, no real
// network) for the two hands-on challenges — no new panel types.

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

export const IOT_OUTPOST_CHALLENGES = [
  {
    id: 'iot-01-stack-layers',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'The Full IoT Stack',
    prompt: 'Order every layer a sensor reading passes through, from the physical device to the dashboard someone actually looks at.',
    items: [
      { id: 'device', label: 'Device / Sensor' },
      { id: 'connectivity', label: 'Connectivity (MQTT)' },
      { id: 'edge', label: 'Edge' },
      { id: 'cloud', label: 'Cloud' },
      { id: 'storage', label: 'Storage' },
      { id: 'visualization', label: 'Visualization' },
    ],
    correctOrder: ['device', 'connectivity', 'edge', 'cloud', 'storage', 'visualization'],
    successMessage: 'Every layer of the stack, from the sensor reading the world to the dashboard someone actually looks at.',
    hints: [
      'Data always starts at a physical sensor and ends at something a human can see.',
      'MQTT carries the reading off the device before any processing — edge or cloud — can happen to it.',
      'Device/Sensor → Connectivity (MQTT) → Edge → Cloud → Storage → Visualization',
    ],
    xp: 82,
    tool: { name: 'IoT stack', icon: '🗼', description: 'Device, connectivity, edge, cloud, storage, visualization — every layer a sensor reading passes through.', fun: 4 },
  },

  {
    id: 'iot-02-protocol-tradeoffs',
    kind: 'sequence',
    npc: 'Sensor Sally',
    title: 'Range vs. Power vs. Bandwidth',
    prompt: 'Order these wireless protocols from shortest to longest range.',
    items: [
      { id: 'zigbee', label: 'Zigbee (short range, low power, smart home)' },
      { id: 'wifi', label: 'WiFi/MQTT (medium range, higher power, consumer devices)' },
      { id: 'lorawan', label: 'LoRaWAN (very long range, very low power, remote field sensors)' },
    ],
    correctOrder: ['zigbee', 'wifi', 'lorawan'],
    successMessage: 'Shortest to longest range — and notice power draw doesn\'t move in a straight line with range.',
    hints: [
      'Think about where each protocol is actually deployed: inside one room, across one building, or across an entire field.',
      'Zigbee barely leaves the house; LoRaWAN can cross miles with no cell tower anywhere nearby.',
      'Zigbee → WiFi/MQTT → LoRaWAN',
    ],
    xp: 55,
    tool: { name: 'Wireless protocol tradeoffs', icon: '📶', description: 'Range, power, and bandwidth trade off differently across Zigbee, WiFi, and LoRaWAN.', fun: 3 },
  },

  {
    id: 'iot-03-aws-iot-pipeline',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'A Sensor Reading\'s Journey to the Cloud',
    prompt: 'Order the path a single sensor reading takes to reach AWS and get routed somewhere useful.',
    items: [
      { id: 'sensor', label: 'Physical Sensor' },
      { id: 'mqtt', label: 'MQTT' },
      { id: 'core', label: 'AWS IoT Core' },
      { id: 'rules', label: 'Rules Engine' },
      { id: 'routed', label: 'Routed to S3 / DynamoDB / Lambda' },
    ],
    correctOrder: ['sensor', 'mqtt', 'core', 'rules', 'routed'],
    successMessage: 'That\'s the whole journey a single reading takes, from a physical sensor to a place a human or app can use it.',
    hints: [
      'The reading has to leave the device before AWS can see it at all.',
      'AWS IoT Core hands the message to the Rules Engine, which decides where it actually ends up.',
      'Physical Sensor → MQTT → AWS IoT Core → Rules Engine → Routed to S3/DynamoDB/Lambda',
    ],
    xp: 80,
    tool: { name: 'AWS IoT pipeline', icon: '☁️', description: 'IoT Core ingests over MQTT; the Rules Engine routes each message to storage, a database, or a function.', fun: 4 },
  },

  {
    id: 'iot-04-edge-vs-cloud',
    kind: 'sequence',
    npc: 'Edge Eddie',
    title: 'How Fast Does This Decision Need to Be?',
    prompt: 'Order these three systems from the STRICTEST latency requirement to the most relaxed.',
    items: [
      { id: 'vehicle', label: 'Autonomous vehicle braking (under 1ms, needs edge processing)' },
      { id: 'factory', label: 'Factory defect detection (about 50ms is fine, edge processing)' },
      { id: 'thermostat', label: 'Smart home thermostat (a 1-second delay is fine, can go to the cloud)' },
    ],
    correctOrder: ['vehicle', 'factory', 'thermostat'],
    successMessage: 'Strictest latency first — the less time you have to decide, the closer to the sensor that decision has to happen.',
    hints: [
      'Ask which system fails catastrophically if the decision takes even a few extra milliseconds.',
      'A car deciding whether to brake can\'t wait on a round trip to the cloud; a thermostat barely notices a one-second delay.',
      'Autonomous vehicle braking → Factory defect detection → Smart home thermostat',
    ],
    xp: 60,
    tool: { name: 'Latency-driven architecture', icon: '⏱️', description: 'The stricter the latency requirement, the closer processing has to move to the device.', fun: 4 },
  },

  {
    id: 'iot-05-edge-setup',
    kind: 'sequence',
    npc: 'Edge Eddie',
    title: 'Processing Close to the Source',
    prompt: 'Order this edge computing setup, from raw sensor data to a filtered signal reaching the cloud.',
    items: [
      { id: 'collect', label: 'Sensor collects raw data' },
      { id: 'receive', label: 'Edge device receives it' },
      { id: 'infer', label: 'Local ML model runs inference on-device' },
      { id: 'send', label: 'Only anomalies get sent to the cloud' },
    ],
    correctOrder: ['collect', 'receive', 'infer', 'send'],
    successMessage: 'Raw data never has to leave the building unless it\'s actually worth the cloud\'s attention.',
    hints: [
      'The edge device can\'t do anything until the raw reading actually reaches it.',
      'Inference happens locally, on the edge device, before anything gets sent onward.',
      'Sensor collects raw data → Edge device receives it → Local ML model runs inference → Only anomalies get sent to the cloud',
    ],
    xp: 65,
    tool: { name: 'Edge inference', icon: '🧠', description: 'Running the model on-device means only the anomalies need the round trip to the cloud.', fun: 4 },
  },

  {
    id: 'iot-06-device-security',
    kind: 'sequence',
    npc: 'Sensor Sally',
    title: 'Trusting a Device',
    prompt: 'Order the steps for setting up a new IoT device securely.',
    items: [
      { id: 'cert', label: 'Provision a unique device certificate' },
      { id: 'tls', label: 'Enable TLS encryption for all communication' },
      { id: 'register', label: "Register the device's identity in AWS IoT Core" },
      { id: 'rotate', label: 'Rotate certificates periodically' },
    ],
    correctOrder: ['cert', 'tls', 'register', 'rotate'],
    successMessage: 'Identity first, then encrypted transport, then a registered identity the cloud can trust, then keeping it all fresh forever.',
    hints: [
      'A device needs its own identity before it can prove who it is to anything.',
      'Encryption comes before you register a trusted identity over that connection; rotation is ongoing maintenance, always last.',
      'Provision a unique device certificate → Enable TLS encryption → Register identity in AWS IoT Core → Rotate certificates periodically',
    ],
    xp: 65,
    tool: { name: 'Device identity & security', icon: '🔐', description: 'Certificates, TLS, registration, and rotation — the lifecycle of trusting a device.', fun: 3 },
  },

  {
    id: 'iot-07-mqtt-publisher',
    kind: 'python',
    npc: 'Sensor Sally',
    title: 'Publishing Sensor Readings',
    prompt: "Write a function publish_readings(sensor_id, readings) that returns a list of dicts, one per reading: {'topic': f'sensors/{sensor_id}/temperature', 'payload': reading}. Call it with sensor_id = 'sensor-7' and readings = [21.5, 22.0, 21.8], and store the returned list in `result`.",
    starter: "def publish_readings(sensor_id, readings):\n    pass  # return a list of {'topic': ..., 'payload': ...} dicts\n\nresult = []  # call publish_readings and store the list here\n",
    hints: [
      'Build one dict per reading, with a topic string that includes the sensor_id and a payload holding that reading\'s value.',
      "The topic is the same for every reading from this sensor: f'sensors/{sensor_id}/temperature'.",
      "def publish_readings(sensor_id, readings):\n    return [{'topic': f'sensors/{sensor_id}/temperature', 'payload': r} for r in readings]\n\nresult = publish_readings('sensor-7', [21.5, 22.0, 21.8])",
    ],
    xp: 70,
    tool: { name: 'MQTT publish shape', icon: '📤', description: 'Every MQTT message is just a topic string plus a payload — modeled here as a plain dict.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [
      { topic: 'sensors/sensor-7/temperature', payload: 21.5 },
      { topic: 'sensors/sensor-7/temperature', payload: 22.0 },
      { topic: 'sensors/sensor-7/temperature', payload: 21.8 },
    ]) ?? { success: true, message: 'Three readings, three published messages, each tagged with the right topic.' },
  },

  {
    id: 'iot-08-anomaly-detection',
    kind: 'python',
    npc: 'Edge Eddie',
    title: 'Catching the First Anomaly',
    prompt: "A wind turbine's vibration readings just came in: readings = [72, 74, 73, 75, 110, 76, 74], threshold = 100. Find the INDEX of the first reading that exceeds the threshold, and store it (an int) in `result`.",
    starter: 'readings = [72, 74, 73, 75, 110, 76, 74]\nthreshold = 100\nresult = None  # find the index of the first reading over threshold\n',
    hints: [
      'Loop through the readings along with their index, using enumerate().',
      'As soon as a reading exceeds the threshold, that index is your answer — you can stop looking right there.',
      'for i, r in enumerate(readings):\n    if r > threshold:\n        result = i\n        break',
    ],
    xp: 70,
    tool: { name: 'Threshold anomaly detection', icon: '📈', description: 'The simplest anomaly detector: flag the first value that crosses a fixed threshold.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 4) ?? { success: true, message: 'Reading 4 — the spike to 110 — caught the moment it happened.' },
  },

  {
    id: 'iot-09-iiot-architecture',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'Industrial IoT, End to End',
    prompt: 'Order the path a machine\'s data takes through a full Industrial IoT architecture.',
    items: [
      { id: 'plc', label: 'PLC (Programmable Logic Controller — the machine\'s brain)' },
      { id: 'opcua', label: 'OPC-UA (industrial protocol)' },
      { id: 'scada', label: 'SCADA/Historian (collects and stores machine data)' },
      { id: 'cloud', label: 'Cloud Platform' },
      { id: 'model', label: 'Predictive Maintenance Model' },
    ],
    correctOrder: ['plc', 'opcua', 'scada', 'cloud', 'model'],
    successMessage: 'From the machine\'s own brain all the way to a model predicting its next failure.',
    hints: [
      'The PLC is the machine itself — everything downstream exists to get its data somewhere useful.',
      'OPC-UA carries the PLC\'s data to SCADA before any of it ever leaves the factory floor for the cloud.',
      'PLC → OPC-UA → SCADA/Historian → Cloud Platform → Predictive Maintenance Model',
    ],
    xp: 85,
    tool: { name: 'IIoT architecture', icon: '🏭', description: 'PLC → OPC-UA → SCADA/Historian → cloud → predictive model — the classic industrial data path.', fun: 4 },
  },

  {
    id: 'iot-10-predictive-maintenance',
    kind: 'sequence',
    npc: 'Data Deva',
    title: 'Fixing It Before It Breaks',
    prompt: 'Order a predictive maintenance flow, from continuous monitoring to the machine actually getting serviced.',
    items: [
      { id: 'collect', label: 'Collect vibration data continuously' },
      { id: 'baseline', label: 'Establish a normal baseline' },
      { id: 'detect', label: 'Detect an anomaly in the pattern' },
      { id: 'ticket', label: 'Create a maintenance ticket' },
      { id: 'service', label: 'Service the machine before it fails' },
    ],
    correctOrder: ['collect', 'baseline', 'detect', 'ticket', 'service'],
    successMessage: 'Caught before the failure, not after. That\'s the entire point of predictive maintenance.',
    hints: [
      'You can\'t know what\'s abnormal until you know what normal looks like first.',
      'A ticket only gets created after an anomaly is actually detected against the baseline.',
      'Collect vibration data → Establish a normal baseline → Detect an anomaly → Create a maintenance ticket → Service the machine before it fails',
    ],
    xp: 82,
    tool: { name: 'Predictive maintenance', icon: '🔧', description: 'Baseline, detect, ticket, service — fixing machines before they break instead of after.', fun: 4 },
  },

  {
    id: 'iot-11-ota-rollout',
    kind: 'sequence',
    npc: 'Data Deva',
    title: 'Updating 200,000 Devices Safely',
    prompt: 'Order a staged OTA (over-the-air) firmware rollout across a huge device fleet.',
    items: [
      { id: 'canary', label: 'Target just 1% of devices first' },
      { id: 'monitor', label: 'Monitor the error rate closely' },
      { id: 'rollout', label: 'Roll out to the remaining 100%' },
      { id: 'rollback', label: 'Roll back immediately if errors spike' },
    ],
    correctOrder: ['canary', 'monitor', 'rollout', 'rollback'],
    successMessage: 'Canary first, watch closely, then scale — with rollback always one step away.',
    hints: [
      'Never push new firmware to all 200,000 devices simultaneously — start impossibly small.',
      'You watch the canary group closely before committing to the remaining 99%.',
      'Target just 1% of devices first → Monitor the error rate closely → Roll out to the remaining 100% → Roll back immediately if errors spike',
    ],
    xp: 65,
    tool: { name: 'Staged OTA rollout', icon: '📲', description: 'Canary release, monitor, then scale — with rollback always one step away.', fun: 4 },
  },

  {
    id: 'iot-12-final-boss',
    kind: 'sequence',
    npc: 'Chief Engineer Vega',
    title: 'Bringing the Outpost Back Online',
    prompt: 'The Outpost\'s 50,000 sensors have gone silent. Order the full recovery, from reconnecting the hardware to a live dashboard the whole team can trust.',
    items: [
      { id: 'reconnect', label: 'Reconnect sensors using the correct protocols' },
      { id: 'route', label: 'Route all data through AWS IoT Core' },
      { id: 'edge', label: 'Deploy edge processing for real-time filtering' },
      { id: 'restore', label: 'Restore the time-series data pipeline' },
      { id: 'dashboard', label: 'Build a live dashboard showing every sensor' },
    ],
    correctOrder: ['reconnect', 'route', 'edge', 'restore', 'dashboard'],
    successMessage: '50,000 sensors, back online, filtered at the edge, flowing through the pipeline, visible on one dashboard. The Outpost can see again.',
    hints: [
      'Nothing else matters until the sensors are physically talking again, each using the right protocol.',
      'Data needs a central ingestion point and edge filtering before it\'s worth restoring the storage pipeline for.',
      'Reconnect sensors → Route through AWS IoT Core → Deploy edge processing → Restore the time-series pipeline → Build a live dashboard',
    ],
    xp: 220,
    tool: { name: 'IoT Outpost Commander', icon: '📡', description: 'Reconnected 50,000 silent sensors end-to-end — protocols, ingestion, edge filtering, storage, and a live dashboard.', fun: 5 },
  },
]

export const IOT_OUTPOST_ZONE = {
  id: 'iot-outpost',
  name: 'IoT Outpost',
  palette: { bg: '#3f2f1f', ground: 0x78716c, groundAccent: 0x57534e },
  decor: { kind: 'server' },
  npcIntro: {
    name: 'Chief Engineer Vega',
    lines: [
      "Ziro — thank goodness. The Outpost has gone dark.",
      "Fifty thousand sensors, and not one of them is talking to us. The control room is completely blind.",
      "Every sensor out there is a tiny voice reporting one fact — a temperature, a vibration, a door opening — and none of it means anything until that voice reaches somewhere a human, or a system, is actually listening.",
      "Machines are still running out there, unmonitored, and that's dangerous — a bearing could be failing right now and we'd never know.",
      "Help us reconnect every sensor, get the data flowing again, and build monitoring we can actually trust. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Chief Engineer Vega', color: 0xf59e0b, role: 'main' },
    { x: 2020, y: 560, name: 'Sensor Sally', color: 0x38bdf8, flavor: 'Every protocol has a trade-off — range, power, bandwidth. Pick the wrong one and your sensor dies in a week.' },
    { x: 260, y: 860, name: 'Edge Eddie', color: 0x22c55e, flavor: 'Why wait for the cloud when the answer can happen right here, on the device?' },
    { x: 2020, y: 1160, name: 'Data Deva', color: 0xa78bfa, flavor: 'A sensor reading is just noise until it\'s on a dashboard someone actually looks at.' },
  ],
  challenges: IOT_OUTPOST_CHALLENGES,
  nextZone: 'web-dev-workshop',
}
