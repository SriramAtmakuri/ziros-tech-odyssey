import {
  firstRows, queryRows, scalar, sameRows, containsKeyword, ziroId, tableExists,
} from '../../utils/sqlCheck.js'

// Every challenge: { id, npc, title, prompt, starter, hints[3], xp, tool, check(ctx) }
// ctx = { db, result, sql }  — result is the raw sql.js exec() return value,
// sql is the player's trimmed query text, db is the live sql.js Database.

export const SQL_ISLAND_CHALLENGES = [
  {
    id: 'sql-00-first-query',
    npc: 'Elder Mana',
    title: 'Your First Query',
    prompt: 'Before anything else — let\'s just get comfortable with this box. Type exactly what\'s below, then press Run. Don\'t worry about what it means yet: SELECT 1;',
    starter: '-- Type SELECT 1; below, then press Run\n',
    hints: [
      'You don\'t need to understand this yet — just type the 3 words shown and press Run.',
      'Every SQL command ends with a semicolon `;` — like a period at the end of a sentence.',
      'SELECT 1;',
    ],
    xp: 15,
    tool: {
      name: 'Running a query', icon: '▶️', description: 'Type SQL in the box, press Run, see what comes back.', fun: 1,
    },
    check({ result }) {
      const got = firstRows(result)
      if (got.length !== 1 || Number(got[0]?.[0]) !== 1) {
        return { success: false, message: 'Just type SELECT 1; exactly as shown, then press Run.' }
      }
      return { success: true, message: 'That\'s it — you just ran your first SQL query! The semicolon ends the command, and Run sends it to the database.' }
    },
  },

  {
    id: 'sql-00-single-column',
    npc: 'Elder Mana',
    title: 'One Column',
    prompt: 'Good. Now something real: this island keeps information in tables — grids of rows and columns, like a spreadsheet. Type `SELECT name FROM village;` to see just the village names.',
    starter: '-- Show only the name column from village\n',
    hints: [
      'SELECT says which column you want; FROM says which table to look in.',
      'The table is called `village`, the column you want is called `name`.',
      'SELECT name FROM village;',
    ],
    xp: 15,
    tool: {
      name: 'Table & column', icon: '🗂️', description: 'A table is a grid of rows; a column is one type of info in it.', fun: 1,
    },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name FROM village')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'I just want the `name` column from the `village` table, nothing else.' }
      }
      return { success: true, message: 'One column, four villages — that\'s exactly what a column is: one type of info, repeated across every row.' }
    },
  },

  {
    id: 'sql-01-select-star',
    npc: 'Elder Mana',
    title: 'The Villages',
    prompt: "Welcome to SQL Island, Ziro. First — show me every village we have. Query the whole `village` table.",
    starter: '-- Show every column, every row\nSELECT * FROM village;',
    hints: [
      'You want every column and every row — the wildcard `*` means "all columns".',
      'The shape is: SELECT * FROM <table>;',
      'SELECT * FROM village;',
    ],
    xp: 40,
    tool: { name: 'SELECT *', icon: '📜', description: 'Fetch every column from a table.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM village')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That doesn\'t match all 4 villages with all their columns. Try SELECT * FROM village.' }
      }
      return { success: true, message: 'The fog clears — all four villages appear on the map.' }
    },
  },

  {
    id: 'sql-02-select-columns',
    npc: 'Elder Mana',
    title: 'Just the Essentials',
    prompt: 'Good. Now I only care about each village\'s name and its population — leave the rest out.',
    starter: 'SELECT  FROM village;',
    hints: [
      'List only the columns you want, separated by commas, instead of *.',
      'The columns you need are called `name` and `population`.',
      'SELECT name, population FROM village;',
    ],
    xp: 40,
    tool: { name: 'Column Selection', icon: '🎯', description: 'Pick exactly the columns you need instead of *.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name, population FROM village')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'I see extra or missing columns. I only want name and population.' }
      }
      return { success: true, message: 'Clean and simple. Exactly what I needed.' }
    },
  },

  {
    id: 'sql-03-where',
    npc: 'Elder Mana',
    title: 'Friendly Faces',
    prompt: 'The storm left some islanders scared and hostile. Find only the ones whose state is \'friendly\'.',
    starter: "SELECT * FROM inhabitant WHERE ;",
    hints: [
      'WHERE filters rows down to the ones matching a condition.',
      'Compare the `state` column to the text \'friendly\' using =.',
      "SELECT * FROM inhabitant WHERE state = 'friendly';",
    ],
    xp: 45,
    tool: { name: 'WHERE clause', icon: '🔍', description: 'Filter rows down to the ones that match a condition.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT * FROM inhabitant WHERE state = 'friendly'")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That\'s not quite the friendly crowd. Check your WHERE condition.' }
      }
      return { success: true, message: 'These are the ones willing to help us rebuild.' }
    },
  },

  {
    id: 'sql-04-and-or',
    npc: 'Elder Mana',
    title: 'Friendly and Rich',
    prompt: 'Now narrow it further — friendly islanders who also have more than 200 gold. We need their help funding repairs.',
    starter: 'SELECT * FROM inhabitant WHERE ;',
    hints: [
      'You need both conditions to be true at once — that\'s what AND is for.',
      'Combine state = \'friendly\' with gold > 200.',
      "SELECT * FROM inhabitant WHERE state = 'friendly' AND gold > 200;",
    ],
    xp: 45,
    tool: { name: 'AND / OR', icon: '🔗', description: 'Combine multiple conditions in one WHERE clause.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT * FROM inhabitant WHERE state = 'friendly' AND gold > 200")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Some of these are either not friendly, or don\'t have enough gold. Use AND.' }
      }
      return { success: true, message: 'These generous souls will fund the rebuild.' }
    },
  },

  {
    id: 'sql-05-like',
    npc: 'Elder Mana',
    title: 'Calling the Smiths',
    prompt: 'We need craftsmen to forge new tools. Find everyone whose job ends in \'smith\'.',
    starter: 'SELECT * FROM inhabitant WHERE ;',
    hints: [
      'LIKE lets you match partial text using wildcards.',
      '% means "anything, any length" — it can go at the start or end of the pattern.',
      "SELECT * FROM inhabitant WHERE job LIKE '%smith';",
    ],
    xp: 50,
    tool: { name: 'LIKE + wildcards', icon: '🪄', description: 'Pattern-match text with % (any chars) and _ (one char).', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT * FROM inhabitant WHERE job LIKE '%smith'")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Missing a smith or two — remember % matches anything before "smith".' }
      }
      return { success: true, message: 'Tane and Maui report for duty at the forge.' }
    },
  },

  {
    id: 'sql-06-is-null',
    npc: 'Elder Mana',
    title: 'Ownerless Treasures',
    prompt: 'The storm scattered items with no owner recorded. Find every item where owner_id is missing.',
    starter: 'SELECT * FROM item WHERE ;',
    hints: [
      'A missing value in SQL is called NULL, and you can\'t compare it with = .',
      'Use "IS NULL" instead of "= NULL".',
      'SELECT * FROM item WHERE owner_id IS NULL;',
    ],
    xp: 45,
    tool: { name: 'IS NULL', icon: '👻', description: 'Test for missing values — NULL never equals anything, even itself.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM item WHERE owner_id IS NULL')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Some ownerless items are missing from your list. Try IS NULL, not = NULL.' }
      }
      return { success: true, message: 'Three unclaimed treasures found: an Iron Sword, an Ancient Map, and a Silver Coin Pouch.' }
    },
  },

  {
    id: 'sql-07-order-by',
    npc: 'Elder Mana',
    title: 'The Richest Islanders',
    prompt: 'Show me every islander, richest first.',
    starter: 'SELECT * FROM inhabitant ;',
    hints: [
      'ORDER BY sorts your result set by a column.',
      'By default ORDER BY sorts ascending (low to high) — you want the opposite.',
      'SELECT * FROM inhabitant ORDER BY gold DESC;',
    ],
    xp: 45,
    tool: { name: 'ORDER BY', icon: '📊', description: 'Sort results ascending (ASC) or descending (DESC).', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM inhabitant ORDER BY gold DESC')
      const got = firstRows(result)
      if (!sameRows(got, expected, { ordered: true })) {
        return { success: false, message: 'The order looks off. Richest should be first — that\'s DESC.' }
      }
      return { success: true, message: 'Kai tops the list. No surprise, the chief always does.' }
    },
  },

  {
    id: 'sql-08-limit',
    npc: 'Elder Mana',
    title: 'Runner-Up Riches',
    prompt: 'Skip the single richest islander, then show me the next 3 richest.',
    starter: 'SELECT * FROM inhabitant ORDER BY gold DESC ;',
    hints: [
      'LIMIT caps how many rows come back; OFFSET skips a number of rows first.',
      'You want to skip 1 row, then take 3.',
      'SELECT * FROM inhabitant ORDER BY gold DESC LIMIT 3 OFFSET 1;',
    ],
    xp: 50,
    tool: { name: 'LIMIT / OFFSET', icon: '✂️', description: 'Page through results — cap the count and skip a starting number of rows.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM inhabitant ORDER BY gold DESC LIMIT 3 OFFSET 1')
      const got = firstRows(result)
      if (!sameRows(got, expected, { ordered: true })) {
        return { success: false, message: 'Not quite 3 rows starting after the richest. Check LIMIT and OFFSET.' }
      }
      return { success: true, message: 'Rongo, Leilani, and Tane — the runners-up.' }
    },
  },

  {
    id: 'sql-09-insert',
    npc: 'Elder Mana',
    title: 'Join the Island',
    prompt: "It's time you became one of us. Add yourself to the inhabitant table — name 'Ziro', villageid 1, gender your choice, job 'hero', gold 100, state 'friendly', any age.",
    starter: "INSERT INTO inhabitant (name, villageid, gender, job, gold, state, age)\nVALUES ();",
    hints: [
      'INSERT INTO table (columns...) VALUES (values...) adds a new row.',
      'You don\'t need to specify personid — it fills in automatically.',
      "INSERT INTO inhabitant (name, villageid, gender, job, gold, state, age) VALUES ('Ziro', 1, 'M', 'hero', 100, 'friendly', 25);",
    ],
    xp: 60,
    once: true,
    tool: { name: 'INSERT INTO', icon: '➕', description: 'Add a brand new row to a table.', fun: 4 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'INSERT')) {
        return { success: false, message: 'That\'s not an INSERT statement.' }
      }
      const row = scalar(db, "SELECT COUNT(*) FROM inhabitant WHERE name = 'Ziro' AND villageid = 1 AND job = 'hero' AND gold = 100 AND state = 'friendly'")
      if (!row) {
        return { success: false, message: 'I don\'t see you in Coral Bay\'s records yet — check every column matches what I asked for.' }
      }
      return { success: true, message: 'Welcome to Coral Bay, Ziro. You\'re one of us now.' }
    },
  },

  {
    id: 'sql-10-update',
    npc: 'Elder Mana',
    title: 'Claim the Blade',
    prompt: 'The unclaimed Iron Sword (itemid 3) should be yours now. Update it so your own personid becomes its owner_id.',
    starter: 'UPDATE item SET owner_id = WHERE itemid = 3;',
    hints: [
      'UPDATE table SET column = value WHERE condition changes existing rows.',
      'You can nest a SELECT inside the SET to look up your own personid by name.',
      "UPDATE item SET owner_id = (SELECT personid FROM inhabitant WHERE name = 'Ziro') WHERE itemid = 3;",
    ],
    xp: 55,
    once: true,
    tool: { name: 'UPDATE', icon: '✏️', description: 'Modify existing rows — always pair it with WHERE.', fun: 3 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'UPDATE')) {
        return { success: false, message: 'That\'s not an UPDATE statement.' }
      }
      const zid = ziroId(db)
      const owner = scalar(db, 'SELECT owner_id FROM item WHERE itemid = 3')
      if (!zid || owner !== zid) {
        return { success: false, message: 'The Iron Sword still isn\'t yours. Check the WHERE clause targets itemid 3.' }
      }
      return { success: true, message: 'The blade is yours. It feels lighter than you expected.' }
    },
  },

  {
    id: 'sql-11-delete',
    npc: 'Elder Mana',
    title: 'Clearing a False Lead',
    prompt: '"Recover Lost Compass" (questid 6) turned out to be a hoax — the compass was never lost. Delete that quest.',
    starter: 'DELETE FROM quest WHERE ;',
    hints: [
      'DELETE FROM table WHERE condition removes matching rows — always use WHERE, or you\'ll wipe the whole table.',
      'Target the specific questid, not the whole table.',
      'DELETE FROM quest WHERE questid = 6;',
    ],
    xp: 55,
    once: true,
    tool: { name: 'DELETE', icon: '🗑️', description: 'Remove rows — never run it without a WHERE unless you mean to empty the table.', fun: 3 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'DELETE') || !containsKeyword(sql, 'WHERE')) {
        return { success: false, message: 'Use DELETE with a WHERE clause — don\'t risk wiping every quest.' }
      }
      const gone = scalar(db, 'SELECT COUNT(*) FROM quest WHERE questid = 6')
      const others = scalar(db, 'SELECT COUNT(*) FROM quest')
      if (gone !== 0) return { success: false, message: 'The fake quest is still on the books.' }
      if (others < 4) return { success: false, message: 'Whoa — you deleted more than just the one quest.' }
      return { success: true, message: 'One less false lead cluttering the record books.' }
    },
  },

  {
    id: 'sql-12-inner-join',
    npc: 'Fisherman Koa',
    title: 'Names and Homes',
    prompt: "My records are split across two tables and I can't make sense of them. Show me every inhabitant's name next to their village's name.",
    starter: 'SELECT , \nFROM inhabitant i\nJOIN village v ON ;',
    hints: [
      'JOIN combines rows from two tables using a shared key.',
      'inhabitant.villageid matches village.villageid — that\'s the ON condition.',
      'SELECT i.name, v.name FROM inhabitant i JOIN village v ON i.villageid = v.villageid;',
    ],
    xp: 65,
    tool: { name: 'INNER JOIN', icon: '🔀', description: 'Combine matching rows from two tables via a shared key.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT i.name, v.name FROM inhabitant i JOIN village v ON i.villageid = v.villageid')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The pairings look wrong or incomplete. Check your ON condition.' }
      }
      return { success: true, message: 'Now I can finally tell who belongs where!' }
    },
  },

  {
    id: 'sql-13-left-join',
    npc: 'Fisherman Koa',
    title: 'The Empty-Handed',
    prompt: "Some islanders lost everything in the storm and own nothing at all. Find every inhabitant who owns no item.",
    starter: 'SELECT i.name\nFROM inhabitant i\nLEFT JOIN item it ON \nWHERE ;',
    hints: [
      'LEFT JOIN keeps every row from the left table, even with no match on the right.',
      'When there\'s no matching item, every item column — including owner_id — comes back NULL.',
      'SELECT i.name FROM inhabitant i LEFT JOIN item it ON it.owner_id = i.personid WHERE it.itemid IS NULL;',
    ],
    xp: 70,
    tool: { name: 'LEFT JOIN', icon: '👈', description: 'Keep all rows from the left table even without a match on the right.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT i.name FROM inhabitant i LEFT JOIN item it ON it.owner_id = i.personid WHERE it.itemid IS NULL')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That list doesn\'t match the empty-handed islanders. Remember to check for a NULL match.' }
      }
      return { success: true, message: 'These islanders will need our help most.' }
    },
  },

  {
    id: 'sql-14-three-way-join',
    npc: 'Fisherman Koa',
    title: 'The Full Picture',
    prompt: 'For every owned item, show the item name, its owner\'s name, and the owner\'s village name — all three, together.',
    starter: 'SELECT it.name, i.name, v.name\nFROM item it\nJOIN inhabitant i ON \nJOIN village v ON ;',
    hints: [
      'You can chain multiple JOINs — one connects item to inhabitant, another connects inhabitant to village.',
      'item.owner_id = inhabitant.personid, and inhabitant.villageid = village.villageid.',
      'SELECT it.name, i.name, v.name FROM item it JOIN inhabitant i ON it.owner_id = i.personid JOIN village v ON i.villageid = v.villageid;',
    ],
    xp: 75,
    tool: { name: 'Multi-table JOIN', icon: '🕸️', description: 'Chain JOINs across three or more tables.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT it.name, i.name, v.name FROM item it JOIN inhabitant i ON it.owner_id = i.personid JOIN village v ON i.villageid = v.villageid')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The chain is broken somewhere — double check both ON conditions.' }
      }
      return { success: true, message: 'The full trail of ownership, village by village.' }
    },
  },

  {
    id: 'sql-15-aggregates',
    npc: 'Merchant Lani',
    title: 'The Island\'s Wealth',
    prompt: 'For my ledger: what is the total gold, the average gold, the highest, and the lowest across every inhabitant?',
    starter: 'SELECT , , ,  FROM inhabitant;',
    hints: [
      'Aggregate functions collapse many rows into one summary number.',
      'SUM, AVG, MAX, and MIN each take a column name in parentheses.',
      'SELECT SUM(gold), AVG(gold), MAX(gold), MIN(gold) FROM inhabitant;',
    ],
    xp: 60,
    tool: { name: 'Aggregate functions', icon: '🧮', description: 'SUM, AVG, MAX, MIN, COUNT — collapse rows into one number.', fun: 3 },
    check({ db, result }) {
      const [expected] = queryRows(db, 'SELECT SUM(gold), AVG(gold), MAX(gold), MIN(gold) FROM inhabitant')
      const got = firstRows(result)
      if (got.length !== 1 || !sameRows(got, [expected])) {
        return { success: false, message: 'Those numbers don\'t add up. I need SUM, AVG, MAX, and MIN of gold, in that order.' }
      }
      return { success: true, message: 'Now I know exactly how rich this island really is.' }
    },
  },

  {
    id: 'sql-16-group-by',
    npc: 'Merchant Lani',
    title: 'Village Headcounts',
    prompt: 'How many inhabitants live in each village? Show the village name alongside the count.',
    starter: 'SELECT v.name, \nFROM inhabitant i\nJOIN village v ON i.villageid = v.villageid\n;',
    hints: [
      'GROUP BY collapses rows sharing the same value into one group per value.',
      'COUNT(*) inside a GROUP BY counts rows per group.',
      'SELECT v.name, COUNT(*) FROM inhabitant i JOIN village v ON i.villageid = v.villageid GROUP BY v.name;',
    ],
    xp: 65,
    tool: { name: 'GROUP BY', icon: '📦', description: 'Bucket rows into groups so aggregates apply per group.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT v.name, COUNT(*) FROM inhabitant i JOIN village v ON i.villageid = v.villageid GROUP BY v.name')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The headcounts are off per village. Did you GROUP BY the village name?' }
      }
      return { success: true, message: 'Coral Bay is bursting since you moved in!' }
    },
  },

  {
    id: 'sql-17-having',
    npc: 'Merchant Lani',
    title: 'The Bigger Villages',
    prompt: 'I only want to trade with villages that have more than 3 inhabitants. Filter your grouped counts down to those.',
    starter: 'SELECT v.name, COUNT(*) AS c\nFROM inhabitant i\nJOIN village v ON i.villageid = v.villageid\nGROUP BY v.name\n;',
    hints: [
      'WHERE filters rows before grouping — you need to filter after grouping.',
      'HAVING is like WHERE, but it runs after GROUP BY and can reference aggregates.',
      'SELECT v.name, COUNT(*) AS c FROM inhabitant i JOIN village v ON i.villageid = v.villageid GROUP BY v.name HAVING COUNT(*) > 3;',
    ],
    xp: 70,
    tool: { name: 'HAVING', icon: '🎚️', description: 'Filter grouped results using an aggregate condition.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT v.name, COUNT(*) FROM inhabitant i JOIN village v ON i.villageid = v.villageid GROUP BY v.name HAVING COUNT(*) > 3')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That\'s not the right set of villages. Remember: HAVING, not WHERE, for a grouped condition.' }
      }
      return { success: true, message: 'Good — those are the villages worth the trip.' }
    },
  },

  {
    id: 'sql-18-subquery-where',
    npc: 'Oracle Hina',
    title: 'Above Average',
    prompt: 'Show me every inhabitant richer than the island\'s average gold — without telling me the average yourself.',
    starter: 'SELECT * FROM inhabitant WHERE gold > ();',
    hints: [
      'A query can nest inside another query\'s WHERE clause — that\'s a subquery.',
      'The subquery computes the average; the outer query compares each row against it.',
      'SELECT * FROM inhabitant WHERE gold > (SELECT AVG(gold) FROM inhabitant);',
    ],
    xp: 80,
    tool: { name: 'Subquery (WHERE)', icon: '🪆', description: 'Nest a query inside WHERE to compare against a computed value.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM inhabitant WHERE gold > (SELECT AVG(gold) FROM inhabitant)')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That set doesn\'t match those above the true average. Use a subquery, not a hardcoded number.' }
      }
      return { success: true, message: 'The island\'s upper class, revealed.' }
    },
  },

  {
    id: 'sql-19-subquery-select',
    npc: 'Oracle Hina',
    title: 'Richer or Poorer',
    prompt: 'For every inhabitant, show their name and how far their gold is from the island average — positive if richer, negative if poorer.',
    starter: 'SELECT name, gold - () AS diff FROM inhabitant;',
    hints: [
      'A subquery can also sit inside the SELECT list, not just WHERE.',
      'Subtract the average (via a subquery) from each row\'s gold.',
      'SELECT name, gold - (SELECT AVG(gold) FROM inhabitant) AS diff FROM inhabitant;',
    ],
    xp: 80,
    tool: { name: 'Subquery (SELECT)', icon: '🪄', description: 'Nest a query inside the SELECT list to compute per-row values.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name, gold - (SELECT AVG(gold) FROM inhabitant) FROM inhabitant')
      const got = firstRows(result)
      if (!sameRows(got, expected, { tolerance: 0.5 })) {
        return { success: false, message: 'The differences look wrong. Each row needs gold minus the island average.' }
      }
      return { success: true, message: 'Now everyone knows exactly where they stand.' }
    },
  },

  {
    id: 'sql-20-distinct',
    npc: 'Oracle Hina',
    title: 'The Trades of the Island',
    prompt: 'What distinct jobs exist on this island? No duplicates.',
    starter: 'SELECT  FROM inhabitant;',
    hints: [
      'DISTINCT removes duplicate rows from your result.',
      'It goes right after SELECT, before the column name.',
      'SELECT DISTINCT job FROM inhabitant;',
    ],
    xp: 45,
    tool: { name: 'DISTINCT', icon: '🎴', description: 'Strip duplicate rows out of a result set.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT DISTINCT job FROM inhabitant')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'I see duplicates, or a missing trade. Use SELECT DISTINCT.' }
      }
      return { success: true, message: 'A tidy list of every trade practiced here.' }
    },
  },

  {
    id: 'sql-21-case-when',
    npc: 'Oracle Hina',
    title: 'Wealth Tiers',
    prompt: "Label each inhabitant's wealth tier: 'wealthy' if gold >= 300, 'comfortable' if gold >= 150, otherwise 'poor'. Show name and tier.",
    starter: "SELECT name,\n  CASE\n    WHEN gold >= 300 THEN ''\n    WHEN gold >= 150 THEN ''\n    ELSE ''\n  END AS tier\nFROM inhabitant;",
    hints: [
      'CASE WHEN ... THEN ... WHEN ... THEN ... ELSE ... END works like inline if/elif/else.',
      'Conditions are checked top to bottom — the first true one wins, so order matters.',
      "SELECT name, CASE WHEN gold >= 300 THEN 'wealthy' WHEN gold >= 150 THEN 'comfortable' ELSE 'poor' END AS tier FROM inhabitant;",
    ],
    xp: 75,
    tool: { name: 'CASE WHEN', icon: '🏷️', description: 'Inline conditional logic inside a SELECT.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(
        db,
        "SELECT name, CASE WHEN gold >= 300 THEN 'wealthy' WHEN gold >= 150 THEN 'comfortable' ELSE 'poor' END FROM inhabitant",
      )
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Some tiers look mislabeled. Use exactly \'wealthy\', \'comfortable\', \'poor\' with those thresholds.' }
      }
      return { success: true, message: 'Every islander now has a wealth tier on record.' }
    },
  },

  {
    id: 'sql-22-cte',
    npc: 'Oracle Hina',
    title: 'Naming Your Thoughts',
    prompt: 'Rewrite the "above average" query from before, but this time define the average as a named CTE using WITH, instead of a nested subquery.',
    starter: 'WITH avg_gold AS (\n  SELECT AVG(gold) AS a FROM inhabitant\n)\nSELECT inhabitant.* FROM inhabitant, avg_gold WHERE gold > a;',
    hints: [
      'WITH name AS (query) defines a temporary named result you can reference like a table.',
      'It makes complex queries far more readable than deeply nested subqueries. Select inhabitant.* rather than * — otherwise the CTE\'s own column tags along too.',
      'WITH avg_gold AS (SELECT AVG(gold) AS a FROM inhabitant) SELECT inhabitant.* FROM inhabitant, avg_gold WHERE gold > a;',
    ],
    xp: 85,
    tool: { name: 'CTE (WITH)', icon: '📐', description: 'Name a subquery with WITH so complex logic reads top to bottom.', fun: 5 },
    check({ db, result, sql }) {
      if (!containsKeyword(sql, 'WITH')) {
        return { success: false, message: 'I want to see a WITH clause — a named CTE, not a bare subquery.' }
      }
      const expected = queryRows(db, 'SELECT * FROM inhabitant WHERE gold > (SELECT AVG(gold) FROM inhabitant)')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The result doesn\'t match the above-average islanders anymore.' }
      }
      return { success: true, message: 'Named thoughts, clearer mind. This is how the ancients wrote their scrolls.' }
    },
  },

  {
    id: 'sql-23-window-rank',
    npc: 'Oracle Hina',
    title: 'Rank Within the Village',
    prompt: 'For every inhabitant, show their name, village id, gold, and their gold RANK within their own village (richest = 1).',
    starter: 'SELECT name, villageid, gold,\n  RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) AS rnk\nFROM inhabitant;',
    hints: [
      'Window functions compute per-row values across a set of related rows without collapsing them.',
      'PARTITION BY resets the ranking per group; ORDER BY decides what "first" means.',
      'SELECT name, villageid, gold, RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) AS rnk FROM inhabitant;',
    ],
    xp: 95,
    tool: { name: 'Window functions (RANK)', icon: '🏆', description: 'RANK() / ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) — per-row ranking.', fun: 5 },
    check({ db, result, sql }) {
      if (!/RANK\s*\(|ROW_NUMBER\s*\(/i.test(sql) || !/OVER\s*\(/i.test(sql)) {
        return { success: false, message: 'I need an actual window function — RANK() or ROW_NUMBER() with an OVER (...) clause.' }
      }
      const expected = queryRows(
        db,
        'SELECT name, villageid, gold, RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) FROM inhabitant',
      )
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The ranks don\'t line up per village. Make sure you PARTITION BY villageid.' }
      }
      return { success: true, message: 'Now every village knows its own hierarchy of wealth.' }
    },
  },

  {
    id: 'sql-24-lag',
    npc: 'Oracle Hina',
    title: 'Trade Momentum',
    prompt: 'List every trade in date order with its price, alongside the price of the trade immediately before it.',
    starter: 'SELECT tradeid, trade_date, price,\n  LAG(price) OVER (ORDER BY trade_date) AS prev_price\nFROM trade\nORDER BY trade_date;',
    hints: [
      'LAG looks one row back in a given ordering; LEAD looks one row forward.',
      'The first row will have no "previous" trade, so its LAG value is NULL — that\'s expected.',
      'SELECT tradeid, trade_date, price, LAG(price) OVER (ORDER BY trade_date) AS prev_price FROM trade ORDER BY trade_date;',
    ],
    xp: 95,
    tool: { name: 'Window functions (LAG/LEAD)', icon: '⏮️', description: 'Look at the previous or next row\'s value without a self-join.', fun: 5 },
    check({ db, result, sql }) {
      if (!/LAG\s*\(/i.test(sql)) {
        return { success: false, message: 'I specifically need the previous trade\'s price — that\'s LAG, not LEAD.' }
      }
      const expected = queryRows(
        db,
        'SELECT tradeid, trade_date, price, LAG(price) OVER (ORDER BY trade_date) FROM trade ORDER BY trade_date',
      )
      const got = firstRows(result)
      if (!sameRows(got, expected, { ordered: true })) {
        return { success: false, message: 'The sequence or the lagged prices don\'t line up. Order by trade_date.' }
      }
      return { success: true, message: 'Now we can see exactly how each trade compared to the one before it.' }
    },
  },

  {
    id: 'sql-25-view',
    npc: 'Oracle Hina',
    title: 'A Standing Watch',
    prompt: "Create a view named 'friendly_wealthy' that always shows friendly inhabitants with 200 gold or more — so we never have to write this query twice.",
    starter: "CREATE VIEW friendly_wealthy AS\nSELECT * FROM inhabitant WHERE ;",
    hints: [
      'CREATE VIEW name AS (query) saves a query under a name you can SELECT from later.',
      'The underlying condition is the same "friendly and gold >= 200" filter you\'ve written before.',
      "CREATE VIEW friendly_wealthy AS SELECT * FROM inhabitant WHERE state = 'friendly' AND gold >= 200;",
    ],
    xp: 85,
    once: true,
    tool: { name: 'CREATE VIEW', icon: '🖼️', description: 'Save a query under a name — a virtual table you can query anytime.', fun: 4 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'CREATE') || !containsKeyword(sql, 'VIEW')) {
        return { success: false, message: 'That\'s not a CREATE VIEW statement.' }
      }
      if (!tableExists(db, 'friendly_wealthy', 'view')) {
        return { success: false, message: 'I don\'t see a view called friendly_wealthy in the records.' }
      }
      const expected = queryRows(db, "SELECT * FROM inhabitant WHERE state = 'friendly' AND gold >= 200")
      const got = queryRows(db, 'SELECT * FROM friendly_wealthy')
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The view exists but shows the wrong rows. Check your WHERE condition.' }
      }
      return { success: true, message: 'From now on, one word — friendly_wealthy — answers this question forever.' }
    },
  },

  {
    id: 'sql-26-index',
    npc: 'Oracle Hina',
    title: 'Speed of Thought',
    prompt: 'We search by gold constantly and it\'s getting slow as the island grows. Create an index named idx_gold on inhabitant(gold).',
    starter: 'CREATE INDEX idx_gold ON inhabitant();',
    hints: [
      'An index is a sorted lookup structure the database keeps so it doesn\'t scan every row.',
      'CREATE INDEX name ON table(column);',
      'CREATE INDEX idx_gold ON inhabitant(gold);',
    ],
    xp: 70,
    once: true,
    tool: { name: 'CREATE INDEX', icon: '⚡', description: 'Speed up lookups on a column at the cost of extra storage and slower writes.', fun: 3 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'CREATE') || !containsKeyword(sql, 'INDEX')) {
        return { success: false, message: 'That\'s not a CREATE INDEX statement.' }
      }
      if (!tableExists(db, 'idx_gold', 'index')) {
        return { success: false, message: 'I don\'t see an index named idx_gold yet.' }
      }
      return { success: true, message: 'Searches by gold will be lightning fast from now on.' }
    },
  },

  {
    id: 'sql-27-transaction',
    npc: 'Elder Mana',
    title: 'A Safe Trade',
    prompt: 'Maui (personid 7) owes you 50 gold. Transfer it safely: subtract 50 from Maui, add 50 to yourself, wrapped in a transaction so it can never happen halfway.',
    starter: "BEGIN TRANSACTION;\nUPDATE inhabitant SET gold = gold - 50 WHERE personid = 7;\nUPDATE inhabitant SET gold = gold + 50 WHERE name = 'Ziro';\nCOMMIT;",
    hints: [
      'BEGIN starts a transaction; nothing is permanent until COMMIT.',
      'If anything went wrong partway, ROLLBACK would undo everything since BEGIN — that\'s the whole point.',
      "BEGIN TRANSACTION; UPDATE inhabitant SET gold = gold - 50 WHERE personid = 7; UPDATE inhabitant SET gold = gold + 50 WHERE name = 'Ziro'; COMMIT;",
    ],
    xp: 90,
    once: true,
    tool: { name: 'Transactions', icon: '🔒', description: 'BEGIN / COMMIT / ROLLBACK — group statements so they all succeed or none do.', fun: 4 },
    check({ db, sql }) {
      if (!containsKeyword(sql, 'BEGIN') || !containsKeyword(sql, 'COMMIT')) {
        return { success: false, message: 'Wrap the transfer in BEGIN ... COMMIT so it\'s all-or-nothing.' }
      }
      const maui = scalar(db, 'SELECT gold FROM inhabitant WHERE personid = 7')
      const zid = ziroId(db)
      const ziro = scalar(db, 'SELECT gold FROM inhabitant WHERE personid = ?', [zid])
      if (maui !== 300 || ziro !== 150) {
        return { success: false, message: 'The gold didn\'t move correctly — Maui should drop by 50, you should gain 50.' }
      }
      return { success: true, message: 'A clean trade, fully recorded, no risk of half-finished business.' }
    },
  },

  {
    id: 'sql-28-final-boss',
    npc: 'Elder Mana',
    title: 'Restoring the Island',
    prompt: 'The final report: for each village, show its name, how many friendly inhabitants it has, and the name of its single richest inhabitant. Use everything you\'ve learned.',
    starter: '-- Combine JOIN, aggregation, and a window function (or subqueries) — your call.\n',
    hints: [
      'Break it into pieces: friendly count is a grouped aggregate; richest person is a per-village rank of 1.',
      'A CTE with RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) makes "richest per village" easy to join back to.',
      `WITH ranked AS (
  SELECT *, RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) AS rnk
  FROM inhabitant
)
SELECT v.name AS village,
  (SELECT COUNT(*) FROM inhabitant i2 WHERE i2.villageid = v.villageid AND i2.state = 'friendly') AS friendly_count,
  r.name AS richest
FROM village v
JOIN ranked r ON r.villageid = v.villageid AND r.rnk = 1;`,
    ],
    xp: 200,
    tool: { name: 'SQL Islander', icon: '👑', description: 'Combined joins, aggregation, and window functions to restore an entire island.', fun: 5 },
    check({ db, result }) {
      const expected = queryRows(
        db,
        `WITH ranked AS (
          SELECT *, RANK() OVER (PARTITION BY villageid ORDER BY gold DESC) AS rnk
          FROM inhabitant
        )
        SELECT v.name,
          (SELECT COUNT(*) FROM inhabitant i2 WHERE i2.villageid = v.villageid AND i2.state = 'friendly'),
          r.name
        FROM village v
        JOIN ranked r ON r.villageid = v.villageid AND r.rnk = 1`,
      )
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Close, but the report doesn\'t match. Double check the friendly count and the richest-per-village logic.' }
      }
      return { success: true, message: 'The report is complete. SQL Island is finally back on its feet — thanks to you, Ziro.' }
    },
  },
]

