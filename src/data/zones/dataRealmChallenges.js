// Data Realm — Snowflake, dbt, Spark, Kafka, Airflow, modern data stack.
// Reuses the 'sequence' kind for architecture/process ordering and the
// 'code' kind (SQL/Python/YAML, pattern-checked, no live engine) for
// dbt models, Airflow DAGs, and data-quality tests — no new panel types.

const BROKEN_DBT_MODEL = `select
  o.order_id,
  o.customer_id,
  o.amount
from raw_orders o
left join raw_customers c
`

const BROKEN_AIRFLOW_DAG = `from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('daily_pipeline', start_date=datetime(2024, 1, 1))

extract = PythonOperator(task_id='extract', python_callable=lambda: None, dag=dag)
load = PythonOperator(task_id='load', python_callable=lambda: None, dag=dag)
transform = PythonOperator(task_id='transform', python_callable=lambda: None, dag=dag)

load >> extract >> transform
`

export const DATA_REALM_CHALLENGES = [
  {
    id: 'dr-01-elt-pipeline',
    kind: 'sequence',
    npc: 'Transform Tara',
    title: 'Building the ELT Pipeline',
    prompt: 'Order the pieces of a modern ELT pipeline, from source system to dashboard.',
    items: [
      { id: 'source', label: 'Source System (Salesforce)' },
      { id: 'fivetran', label: 'Fivetran (ingestion)' },
      { id: 'raw', label: 'Snowflake Raw Layer' },
      { id: 'dbt', label: 'dbt Transform' },
      { id: 'analytics', label: 'Analytics Layer' },
      { id: 'tableau', label: 'Tableau Dashboard' },
    ],
    correctOrder: ['source', 'fivetran', 'raw', 'dbt', 'analytics', 'tableau'],
    successMessage: 'Extract, Load, then Transform — that\'s the "T" moving to the end, the whole idea behind ELT.',
    hints: [
      'ELT means data lands in the warehouse raw first, and gets transformed after — not before.',
      'Data starts at the source, gets ingested, lands raw, then dbt transforms it into something a dashboard can use.',
      'Source System → Fivetran → Snowflake Raw Layer → dbt Transform → Analytics Layer → Tableau Dashboard',
    ],
    xp: 65,
    tool: { name: 'ELT pipeline', icon: '🔄', description: 'Extract, Load, then Transform inside the warehouse — the modern approach vs. old-school ETL.', fun: 4 },
  },

  {
    id: 'dr-02-kafka-architecture',
    kind: 'sequence',
    npc: 'Pipeline Pete',
    title: 'How a Message Travels',
    prompt: 'Order the path a message takes through Kafka, from the moment it\'s produced to the moment it\'s consumed.',
    items: [
      { id: 'producer', label: 'Producer' },
      { id: 'topic', label: 'Topic' },
      { id: 'partition', label: 'Partition' },
      { id: 'group', label: 'Consumer Group' },
      { id: 'consumer', label: 'Consumer' },
    ],
    correctOrder: ['producer', 'topic', 'partition', 'group', 'consumer'],
    successMessage: 'A message\'s whole journey, start to finish — that\'s the backbone of every streaming pipeline.',
    hints: [
      'Someone has to send a message before anyone can receive it.',
      'A topic is divided into partitions; consumer groups coordinate which consumer reads which partition.',
      'Producer → Topic → Partition → Consumer Group → Consumer',
    ],
    xp: 70,
    tool: { name: 'Kafka architecture', icon: '📨', description: 'Producers write to topics; partitions enable parallelism; consumer groups coordinate reads.', fun: 4 },
  },

  {
    id: 'dr-03-streaming-pipeline',
    kind: 'sequence',
    npc: 'Pipeline Pete',
    title: 'Real Time, Not Next Day',
    prompt: 'Order this real-time pipeline: app events need to reach the warehouse within seconds, not overnight.',
    items: [
      { id: 'events', label: 'App Events' },
      { id: 'topic', label: 'Kafka Topic' },
      { id: 'consumer', label: 'Kafka Consumer' },
      { id: 'spark', label: 'Spark Streaming' },
      { id: 'warehouse', label: 'Snowflake' },
    ],
    correctOrder: ['events', 'topic', 'consumer', 'spark', 'warehouse'],
    successMessage: 'Seconds, not overnight. That\'s the difference streaming makes.',
    hints: [
      'Events are produced first, then flow through Kafka before any processing happens.',
      'Spark Streaming reads from the Kafka consumer and writes the processed result onward.',
      'App Events → Kafka Topic → Kafka Consumer → Spark Streaming → Snowflake',
    ],
    xp: 75,
    tool: { name: 'Streaming pipeline', icon: '⚡', description: 'Real-time data flow: events → Kafka → stream processor → warehouse, all within seconds.', fun: 4 },
  },

  {
    id: 'dr-04-dbt-model',
    kind: 'code',
    language: 'sql',
    npc: 'Transform Tara',
    title: 'Cleaning the Raw Orders',
    prompt: 'Write a dbt model that transforms raw order data into something clean: reference the raw_orders source using {{ ref(\'raw_orders\') }}, and select order_id, customer_id, and amount.',
    starter: '-- models/stg_orders.sql\nselect\n  \nfrom \n',
    runLabel: 'Compile Model',
    simulate(code) {
      const ok = /\{\{\s*ref\(/.test(code)
      return ok
        ? 'Compiling stg_orders... OK\nRunning stg_orders... 1 of 1 OK created sql view model'
        : 'Compilation Error in model stg_orders: depends_on.nodes is empty — did you forget ref()?'
    },
    hints: [
      'dbt models reference other tables through {{ ref(\'model_name\') }}, never a hardcoded table name — that\'s what builds the dependency graph.',
      'select order_id, customer_id, amount from {{ ref(\'raw_orders\') }}',
      "select\n  order_id,\n  customer_id,\n  amount\nfrom {{ ref('raw_orders') }}",
    ],
    xp: 75,
    tool: { name: 'dbt models', icon: '🛠️', description: '{{ ref() }} and {{ source() }} build a dependency graph instead of hardcoded table names.', fun: 4 },
    check({ code }) {
      if (!/\{\{\s*ref\(\s*['"]raw_orders['"]\s*\)\s*\}\}/.test(code)) {
        return { success: false, message: 'Reference raw_orders using {{ ref(\'raw_orders\') }}, not a hardcoded table name.' }
      }
      if (!/order_id/.test(code) || !/customer_id/.test(code) || !/amount/.test(code)) {
        return { success: false, message: 'Select order_id, customer_id, and amount.' }
      }
      return { success: true, message: 'The model compiles clean, and dbt now knows exactly what it depends on.' }
    },
  },

  {
    id: 'dr-05-dbt-debug',
    kind: 'code',
    language: 'sql',
    npc: 'Transform Tara',
    title: 'The Incomplete Join',
    prompt: 'This model joins orders to customers but never finishes the join — and it\'s silently dropping every order with no matching customer. Finish it as a LEFT JOIN on customer_id, so no order gets lost.',
    starter: BROKEN_DBT_MODEL,
    runLabel: 'Compile Model',
    simulate(code) {
      const ok = /left join raw_customers c\s+on\s+o\.customer_id\s*=\s*c\.customer_id/i.test(code)
      return ok
        ? 'Compiling stg_orders_joined... OK\nRunning stg_orders_joined... 1 of 1 OK'
        : 'Compilation Error: syntax error in JOIN clause — missing ON condition'
    },
    hints: [
      'A LEFT JOIN needs an ON condition — without one, it won\'t compile (or will cross-join everything).',
      'Join on o.customer_id = c.customer_id.',
      'left join raw_customers c\n  on o.customer_id = c.customer_id',
    ],
    xp: 70,
    tool: { name: 'dbt debugging', icon: '🔎', description: 'An incomplete JOIN silently drops or duplicates rows — always finish the ON clause.', fun: 3 },
    check({ code }) {
      if (!/left join raw_customers c\s+on\s+o\.customer_id\s*=\s*c\.customer_id/i.test(code)) {
        return { success: false, message: 'The join still isn\'t complete — add ON o.customer_id = c.customer_id.' }
      }
      return { success: true, message: 'Every order keeps its customer now — nothing silently drops anymore.' }
    },
  },

  {
    id: 'dr-06-airflow-dag',
    kind: 'code',
    language: 'python',
    npc: 'Pipeline Pete',
    title: 'Scheduling the Pipeline',
    prompt: 'Write an Airflow DAG with three tasks — extract, transform, load — that run strictly in that order.',
    starter: "from airflow import DAG\nfrom airflow.operators.python import PythonOperator\nfrom datetime import datetime\n\ndag = DAG('daily_pipeline', start_date=datetime(2024, 1, 1))\n\n# define extract, transform, load tasks and set their order\n",
    runLabel: 'Parse DAG',
    simulate(code) {
      const ok = /extract\s*>>\s*transform\s*>>\s*load/.test(code.replace(/\s+/g, ' '))
      return ok
        ? 'DAG "daily_pipeline" parsed successfully. 3 tasks, 2 dependencies.'
        : 'DagCycleError or missing dependency — task order is not well-defined'
    },
    hints: [
      'Each task is a PythonOperator with a task_id; the >> operator sets execution order between them.',
      'You need three PythonOperator tasks (extract, transform, load), then chain them with >>.',
      "extract = PythonOperator(task_id='extract', python_callable=lambda: None, dag=dag)\ntransform = PythonOperator(task_id='transform', python_callable=lambda: None, dag=dag)\nload = PythonOperator(task_id='load', python_callable=lambda: None, dag=dag)\n\nextract >> transform >> load",
    ],
    xp: 80,
    tool: { name: 'Airflow DAG', icon: '📆', description: 'Tasks + the >> operator define a directed, scheduled dependency graph.', fun: 4 },
    check({ code }) {
      const flat = code.replace(/\s+/g, ' ')
      if (!/extract\s*>>\s*transform\s*>>\s*load/.test(flat)) {
        return { success: false, message: 'The three tasks need to run in order: extract >> transform >> load.' }
      }
      if ((code.match(/PythonOperator/g) || []).length < 3) {
        return { success: false, message: 'You need all three tasks defined as PythonOperators.' }
      }
      return { success: true, message: 'The pipeline now runs on a schedule, in the right order, every time.' }
    },
  },

  {
    id: 'dr-07-airflow-debug',
    kind: 'code',
    language: 'python',
    npc: 'Pipeline Pete',
    title: 'The Backwards Pipeline',
    prompt: 'This DAG loads data before it\'s even been extracted or transformed — the dependency order is backwards. Fix it so extract runs first, then transform, then load.',
    starter: BROKEN_AIRFLOW_DAG,
    runLabel: 'Parse DAG',
    simulate(code) {
      const flat = code.replace(/\s+/g, ' ')
      const ok = /extract\s*>>\s*transform\s*>>\s*load/.test(flat)
      return ok
        ? 'DAG "daily_pipeline" parsed successfully. 3 tasks, 2 dependencies.'
        : 'DAG parses, but task execution order does not match the intended pipeline'
    },
    hints: [
      'The current line reads `load >> extract >> transform` — that runs load first, which is backwards.',
      'The correct order is extract, then transform, then load.',
      'extract >> transform >> load',
    ],
    xp: 70,
    tool: { name: 'Airflow dependency order', icon: '↔️', description: 'The >> chain is read left-to-right as execution order — get it backwards and everything runs in the wrong sequence.', fun: 3 },
    check({ code }) {
      const flat = code.replace(/\s+/g, ' ')
      if (!/extract\s*>>\s*transform\s*>>\s*load/.test(flat)) {
        return { success: false, message: 'Still not in the right order — it should read extract >> transform >> load.' }
      }
      return { success: true, message: 'Extract, then transform, then load. The pipeline finally runs in the right order.' }
    },
  },

  {
    id: 'dr-08-star-schema-process',
    kind: 'sequence',
    npc: 'Councillor Floe',
    title: 'Designing a Star Schema',
    prompt: 'Order the steps for designing a star schema data model, from first decision to final structure.',
    items: [
      { id: 'grain', label: 'Identify the grain (one row = what?)' },
      { id: 'dims', label: 'Identify the dimensions (who, what, where, when)' },
      { id: 'facts', label: 'Identify the facts (the numbers to measure)' },
      { id: 'build', label: 'Build the fact table with foreign keys to each dimension' },
    ],
    correctOrder: ['grain', 'dims', 'facts', 'build'],
    successMessage: 'Grain first, always. Everything else follows from what one row actually represents.',
    hints: [
      'Every star schema design starts by answering: what does a single row in the fact table represent?',
      'Dimensions (descriptive context) and facts (numbers) both get identified before you build anything.',
      'Identify the grain → Identify the dimensions → Identify the facts → Build the fact table with foreign keys',
    ],
    xp: 70,
    tool: { name: 'Star schema design', icon: '⭐', description: 'Grain → dimensions → facts → fact table with FKs — the standard dimensional modeling process.', fun: 4 },
  },

  {
    id: 'dr-09-spark-job',
    kind: 'sequence',
    npc: 'Councillor Floe',
    title: 'A Spark Job, Step by Step',
    prompt: 'Order the stages of a Spark batch job that reads raw data and lands a clean aggregate in the warehouse.',
    items: [
      { id: 'read', label: 'Read from S3' },
      { id: 'filter', label: 'Filter invalid rows' },
      { id: 'aggregate', label: 'Aggregate' },
      { id: 'write', label: 'Write to Snowflake' },
    ],
    correctOrder: ['read', 'filter', 'aggregate', 'write'],
    successMessage: 'Read, clean, summarize, land it. The shape of almost every batch job.',
    hints: [
      'You can\'t filter or aggregate data you haven\'t read yet, and writing is always the last step.',
      'Clean the data (filter) before you summarize it (aggregate).',
      'Read from S3 → Filter invalid rows → Aggregate → Write to Snowflake',
    ],
    xp: 65,
    tool: { name: 'Spark batch job', icon: '✨', description: 'Read → transform → write — the shape of a Spark DataFrame pipeline.', fun: 3 },
  },

  {
    id: 'dr-10-batch-vs-streaming',
    kind: 'sequence',
    npc: 'Pipeline Pete',
    title: 'Choosing Batch or Streaming',
    prompt: 'Order the decision process for routing a new data source to the right kind of pipeline.',
    items: [
      { id: 'latency', label: 'Ask: how fresh does this data need to be?' },
      { id: 'realtime', label: 'If seconds matter → route to Kafka + Spark Streaming' },
      { id: 'batch', label: 'If daily is fine → route to Airflow batch job' },
      { id: 'land', label: 'Either way, land the result in the warehouse' },
    ],
    correctOrder: ['latency', 'realtime', 'batch', 'land'],
    successMessage: 'Freshness requirement first — it decides the whole architecture, not the other way around.',
    hints: [
      'The very first question is always about the business requirement, not the tools.',
      'Real-time needs stream processing; anything that can wait a day is a batch job.',
      'Ask the latency requirement → route real-time needs to streaming → route everything else to batch → land it in the warehouse either way',
    ],
    xp: 70,
    tool: { name: 'Batch vs streaming', icon: '🚦', description: 'Let the freshness requirement decide the architecture, not habit.', fun: 4 },
  },

  {
    id: 'dr-11-dbt-tests',
    kind: 'code',
    language: 'yaml',
    npc: 'Transform Tara',
    title: 'Trusting the Data',
    prompt: 'Write a dbt schema test file for the orders model: order_id must be unique and not null, and amount must not be null.',
    starter: 'models:\n  - name: stg_orders\n    columns:\n      - name: order_id\n        tests:\n          # add tests here\n      - name: amount\n        tests:\n          # add tests here\n',
    runLabel: 'Run Tests',
    simulate(code) {
      const hasUnique = /unique/.test(code)
      const hasNotNull = /not_null/.test(code)
      return hasUnique && hasNotNull
        ? 'Running 3 data tests... PASS=3 WARN=0 ERROR=0'
        : 'Running data tests... some columns have no tests defined'
    },
    hints: [
      'dbt\'s built-in generic tests are just names under a column\'s `tests:` list — unique and not_null are the two most common.',
      'order_id needs both `unique` and `not_null`; amount just needs `not_null`.',
      "- name: order_id\n  tests:\n    - unique\n    - not_null\n- name: amount\n  tests:\n    - not_null",
    ],
    xp: 75,
    tool: { name: 'dbt tests', icon: '✅', description: 'unique, not_null, accepted_values, relationships — data quality checks as config, not code.', fun: 4 },
    check({ code }) {
      if (!/unique/.test(code)) return { success: false, message: 'order_id needs a `unique` test.' }
      if ((code.match(/not_null/g) || []).length < 2) {
        return { success: false, message: 'Both order_id and amount need a `not_null` test.' }
      }
      return { success: true, message: 'Now a broken pipeline gets caught by a failing test, not by a customer complaint.' }
    },
  },

  {
    id: 'dr-12-full-stack',
    kind: 'sequence',
    npc: 'Councillor Floe',
    title: 'The Modern Data Stack',
    prompt: 'Order every layer of a complete modern data platform, from raw ingestion to the dashboard someone actually looks at.',
    items: [
      { id: 'ingest', label: 'Fivetran (ingestion)' },
      { id: 'storage', label: 'Snowflake (storage)' },
      { id: 'transform', label: 'dbt (transformation)' },
      { id: 'orchestrate', label: 'Airflow (orchestration)' },
      { id: 'viz', label: 'Tableau (visualization)' },
      { id: 'realtime', label: 'Kafka + Flink (real-time layer, alongside batch)' },
    ],
    correctOrder: ['ingest', 'storage', 'transform', 'orchestrate', 'viz', 'realtime'],
    successMessage: 'Every layer of the stack, in the order data actually flows through it.',
    hints: [
      'This mirrors the ELT pipeline you already built, plus orchestration tying it together and a real-time layer running alongside it.',
      'Data gets ingested, stored, transformed, and orchestrated before it ever reaches a dashboard.',
      'Fivetran → Snowflake → dbt → Airflow → Tableau → Kafka + Flink',
    ],
    xp: 90,
    tool: { name: 'Modern data stack', icon: '🏗️', description: 'Ingestion, storage, transformation, orchestration, visualization, and a real-time layer, working together.', fun: 5 },
  },

  {
    id: 'dr-13-partitioning',
    kind: 'code',
    language: 'sql',
    npc: 'Councillor Floe',
    title: 'Why Is This Query So Slow',
    prompt: 'This query scans the entire 10TB events table just to get one day of data. Rewrite the table definition to cluster by event_date so queries like this scan far less data.',
    starter: 'create table events (\n  event_id int,\n  event_date date,\n  payload variant\n);\n',
    runLabel: 'Run DDL',
    simulate(code) {
      const ok = /cluster by\s*\(\s*event_date\s*\)/i.test(code)
      return ok
        ? 'Table EVENTS created. Clustering key: (EVENT_DATE). Future date-filtered queries will prune partitions automatically.'
        : 'Table EVENTS created. No clustering key — queries will scan the full table every time.'
    },
    hints: [
      'Snowflake (and most warehouses) let you declare a clustering/partition key so the engine can skip data that can\'t match your filter.',
      'Add a CLUSTER BY clause naming the column you filter on most — event_date.',
      'create table events (\n  event_id int,\n  event_date date,\n  payload variant\n) cluster by (event_date);',
    ],
    xp: 80,
    tool: { name: 'Partitioning & clustering', icon: '📊', description: 'Cluster/partition by the column you filter on most, so the engine can skip data that can\'t match.', fun: 3 },
    check({ code }) {
      if (!/cluster by\s*\(\s*event_date\s*\)/i.test(code)) {
        return { success: false, message: 'Add a CLUSTER BY (event_date) clause to the table definition.' }
      }
      return { success: true, message: 'Same query, a fraction of the data scanned. The bill (and the wait) just got much smaller.' }
    },
  },

  {
    id: 'dr-14-incident-response',
    kind: 'sequence',
    npc: 'Pipeline Pete',
    title: 'When the Pipeline Breaks',
    prompt: 'Order the incident-response flow for when a data pipeline actually fails.',
    items: [
      { id: 'sla', label: 'Airflow SLA miss detected' },
      { id: 'alert', label: 'Alert fires' },
      { id: 'page', label: 'PagerDuty pages the on-call engineer' },
      { id: 'test', label: 'dbt test failure confirms which data is bad' },
      { id: 'dashboard', label: 'Dashboard flags the affected data as stale' },
    ],
    correctOrder: ['sla', 'alert', 'page', 'test', 'dashboard'],
    successMessage: 'Detected, alerted, paged, diagnosed, and flagged for anyone looking at the dashboard — nobody trusts bad data by accident.',
    hints: [
      'The failure has to be detected before anyone can be alerted.',
      'A human gets paged before the specific broken data gets diagnosed via failing tests.',
      'SLA miss detected → Alert fires → On-call paged → dbt test confirms the bad data → Dashboard flags it as stale',
    ],
    xp: 75,
    tool: { name: 'Pipeline monitoring', icon: '🚨', description: 'SLA monitoring, alerting, and failing tests catch bad data before it misleads anyone.', fun: 4 },
  },

  {
    id: 'dr-15-final-boss',
    kind: 'sequence',
    npc: 'Councillor Floe',
    title: 'Rebuilding the Data Realm',
    prompt: 'The Data Council\'s entire platform collapsed. Rebuild it from scratch, in the order data would actually flow through it.',
    items: [
      { id: 'source', label: 'Source Systems' },
      { id: 'ingest', label: 'Fivetran Ingestion' },
      { id: 'raw', label: 'Snowflake Raw Layer' },
      { id: 'transform', label: 'dbt Transformation' },
      { id: 'test', label: 'dbt Tests Validate the Data' },
      { id: 'orchestrate', label: 'Airflow Orchestrates the Whole Run' },
      { id: 'viz', label: 'Tableau Dashboards Go Live' },
    ],
    correctOrder: ['source', 'ingest', 'raw', 'transform', 'test', 'orchestrate', 'viz'],
    successMessage: 'Every dashboard in the realm lights back up at once. The Data Realm is whole again.',
    hints: [
      'This is everything you\'ve learned in this zone, chained together in the order data actually moves.',
      'Tests validate the transformed data before anyone trusts it enough to schedule and visualize it.',
      'Source Systems → Fivetran → Snowflake Raw → dbt Transform → dbt Tests → Airflow Orchestration → Tableau',
    ],
    xp: 220,
    tool: { name: 'Data Architect', icon: '🏛️', description: 'Rebuilt an entire modern data platform, source to dashboard.', fun: 5 },
  },
  {
    id: 'dr-bonus-pipeline-lied',
    kind: 'sequence',
    bonus: true,
    npc: 'Transform Tara',
    title: 'The Pipeline That Lied',
    prompt: 'Every dashboard said the numbers were fine. They weren\'t — a silent schema change upstream had been feeding garbage into the warehouse for a week and nothing caught it. Build the checks that would have caught it.',
    items: [
      { id: 'ge', label: 'Add Great Expectations checks on raw data' },
      { id: 'dbttests', label: 'Add dbt tests on every model' },
      { id: 'sla', label: 'Set Airflow SLA-miss alerts' },
      { id: 'slack', label: 'Send a Slack notification on any failed check' },
    ],
    correctOrder: ['ge', 'dbttests', 'sla', 'slack'],
    successMessage: 'Great Expectations catches the bad data coming in raw, dbt tests catch anything that slips past transformation, Airflow flags the run for missing its window, and Slack tells the team the second any of it trips. The lie stops before it reaches a dashboard.',
    hints: [
      'Check the data as early as possible in the pipeline — raw, before it\'s transformed.',
      'dbt tests validate the transformed models after Great Expectations has already screened the raw input; the notification is what ties every check back to a human.',
      'Great Expectations (raw data) → dbt Tests (every model) → Airflow SLA-Miss Alerts → Slack Notification on Failure',
    ],
    xp: 190,
    tool: { name: 'Data Quality Guardian', icon: '🔍', description: 'Built the checks that catch a lying pipeline before anyone trusts its dashboard.', fun: 4 },
  },
]

export const DATA_REALM_ZONE = {
  id: 'data-realm',
  name: 'Data Realm',
  palette: { bg: '#0b1220', ground: 0x1e293b, groundAccent: 0x334155 },
  decor: { kind: 'server' },
  npcIntro: {
    name: 'Councillor Floe',
    lines: [
      "Welcome to the Data Realm, Ziro.",
      "Every pipeline here is clogged. Data isn't flowing from sources to the warehouse. Every dashboard in the realm is blank.",
      "Think of it like this: our farms — the sources — still grow the food. But if there's no road to the market, nobody eats, no matter how much food exists. Every dark dashboard you've seen is a market with no road leading to it.",
      "We have the tools — Snowflake, dbt, Kafka, Airflow — but nothing is connected correctly anymore.",
      "Help us rebuild the pipelines, piece by piece. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Councillor Floe', color: 0x38bdf8, role: 'main' },
    { x: 2020, y: 560, name: 'Pipeline Pete', color: 0xf97316, flavor: 'Every pipe in this realm needs reconnecting. Kafka, Airflow — pick a chest and let\'s get flowing again.' },
    { x: 260, y: 860, name: 'Transform Tara', color: 0xa78bfa, flavor: 'The data isn\'t wrong, it\'s just raw. dbt turns raw into trustworthy.' },
    { x: 2020, y: 1160, name: 'Viz Vera', color: 0xf472b6, flavor: 'A pipeline nobody can see the output of might as well not exist. Let\'s get these dashboards live again.' },
  ],
  challenges: DATA_REALM_CHALLENGES,
  nextZone: 'cloud-citadel',
}
