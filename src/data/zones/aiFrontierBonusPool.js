import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// The bonus reserve pool for AI Frontier — 2x its 15 real chest positions.
// Once a chest is solved and the player moves past it via "Next", that
// chest's challenge gets replaced with one drawn from here (see
// gameStore.js's BONUS_POOLS registry / swapChallenge / getLiveChallenges),
// same mechanic as every other zone in this rollout. Pre-authored, never
// AI-generated at runtime. Same hard constraint as the main pool: Pyodide
// only ships the standard library here (no numpy/pandas/sklearn/micropip),
// so every bit of math is hand-rolled with plain loops/sums, never a
// library import.
//
// Split three ways:
//   - 10 hands-on (8x kind: 'python' hand-rolled math/ML building blocks,
//     2x kind: 'sequence') covering ground the main 15 don't: sigmoid
//     activation, softmax, mean squared error, one gradient-descent step,
//     min-max normalization, a deterministic train/test split, one-hot
//     encoding, tokenize+vocabulary building, the attention mechanism's
//     Query/Key/Value→scores→softmax→weighted-sum flow (sequence), and the
//     train/validation/test split protocol (sequence).
//   - 10 MCQ (kind: 'mcq') on ML/AI concepts with no single runnable
//     snippet of their own: regularization, transfer learning, what a
//     hallucination actually is, the temperature sampling parameter,
//     context windows, what an embedding represents, RAG vs. fine-tuning
//     for injecting new knowledge, bias in ML, model/concept drift, and
//     explainability.
//   - 10 matching (kind: 'matching') pairing terms across core ML
//     vocabulary, transformer/LLM vocabulary, evaluation metrics, AI
//     safety/reliability terms, RAG components, model-improvement
//     techniques, data-splitting terms, neural network vocabulary, LLM
//     sampling parameters, and MLOps vocabulary.

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

