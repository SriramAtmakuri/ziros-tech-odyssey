import { firstRows, queryRows, sameRows } from '../../utils/sqlCheck.js'

// The bonus reserve pool for SQL Island. Once a chest is solved and the
// player moves past it via "Next", that chest's challenge gets swapped for
// one drawn from here — so backtracking finds a genuinely new challenge,
// not a repeat. All 30 are pre-authored (never AI-generated at runtime, to
// keep the game fully offline) and split three ways:
//   - 10 live SQL queries (read-only SELECTs against the untouched base
//     schema/data, so they stay correct no matter which of the main 30
//     challenges — INSERT/UPDATE/DELETE/CREATE — have already run)
//   - 10 multiple-choice questions on concepts sql.js can't execute
//     (Snowflake, Oracle, PostgreSQL platform knowledge)
//   - 10 matching challenges pairing terms with their definitions
// Same { id, npc, title, prompt, hints[3], xp, tool } shape as the main
// pool; kind is omitted (defaults to 'sql') for the live-query ones, and
// explicit 'mcq' / 'matching' for the other two kinds.

export const SQL_ISLAND_BONUS_POOL = [
  // ---------- live SQL (read-only, mutation-order independent) ----------
  {
    id: 'sql-bonus-01-union',
    npc: 'Fisherman Koa',
    title: 'One Combined List',
    prompt: 'List every village name together with every item name, as one single combined list.',
    starter: 'SELECT name FROM village\n\nSELECT name FROM item;',
    hints: [
      'UNION stacks the results of two SELECTs into one list, as long as they have the same number of columns.',
      'Put UNION on its own line between the two SELECT statements.',
      'SELECT name FROM village UNION SELECT name FROM item;',
    ],
    xp: 55,
    tool: { name: 'UNION', icon: '🧩', description: 'Stack the results of two SELECTs into one combined list.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name FROM village UNION SELECT name FROM item')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That list doesn\'t match all villages plus all items combined. Try UNION.' }
      }
      return { success: true, message: 'Fourteen names, one list — villages and treasures side by side.' }
    },
  },
  {
    id: 'sql-bonus-02-in',
    npc: 'Elder Mana',
    title: 'Chiefs, Healers, and Warriors',
    prompt: 'Find every inhabitant whose job is chief, healer, or warrior.',
    starter: 'SELECT * FROM inhabitant WHERE job ;',
    hints: [
      'IN lets you match against a list of values instead of chaining OR = OR =.',
      'IN (\'value1\', \'value2\', \'value3\') checks the column against each one.',
      "SELECT * FROM inhabitant WHERE job IN ('chief', 'healer', 'warrior');",
    ],
    xp: 50,
    tool: { name: 'IN operator', icon: '📋', description: 'Match a column against a list of values at once.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT * FROM inhabitant WHERE job IN ('chief', 'healer', 'warrior')")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That set is missing someone, or includes someone it shouldn\'t. Try IN with all three jobs.' }
      }
      return { success: true, message: 'Every chief, healer, and warrior on the island, found in one shot.' }
    },
  },
  {
    id: 'sql-bonus-03-between',
    npc: 'Merchant Lani',
    title: 'Mid-Range Treasures',
    prompt: 'Find every item valued between 50 and 200 gold, inclusive.',
    starter: 'SELECT * FROM item WHERE value ;',
    hints: [
      'BETWEEN checks a range, and it includes both endpoints.',
      'BETWEEN low AND high — no comma, just AND.',
      'SELECT * FROM item WHERE value BETWEEN 50 AND 200;',
    ],
    xp: 50,
    tool: { name: 'BETWEEN', icon: '📏', description: 'Test whether a value falls within an inclusive range.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM item WHERE value BETWEEN 50 AND 200')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That range looks off. Remember BETWEEN includes both 50 and 200 themselves.' }
      }
      return { success: true, message: 'Four solid mid-value treasures — not the flashiest, but reliable trade goods.' }
    },
  },
  {
    id: 'sql-bonus-04-exists',
    npc: 'Oracle Hina',
    title: 'Villages With a Rich Resident',
    prompt: 'Find every village that has at least one inhabitant richer than 400 gold — without joining or duplicating village rows.',
    starter: 'SELECT * FROM village v WHERE (\n  SELECT 1 FROM inhabitant i WHERE i.villageid = v.villageid AND i.gold > 400\n);',
    hints: [
      'EXISTS checks whether a subquery returns any rows at all — it doesn\'t care what the rows contain.',
      'Wrap EXISTS around a subquery that filters inhabitant by both villageid and gold > 400.',
      'SELECT * FROM village v WHERE EXISTS (SELECT 1 FROM inhabitant i WHERE i.villageid = v.villageid AND i.gold > 400);',
    ],
    xp: 65,
    tool: { name: 'EXISTS', icon: '🔎', description: 'Test whether a correlated subquery returns any rows at all.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT * FROM village v WHERE EXISTS (SELECT 1 FROM inhabitant i WHERE i.villageid = v.villageid AND i.gold > 400)')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That\'s not quite the right village(s). Use EXISTS with a correlated subquery on villageid and gold.' }
      }
      return { success: true, message: 'Only Coral Bay has someone that rich — Kai, alone, clears the 400-gold bar.' }
    },
  },
  {
    id: 'sql-bonus-05-coalesce',
    npc: 'Fisherman Koa',
    title: 'Unclaimed, Not Missing',
    prompt: "For every item, show its name and its owner's name — but instead of a blank/NULL for unowned items, show the text 'unclaimed'.",
    starter: "SELECT it.name, \nFROM item it LEFT JOIN inhabitant i ON it.owner_id = i.personid;",
    hints: [
      'COALESCE(a, b) returns a unless it\'s NULL, in which case it returns b.',
      'Wrap the owner\'s name column in COALESCE, falling back to the literal text \'unclaimed\'.',
      "SELECT it.name, COALESCE(i.name, 'unclaimed') FROM item it LEFT JOIN inhabitant i ON it.owner_id = i.personid;",
    ],
    xp: 65,
    tool: { name: 'COALESCE', icon: '🛟', description: 'Fall back to a default value when a column comes back NULL.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT it.name, COALESCE(i.name, 'unclaimed') FROM item it LEFT JOIN inhabitant i ON it.owner_id = i.personid")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Some rows still show blank instead of \'unclaimed\', or an owned item is mislabeled. Check your COALESCE.' }
      }
      return { success: true, message: 'Every item accounted for — claimed or clearly marked unclaimed.' }
    },
  },
  {
    id: 'sql-bonus-06-string-functions',
    npc: 'Elder Mana',
    title: 'Shouting Names',
    prompt: "Show every inhabitant's name in uppercase, alongside how many letters are in it.",
    starter: 'SELECT , FROM inhabitant;',
    hints: [
      'UPPER(text) converts to uppercase; LENGTH(text) counts characters.',
      'You need both as separate columns in the same SELECT.',
      'SELECT UPPER(name), LENGTH(name) FROM inhabitant;',
    ],
    xp: 45,
    tool: { name: 'String functions', icon: '🔤', description: 'UPPER, LOWER, LENGTH — built-in functions that operate on text.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT UPPER(name), LENGTH(name) FROM inhabitant')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The casing or the letter counts don\'t match. Use UPPER() and LENGTH().' }
      }
      return { success: true, message: 'Fifteen names, shouted and measured.' }
    },
  },
  {
    id: 'sql-bonus-07-round',
    npc: 'Merchant Lani',
    title: 'A Tidy Average',
    prompt: 'What\'s the average item value, rounded to the nearest whole number?',
    starter: 'SELECT  FROM item;',
    hints: [
      'ROUND(number, decimals) rounds to a given number of decimal places.',
      'Nest AVG(value) inside ROUND(..., 0) for zero decimal places.',
      'SELECT ROUND(AVG(value), 0) FROM item;',
    ],
    xp: 50,
    tool: { name: 'ROUND', icon: '➗', description: 'Round a number to a given number of decimal places.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT ROUND(AVG(value), 0) FROM item')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That\'s not the rounded average item value. Nest AVG inside ROUND.' }
      }
      return { success: true, message: 'A clean, tidy number for the ledger — no messy decimals.' }
    },
  },
  {
    id: 'sql-bonus-08-concat',
    npc: 'Elder Mana',
    title: 'Sentences From Columns',
    prompt: "Show one text value per inhabitant that reads like a sentence: their name, then ' the ', then their job — e.g. 'Kai the chief'.",
    starter: "SELECT  FROM inhabitant;",
    hints: [
      'The || operator glues two or more text values together into one.',
      'Chain it: name || \' the \' || job.',
      "SELECT name || ' the ' || job FROM inhabitant;",
    ],
    xp: 55,
    tool: { name: 'String concatenation (||)', icon: '🧵', description: 'Glue text values together into one with the || operator.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT name || ' the ' || job FROM inhabitant")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The sentences don\'t match. Check the exact text between name and job, including the spaces.' }
      }
      return { success: true, message: '"Kai the chief", "Moana the fisherman" — a proper island roster.' }
    },
  },
  {
    id: 'sql-bonus-09-strftime',
    npc: 'Merchant Lani',
    title: 'Which Year?',
    prompt: 'For every trade, show its trade id and just the year part of its trade_date.',
    starter: "SELECT tradeid,  FROM trade;",
    hints: [
      'strftime(format, column) extracts part of a date — \'%Y\' means "just the year".',
      'trade_date is stored as text like \'2024-01-05\'; strftime parses it.',
      "SELECT tradeid, strftime('%Y', trade_date) FROM trade;",
    ],
    xp: 55,
    tool: { name: 'strftime (dates)', icon: '📅', description: 'Extract or format part of a date/time value.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT tradeid, strftime('%Y', trade_date) FROM trade")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Those years don\'t look right. Use strftime(\'%Y\', trade_date).' }
      }
      return { success: true, message: 'Every trade, dated down to the year.' }
    },
  },
  {
    id: 'sql-bonus-10-group-concat',
    npc: 'Oracle Hina',
    title: 'One Line Per Village',
    prompt: 'For each village, list all of its inhabitants\' names as one single comma-separated line of text.',
    starter: 'SELECT v.name, \nFROM village v JOIN inhabitant i ON i.villageid = v.villageid\nGROUP BY v.name;',
    hints: [
      'GROUP_CONCAT(column) is an aggregate that joins values from a group into one comma-separated string.',
      'It goes in the SELECT list right alongside v.name, grouped by village.',
      'SELECT v.name, GROUP_CONCAT(i.name) FROM village v JOIN inhabitant i ON i.villageid = v.villageid GROUP BY v.name;',
    ],
    xp: 60,
    tool: { name: 'GROUP_CONCAT', icon: '🧺', description: 'Aggregate that joins a group\'s values into one comma-separated string.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT v.name, GROUP_CONCAT(i.name) FROM village v JOIN inhabitant i ON i.villageid = v.villageid GROUP BY v.name')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Those rosters don\'t match. Use GROUP_CONCAT(i.name), grouped by village name.' }
      }
      return { success: true, message: 'Four villages, each with its whole roster on one line.' }
    },
  },

  // ---------- MCQ: platform & theory concepts (no execution engine) ----------
  {
    id: 'sql-bonus-11-mcq-warehouse',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: Snowflake',
    prompt: "In Snowflake, what is a 'virtual warehouse'?",
    options: [
      'A physical building where Snowflake stores its servers',
      'A compute cluster that runs your queries, kept separate from where the data itself is stored',
      'A type of foreign key constraint',
      'A backup file format for exporting tables',
    ],
    correctIndex: 1,
    explanation: 'Snowflake separates storage from compute. A virtual warehouse is the compute cluster you spin up, resize, or pause to run queries — the data itself lives independently in Snowflake\'s storage layer.',
    hints: [
      'Snowflake\'s big architectural idea is splitting storage from compute — this term is the compute half.',
      'Think "cluster of servers that runs your queries", not a building or a data structure.',
      'The correct answer is: a compute cluster that runs your queries, separate from where the data is stored.',
    ],
    xp: 40,
    tool: { name: 'Snowflake: Virtual Warehouse', icon: '❄️', description: 'Snowflake\'s independently-scalable compute cluster.', fun: 3 },
  },
  {
    id: 'sql-bonus-12-mcq-micropartitions',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: Snowflake II',
    prompt: "What are Snowflake's 'micro-partitions'?",
    options: [
      'Small partitions you must manually create with a PARTITION BY statement',
      'Automatic, immutable, compressed columnar chunks that Snowflake creates and manages for you',
      'A type of index you build yourself with CREATE INDEX',
      'A row-level locking mechanism used during transactions',
    ],
    correctIndex: 1,
    explanation: 'Unlike traditional partitioning or indexing, Snowflake automatically divides every table into micro-partitions — small, immutable, compressed columnar chunks — with no manual setup required.',
    hints: [
      'This is fully automatic — you never write a statement to create one.',
      'It\'s about how Snowflake physically stores data internally, not about locking or querying.',
      'The correct answer is: automatic, immutable, compressed columnar chunks Snowflake manages for you.',
    ],
    xp: 45,
    tool: { name: 'Snowflake: Micro-partitions', icon: '🧊', description: 'Snowflake\'s automatic columnar storage chunks.', fun: 3 },
  },
  {
    id: 'sql-bonus-13-mcq-plsql',
    kind: 'mcq',
    npc: 'Elder Mana',
    title: 'Beyond This Island: Oracle',
    prompt: 'What is PL/SQL?',
    options: [
      'A NoSQL query language unrelated to SQL',
      "Oracle's procedural extension to SQL — adds loops, variables, and conditionals around SQL statements",
      'A PostgreSQL-only scripting tool',
      'A replacement for the SELECT statement',
    ],
    correctIndex: 1,
    explanation: 'PL/SQL ("Procedural Language/SQL") is Oracle\'s procedural extension — it lets you write loops, variables, and conditional logic wrapped around ordinary SQL, for things like stored procedures and triggers.',
    hints: [
      'The "PL" stands for Procedural Language — think loops and variables, not a whole new query language.',
      'It belongs to one specific vendor, and it\'s built around SQL, not a replacement for it.',
      'The correct answer is: Oracle\'s procedural extension to SQL, adding loops, variables, and conditionals.',
    ],
    xp: 40,
    tool: { name: 'Oracle: PL/SQL', icon: '🏛️', description: "Oracle's procedural extension to SQL.", fun: 3 },
  },
  {
    id: 'sql-bonus-14-mcq-rownum',
    kind: 'mcq',
    npc: 'Elder Mana',
    title: 'Beyond This Island: Oracle II',
    prompt: 'Oracle has no LIMIT keyword like SQLite or PostgreSQL. Before Oracle 12c added FETCH FIRST n ROWS ONLY, how did developers typically cap the number of rows returned?',
    options: [
      'A TOP() function, borrowed from SQL Server',
      'A LIMIT clause identical to SQLite and Postgres',
      'Filtering on the pseudo-column ROWNUM',
      'A special MAXROWS keyword at the end of the query',
    ],
    correctIndex: 2,
    explanation: 'Oracle historically had no LIMIT. Developers filtered on the pseudo-column ROWNUM (e.g. WHERE ROWNUM <= 5), with well-known caveats around combining it with ORDER BY, until 12c introduced FETCH FIRST n ROWS ONLY.',
    hints: [
      'This is a pseudo-column that exists on every row automatically — not a real keyword like LIMIT.',
      'It\'s a numbered column you compare with <= in a WHERE clause.',
      'The correct answer is: filtering on the pseudo-column ROWNUM.',
    ],
    xp: 50,
    tool: { name: 'Oracle: ROWNUM', icon: '🔢', description: "Oracle's classic row-limiting pseudo-column, pre-12c.", fun: 4 },
  },
  {
    id: 'sql-bonus-15-mcq-mvcc',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: PostgreSQL',
    prompt: 'What does MVCC (the concurrency model PostgreSQL is built on) stand for, and what does it let the database do?',
    options: [
      'Multi-Version Concurrency Control — readers see a consistent snapshot of data without blocking writers',
      'Massive Volume Column Compression — shrinks storage size on disk',
      'Multi-Vendor Cloud Connector — enables replication between different database brands',
      'Managed View Cache Control — speeds up VIEW queries specifically',
    ],
    correctIndex: 0,
    explanation: 'MVCC (Multi-Version Concurrency Control) keeps multiple versions of a row around so readers always see a consistent snapshot, without ever having to block a concurrent writer — and vice versa.',
    hints: [
      'The key benefit: readers and writers don\'t block each other.',
      'The "MV" stands for "Multi-Version" — the database keeps more than one version of a row around.',
      'The correct answer is: Multi-Version Concurrency Control — readers see a consistent snapshot without blocking writers.',
    ],
    xp: 45,
    tool: { name: 'PostgreSQL: MVCC', icon: '🐘', description: "Postgres's multi-version concurrency model.", fun: 4 },
  },
  {
    id: 'sql-bonus-16-mcq-serial',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: PostgreSQL II',
    prompt: 'In PostgreSQL, what actually happens under the hood when you declare a column as SERIAL?',
    options: [
      'Postgres enforces that the column can only ever hold odd numbers',
      "Postgres creates a sequence object and sets the column's default to pull its next value",
      'Postgres encrypts every value stored in that column',
      'Postgres marks the column as permanently read-only',
    ],
    correctIndex: 1,
    explanation: "SERIAL is shorthand — Postgres silently creates a backing sequence object and sets the column's DEFAULT to nextval() on that sequence, giving you auto-incrementing values.",
    hints: [
      'It\'s really just convenient shorthand for something else Postgres sets up for you automatically.',
      'Think auto-incrementing IDs — there\'s a hidden object generating each next number.',
      'The correct answer is: it creates a sequence and sets the column\'s default to pull the next value from it.',
    ],
    xp: 50,
    tool: { name: 'PostgreSQL: SERIAL', icon: '🔁', description: 'Shorthand for an auto-incrementing column backed by a sequence.', fun: 3 },
  },
  {
    id: 'sql-bonus-17-mcq-acid',
    kind: 'mcq',
    npc: 'Elder Mana',
    title: 'The Four Letters: ACID',
    prompt: "In database theory, what does the 'I' in ACID stand for?",
    options: ['Indexing', 'Integrity', 'Isolation', 'Immutability'],
    correctIndex: 2,
    explanation: 'ACID = Atomicity, Consistency, Isolation, Durability. Isolation means concurrent transactions can\'t see each other\'s uncommitted, in-progress changes.',
    hints: [
      'It\'s about what happens when two transactions run at the same time.',
      'It describes transactions not being able to see each other\'s unfinished work.',
      'The correct answer is: Isolation.',
    ],
    xp: 35,
    tool: { name: 'ACID: Isolation', icon: '⚗️', description: 'Concurrent transactions can\'t see each other\'s uncommitted changes.', fun: 2 },
  },
  {
    id: 'sql-bonus-18-mcq-keys',
    kind: 'mcq',
    npc: 'Fisherman Koa',
    title: 'Primary vs. Foreign',
    prompt: "What's the key difference between a primary key and a foreign key?",
    options: [
      'They\'re the same concept with two different names',
      "A primary key uniquely identifies rows in its own table; a foreign key references a primary (or unique) key in a different table to link the two",
      'A foreign key column must always store numbers, while a primary key column must always store text',
      'A table is allowed to have a foreign key, but never a primary key',
    ],
    correctIndex: 1,
    explanation: 'A primary key uniquely identifies each row within its own table. A foreign key is a column (or set of columns) whose values point to a primary/unique key in another table — that\'s exactly what powers JOINs.',
    hints: [
      'One of them identifies rows in its own table; the other points to a row in a different table.',
      'Think about how JOIN ... ON works — it connects a foreign key to the primary key it references.',
      'The correct answer is: a primary key uniquely identifies rows in its own table; a foreign key references a key in another table.',
    ],
    xp: 40,
    tool: { name: 'Primary key vs. foreign key', icon: '🔑', description: 'One identifies rows locally; the other links to another table.', fun: 2 },
  },
  {
    id: 'sql-bonus-19-mcq-oltp-olap',
    kind: 'mcq',
    npc: 'Merchant Lani',
    title: 'Two Kinds of Workload',
    prompt: "What's the main difference between OLTP and OLAP database systems?",
    options: [
      'OLTP handles many small, fast transactions like individual orders; OLAP handles large analytical queries over historical data, like reporting',
      'OLTP only works with NoSQL databases, and OLAP only works with SQL databases',
      'They\'re two different names for exactly the same kind of workload',
      'OLAP is always faster than OLTP, for every kind of query',
    ],
    correctIndex: 0,
    explanation: 'OLTP (Online Transaction Processing) is optimized for lots of small, fast reads/writes — think placing an order. OLAP (Online Analytical Processing) is optimized for large, complex queries scanning lots of historical data — think a quarterly sales report.',
    hints: [
      'One is about processing individual transactions quickly; the other is about analyzing large amounts of historical data.',
      'Think: placing a single order (fast, small) vs. a quarterly sales report (scans everything).',
      'The correct answer is: OLTP handles many small fast transactions; OLAP handles large analytical/reporting queries.',
    ],
    xp: 45,
    tool: { name: 'OLTP vs. OLAP', icon: '📈', description: 'Transactional workloads vs. analytical/reporting workloads.', fun: 3 },
  },
  {
    id: 'sql-bonus-20-mcq-normalization',
    kind: 'mcq',
    npc: 'Merchant Lani',
    title: 'Why Normalize?',
    prompt: 'What is the main goal of database normalization?',
    options: [
      'Making every query run faster, no matter what it does',
      'Reducing data redundancy and preventing update anomalies by organizing columns and tables around their real dependencies',
      'Making sure every table has exactly one column',
      'Converting a SQL database into a NoSQL database',
    ],
    correctIndex: 1,
    explanation: 'Normalization organizes data so each fact is stored in exactly one place, based on real dependencies between columns — this avoids the update/insert/delete anomalies that come from duplicating data across rows.',
    hints: [
      'It\'s about avoiding the same fact being duplicated (and going out of sync) across many rows.',
      'It\'s about structuring tables around real dependencies between columns, not about raw speed.',
      'The correct answer is: reducing redundancy and preventing update anomalies by organizing around real dependencies.',
    ],
    xp: 40,
    tool: { name: 'Normalization', icon: '🧹', description: 'Organizing tables to reduce redundancy and avoid update anomalies.', fun: 2 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'sql-bonus-21-match-engines',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Four Database Engines',
    prompt: 'Match each database engine to what makes it distinctive.',
    pairs: [
      { id: 'a', left: 'Snowflake', right: 'Cloud data warehouse that bills storage and compute separately' },
      { id: 'b', left: 'Oracle Database', right: 'Enterprise RDBMS built around the PL/SQL procedural language' },
      { id: 'c', left: 'PostgreSQL', right: 'Open-source, object-relational database known for its extensibility' },
      { id: 'd', left: 'SQLite', right: 'Serverless, single-file embedded database — what this game runs on' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two of these are cloud-first platforms, one is a decades-old enterprise standard, and one is the tiny engine powering this very game.',
      'The one billed by separate storage/compute is Snowflake; the one with PL/SQL is Oracle.',
      'Snowflake → separate storage/compute billing. Oracle → PL/SQL. PostgreSQL → extensibility. SQLite → single-file, serverless (this game).',
    ],
    xp: 50,
    successMessage: 'Four very different engines, four very different philosophies.',
    tool: { name: 'Database engines', icon: '🗄️', description: 'What sets Snowflake, Oracle, PostgreSQL, and SQLite apart.', fun: 3 },
  },
  {
    id: 'sql-bonus-22-match-joins',
    kind: 'matching',
    npc: 'Fisherman Koa',
    title: 'Every Kind of JOIN',
    prompt: 'Match each JOIN type to its behavior.',
    pairs: [
      { id: 'a', left: 'INNER JOIN', right: 'Returns only rows that match in both tables' },
      { id: 'b', left: 'LEFT JOIN', right: 'Returns every row from the left table, matched or not' },
      { id: 'c', left: 'RIGHT JOIN', right: 'Returns every row from the right table, matched or not' },
      { id: 'd', left: 'FULL OUTER JOIN', right: 'Returns every row from both tables, matched or not' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'Three of these keep unmatched rows from one or both sides; only one drops unmatched rows entirely.',
      'LEFT keeps the left table\'s rows; RIGHT keeps the right table\'s rows; FULL keeps both.',
      'INNER → matches only. LEFT → keeps all left. RIGHT → keeps all right. FULL OUTER → keeps all from both.',
    ],
    xp: 55,
    successMessage: 'Every flavor of JOIN, sorted out for good.',
    tool: { name: 'JOIN types', icon: '🔀', description: 'INNER, LEFT, RIGHT, and FULL OUTER — what each one keeps.', fun: 3 },
  },
  {
    id: 'sql-bonus-23-match-indexes',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Kinds of Index',
    prompt: 'Match each index type to its description.',
    pairs: [
      { id: 'a', left: 'B-tree index', right: 'General-purpose sorted structure — the default index type in most databases' },
      { id: 'b', left: 'Unique index', right: 'Guarantees no two rows share the same value in the indexed column(s)' },
      { id: 'c', left: 'Composite index', right: 'Built across two or more columns together, not just one' },
      { id: 'd', left: 'Full-text index', right: 'Optimized for searching for words inside large blocks of text' },
    ],
    rightOrder: ['c', 'd', 'a', 'b'],
    hints: [
      'One of these is the everyday default; another enforces a constraint; another spans multiple columns; another is built for searching prose.',
      'Composite = multiple columns. Unique = no duplicates allowed. Full-text = searching inside long text.',
      'B-tree → general-purpose default. Unique → no duplicate values. Composite → spans multiple columns. Full-text → searches inside text blocks.',
    ],
    xp: 55,
    successMessage: 'Every index has its job — speed, uniqueness, or search.',
    tool: { name: 'Index types', icon: '📇', description: 'B-tree, unique, composite, and full-text indexes compared.', fun: 3 },
  },
  {
    id: 'sql-bonus-24-match-isolation',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Transaction Isolation Levels',
    prompt: 'Match each transaction isolation level to its definition.',
    pairs: [
      { id: 'a', left: 'Read Uncommitted', right: 'Can see other transactions\' uncommitted changes — dirty reads allowed' },
      { id: 'b', left: 'Read Committed', right: 'Only ever sees data that has already been committed by others' },
      { id: 'c', left: 'Repeatable Read', right: 'The same row returns the same values if read twice in one transaction' },
      { id: 'd', left: 'Serializable', right: 'The strictest level — transactions behave as if run one at a time, in sequence' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'These four run from loosest to strictest: dirty reads allowed, committed-only, repeatable rows, and fully serial-looking.',
      'Serializable is the strictest and safest; Read Uncommitted is the loosest and riskiest.',
      'Read Uncommitted → dirty reads OK. Read Committed → committed data only. Repeatable Read → stable re-reads. Serializable → fully sequential-looking.',
    ],
    xp: 65,
    successMessage: 'From loosest to strictest — the full spectrum of isolation.',
    tool: { name: 'Isolation levels', icon: '🚧', description: 'Read Uncommitted through Serializable — how much concurrency you allow.', fun: 4 },
  },
  {
    id: 'sql-bonus-25-match-normalforms',
    kind: 'matching',
    npc: 'Elder Mana',
    title: 'The Normal Forms',
    prompt: 'Match each normal form to its requirement.',
    pairs: [
      { id: 'a', left: '1NF', right: 'Every column holds a single atomic value — no repeating groups or lists in one cell' },
      { id: 'b', left: '2NF', right: '1NF, plus every non-key column depends on the whole primary key, not just part of it' },
      { id: 'c', left: '3NF', right: '2NF, plus no non-key column depends on another non-key column' },
      { id: 'd', left: 'BCNF', right: 'A stricter 3NF that also fixes anomalies from overlapping candidate keys' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Each form builds on the one before it — 1NF is about atomic values, and each step after tightens what a column is allowed to depend on.',
      '2NF is about depending on the *whole* key; 3NF is about not depending on *other non-key columns*.',
      '1NF → atomic values only. 2NF → depends on whole key. 3NF → no non-key-to-non-key dependencies. BCNF → fixes overlapping-key edge cases.',
    ],
    xp: 70,
    successMessage: 'From atomic values all the way to BCNF — the whole ladder.',
    tool: { name: 'Normal forms', icon: '🧱', description: '1NF through BCNF — each one building on the last.', fun: 4 },
  },
  {
    id: 'sql-bonus-26-match-snowflake',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Snowflake Vocabulary',
    prompt: 'Match each Snowflake-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'Virtual Warehouse', right: 'The compute cluster you resize or pause to run queries' },
      { id: 'b', left: 'Micro-partition', right: 'Automatic, immutable chunk of columnar storage Snowflake manages for you' },
      { id: 'c', left: 'Time Travel', right: 'Query a table\'s data exactly as it existed at a past point in time' },
      { id: 'd', left: 'Zero-copy Cloning', right: 'Instantly duplicate a table, schema, or database without copying the underlying data' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'One is about compute, one is about storage internals, one is about querying the past, and one is about instant duplication.',
      'Time Travel looks backward in time; Zero-copy Cloning duplicates instantly without copying bytes.',
      'Virtual Warehouse → compute cluster. Micro-partition → auto storage chunk. Time Travel → query past state. Zero-copy Cloning → instant duplicate.',
    ],
    xp: 65,
    successMessage: 'Snowflake\'s core vocabulary, all matched up.',
    tool: { name: 'Snowflake vocabulary', icon: '❄️', description: 'Virtual Warehouse, micro-partitions, Time Travel, zero-copy cloning.', fun: 4 },
  },
  {
    id: 'sql-bonus-27-match-oracle',
    kind: 'matching',
    npc: 'Elder Mana',
    title: 'Oracle Vocabulary',
    prompt: 'Match each Oracle-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'Tablespace', right: 'A logical storage container grouping the physical files that hold a database\'s data' },
      { id: 'b', left: 'PL/SQL', right: "Oracle's procedural extension to SQL, adding loops and variables" },
      { id: 'c', left: 'Sequence', right: 'A database object that generates a series of unique numbers, often for keys' },
      { id: 'd', left: 'Synonym', right: 'An alias letting you refer to another database object under a different name' },
    ],
    rightOrder: ['c', 'd', 'a', 'b'],
    hints: [
      'One is a storage container, one is a procedural language, one generates unique numbers, and one is just an alias.',
      'Sequence generates numbers; Synonym is purely a naming alias for something else.',
      'Tablespace → storage container. PL/SQL → procedural extension. Sequence → generates unique numbers. Synonym → alias for another object.',
    ],
    xp: 65,
    successMessage: 'Oracle\'s core vocabulary, all matched up.',
    tool: { name: 'Oracle vocabulary', icon: '🏛️', description: 'Tablespace, PL/SQL, sequences, and synonyms.', fun: 4 },
  },
  {
    id: 'sql-bonus-28-match-postgres',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'PostgreSQL Vocabulary',
    prompt: 'Match each PostgreSQL-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'MVCC', right: 'Readers see a consistent snapshot of data without ever blocking writers' },
      { id: 'b', left: 'Extension', right: 'An installable package adding new types, functions, or features (e.g. PostGIS)' },
      { id: 'c', left: 'JSONB', right: 'A binary, indexable storage format for JSON data' },
      { id: 'd', left: 'VACUUM', right: 'Reclaims storage left behind by updated or deleted rows under MVCC' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'One is the concurrency model itself, one cleans up after it, one is an installable add-on, and one is a JSON storage format.',
      'VACUUM specifically cleans up the leftover row versions that MVCC creates.',
      'MVCC → snapshot isolation without blocking. Extension → installable add-on package. JSONB → binary JSON format. VACUUM → reclaims MVCC leftovers.',
    ],
    xp: 65,
    successMessage: 'PostgreSQL\'s core vocabulary, all matched up.',
    tool: { name: 'PostgreSQL vocabulary', icon: '🐘', description: 'MVCC, extensions, JSONB, and VACUUM.', fun: 4 },
  },
  {
    id: 'sql-bonus-29-match-constraints',
    kind: 'matching',
    npc: 'Fisherman Koa',
    title: 'Constraint Types',
    prompt: 'Match each constraint type to its purpose.',
    pairs: [
      { id: 'a', left: 'PRIMARY KEY', right: 'Uniquely identifies each row in a table' },
      { id: 'b', left: 'FOREIGN KEY', right: 'Links a column to a primary or unique key in another table' },
      { id: 'c', left: 'UNIQUE', right: 'Ensures no two rows share the same value in a column, without making it the primary key' },
      { id: 'd', left: 'CHECK', right: 'Rejects any row that fails a custom boolean condition' },
    ],
    rightOrder: ['d', 'b', 'a', 'c'],
    hints: [
      'One identifies rows, one links tables together, one bans duplicates outside the primary key, and one enforces a custom rule.',
      'CHECK is the general-purpose one — any boolean expression you write yourself.',
      'PRIMARY KEY → identifies rows. FOREIGN KEY → links to another table. UNIQUE → no duplicate values. CHECK → custom boolean rule.',
    ],
    xp: 60,
    successMessage: 'Every constraint type, matched to its job.',
    tool: { name: 'Constraint types', icon: '🛡️', description: 'PRIMARY KEY, FOREIGN KEY, UNIQUE, and CHECK compared.', fun: 3 },
  },
  {
    id: 'sql-bonus-30-match-functioncategories',
    kind: 'matching',
    npc: 'Merchant Lani',
    title: 'Function Categories',
    prompt: 'Match each SQL function category to an example of what it does.',
    pairs: [
      { id: 'a', left: 'String function', right: "e.g. UPPER(), LENGTH(), || — operate on text" },
      { id: 'b', left: 'Date function', right: "e.g. strftime() — operate on dates and times" },
      { id: 'c', left: 'Aggregate function', right: "e.g. SUM(), AVG(), COUNT() — collapse many rows into one value" },
      { id: 'd', left: 'Window function', right: "e.g. RANK() OVER (...) — per-row values across related rows, without collapsing them" },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two of these work on individual values (text, dates); the other two work across many rows — one collapses them, one doesn\'t.',
      'Aggregate functions collapse rows into one value; window functions keep every row but still compute across the group.',
      'String → UPPER/LENGTH/||. Date → strftime. Aggregate → SUM/AVG/COUNT (collapses rows). Window → RANK() OVER (keeps every row).',
    ],
    xp: 60,
    successMessage: 'Four categories, covering almost everything you\'ll ever need a function for.',
    tool: { name: 'Function categories', icon: '🧰', description: 'String, date, aggregate, and window functions compared.', fun: 3 },
  },

  // ==================== second wave (sql-bonus-31..60) ====================
  // Same three-way split, deliberately covering NEW ground — no repeats of
  // the topics above. Live-SQL half stays read-only against the untouched
  // base schema for the same reason as before (position/mutation-order
  // independence). MCQ/matching half moves into data-warehouse modeling,
  // replication/sharding, backup/recovery, query performance, and deeper
  // Snowflake/Oracle/Postgres vocabulary.

  // ---------- live SQL (read-only, mutation-order independent) ----------
  {
    id: 'sql-bonus-31-self-join',
    npc: 'Fisherman Koa',
    title: 'Villagers Who Share a Home',
    prompt: 'Find every unique pair of inhabitants who live in the same village — each pair listed once, not twice.',
    starter: 'SELECT i1.name, i2.name\nFROM inhabitant i1 JOIN inhabitant i2 ON i1.villageid = i2.villageid AND \n;',
    hints: [
      'A self-join joins a table to itself — give the two copies different aliases.',
      'Matching on villageid alone would pair everyone with themselves too, and pair everyone twice (A-B and B-A). personid < personid fixes both.',
      'SELECT i1.name, i2.name FROM inhabitant i1 JOIN inhabitant i2 ON i1.villageid = i2.villageid AND i1.personid < i2.personid;',
    ],
    xp: 70,
    tool: { name: 'Self-join', icon: '👯', description: 'Join a table to itself to compare rows against each other.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT i1.name, i2.name FROM inhabitant i1 JOIN inhabitant i2 ON i1.villageid = i2.villageid AND i1.personid < i2.personid')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That\'s not quite every unique same-village pair. Check your self-join condition — you need both the village match and personid <.' }
      }
      return { success: true, message: 'Every neighbor pairing on the island, with no one doubled up or paired with themselves.' }
    },
  },
  {
    id: 'sql-bonus-32-conditional-count',
    npc: 'Merchant Lani',
    title: 'How Many Chiefs, Exactly?',
    prompt: 'For each village, show its name, its total inhabitant count, and — in the same row — how many of them are specifically the chief.',
    starter: 'SELECT v.name, COUNT(*), \nFROM village v JOIN inhabitant i ON i.villageid = v.villageid\nGROUP BY v.name;',
    hints: [
      'You can put a CASE expression inside an aggregate — COUNT only counts rows where the CASE returns non-NULL.',
      'COUNT(CASE WHEN i.job = \'chief\' THEN 1 END) counts only the chief rows, without a separate query.',
      "SELECT v.name, COUNT(*), COUNT(CASE WHEN i.job = 'chief' THEN 1 END) FROM village v JOIN inhabitant i ON i.villageid = v.villageid GROUP BY v.name;",
    ],
    xp: 75,
    tool: { name: 'Conditional aggregation', icon: '🧮', description: 'COUNT(CASE WHEN ... THEN 1 END) — count only rows matching a condition, inline.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT v.name, COUNT(*), COUNT(CASE WHEN i.job = 'chief' THEN 1 END) FROM village v JOIN inhabitant i ON i.villageid = v.villageid GROUP BY v.name")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The totals or the chief counts don\'t match. Try COUNT(CASE WHEN job = \'chief\' THEN 1 END).' }
      }
      return { success: true, message: 'One chief per village, right there in the same row as the headcount.' }
    },
  },
  {
    id: 'sql-bonus-33-substr',
    npc: 'Elder Mana',
    title: 'Just the First Letters',
    prompt: "Show every inhabitant's full name alongside just the first 3 letters of it.",
    starter: 'SELECT name,  FROM inhabitant;',
    hints: [
      'SUBSTR(text, start, length) pulls out a piece of a string.',
      'Start at position 1, take 3 characters.',
      'SELECT name, SUBSTR(name, 1, 3) FROM inhabitant;',
    ],
    xp: 45,
    tool: { name: 'SUBSTR', icon: '✂️', description: 'Pull out part of a text value by start position and length.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name, SUBSTR(name, 1, 3) FROM inhabitant')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Those first-3-letter snippets don\'t match. SUBSTR(name, 1, 3).' }
      }
      return { success: true, message: 'Fifteen names, trimmed down to their first three letters.' }
    },
  },
  {
    id: 'sql-bonus-34-instr',
    npc: 'Fisherman Koa',
    title: 'Hidden in a Cave',
    prompt: "Find every item whose found_location contains the word 'Cave' anywhere in it.",
    starter: 'SELECT * FROM item WHERE  > 0;',
    hints: [
      'INSTR(text, needle) returns the 1-based position where needle first appears, or 0 if it\'s not found at all.',
      'A value greater than 0 means the word was found somewhere in the text.',
      "SELECT * FROM item WHERE INSTR(found_location, 'Cave') > 0;",
    ],
    xp: 55,
    tool: { name: 'INSTR', icon: '🔦', description: 'Find the position of one string inside another — 0 means not found.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT * FROM item WHERE INSTR(found_location, 'Cave') > 0")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That doesn\'t match. Use INSTR(found_location, \'Cave\') > 0.' }
      }
      return { success: true, message: 'Only the Iron Sword was hiding in a cave.' }
    },
  },
  {
    id: 'sql-bonus-35-nullif',
    npc: 'Oracle Hina',
    title: 'Blank Out the Neutral Ones',
    prompt: "Show every inhabitant's name and their state — but wherever the state is exactly 'neutral', show blank (NULL) instead.",
    starter: 'SELECT name,  FROM inhabitant;',
    hints: [
      'NULLIF(a, b) returns NULL if a equals b, otherwise it just returns a unchanged.',
      'Wrap the state column: NULLIF(state, \'neutral\').',
      "SELECT name, NULLIF(state, 'neutral') FROM inhabitant;",
    ],
    xp: 60,
    tool: { name: 'NULLIF', icon: '🚫', description: 'Turn one specific value into NULL, leave everything else untouched.', fun: 4 },
    check({ db, result }) {
      const expected = queryRows(db, "SELECT name, NULLIF(state, 'neutral') FROM inhabitant")
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'The neutral entries should read blank, everything else unchanged. Try NULLIF(state, \'neutral\').' }
      }
      return { success: true, message: 'Maui and Kimo\'s "neutral" label is gone — everyone else\'s state is untouched.' }
    },
  },
  {
    id: 'sql-bonus-36-abs',
    npc: 'Merchant Lani',
    title: 'Distance From 200 Gold',
    prompt: 'For every trade, show its price and how far that price is from 200 gold — always as a positive number, whether it\'s above or below.',
    starter: 'SELECT tradeid, price,  FROM trade;',
    hints: [
      'ABS(number) strips the sign, turning a negative into a positive.',
      'You want the absolute value of price minus 200.',
      'SELECT tradeid, price, ABS(price - 200) FROM trade;',
    ],
    xp: 50,
    tool: { name: 'ABS', icon: '📶', description: 'Strip the sign off a number — always returns a non-negative value.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT tradeid, price, ABS(price - 200) FROM trade')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'Those distances don\'t match. Use ABS(price - 200).' }
      }
      return { success: true, message: 'Every trade\'s distance from 200 gold, always shown as a positive number.' }
    },
  },
  {
    id: 'sql-bonus-37-union-all',
    npc: 'Merchant Lani',
    title: 'Everyone Who Traded',
    prompt: 'List every seller id and every buyer id from all trades, combined into one column — keeping duplicates, since a busy trader should show up more than once.',
    starter: 'SELECT seller_id FROM trade\n\nSELECT buyer_id FROM trade;',
    hints: [
      'UNION removes duplicates; UNION ALL keeps every row from both sides, including repeats.',
      'Since you want duplicates kept this time, it\'s ALL, not plain UNION.',
      'SELECT seller_id FROM trade UNION ALL SELECT buyer_id FROM trade;',
    ],
    xp: 60,
    tool: { name: 'UNION ALL', icon: '📚', description: 'Stack two SELECTs together, keeping every duplicate row.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT seller_id FROM trade UNION ALL SELECT buyer_id FROM trade')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That list should have 16 rows (8 sellers + 8 buyers), duplicates included. Use UNION ALL, not UNION.' }
      }
      return { success: true, message: 'Sixteen entries — some people show up more than once, which is exactly the point.' }
    },
  },
  {
    id: 'sql-bonus-38-cross-join',
    npc: 'Elder Mana',
    title: 'Every Possible Pairing',
    prompt: 'If every village could theoretically take on every quest, how many total village-quest combinations would that be?',
    starter: 'SELECT COUNT(*) FROM village  quest;',
    hints: [
      'CROSS JOIN pairs every row of one table with every row of another — no ON condition needed.',
      'With 4 villages and 6 quests, think about what that multiplies out to.',
      'SELECT COUNT(*) FROM village CROSS JOIN quest;',
    ],
    xp: 55,
    tool: { name: 'CROSS JOIN', icon: '✖️', description: 'Pair every row of one table with every row of another.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT COUNT(*) FROM village CROSS JOIN quest')
      const got = firstRows(result)
      if (!sameRows(got, expected)) {
        return { success: false, message: 'That count is off. CROSS JOIN village with quest, with no ON condition.' }
      }
      return { success: true, message: '4 villages times 6 quests — every possible pairing, accounted for.' }
    },
  },
  {
    id: 'sql-bonus-39-order-by-expression',
    npc: 'Oracle Hina',
    title: 'Longest Names First',
    prompt: 'Show every inhabitant\'s name and its length, longest name first.',
    starter: 'SELECT name, LENGTH(name) FROM inhabitant ;',
    hints: [
      'You can ORDER BY an expression, not just a plain column name.',
      'ORDER BY LENGTH(name), and you want longest first.',
      'SELECT name, LENGTH(name) FROM inhabitant ORDER BY LENGTH(name) DESC;',
    ],
    xp: 50,
    tool: { name: 'ORDER BY expression', icon: '📐', description: 'Sort by the result of a computed expression, not just a raw column.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name, LENGTH(name) FROM inhabitant ORDER BY LENGTH(name) DESC')
      const got = firstRows(result)
      if (!sameRows(got, expected, { ordered: true })) {
        return { success: false, message: 'That order looks off. ORDER BY LENGTH(name) DESC.' }
      }
      return { success: true, message: 'Leilani tops the list at seven letters — the island\'s longest name.' }
    },
  },
  {
    id: 'sql-bonus-40-multi-column-order',
    npc: 'Merchant Lani',
    title: 'Sorted Two Ways',
    prompt: 'Show every inhabitant\'s name, job, and gold — grouped by job alphabetically, and within each job, richest first.',
    starter: 'SELECT name, job, gold FROM inhabitant ;',
    hints: [
      'ORDER BY can take more than one column, separated by commas — the first one decides the main order, the second breaks ties within it.',
      'Job ascending (the default, no DESC needed) comes first, then gold descending.',
      'SELECT name, job, gold FROM inhabitant ORDER BY job ASC, gold DESC;',
    ],
    xp: 55,
    tool: { name: 'Multi-column ORDER BY', icon: '🧭', description: 'Sort by more than one column — later columns break ties in earlier ones.', fun: 3 },
    check({ db, result }) {
      const expected = queryRows(db, 'SELECT name, job, gold FROM inhabitant ORDER BY job ASC, gold DESC')
      const got = firstRows(result)
      if (!sameRows(got, expected, { ordered: true })) {
        return { success: false, message: 'That ordering is off. Job ascending first, then gold descending within each job.' }
      }
      return { success: true, message: 'Every job grouped together, richest-to-poorest within each one.' }
    },
  },

  // ---------- MCQ: platform & theory concepts (no execution engine) ----------
  {
    id: 'sql-bonus-41-mcq-datasharing',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: Snowflake III',
    prompt: "What does Snowflake's Secure Data Sharing feature actually do?",
    options: [
      'Encrypts a table so only the owner can ever read it again',
      'Lets you share live data with another Snowflake account without copying or moving the underlying data',
      'Automatically emails a CSV export of a table to a coworker',
      'Splits a table across multiple regions for faster access',
    ],
    correctIndex: 1,
    explanation: 'Secure Data Sharing gives another Snowflake account a live, read-only view onto your data — no copying, no ETL job, no stale export. The consumer always sees current data.',
    hints: [
      'The key word is "sharing" — think about giving someone else access, not encrypting or exporting.',
      'Nothing is copied or moved — the other account queries the same underlying data directly.',
      'The correct answer is: share live data with another account without copying or moving it.',
    ],
    xp: 40,
    tool: { name: 'Snowflake: Secure Data Sharing', icon: '🤝', description: 'Share live data with another account without copying it.', fun: 3 },
  },
  {
    id: 'sql-bonus-42-mcq-streamstasks',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: Snowflake IV',
    prompt: 'In Snowflake, what is the relationship between a Stream and a Task?',
    options: [
      'A Stream tracks row-level changes to a table; a Task runs a scheduled SQL statement, often triggered by a Stream having new data',
      'A Stream is a music playlist feature; a Task is unrelated to either',
      'A Task tracks row-level changes; a Stream runs scheduled SQL',
      'They are two names for the exact same feature',
    ],
    correctIndex: 0,
    explanation: 'A Stream records inserts/updates/deletes made to a table since it was last consumed. A Task runs SQL on a schedule — commonly chained to fire only when its Stream has pending changes, giving you a lightweight change-data-capture pipeline.',
    hints: [
      'One of them watches for changes; the other one runs on a schedule.',
      'They\'re often chained together — the scheduled one checks whether the change-tracking one has anything new.',
      'The correct answer is: a Stream tracks row-level changes; a Task runs scheduled SQL, often triggered by the Stream.',
    ],
    xp: 45,
    tool: { name: 'Snowflake: Streams & Tasks', icon: '🔄', description: 'Change tracking (Stream) plus scheduled SQL (Task) for simple pipelines.', fun: 3 },
  },
  {
    id: 'sql-bonus-43-mcq-rac',
    kind: 'mcq',
    npc: 'Elder Mana',
    title: 'Beyond This Island: Oracle III',
    prompt: 'What does Oracle RAC (Real Application Clusters) provide?',
    options: [
      'A single server with a faster CPU for running Oracle',
      'Multiple server instances sharing access to one single database, for high availability and scalability',
      'A GUI tool for designing ER diagrams',
      'A built-in backup scheduler',
    ],
    correctIndex: 1,
    explanation: 'RAC lets multiple Oracle instances, usually on different physical servers, all connect to and serve the same shared database — if one instance goes down, the others keep serving, and load spreads across all of them.',
    hints: [
      'The "C" stands for Clusters — think multiple machines, not one faster machine.',
      'They all share access to the SAME database, not separate copies of it.',
      'The correct answer is: multiple server instances sharing one database for high availability and scalability.',
    ],
    xp: 45,
    tool: { name: 'Oracle: RAC', icon: '🖧', description: 'Multiple instances sharing one database for high availability.', fun: 3 },
  },
  {
    id: 'sql-bonus-44-mcq-materializedview',
    kind: 'mcq',
    npc: 'Elder Mana',
    title: 'Beyond This Island: Oracle IV',
    prompt: "What's the key difference between a materialized view and a regular view?",
    options: [
      'A materialized view physically stores its query result and refreshes on a schedule; a regular view re-runs its query every single time it\'s selected from',
      'A materialized view can only ever hold one row',
      'A regular view is faster because it\'s precomputed',
      'They are identical in every database engine',
    ],
    correctIndex: 0,
    explanation: 'A regular VIEW is just a saved query — every SELECT against it re-executes the underlying SQL. A MATERIALIZED VIEW actually stores the result set on disk and refreshes it periodically (or on demand), trading some staleness for much faster reads.',
    hints: [
      'One of them recomputes every time you query it; the other saves the answer and refreshes it later.',
      'Think "precomputed and cached" versus "recalculated live".',
      'The correct answer is: a materialized view physically stores and refreshes its result; a regular view re-runs its query every time.',
    ],
    xp: 45,
    tool: { name: 'Materialized view vs. view', icon: '🗃️', description: 'Stored, periodically-refreshed results vs. a live, re-run query.', fun: 3 },
  },
  {
    id: 'sql-bonus-45-mcq-partitioning',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: PostgreSQL III',
    prompt: 'What does PostgreSQL\'s declarative table partitioning let you do?',
    options: [
      'Split one logical table into smaller physical pieces (by range, list, or hash), while still querying it as a single table',
      'Automatically translate SQL into a different language',
      'Merge two unrelated tables into one without a JOIN',
      'Prevent any table from ever being deleted',
    ],
    correctIndex: 0,
    explanation: 'Declarative partitioning splits a large table into smaller physical partitions — by a range of values, a list of values, or a hash — while queries against the parent table still see one logical table, with Postgres routing rows to the right partition automatically.',
    hints: [
      'Think about a huge table being split into smaller physical pieces, but still queryable as one thing.',
      'It can split by a range of values, a list of values, or a hash — three different strategies.',
      'The correct answer is: splitting one logical table into smaller physical pieces, still queryable as a single table.',
    ],
    xp: 50,
    tool: { name: 'PostgreSQL: Table partitioning', icon: '🧱', description: 'Split one logical table into range/list/hash partitions.', fun: 4 },
  },
  {
    id: 'sql-bonus-46-mcq-rls',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'Beyond This Island: PostgreSQL IV',
    prompt: 'What does PostgreSQL Row-Level Security (RLS) do?',
    options: [
      'Encrypts every row individually with its own key',
      'Defines policies that restrict which rows a given user or role can see or modify, enforced by the database itself',
      'Locks an entire table so nobody can query it',
      'Automatically deletes rows older than a set age',
    ],
    correctIndex: 1,
    explanation: 'RLS lets you attach policies to a table so the database itself filters which rows a given role can see or change — e.g. a "tenant_id = current_user" policy — rather than relying on every application query to remember to filter correctly.',
    hints: [
      'It\'s about restricting visibility per ROW, not encrypting or locking the whole table.',
      'The database enforces this itself — the application doesn\'t have to remember to filter.',
      'The correct answer is: policies restricting which rows a role can see or modify, enforced by the database.',
    ],
    xp: 50,
    tool: { name: 'PostgreSQL: Row-Level Security', icon: '🛂', description: 'Policies restricting which rows a role can see or modify.', fun: 4 },
  },
  {
    id: 'sql-bonus-47-mcq-shardingreplication',
    kind: 'mcq',
    npc: 'Fisherman Koa',
    title: 'Splitting Up vs. Copying',
    prompt: "What's the core difference between sharding and replication?",
    options: [
      'Sharding splits DIFFERENT data across multiple servers; replication copies the SAME data across multiple servers',
      'They are two names for the exact same technique',
      'Sharding only works with NoSQL databases; replication only works with SQL databases',
      'Replication always makes a database slower, and sharding always makes it faster',
    ],
    correctIndex: 0,
    explanation: 'Sharding distributes different rows across different servers, so each shard holds only part of the data (scaling writes/storage). Replication copies the full same data set across multiple servers (scaling reads and improving availability).',
    hints: [
      'One splits data up so each server has a different piece; the other copies the whole thing everywhere.',
      'Sharding is about scale (spreading data out); replication is about redundancy (copying it).',
      'The correct answer is: sharding splits different data across servers; replication copies the same data across servers.',
    ],
    xp: 45,
    tool: { name: 'Sharding vs. replication', icon: '🪓', description: 'Splitting data apart vs. copying it everywhere.', fun: 3 },
  },
  {
    id: 'sql-bonus-48-mcq-starsnowflakeschema',
    kind: 'mcq',
    npc: 'Merchant Lani',
    title: 'A Different Kind of "Snowflake"',
    prompt: 'In data warehouse modeling — this is a modeling pattern name, unrelated to the Snowflake company — what distinguishes a "snowflake schema" from a "star schema"?',
    options: [
      'In a star schema, dimension tables are flat/denormalized; in a snowflake schema, dimension tables are further normalized into sub-dimension tables',
      'A snowflake schema can only be built inside the Snowflake cloud platform',
      'A star schema has no fact table at all',
      'They describe the exact same table layout, just different names',
    ],
    correctIndex: 0,
    explanation: 'Both patterns center a fact table surrounded by dimension tables. A star schema keeps dimensions flat (denormalized) for simpler, faster joins. A snowflake schema normalizes those dimensions further into sub-dimensions, trading some query simplicity for less data redundancy. The name is a coincidence — this predates the Snowflake company by decades.',
    hints: [
      'Both have a fact table in the middle surrounded by dimension tables — the difference is how normalized those dimension tables are.',
      'One keeps dimensions flat and simple; the other splits them into further sub-tables.',
      'The correct answer is: star schema keeps dimensions flat/denormalized; snowflake schema normalizes them into sub-dimension tables.',
    ],
    xp: 50,
    tool: { name: 'Star schema vs. snowflake schema', icon: '⭐', description: 'Data-warehouse modeling patterns — a naming coincidence with the Snowflake company.', fun: 4 },
  },
  {
    id: 'sql-bonus-49-mcq-captheorem',
    kind: 'mcq',
    npc: 'Oracle Hina',
    title: 'The CAP Theorem',
    prompt: "What does the CAP theorem say about distributed data stores?",
    options: [
      'A distributed data store can only fully guarantee two of three: Consistency, Availability, and Partition tolerance, at the same time',
      'A distributed data store can always guarantee all three: Consistency, Availability, and Partition tolerance',
      'CAP stands for Cache, Access, Performance',
      'CAP theorem only applies to single-server databases',
    ],
    correctIndex: 0,
    explanation: 'CAP (Brewer\'s theorem) says that when a network partition happens, a distributed system must choose between staying fully Consistent or staying fully Available — you can\'t have perfect versions of all three guarantees at once under a partition.',
    hints: [
      'The theorem is specifically about what happens when the network splits (a partition happens).',
      'It\'s a trade-off, not a guarantee of everything at once — you can only pick two.',
      'The correct answer is: only two of Consistency, Availability, and Partition tolerance can be fully guaranteed at once.',
    ],
    xp: 50,
    tool: { name: 'CAP theorem', icon: '⚖️', description: 'Consistency, Availability, Partition tolerance — pick two.', fun: 4 },
  },
  {
    id: 'sql-bonus-50-mcq-idempotency',
    kind: 'mcq',
    npc: 'Fisherman Koa',
    title: 'Safe to Retry?',
    prompt: 'What does it mean for a database operation to be "idempotent"?',
    options: [
      'It runs twice as fast as a normal operation',
      'Applying it once, or retrying it many times, always produces the same end result',
      'It can never be rolled back',
      'It only works inside a transaction',
    ],
    correctIndex: 1,
    explanation: '"Set balance to 100" is idempotent — running it 5 times leaves the same result as running it once. "Add 10 to balance" is NOT idempotent — running it 5 times gives a very different result. Idempotent operations are safe to blindly retry after a failure or timeout; non-idempotent ones aren\'t.',
    hints: [
      'Think about what happens if a network hiccup makes the same request fire twice by accident.',
      'One classic example: "set balance to 100" vs. "add 10 to balance" — only one of those is safe to repeat.',
      'The correct answer is: applying it once or retrying it many times always produces the same end result.',
    ],
    xp: 45,
    tool: { name: 'Idempotency', icon: '🔁', description: 'An operation safe to retry any number of times with the same end result.', fun: 3 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'sql-bonus-51-match-datawarehousing',
    kind: 'matching',
    npc: 'Merchant Lani',
    title: 'Data Warehouse Modeling',
    prompt: 'Match each data-warehouse modeling term to its meaning.',
    pairs: [
      { id: 'a', left: 'Star schema', right: 'A fact table joined directly to flat, denormalized dimension tables' },
      { id: 'b', left: 'Snowflake schema', right: 'A fact table whose dimension tables are further normalized into sub-dimensions' },
      { id: 'c', left: 'Fact table', right: 'Holds measurable numeric events (sales, orders) plus keys to dimensions' },
      { id: 'd', left: 'Dimension table', right: 'Holds descriptive attributes used to filter or group facts (customer, product, date)' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two describe a schema SHAPE (how normalized the dimensions are); two describe a TABLE ROLE (facts vs. dimensions).',
      'Fact tables hold numbers/events; dimension tables hold descriptive labels used to slice those numbers.',
      'Star → flat dimensions. Snowflake schema → normalized sub-dimensions. Fact table → numeric events. Dimension table → descriptive attributes.',
    ],
    xp: 65,
    successMessage: 'The whole star-vs-snowflake modeling picture, matched up.',
    tool: { name: 'Data warehouse modeling', icon: '⭐', description: 'Star schema, snowflake schema, fact tables, and dimension tables.', fun: 4 },
  },
  {
    id: 'sql-bonus-52-match-backup',
    kind: 'matching',
    npc: 'Elder Mana',
    title: 'Backup & Recovery',
    prompt: 'Match each backup/recovery term to its meaning.',
    pairs: [
      { id: 'a', left: 'Full backup', right: 'A complete copy of the entire database at one point in time' },
      { id: 'b', left: 'Incremental backup', right: 'Only the data that changed since the last backup' },
      { id: 'c', left: 'Point-in-time recovery', right: 'Restore a database to its exact state at a specific past moment, not just the last backup' },
      { id: 'd', left: 'RPO (Recovery Point Objective)', right: 'The maximum acceptable amount of data loss, measured in time' },
    ],
    rightOrder: ['d', 'b', 'a', 'c'],
    hints: [
      'Two describe HOW MUCH is backed up (all of it, vs. just the changes); two describe RECOVERY concepts.',
      'RPO isn\'t a backup TYPE at all — it\'s a target, measured in time, for how much data loss is tolerable.',
      'Full backup → entire database. Incremental → only what changed. Point-in-time recovery → restore to an exact past moment. RPO → max acceptable data loss, in time.',
    ],
    xp: 65,
    successMessage: 'Backups, recovery, and the target that ties them together — all matched.',
    tool: { name: 'Backup & recovery', icon: '💾', description: 'Full/incremental backups, point-in-time recovery, and RPO.', fun: 4 },
  },
  {
    id: 'sql-bonus-53-match-replication',
    kind: 'matching',
    npc: 'Fisherman Koa',
    title: 'Replication Vocabulary',
    prompt: 'Match each replication term to its meaning.',
    pairs: [
      { id: 'a', left: 'Primary / Replica', right: 'The primary accepts writes; replicas copy its data and typically serve reads' },
      { id: 'b', left: 'Synchronous replication', right: 'A write isn\'t confirmed until at least one replica has it too — safer, slower' },
      { id: 'c', left: 'Asynchronous replication', right: 'A write is confirmed immediately; replicas catch up shortly after — faster, riskier' },
      { id: 'd', left: 'Failover', right: 'Automatically promoting a replica to primary when the original primary goes down' },
    ],
    rightOrder: ['d', 'c', 'a', 'b'],
    hints: [
      'Sync vs. async is about WHEN a write counts as "done" relative to the replicas catching up.',
      'Failover is what happens when the primary itself disappears.',
      'Primary/Replica → who accepts writes vs. copies data. Synchronous → confirms only after a replica has it. Asynchronous → confirms immediately, replicas catch up later. Failover → promoting a replica when primary dies.',
    ],
    xp: 65,
    successMessage: 'Every core replication concept, matched up.',
    tool: { name: 'Replication vocabulary', icon: '📡', description: 'Primary/replica, sync vs. async replication, and failover.', fun: 4 },
  },
  {
    id: 'sql-bonus-54-match-sharding',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Sharding & Distribution',
    prompt: 'Match each sharding/distribution term to its meaning.',
    pairs: [
      { id: 'a', left: 'Shard key', right: 'The column(s) used to decide which shard a given row lands on' },
      { id: 'b', left: 'Horizontal partitioning (sharding)', right: 'Splitting a table\'s ROWS across multiple databases or servers' },
      { id: 'c', left: 'Vertical partitioning', right: 'Splitting a table\'s COLUMNS across multiple databases or servers' },
      { id: 'd', left: 'Consistent hashing', right: 'A hashing scheme that minimizes data movement when a shard is added or removed' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Horizontal splits by ROW, vertical splits by COLUMN — easy to mix up, opposite of each other.',
      'The shard key decides WHERE a row goes; consistent hashing is about minimizing reshuffling when the shard count changes.',
      'Shard key → decides which shard a row lands on. Horizontal → splits rows. Vertical → splits columns. Consistent hashing → minimizes movement on rebalance.',
    ],
    xp: 70,
    successMessage: 'Rows split, columns split, and the hashing trick that keeps rebalancing cheap — all matched.',
    tool: { name: 'Sharding & distribution', icon: '🗺️', description: 'Shard keys, horizontal/vertical partitioning, and consistent hashing.', fun: 4 },
  },
  {
    id: 'sql-bonus-55-match-queryperf',
    kind: 'matching',
    npc: 'Merchant Lani',
    title: 'Query Performance Vocabulary',
    prompt: 'Match each query-performance term to its meaning.',
    pairs: [
      { id: 'a', left: 'EXPLAIN', right: 'Shows the query plan the database will use, without actually running the query for its results' },
      { id: 'b', left: 'Query optimizer', right: 'The component that decides the fastest execution plan for a given query' },
      { id: 'c', left: 'Full table scan', right: 'Reading every row in a table because no usable index applies' },
      { id: 'd', left: 'Index seek', right: 'Jumping directly to matching rows using an index, instead of scanning everything' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'One shows you the plan; one decides the plan; two describe how a query actually reads data (all of it, vs. only the matching rows).',
      'A full table scan is usually the SLOW path; an index seek is usually the FAST path.',
      'EXPLAIN → shows the plan. Query optimizer → decides the plan. Full table scan → reads every row. Index seek → jumps directly via an index.',
    ],
    xp: 65,
    successMessage: 'Plans, optimizers, scans, and seeks — every core performance term matched.',
    tool: { name: 'Query performance', icon: '⏱️', description: 'EXPLAIN, the query optimizer, full table scans, and index seeks.', fun: 4 },
  },
  {
    id: 'sql-bonus-56-match-snowflake2',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'More Snowflake Vocabulary',
    prompt: 'Match each Snowflake-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'Stream', right: 'Tracks row-level changes made to a table since it was last consumed' },
      { id: 'b', left: 'Task', right: 'Runs a scheduled SQL statement, often chained to fire when a Stream has new data' },
      { id: 'c', left: 'Data Sharing', right: 'Share live data with another Snowflake account without copying it' },
      { id: 'd', left: 'Resource Monitor', right: 'Caps compute credit usage and can auto-suspend a warehouse that exceeds it' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'Stream and Task are usually paired together; Data Sharing and Resource Monitor are unrelated to each other.',
      'One tracks changes, one runs on a schedule, one shares data outward, one caps spending.',
      'Stream → tracks changes. Task → scheduled SQL. Data Sharing → share live data outward. Resource Monitor → caps compute spend.',
    ],
    xp: 65,
    successMessage: 'A second round of Snowflake vocabulary, fully matched.',
    tool: { name: 'Snowflake vocabulary II', icon: '❄️', description: 'Streams, Tasks, Data Sharing, and Resource Monitors.', fun: 4 },
  },
  {
    id: 'sql-bonus-57-match-oracle2',
    kind: 'matching',
    npc: 'Elder Mana',
    title: 'More Oracle Vocabulary',
    prompt: 'Match each Oracle-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'RAC', right: 'Multiple server instances sharing access to one database for high availability' },
      { id: 'b', left: 'Materialized View', right: 'A query result physically stored and refreshed on a schedule, not recomputed every read' },
      { id: 'c', left: 'Data Guard', right: 'Oracle\'s standby-database replication feature for disaster recovery' },
      { id: 'd', left: 'Flashback', right: 'Query or restore data as it existed at a past point in time, without restoring a full backup' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'RAC is about multiple LIVE instances sharing one database; Data Guard is about a STANDBY copy for disaster recovery — easy to confuse, opposite purposes.',
      'Flashback looks at the past without a full restore; Materialized View stores a precomputed result for speed.',
      'RAC → shared-instance high availability. Materialized View → stored, refreshed query result. Data Guard → standby replication for disaster recovery. Flashback → view/restore past state without a full restore.',
    ],
    xp: 70,
    successMessage: 'A second round of Oracle vocabulary, fully matched.',
    tool: { name: 'Oracle vocabulary II', icon: '🏛️', description: 'RAC, Materialized Views, Data Guard, and Flashback.', fun: 4 },
  },
  {
    id: 'sql-bonus-58-match-postgres2',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'More PostgreSQL Vocabulary',
    prompt: 'Match each PostgreSQL-specific term to its meaning.',
    pairs: [
      { id: 'a', left: 'Table partitioning', right: 'Splitting one logical table into smaller physical pieces by range, list, or hash' },
      { id: 'b', left: 'Row-Level Security', right: 'Policies that restrict which rows a given role can see or modify' },
      { id: 'c', left: 'Foreign Data Wrapper', right: 'Lets Postgres query an external data source as if it were a local table' },
      { id: 'd', left: 'Logical replication', right: 'Replicates data changes at the row level, allowing replication across versions or subsets of tables' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Foreign Data Wrapper reaches OUTSIDE Postgres to another data source; the other three are all about data already inside Postgres.',
      'Table partitioning splits one table into pieces; Row-Level Security restricts visibility per row; Logical replication is row-level change replication.',
      'Table partitioning → split by range/list/hash. Row-Level Security → per-row access policies. Foreign Data Wrapper → query external sources locally. Logical replication → row-level change replication.',
    ],
    xp: 70,
    successMessage: 'A second round of PostgreSQL vocabulary, fully matched.',
    tool: { name: 'PostgreSQL vocabulary II', icon: '🐘', description: 'Table partitioning, Row-Level Security, Foreign Data Wrappers, and logical replication.', fun: 4 },
  },
  {
    id: 'sql-bonus-59-match-nosqltypes',
    kind: 'matching',
    npc: 'Fisherman Koa',
    title: 'NoSQL Database Types',
    prompt: 'Match each NoSQL database type to an example use case.',
    pairs: [
      { id: 'a', left: 'Document store', right: 'Stores flexible, nested JSON-like records — e.g. MongoDB' },
      { id: 'b', left: 'Key-value store', right: 'Stores simple key → value pairs for very fast lookups — e.g. Redis' },
      { id: 'c', left: 'Wide-column store', right: 'Stores rows with dynamic, sparse columns at massive scale — e.g. Cassandra' },
      { id: 'd', left: 'Graph database', right: 'Stores nodes and relationships directly — e.g. Neo4j, for connected data like social networks' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two of these are about flexible/nested or simple key-based data; two are about massive scale or relationships specifically.',
      'Graph databases are built specifically for CONNECTED data — think friend-of-a-friend queries.',
      'Document store → flexible JSON-like records. Key-value store → simple fast lookups. Wide-column store → sparse columns at massive scale. Graph database → nodes and relationships.',
    ],
    xp: 65,
    successMessage: 'Four NoSQL flavors, each matched to what it\'s actually good at.',
    tool: { name: 'NoSQL database types', icon: '🗂️', description: 'Document, key-value, wide-column, and graph databases.', fun: 4 },
  },
  {
    id: 'sql-bonus-60-match-distributedsystems',
    kind: 'matching',
    npc: 'Oracle Hina',
    title: 'Distributed Systems Vocabulary',
    prompt: 'Match each distributed-systems term to its meaning.',
    pairs: [
      { id: 'a', left: 'CAP theorem', right: 'A distributed system can only fully guarantee two of Consistency, Availability, and Partition tolerance at once' },
      { id: 'b', left: 'Eventual consistency', right: 'Replicas may briefly disagree after a write, but will converge to the same value given enough time' },
      { id: 'c', left: 'Sharding', right: 'Splitting data across multiple nodes so each one holds only part of it' },
      { id: 'd', left: 'Consensus (e.g. Raft, Paxos)', right: 'An algorithm letting distributed nodes agree on a single value or leader despite failures' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'CAP is a trade-off theorem; eventual consistency is a specific consistency MODEL; sharding is about splitting data; consensus is about nodes agreeing.',
      'Consensus algorithms are how a cluster picks a single leader or agreed value even when some nodes fail.',
      'CAP theorem → pick two of three guarantees. Eventual consistency → replicas converge over time. Sharding → splitting data across nodes. Consensus → nodes agreeing despite failures.',
    ],
    xp: 70,
    successMessage: 'The core vocabulary behind every distributed database, matched up.',
    tool: { name: 'Distributed systems vocabulary', icon: '🌐', description: 'CAP theorem, eventual consistency, sharding, and consensus.', fun: 4 },
  },
]
