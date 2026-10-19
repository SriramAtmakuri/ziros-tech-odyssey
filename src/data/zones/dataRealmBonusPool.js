// The bonus reserve pool for Data Realm — 2x its 16 real chest positions.
// Once a chest is solved and the player moves past it via "Next", that
// chest's challenge gets replaced with one drawn from here (see
// gameStore.js's BONUS_POOLS registry / swapChallenge / getLiveChallenges),
// same mechanic as SQL Island, Code Kingdom, and Python Jungle.
// Pre-authored, never AI-generated at runtime.
//
// Split three ways:
//   - 10 hands-on (kind: 'sequence' / 'code' — the same two kinds the main
//     zone already uses; 'code' is pattern-checked, no live engine) covering
//     ground the main 16 don't: CDC, medallion architecture, dbt incremental
//     models, dbt sources.yml, a PySpark job, data governance/catalog flow,
//     Snowflake Time Travel, dbt's staging→intermediate→marts layering,
//     Airflow schedule/retry config, and reverse ETL.
//   - 11 MCQ (kind: 'mcq') on data-platform concepts with no single runnable
//     snippet of their own: data lake vs. warehouse, CDC's purpose,
//     pipeline idempotency, dbt macros, data lineage, schema drift, data
//     mesh, SCD Type 2, data contracts, managed ELT connectors, and data
//     quality frameworks.
//   - 11 matching (kind: 'matching') pairing terms across the modern data
//     stack, medallion architecture, dbt concepts, Kafka vocabulary,
//     Airflow vocabulary, dimensional modeling, data quality/governance,
//     streaming vocabulary, Spark vocabulary, ETL/ELT/reverse-ETL/CDC, and
//     data mesh vs. centralized ownership.

