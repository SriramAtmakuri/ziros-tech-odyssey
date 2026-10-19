import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// The bonus reserve pool for Supply Chain Docks — 2x its 12 real chest
// positions. Once a chest is solved and the player moves past it via
// "Next", that chest's challenge gets replaced with one drawn from here
// (see gameStore.js's BONUS_POOLS registry / swapChallenge /
// getLiveChallenges), same mechanic as every other zone in this rollout.
// Pre-authored, never AI-generated at runtime.
//
// Split three ways:
//   - 8 hands-on (4x kind: 'python' hand-rolled supply-chain math, same
//     `result`-variable/checkResult convention the main pool uses; 4x kind:
//     'sequence') covering ground the main 12 don't: a real safety-stock
//     formula (z-score × demand variability × sqrt(lead time)), inventory
//     turnover ratio, fill rate, landed cost per unit, the CIF Incoterm's
//     responsibility handoff (risk actually transfers at the same ORIGIN
//     port as FOB — CIF's real difference is that cost/insurance obligation
//     outlives that transfer, extending to the destination port), cross-
//     docking, demand forecasting, and the freight-mode cost/speed spectrum.
//   - 8 MCQ (kind: 'mcq') on supply-chain concepts with no single runnable
//     snippet of their own: just-in-time inventory, ABC analysis, Vendor
//     Managed Inventory, cycle counting vs. full physical counts, total
//     cost of ownership vs. purchase price, nearshoring vs. offshoring,
//     order fulfillment lead-time components, and the perfect order rate.
//   - 8 matching (kind: 'matching') pairing terms across supply chain
//     KPIs, Incoterms, warehouse operations vocabulary, procurement
//     vocabulary, risk management terms, inventory management terms,
//     logistics outsourcing terms, and freight/transportation terms.

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