export const AI_FRONTIER_BONUS_POOL = [
  // ---------- hands-on (8x python, 2x sequence) ----------
  {
    id: 'ai-pool-01-sigmoid',
    kind: 'python',
    npc: 'Dr. Neural',
    title: 'Squashing a Number Into a Probability',
    prompt: 'A neuron computed a weighted sum z = 2.0. Apply the sigmoid activation function — 1 / (1 + e^-z) — using math.exp, no libraries. Store the float in `result`.',
    starter: 'import math\n\nz = 2.0\nresult = None\n',
    hints: [
      'Sigmoid squashes any real number into the range (0, 1) — useful for turning a raw score into something probability-like.',
      'math.exp(-z) gives you e^-z; the rest is just 1 / (1 + that).',
      'result = 1 / (1 + math.exp(-z))',
    ],
    xp: 65,
    tool: { name: 'Sigmoid activation', icon: '📉', description: 'Squashes any real number into the range (0, 1) — the classic activation for binary outputs.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 0.8807970779778823, 0.001) ?? { success: true, message: '≈0.881 — a weighted sum of 2.0, squashed into a probability-like value.' },
  },
  {
    id: 'ai-pool-02-softmax',
    kind: 'python',
    npc: 'Transformer',
    title: 'Turning Scores Into Probabilities',
    prompt: 'logits = [2.0, 1.0, 0.1] — raw, unnormalized scores from a model\'s final layer. Convert them into a probability distribution using softmax: exponentiate each value, then divide each by the sum of all the exponentials. Store the list of 3 probabilities in `result`.',
    starter: 'import math\n\nlogits = [2.0, 1.0, 0.1]\nresult = []\n',
    hints: [
      'Exponentiating first makes every value positive and amplifies the biggest one; dividing by the total then makes everything sum to exactly 1.',
      'exps = [math.exp(x) for x in logits], then divide each by sum(exps).',
      'exps = [math.exp(x) for x in logits]\ntotal = sum(exps)\nresult = [e / total for e in exps]',
    ],
    xp: 75,
    tool: { name: 'Softmax', icon: '📊', description: 'Converts raw scores into a probability distribution that sums to exactly 1.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [0.65900114, 0.24243297, 0.09856589], 0.001) ?? { success: true, message: 'Three probabilities, summing to 1 — the highest logit dominates, but every option keeps some weight.' },
  },
  {
    id: 'ai-pool-03-mse',
    kind: 'python',
    npc: 'Dr. Neural',
    title: 'Measuring How Wrong the Model Is',
    prompt: 'predictions = [3.0, 5.0, 2.5, 7.0]; actual = [2.5, 5.0, 4.0, 8.0]. Compute the Mean Squared Error: the average of (prediction - actual)² across every pair. Store the float in `result`.',
    starter: 'predictions = [3.0, 5.0, 2.5, 7.0]\nactual = [2.5, 5.0, 4.0, 8.0]\nresult = None\n',
    hints: [
      'Squaring each error before averaging punishes big misses far more than small ones.',
      'Zip the two lists together, square each difference, then average all of them.',
      'squared_errors = [(p - a) ** 2 for p, a in zip(predictions, actual)]\nresult = sum(squared_errors) / len(squared_errors)',
    ],
    xp: 70,
    tool: { name: 'Mean Squared Error', icon: '📏', description: 'Averages the squared prediction errors — the loss function behind most regression training.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 0.875, 0.001) ?? { success: true, message: '0.875 — a single number summarizing how far off the model\'s predictions were, on average.' },
  },
  {
    id: 'ai-pool-04-gradient-step',
    kind: 'python',
    npc: 'Dr. Neural',
    title: 'One Nudge Toward Less Wrong',
    prompt: 'weight = 4.0, gradient = 6.0 (how much the loss would increase if weight went up slightly), learning_rate = 0.1. Perform one step of gradient descent: new_weight = weight - learning_rate * gradient. Store the new weight in `result`.',
    starter: 'weight = 4.0\ngradient = 6.0\nlearning_rate = 0.1\nresult = None\n',
    hints: [
      'The gradient points toward INCREASING loss, so you subtract a fraction of it to move toward LOWER loss.',
      'The learning rate controls how big a step you take — too big and you overshoot, too small and training crawls.',
      'result = weight - learning_rate * gradient',
    ],
    xp: 65,
    tool: { name: 'Gradient descent step', icon: '⬇️', description: 'Nudges a weight opposite its gradient, scaled by the learning rate — the core of how models learn.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 3.4, 0.001) ?? { success: true, message: '3.4 — one small step down the loss surface, toward a better weight.' },
  },
  {
    id: 'ai-pool-05-minmax-normalization',
    kind: 'python',
    npc: 'Prompt Engineer Priya',
    title: 'Putting Every Feature on the Same Scale',
    prompt: 'values = [10, 20, 30, 40, 50]. Scale them into the range [0, 1] using min-max normalization: (x - min) / (max - min) for each value. Store the list in `result`.',
    starter: 'values = [10, 20, 30, 40, 50]\nresult = []\n',
    hints: [
      'The smallest value should map to exactly 0, and the largest to exactly 1 — everything else falls proportionally in between.',
      'Compute min(values) and max(values) once, then apply the formula to every value.',
      "lo, hi = min(values), max(values)\nresult = [(x - lo) / (hi - lo) for x in values]",
    ],
    xp: 65,
    tool: { name: 'Min-max normalization', icon: '📐', description: 'Rescales values into [0, 1] so no single feature dominates just because of its raw scale.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [0.0, 0.25, 0.5, 0.75, 1.0], 0.001) ?? { success: true, message: 'Every value now sits between 0 and 1, in the same relative positions as before.' },
  },
  {
    id: 'ai-pool-06-train-test-split',
    kind: 'python',
    npc: 'RAG the Retriever',
    title: 'Holding Some Data Back',
    prompt: 'data = list(range(1, 11)) — ten samples. Split them into an 80/20 train/test split — the first 80% as train, the remaining 20% as test, with no shuffling (so it stays deterministic). Store `result = {\'train\': [...], \'test\': [...]}`.',
    starter: 'data = list(range(1, 11))\nresult = {}\n',
    hints: [
      'With 10 samples, 80% is exactly 8 — everything up to index 8 is train, everything after is test.',
      'split_idx = int(len(data) * 0.8) gives you the cut point for slicing.',
      "split_idx = int(len(data) * 0.8)\nresult = {'train': data[:split_idx], 'test': data[split_idx:]}",
    ],
    xp: 60,
    tool: { name: 'Train/test split', icon: '✂️', description: 'Holds back a slice of data the model never trains on, so evaluation stays honest.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { train: [1, 2, 3, 4, 5, 6, 7, 8], test: [9, 10] }) ?? { success: true, message: 'Eight samples to learn from, two held back to honestly check the result.' },
  },
  {
    id: 'ai-pool-07-one-hot',
    kind: 'python',
    npc: 'Transformer',
    title: 'Turning Words Into Numbers a Model Can Use',
    prompt: "labels = ['cat', 'dog', 'bird']; categories = ['bird', 'cat', 'dog'] is the fixed category order. One-hot encode each label as a list matching that order — 1 where it matches, 0 everywhere else. Store the list of one-hot vectors (in the same order as `labels`) in `result`.",
    starter: "labels = ['cat', 'dog', 'bird']\ncategories = ['bird', 'cat', 'dog']\nresult = []\n",
    hints: [
      'For each label, its one-hot vector is all zeros except a single 1 at the position where categories matches it.',
      'categories.index(label) gives you which position should be 1; build a list of 0s the same length as categories and set that one position.',
      "for label in labels:\n    vec = [0] * len(categories)\n    vec[categories.index(label)] = 1\n    result.append(vec)",
    ],
    xp: 70,
    tool: { name: 'One-hot encoding', icon: '🔢', description: 'Represents a category as a vector of 0s with a single 1 — no false sense of numeric order between categories.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [[0, 1, 0], [0, 0, 1], [1, 0, 0]]) ?? { success: true, message: 'Three categories, each its own clean vector — no category accidentally implies it\'s "bigger" than another.' },
  },
  {
    id: 'ai-pool-08-tokenize-vocab',
    kind: 'python',
    npc: 'Transformer',
    title: 'Building a Vocabulary From Scratch',
    prompt: "text = 'the cat sat on the mat'. Split it into whitespace tokens, then build a vocabulary: a dict mapping each UNIQUE word to an integer id, assigned in the order each word FIRST appears (repeated words reuse their first id). Store the vocabulary dict in `result`.",
    starter: "text = 'the cat sat on the mat'\nresult = {}\n",
    hints: [
      'Split the text on whitespace first, then walk the tokens in order, only assigning a new id the first time a word appears.',
      'For each token, if it\'s not already a key in result, give it the next available id (the current size of result).',
      "for word in text.split():\n    if word not in result:\n        result[word] = len(result)",
    ],
    xp: 70,
    tool: { name: 'Tokenization & vocabulary', icon: '🔤', description: 'Every unique word gets a stable integer id — the first step before any embedding can happen.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, {
      the: 0, cat: 1, sat: 2, on: 3, mat: 4,
    }) ?? { success: true, message: 'Five unique words, five stable ids — \'the\' reused its id the second time it appeared.' },
  },
  {
    id: 'ai-pool-09-attention-mechanism',
    kind: 'sequence',
    npc: 'Transformer',
    title: 'What Attention Actually Computes',
    prompt: 'Order the steps of the attention mechanism — how a transformer decides what to focus on.',
    items: [
      { id: 'qkv', label: 'Each token is projected into a Query, a Key, and a Value vector' },
      { id: 'scores', label: 'Every token\'s Query is compared (dot product) against every other token\'s Key, producing raw attention scores' },
      { id: 'softmax', label: 'Softmax turns those raw scores into weights that sum to 1' },
      { id: 'weighted', label: 'Those weights are used to compute a weighted sum of every token\'s Value vector' },
    ],
    correctOrder: ['qkv', 'scores', 'softmax', 'weighted'],
    successMessage: 'Query meets Key, softmax turns the match scores into weights, and those weights blend the Values — that\'s attention.',
    hints: [
      'Nothing can be compared until every token first has its own Query/Key/Value vectors.',
      'Softmax turns raw comparison scores into normalized weights before those weights are ever applied to anything.',
      'Project into Query/Key/Value → Compare Query to every Key → Softmax the scores → Weighted sum of Values',
    ],
    xp: 85,
    tool: { name: 'Attention mechanism (Q/K/V)', icon: '🔮', description: 'Query meets Key to produce scores; softmax weights those scores; the result blends every token\'s Value.', fun: 5 },
  },
  {
    id: 'ai-pool-10-train-val-test-protocol',
    kind: 'sequence',
    npc: 'RAG the Retriever',
    title: 'Why Three Splits, Not Two',
    prompt: 'Order the disciplined way a dataset gets split and used, from training to the final honest check.',
    items: [
      { id: 'train', label: 'Train split: the model actually learns its parameters from this data' },
      { id: 'validation', label: 'Validation split: used repeatedly to tune hyperparameters and pick the best version' },
      { id: 'freeze', label: 'Once satisfied, all tuning stops — the test split has still never been touched' },
      { id: 'test', label: 'Test split: evaluated exactly once, giving an honest estimate of real-world performance' },
    ],
    correctOrder: ['train', 'validation', 'freeze', 'test'],
    successMessage: 'The test split only ever gets used once, at the very end — that\'s what keeps its number honest.',
    hints: [
      'Two of these splits get used repeatedly during development; one is deliberately saved for a single, final check.',
      'If you tuned anything based on the test split\'s results, it would stop being an honest estimate — that\'s exactly why validation exists as a separate, reusable split.',
      'Train on the train split → Tune repeatedly using validation → Stop tuning entirely → Evaluate on test exactly once',
    ],
    xp: 75,
    tool: { name: 'Train/validation/test protocol', icon: '🔒', description: 'Validation gets tuned against repeatedly; test is touched exactly once, to stay honest.', fun: 4 },
  },

  // ---------- MCQ: ML/AI concepts ----------
  {
    id: 'ai-pool-11-mcq-regularization',
    kind: 'mcq',
    npc: 'Dr. Neural',
    title: 'Keeping a Model From Memorizing Noise',
    prompt: 'What does regularization do during model training?',
    options: [
      'Adds a penalty for excessive model complexity, discouraging the model from overfitting to noise in the training data',
      'Automatically collects more training data',
      'Makes the model train faster, with no effect on accuracy',
      'Only applies to image-based models, never text or tabular data',
    ],
    correctIndex: 0,
    explanation: 'Regularization (like L1/L2 penalties) adds a cost for overly complex models — large weights, in most implementations — nudging training toward simpler solutions that generalize better instead of memorizing training-set noise.',
    hints: [
      'It\'s specifically a countermeasure against a model becoming too complex and memorizing noise instead of the real pattern.',
      'Think back to the "overfit" end of the bias-variance spectrum this zone already introduced — this is one of the main tools for pulling back from it.',
      'The correct answer is: adds a penalty for excessive complexity, discouraging overfitting to noise.',
    ],
    xp: 50,
    tool: { name: 'Regularization', icon: '🎯', description: 'Penalizes excessive complexity to keep a model from overfitting to noise.', fun: 3 },
  },
  {
    id: 'ai-pool-12-mcq-transfer-learning',
    kind: 'mcq',
    npc: 'Dr. Neural',
    title: 'Not Starting From Zero',
    prompt: 'What is transfer learning?',
    options: [
      'Reusing a model already trained on a large, related task as a starting point, instead of training a brand-new model from scratch',
      'Physically moving a trained model file to a different server',
      'Training two unrelated models at the exact same time',
      'A technique that only works for training data stored in the cloud',
    ],
    correctIndex: 0,
    explanation: 'Transfer learning takes a model already trained on a large dataset (learning general features) and adapts it to a new, often smaller, related task — much cheaper than training from scratch, and often more accurate with limited data.',
    hints: [
      'It\'s about reusing what a model already learned, not moving files or running things in parallel.',
      'Think about why you\'d start from a pretrained model instead of random initial weights.',
      'The correct answer is: reusing a model already trained on a related task, instead of starting from scratch.',
    ],
    xp: 50,
    tool: { name: 'Transfer learning', icon: '🔄', description: 'Starts from a model already trained on a related task, instead of from scratch.', fun: 3 },
  },
  {
    id: 'ai-pool-13-mcq-hallucination',
    kind: 'mcq',
    npc: 'RAG the Retriever',
    title: 'What "Hallucination" Actually Means',
    prompt: "In the context of language models, what is a 'hallucination'?",
    options: [
      'The model generating fluent, confident-sounding content that is factually incorrect or unsupported by any real source',
      'A visual glitch in the model\'s user interface',
      'A model refusing to answer any question at all',
      'A training technique used to make models more creative on purpose',
    ],
    correctIndex: 0,
    explanation: 'A hallucination is exactly what this zone\'s NPC intro describes — a model producing plausible, fluent, confident text that simply isn\'t true, because the model only knows patterns, not verified facts.',
    hints: [
      'It\'s about the CONTENT being wrong, not about a visual bug or a model refusing to respond.',
      'The scary part isn\'t that it\'s wrong — it\'s that it sounds exactly as confident as when it\'s right.',
      'The correct answer is: fluent, confident content that is factually incorrect or unsupported.',
    ],
    xp: 45,
    tool: { name: 'Hallucination', icon: '👻', description: 'Fluent, confident-sounding output that is factually wrong or unsupported.', fun: 3 },
  },
  {
    id: 'ai-pool-14-mcq-temperature',
    kind: 'mcq',
    npc: 'Prompt Engineer Priya',
    title: 'Controlling How "Random" a Model Sounds',
    prompt: "What does the 'temperature' parameter control when sampling from a language model?",
    options: [
      'How random or deterministic the output is — low temperature favors the most likely next token every time; high temperature allows more varied, surprising choices',
      'How fast the model generates text',
      'The literal computing temperature of the GPU running the model',
      'How many tokens the model is allowed to generate in total',
    ],
    correctIndex: 0,
    explanation: 'Temperature reshapes the probability distribution over the next token before sampling — low temperature (near 0) makes the model almost always pick the single most likely token (deterministic, repetitive); high temperature flattens the distribution, allowing less-likely tokens a real chance (more varied, sometimes less coherent).',
    hints: [
      'It affects HOW the model picks its next word from the probability distribution, not its speed or hardware.',
      'Low = safe and predictable; high = varied and sometimes surprising.',
      'The correct answer is: controls how random vs. deterministic the token choice is — low favors the most likely, high allows more variety.',
    ],
    xp: 50,
    tool: { name: 'Temperature (sampling)', icon: '🌡️', description: 'Low temperature = predictable output; high temperature = more varied, less certain output.', fun: 3 },
  },
  {
    id: 'ai-pool-15-mcq-context-window',
    kind: 'mcq',
    npc: 'Transformer',
    title: 'How Much a Model Can "See" at Once',
    prompt: "What is a language model's 'context window'?",
    options: [
      'The maximum amount of text (measured in tokens) the model can consider at once — anything beyond that limit gets truncated or ignored',
      'A visual window in the chat interface showing the conversation',
      'The number of parameters in the model',
      'The physical size of the server rack running the model',
    ],
    correctIndex: 0,
    explanation: 'Every model has a hard limit on how many tokens (prompt + prior conversation + generated output combined) it can process at once — a longer conversation or document than that limit gets truncated, which is why very long documents often need chunking (as in RAG) rather than being pasted in whole.',
    hints: [
      'It\'s a hard, numeric limit measured in tokens, not a visual UI element.',
      'This limit is exactly why RAG chunks documents instead of pasting an entire book into one prompt.',
      'The correct answer is: the maximum amount of text (in tokens) the model can consider at once.',
    ],
    xp: 45,
    tool: { name: 'Context window', icon: '🪟', description: 'The maximum number of tokens a model can consider at once.', fun: 3 },
  },
  {
    id: 'ai-pool-16-mcq-embeddings-concept',
    kind: 'mcq',
    npc: 'Transformer',
    title: 'What an Embedding Actually Represents',
    prompt: 'What does an embedding vector represent?',
    options: [
      'A numeric representation of meaning, positioned in space so that things with similar meaning end up close together',
      'A compressed, lossy copy of the exact original text, recoverable by decompression',
      'A random number assigned arbitrarily to each word',
      'The literal pixel values of an image, unrelated to meaning'
    ],
    correctIndex: 0,
    explanation: 'An embedding maps a piece of text (or image, etc.) to a point in a high-dimensional vector space, learned so that semantically similar inputs land near each other — which is exactly what makes cosine similarity between two embeddings meaningful.',
    hints: [
      'It\'s not a compression scheme you can reverse back into the exact original text — it\'s about MEANING, positioned in space.',
      'Two embeddings being close together is precisely what "similar meaning" looks like numerically.',
      'The correct answer is: a numeric representation of meaning, where similar meanings land close together in space.',
    ],
    xp: 50,
    tool: { name: 'Embeddings', icon: '📐', description: 'A numeric representation of meaning — similar meanings land close together in vector space.', fun: 3 },
  },
  {
    id: 'ai-pool-17-mcq-rag-vs-finetune',
    kind: 'mcq',
    npc: 'RAG the Retriever',
    title: 'Teaching a Model New Facts',
    prompt: "You need a model to accurately answer questions using your company's constantly-updating internal documents. Why is RAG usually a better fit for this than fine-tuning?",
    options: [
      'RAG retrieves current documents at query time (easy to keep up to date, and traceable back to a source), while fine-tuning bakes facts into the model\'s weights — expensive to redo, and can still hallucinate details it wasn\'t precisely trained on',
      'Fine-tuning is always cheaper and faster than RAG for every use case',
      'RAG and fine-tuning are exactly the same technique with different names',
      'Fine-tuning is the only way to ever incorporate any new information into a model\'s answers'
    ],
    correctIndex: 0,
    explanation: 'RAG grounds answers in documents fetched at query time — update the documents, and the model\'s answers update immediately, with a traceable source. Fine-tuning bakes information into weights, which is expensive to redo whenever documents change, and doesn\'t guarantee the model recalls every specific fact precisely.',
    hints: [
      'Think about what happens the moment your internal documents change — which approach adapts instantly, and which requires expensive retraining?',
      'One approach can point back to exactly which document an answer came from; the other can\'t.',
      'The correct answer is: RAG retrieves current, traceable documents at query time; fine-tuning bakes facts into weights, which is expensive to keep updated.',
    ],
    xp: 55,
    tool: { name: 'RAG vs. fine-tuning for new facts', icon: '📚', description: 'RAG stays current and traceable; fine-tuning is expensive to redo every time facts change.', fun: 4 },
  },
  {
    id: 'ai-pool-18-mcq-bias',
    kind: 'mcq',
    npc: 'Dr. Neural',
    title: 'Bias Isn\'t Just Randomness',
    prompt: 'In machine learning, what does it mean for a model to have "bias" in its predictions?',
    options: [
      'The model makes systematic errors in a consistent direction, often because its training data was unrepresentative or itself reflected historical inequities',
      'The model makes purely random, unpredictable mistakes with no pattern',
      'The model always favors whichever answer comes first alphabetically',
      'Bias only refers to a bias term (a number) inside a neural network, nothing else'
    ],
    correctIndex: 0,
    explanation: 'Bias in this sense is systematic, not random — if training data underrepresents certain groups or situations, the model\'s errors will consistently skew in ways that reflect that gap, which is why examining training data composition is a core part of responsible ML.',
    hints: [
      'The key word is SYSTEMATIC — this is about a consistent pattern in the errors, not randomness.',
      'It often traces back to what the training data did (or didn\'t) represent well.',
      'The correct answer is: systematic errors in a consistent direction, often from unrepresentative training data.',
    ],
    xp: 50,
    tool: { name: 'Bias (in ML)', icon: '⚖️', description: 'Systematic errors in a consistent direction, often traced back to unrepresentative training data.', fun: 3 },
  },
  {
    id: 'ai-pool-19-mcq-model-drift',
    kind: 'mcq',
    npc: 'Dr. Neural',
    title: 'A Model That Used to Work',
    prompt: 'What is "model drift" (or "concept drift")?',
    options: [
      'A deployed model\'s real-world accuracy degrading over time as the actual data distribution shifts away from what it was originally trained on',
      'A model physically moving between different servers',
      'A bug that only happens once, then never again',
      'A deliberate technique for making a model more accurate over time automatically'
    ],
    correctIndex: 0,
    explanation: 'The world changes after a model ships — user behavior, product catalogs, language usage — and a model trained on old data can quietly get worse at the exact same task over time as reality drifts away from its training assumptions, which is why models need ongoing monitoring, not just a one-time evaluation.',
    hints: [
      'It\'s about the WORLD changing after the model was trained, not the model itself moving anywhere.',
      'This is exactly why "evaluate once and ship forever" isn\'t a safe approach for a production model.',
      'The correct answer is: a deployed model\'s accuracy degrading as real-world data shifts away from its training data.',
    ],
    xp: 55,
    tool: { name: 'Model / concept drift', icon: '📉', description: 'A deployed model quietly getting worse as the real world shifts away from its training data.', fun: 3 },
  },
  {
    id: 'ai-pool-20-mcq-explainability',
    kind: 'mcq',
    npc: 'Prompt Engineer Priya',
    title: 'Why the Model Said That',
    prompt: 'Why does model explainability/interpretability matter?',
    options: [
      'It lets people understand WHY a model made a specific prediction — critical for debugging, building trust, and meeting compliance requirements in regulated domains',
      'It makes a model run measurably faster',
      'It\'s only a nice-to-have with no real practical use',
      'It automatically fixes any bias present in the model'
    ],
    correctIndex: 0,
    explanation: 'Being able to explain a specific prediction — which inputs mattered most, why this output over another — matters for debugging unexpected behavior, building user/stakeholder trust, and satisfying legal/regulatory requirements in domains like healthcare and finance where an unexplainable "black box" decision may not be acceptable.',
    hints: [
      'It\'s about UNDERSTANDING a decision after the fact, not about speed or automatically fixing anything.',
      'Think about regulated industries — why might "the model just said so" not be good enough there?',
      'The correct answer is: it lets people understand why a model made a specific prediction, for debugging, trust, and compliance.',
    ],
    xp: 50,
    tool: { name: 'Explainability', icon: '🔍', description: 'Understanding why a model made a specific prediction — for debugging, trust, and compliance.', fun: 3 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'ai-pool-21-match-mlterms',
    kind: 'matching',
    npc: 'Dr. Neural',
    title: 'Core ML Vocabulary',
    prompt: 'Match each core ML term to its meaning.',
    pairs: [
      { id: 'a', left: 'Overfitting', right: 'The model memorizes noise in the training data instead of the real pattern' },
      { id: 'b', left: 'Underfitting', right: 'The model is too simple to even capture the real pattern' },
      { id: 'c', left: 'Regularization', right: 'Penalizes excessive complexity to reduce overfitting' },
      { id: 'd', left: 'Hyperparameter', right: 'A setting chosen before training begins (like learning rate), not learned from the data itself' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'Overfitting and Underfitting are the two failure modes; Regularization and Hyperparameter are both things you CONTROL before/during training.',
      'A hyperparameter is set by you beforehand; regularization is a specific technique that fights overfitting.',
      'Overfitting → memorizes noise. Underfitting → too simple to capture the pattern. Regularization → penalizes complexity. Hyperparameter → a pre-training setting, not learned.',
    ],
    xp: 60,
    successMessage: 'The core vocabulary behind every model-training tradeoff, matched up.',
    tool: { name: 'Core ML vocabulary', icon: '🎯', description: 'Overfitting, underfitting, regularization, and hyperparameters.', fun: 3 },
  },
  {
    id: 'ai-pool-22-match-transformervocab',
    kind: 'matching',
    npc: 'Transformer',
    title: 'Transformer & LLM Vocabulary',
    prompt: 'Match each transformer/LLM term to its meaning.',
    pairs: [
      { id: 'a', left: 'Token', right: 'A small chunk of text (often a word piece) that a model actually processes' },
      { id: 'b', left: 'Embedding', right: 'A numeric vector representing a token\'s meaning' },
      { id: 'c', left: 'Attention', right: 'Lets every token weigh how relevant every other token is to it' },
      { id: 'd', left: 'Context window', right: 'The maximum number of tokens a model can consider at once' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Token and Embedding both describe a single unit of input; Attention and Context window both describe how the model handles MANY tokens together.',
      'Attention is about tokens relating to EACH OTHER; context window is about the total CAPACITY of tokens at once.',
      'Token → a chunk of text. Embedding → a numeric vector of meaning. Attention → tokens weighing relevance to each other. Context window → the max tokens considered at once.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind every transformer-based model, matched up.',
    tool: { name: 'Transformer vocabulary', icon: '🔮', description: 'Tokens, embeddings, attention, and the context window.', fun: 4 },
  },
  {
    id: 'ai-pool-23-match-evalmetrics',
    kind: 'matching',
    npc: 'Dr. Neural',
    title: 'Evaluation Metrics',
    prompt: 'Match each evaluation metric to what it measures.',
    pairs: [
      { id: 'a', left: 'Precision', right: 'Of everything the model flagged as positive, how much actually was' },
      { id: 'b', left: 'Recall', right: 'Of everything that was actually positive, how much the model actually caught' },
      { id: 'c', left: 'F1 score', right: 'The harmonic mean of precision and recall, balancing both into one number' },
      { id: 'd', left: 'Accuracy', right: 'The overall fraction of predictions that were correct — can be misleading on imbalanced data' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Precision and Recall each answer a DIFFERENT direction of "how good" (correctness of flagged cases vs. coverage of real cases); F1 and Accuracy each try to summarize things into ONE number, in different ways.',
      'Accuracy alone can look great even when a model misses almost all the rare, important cases — this zone\'s "99% accuracy" challenge showed exactly that.',
      'Precision → correctness of flagged positives. Recall → coverage of actual positives. F1 → balances precision and recall. Accuracy → overall correct fraction, can mislead on imbalanced data.',
    ],
    xp: 65,
    successMessage: 'The four core evaluation metrics, matched to what each actually measures.',
    tool: { name: 'Evaluation metrics', icon: '📊', description: 'Precision, recall, F1 score, and accuracy compared.', fun: 4 },
  },
  {
    id: 'ai-pool-24-match-aisafety',
    kind: 'matching',
    npc: 'RAG the Retriever',
    title: 'AI Safety & Reliability Vocabulary',
    prompt: 'Match each AI safety/reliability term to its meaning.',
    pairs: [
      { id: 'a', left: 'Hallucination', right: 'Fluent, confident output that is factually wrong or unsupported' },
      { id: 'b', left: 'Grounding', right: 'Basing a response on real, retrieved source material instead of the model\'s memory alone' },
      { id: 'c', left: 'Human-in-the-loop', right: 'Routing uncertain or high-stakes cases to a person for review instead of fully automating them' },
      { id: 'd', left: 'Bias', right: 'Systematic errors in a consistent direction, often from unrepresentative training data' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Hallucination is the PROBLEM; Grounding and Human-in-the-loop are two different MITIGATIONS for it; Bias is a related but distinct failure mode.',
      'Grounding fixes hallucination by anchoring answers in real documents; human-in-the-loop catches whatever grounding alone can\'t.',
      'Hallucination → confident but wrong output. Grounding → anchors answers in real retrieved sources. Human-in-the-loop → routes uncertain cases to a person. Bias → systematic errors from training data.',
    ],
    xp: 65,
    successMessage: 'The core AI safety vocabulary — the problem and its mitigations — matched up.',
    tool: { name: 'AI safety vocabulary', icon: '🛡️', description: 'Hallucination, grounding, human-in-the-loop review, and bias.', fun: 4 },
  },
  {
    id: 'ai-pool-25-match-ragcomponents',
    kind: 'matching',
    npc: 'RAG the Retriever',
    title: 'RAG Components',
    prompt: 'Match each RAG component to its role in the pipeline.',
    pairs: [
      { id: 'a', left: 'Chunking', right: 'Splits long documents into smaller pieces small enough to embed and retrieve individually' },
      { id: 'b', left: 'Embedding model', right: 'Converts text into a vector representing its meaning' },
      { id: 'c', left: 'Vector database', right: 'Stores embeddings and finds the most similar ones quickly' },
      { id: 'd', left: 'Retriever', right: 'Takes a query, embeds it, and fetches the most relevant chunks from the vector database' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Chunking and Embedding model both happen during document PREPARATION; Vector database and Retriever both come into play at QUERY time.',
      'The retriever is the piece that actually ties a live query to the stored embeddings.',
      'Chunking → splits documents into pieces. Embedding model → converts text to vectors. Vector database → stores and searches embeddings. Retriever → embeds a query and fetches relevant chunks.',
    ],
    xp: 65,
    successMessage: 'Every stage of a RAG pipeline, matched to its exact role.',
    tool: { name: 'RAG components', icon: '📚', description: 'Chunking, embedding models, vector databases, and retrievers.', fun: 4 },
  },
  {
    id: 'ai-pool-26-match-improvementtechniques',
    kind: 'matching',
    npc: 'Prompt Engineer Priya',
    title: 'Model Improvement Techniques',
    prompt: 'Match each technique for improving an LLM\'s answers to its definition.',
    pairs: [
      { id: 'a', left: 'Prompt engineering', right: 'Writing better instructions — cheapest option, no retraining or new infrastructure' },
      { id: 'b', left: 'RAG', right: 'Grounds answers in retrieved documents at query time, without changing the model itself' },
      { id: 'c', left: 'Fine-tuning', right: 'Retrains the model\'s own weights on new examples — the most expensive option' },
      { id: 'd', left: 'Transfer learning', right: 'Starts from a model already trained on a related task, instead of from scratch' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Prompt engineering, RAG, and Fine-tuning form an escalating ladder of cost/effort; Transfer learning is a related but distinct idea about where training STARTS from.',
      'Fine-tuning changes the model\'s weights directly; RAG leaves the model untouched and changes what it\'s given to work with.',
      'Prompt engineering → better instructions, cheapest. RAG → grounds via retrieval, no retraining. Fine-tuning → retrains weights, most expensive. Transfer learning → starts from a related pretrained model.',
    ],
    xp: 65,
    successMessage: 'Every rung of the improvement ladder, matched to what it actually involves.',
    tool: { name: 'Model improvement techniques', icon: '🪜', description: 'Prompt engineering, RAG, fine-tuning, and transfer learning.', fun: 4 },
  },
  {
    id: 'ai-pool-27-match-datasplitting',
    kind: 'matching',
    npc: 'Dr. Neural',
    title: 'Data Splitting Vocabulary',
    prompt: 'Match each data-splitting term to its meaning.',
    pairs: [
      { id: 'a', left: 'Train set', right: 'The data the model actually learns its parameters from' },
      { id: 'b', left: 'Validation set', right: 'Used repeatedly to tune hyperparameters and pick the best model version' },
      { id: 'c', left: 'Test set', right: 'Evaluated exactly once, at the very end, for an honest performance estimate' },
      { id: 'd', left: 'Cross-validation', right: 'Repeatedly splitting data into different train/validation folds to get a more reliable performance estimate' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Train, Validation, and Test describe the THREE-WAY split protocol itself; Cross-validation is a different, more thorough TECHNIQUE for getting a reliable estimate.',
      'The test set is touched exactly once; validation is touched repeatedly during tuning; cross-validation is essentially repeating the train/validation split many times over.',
      'Train set → the model learns from this. Validation set → tuned against repeatedly. Test set → evaluated once, at the end. Cross-validation → repeated folds for a more reliable estimate.',
    ],
    xp: 65,
    successMessage: 'The full data-splitting discipline, matched to what each piece is actually for.',
    tool: { name: 'Data splitting vocabulary', icon: '✂️', description: 'Train, validation, test sets, and cross-validation.', fun: 4 },
  },
  {
    id: 'ai-pool-28-match-nnvocab',
    kind: 'matching',
    npc: 'Transformer',
    title: 'Neural Network Vocabulary',
    prompt: 'Match each neural network term to its meaning.',
    pairs: [
      { id: 'a', left: 'Weight', right: 'A learned number controlling how much one input influences a neuron\'s output' },
      { id: 'b', left: 'Bias (the neuron term)', right: 'A learned offset added to a neuron\'s weighted sum, shifting its output' },
      { id: 'c', left: 'Activation function', right: 'Introduces non-linearity, applied after the weighted sum (e.g. sigmoid, ReLU)' },
      { id: 'd', left: 'Loss function', right: 'Measures how wrong the model\'s predictions are, guiding what to adjust during training' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Weight and Bias (the neuron term, not the fairness one) are both learned NUMBERS inside a single neuron; Activation function and Loss function are both FUNCTIONS applied around the network\'s computations.',
      'Activation function shapes a single neuron\'s output; loss function measures the WHOLE model\'s wrongness, guiding training.',
      'Weight → controls an input\'s influence. Bias → a learned offset added to the sum. Activation function → adds non-linearity. Loss function → measures overall wrongness, guides training.',
    ],
    xp: 65,
    successMessage: 'The core building blocks of every neural network, matched up.',
    tool: { name: 'Neural network vocabulary', icon: '⚡', description: 'Weights, biases, activation functions, and loss functions.', fun: 4 },
  },
  {
    id: 'ai-pool-29-match-samplingparams',
    kind: 'matching',
    npc: 'Prompt Engineer Priya',
    title: 'LLM Sampling Parameters',
    prompt: 'Match each LLM sampling parameter to what it controls.',
    pairs: [
      { id: 'a', left: 'Temperature', right: 'How random vs. deterministic token choice is — low favors the most likely token' },
      { id: 'b', left: 'Top-p (nucleus sampling)', right: 'Only samples from the smallest set of tokens whose combined probability reaches p' },
      { id: 'c', left: 'Top-k', right: 'Only samples from the k most likely next tokens, ignoring the rest entirely' },
      { id: 'd', left: 'Max tokens', right: 'A hard cap on how much text the model is allowed to generate in one response' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Temperature, Top-p, and Top-k all shape WHICH token gets picked next; Max tokens is a completely separate limit on HOW MUCH gets generated overall.',
      'Top-k cuts off at a fixed COUNT of candidates; Top-p cuts off at a fixed cumulative PROBABILITY instead.',
      'Temperature → randomness of token choice. Top-p → samples from the smallest probability-p set. Top-k → samples from only the k most likely tokens. Max tokens → hard cap on total output length.',
    ],
    xp: 65,
    successMessage: 'The core sampling parameters behind every LLM response, matched to what each actually controls.',
    tool: { name: 'LLM sampling parameters', icon: '🎛️', description: 'Temperature, top-p, top-k, and max tokens.', fun: 4 },
  },
  {
    id: 'ai-pool-30-match-mlopsvocab',
    kind: 'matching',
    npc: 'Dr. Neural',
    title: 'MLOps Vocabulary',
    prompt: 'Match each MLOps term to its meaning.',
    pairs: [
      { id: 'a', left: 'Experiment tracking', right: 'Logging every training run\'s parameters and metrics so comparisons are a query, not a guess' },
      { id: 'b', left: 'Model registry', right: 'A central catalog of trained model versions, ready to be deployed' },
      { id: 'c', left: 'Model drift', right: 'A deployed model\'s accuracy degrading as real-world data shifts away from its training data' },
      { id: 'd', left: 'A/B testing', right: 'Routing a portion of real traffic to a new model version to compare its real performance against the old one' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Experiment tracking and Model registry both happen BEFORE/AT deployment (comparing and cataloging candidates); Model drift and A/B testing both concern what happens AFTER deployment.',
      'A/B testing compares two models on REAL traffic; model drift is about ONE already-deployed model slowly getting worse over time.',
      'Experiment tracking → logs runs for comparison. Model registry → catalogs deployable versions. Model drift → accuracy degrading post-deployment. A/B testing → compares versions on real traffic.',
    ],
    xp: 65,
    successMessage: 'The core MLOps vocabulary, from experimentation through to what happens after deployment.',
    tool: { name: 'MLOps vocabulary', icon: '🧪', description: 'Experiment tracking, model registries, model drift, and A/B testing.', fun: 4 },
  },
]