export const DATA_REALM_BONUS_POOL = [
  // ---------- hands-on: sequence / code ----------
  {
    id: 'dr-pool-01-cdc-flow',
    kind: 'sequence',
    npc: 'Pipeline Pete',
    title: 'Catching Every Change',
    prompt: 'Order the path a single row change takes through a Change Data Capture (CDC) pipeline.',
    items: [
      { id: 'change', label: 'A row changes in the source database (insert/update/delete)' },
      { id: 'connector', label: 'A CDC connector reads the database\'s change log' },
      { id: 'topic', label: 'The change event is published to a Kafka topic' },
      { id: 'consumer', label: 'A downstream consumer applies that same change to the warehouse' },
    ],
    correctOrder: ['change', 'connector', 'topic', 'consumer'],
    successMessage: 'Near real-time replication, one row-level change at a time — no nightly full reload needed.',
    hints: [
      'A change has to happen in the source before anything can capture it.',
      'The connector reads the database\'s own change log, then publishes each change as an event for others to consume.',
      'Row changes in source → CDC connector reads change log → Published to Kafka topic → Downstream consumer applies the change',
    ],
    xp: 75,
    tool: { name: 'Change Data Capture (CDC)', icon: '📡', description: 'Streams row-level changes as they happen, instead of periodic full extracts.', fun: 4 },
  },
  {
    id: 'dr-pool-02-medallion',
    kind: 'sequence',
    npc: 'Councillor Floe',
    title: 'Bronze, Silver, Gold',
    prompt: 'Order the layers of a medallion architecture, from raw landing to dashboard-ready.',
    items: [
      { id: 'bronze', label: 'Bronze: raw data landed exactly as it arrived, untouched' },
      { id: 'silver', label: 'Silver: cleaned, deduplicated, validated data' },
      { id: 'gold', label: 'Gold: business-level, aggregated data ready for a dashboard' },
      { id: 'consume', label: 'Analysts and dashboards query only the gold layer' },
    ],
    correctOrder: ['bronze', 'silver', 'gold', 'consume'],
    successMessage: 'Raw, then clean, then business-ready — nobody queries bronze directly, and nobody should.',
    hints: [
      'The names describe increasing refinement, in that literal order.',
      'Dashboards should only ever touch the most refined layer, not the raw one.',
      'Bronze (raw) → Silver (cleaned) → Gold (business-ready) → Consumed by dashboards/analysts',
    ],
    xp: 70,
    tool: { name: 'Medallion architecture', icon: '🥉', description: 'Bronze (raw) → Silver (cleaned) → Gold (business-ready) — a staged refinement pattern.', fun: 4 },
  },
  {
    id: 'dr-pool-03-dbt-incremental',
    kind: 'code',
    language: 'sql',
    npc: 'Transform Tara',
    title: 'Stop Reprocessing Everything',
    prompt: 'This dbt model reprocesses ten years of orders on every single run. Make it incremental: materialize it as `incremental`, and only process rows newer than what\'s already in the table, using the `is_incremental()` macro.',
    starter: "{{ config(materialized='table') }}\n\nselect * from {{ ref('stg_orders') }}\n",
    runLabel: 'Compile Model',
    simulate(code) {
      const ok = /materialized\s*=\s*['"]incremental['"]/i.test(code) && /is_incremental\(\)/.test(code) && /\{\{\s*this\s*\}\}/.test(code)
      return ok
        ? 'Compiling orders_incremental... OK\nRunning orders_incremental... 1 of 1 OK (INCREMENTAL, 40 rows processed)'
        : 'Running orders_incremental... 1 of 1 OK (FULL REFRESH, 40,000,000 rows processed)'
    },
    hints: [
      'materialized=\'incremental\' tells dbt to only process new data on subsequent runs, not rebuild the whole table.',
      'Inside an {% if is_incremental() %} block, filter for rows newer than the max already in {{ this }} (the model\'s own existing table).',
      "{{ config(materialized='incremental') }}\n\nselect * from {{ ref('stg_orders') }}\n{% if is_incremental() %}\nwhere order_date > (select max(order_date) from {{ this }})\n{% endif %}",
    ],
    xp: 90,
    tool: { name: 'dbt incremental models', icon: '⏩', description: 'materialized=\'incremental\' + is_incremental() — process only new rows, not the whole table every run.', fun: 4 },
    check({ code }) {
      if (!/materialized\s*=\s*['"]incremental['"]/i.test(code)) return { success: false, message: 'Set materialized=\'incremental\' in the config block.' }
      if (!/is_incremental\(\)/.test(code)) return { success: false, message: 'Guard the new-rows filter with an is_incremental() check.' }
      if (!/\{\{\s*this\s*\}\}/.test(code)) return { success: false, message: 'Reference the model\'s own existing table with {{ this }} to find the latest processed row.' }
      return { success: true, message: 'Ten years of history stays put — only genuinely new rows get processed from now on.' }
    },
  },
  {
    id: 'dr-pool-04-dbt-sources',
    kind: 'code',
    language: 'yaml',
    npc: 'Transform Tara',
    title: 'Naming the Raw Data',
    prompt: "Declare a dbt source named `raw_shop` with a table `raw_orders`, so models can reference it via {{ source('raw_shop', 'raw_orders') }} instead of a hardcoded table name.",
    starter: 'sources:\n  - name: \n    tables:\n      - name: \n',
    runLabel: 'Parse Sources',
    simulate(code) {
      const ok = /name\s*:\s*raw_shop/.test(code) && /name\s*:\s*raw_orders/.test(code)
      return ok
        ? 'Parsed 1 source (raw_shop) with 1 table (raw_orders).'
        : 'Error: sources.yml is missing a required name field'
    },
    hints: [
      'A source declares a raw table dbt itself didn\'t create — one `name:` for the source group, one `name:` for each table inside it.',
      'The source is called raw_shop; the table inside it is called raw_orders.',
      'sources:\n  - name: raw_shop\n    tables:\n      - name: raw_orders',
    ],
    xp: 65,
    tool: { name: 'dbt sources', icon: '🗃️', description: 'Declares a raw table dbt didn\'t create, referenced via {{ source() }} instead of a hardcoded name.', fun: 3 },
    check({ code }) {
      if (!/sources\s*:/i.test(code)) return { success: false, message: 'A sources file needs a top-level `sources:` key.' }
      if (!/name\s*:\s*raw_shop/.test(code)) return { success: false, message: 'Missing the source name: raw_shop.' }
      if (!/name\s*:\s*raw_orders/.test(code)) return { success: false, message: 'Missing the table name: raw_orders.' }
      return { success: true, message: 'Now every model can reference this table through source(), not a hardcoded name.' }
    },
  },
  {
    id: 'dr-pool-05-pyspark-job',
    kind: 'code',
    language: 'python',
    npc: 'Councillor Floe',
    title: 'A Spark Job, In Code',
    prompt: "Using PySpark: read the 'orders' table, filter out rows where status is 'cancelled', group by customer_id summing the amount column, then write the result to a table called customer_totals.",
    starter: "df = spark.read.table('orders')\nresult = None\n",
    runLabel: 'Run Job',
    simulate(code) {
      const ok = /\.filter\(/.test(code) && /\.groupBy\(/.test(code) && /(\.sum\(|\.agg\()/.test(code) && /saveAsTable\(\s*['"]customer_totals['"]\s*\)/.test(code)
      return ok
        ? 'Job finished. Wrote table customer_totals (1,204 rows).'
        : 'Job finished with unexpected output — check filter/groupBy/write steps'
    },
    hints: [
      'DataFrame methods chain together: .filter(condition), then .groupBy(column), then an aggregate like .sum(column), then .write.saveAsTable(name).',
      'Filter where status != \'cancelled\'; group by customer_id; sum the amount column; write to customer_totals.',
      "df = spark.read.table('orders')\nfiltered = df.filter(df.status != 'cancelled')\nresult = filtered.groupBy('customer_id').sum('amount')\nresult.write.saveAsTable('customer_totals')",
    ],
    xp: 85,
    tool: { name: 'PySpark DataFrame job', icon: '✨', description: 'read → filter → groupBy → aggregate → write, chained as DataFrame method calls.', fun: 4 },
    check({ code }) {
      if (!/\.filter\(/.test(code)) return { success: false, message: 'Missing a .filter() step to drop cancelled orders.' }
      if (!/\.groupBy\(/.test(code)) return { success: false, message: 'Missing a .groupBy(\'customer_id\') step.' }
      if (!/(\.sum\(|\.agg\()/.test(code)) return { success: false, message: 'Missing an aggregate — .sum(\'amount\') or an equivalent .agg(...).' }
      if (!/saveAsTable\(\s*['"]customer_totals['"]\s*\)/.test(code)) return { success: false, message: 'Missing .write.saveAsTable(\'customer_totals\').' }
      return { success: true, message: 'Read, filtered, grouped, summed, and written — a complete Spark batch job.' }
    },
  },
  {
    id: 'dr-pool-06-governance-flow',
    kind: 'sequence',
    npc: 'Viz Vera',
    title: 'Knowing What Data You Even Have',
    prompt: 'Order the steps of getting a new dataset properly governed.',
    items: [
      { id: 'catalog', label: 'New dataset gets registered in the data catalog' },
      { id: 'classify', label: 'Sensitive columns (PII) get classified and tagged' },
      { id: 'policy', label: 'Access policies are applied based on those classifications' },
      { id: 'audit', label: 'Access is logged and periodically audited' },
    ],
    correctOrder: ['catalog', 'classify', 'policy', 'audit'],
    successMessage: 'Cataloged, classified, protected, and audited — nobody\'s guessing what data exists or who can see it.',
    hints: [
      'You can\'t classify or protect a dataset nobody knows exists yet.',
      'Access policies need to know WHAT\'s sensitive before they can protect it; auditing checks that those policies actually held.',
      'Register in the catalog → Classify sensitive columns → Apply access policies → Audit access',
    ],
    xp: 70,
    tool: { name: 'Data governance flow', icon: '🗂️', description: 'Catalog, classify, protect, and audit — the lifecycle of governing a dataset.', fun: 4 },
  },
  {
    id: 'dr-pool-07-time-travel',
    kind: 'code',
    language: 'sql',
    npc: 'Transform Tara',
    title: 'Undoing an Accident',
    prompt: 'Someone accidentally deleted rows from the orders table an hour ago. Without restoring from a backup, query the table as it looked exactly 1 hour (3600 seconds) ago, using Snowflake Time Travel.',
    starter: 'select * from orders;\n',
    runLabel: 'Run Query',
    simulate(code) {
      const ok = /at\s*\(\s*offset\s*=>\s*-3600\s*\)/i.test(code)
      return ok
        ? '40 rows returned — orders as they existed 1 hour ago, before the deletion.'
        : '12 rows returned — orders as they exist right now, deletion included'
    },
    hints: [
      'Snowflake lets you query a table AT a point in the past, without restoring anything.',
      'AT (OFFSET => -3600) means "as of 3600 seconds (1 hour) ago".',
      'select * from orders at(offset => -3600);',
    ],
    xp: 80,
    tool: { name: 'Snowflake Time Travel', icon: '⏳', description: 'Query a table as it existed at a past point in time, no restore required.', fun: 4 },
    check({ code }) {
      if (!/at\s*\(\s*offset\s*=>\s*-3600\s*\)/i.test(code)) {
        return { success: false, message: 'Use AT (OFFSET => -3600) to look 1 hour into the past.' }
      }
      return { success: true, message: 'The deleted rows are visible again — no backup restore needed.' }
    },
  },
  {
    id: 'dr-pool-08-dbt-layering',
    kind: 'sequence',
    npc: 'Transform Tara',
    title: 'How dbt Models Actually Layer',
    prompt: 'Order the layers of a well-structured dbt project, from raw source to what analysts actually query.',
    items: [
      { id: 'staging', label: 'Staging models: 1:1 with source tables, light renaming/casting only' },
      { id: 'intermediate', label: 'Intermediate models: join/combine staging models together' },
      { id: 'marts', label: 'Mart models: final, business-friendly tables' },
      { id: 'bi', label: 'BI tools (Tableau, Looker) query only the mart models' },
    ],
    correctOrder: ['staging', 'intermediate', 'marts', 'bi'],
    successMessage: 'Staging cleans, intermediate combines, marts finalize — dashboards only ever touch the last layer.',
    hints: [
      'Staging models barely touch the raw data; marts are the polished, business-ready end product.',
      'Intermediate models exist specifically to combine staging models before a mart model uses them.',
      'Staging models → Intermediate models → Mart models → BI tools query the marts',
    ],
    xp: 75,
    tool: { name: 'dbt model layering', icon: '🧱', description: 'Staging → intermediate → marts — the standard dbt project structure.', fun: 4 },
  },
  {
    id: 'dr-pool-09-airflow-schedule-retry',
    kind: 'code',
    language: 'python',
    npc: 'Pipeline Pete',
    title: 'Nobody Noticed It Failed at 3AM',
    prompt: "This DAG has no schedule and no retry policy — if a task fails overnight, nobody notices until someone checks manually. Give it a daily schedule_interval and default_args with 2 retries and a 5-minute retry_delay.",
    starter: "dag = DAG('daily_pipeline', start_date=datetime(2024, 1, 1))\n",
    runLabel: 'Parse DAG',
    simulate(code) {
      const ok = /schedule_interval\s*=\s*['"]@daily['"]/.test(code) && /retries['"]?\s*:\s*2/.test(code) && /retry_delay/.test(code) && /timedelta\(\s*minutes\s*=\s*5\s*\)/.test(code)
      return ok
        ? 'DAG "daily_pipeline" parsed. Schedule: @daily. Retries: 2, delay 0:05:00.'
        : 'DAG "daily_pipeline" parsed. Schedule: None. Retries: 0.'
    },
    hints: [
      'schedule_interval=\'@daily\' sets how often the DAG runs automatically; default_args carries retry settings for every task.',
      'default_args needs both \'retries\': 2 and \'retry_delay\': timedelta(minutes=5).',
      "from datetime import timedelta\n\ndag = DAG(\n    'daily_pipeline',\n    start_date=datetime(2024, 1, 1),\n    schedule_interval='@daily',\n    default_args={'retries': 2, 'retry_delay': timedelta(minutes=5)},\n)",
    ],
    xp: 80,
    tool: { name: 'Airflow schedule & retries', icon: '⏰', description: 'schedule_interval sets when a DAG runs; default_args\' retries/retry_delay handle transient failures automatically.', fun: 4 },
    check({ code }) {
      if (!/schedule_interval\s*=\s*['"]@daily['"]/.test(code)) return { success: false, message: 'Add schedule_interval=\'@daily\'.' }
      if (!/retries['"]?\s*:\s*2/.test(code)) return { success: false, message: 'default_args needs \'retries\': 2.' }
      if (!/retry_delay/.test(code) || !/timedelta\(\s*minutes\s*=\s*5\s*\)/.test(code)) return { success: false, message: 'default_args needs \'retry_delay\': timedelta(minutes=5).' }
      return { success: true, message: 'Now it runs daily on its own, and survives a transient failure without paging anyone.' }
    },
  },
  {
    id: 'dr-pool-10-reverse-etl',
    kind: 'sequence',
    npc: 'Viz Vera',
    title: 'Sending Data Back Out',
    prompt: 'Order the steps of a reverse ETL flow — getting clean warehouse data into the tools your team already works in.',
    items: [
      { id: 'warehouse', label: 'Clean, modeled data already lives in the warehouse (e.g. Snowflake)' },
      { id: 'sync', label: 'A reverse ETL tool (e.g. Census, Hightouch) reads a warehouse table' },
      { id: 'push', label: 'It pushes that data into an operational tool (e.g. Salesforce, HubSpot)' },
      { id: 'act', label: 'Sales or support teams act on it directly inside the tool they already use' },
    ],
    correctOrder: ['warehouse', 'sync', 'push', 'act'],
    successMessage: 'The warehouse\'s insight ends up right where the team already works — no separate report to check.',
    hints: [
      'This runs the opposite direction from ELT — data flows OUT of the warehouse, not into it.',
      'The data has to already be clean in the warehouse before anything can sync it elsewhere.',
      'Clean data in the warehouse → Reverse ETL tool reads it → Pushes it into an operational tool → Team acts on it there',
    ],
    xp: 70,
    tool: { name: 'Reverse ETL', icon: '↩️', description: 'Pushes clean warehouse data back out into the operational tools teams already use.', fun: 4 },
  },

  // ---------- MCQ: data-platform concepts (no single runnable snippet) ----------
  {
    id: 'dr-pool-11-mcq-lake-vs-warehouse',
    kind: 'mcq',
    npc: 'Councillor Floe',
    title: 'Data Lake vs. Data Warehouse',
    prompt: "What's the key structural difference between a data lake and a data warehouse?",
    options: [
      'A data lake can only store numbers; a warehouse can only store text',
      'A data lake stores raw data in any format with schema applied when it\'s read (schema-on-read); a warehouse stores structured data with schema enforced when it\'s written (schema-on-write)',
      'They are the exact same technology, just marketed differently',
      'A warehouse is always smaller than a lake',
    ],
    correctIndex: 1,
    explanation: 'A data lake accepts raw data in any format up front and figures out structure later, at query time. A data warehouse requires data to already fit a defined schema before it\'s loaded — more rigid, but faster and more reliable for structured analytics.',
    hints: [
      'Think about WHEN structure gets enforced — before storing the data, or only when you later read it.',
      'One is flexible and raw-first; the other is rigid and structured-first.',
      'The correct answer is: lake = schema-on-read (raw first); warehouse = schema-on-write (structured first).',
    ],
    xp: 45,
    tool: { name: 'Data lake vs. warehouse', icon: '🏞️', description: 'Schema-on-read (lake) vs. schema-on-write (warehouse).', fun: 3 },
  },
  {
    id: 'dr-pool-12-mcq-cdc-purpose',
    kind: 'mcq',
    npc: 'Pipeline Pete',
    title: 'What CDC Is Actually For',
    prompt: 'What problem does Change Data Capture (CDC) solve?',
    options: [
      'It captures and streams individual row-level changes from a source database in near real-time, instead of re-extracting the whole table on a schedule',
      'It backs up an entire database once a year',
      'It only works for permanently deleting old data',
      'It replaces the need for a source database entirely',
    ],
    correctIndex: 0,
    explanation: 'Instead of periodically re-pulling an entire table (slow, and misses intra-period changes), CDC reads a database\'s own change log and streams each individual insert/update/delete as it happens.',
    hints: [
      'It\'s about HOW OFTEN and at WHAT GRANULARITY changes get captured — not about backups.',
      'The alternative it replaces is re-extracting a whole table on a fixed schedule.',
      'The correct answer is: streams individual row-level changes in near real-time, instead of periodic full re-extracts.',
    ],
    xp: 45,
    tool: { name: 'CDC purpose', icon: '📡', description: 'Streams row-level changes in near real-time, instead of periodic full re-extracts.', fun: 3 },
  },
  {
    id: 'dr-pool-13-mcq-idempotent-pipeline',
    kind: 'mcq',
    npc: 'Pipeline Pete',
    title: 'Safe to Run Twice',
    prompt: 'Why should an Airflow task be idempotent?',
    options: [
      'So it runs exactly once and can never be triggered a second time',
      'So re-running it — after a failure, or by accident — produces the same correct end result, instead of duplicating or corrupting data',
      'So it automatically fails the second time it runs',
      'Idempotency has nothing to do with data pipelines specifically',
    ],
    correctIndex: 1,
    explanation: 'Pipelines fail and get retried constantly — a task that isn\'t idempotent (e.g. blindly INSERTing rows instead of upserting) will duplicate data every time it\'s safely retried, silently corrupting downstream results.',
    hints: [
      'Think about what happens if the exact same task accidentally runs twice in a row.',
      'The goal is a SAFE retry, not preventing retries from ever happening.',
      'The correct answer is: re-running it produces the same correct result, without duplicating or corrupting data.',
    ],
    xp: 50,
    tool: { name: 'Pipeline idempotency', icon: '🔁', description: 'Safe to retry — the same correct result, whether it runs once or several times.', fun: 3 },
  },
  {
    id: 'dr-pool-14-mcq-dbt-macros',
    kind: 'mcq',
    npc: 'Transform Tara',
    title: 'What Is a dbt Macro?',
    prompt: 'What is a dbt macro?',
    options: [
      'A reusable snippet of SQL logic, written with Jinja templating, that can be called from multiple models — like a function for SQL',
      'A type of database index dbt creates automatically',
      'A scheduled job that runs dbt on its own',
      'A built-in dashboard inside dbt',
    ],
    correctIndex: 0,
    explanation: 'A macro (defined with {% macro %}) lets you write a piece of SQL/Jinja logic once and call it from any model, avoiding copy-pasted SQL across dozens of models.',
    hints: [
      'Think "function", but for SQL, using dbt\'s Jinja templating layer.',
      'It\'s callable from any model — that\'s the whole point, avoiding repeated logic.',
      'The correct answer is: a reusable Jinja-templated SQL snippet, callable from multiple models like a function.',
    ],
    xp: 45,
    tool: { name: 'dbt macros', icon: '🧩', description: 'Reusable Jinja-templated SQL logic, callable like a function across models.', fun: 3 },
  },
  {
    id: 'dr-pool-15-mcq-data-lineage',
    kind: 'mcq',
    npc: 'Viz Vera',
    title: 'What Data Lineage Actually Gives You',
    prompt: "What does 'data lineage' let a data team do?",
    options: [
      'Trace exactly where a piece of data came from and every transformation it passed through, end to end',
      'Automatically fix broken pipelines without any human involvement',
      'Encrypt data while it\'s stored',
      'Speed up every query automatically',
    ],
    correctIndex: 0,
    explanation: 'Data lineage maps the full path data travels — which source it came from, which models transformed it, and which dashboards depend on it — critical for debugging a bad number or assessing the blast radius of a schema change.',
    hints: [
      'It\'s about TRACING a path, not fixing, encrypting, or speeding anything up.',
      'Useful when a number looks wrong and you need to find exactly where it went off track.',
      'The correct answer is: traces where data came from and every transformation it passed through, end to end.',
    ],
    xp: 45,
    tool: { name: 'Data lineage', icon: '🧵', description: 'Traces data\'s full path — source through every transformation to its final use.', fun: 3 },
  },
  {
    id: 'dr-pool-16-mcq-schema-drift',
    kind: 'mcq',
    npc: 'Transform Tara',
    title: 'When the Source Changes Underneath You',
    prompt: "What is 'schema drift' in a data pipeline?",
    options: [
      'A source system\'s structure changing over time (a column added, renamed, or removed) in ways that can silently break downstream pipelines if not handled',
      'A visual effect used in BI dashboards',
      'A specific type of database backup',
      'A feature that automatically deletes unused columns for you',
    ],
    correctIndex: 0,
    explanation: 'Source systems change independently of the pipelines depending on them — a renamed API field or a dropped column can silently break a downstream model unless the pipeline is designed to detect and handle that drift.',
    hints: [
      'It\'s about the SOURCE changing shape, not about anything visual or backup-related.',
      'The danger is that it can happen SILENTLY, breaking things downstream without an obvious warning.',
      'The correct answer is: a source\'s structure changing over time in ways that can silently break downstream pipelines.',
    ],
    xp: 50,
    tool: { name: 'Schema drift', icon: '🌊', description: 'A source\'s structure changing over time, silently, in ways that can break downstream pipelines.', fun: 3 },
  },
  {
    id: 'dr-pool-17-mcq-datamesh',
    kind: 'mcq',
    npc: 'Councillor Floe',
    title: 'What Is Data Mesh?',
    prompt: "What is the core idea behind 'data mesh'?",
    options: [
      'Decentralizing data ownership to the domain teams that actually produce the data, instead of funneling everything through one central data team',
      'A single giant centralized database that replaces every other database',
      'A specific Snowflake pricing tier',
      'A networking protocol for connecting two databases',
    ],
    correctIndex: 0,
    explanation: 'Data mesh pushes ownership of data quality and structure OUT to the domain teams who actually understand and produce it (treating each dataset as a "data product" with an owner), rather than one central team trying to own everything.',
    hints: [
      'It\'s an organizational philosophy about WHO owns data, not a specific database technology.',
      'The shift is away from ONE central team owning everything, toward the teams closest to the data owning their own piece.',
      'The correct answer is: decentralizes data ownership to the domain teams that produce the data.',
    ],
    xp: 50,
    tool: { name: 'Data mesh', icon: '🕸️', description: 'Decentralized data ownership, pushed out to the domain teams that produce it.', fun: 4 },
  },
  {
    id: 'dr-pool-18-mcq-scd2',
    kind: 'mcq',
    npc: 'Councillor Floe',
    title: 'Slowly Changing Dimensions, Type 2',
    prompt: "In dimensional modeling, what does a Slowly Changing Dimension (SCD) Type 2 do when a dimension value changes?",
    options: [
      'Instead of overwriting the old value, it inserts a new row and marks the old one as expired — preserving full history',
      'It deletes the old row entirely, keeping zero history',
      'It only works on numeric columns',
      'It has nothing to do with tracking changes over time',
    ],
    correctIndex: 0,
    explanation: 'SCD Type 2 preserves history by inserting a new row (with new start/end-date and current-flag columns) rather than overwriting the existing row in place — so you can still see what a customer\'s address (or any dimension attribute) used to be at any past point in time.',
    hints: [
      'The whole point of "Type 2" specifically is PRESERVING history, not discarding it.',
      'It adds a new row rather than editing the existing one in place.',
      'The correct answer is: inserts a new row and marks the old one expired, preserving full history.',
    ],
    xp: 55,
    tool: { name: 'SCD Type 2', icon: '📜', description: 'Preserves full history of a dimension by inserting new rows instead of overwriting.', fun: 4 },
  },
  {
    id: 'dr-pool-19-mcq-datacontract',
    kind: 'mcq',
    npc: 'Viz Vera',
    title: 'Data Contracts',
    prompt: "What is a 'data contract' between a data-producing team and a data-consuming team?",
    options: [
      'An explicit agreement on a dataset\'s schema, format, and meaning, so the consumer isn\'t silently broken by an unannounced upstream change',
      'A legal document required before any company can store data at all',
      'A specific type of database software license',
      'A Kafka-only feature with no broader meaning',
    ],
    correctIndex: 0,
    explanation: 'A data contract makes the expectations between producer and consumer explicit — schema, meaning of each field, update frequency — so a producer can\'t silently rename a column or change its meaning without the consumer knowing (and their pipeline breaking).',
    hints: [
      'It\'s specifically about the relationship between whoever PRODUCES a dataset and whoever CONSUMES it.',
      'The goal is preventing an unannounced change from silently breaking something downstream.',
      'The correct answer is: an explicit agreement on schema/format/meaning, so consumers aren\'t silently broken by upstream changes.',
    ],
    xp: 50,
    tool: { name: 'Data contracts', icon: '🤝', description: 'An explicit schema/meaning agreement between a data producer and its consumers.', fun: 3 },
  },
  {
    id: 'dr-pool-20-mcq-managed-elt',
    kind: 'mcq',
    npc: 'Pipeline Pete',
    title: 'Why Not Just Write the Extraction Script Yourself?',
    prompt: "What's the main benefit of a managed ingestion tool like Fivetran, compared to hand-writing extraction scripts?",
    options: [
      'It maintains pre-built, tested connectors for common sources and automatically handles schema changes and API updates, instead of a team maintaining brittle custom scripts',
      'It is always completely free to use',
      'It replaces the need for a data warehouse entirely',
      'It only works with one single specific database vendor',
    ],
    correctIndex: 0,
    explanation: 'Every source API changes over time — a managed connector\'s whole value is that someone else maintains it against those changes, instead of your team\'s custom script silently breaking every time the source updates its API.',
    hints: [
      'Think about who has to fix the extraction code when the source system changes its API — you, or the vendor.',
      'It\'s not free, and it doesn\'t replace the warehouse — it just replaces hand-written extraction code.',
      'The correct answer is: maintains tested connectors and handles source changes automatically, instead of brittle custom scripts.',
    ],
    xp: 45,
    tool: { name: 'Managed ELT connectors', icon: '🔌', description: 'Pre-built, maintained connectors — someone else keeps them working as sources change.', fun: 3 },
  },
  {
    id: 'dr-pool-21-mcq-dataquality-framework',
    kind: 'mcq',
    npc: 'Transform Tara',
    title: 'What a Data Quality Framework Actually Does',
    prompt: 'What does a data quality framework like Great Expectations actually do?',
    options: [
      'Runs automated checks ("expectations") against your data — e.g. "this column should never be null" — and fails loudly if the data doesn\'t meet them',
      'Automatically writes your ETL code for you',
      'Only works on a specific day of the week',
      'Replaces the need for any database schema at all',
    ],
    correctIndex: 0,
    explanation: 'You define expectations about what "good" data looks like (non-null, within a range, matching a pattern, etc.), and the framework runs them against real data, failing loudly the moment reality stops matching those expectations — catching bad data before it reaches a dashboard.',
    hints: [
      'It\'s about CHECKING data against rules you define, not writing code or replacing a schema.',
      'The value is in catching a violation loudly and early, before anyone downstream trusts bad data.',
      'The correct answer is: runs automated checks against your data and fails loudly when it doesn\'t meet them.',
    ],
    xp: 45,
    tool: { name: 'Data quality frameworks', icon: '✅', description: 'Automated checks against your data, failing loudly the moment reality stops matching expectations.', fun: 3 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'dr-pool-22-match-stacktools',
    kind: 'matching',
    npc: 'Councillor Floe',
    title: 'The Modern Data Stack',
    prompt: 'Match each tool to its role in the modern data stack.',
    pairs: [
      { id: 'a', left: 'Fivetran', right: 'Ingests data from source systems into the warehouse' },
      { id: 'b', left: 'dbt', right: 'Transforms raw data into clean, tested models using SQL' },
      { id: 'c', left: 'Airflow', right: 'Orchestrates and schedules when each pipeline step runs' },
      { id: 'd', left: 'Snowflake', right: 'Stores the data, with storage separated from compute' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Two tools move/transform data; two tools store it or coordinate the whole schedule.',
      'Airflow doesn\'t touch the data itself — it just decides WHEN each other tool\'s step runs.',
      'Fivetran → ingests data in. dbt → transforms with SQL. Airflow → schedules/orchestrates. Snowflake → stores it.',
    ],
    xp: 60,
    successMessage: 'Every core tool in the stack, matched to its actual job.',
    tool: { name: 'Modern data stack tools', icon: '🏗️', description: 'Fivetran, dbt, Airflow, and Snowflake compared.', fun: 3 },
  },
  {
    id: 'dr-pool-23-match-medallion2',
    kind: 'matching',
    npc: 'Councillor Floe',
    title: 'Medallion Architecture, Matched',
    prompt: 'Match each medallion-architecture term to its meaning.',
    pairs: [
      { id: 'a', left: 'Bronze', right: 'Raw data, landed exactly as it arrived, untouched' },
      { id: 'b', left: 'Silver', right: 'Cleaned, deduplicated, validated data' },
      { id: 'c', left: 'Gold', right: 'Business-level, aggregated data ready for a dashboard' },
      { id: 'd', left: 'Lakehouse', right: 'An architecture combining a lake\'s flexible raw storage with a warehouse\'s structure and performance' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'Bronze, silver, and gold describe increasing refinement of the SAME data; lakehouse is a broader architectural pattern these layers often live inside.',
      'Gold is the most refined, dashboard-ready layer; bronze is the least refined, closest to raw.',
      'Bronze → raw, untouched. Silver → cleaned, validated. Gold → business-ready, aggregated. Lakehouse → combines lake flexibility with warehouse structure.',
    ],
    xp: 60,
    successMessage: 'Every medallion layer, plus the broader architecture they often live inside.',
    tool: { name: 'Medallion architecture terms', icon: '🥇', description: 'Bronze, silver, gold, and the lakehouse pattern.', fun: 3 },
  },
  {
    id: 'dr-pool-24-match-dbtconcepts',
    kind: 'matching',
    npc: 'Transform Tara',
    title: 'Core dbt Concepts',
    prompt: 'Match each dbt concept to its meaning.',
    pairs: [
      { id: 'a', left: 'Model', right: 'A single SQL SELECT statement dbt turns into a table or view' },
      { id: 'b', left: 'Macro', right: 'Reusable Jinja-templated SQL logic, callable like a function' },
      { id: 'c', left: 'Source', right: 'A reference to a raw table dbt itself doesn\'t create' },
      { id: 'd', left: 'Test', right: 'An automated check (like unique or not_null) run against a model\'s data' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Model and Source are both about referencing DATA; Macro and Test are both about extra LOGIC applied around that data.',
      'Source points to something dbt didn\'t build; a Model is something dbt DOES build.',
      'Model → a SELECT dbt materializes. Macro → reusable Jinja SQL logic. Source → a raw table dbt didn\'t create. Test → an automated data check.',
    ],
    xp: 60,
    successMessage: 'Every core dbt concept, matched to its exact role.',
    tool: { name: 'dbt concepts', icon: '🛠️', description: 'Models, macros, sources, and tests.', fun: 3 },
  },
  {
    id: 'dr-pool-25-match-kafkavocab',
    kind: 'matching',
    npc: 'Pipeline Pete',
    title: 'Kafka Vocabulary',
    prompt: 'Match each Kafka term to its meaning.',
    pairs: [
      { id: 'a', left: 'Producer', right: 'Publishes messages to a topic' },
      { id: 'b', left: 'Consumer', right: 'Reads messages from a topic' },
      { id: 'c', left: 'Topic', right: 'A named stream that messages are published to and read from' },
      { id: 'd', left: 'Partition', right: 'A topic split into ordered, parallel-readable segments' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Producer and Consumer are the two ROLES that write/read messages; Topic and Partition describe the STRUCTURE those messages live in.',
      'A topic can be split into multiple partitions specifically to allow parallel reads.',
      'Producer → publishes messages. Consumer → reads messages. Topic → a named message stream. Partition → an ordered, parallel-readable segment of a topic.',
    ],
    xp: 55,
    successMessage: 'Every core Kafka term, matched to its actual role.',
    tool: { name: 'Kafka vocabulary', icon: '📨', description: 'Producers, consumers, topics, and partitions.', fun: 3 },
  },
  {
    id: 'dr-pool-26-match-airflowvocab',
    kind: 'matching',
    npc: 'Pipeline Pete',
    title: 'Airflow Vocabulary',
    prompt: 'Match each Airflow term to its meaning.',
    pairs: [
      { id: 'a', left: 'DAG', right: 'The whole workflow — a directed graph of tasks with no cycles' },
      { id: 'b', left: 'Task', right: 'One single unit of work inside a DAG' },
      { id: 'c', left: 'Operator', right: 'A template defining what KIND of work a task does (run Python, run SQL, etc.)' },
      { id: 'd', left: 'schedule_interval', right: 'How often the DAG should automatically run (e.g. daily, hourly)' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'DAG and Task describe the STRUCTURE of the workflow; Operator and schedule_interval describe WHAT each task does and WHEN the whole thing runs.',
      'An Operator is a template — a task is a specific instance running one.',
      'DAG → the whole workflow graph. Task → one unit of work. Operator → defines what kind of work a task does. schedule_interval → how often it runs.',
    ],
    xp: 55,
    successMessage: 'Every core Airflow term, matched to its actual role.',
    tool: { name: 'Airflow vocabulary', icon: '📆', description: 'DAGs, tasks, operators, and schedule intervals.', fun: 3 },
  },
  {
    id: 'dr-pool-27-match-dimensionalmodeling',
    kind: 'matching',
    npc: 'Councillor Floe',
    title: 'Dimensional Modeling Terms',
    prompt: 'Match each dimensional-modeling term to its meaning.',
    pairs: [
      { id: 'a', left: 'Fact table', right: 'Holds measurable numeric events, plus foreign keys to dimensions' },
      { id: 'b', left: 'Dimension table', right: 'Holds descriptive attributes used to filter or group facts' },
      { id: 'c', left: 'Grain', right: 'What a single row in the fact table actually represents' },
      { id: 'd', left: 'SCD Type 2', right: 'Tracks historical changes to a dimension by inserting new rows instead of overwriting' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Fact table and Dimension table are the two core TABLE ROLES; Grain and SCD Type 2 describe DESIGN DECISIONS made about them.',
      'Grain is decided before you build anything; SCD Type 2 is specifically about how a dimension handles change over time.',
      'Fact table → numeric events + FKs. Dimension table → descriptive attributes. Grain → what one fact row represents. SCD Type 2 → preserves dimension history via new rows.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind every star schema, matched up.',
    tool: { name: 'Dimensional modeling terms', icon: '⭐', description: 'Fact tables, dimension tables, grain, and SCD Type 2.', fun: 4 },
  },
  {
    id: 'dr-pool-28-match-dataquality',
    kind: 'matching',
    npc: 'Viz Vera',
    title: 'Data Quality & Governance Vocabulary',
    prompt: 'Match each data quality/governance term to its meaning.',
    pairs: [
      { id: 'a', left: 'Data lineage', right: 'Traces where a piece of data came from and every transformation it passed through' },
      { id: 'b', left: 'Data contract', right: 'An agreement on a dataset\'s schema/meaning between the producing and consuming teams' },
      { id: 'c', left: 'Schema drift', right: 'A source\'s structure changing over time in ways that can silently break downstream pipelines' },
      { id: 'd', left: 'Data catalog', right: 'A searchable inventory of what datasets exist, what they contain, and who owns them' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Lineage and contract are both about the RELATIONSHIP between producer and consumer; drift and catalog are about the RAW STATE of the data/systems themselves.',
      'A data contract is meant to prevent schema drift from silently breaking a consumer.',
      'Data lineage → traces data\'s full path. Data contract → schema/meaning agreement between teams. Schema drift → silent structural change over time. Data catalog → searchable inventory of what exists.',
    ],
    xp: 65,
    successMessage: 'Every core data quality and governance term, matched up.',
    tool: { name: 'Data quality & governance vocabulary', icon: '🔍', description: 'Data lineage, data contracts, schema drift, and data catalogs.', fun: 4 },
  },
  {
    id: 'dr-pool-29-match-streamingvocab',
    kind: 'matching',
    npc: 'Pipeline Pete',
    title: 'Streaming Vocabulary',
    prompt: 'Match each streaming term to its meaning.',
    pairs: [
      { id: 'a', left: 'Event', right: 'A single record describing something that happened, at a point in time' },
      { id: 'b', left: 'Stream processing', right: 'Processing events continuously as they arrive, instead of waiting to batch them' },
      { id: 'c', left: 'Windowing', right: 'Grouping a stream of events into fixed time chunks (e.g. every 5 minutes) to aggregate over' },
      { id: 'd', left: 'Exactly-once semantics', right: 'A guarantee that each event is processed exactly once, even after a failure and retry' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Event and Stream processing describe the DATA and the PROCESSING MODEL; Windowing and Exactly-once semantics are specific TECHNIQUES/GUARANTEES within that model.',
      'Windowing is about grouping events over TIME; exactly-once semantics is about processing CORRECTNESS under failure.',
      'Event → one record of something that happened. Stream processing → continuous processing as data arrives. Windowing → grouping events into time chunks. Exactly-once semantics → guarantees no duplicate/missed processing.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind every streaming pipeline, matched up.',
    tool: { name: 'Streaming vocabulary', icon: '⚡', description: 'Events, stream processing, windowing, and exactly-once semantics.', fun: 4 },
  },
  {
    id: 'dr-pool-30-match-sparkvocab',
    kind: 'matching',
    npc: 'Councillor Floe',
    title: 'Spark Vocabulary',
    prompt: 'Match each Spark term to its meaning.',
    pairs: [
      { id: 'a', left: 'DataFrame', right: "Spark's primary data abstraction — a distributed table-like structure with named columns" },
      { id: 'b', left: 'RDD', right: "Resilient Distributed Dataset — Spark's lower-level, less structured original abstraction" },
      { id: 'c', left: 'Executor', right: 'A worker process that actually runs tasks and holds data in a Spark cluster' },
      { id: 'd', left: 'Driver', right: 'The process that coordinates a Spark job and schedules work across executors' },
    ],
    rightOrder: ['d', 'a', 'c', 'b'],
    hints: [
      'DataFrame and RDD are both DATA ABSTRACTIONS (one built on top of, and generally preferred over, the other); Executor and Driver are both RUNTIME PROCESSES.',
      'The Driver coordinates; Executors do the actual work it hands out.',
      'DataFrame → structured, columnar abstraction. RDD → lower-level original abstraction. Executor → runs tasks, holds data. Driver → coordinates the whole job.',
    ],
    xp: 65,
    successMessage: 'The core building blocks of a Spark job, matched up.',
    tool: { name: 'Spark vocabulary', icon: '✨', description: 'DataFrames, RDDs, executors, and the driver.', fun: 4 },
  },
  {
    id: 'dr-pool-31-match-etl-elt-reverse',
    kind: 'matching',
    npc: 'Viz Vera',
    title: 'ETL, ELT, Reverse ETL, and CDC',
    prompt: 'Match each data-movement pattern to its meaning.',
    pairs: [
      { id: 'a', left: 'ETL', right: 'Transform the data BEFORE loading it into the warehouse' },
      { id: 'b', left: 'ELT', right: 'Load raw data into the warehouse first, transform it there afterward' },
      { id: 'c', left: 'Reverse ETL', right: 'Push clean warehouse data back OUT into operational tools like Salesforce' },
      { id: 'd', left: 'CDC', right: 'Streams row-level changes as they happen, instead of periodic full extracts' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'ETL and ELT differ in WHEN transformation happens relative to loading; Reverse ETL flips the DIRECTION entirely; CDC is about HOW changes get captured in the first place.',
      'Reverse ETL is the mirror image of ELT — data flows back OUT of the warehouse instead of into it.',
      'ETL → transform before loading. ELT → load raw, transform after. Reverse ETL → push warehouse data back out. CDC → streams row-level changes as they happen.',
    ],
    xp: 65,
    successMessage: 'Every core data-movement pattern, matched to how it actually works.',
    tool: { name: 'ETL / ELT / Reverse ETL / CDC', icon: '🔄', description: 'Four ways data actually moves through a modern platform.', fun: 4 },
  },
  {
    id: 'dr-pool-32-match-datamesh2',
    kind: 'matching',
    npc: 'Councillor Floe',
    title: 'Data Mesh Vocabulary',
    prompt: 'Match each data-mesh term to its meaning.',
    pairs: [
      { id: 'a', left: 'Data mesh', right: 'Decentralizes data ownership to the domain teams that produce it' },
      { id: 'b', left: 'Centralized data team', right: 'One team owns all pipelines and data across the whole company' },
      { id: 'c', left: 'Data product', right: 'A dataset treated and maintained like a product, with an owner and a defined interface' },
      { id: 'd', left: 'Domain ownership', right: 'The team closest to the data is responsible for its quality, not a downstream team' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Data mesh and Centralized data team are two OPPOSING organizational models; Data product and Domain ownership are two supporting IDEAS within the data mesh model.',
      'Domain ownership is the principle; data product is how that principle gets applied to an actual dataset.',
      'Data mesh → decentralized ownership by domain teams. Centralized data team → one team owns everything. Data product → a dataset treated like a product, with an owner. Domain ownership → the closest team owns quality.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind data mesh, matched to how it actually reorganizes ownership.',
    tool: { name: 'Data mesh vocabulary', icon: '🕸️', description: 'Data mesh, centralized ownership, data products, and domain ownership.', fun: 4 },
  },
]
