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

export const PYTHON_JUNGLE_CHALLENGES = [
  {
    id: 'py-00-first-print',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'Your First Line',
    prompt: 'Let\'s get comfortable here first. Type exactly what\'s below, then press Run — it tells Python to show that text on screen: print("Hello, Ziro!")',
    starter: '',
    hints: [
      'You don\'t need to understand this yet — just type it exactly and press Run.',
      'print(...) shows whatever is inside the parentheses on screen.',
      'print("Hello, Ziro!")',
    ],
    xp: 15,
    tool: {
      name: 'print()', icon: '🖨️', description: 'Shows text or values on screen so you can see what your code is doing.', fun: 1,
    },
    check({ stdout, error }) {
      if (error) return { success: false, message: `Python hit an error: ${error}` }
      if (!stdout.includes('Hello, Ziro!')) {
        return { success: false, message: 'Type exactly: print("Hello, Ziro!") then press Run.' }
      }
      return { success: true, message: 'That\'s it — print() shows whatever you give it. You just ran your first line of Python.' }
    },
  },

  {
    id: 'py-00-first-variable',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'A Labeled Box',
    prompt: 'A variable is just a labeled box that holds a value. Type exactly what\'s below (two lines), then press Run: message = "Ziro is learning Python"\nprint(message)',
    starter: '',
    hints: [
      'The first line creates a box named `message` and puts text inside it.',
      'The second line prints whatever is inside that box.',
      'message = "Ziro is learning Python"\nprint(message)',
    ],
    xp: 15,
    tool: {
      name: 'Variables', icon: '📦', description: 'A labeled box that holds a value you can reuse or print later.', fun: 1,
    },
    check({ stdout, error }) {
      if (error) return { success: false, message: `Python hit an error: ${error}` }
      if (!stdout.includes('Ziro is learning Python')) {
        return { success: false, message: 'Set message = "Ziro is learning Python", then print(message).' }
      }
      return { success: true, message: 'You just stored a value in a variable and printed it back out. That\'s the whole idea of a variable.' }
    },
  },

  {
    id: 'py-01-variables',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'A Number in Disguise',
    prompt: 'This script crashes — `age` is text, not a number, so Python won\'t add 5 to it. Fix it so `result` ends up as 15.',
    starter: 'age = "10"\nresult = age + 5\n',
    hints: [
      '`age` is a string ("10"), not an integer — Python can\'t add a string and a number directly.',
      'Convert it first with int(age).',
      'age = int("10")\nresult = age + 5',
    ],
    xp: 45,
    tool: { name: 'Python types', icon: '🔤', description: 'int(), str(), float() convert between types explicitly.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 15) ?? { success: true, message: 'Fifteen years in the jungle. The count is right.' },
  },

  {
    id: 'py-02-strings',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'A Messy Name Tag',
    prompt: 'The tiger\'s name tag is a mess: "  tiger  ". Clean it up — strip the whitespace and make it uppercase — and store it in `result`.',
    starter: 'name = "  tiger  "\nresult = name\n',
    hints: [
      'Strings have methods you can chain together, like name.strip().',
      '.strip() removes leading/trailing whitespace; .upper() makes it uppercase.',
      'result = name.strip().upper()',
    ],
    xp: 40,
    tool: { name: 'String methods', icon: '🔡', description: '.strip(), .upper(), .lower(), .replace() — clean and transform text.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'TIGER') ?? { success: true, message: 'TIGER. Much better than "  tiger  ".' },
  },

  {
    id: 'py-03-lists',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'The Fruit Basket',
    prompt: 'The fruit list has duplicates and is out of order: fruits = [\'mango\', \'fig\', \'mango\', \'banana\', \'fig\', \'apple\']. Store a sorted list with no duplicates in `result`.',
    starter: "fruits = ['mango', 'fig', 'mango', 'banana', 'fig', 'apple']\nresult = fruits\n",
    hints: [
      'A `set` automatically drops duplicates.',
      'sorted() turns any collection into a sorted list.',
      'result = sorted(set(fruits))',
    ],
    xp: 45,
    tool: { name: 'Lists & sets', icon: '🍎', description: 'set() dedupes, sorted() orders — a common combo.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['apple', 'banana', 'fig', 'mango']) ?? { success: true, message: 'One of each fruit, alphabetically. The basket is tidy now.' },
  },

  {
    id: 'py-04-dicts',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'Who Eats What',
    prompt: 'food = {\'tiger\': \'meat\', \'parrot\': \'seeds\'} — but the monkey is missing! Add \'monkey\': \'fruit\' to the dict, then store a sorted list of all the animal names (the keys) in `result`.',
    starter: "food = {'tiger': 'meat', 'parrot': 'seeds'}\n# add monkey here\nresult = sorted(food.keys())\n",
    hints: [
      'Add a new key the same way you\'d update any dict: food[\'monkey\'] = \'fruit\'.',
      '.keys() gives you all the dict\'s keys; sorted() puts them in order.',
      "food['monkey'] = 'fruit'\nresult = sorted(food.keys())",
    ],
    xp: 45,
    tool: { name: 'Dictionaries', icon: '📖', description: 'Key-value pairs — add, look up, and list keys/values.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['monkey', 'parrot', 'tiger']) ?? { success: true, message: 'Everyone\'s dinner is accounted for.' },
  },

  {
    id: 'py-05-loops',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'Counting by Zone',
    prompt: "animals = [('tiger','north'), ('parrot','south'), ('monkey','north'), ('snake','south'), ('tiger','north')]. Use a loop to count how many animals are in each zone. Store the counts as a dict in `result`, e.g. {'north': 3, 'south': 2}.",
    starter: "animals = [('tiger','north'), ('parrot','south'), ('monkey','north'), ('snake','south'), ('tiger','north')]\nresult = {}\nfor name, zone in animals:\n    pass  # count here\n",
    hints: [
      'For each (name, zone) pair, increase result[zone] by one.',
      'A dict doesn\'t have a key until you set it — use result.get(zone, 0) to default to 0 first.',
      'for name, zone in animals:\n    result[zone] = result.get(zone, 0) + 1',
    ],
    xp: 55,
    tool: { name: 'for loops', icon: '🔁', description: 'Iterate over lists, tuples, and unpack values as you go.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { north: 3, south: 2 }) ?? { success: true, message: 'North has more animals than south — now you can prove it.' },
  },

  {
    id: 'py-06-functions',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'One Function, Many Plants',
    prompt: "The watering code was copy-pasted three times. Write a function water(plant_name) that returns f\"{plant_name} watered\", then call it for ['fern', 'vine', 'moss'] and store the three results as a list in `result`.",
    starter: "def water(plant_name):\n    pass\n\nplants = ['fern', 'vine', 'moss']\nresult = []\n",
    hints: [
      'A function is defined once with `def`, then called as many times as you need.',
      'Use an f-string: f"{plant_name} watered".',
      "def water(plant_name):\n    return f\"{plant_name} watered\"\n\nresult = [water(p) for p in plants]",
    ],
    xp: 55,
    tool: { name: 'Functions', icon: '🧩', description: 'def name(params): ... return value — reusable logic instead of copy-paste.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['fern watered', 'vine watered', 'moss watered']) ?? { success: true, message: 'Three plants, one function. No more copy-paste.' },
  },

  {
    id: 'py-07-args-kwargs',
    kind: 'python',
    npc: 'Sage Boa',
    title: 'Logging Anything',
    prompt: "Write a function log_event(*args, **kwargs) that returns {'args': list(args), 'kwargs': kwargs}. Call it as log_event(1, 2, animal='tiger') and store the return value in `result`.",
    starter: 'def log_event(*args, **kwargs):\n    pass\n\nresult = None\n',
    hints: [
      '*args collects any extra positional arguments into a tuple; **kwargs collects keyword arguments into a dict.',
      'Convert args to a list explicitly with list(args) since it starts as a tuple.',
      "def log_event(*args, **kwargs):\n    return {'args': list(args), 'kwargs': kwargs}\n\nresult = log_event(1, 2, animal='tiger')",
    ],
    xp: 65,
    tool: { name: '*args / **kwargs', icon: '🎒', description: 'Accept any number of positional or keyword arguments.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { args: [1, 2], kwargs: { animal: 'tiger' } }) ?? { success: true, message: 'Now the logger can handle absolutely anything thrown at it.' },
  },

  {
    id: 'py-08-comprehension',
    kind: 'python',
    npc: 'Python Priestess',
    title: 'One Line, Not Five',
    prompt: "weights = [('tiger',200), ('parrot',2), ('monkey',15), ('snake',30)]. Replace a five-line loop with one list comprehension: get the names of animals weighing more than 10, in `result`.",
    starter: "weights = [('tiger', 200), ('parrot', 2), ('monkey', 15), ('snake', 30)]\nresult = []  # rewrite as one comprehension\n",
    hints: [
      'A list comprehension is [expression for item in iterable if condition].',
      'You want the name where weight > 10.',
      "result = [name for name, weight in weights if weight > 10]",
    ],
    xp: 60,
    tool: { name: 'List comprehensions', icon: '⚡', description: 'Filter + transform a list in a single readable line.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['tiger', 'monkey', 'snake']) ?? { success: true, message: 'One line did the work of five. The parrot is too light to count.' },
  },

  {
    id: 'py-09-errors',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'The Missing Meal',
    prompt: "food_stock = {'tiger': 'meat'}. Looking up food_stock['parrot'] crashes the whole script. Wrap it in try/except so a missing animal gives 'no food found' instead — store that in `result`.",
    starter: "food_stock = {'tiger': 'meat'}\nresult = food_stock['parrot']\n",
    hints: [
      'A missing dict key raises a KeyError — catch it with try/except KeyError.',
      'Put the risky lookup inside try:, and the fallback value inside except KeyError:.',
      "try:\n    result = food_stock['parrot']\nexcept KeyError:\n    result = 'no food found'",
    ],
    xp: 60,
    tool: { name: 'try / except', icon: '🛡️', description: 'Catch a specific exception instead of letting it crash the program.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'no food found') ?? { success: true, message: 'The script survives a missing animal now instead of crashing.' },
  },

  {
    id: 'py-10-file-io',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'Writing It Down',
    prompt: "Write the text \"100 animals counted\" to a file called census.txt, then read it back and store what you read in `result`.",
    starter: "with open('census.txt', 'w') as f:\n    pass  # write here\n\nresult = None  # read it back here\n",
    hints: [
      'open(path, "w") lets you write; open(path, "r") (or no mode, "r" is default) lets you read.',
      'f.write(text) writes; f.read() reads the whole file back as a string.',
      "with open('census.txt', 'w') as f:\n    f.write('100 animals counted')\n\nwith open('census.txt') as f:\n    result = f.read()",
    ],
    xp: 60,
    tool: { name: 'File I/O', icon: '📄', description: 'open(), .write(), .read() — persist data to a file.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, '100 animals counted') ?? { success: true, message: 'The census is on record — written and read back correctly.' },
  },

  {
    id: 'py-11-classes',
    kind: 'python',
    npc: 'Python Priestess',
    title: 'Every Animal, Modeled',
    prompt: 'Write an Animal class with a name, a sound, and a speak() method returning f"{name} says {sound}". Then make a Snake subclass whose sound is always \'hiss\'. Create Snake("Kaa") and store its speak() result in `result`.',
    starter: "class Animal:\n    def __init__(self, name, sound):\n        self.name = name\n        self.sound = sound\n\n    def speak(self):\n        return f\"{self.name} says {self.sound}\"\n\nclass Snake(Animal):\n    def __init__(self, name):\n        pass  # call the parent constructor with sound='hiss'\n\nresult = Snake('Kaa').speak()\n",
    hints: [
      'A subclass can call its parent\'s __init__ with super().__init__(...).',
      'Snake always has sound=\'hiss\', so hardcode that when calling the parent constructor.',
      "class Snake(Animal):\n    def __init__(self, name):\n        super().__init__(name, 'hiss')",
    ],
    xp: 75,
    tool: { name: 'Classes & inheritance', icon: '🏛️', description: 'class, __init__, self, and super() — model real things as objects.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'Kaa says hiss') ?? { success: true, message: 'Kaa hisses exactly the way a Snake should — inheritance works.' },
  },

  {
    id: 'py-12-decorators',
    kind: 'python',
    npc: 'Python Priestess',
    title: 'Shouting Through the Canopy',
    prompt: 'Write a decorator called `shout` that uppercases whatever string a function returns. Apply it to greet(), which returns "hello jungle". Call greet() and store the result in `result`.',
    starter: "def shout(func):\n    pass  # return a wrapper function\n\n@shout\ndef greet():\n    return 'hello jungle'\n\nresult = greet()\n",
    hints: [
      'A decorator is a function that takes a function and returns a new function wrapping it.',
      'The wrapper should call the original function, then .upper() its return value.',
      "def shout(func):\n    def wrapper():\n        return func().upper()\n    return wrapper",
    ],
    xp: 85,
    tool: { name: 'Decorators', icon: '🎀', description: '@decorator wraps a function to add behavior without changing its code.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'HELLO JUNGLE') ?? { success: true, message: 'Loud enough to reach the whole canopy.' },
  },

  {
    id: 'py-13-generators',
    kind: 'python',
    npc: 'Python Priestess',
    title: 'A Million Plants, One at a Time',
    prompt: 'The jungle has too many plants to hold in memory at once. Write a generator function count_up(n) that yields 1, 2, ... n one at a time, then sum its first 5 values into `result`.',
    starter: 'def count_up(n):\n    pass  # yield values here\n\nresult = 0\n',
    hints: [
      'A generator uses `yield` instead of `return` — it produces one value at a time instead of building a whole list.',
      'A simple loop with `yield i` inside count_up(n) works.',
      "def count_up(n):\n    i = 1\n    while i <= n:\n        yield i\n        i += 1\n\nresult = sum(count_up(5))",
    ],
    xp: 80,
    tool: { name: 'Generators', icon: '💧', description: 'yield produces values lazily, one at a time, without using much memory.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 15) ?? { success: true, message: '1 through 5, never all in memory at once. That\'s the whole point of a generator.' },
  },

  {
    id: 'py-14-lambda',
    kind: 'python',
    npc: 'Python Priestess',
    title: 'Sorting by Weight',
    prompt: "animals = [('tiger', 200), ('parrot', 2), ('monkey', 15)]. Sort them heaviest-first using a lambda as the sort key, and store just the names (in order) in `result`.",
    starter: "animals = [('tiger', 200), ('parrot', 2), ('monkey', 15)]\nresult = []  # sort and extract names here\n",
    hints: [
      'sorted(iterable, key=..., reverse=...) lets you sort by any computed value.',
      'A lambda x: x[1] extracts the weight from each tuple to sort by.',
      "ordered = sorted(animals, key=lambda a: a[1], reverse=True)\nresult = [name for name, weight in ordered]",
    ],
    xp: 65,
    tool: { name: 'Lambda functions', icon: '🪄', description: 'A tiny inline function, often used as a sort key.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['tiger', 'monkey', 'parrot']) ?? { success: true, message: 'Heaviest to lightest. The tiger wins, as always.' },
  },

  {
    id: 'py-15-regex',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'Cleaning the Census',
    prompt: 'names = ["Tiger123", "  Parrot!!", "monKEY_9"]. The census data is a mess. Use the `re` module to strip out anything that isn\'t a letter, then lowercase each name. Store the cleaned list in `result`.',
    starter: 'import re\n\nnames = ["Tiger123", "  Parrot!!", "monKEY_9"]\nresult = []\n',
    hints: [
      're.sub(pattern, replacement, text) replaces every match of pattern with replacement.',
      'The pattern [^A-Za-z] matches anything that is NOT a letter.',
      'result = [re.sub(r"[^A-Za-z]", "", n).lower() for n in names]',
    ],
    xp: 80,
    tool: { name: 'Regular expressions', icon: '🔍', description: 're.sub/re.match/re.findall — pattern-match and clean up text.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['tiger', 'parrot', 'monkey']) ?? { success: true, message: 'Clean, lowercase, letters only. The census is finally readable.' },
  },

  {
    id: 'py-16-json',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'Data From the Sensor Network',
    prompt: 'raw = \'{"animal": "tiger", "count": 4}\' arrives from a sensor as JSON text. Parse it, increase the count by 1, and store the whole updated dict in `result`.',
    starter: 'import json\n\nraw = \'{"animal": "tiger", "count": 4}\'\nresult = {}\n',
    hints: [
      'json.loads(text) turns a JSON string into a Python dict.',
      'Once it\'s a dict, treat it like any other dict — data["count"] += 1.',
      "data = json.loads(raw)\ndata['count'] += 1\nresult = data",
    ],
    xp: 70,
    tool: { name: 'JSON', icon: '📦', description: 'json.loads() parses text into Python objects; json.dumps() does the reverse.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { animal: 'tiger', count: 5 }) ?? { success: true, message: 'The sensor count is updated and still valid JSON underneath.' },
  },

  {
    id: 'py-17-datetime',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'Who\'s Been Here Longest',
    prompt: "arrivals = {'tiger': '2020-01-01', 'monkey': '2022-06-15'}. Figure out which animal arrived earliest (has been in the jungle longest), and store its name in `result`.",
    starter: "from datetime import datetime\n\narrivals = {'tiger': '2020-01-01', 'monkey': '2022-06-15'}\nresult = None\n",
    hints: [
      'datetime.strptime(text, "%Y-%m-%d") parses a date string into a real date you can compare.',
      'min(iterable, key=...) finds the smallest value by whatever key function you give it.',
      "result = min(arrivals, key=lambda name: datetime.strptime(arrivals[name], '%Y-%m-%d'))",
    ],
    xp: 75,
    tool: { name: 'datetime', icon: '📅', description: 'Parse date strings and compare them as real dates, not text.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, 'tiger') ?? { success: true, message: 'The tiger has called this jungle home the longest.' },
  },

  {
    id: 'py-18-async',
    kind: 'python',
    npc: 'Async Anaconda',
    title: 'Three Sensors at Once',
    prompt: 'Three jungle sensors each take a moment to respond. Write async def sensor(id) that sleeps briefly and returns f"sensor-{id}", then use asyncio.gather to read sensors 1, 2, and 3 concurrently. Store the list of readings in `result`.',
    starter: "import asyncio\n\nasync def sensor(sensor_id):\n    pass  # sleep, then return a reading\n\nresult = []  # gather all three sensors here\n",
    hints: [
      'await asyncio.sleep(0.01) pauses this one coroutine without blocking the others.',
      'asyncio.gather(a, b, c) runs multiple coroutines concurrently and collects their results in order.',
      "async def sensor(sensor_id):\n    await asyncio.sleep(0.01)\n    return f'sensor-{sensor_id}'\n\nresult = await asyncio.gather(sensor(1), sensor(2), sensor(3))",
    ],
    xp: 90,
    tool: { name: 'async / await', icon: '⏱️', description: 'asyncio.gather runs coroutines concurrently instead of one at a time.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, ['sensor-1', 'sensor-2', 'sensor-3']) ?? { success: true, message: 'All three sensors answered at once instead of waiting in line.' },
  },

  {
    id: 'py-19-collections',
    kind: 'python',
    npc: 'Async Anaconda',
    title: 'Counting the Census, Properly',
    prompt: "animals = ['tiger','monkey','tiger','parrot','tiger','monkey']. Use collections.Counter to count each animal, and store the result as a plain dict in `result`.",
    starter: "from collections import Counter\n\nanimals = ['tiger','monkey','tiger','parrot','tiger','monkey']\nresult = {}\n",
    hints: [
      'Counter(iterable) counts occurrences of every item in one call.',
      'Counter is dict-like already — wrap it in dict(...) to get a plain dict.',
      'result = dict(Counter(animals))',
    ],
    xp: 55,
    tool: { name: 'collections.Counter', icon: '🧮', description: 'Purpose-built for counting — faster and clearer than a manual loop.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { tiger: 3, monkey: 2, parrot: 1 }) ?? { success: true, message: 'Three tigers, two monkeys, one parrot. Counted in a single line.' },
  },

  {
    id: 'py-20-final-boss',
    kind: 'python',
    npc: 'Debug Monkey',
    title: 'The Whole Jungle, Broken',
    prompt: 'Debug Monkey struck the entire jungle management script. Find and fix all three bugs — a syntax error, a KeyError from an uninitialized count, and a division by zero — so `result` ends up correct.',
    starter: `def water_plants(plants):
    total = 0
    for p in plants
        total = total + 1
    return total

animals = ['tiger', 'monkey', 'tiger', 'parrot']
counts = {}
for a in animals:
    counts[a] = counts[a] + 1

def safe_divide(a, b):
    return a / b

report = safe_divide(10, 0)

plants = ['fern', 'vine', 'moss']
result = {
    'plants_watered': water_plants(plants),
    'animal_counts': counts,
    'safe_report': report,
}
`,
    hints: [
      'Three separate bugs: a missing colon, a dict count that was never initialized, and a division that can\'t work with zero.',
      '`for p in plants` needs a colon. `counts[a] = counts[a] + 1` needs counts.get(a, 0) first. safe_divide needs a non-zero second argument, or a try/except.',
      "for p in plants:\n    total = total + 1\n...\ncounts[a] = counts.get(a, 0) + 1\n...\nreport = safe_divide(10, 2)",
    ],
    xp: 220,
    tool: { name: 'Python Wrangler', icon: '🐍', description: 'Found and fixed a SyntaxError, a KeyError, and a ZeroDivisionError in one script.', fun: 5 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, {
      plants_watered: 3,
      animal_counts: { tiger: 2, monkey: 1, parrot: 1 },
      safe_report: 5,
    }) ?? { success: true, message: 'The jungle\'s automation runs clean again. Every bug, found and fixed.' },
  },
]

export const PYTHON_JUNGLE_ZONE = {
  id: 'python-jungle',
  name: 'Python Jungle',
  palette: { bg: '#0f2418', ground: 0x3f6b3a, groundAccent: 0x2f4f2a },
  decor: { kind: 'jungle' },
  npcIntro: {
    name: 'Sage Boa',
    lines: [
      "Sssss... welcome to Python Jungle, Ziro.",
      "Every vine, every watering system, every gate here runs on Python scripts.",
      "A script is just a list of instructions the jungle's systems follow, exactly as written, one line at a time. That's also why one broken line breaks everything downstream of it.",
      "A corrupted update broke nearly all of them at once. Scripts crash. Animals go hungry. Plants go dry.",
      "You have the gift of order — will you fix our scripts, one bug at a time?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Sage Boa', color: 0x22c55e, role: 'main' },
    { x: 2020, y: 560, name: 'Python Priestess', color: 0xa78bfa, flavor: 'Classes, decorators, generators — the deeper magic of this language. Ready when you are.' },
    { x: 260, y: 860, name: 'Debug Monkey', color: 0xf59e0b, flavor: 'I break things so you learn to fix them. Don\'t take it personally.' },
    { x: 2020, y: 1160, name: 'Async Anaconda', color: 0x0ea5e9, flavor: 'Why wait for one thing at a time when you can wait for all of them at once?' },
  ],
  challenges: PYTHON_JUNGLE_CHALLENGES,
  nextZone: 'data-realm',
}