export const SUPPLY_CHAIN_DOCKS_BONUS_POOL = [
  // ---------- hands-on: python / sequence ----------
  {
    id: 'sc-pool-01-safety-stock',
    kind: 'python',
    npc: 'Warehouse Wanda',
    title: 'A Real Safety Buffer, Not a Guess',
    prompt: 'Wanda wants a real safety stock formula, not a round number. Using z_score = 1.65 (a 95% service level), demand_std_dev = 20 (daily demand variability), and lead_time_days = 5, compute safety_stock = z_score * demand_std_dev * sqrt(lead_time_days), using math.sqrt. Store the float in `result`.',
    starter: 'import math\n\nz_score = 1.65\ndemand_std_dev = 20\nlead_time_days = 5\nresult = None\n',
    hints: [
      'The higher the service level (z_score) or the more variable demand is, the bigger the buffer needs to be — and longer lead times mean more uncertainty to cover.',
      'Multiply z_score by demand_std_dev, then multiply that by math.sqrt(lead_time_days).',
      'result = z_score * demand_std_dev * math.sqrt(lead_time_days)',
    ],
    xp: 75,
    tool: { name: 'Safety stock formula', icon: '🛟', description: 'z-score × demand variability × √(lead time) — a real statistical buffer, not a guess.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 73.79, 0.1) ?? { success: true, message: 'About 74 units of buffer — enough to cover demand swings during the lead time, at a 95% service level.' },
  },
  {
    id: 'sc-pool-02-inventory-turnover',
    kind: 'python',
    npc: 'Port Director Rex',
    title: 'How Fast Inventory Actually Moves',
    prompt: 'cogs = 500000 (annual cost of goods sold), avg_inventory = 100000 (average inventory value on hand). Compute the inventory turnover ratio: cogs / avg_inventory. Store the float in `result`.',
    starter: 'cogs = 500000\navg_inventory = 100000\nresult = None\n',
    hints: [
      'Turnover measures how many times inventory is sold and replaced over a period — higher generally means less cash tied up sitting on shelves.',
      'It\'s a single division.',
      'result = cogs / avg_inventory',
    ],
    xp: 65,
    tool: { name: 'Inventory turnover ratio', icon: '🔄', description: 'COGS ÷ average inventory — how many times stock turns over in a year.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 5.0, 0.01) ?? { success: true, message: 'Inventory turns over 5 times a year — a real number Rex can compare against industry benchmarks.' },
  },
  {
    id: 'sc-pool-03-fill-rate',
    kind: 'python',
    npc: 'Warehouse Wanda',
    title: 'How Often the Order Actually Ships Complete',
    prompt: 'units_ordered = 950, units_shipped_on_time = 902. Compute the fill rate as a percentage: (units_shipped_on_time / units_ordered) * 100. Store the float in `result`.',
    starter: 'units_ordered = 950\nunits_shipped_on_time = 902\nresult = None\n',
    hints: [
      'Fill rate measures the percentage of demand actually met on time, from stock on hand.',
      'Divide shipped by ordered, then multiply by 100 to get a percentage.',
      'result = (units_shipped_on_time / units_ordered) * 100',
    ],
    xp: 60,
    tool: { name: 'Fill rate', icon: '📦', description: 'The percentage of an order actually shipped complete and on time.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 94.95, 0.1) ?? { success: true, message: 'About 95% fill rate — close, but that missing 5% is exactly what a good safety stock policy targets.' },
  },
  {
    id: 'sc-pool-04-landed-cost',
    kind: 'python',
    npc: 'Procurement Pavel',
    title: 'The Real Cost, Not Just the Sticker Price',
    prompt: 'A unit\'s true landed cost isn\'t just its price tag. product_cost = 40.0, shipping = 5.5, customs_duty = 3.2, and insurance = 1.3 — all per unit. Compute the total landed cost per unit. Store the float in `result`.',
    starter: 'product_cost = 40.0\nshipping = 5.5\ncustoms_duty = 3.2\ninsurance = 1.3\nresult = None\n',
    hints: [
      'Landed cost is everything it actually costs to get one unit to your door, not just what the supplier charges for it.',
      'Add all four numbers together.',
      'result = product_cost + shipping + customs_duty + insurance',
    ],
    xp: 65,
    tool: { name: 'Landed cost', icon: '🧾', description: 'Product cost plus shipping, duty, and insurance — the real per-unit cost.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 50.0, 0.01) ?? { success: true, message: '$50 per unit, all-in — 25% more than the $40 sticker price alone would suggest.' },
  },
  {
    id: 'sc-pool-05-cif-incoterm',
    kind: 'sequence',
    npc: 'Procurement Pavel',
    title: 'Cost Outlives Risk',
    prompt: 'Order the responsibility handoff in a CIF (Cost, Insurance, Freight) shipment — the counter-intuitive part is WHERE risk actually transfers, versus who keeps paying afterward.',
    items: [
      { id: 'load', label: 'Seller loads the goods onto the ship at the origin port' },
      { id: 'transfer', label: 'Risk transfers to the buyer right then, at the origin port — the exact same point as FOB' },
      { id: 'shiparrange', label: 'Seller still pays for shipping and insurance all the way to the destination port, even though risk has already passed' },
      { id: 'receive', label: 'Buyer receives the goods at the destination and handles customs/import' },
    ],
    correctOrder: ['load', 'transfer', 'shiparrange', 'receive'],
    successMessage: 'Risk passed to the buyer the moment goods were loaded — the seller just kept paying the bill for a journey that was no longer their risk.',
    hints: [
      'This is the classic counter-intuitive part of CIF: the COST obligation and the RISK transfer point are not the same moment.',
      'Risk transfers at the ORIGIN port, identically to FOB. CIF\'s only real difference is that the seller keeps paying for freight/insurance past that point, all the way to the destination.',
      'Seller loads the goods → Risk transfers at the origin port (same as FOB) → Seller still pays for shipping/insurance to the destination → Buyer receives and handles customs',
    ],
    xp: 70,
    tool: { name: 'Incoterms: CIF', icon: '🚢', description: 'Cost, Insurance, Freight — risk transfers at the origin port, just like FOB, but the seller keeps paying the freight/insurance bill all the way to the destination.', fun: 4 },
  },
  {
    id: 'sc-pool-06-cross-docking',
    kind: 'sequence',
    npc: 'Warehouse Wanda',
    title: 'Skipping Storage Entirely',
    prompt: 'Order the cross-docking flow — a warehouse strategy where goods never actually sit in storage.',
    items: [
      { id: 'inbound', label: 'Inbound truck arrives with goods already sorted for specific outbound destinations' },
      { id: 'sort', label: 'Goods are sorted directly on the dock, matched to outbound shipments' },
      { id: 'load', label: 'Goods are loaded straight onto the outbound truck' },
      { id: 'ship', label: 'Outbound truck departs — goods never sit in storage' },
    ],
    correctOrder: ['inbound', 'sort', 'load', 'ship'],
    successMessage: 'No putaway, no storage, no picking later — goods move straight from inbound truck to outbound truck.',
    hints: [
      'Compare this to the standard receive → putaway → storage → pick → pack → ship flow — cross-docking deliberately skips the middle steps.',
      'Sorting has to happen before anything can be loaded onto the right outbound truck.',
      'Inbound truck arrives, pre-sorted → Sorted on the dock → Loaded onto outbound truck → Outbound truck ships',
    ],
    xp: 70,
    tool: { name: 'Cross-docking', icon: '🚚', description: 'Goods move straight from inbound to outbound trucks, skipping storage entirely.', fun: 4 },
  },
  {
    id: 'sc-pool-07-demand-forecasting',
    kind: 'sequence',
    npc: 'Risk Rita',
    title: 'Guessing Tomorrow\'s Demand, Properly',
    prompt: 'Order the demand forecasting process, from historical data to an improved forecast next time.',
    items: [
      { id: 'historical', label: 'Gather historical sales data' },
      { id: 'model', label: 'Apply a forecasting model to that data' },
      { id: 'forecast', label: 'Generate a demand forecast for the upcoming period' },
      { id: 'adjust', label: 'Compare the forecast to actual demand once it arrives, and adjust the model' },
    ],
    correctOrder: ['historical', 'model', 'forecast', 'adjust'],
    successMessage: 'History informs the model, the model produces a forecast, and reality checks the forecast — every cycle makes the next one better.',
    hints: [
      'A model needs historical data to learn from before it can produce anything.',
      'The loop only closes once real, actual demand comes in and gets compared back against what was predicted.',
      'Gather historical data → Apply forecasting model → Generate forecast → Compare to actual and adjust',
    ],
    xp: 70,
    tool: { name: 'Demand forecasting', icon: '🔮', description: 'History informs the model, the model predicts, reality checks the prediction — an ongoing loop.', fun: 4 },
  },
  {
    id: 'sc-pool-08-freight-mode-spectrum',
    kind: 'sequence',
    npc: 'Port Director Rex',
    title: 'Cheap and Slow, or Fast and Pricey?',
    prompt: 'Order these freight modes from cheapest/slowest to most expensive/fastest.',
    items: [
      { id: 'ocean', label: 'Ocean freight (cheapest, slowest — weeks)' },
      { id: 'rail', label: 'Rail freight (cheap, moderate speed — large domestic volumes)' },
      { id: 'truck', label: 'Truck freight (moderate cost, flexible, door-to-door)' },
      { id: 'air', label: 'Air freight (most expensive, fastest — hours to a couple days)' },
    ],
    correctOrder: ['ocean', 'rail', 'truck', 'air'],
    successMessage: 'Ocean for cheap and patient, air for expensive and urgent — pick based on what the shipment actually needs.',
    hints: [
      'This is a genuine cost-vs-speed tradeoff, not a strict quality ranking — the "best" choice depends entirely on urgency.',
      'Ocean freight is famously the slowest and cheapest way to move bulk goods internationally; air freight is the opposite extreme.',
      'Ocean → Rail → Truck → Air',
    ],
    xp: 60,
    tool: { name: 'Freight mode spectrum', icon: '✈️', description: 'Ocean, rail, truck, air — a real cost-vs-speed tradeoff, not a strict ranking.', fun: 3 },
  },

  // ---------- MCQ: supply-chain concepts ----------
  {
    id: 'sc-pool-09-mcq-jit',
    kind: 'mcq',
    npc: 'Warehouse Wanda',
    title: 'Just-In-Time Inventory',
    prompt: 'What is the core idea behind Just-In-Time (JIT) inventory management?',
    options: [
      'Receive goods only as they\'re needed for production/sale, minimizing inventory held on hand — reduces holding costs, but increases sensitivity to supply disruptions',
      'Order the maximum possible amount of stock, as far in advance as possible',
      'Only applies to perishable food items, nothing else',
      'A method for permanently eliminating any risk of stockouts',
    ],
    correctIndex: 0,
    explanation: 'JIT minimizes inventory by timing deliveries to arrive right when needed, cutting holding costs and waste — but it also means much less buffer against a supplier disruption, which is exactly the kind of tradeoff Risk Rita\'s whole job is about managing.',
    hints: [
      'It\'s specifically about MINIMIZING inventory on hand, timed to actual need — not maximizing it.',
      'The tradeoff is lower holding cost against higher vulnerability to disruption.',
      'The correct answer is: receive goods only as needed, minimizing inventory, at the cost of more disruption sensitivity.',
    ],
    xp: 45,
    tool: { name: 'Just-In-Time (JIT) inventory', icon: '⏱️', description: 'Minimizes inventory by timing deliveries to actual need — lower cost, higher disruption risk.', fun: 3 },
  },
  {
    id: 'sc-pool-10-mcq-abc-analysis',
    kind: 'mcq',
    npc: 'Port Director Rex',
    title: 'Not All Inventory Deserves Equal Attention',
    prompt: 'What is ABC analysis in inventory management?',
    options: [
      'Classifying inventory into tiers (A, B, C) by value/importance — typically a small share of items (A) account for most of the value, deserving the tightest control',
      'Alphabetically sorting a warehouse\'s product catalog',
      'A three-step process for onboarding a new supplier',
      'A method that applies only to companies with exactly three products',
    ],
    correctIndex: 0,
    explanation: 'ABC analysis applies the Pareto principle (roughly 80/20 rule) to inventory: "A" items are the small fraction that account for most of the value and get the tightest monitoring/control; "C" items are numerous but low-value, needing less scrutiny.',
    hints: [
      'It\'s about VALUE/IMPORTANCE tiers, not alphabetical sorting or onboarding.',
      'Think of the 80/20 rule applied to a warehouse\'s inventory.',
      'The correct answer is: classifying inventory into A/B/C tiers by value, so the highest-value items get the tightest control.',
    ],
    xp: 45,
    tool: { name: 'ABC analysis', icon: '🔤', description: 'Classifies inventory by value — a small share of items usually account for most of it.', fun: 3 },
  },
  {
    id: 'sc-pool-11-mcq-vmi',
    kind: 'mcq',
    npc: 'Procurement Pavel',
    title: 'Letting the Supplier Watch the Shelf',
    prompt: 'What is Vendor Managed Inventory (VMI)?',
    options: [
      'The supplier monitors the buyer\'s inventory levels and automatically replenishes stock, instead of the buyer placing individual orders',
      'A vendor\'s own internal inventory, unrelated to any customer',
      'A system where the buyer manages the supplier\'s factory schedule',
      'A one-time audit of a vendor\'s warehouse'
    ],
    correctIndex: 0,
    explanation: 'Under VMI, the supplier gets visibility into the buyer\'s stock levels (often via shared data) and takes responsibility for keeping it replenished — shifting the ordering decision from the buyer to the supplier, who usually knows their own production capacity best.',
    hints: [
      'The key shift is WHO decides when to reorder — normally the buyer, but not here.',
      'It requires the supplier to actually see the buyer\'s real-time (or near-real-time) stock levels.',
      'The correct answer is: the supplier monitors the buyer\'s inventory and automatically replenishes it, instead of the buyer ordering.',
    ],
    xp: 50,
    tool: { name: 'Vendor Managed Inventory (VMI)', icon: '🤝', description: 'The supplier watches your stock levels and replenishes it themselves.', fun: 3 },
  },
  {
    id: 'sc-pool-12-mcq-cycle-counting',
    kind: 'mcq',
    npc: 'Warehouse Wanda',
    title: 'Counting a Little, Often, Instead of a Lot, Rarely',
    prompt: "What's the advantage of cycle counting over a single annual full physical inventory count?",
    options: [
      'Cycle counting checks a small subset of inventory continuously/regularly throughout the year, catching and correcting discrepancies far sooner than waiting for one big annual count',
      'Cycle counting is always less accurate than a full annual count',
      'A full physical count can be done without ever stopping normal warehouse operations, unlike cycle counting',
      'Cycle counting only applies to inventory stored outdoors'
    ],
    correctIndex: 0,
    explanation: 'A full annual count finds problems only once a year, by which point discrepancies may have compounded and be hard to trace. Cycle counting rotates through smaller subsets continuously, catching and fixing issues close to when they happen — often with less operational disruption too.',
    hints: [
      'Think about how long a discrepancy might go unnoticed under each approach.',
      'A full annual count usually requires shutting down operations temporarily; cycle counting doesn\'t need to.',
      'The correct answer is: cycle counting catches discrepancies continuously throughout the year, instead of once annually.',
    ],
    xp: 50,
    tool: { name: 'Cycle counting', icon: '🔢', description: 'Continuously counts a subset of inventory, catching discrepancies far sooner than an annual count.', fun: 3 },
  },
  {
    id: 'sc-pool-13-mcq-tco',
    kind: 'mcq',
    npc: 'Procurement Pavel',
    title: 'The Price Tag Isn\'t the Whole Story',
    prompt: "Why do experienced procurement teams evaluate a supplier's Total Cost of Ownership (TCO), not just their quoted price?",
    options: [
      'TCO includes everything a purchase actually costs over its life — shipping, customs, quality/defect issues, downstream support — a cheaper quoted price can still end up more expensive overall',
      'TCO is only relevant for real estate purchases',
      'The quoted price always already includes every other cost',
      'TCO is a legal requirement with no financial purpose'
    ],
    correctIndex: 0,
    explanation: 'A supplier with the lowest unit price might have worse quality (leading to costly returns/defects), higher shipping costs, or slower support — TCO captures the full real cost across a purchase\'s lifetime, which the landed-cost calculation earlier is one concrete piece of.',
    hints: [
      'It\'s about looking BEYOND the quoted unit price to everything else a purchase actually costs over time.',
      'Think about the landed cost challenge from earlier — quoted price was only one of several cost components.',
      'The correct answer is: TCO includes shipping, customs, quality issues, and support costs — a lower price can still be more expensive overall.',
    ],
    xp: 50,
    tool: { name: 'Total Cost of Ownership (TCO)', icon: '💰', description: 'The full real cost of a purchase over its lifetime, not just the quoted price.', fun: 3 },
  },
  {
    id: 'sc-pool-14-mcq-nearshoring',
    kind: 'mcq',
    npc: 'Risk Rita',
    title: 'Nearshoring vs. Offshoring',
    prompt: "What's the key tradeoff between nearshoring and offshoring?",
    options: [
      'Nearshoring sources from nearby countries, trading some cost savings for shorter lead times and lower supply-chain risk; offshoring sources from the cheapest labor globally, often at the cost of longer lead times and more disruption risk',
      'Nearshoring and offshoring are two names for the exact same strategy',
      'Offshoring always guarantees faster delivery than nearshoring',
      'Nearshoring can only be done within the same city as headquarters'
    ],
    correctIndex: 0,
    explanation: 'Offshoring typically chases the lowest labor cost globally, which often means longer supply chains, longer lead times, and more exposure to geopolitical/logistics risk. Nearshoring trades some of that cost savings for a shorter, more resilient, faster-responding supply chain.',
    hints: [
      'One prioritizes the absolute lowest cost, wherever that is in the world; the other prioritizes proximity and resilience, even at somewhat higher cost.',
      'Think about which one would recover faster from a regional disruption, given the distances involved.',
      'The correct answer is: nearshoring trades some cost savings for shorter lead times/lower risk; offshoring chases the cheapest labor globally.',
    ],
    xp: 50,
    tool: { name: 'Nearshoring vs. offshoring', icon: '🌎', description: 'Proximity and resilience vs. chasing the globally cheapest labor.', fun: 3 },
  },
  {
    id: 'sc-pool-15-mcq-leadtime-components',
    kind: 'mcq',
    npc: 'Port Director Rex',
    title: 'What "Lead Time" Is Actually Made Of',
    prompt: 'A customer places an order and it finally arrives 6 days later. What does that total lead time actually consist of?',
    options: [
      'Order processing time + picking/packing time + shipping transit time, added together — delays in any one stage extend the whole thing',
      'Only the time the package spends physically on a truck, nothing else',
      'Only however long the warehouse takes to find the item on a shelf',
      'A fixed number set once and never actually measured'
    ],
    correctIndex: 0,
    explanation: 'Total lead time is a sum of every stage the order actually passes through — processing the order, picking and packing it, and shipping transit — so a bottleneck in any single stage delays the customer\'s actual delivery, even if the other stages are fast.',
    hints: [
      'The customer experiences the SUM of every stage, not just the shipping part.',
      'A slow warehouse pick can delay delivery just as much as slow shipping would.',
      'The correct answer is: order processing + picking/packing + shipping transit, all added together.',
    ],
    xp: 50,
    tool: { name: 'Order fulfillment lead time', icon: '⏳', description: 'Processing + picking/packing + shipping transit, summed — a bottleneck anywhere delays the whole thing.', fun: 3 },
  },
  {
    id: 'sc-pool-16-mcq-perfect-order-rate',
    kind: 'mcq',
    npc: 'Risk Rita',
    title: 'One Number That Summarizes Everything',
    prompt: 'What does the "perfect order rate" measure?',
    options: [
      'The percentage of orders delivered complete, on time, undamaged, and with accurate documentation — a single composite number summarizing overall fulfillment quality',
      'The percentage of orders that were placed using a perfect credit score',
      'How many orders were placed on a company\'s single best sales day',
      'The exact number of orders a warehouse is physically capable of processing'
    ],
    correctIndex: 0,
    explanation: 'Perfect order rate rolls several individual measures (on-time delivery, complete shipment, no damage, correct paperwork) into one composite metric — an order only counts as "perfect" if it meets every single condition, making it a strict, honest summary of overall fulfillment quality.',
    hints: [
      'It combines SEVERAL individual conditions into one strict composite — an order has to meet all of them to count.',
      'Think: complete, on-time, undamaged, AND correctly documented, all at once.',
      'The correct answer is: the percentage of orders that are complete, on-time, undamaged, and accurately documented — all at once.',
    ],
    xp: 55,
    tool: { name: 'Perfect order rate', icon: '🎯', description: 'A strict composite: complete, on-time, undamaged, and correctly documented, all at once.', fun: 4 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'sc-pool-17-match-kpis',
    kind: 'matching',
    npc: 'Port Director Rex',
    title: 'Supply Chain KPIs',
    prompt: 'Match each supply chain KPI to what it measures.',
    pairs: [
      { id: 'a', left: 'Inventory turnover', right: 'How many times inventory is sold and replaced over a period' },
      { id: 'b', left: 'Fill rate', right: 'The percentage of an order shipped complete and on time from stock on hand' },
      { id: 'c', left: 'Perfect order rate', right: 'The percentage of orders complete, on-time, undamaged, AND correctly documented — all at once' },
      { id: 'd', left: 'Cash-to-cash cycle time', right: 'How long cash is tied up between paying suppliers and collecting from customers' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Inventory turnover and cash-to-cash cycle time both relate to CAPITAL efficiency; fill rate and perfect order rate both relate to ORDER fulfillment quality.',
      'Perfect order rate is the strictest — it requires every single condition to be met, not just one.',
      'Inventory turnover → how often stock cycles. Fill rate → orders shipped complete/on-time. Perfect order rate → every condition met at once. Cash-to-cash cycle time → how long cash is tied up.',
    ],
    xp: 65,
    successMessage: 'Every core supply chain KPI, matched to what it actually measures.',
    tool: { name: 'Supply chain KPIs', icon: '📊', description: 'Inventory turnover, fill rate, perfect order rate, and cash-to-cash cycle time.', fun: 4 },
  },
  {
    id: 'sc-pool-18-match-incoterms',
    kind: 'matching',
    npc: 'Procurement Pavel',
    title: 'Incoterms',
    prompt: 'Match each Incoterm to where responsibility actually transfers.',
    pairs: [
      { id: 'a', left: 'FOB (Free On Board)', right: 'Risk transfers to the buyer once goods are loaded onto the ship at the ORIGIN port' },
      { id: 'b', left: 'CIF (Cost, Insurance, Freight)', right: 'Risk transfers at the same ORIGIN port as FOB, but the seller keeps paying freight/insurance all the way to the destination' },
      { id: 'c', left: 'EXW (Ex Works)', right: 'Buyer takes on almost all responsibility — pickup starts right at the seller\'s own facility' },
      { id: 'd', left: 'DDP (Delivered Duty Paid)', right: 'Seller handles everything, including import duties, all the way to the buyer\'s door' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'These four span a spectrum: EXW puts almost all responsibility on the buyer; DDP puts almost all of it on the seller. FOB and CIF sit right next to each other on WHERE risk transfers — the counter-intuitive part is that CIF differs only in cost, not risk.',
      'FOB and CIF both transfer risk at the origin port — CIF\'s only real difference is that the seller keeps paying for the journey past that point.',
      'FOB → risk transfers at origin port. CIF → risk ALSO transfers at origin port, but seller pays freight/insurance to the destination anyway. EXW → buyer responsible from the seller\'s own facility. DDP → seller handles everything to the buyer\'s door.',
    ],
    xp: 70,
    successMessage: 'The full spectrum of Incoterms, from almost-all-buyer to almost-all-seller, matched up — including the classic CIF gotcha: cost obligation outlives risk transfer.',
    tool: { name: 'Incoterms', icon: '🚢', description: 'FOB, CIF, EXW, and DDP — where responsibility actually transfers in each.', fun: 4 },
  },
  {
    id: 'sc-pool-19-match-warehouseops',
    kind: 'matching',
    npc: 'Warehouse Wanda',
    title: 'Warehouse Operations Vocabulary',
    prompt: 'Match each warehouse operations term to its meaning.',
    pairs: [
      { id: 'a', left: 'Putaway', right: 'Shelving received goods into their storage location' },
      { id: 'b', left: 'Cross-docking', right: 'Moving goods straight from inbound to outbound trucks, skipping storage entirely' },
      { id: 'c', left: 'Cycle counting', right: 'Continuously counting a rotating subset of inventory instead of one annual full count' },
      { id: 'd', left: 'Pick-pack-ship', right: 'Retrieving items for an order, boxing them, and sending them out' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Putaway and Cross-docking describe two OPPOSITE approaches to what happens right after goods arrive — one stores them, one skips storage entirely.',
      'Cycle counting is about ONGOING accuracy checks, not about moving goods at all.',
      'Putaway → shelves received goods. Cross-docking → skips storage, inbound straight to outbound. Cycle counting → continuous partial inventory checks. Pick-pack-ship → fulfilling an order for shipment.',
    ],
    xp: 65,
    successMessage: 'The core warehouse operations vocabulary, matched to its exact role.',
    tool: { name: 'Warehouse operations vocabulary', icon: '📦', description: 'Putaway, cross-docking, cycle counting, and pick-pack-ship.', fun: 4 },
  },
  {
    id: 'sc-pool-20-match-procurementvocab',
    kind: 'matching',
    npc: 'Procurement Pavel',
    title: 'Procurement Vocabulary',
    prompt: 'Match each procurement term to its meaning.',
    pairs: [
      { id: 'a', left: 'RFQ (Request for Quote)', right: 'Asking multiple suppliers to submit pricing for a defined need' },
      { id: 'b', left: 'Purchase requisition', right: 'An internal request asking for something to be bought' },
      { id: 'c', left: 'Purchase order', right: 'The formal order sent to a supplier, committing to buy at agreed terms' },
      { id: 'd', left: 'Vendor Managed Inventory', right: 'The supplier monitors and replenishes the buyer\'s stock automatically' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'RFQ and Purchase requisition both happen BEFORE any commitment; Purchase order and VMI both describe an ACTIVE arrangement with a supplier.',
      'A requisition is internal (asking your own company for approval); an RFQ goes out to suppliers.',
      'RFQ → asks suppliers for pricing. Purchase requisition → internal request to buy. Purchase order → formal commitment to a supplier. VMI → supplier manages your stock directly.',
    ],
    xp: 65,
    successMessage: 'The core procurement vocabulary, matched to its exact role in the buying process.',
    tool: { name: 'Procurement vocabulary', icon: '📋', description: 'RFQ, purchase requisition, purchase order, and Vendor Managed Inventory.', fun: 4 },
  },
  {
    id: 'sc-pool-21-match-riskvocab',
    kind: 'matching',
    npc: 'Risk Rita',
    title: 'Risk Management Vocabulary',
    prompt: 'Match each risk management term to its meaning.',
    pairs: [
      { id: 'a', left: 'Tier 1 supplier', right: 'A supplier you buy from directly' },
      { id: 'b', left: 'Tier 2 supplier', right: 'A supplier that supplies YOUR supplier — one step removed' },
      { id: 'c', left: 'Contingency plan', right: 'A pre-prepared response for when a specific disruption actually happens' },
      { id: 'd', left: 'Bullwhip effect', right: 'A small demand change amplifying into a much bigger swing as it moves upstream' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Tier 1 and Tier 2 describe HOW FAR a supplier sits from you in the chain; Contingency plan and Bullwhip effect describe a RESPONSE and a PROBLEM, respectively.',
      'Tier 2 suppliers are invisible unless you specifically map beyond your direct (Tier 1) relationships.',
      'Tier 1 → your direct supplier. Tier 2 → your supplier\'s supplier. Contingency plan → prepared disruption response. Bullwhip effect → demand swings amplifying upstream.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind spotting and responding to supply chain risk, matched up.',
    tool: { name: 'Risk management vocabulary', icon: '🗺️', description: 'Tier 1/Tier 2 suppliers, contingency plans, and the bullwhip effect.', fun: 4 },
  },
  {
    id: 'sc-pool-22-match-inventoryvocab',
    kind: 'matching',
    npc: 'Warehouse Wanda',
    title: 'Inventory Management Vocabulary',
    prompt: 'Match each inventory management term to its meaning.',
    pairs: [
      { id: 'a', left: 'Safety stock', right: 'A buffer held to protect against demand or lead-time variability' },
      { id: 'b', left: 'Reorder point', right: 'The stock level at which a new order should be triggered' },
      { id: 'c', left: 'EOQ (Economic Order Quantity)', right: 'The order size that minimizes total ordering + holding cost' },
      { id: 'd', left: 'ABC analysis', right: 'Classifying inventory into value tiers, so the highest-value items get the tightest control' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Safety stock and Reorder point are both about WHEN/HOW MUCH buffer to hold; EOQ and ABC analysis are both about OPTIMIZING order size and attention respectively.',
      'Reorder point tells you WHEN to order; EOQ tells you HOW MUCH to order at once.',
      'Safety stock → buffer against variability. Reorder point → triggers a new order. EOQ → minimizes total ordering + holding cost. ABC analysis → classifies inventory by value.',
    ],
    xp: 65,
    successMessage: 'The core inventory management vocabulary, matched to its exact role.',
    tool: { name: 'Inventory management vocabulary', icon: '📐', description: 'Safety stock, reorder point, EOQ, and ABC analysis.', fun: 4 },
  },
  {
    id: 'sc-pool-23-match-outsourcingvocab',
    kind: 'matching',
    npc: 'Port Director Rex',
    title: 'Logistics Outsourcing Vocabulary',
    prompt: 'Match each logistics outsourcing term to its meaning.',
    pairs: [
      { id: 'a', left: '3PL', right: 'A partner runs a piece of your logistics, like warehousing or shipping' },
      { id: 'b', left: '4PL', right: 'A partner manages your entire logistics strategy, even coordinating other 3PLs' },
      { id: 'c', left: 'Nearshoring', right: 'Sourcing from nearby countries, trading some cost savings for shorter lead times/lower risk' },
      { id: 'd', left: 'Offshoring', right: 'Sourcing from the cheapest labor globally, often at the cost of longer lead times and more risk' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      '3PL and 4PL both describe HOW MUCH of your logistics operations you hand off; Nearshoring and Offshoring both describe WHERE you source production from.',
      '4PL is the deeper handoff of the two — it manages the whole strategy, even coordinating 3PLs underneath it.',
      '3PL → runs a piece of your logistics. 4PL → manages your entire logistics strategy. Nearshoring → nearby sourcing, less risk. Offshoring → cheapest global labor, more risk.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind how much (and where) you outsource, matched up.',
    tool: { name: 'Logistics outsourcing vocabulary', icon: '🤝', description: '3PL, 4PL, nearshoring, and offshoring.', fun: 4 },
  },
  {
    id: 'sc-pool-24-match-freightvocab',
    kind: 'matching',
    npc: 'Risk Rita',
    title: 'Freight & Transportation Vocabulary',
    prompt: 'Match each freight/transportation term to its meaning.',
    pairs: [
      { id: 'a', left: 'Ocean freight', right: 'The cheapest, slowest way to move bulk goods internationally — weeks, not days' },
      { id: 'b', left: 'Air freight', right: 'The most expensive, fastest option — hours to a couple days' },
      { id: 'c', left: 'Landed cost', right: 'The true total cost of a unit, including shipping, duty, and insurance' },
      { id: 'd', left: 'Lead time', right: 'The total time between placing an order and actually receiving it' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Ocean freight and Air freight are both specific TRANSPORT MODES, at opposite ends of the cost/speed spectrum; Landed cost and Lead time are both broader MEASURES that any shipping choice affects.',
      'Landed cost is about MONEY; lead time is about TIME — both are shaped by which freight mode you pick.',
      'Ocean freight → cheapest, slowest. Air freight → most expensive, fastest. Landed cost → true total unit cost. Lead time → total time from order to receipt.',
    ],
    xp: 65,
    successMessage: 'The core freight and transportation vocabulary, matched up.',
    tool: { name: 'Freight & transportation vocabulary', icon: '✈️', description: 'Ocean freight, air freight, landed cost, and lead time.', fun: 4 },
  },
]
