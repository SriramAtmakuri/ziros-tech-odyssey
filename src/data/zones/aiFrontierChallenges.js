import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// Every 'python' challenge stores its answer in a variable called `result` —
// the prompts say so explicitly. check() reads it back via Pyodide's FFI
// (pyGet) and compares the real Python value, not printed text. Pyodide only
// ships the standard library here (no numpy/pandas/sklearn/micropip), so
// every bit of math — linear regression, precision/recall, cosine similarity
// — is done by hand with plain loops and sums, never a library import.

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

export const AI_FRONTIER_CHALLENGES = [
  {
    id: 'ai-01-ml-pipeline',
    kind: 'sequence',
    npc: 'Dr. Neural',
    title: 'Building a Machine Learning Model',
    prompt: 'Order the steps of building and shipping a machine learning model, from raw data to something running in production.',
    items: [
      { id: 'collect', label: 'Collect data' },
      { id: 'label', label: 'Label the data' },
      { id: 'train', label: 'Train the model' },
      { id: 'evaluate', label: 'Evaluate the model' },
      { id: 'deploy', label: 'Deploy the model' },
    ],
    correctOrder: ['collect', 'label', 'train', 'evaluate', 'deploy'],
    successMessage: 'Data, labels, training, evaluation, deployment — every model follows that same arc.',
    hints: [
      'You can\'t label or train on data you haven\'t collected yet.',
      'A model gets evaluated before anyone trusts it enough to deploy it.',
      'Collect data → Label the data → Train the model → Evaluate the model → Deploy the model',
    ],
    xp: 55,
    tool: { name: 'ML pipeline', icon: '🧠', description: 'Collect → label → train → evaluate → deploy — the standard shape of an ML project.', fun: 4 },
  },

  {
    id: 'ai-02-linear-fit',
    kind: 'python',
    npc: 'Dr. Neural',
    title: 'Fitting a Line by Hand',
    prompt: 'xs = [1, 2, 3, 4, 5] and ys = [2, 4, 5, 4, 5]. Compute the least-squares slope and intercept manually, with no libraries: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²), intercept = (Σy - slope*Σx) / n. Store `result = {\'slope\': ..., \'intercept\': ...}`.',
    starter: 'xs = [1, 2, 3, 4, 5]\nys = [2, 4, 5, 4, 5]\nn = len(xs)\n\n# compute sums, then slope and intercept\nresult = {}\n',
    hints: [
      'You need four sums first: Σx, Σy, Σxy, and Σx² — each a simple loop or sum() with zip().',
      'slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²), then intercept = (Σy - slope*Σx) / n.',
      'sx = sum(xs)\nsy = sum(ys)\nsxy = sum(x*y for x, y in zip(xs, ys))\nsxx = sum(x*x for x in xs)\nslope = (n*sxy - sx*sy) / (n*sxx - sx*sx)\nintercept = (sy - slope*sx) / n\nresult = {\'slope\': slope, \'intercept\': intercept}',
    ],
    xp: 85,
    tool: { name: 'Least-squares fit', icon: '📈', description: 'The slope/intercept formulas behind every linear regression, done with plain sums.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { slope: 0.6, intercept: 2.2 }, 0.01) ?? { success: true, message: 'Slope 0.6, intercept 2.2 — the line that best fits those points, computed by hand.' },
  },

  {
    id: 'ai-03-overfitting',
    kind: 'sequence',
    npc: 'Dr. Neural',
    title: 'The Goldilocks Model',
    prompt: 'Order these three models by complexity, from too simple to too complex.',
    items: [
      { id: 'underfit', label: 'Underfit (too simple, misses the pattern)' },
      { id: 'right', label: 'Just right (captures the real pattern)' },
      { id: 'overfit', label: 'Overfit (memorizes noise instead of the pattern)' },
    ],
    correctOrder: ['underfit', 'right', 'overfit'],
    successMessage: 'Not too simple, not too complex — just enough to capture the real pattern and nothing more.',
    hints: [
      'A model that\'s too simple can\'t even capture the real signal.',
      'A model that\'s too complex starts fitting the noise, not just the pattern.',
      'Underfit → Just right → Overfit',
    ],
    xp: 50,
    tool: { name: 'Bias-variance tradeoff', icon: '🎯', description: 'Underfitting misses the pattern; overfitting memorizes noise. The sweet spot is in between.', fun: 3 },
  },

  {
    id: 'ai-04-neural-forward-pass',
    kind: 'sequence',
    npc: 'Transformer',
    title: 'How a Neuron Decides',
    prompt: 'Order the steps of a single forward pass through a neural network.',
    items: [
      { id: 'input', label: 'Input values arrive' },
      { id: 'weighted-sum', label: 'Weighted sum is computed' },
      { id: 'activation', label: 'Activation function is applied' },
      { id: 'output', label: 'Output is produced' },
    ],
    correctOrder: ['input', 'weighted-sum', 'activation', 'output'],
    successMessage: 'Inputs, weighted sum, activation, output — the same four steps in every neuron, every layer.',
    hints: [
      'A neuron needs its inputs before it can compute anything.',
      'The activation function is applied to the weighted sum, not the raw inputs.',
      'Input values arrive → Weighted sum is computed → Activation function is applied → Output is produced',
    ],
    xp: 60,
    tool: { name: 'Forward pass', icon: '⚡', description: 'Inputs × weights, summed, then squashed by an activation function — the core of every neuron.', fun: 4 },
  },

  {
    id: 'ai-05-llm-pipeline',
    kind: 'sequence',
    npc: 'Transformer',
    title: 'Inside a Language Model',
    prompt: 'Order how a large language model processes a piece of text.',
    items: [
      { id: 'tokenize', label: 'Tokenization (text → tokens)' },
      { id: 'embed', label: 'Embeddings (tokens → vectors)' },
      { id: 'attend', label: 'Attention (vectors attend to each other)' },
      { id: 'generate', label: 'Output generation (next token predicted)' },
    ],
    correctOrder: ['tokenize', 'embed', 'attend', 'generate'],
    successMessage: 'Text becomes tokens, tokens become vectors, vectors attend to each other, and a next token falls out the other end.',
    hints: [
      'Text has to be broken into tokens before anything numeric can happen to it.',
      'Tokens are turned into vectors before attention can relate them to each other.',
      'Tokenization → Embeddings → Attention → Output generation',
    ],
    xp: 70,
    tool: { name: 'LLM pipeline', icon: '🔮', description: 'Tokenize, embed, attend, generate — the four-stage journey every prompt takes through a transformer.', fun: 4 },
  },

  {
    id: 'ai-06-prompt-builder',
    kind: 'python',
    npc: 'Prompt Engineer Priya',
    title: 'Building a Few-Shot Prompt',
    prompt: 'Write build_prompt(examples, question), where examples is a list of (input, output) tuples. It should return one string: each example formatted as "Q: {input}\\nA: {output}\\n", followed by "Q: {question}\\nA:" at the end. Call it with examples = [("2+2", "4"), ("3+3", "6")] and question = "5+5", and store the returned string in `result`.',
    starter: 'def build_prompt(examples, question):\n    pass\n\nexamples = [("2+2", "4"), ("3+3", "6")]\nquestion = "5+5"\nresult = None\n',
    hints: [
      'Build the string piece by piece: loop over examples and append "Q: {input}\\nA: {output}\\n" for each one.',
      'After the loop, append the final unanswered line: "Q: {question}\\nA:" (no trailing newline on this last part).',
      'def build_prompt(examples, question):\n    parts = []\n    for inp, out in examples:\n        parts.append(f"Q: {inp}\\nA: {out}\\n")\n    parts.append(f"Q: {question}\\nA:")\n    return "".join(parts)\n\nresult = build_prompt(examples, question)',
    ],
    xp: 80,
    tool: { name: 'Few-shot prompting', icon: '✍️', description: 'Showing a model a few worked examples before the real question — no fine-tuning required.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'Q: 2+2\nA: 4\nQ: 3+3\nA: 6\nQ: 5+5\nA:') ?? { success: true, message: 'A clean few-shot prompt — two worked examples, then the real question waiting to be answered.' },
  },

  {
    id: 'ai-07-rag-pipeline',
    kind: 'sequence',
    npc: 'RAG the Retriever',
    title: 'Grounding the Answer',
    prompt: 'Order the full Retrieval-Augmented Generation (RAG) pipeline, from raw documents to a grounded answer.',
    items: [
      { id: 'chunk', label: 'Documents are chunked' },
      { id: 'embed', label: 'Chunks are embedded' },
      { id: 'store', label: 'Embeddings stored in a vector database' },
      { id: 'query-embed', label: 'Query comes in and is embedded too' },
      { id: 'retrieve', label: 'Most similar chunks are retrieved' },
      { id: 'augment', label: 'Retrieved context + query sent to the LLM' },
      { id: 'answer', label: 'Grounded answer returned' },
    ],
    correctOrder: ['chunk', 'embed', 'store', 'query-embed', 'retrieve', 'augment', 'answer'],
    successMessage: 'Every stage in order — that\'s how an LLM answers with real documents behind it instead of guessing.',
    hints: [
      'Documents get prepared first: chunked, embedded, and stored, all before any query ever arrives.',
      'A query has to be embedded the same way as the documents before it can be compared against them.',
      'Documents are chunked → Chunks are embedded → Stored in a vector database → Query is embedded → Similar chunks retrieved → Context + query sent to the LLM → Grounded answer returned',
    ],
    xp: 90,
    tool: { name: 'RAG pipeline', icon: '📚', description: 'Chunk, embed, store, retrieve, augment, generate — how an LLM answers using your own documents.', fun: 5 },
  },

  {
    id: 'ai-08-vector-db-spectrum',
    kind: 'sequence',
    npc: 'RAG the Retriever',
    title: 'How Much Infrastructure Do You Want?',
    prompt: 'Order these vector databases from least to most managed infrastructure.',
    items: [
      { id: 'pgvector', label: 'pgvector (an extension on a database you already run)' },
      { id: 'chroma', label: 'Chroma (a lightweight local/embedded vector store)' },
      { id: 'pinecone', label: 'Pinecone (a fully managed cloud vector database)' },
    ],
    correctOrder: ['pgvector', 'chroma', 'pinecone'],
    successMessage: 'From "bolt it onto Postgres" to "someone else runs the whole cluster" — pick based on how much ops you want to own.',
    hints: [
      'pgvector piggybacks on infrastructure you already have — no new system to run.',
      'Pinecone is the fully managed, outsource-everything option at the far end.',
      'pgvector → Chroma → Pinecone',
    ],
    xp: 60,
    tool: { name: 'Vector database spectrum', icon: '🗄️', description: 'pgvector, Chroma, Pinecone — same job, very different amounts of infrastructure to own.', fun: 3 },
  },

  {
    id: 'ai-09-precision-recall',
    kind: 'python',
    npc: 'Dr. Neural',
    title: 'Is 99% Accuracy Actually Good?',
    prompt: 'A classifier\'s confusion matrix: true_positives = 8, false_positives = 2, false_negatives = 12, true_negatives = 978. Compute precision (tp/(tp+fp)), recall (tp/(tp+fn)), and F1 (2*precision*recall/(precision+recall)) by hand. Store `result = {\'precision\': ..., \'recall\': ..., \'f1\': ...}`.',
    starter: 'true_positives = 8\nfalse_positives = 2\nfalse_negatives = 12\ntrue_negatives = 978\n\n# compute precision, recall, f1\nresult = {}\n',
    hints: [
      'precision = tp / (tp + fp), recall = tp / (tp + fn) — accuracy alone hides how few of the rare cases you actually caught.',
      'f1 = 2 * precision * recall / (precision + recall), the harmonic mean of the two.',
      'precision = true_positives / (true_positives + false_positives)\nrecall = true_positives / (true_positives + false_negatives)\nf1 = 2 * precision * recall / (precision + recall)\nresult = {\'precision\': precision, \'recall\': recall, \'f1\': f1}',
    ],
    xp: 85,
    tool: { name: 'Precision, recall, F1', icon: '🎯', description: '99% accuracy can hide a model that misses most of what actually matters — precision/recall/F1 show it.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { precision: 0.8, recall: 0.4, f1: 0.5333333333333333 }, 0.01) ?? { success: true, message: 'Precision 0.8, recall 0.4, F1 ≈ 0.53 — that "99% accurate" model only catches 40% of the real cases.' },
  },

  {
    id: 'ai-10-approach-spectrum',
    kind: 'sequence',
    npc: 'Prompt Engineer Priya',
    title: 'Prompt, Retrieve, or Fine-Tune?',
    prompt: 'Order these three approaches to improving an LLM\'s answers, from least to most effort and cost.',
    items: [
      { id: 'prompt', label: 'Prompt engineering (just write better instructions)' },
      { id: 'rag', label: 'RAG (ground it in retrieved data)' },
      { id: 'finetune', label: 'Fine-tuning (retrain the model itself)' },
    ],
    correctOrder: ['prompt', 'rag', 'finetune'],
    successMessage: 'Try the cheap fix first. Most problems that look like they need fine-tuning are solved by a better prompt or better retrieval.',
    hints: [
      'Prompt engineering costs nothing but your time writing better instructions.',
      'Fine-tuning means retraining the model\'s weights — the most expensive option by far.',
      'Prompt engineering → RAG → Fine-tuning',
    ],
    xp: 55,
    tool: { name: 'Improvement ladder', icon: '🪜', description: 'Prompt engineering, then RAG, then fine-tuning — escalate only as far as you actually need to.', fun: 4 },
  },

  {
    id: 'ai-11-safety-checklist',
    kind: 'sequence',
    npc: 'RAG the Retriever',
    title: 'Catching a Confident Lie',
    prompt: 'Order this AI safety / hallucination-mitigation process.',
    items: [
      { id: 'ground', label: 'Ground responses with RAG' },
      { id: 'validate', label: 'Validate output against source data' },
      { id: 'route', label: 'Route uncertain cases to human review' },
      { id: 'log', label: 'Log everything for audit' },
    ],
    correctOrder: ['ground', 'validate', 'route', 'log'],
    successMessage: 'Grounded, validated, escalated when uncertain, and logged — that\'s how a confident-sounding wrong answer gets caught.',
    hints: [
      'Grounding the response in real data comes before you can validate it against anything.',
      'Only after validation do you know which cases are uncertain enough to route to a human.',
      'Ground with RAG → Validate against source data → Route uncertain cases to human review → Log everything for audit',
    ],
    xp: 65,
    tool: { name: 'Hallucination mitigation', icon: '🛡️', description: 'Ground, validate, escalate, log — the safety net around a model that can sound confident while being wrong.', fun: 4 },
  },

  {
    id: 'ai-12-cosine-similarity',
    kind: 'python',
    npc: 'Transformer',
    title: 'How Similar Are Two Meanings',
    prompt: 'Two embedding vectors: a = [1, 2, 3] and b = [2, 3, 4]. Compute their cosine similarity by hand — dot(a,b) / (magnitude(a) * magnitude(b)) — using math.sqrt, no libraries. Store the float in `result`.',
    starter: 'import math\n\na = [1, 2, 3]\nb = [2, 3, 4]\n\n# compute dot product and magnitudes, then cosine similarity\nresult = None\n',
    hints: [
      'The dot product is the sum of each pair of matching elements multiplied together.',
      'The magnitude of a vector is math.sqrt of the sum of its squared elements.',
      'dot = sum(x*y for x, y in zip(a, b))\nmag_a = math.sqrt(sum(x*x for x in a))\nmag_b = math.sqrt(sum(x*x for x in b))\nresult = dot / (mag_a * mag_b)',
    ],
    xp: 75,
    tool: { name: 'Cosine similarity', icon: '📐', description: 'The angle between two embedding vectors — how a vector database decides what "similar" means.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 0.9925833339709303, 0.001) ?? { success: true, message: 'Cosine similarity ≈ 0.993 — these two meanings point in almost the same direction.' },
  },

  {
    id: 'ai-13-mlops-flow',
    kind: 'sequence',
    npc: 'Dr. Neural',
    title: 'Which Model Actually Won?',
    prompt: 'Order this MLOps experiment-tracking flow, from running a training job to shipping the winner.',
    items: [
      { id: 'train', label: 'Train a model run' },
      { id: 'log', label: 'Log its parameters and metrics' },
      { id: 'compare', label: 'Compare against other runs' },
      { id: 'pick', label: 'Pick the best one' },
      { id: 'deploy', label: 'Deploy it' },
    ],
    correctOrder: ['train', 'log', 'compare', 'pick', 'deploy'],
    successMessage: 'Train, log, compare, pick, deploy — the loop that turns a pile of experiments into one deployed model.',
    hints: [
      'You can\'t log metrics from a run that hasn\'t trained yet.',
      'Comparing runs is what lets you actually pick the best one, rather than just the most recent one.',
      'Train a model run → Log its parameters and metrics → Compare against other runs → Pick the best one → Deploy it',
    ],
    xp: 70,
    tool: { name: 'Experiment tracking', icon: '🧪', description: 'Log every run\'s params and metrics so "which model won" is a query, not a guess.', fun: 4 },
  },

  {
    id: 'ai-14-final-boss',
    kind: 'sequence',
    npc: 'Dr. Neural',
    title: 'Reasoning With the Rogue AI',
    prompt: 'The Frontier\'s AI has been confidently wrong for weeks. Order the full process for fixing it, from catching the problem to trusting it again.',
    items: [
      { id: 'identify', label: 'Identify the hallucination' },
      { id: 'ground', label: 'Ground it with RAG' },
      { id: 'reevaluate', label: 'Re-evaluate with precision/recall' },
      { id: 'review', label: 'Add a human review step for edge cases' },
      { id: 'confirm', label: 'Confirm accuracy before trusting it again' },
    ],
    correctOrder: ['identify', 'ground', 'reevaluate', 'review', 'confirm'],
    successMessage: 'Identified, grounded, re-evaluated, reviewed, and confirmed — the rogue AI isn\'t rogue anymore. It\'s an ally you can actually trust.',
    hints: [
      'You have to catch the confident lie before you can do anything about it.',
      'After grounding it with real data, you measure whether it actually improved — that\'s what precision/recall is for.',
      'Identify the hallucination → Ground it with RAG → Re-evaluate with precision/recall → Add human review for edge cases → Confirm accuracy before trusting it again',
    ],
    xp: 220,
    tool: { name: 'AI Whisperer', icon: '🤖', description: 'Diagnosed a hallucinating AI, grounded it in real data, measured the fix, and built in a human safety net.', fun: 5 },
  },
]

export const AI_FRONTIER_ZONE = {
  id: 'ai-frontier',
  name: 'AI Frontier',
  palette: { bg: '#0a0a1a', ground: 0x1a0a2e, groundAccent: 0x2e1065 },
  decor: { kind: 'neon' },
  npcIntro: {
    name: 'Dr. Neural',
    lines: [
      "Welcome to the AI Frontier, Ziro.",
      "Something went wrong here. Our models started answering everything — confidently, fluently, and often completely wrong.",
      "A model doesn't know facts. It only knows patterns it's seen before, repeated back to you with total confidence whether or not they're true. That's not a bug you can patch with an apology — it's the actual shape of the technology.",
      "They weren't sabotaged. They were trained on bad assumptions, and nobody caught it in time. Now they lie without knowing they're lying.",
      "You'll need to understand this technology deeply — not just use it — if you're going to fix what's broken. Are you ready?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Dr. Neural', color: 0x8b5cf6, role: 'main' },
    { x: 2020, y: 560, name: 'Transformer', color: 0x06b6d4, flavor: 'Tokenize, embed, attend, generate. Every answer I give passes through all four stages.' },
    { x: 260, y: 860, name: 'RAG the Retriever', color: 0xf59e0b, flavor: 'Woof. I fetch the facts before anyone opens their mouth. Ground first, talk second.' },
    { x: 2020, y: 1160, name: 'Prompt Engineer Priya', color: 0xec4899, flavor: 'Half of "AI is wrong" is actually "the prompt asked the wrong thing." Let\'s fix the instructions first.' },
  ],
  challenges: AI_FRONTIER_CHALLENGES,
  nextZone: 'healthcare-highlands',
}
