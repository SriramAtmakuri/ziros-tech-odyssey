import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// Every challenge stores its answer in a variable called `result` — the
// prompts say so explicitly. check() reads it back via Pyodide's FFI
// (pyGet) and compares the real Python value, not printed text, so a
// dict-order difference or an extra print() never breaks a correct answer.

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

export const ALGORITHM_DUNGEON_CHALLENGES = [
  {
    id: 'algo-01-two-sum',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Two-Coin Lock',
    prompt: "This door only opens for two coins whose values add up to exactly 9. nums = [2, 7, 11, 15]. Don't check every pair one by one — use a hash map (dict) to find the indices of the two numbers that add to `target` in a single pass. Store the two indices as a list in `result`, e.g. [0, 1].",
    starter: "nums = [2, 7, 11, 15]\ntarget = 9\nseen = {}  # maps value -> index already seen\nresult = []\nfor i, num in enumerate(nums):\n    complement = target - num\n    pass  # if complement is already in `seen`, you found your pair — set result and stop\n",
    hints: [
      'You do not need to compare every pair — a dict lets you remember what you have already walked past.',
      'For each number, compute complement = target - num. If complement is already a key in `seen`, you have your answer.',
      'for i, num in enumerate(nums):\n    complement = target - num\n    if complement in seen:\n        result = [seen[complement], i]\n        break\n    seen[num] = i',
    ],
    xp: 50,
    tool: { name: 'Hash map lookup', icon: '🗝️', description: 'A dict turns "have I seen this?" into an O(1) check instead of a nested loop.', fun: 4 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      const got = pyGet(pyodide, 'result')
      if (!Array.isArray(got) || got.length !== 2) {
        return { success: false, message: `result was ${JSON.stringify(got)} — the lock wants a list of exactly two indices.` }
      }
      const gotSorted = [...got].sort((a, b) => a - b)
      if (gotSorted[0] !== 0 || gotSorted[1] !== 1) {
        return { success: false, message: `result was ${JSON.stringify(got)} — those two indices don't add up to the target.` }
      }
      return { success: true, message: 'Index 0 and index 1 — 2 + 7 = 9. Found in a single pass, not a nested loop. The lock clicks open.' }
    },
  },

  {
    id: 'algo-02-valid-parentheses',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Bracket Ward',
    prompt: 'An old ward glyph reads s = "({[]})" — the door only opens if every bracket is properly closed, in the right order. Use a stack: push opening brackets, and when you hit a closing bracket, pop and check it matches. (For reference, s = "(]" would be unbalanced and should give False — but you only need to solve for the glyph above.) Store True or False in `result`.',
    starter: "s = \"({[]})\"\npairs = {')': '(', ']': '[', '}': '{'}\nstack = []\nvalid = True\nfor ch in s:\n    pass  # push opening brackets onto stack; for closing brackets, pop and check pairs[ch] matches\nresult = valid and len(stack) == 0\n",
    hints: [
      'A stack is perfect here: the most recent opening bracket must be the next one closed.',
      'If ch is one of "([{", push it. If ch is one of ")]}", pop the stack — if the stack is empty or the popped bracket does not match pairs[ch], the glyph is invalid.',
      "for ch in s:\n    if ch in '([{':\n        stack.append(ch)\n    elif ch in ')]}':\n        if not stack or stack.pop() != pairs[ch]:\n            valid = False\n            break",
    ],
    xp: 55,
    tool: { name: 'Stack-based matching', icon: '🧱', description: 'A stack tracks "most recent still open" — exactly what nested brackets need.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, true) ?? { success: true, message: 'Every bracket closed in the right order. The ward glyph dims, and the door swings open.' },
  },

  {
    id: 'algo-03-binary-search',
    kind: 'python',
    npc: 'Ghost of Big O',
    title: 'The Ghost\'s Riddle of Halves',
    prompt: 'A ghost drifts by: "Twenty torches line this hall, numbered and sorted low to high. Checking each one takes a candle. A wiser seeker checks the middle, then throws away half the hall each time." arr is sorted ascending, target = 42 is one of the torches. Implement binary search (not `in` or `.index()`) and store the index of target in `result`.',
    starter: "arr = [2, 5, 8, 12, 16, 19, 23, 27, 31, 35, 38, 42, 46, 49, 53, 57, 61, 64, 68, 71]\ntarget = 42\n\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    pass  # narrow [low, high] toward target's index by comparing arr[mid] to target\n\nresult = binary_search(arr, target)\n",
    hints: [
      'Checking every torch one by one is O(n) — the ghost wants O(log n). Compare the middle element to the target instead.',
      'If arr[mid] is too small, the target must be to the right (low = mid + 1). Too big, and it must be to the left (high = mid - 1).',
      'while low <= high:\n    mid = (low + high) // 2\n    if arr[mid] == target:\n        return mid\n    elif arr[mid] < target:\n        low = mid + 1\n    else:\n        high = mid - 1\nreturn -1',
    ],
    xp: 55,
    tool: { name: 'Binary search', icon: '🕯️', description: 'O(log n): each comparison halves the remaining search space.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 11) ?? { success: true, message: 'Torch 42, found in a handful of comparisons instead of twenty. The ghost nods, satisfied.' },
  },

  {
    id: 'algo-04-bfs-shortest-path',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Shortest Way to the Treasure',
    prompt: 'The dungeon map is a graph of chambers and the corridors connecting them. Use breadth-first search — exploring level by level with a queue — to find the shortest path (fewest corridors) from \'entrance\' to \'treasure\'. Store that number of corridors (edges) in `result`.',
    starter: "dungeon = {\n    'entrance': ['hall', 'crypt'],\n    'hall': ['entrance', 'library', 'trap_room'],\n    'crypt': ['entrance', 'trap_room'],\n    'library': ['hall', 'vault'],\n    'trap_room': ['hall', 'crypt', 'vault'],\n    'vault': ['library', 'trap_room', 'treasure'],\n    'treasure': ['vault'],\n}\n\nfrom collections import deque\n\ndef bfs_shortest_path_length(graph, start, end):\n    visited = {start}\n    queue = deque([(start, 0)])\n    pass  # dequeue a (node, dist) pair; if node == end return dist; else enqueue unvisited neighbors at dist + 1\n\nresult = bfs_shortest_path_length(dungeon, 'entrance', 'treasure')\n",
    hints: [
      'BFS explores in rings, one corridor away, then two corridors away, and so on — the first time you reach `end`, that path is guaranteed shortest.',
      'A queue of (node, distance) pairs works well: pop from the front, and if it is not the target, push each unvisited neighbor with distance + 1.',
      "while queue:\n    node, dist = queue.popleft()\n    if node == end:\n        return dist\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            visited.add(neighbor)\n            queue.append((neighbor, dist + 1))\nreturn -1",
    ],
    xp: 60,
    tool: { name: 'Breadth-first search', icon: '🌊', description: 'Explores a graph ring by ring with a queue — guarantees the shortest path in an unweighted graph.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 4) ?? { success: true, message: 'Four corridors, and not one step wasted. BFS found the shortest way.' },
  },

  {
    id: 'algo-05-dfs-all-paths',
    kind: 'python',
    npc: 'Recursive Rita',
    title: 'Every Way Through the Maze',
    prompt: 'Recursive Rita grins: "BFS finds the shortest way. But what if I want to see *every* way?" The maze below is a DAG (no cycles to worry about) — use depth-first recursion to find every path from \'start\' to \'end\'. Store the list of paths (each a list of chamber names, in order) in `result`.',
    starter: "maze = {\n    'start': ['a', 'b'],\n    'a': ['c'],\n    'b': ['c', 'd'],\n    'c': ['end'],\n    'd': ['end'],\n    'end': [],\n}\n\ndef find_all_paths(graph, node, end, path=None):\n    if path is None:\n        path = []\n    path = path + [node]\n    if node == end:\n        return [path]\n    paths = []\n    pass  # recurse into each neighbor, extending `path`, and collect all the paths that come back\n    return paths\n\nresult = find_all_paths(maze, 'start', 'end')\n",
    hints: [
      'At each chamber, try every corridor onward and recurse — each recursive call explores one whole branch to its end.',
      'Each recursive call to find_all_paths(graph, neighbor, end, path) returns a list of completed paths through that neighbor — collect them all.',
      "for neighbor in graph[node]:\n    paths.extend(find_all_paths(graph, neighbor, end, path))",
    ],
    xp: 65,
    tool: { name: 'DFS path enumeration', icon: '🕸️', description: 'Recursion naturally explores every branch of a graph, one full path at a time.', fun: 5 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      const got = pyGet(pyodide, 'result')
      if (!Array.isArray(got)) {
        return { success: false, message: 'No `result` variable found — did you assign your answer to `result`?' }
      }
      const expected = [
        ['start', 'a', 'c', 'end'],
        ['start', 'b', 'c', 'end'],
        ['start', 'b', 'd', 'end'],
      ]
      const norm = (paths) => paths.map((p) => JSON.stringify(p)).sort()
      const gotNorm = norm(got)
      const expNorm = norm(expected)
      const same = gotNorm.length === expNorm.length && gotNorm.every((v, i) => v === expNorm[i])
      if (!same) {
        return { success: false, message: `result was ${JSON.stringify(got)} — that is not all three paths through the maze.` }
      }
      return { success: true, message: 'All three routes from start to end, every branch explored. Rita is impressed.' }
    },
  },

  {
    id: 'algo-06-merge-sort',
    kind: 'python',
    npc: 'Ghost of Big O',
    title: 'Sorting the Scattered Relics',
    prompt: 'arr = [38, 27, 43, 3, 9, 82, 10] — relics scattered on the dungeon floor. Do not use sorted() or .sort(); implement merge sort yourself: split the list in half, recursively sort each half, then merge the two sorted halves back together. Store the sorted list in `result`.',
    starter: "arr = [38, 27, 43, 3, 9, 82, 10]\n\ndef merge_sort(lst):\n    if len(lst) <= 1:\n        return lst\n    mid = len(lst) // 2\n    left = merge_sort(lst[:mid])\n    right = merge_sort(lst[mid:])\n    return merge(left, right)\n\ndef merge(left, right):\n    merged = []\n    i = j = 0\n    pass  # walk both sorted lists, always taking the smaller front element, until one runs out\n    merged.extend(left[i:])\n    merged.extend(right[j:])\n    return merged\n\nresult = merge_sort(arr)\n",
    hints: [
      'Merging two already-sorted lists means comparing their front elements and always taking the smaller one.',
      'Use a while loop that continues as long as both i < len(left) and j < len(right); append the smaller of left[i]/right[j] and advance that pointer.',
      "while i < len(left) and j < len(right):\n    if left[i] <= right[j]:\n        merged.append(left[i])\n        i += 1\n    else:\n        merged.append(right[j])\n        j += 1",
    ],
    xp: 60,
    tool: { name: 'Merge sort', icon: '⚔️', description: 'Divide, conquer, merge — O(n log n), the classic recursive sort.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [3, 9, 10, 27, 38, 43, 82]) ?? { success: true, message: 'Every relic in order, sorted by splitting and merging rather than brute force. The Ghost of Big O approves of the O(n log n).' },
  },

  {
    id: 'algo-07-sliding-window',
    kind: 'python',
    npc: 'Ghost of Big O',
    title: 'The Torch-Light Window',
    prompt: 'A sequence of torch brightness values lies along this corridor: arr, with 10 values. Find the maximum sum of any 3 consecutive torches — but do not recompute each 3-torch sum from scratch. Slide a window: subtract the value leaving and add the value entering. Store the maximum sum in `result`.',
    starter: "arr = [4, 2, 9, 7, 1, 3, 8, 5, 6, 2]\nk = 3\n\nwindow_sum = sum(arr[:k])\nmax_sum = window_sum\npass  # slide the window one step at a time: subtract arr[i - k], add arr[i], track the best sum seen\n\nresult = max_sum\n",
    hints: [
      'Recomputing sum(arr[i:i+k]) for every i is wasteful — you already know the previous window\'s sum.',
      'As the window slides forward by one, it loses arr[i - k] and gains arr[i]. Update window_sum with that difference each step.',
      "for i in range(k, len(arr)):\n    window_sum += arr[i] - arr[i - k]\n    max_sum = max(max_sum, window_sum)",
    ],
    xp: 55,
    tool: { name: 'Sliding window', icon: '🔦', description: 'Reuse the previous window\'s sum instead of recomputing from scratch — O(n) instead of O(n·k).', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 19) ?? { success: true, message: 'The three brightest torches in a row, found without ever recomputing a sum from scratch.' },
  },

  {
    id: 'algo-08-two-pointers',
    kind: 'python',
    npc: 'Ghost of Big O',
    title: 'The Flooded Vault',
    prompt: 'heights = [1, 8, 6, 2, 5, 4, 8, 3, 7] — the heights of vault walls. Choosing any two walls traps water between them (area = distance between them × the shorter wall\'s height). Use two pointers, one at each end, moving the shorter wall inward each step, to find the maximum area without checking every pair. Store it in `result`.',
    starter: "heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]\n\nleft, right = 0, len(heights) - 1\nmax_area = 0\npass  # compute the area for (left, right), track the best, then move whichever pointer is shorter inward\n\nresult = max_area\n",
    hints: [
      'Checking every pair of walls is O(n²) — the ghost wants better. Start with the widest possible pair and narrow in.',
      'Area = (right - left) * min(heights[left], heights[right]). Moving the taller wall inward can only ever shrink the area, so always move the shorter one.',
      "while left < right:\n    width = right - left\n    height = min(heights[left], heights[right])\n    max_area = max(max_area, width * height)\n    if heights[left] < heights[right]:\n        left += 1\n    else:\n        right -= 1",
    ],
    xp: 60,
    tool: { name: 'Two pointers', icon: '🌊', description: 'Two pointers closing in from both ends solves in O(n) what looks like an O(n²) problem.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 49) ?? { success: true, message: 'Forty-nine units of trapped water, found in a single sweep inward from both ends.' },
  },

  {
    id: 'algo-09-dp-fibonacci',
    kind: 'python',
    npc: 'Dynamic Dex',
    title: 'The Ancients\' Recurrence',
    prompt: 'Dynamic Dex holds up a dusty tablet: "The Ancients hid their vault combination in the 30th number of this sequence. Naive recursion would take longer than the torches will burn — cache what you\'ve already computed." Implement Fibonacci with memoization (a dict cache) and compute fib(30). Store it in `result`.',
    starter: "cache = {}\n\ndef fib(n):\n    if n in cache:\n        return cache[n]\n    if n <= 1:\n        return n\n    pass  # compute fib(n) from the two smaller subproblems, store it in cache, then return it\n\nresult = fib(30)\n",
    hints: [
      'Naive recursive Fibonacci recomputes the same subproblems millions of times — memoization means solving each one only once.',
      'fib(n) = fib(n - 1) + fib(n - 2). Store that value in cache[n] before returning it, so the next call skips straight to it.',
      'value = fib(n - 1) + fib(n - 2)\ncache[n] = value\nreturn value',
    ],
    xp: 60,
    tool: { name: 'Memoization', icon: '📜', description: 'Caching subproblem results turns exponential recursion into linear time.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 832040) ?? { success: true, message: '832040 — the vault combination, computed instantly instead of waiting on an exponential recursion tree.' },
  },

  {
    id: 'algo-10-dp-coin-change',
    kind: 'python',
    npc: 'Dynamic Dex',
    title: 'Paying the Toll Keeper',
    prompt: "A toll keeper demands exactly 63 gold, and you carry coins of value coins = [1, 5, 10, 25]. Grabbing the biggest coin first (greedy) happens to work for these coin values, but it fails on other coin systems entirely — so build a dynamic programming table instead: dp[i] = fewest coins to make amount i. Store the minimum number of coins needed for 63 in `result`.",
    starter: "coins = [1, 5, 10, 25]\namount = 63\n\ndp = [0] + [float('inf')] * amount\npass  # for each amount i from 1 to `amount`, try every coin c <= i and keep the fewest-coins option: dp[i] = min(dp[i], dp[i - c] + 1)\n\nresult = dp[amount]\n",
    hints: [
      'dp[0] is 0 coins for zero gold. Build up from there — dp[i] depends only on smaller amounts you have already solved.',
      'For each i from 1 to amount, and each coin c that is no bigger than i, dp[i] could be dp[i - c] + 1 (use coin c, then optimally make the rest). Take the smallest such option.',
      "for i in range(1, amount + 1):\n    for c in coins:\n        if c <= i:\n            dp[i] = min(dp[i], dp[i - c] + 1)",
    ],
    xp: 65,
    tool: { name: 'Dynamic programming table', icon: '🪙', description: 'Building the answer up from smaller subproblems, bottom-up, guarantees the true optimum — unlike greedy.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 6) ?? { success: true, message: 'Six coins, the true minimum — the toll keeper has no complaints.' },
  },

  {
    id: 'algo-11-cycle-detection',
    kind: 'python',
    npc: 'Recursive Rita',
    title: 'The Loop That Traps Wanderers',
    prompt: 'Rita traces the corridors on the map with a finger: "Some poor soul wandered these halls forever — a loop with no exit." graph is a directed graph. Use DFS with a "visiting" set (nodes currently on the recursion stack) and a "visited" set (nodes fully explored) to detect whether it contains a cycle. Store True or False in `result`.',
    starter: "graph = {\n    'a': ['b'],\n    'b': ['c'],\n    'c': ['a', 'd'],\n    'd': [],\n}\n\ndef has_cycle(graph):\n    visiting = set()\n    visited = set()\n\n    def dfs(node):\n        pass  # if node is in `visiting`, that's a cycle (True). If already `visited`, skip (False). Otherwise mark visiting, recurse into neighbors, then move node to visited.\n\n    for node in graph:\n        if node not in visited and dfs(node):\n            return True\n    return False\n\nresult = has_cycle(graph)\n",
    hints: [
      'A back-edge to a node currently "in progress" (on the current DFS path) is exactly what a cycle looks like — a plain "have I seen this before" visited set is not enough, because it can\'t tell a cycle from just revisiting a node through a different, safe path.',
      'Mark a node "visiting" when you enter it, check its neighbors — if any neighbor is already "visiting", that is a cycle. Once all neighbors are safely explored, move the node from "visiting" to "visited".',
      "def dfs(node):\n    if node in visiting:\n        return True\n    if node in visited:\n        return False\n    visiting.add(node)\n    for neighbor in graph[node]:\n        if dfs(neighbor):\n            return True\n    visiting.discard(node)\n    visited.add(node)\n    return False",
    ],
    xp: 60,
    tool: { name: 'Cycle detection (DFS)', icon: '🔄', description: 'Tracking "currently on this path" vs. "fully explored" tells a cycle apart from a harmless revisit.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, true) ?? { success: true, message: 'A cycle indeed — a to b to c and back to a. The wanderer is finally found.' },
  },

  {
    id: 'algo-12-dijkstra',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Weighted Corridors',
    prompt: "Not all corridors here are equal — some are longer than others. graph is a weighted graph (dict of dicts: graph['a']['b'] is the corridor length from a to b). Use Dijkstra's algorithm with Python's heapq as a priority queue to find the shortest distance from 'a' to 'd'. Store that distance in `result`.",
    starter: "import heapq\n\ngraph = {\n    'a': {'b': 4, 'c': 1},\n    'b': {'d': 1},\n    'c': {'b': 2, 'd': 5},\n    'd': {},\n}\n\ndef dijkstra(graph, start, target):\n    distances = {node: float('inf') for node in graph}\n    distances[start] = 0\n    pq = [(0, start)]\n    visited = set()\n    pass  # pop the smallest-distance node from pq; for each neighbor, relax the edge and push improved distances\n    return distances[target]\n\nresult = dijkstra(graph, 'a', 'd')\n",
    hints: [
      'heapq always gives you the smallest item next — perfect for "always expand the closest unvisited chamber."',
      'Pop (dist, node) from the heap. If already visited, skip it. Otherwise, for each neighbor, check if dist + edge weight beats its current known distance — if so, update it and push the new (distance, neighbor) pair.',
      "while pq:\n    dist, node = heapq.heappop(pq)\n    if node in visited:\n        continue\n    visited.add(node)\n    for neighbor, weight in graph[node].items():\n        new_dist = dist + weight\n        if new_dist < distances[neighbor]:\n            distances[neighbor] = new_dist\n            heapq.heappush(pq, (new_dist, neighbor))",
    ],
    xp: 65,
    tool: { name: "Dijkstra's algorithm", icon: '🏆', description: 'A priority queue always expands the closest unvisited node first — guarantees shortest paths on weighted graphs.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 4) ?? { success: true, message: 'Distance 4: a to c to b to d. The shortest weighted path through the corridors.' },
  },

  {
    id: 'algo-13-trie',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Whispering Bookshelf',
    prompt: "A bookshelf of dungeon words hums when you type a prefix. Build a Trie (prefix tree): insert 'dragon', 'dungeon', 'door', and 'dust', then check whether any word starts with the prefix 'du'. Store True or False in `result`.",
    starter: "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_word = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        pass  # walk/create a child node per character, then mark the final node as a complete word\n\n    def starts_with(self, prefix):\n        pass  # walk a child node per character in prefix; if a character is missing, return False\n\ntrie = Trie()\nfor word in ['dragon', 'dungeon', 'door', 'dust']:\n    trie.insert(word)\n\nresult = trie.starts_with('du')\n",
    hints: [
      'A Trie shares common prefixes between words as a tree of characters — each node\'s children are a dict keyed by the next letter.',
      'insert: walk the word letter by letter, creating a new TrieNode whenever a letter is not already a child, then mark the last node as a word. starts_with: walk the prefix the same way — if you ever hit a missing letter, return False; otherwise return True.',
      "def insert(self, word):\n    node = self.root\n    for ch in word:\n        if ch not in node.children:\n            node.children[ch] = TrieNode()\n        node = node.children[ch]\n    node.is_word = True\n\ndef starts_with(self, prefix):\n    node = self.root\n    for ch in prefix:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return True",
    ],
    xp: 65,
    tool: { name: 'Trie (prefix tree)', icon: '📚', description: 'Shares common prefixes across words in a tree — prefix lookups cost only the length of the prefix.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, true) ?? { success: true, message: '"dungeon" and "dust" both answer to "du" — the bookshelf hums and a shelf slides open.' },
  },

  {
    id: 'algo-14-backtracking-nqueens',
    kind: 'python',
    npc: 'Recursive Rita',
    title: 'Four Queens, No Attacks',
    prompt: 'Rita sets four stone queens on a 4x4 chamber floor: "Place them so none attacks another — same row, column, or diagonal is forbidden. How many distinct arrangements exist?" Use backtracking: place a queen, recurse, and undo (backtrack) if a branch fails. Store the count of valid arrangements in `result`.',
    starter: "def solve_n_queens(n):\n    solutions = 0\n    cols = set()\n    diag1 = set()  # row - col (one diagonal direction)\n    diag2 = set()  # row + col (the other diagonal direction)\n\n    def backtrack(row):\n        nonlocal solutions\n        if row == n:\n            solutions += 1\n            return\n        for col in range(n):\n            pass  # if (row, col) doesn't conflict with cols/diag1/diag2, place the queen, recurse, then remove it\n\n    backtrack(0)\n    return solutions\n\nresult = solve_n_queens(4)\n",
    hints: [
      'Two queens conflict if they share a column (col in cols), or a diagonal — row - col is constant along one diagonal, row + col is constant along the other.',
      'For each column, skip it if it conflicts with any already-placed queen. Otherwise, place the queen (add to all three sets), recurse into row + 1, then remove it from all three sets before trying the next column — that "undo" step is the backtracking.',
      "for col in range(n):\n    if col in cols or (row - col) in diag1 or (row + col) in diag2:\n        continue\n    cols.add(col); diag1.add(row - col); diag2.add(row + col)\n    backtrack(row + 1)\n    cols.remove(col); diag1.remove(row - col); diag2.remove(row + col)",
    ],
    xp: 70,
    tool: { name: 'Backtracking', icon: '♛', description: 'Try a choice, recurse, and undo it if it leads nowhere — explores exactly the valid branches.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 2) ?? { success: true, message: 'Two distinct arrangements of four queens, none attacking. Rita counts along with you.' },
  },

  {
    id: 'algo-15-union-find',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'Which Chambers Connect',
    prompt: 'edges = [(0, 1), (1, 2), (3, 4)] over 5 numbered chambers (0-4) — each pair is a corridor. Implement Union-Find (disjoint set) with find and union to group chambers into connected components, then determine whether chamber 0 and chamber 2 are in the same component. Store True or False in `result`.',
    starter: "edges = [(0, 1), (1, 2), (3, 4)]\nparent = list(range(5))\n\ndef find(x):\n    pass  # follow parent pointers until x is its own parent (the root of its component); return that root\n\ndef union(x, y):\n    root_x, root_y = find(x), find(y)\n    if root_x != root_y:\n        parent[root_x] = root_y\n\nfor a, b in edges:\n    union(a, b)\n\nresult = find(0) == find(2)\n",
    hints: [
      'Each chamber starts as its own component (parent[x] == x). union merges two components by pointing one root at the other.',
      'find(x) should climb parent pointers — x, then parent[x], then parent[parent[x]] — until it reaches a chamber that is its own parent (the root).',
      'def find(x):\n    while parent[x] != x:\n        x = parent[x]\n    return x',
    ],
    xp: 60,
    tool: { name: 'Union-Find (disjoint set)', icon: '🔗', description: 'Tracks connected components with near-constant-time union and find operations.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, true) ?? { success: true, message: 'Chamber 0 and chamber 2 share a component: 0-1-2 are all connected through the corridors.' },
  },

  {
    id: 'algo-16-final-boss',
    kind: 'python',
    npc: 'Dungeon Master Algo',
    title: 'The Ancients\' Final Trial',
    prompt: 'The Algorithm Ancients left one last script guarding the deepest vault, combining everything the dungeon taught you — but it was struck by the same corruption that broke everything else here. Find and fix all three bugs: a syntax error in the graph traversal, a broken recurrence in the memoized function, and an off-by-one in the binary search that makes it crash. Get `result` to come out correct.',
    starter: `dungeon_map = {
    'chamber_a': ['chamber_b'],
    'chamber_b': ['chamber_c'],
    'chamber_c': [],
    'chamber_d': ['chamber_e'],
    'chamber_e': [],
}

def path_exists(graph, start, end):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node == end:
            return True
        if node not in visited
            visited.add(node)
            stack.extend(graph[node])
    return False

fib_cache = {}

def fib(n):
    if n <= 1:
        return n
    if n in fib_cache:
        return fib_cache[n]
    value = fib(n - 1) + fib(n - 3)
    fib_cache[n] = value
    return value

power_levels = [10, 25, 40, 55, 70, 85, 100, 120]
threshold = 130

def binary_search_threshold(levels, target):
    low, high = 0, len(levels)
    while low <= high:
        mid = (low + high) // 2
        if levels[mid] == target:
            return True
        elif levels[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return False

result = {
    'path_exists': path_exists(dungeon_map, 'chamber_a', 'chamber_c'),
    'fib_10': fib(10),
    'threshold_met': binary_search_threshold(power_levels, threshold),
}
`,
    hints: [
      'Three separate bugs, one in each function: a missing colon in path_exists, a wrong recurrence in fib (it should combine the two previous values, not skip one), and a search boundary in binary_search_threshold that can walk right off the end of the list and crash.',
      '`if node not in visited` needs a colon. fib should be fib(n - 1) + fib(n - 2), not fib(n - 3). binary_search_threshold should start high at len(levels) - 1, not len(levels) — otherwise mid can equal a valid index one past the end.',
      "if node not in visited:\n    ...\n...\nvalue = fib(n - 1) + fib(n - 2)\n...\nlow, high = 0, len(levels) - 1",
    ],
    xp: 220,
    tool: { name: 'Algorithm Dungeon Master', icon: '🗝️', description: 'Found and fixed a SyntaxError, a broken DP recurrence, and an off-by-one crash — the final trial of Algorithm Dungeon, cleared.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, {
      path_exists: true,
      fib_10: 55,
      threshold_met: false,
    }) ?? { success: true, message: 'The vault opens. Graph traversal, memoized recursion, and binary search — all three techniques, working as one. The Ancients would be proud.' },
  },
]

export const ALGORITHM_DUNGEON_ZONE = {
  id: 'algorithm-dungeon',
  name: 'Algorithm Dungeon',
  palette: { bg: '#1a1a1a', ground: 0x2b2b2b, groundAccent: 0x1f1f1f },
  decor: { kind: 'torch' },
  npcIntro: {
    name: 'Dungeon Master Algo',
    lines: [
      "Welcome to Algorithm Dungeon, Ziro. Every locked door here was built by the Algorithm Ancients, long before Python Jungle or Data Realm existed.",
      "Two adventurers can search the same treasure room — one checking every single stone, one at a time, the other using a technique that skips straight to the answer. Both find the gold eventually. Only one survives long enough to enjoy it.",
      "That difference — the shortcut versus the slog — is what these vaults will teach you. Each door tests a different technique: a hash map, a stack, a graph search, a dynamic program. Solve one, and the next door's mechanism unlocks.",
      "The ghosts and spirits still wandering these halls will help, each in their own way. Listen to them.",
      "The deepest vault holds the Ancients' final trial. Reach it, and you'll have mastered every technique this dungeon can teach.",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Dungeon Master Algo', color: 0x9ca3af, role: 'main' },
    { x: 2020, y: 560, name: 'Ghost of Big O', color: 0x60a5fa, flavor: 'Every technique has a cost. Mine is measured in comparisons, not gold.' },
    { x: 260, y: 860, name: 'Recursive Rita', color: 0xf472b6, flavor: 'A function that calls itself, and knows when to stop — that\'s the whole trick.' },
    { x: 2020, y: 1160, name: 'Dynamic Dex', color: 0xfbbf24, flavor: 'Why solve the same subproblem twice? Remember it, and move on.' },
  ],
  challenges: ALGORITHM_DUNGEON_CHALLENGES,
  nextZone: 'ai-frontier',
}