export const SQL_ISLAND_ZONE = {
  id: 'sql-island',
  name: 'SQL Island',
  palette: { bg: '#1b6fa8', ground: 0xe8d59a, groundAccent: 0xdcc27e },
  decor: { kind: 'palm' },
  npcIntro: {
    name: 'Elder Mana',
    lines: [
      "Welcome to SQL Island, Ziro.",
      "A hurricane tore through here and scrambled our entire database — our people, our villages, our treasures.",
      "Everything is still in there. We just can't see it anymore.",
      "You have a gift for finding order in chaos. Will you help us recover what the storm scattered?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Elder Mana', color: 0x7c3aed, role: 'main' },
    { x: 2020, y: 560, name: 'Fisherman Koa', color: 0x0284c7, flavor: 'My records are split across tables — the JOIN chests nearby will help me make sense of them.' },
    { x: 260, y: 860, name: 'Merchant Lani', color: 0xca8a04, flavor: 'I need totals and counts for my ledger. The chests around here will teach you to summarize data.' },
    { x: 2020, y: 1160, name: 'Oracle Hina', color: 0x0d9488, flavor: 'The deepest truths need subqueries, CTEs, and window functions to see. Open the nearby chests when ready.' },
  ],
  challenges: SQL_ISLAND_CHALLENGES,
  nextZone: 'code-kingdom',
}
