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

export const SUPPLY_CHAIN_DOCKS_CHALLENGES = [
  {
    id: 'sc-01-supply-chain-flow',
    kind: 'sequence',
    npc: 'Port Director Rex',
    title: 'From Raw Material to Doorstep',
    prompt: 'Order the full supply chain, from raw material to the customer\'s door.',
    items: [
      { id: 'supplier', label: 'Supplier' },
      { id: 'manufacturer', label: 'Manufacturer' },
      { id: 'warehouse', label: '3PL Warehouse' },
      { id: 'dc', label: 'Distribution Center' },
      { id: 'lastmile', label: 'Last Mile Delivery' },
      { id: 'customer', label: 'Customer' },
    ],
    correctOrder: ['supplier', 'manufacturer', 'warehouse', 'dc', 'lastmile', 'customer'],
    successMessage: 'Raw material to doorstep, every link accounted for. That\'s the whole chain.',
    hints: [
      'Everything starts with raw materials, and ends with the person who ordered the product.',
      'Goods get made before they get stored, and stored before they get distributed regionally.',
      'Supplier → Manufacturer → 3PL Warehouse → Distribution Center → Last Mile Delivery → Customer',
    ],
    xp: 80,
    tool: { name: 'Supply chain flow', icon: '🔗', description: 'Supplier → Manufacturer → Warehouse → Distribution Center → Last Mile → Customer — the whole chain, link by link.', fun: 4 },
  },

  {
    id: 'sc-02-procure-to-pay',
    kind: 'sequence',
    npc: 'Procurement Pavel',
    title: 'Buying Something, Properly',
    prompt: 'Order the procure-to-pay cycle, from deciding you need something to actually paying for it.',
    items: [
      { id: 'requisition', label: 'Purchase Requisition' },
      { id: 'po', label: 'Purchase Order' },
      { id: 'receipt', label: 'Goods Receipt' },
      { id: 'invoice', label: 'Invoice' },
      { id: 'payment', label: 'Payment' },
    ],
    correctOrder: ['requisition', 'po', 'receipt', 'invoice', 'payment'],
    successMessage: 'Requisition, order, receipt, invoice, payment — the paper trail a good ERP never loses.',
    hints: [
      'Someone has to ask for something internally before a formal order goes out to a supplier.',
      'The goods have to arrive before the invoice gets matched against them, and the invoice comes before payment.',
      'Purchase Requisition → Purchase Order → Goods Receipt → Invoice → Payment',
    ],
    xp: 75,
    tool: { name: 'Procure-to-pay', icon: '📋', description: 'Requisition → PO → Goods Receipt → Invoice → Payment — the standard P2P cycle behind every SAP-style ERP.', fun: 4 },
  },

  {
    id: 'sc-03-warehouse-ops',
    kind: 'sequence',
    npc: 'Warehouse Wanda',
    title: 'A Package\'s Journey Through the Warehouse',
    prompt: 'Order the stages a package moves through inside a warehouse, from arrival to leaving on a truck.',
    items: [
      { id: 'receive', label: 'Receive goods' },
      { id: 'putaway', label: 'Putaway (shelve it)' },
      { id: 'storage', label: 'Storage' },
      { id: 'pick', label: 'Pick (for an order)' },
      { id: 'pack', label: 'Pack' },
      { id: 'ship', label: 'Ship' },
    ],
    correctOrder: ['receive', 'putaway', 'storage', 'pick', 'pack', 'ship'],
    successMessage: 'Receive, shelve, store, pick, pack, ship — every crate follows this exact path.',
    hints: [
      'A package can\'t be shelved before it\'s been received, and it can\'t be picked before it\'s been shelved somewhere.',
      'It sits in storage until an order calls for it — that\'s when picking starts.',
      'Receive goods → Putaway → Storage → Pick → Pack → Ship',
    ],
    xp: 85,
    tool: { name: 'Warehouse operations', icon: '📦', description: 'Receive → putaway → storage → pick → pack → ship — the core WMS workflow.', fun: 4 },
  },

  {
    id: 'sc-04-reorder-point',
    kind: 'python',
    npc: 'Warehouse Wanda',
    title: 'When to Reorder',
    prompt: 'The warehouse needs to know when to place a new order before it runs out of stock. Given avg_daily_demand = 40, lead_time_days = 5, and safety_stock = 60, compute the reorder point using reorder_point = (avg_daily_demand * lead_time_days) + safety_stock. Store the answer as an int in `result`.',
    starter: 'avg_daily_demand = 40\nlead_time_days = 5\nsafety_stock = 60\nresult = None\n',
    hints: [
      'The reorder point covers demand during the lead time, plus a safety buffer.',
      'Multiply avg_daily_demand by lead_time_days first, then add safety_stock.',
      'result = (avg_daily_demand * lead_time_days) + safety_stock',
    ],
    xp: 70,
    tool: { name: 'Reorder point', icon: '🔔', description: '(avg daily demand × lead time) + safety stock — the trigger for placing a new order before you run dry.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 260) ?? { success: true, message: 'At 260 units left, a new order goes out automatically. No stockouts, no panic.' },
  },

  {
    id: 'sc-05-bullwhip-effect',
    kind: 'sequence',
    npc: 'Port Director Rex',
    title: 'A Small Ripple, A Huge Wave',
    prompt: 'Order how the bullwhip effect amplifies a tiny demand change as it moves upstream through the supply chain.',
    items: [
      { id: 'demand', label: 'A small change in consumer demand' },
      { id: 'retailer', label: 'The retailer over-orders to compensate' },
      { id: 'distributor', label: 'The distributor over-orders even more' },
      { id: 'manufacturer', label: 'The manufacturer over-orders the most of all' },
    ],
    correctOrder: ['demand', 'retailer', 'distributor', 'manufacturer'],
    successMessage: 'A tiny ripple at the register becomes a tidal wave by the time it reaches the factory. That\'s the bullwhip effect.',
    hints: [
      'The distortion starts small, right where the customer buys something.',
      'Each link up the chain overreacts a little more than the one before it.',
      'Small demand change → Retailer over-orders → Distributor over-orders more → Manufacturer over-orders the most',
    ],
    xp: 60,
    tool: { name: 'Bullwhip effect', icon: '🌊', description: 'Small demand swings amplify as they travel upstream — every link overreacts a bit more than the last.', fun: 4 },
  },

  {
    id: 'sc-06-incoterms-fob',
    kind: 'sequence',
    npc: 'Procurement Pavel',
    title: 'Who\'s Responsible, and When',
    prompt: 'Order the responsibility handoff in an FOB (Free On Board) shipment.',
    items: [
      { id: 'load', label: 'Seller loads the goods onto the ship' },
      { id: 'transfer', label: 'Risk transfers to the buyer at the port' },
      { id: 'shipping', label: 'Buyer arranges and pays for shipping' },
      { id: 'receive', label: 'Buyer receives the goods' },
    ],
    correctOrder: ['load', 'transfer', 'shipping', 'receive'],
    successMessage: 'Loaded, transferred at the rail, shipped, received — FOB\'s handoff, exactly where it happens.',
    hints: [
      'The seller\'s job is done the moment the goods are physically on the ship.',
      'FOB means risk transfers at the port of origin, before shipping even begins.',
      'Seller loads the goods → Risk transfers to the buyer at the port → Buyer arranges shipping → Buyer receives the goods',
    ],
    xp: 60,
    tool: { name: 'Incoterms: FOB', icon: '🚢', description: 'Free On Board — risk transfers to the buyer the moment goods cross the ship\'s rail at the origin port.', fun: 3 },
  },

  {
    id: 'sc-07-risk-mapping',
    kind: 'sequence',
    npc: 'Risk Rita',
    title: 'Mapping the Risk Before It Hits',
    prompt: 'Order a supply chain risk assessment, from mapping suppliers to actually responding to a disruption.',
    items: [
      { id: 'tier1', label: 'Map your Tier 1 suppliers (direct suppliers)' },
      { id: 'tier2', label: 'Map Tier 2 suppliers (your suppliers\' suppliers)' },
      { id: 'identify', label: 'Identify a potential disruption' },
      { id: 'contingency', label: 'Activate a contingency plan' },
    ],
    correctOrder: ['tier1', 'tier2', 'identify', 'contingency'],
    successMessage: 'You can\'t manage a risk you haven\'t mapped. Tier 1, then Tier 2, then watch, then act.',
    hints: [
      'You have to know who your direct suppliers are before you can trace who supplies them.',
      'Mapping the whole network comes before spotting a specific risk in it.',
      'Map Tier 1 suppliers → Map Tier 2 suppliers → Identify a potential disruption → Activate a contingency plan',
    ],
    xp: 65,
    tool: { name: 'Supply chain risk mapping', icon: '🗺️', description: 'Map Tier 1, then Tier 2 suppliers, before you can spot — and respond to — a disruption anywhere upstream.', fun: 4 },
  },

  {
    id: 'sc-08-outsourcing-spectrum',
    kind: 'sequence',
    npc: 'Port Director Rex',
    title: 'How Much Do You Hand Off?',
    prompt: 'Order these logistics models from least outsourced to most outsourced.',
    items: [
      { id: 'inhouse', label: 'In-house logistics (you run it all)' },
      { id: '3pl', label: '3PL (a partner runs your warehousing/shipping)' },
      { id: '4pl', label: '4PL (a partner manages your ENTIRE logistics strategy, including other 3PLs)' },
    ],
    correctOrder: ['inhouse', '3pl', '4pl'],
    successMessage: 'In-house, then 3PL, then 4PL — each step hands off more control for more scale.',
    hints: [
      'The least outsourced option is the one where you own and run everything yourself.',
      'A 3PL runs a piece of your logistics; a 4PL runs the whole strategy, even coordinating other 3PLs.',
      'In-house logistics → 3PL → 4PL',
    ],
    xp: 55,
    tool: { name: 'Outsourcing spectrum', icon: '🤝', description: 'In-house → 3PL → 4PL — how much of your logistics you hand off, and to whom.', fun: 3 },
  },

  {
    id: 'sc-09-spend-management',
    kind: 'sequence',
    npc: 'Procurement Pavel',
    title: 'Getting Control of the Spend',
    prompt: 'Order a spend management rollout, from onboarding a supplier to seeing where the money actually goes.',
    items: [
      { id: 'onboarding', label: 'Supplier onboarding' },
      { id: 'catalog', label: 'Product/service catalog' },
      { id: 'po', label: 'Purchase orders' },
      { id: 'contracts', label: 'Contract management' },
      { id: 'analytics', label: 'Spend analytics dashboard' },
    ],
    correctOrder: ['onboarding', 'catalog', 'po', 'contracts', 'analytics'],
    successMessage: 'Onboard, catalog, order, contract, analyze — now every dollar of spend is visible.',
    hints: [
      'A supplier needs to be onboarded before their catalog of products can even exist in the system.',
      'Purchase orders and contracts both need to be in place before a spend dashboard has anything meaningful to show.',
      'Supplier onboarding → Product/service catalog → Purchase orders → Contract management → Spend analytics dashboard',
    ],
    xp: 80,
    tool: { name: 'Spend management', icon: '💳', description: 'Onboarding → catalog → POs → contracts → analytics — turning scattered buying into visible, controlled spend.', fun: 4 },
  },

  {
    id: 'sc-10-eoq',
    kind: 'python',
    npc: 'Warehouse Wanda',
    title: 'The Economically Optimal Order',
    prompt: 'Compute the Economic Order Quantity using EOQ = sqrt((2 * D * S) / H), where D = 1000 (annual demand), S = 50 (ordering cost per order), and H = 4 (holding cost per unit per year). Use math.sqrt. Store the answer as a float in `result`.',
    starter: 'import math\n\nD = 1000  # annual demand\nS = 50    # ordering cost per order\nH = 4     # holding cost per unit per year\nresult = None\n',
    hints: [
      'EOQ balances ordering cost against holding cost — the formula is a square root.',
      'Compute (2 * D * S) / H first, then take math.sqrt() of that.',
      'result = math.sqrt((2 * D * S) / H)',
    ],
    xp: 75,
    tool: { name: 'Economic Order Quantity', icon: '📐', description: 'sqrt((2 × annual demand × ordering cost) / holding cost) — the order size that minimizes total inventory cost.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 158.11, 0.1) ?? { success: true, message: 'About 158 units per order — the sweet spot between ordering too often and holding too much.' },
  },

  {
    id: 'sc-11-disruption-response',
    kind: 'sequence',
    npc: 'Risk Rita',
    title: 'The Supplier Just Shut Down',
    prompt: 'Order the response when a key supplier suddenly shuts down.',
    items: [
      { id: 'shutdown', label: 'Supplier shutdown is announced' },
      { id: 'assess', label: 'Assess alternate suppliers' },
      { id: 'safety', label: 'Activate safety stock' },
      { id: 'switch', label: 'Switch suppliers or absorb the cost, whichever is cheaper' },
    ],
    correctOrder: ['shutdown', 'assess', 'safety', 'switch'],
    successMessage: 'Announced, assessed, buffered, resolved — the disruption never reached the customer.',
    hints: [
      'The response starts the moment the disruption is announced, not before.',
      'Safety stock buys you time while alternate suppliers are still being assessed.',
      'Supplier shutdown announced → Assess alternate suppliers → Activate safety stock → Switch suppliers or absorb the cost',
    ],
    xp: 65,
    tool: { name: 'Disruption response', icon: '🚨', description: 'Announced → assess alternates → activate safety stock → switch or absorb — the playbook for a supplier going dark.', fun: 4 },
  },

  {
    id: 'sc-12-final-boss',
    kind: 'sequence',
    npc: 'Port Director Rex',
    title: 'Untangling the Gridlock',
    prompt: 'The whole port is gridlocked — ships can\'t unload, warehouses are overflowing, orders are lost. Order the full recovery.',
    items: [
      { id: 'backlog', label: 'Clear the procurement backlog' },
      { id: 'route', label: 'Route incoming ships' },
      { id: 'warehouse', label: 'Direct warehouse operations' },
      { id: 'update', label: 'Update customers on delays' },
      { id: 'riskcheck', label: 'Run a risk assessment to prevent it happening again' },
    ],
    correctOrder: ['backlog', 'route', 'warehouse', 'update', 'riskcheck'],
    successMessage: 'The backlog is clear, ships are routed, the warehouse is flowing, customers know what\'s happening, and a risk plan is in place so it never happens again. The Docks are untangled.',
    hints: [
      'Start where the paperwork is stuck — the procurement backlog — before ships can even be sequenced in.',
      'Physical flow (routing ships, directing the warehouse) has to be resolved before anyone can give customers an accurate update.',
      'Clear the procurement backlog → Route incoming ships → Direct warehouse operations → Update customers on delays → Run a risk assessment',
    ],
    xp: 220,
    tool: { name: 'Supply Chain Commander', icon: '🚢', description: 'Untangled a fully gridlocked port — procurement, shipping, warehousing, customer comms, and risk, all at once.', fun: 5 },
  },
]

export const SUPPLY_CHAIN_DOCKS_ZONE = {
  id: 'supply-chain-docks',
  name: 'Supply Chain Docks',
  palette: { bg: '#1e3a5f', ground: 0x64748b, groundAccent: 0x475569 },
  decor: { kind: 'dock' },
  npcIntro: {
    name: 'Port Director Rex',
    lines: [
      "Welcome to the Supply Chain Docks, Ziro.",
      "Every ship out there is stuck. The warehouses are overflowing, orders are getting lost, and nothing is moving.",
      "A supply chain is just the answer to one question, asked a thousand times a day: how does a thing get from where it's made to where it's needed, without costing more than it's worth or arriving too late to matter? Right now, every link in that chain here has stopped talking to the one next to it.",
      "We know procurement, warehousing, and risk management — we just can't get any of it flowing together anymore.",
      "Help us untangle this gridlock, one link in the chain at a time. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Port Director Rex', color: 0x0ea5e9, role: 'main' },
    { x: 2020, y: 560, name: 'Warehouse Wanda', color: 0xf97316, flavor: 'Every pallet has a place, and every order has a path through this warehouse. Let\'s get it moving again.' },
    { x: 260, y: 860, name: 'Procurement Pavel', color: 0xa78bfa, flavor: 'Nothing arrives at this port without a purchase order behind it. Let\'s get the paperwork flowing.' },
    { x: 2020, y: 1160, name: 'Risk Rita', color: 0xef4444, flavor: 'A gridlock like this only happens once you stop watching for it. Let\'s map the risk before it hits again.' },
  ],
  challenges: SUPPLY_CHAIN_DOCKS_CHALLENGES,
  nextZone: 'iot-outpost',
}
