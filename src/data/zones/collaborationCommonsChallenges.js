// Collaboration Commons — the bonus 13th zone (Jira, Confluence, Slack,
// agile/scrum, Notion, OKRs). Reuses 'sequence', 'code' (markdown/javascript),
// and 'python' — no new panel types, same pattern as every other zone.
//
// Scope note: the original spec called for this to unlock after "any 6 of
// the 12 main zones" (a branching unlock). This build's zone-progression is
// a single linear nextZone chain, so instead this is wired as the epilogue
// after all 12 main zones (security-stronghold → collaboration-commons) —
// simpler than adding branching unlock logic, and the player reaches it
// either way in a normal playthrough.

import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

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

const BAD_TICKET = '# Fix the bug\n\nIt\'s broken, please fix.\n'

export const COLLABORATION_COMMONS_CHALLENGES = [
  {
    id: 'cc-01-jira-setup',
    kind: 'sequence',
    npc: 'Team Lead Maya',
    title: '47 Things, All in Her Head',
    prompt: 'Order how a Jira project actually gets set up, from a giant idea down to a board anyone can look at.',
    items: [
      { id: 'epic', label: 'Break the epic into individual stories' },
      { id: 'points', label: 'Estimate story points for each' },
      { id: 'priority', label: 'Set priority on each story' },
      { id: 'board', label: 'Populate the kanban board' },
    ],
    correctOrder: ['epic', 'points', 'priority', 'board'],
    successMessage: 'Broken down, estimated, prioritized, and finally visible on a board. Nothing lives only in Maya\'s head anymore.',
    hints: [
      'A giant epic has to be broken into workable pieces before any of them can be estimated.',
      'Priority and estimates both exist before anything shows up organized on a board.',
      'Break epic into stories → Estimate story points → Set priority → Populate the kanban board',
    ],
    xp: 55,
    tool: { name: 'Jira project setup', icon: '📌', description: 'Epic → stories → points → priority → board — turning one big idea into trackable work.', fun: 3 },
  },

  {
    id: 'cc-02-write-ticket',
    kind: 'code',
    language: 'markdown',
    npc: 'Team Lead Maya',
    title: 'A Ticket That Actually Helps',
    prompt: 'This ticket says "Fix the bug. It\'s broken, please fix." — nobody can act on that. Rewrite it with a clear title, steps to reproduce, expected vs. actual behavior, and acceptance criteria.',
    starter: BAD_TICKET,
    runLabel: 'Submit Ticket',
    simulate(code) {
      const hasSteps = /steps to reproduce/i.test(code)
      const hasExpected = /expected/i.test(code) && /actual/i.test(code)
      const hasCriteria = /acceptance criteria/i.test(code)
      const ok = hasSteps && hasExpected && hasCriteria
      return ok
        ? 'Ticket submitted. Engineering picked it up within the hour.'
        : 'Ticket submitted. Engineering commented: "Can you clarify what\'s actually happening?"'
    },
    hints: [
      'A useful ticket answers: what did you do, what did you expect, what actually happened, and when is this considered done?',
      'Include headers for "Steps to Reproduce", "Expected vs. Actual", and "Acceptance Criteria".',
      '# Login button does nothing on Safari\n\n## Steps to Reproduce\n1. Open the site in Safari\n2. Click "Log In"\n\n## Expected\nThe login modal opens.\n\n## Actual\nNothing happens, no console error.\n\n## Acceptance Criteria\n- [ ] Login modal opens in Safari, Chrome, and Firefox',
    ],
    xp: 65,
    tool: { name: 'Well-written tickets', icon: '🎫', description: 'Steps to reproduce, expected vs. actual, and acceptance criteria — the difference between a ticket and a shrug.', fun: 3 },
    check({ code }) {
      if (!/steps to reproduce/i.test(code)) return { success: false, message: 'Add a "Steps to Reproduce" section.' }
      if (!/expected/i.test(code) || !/actual/i.test(code)) return { success: false, message: 'Include both what you expected and what actually happened.' }
      if (!/acceptance criteria/i.test(code)) return { success: false, message: 'Add an "Acceptance Criteria" section so everyone knows when this is done.' }
      return { success: true, message: 'Now anyone on the team can pick this up without asking a single follow-up question.' }
    },
  },

  {
    id: 'cc-03-sprint-planning',
    kind: 'sequence',
    npc: 'Agile Coach Ari',
    title: 'Not Overcommitting, For Once',
    prompt: 'Order a sprint planning session, from looking at the backlog to actually committing.',
    items: [
      { id: 'review', label: 'Review the backlog by priority' },
      { id: 'capacity', label: 'Check the team\'s velocity/capacity' },
      { id: 'select', label: 'Select items that fit within capacity' },
      { id: 'goal', label: 'Set a clear sprint goal' },
      { id: 'commit', label: 'Commit as a team' },
    ],
    correctOrder: ['review', 'capacity', 'select', 'goal', 'commit'],
    successMessage: 'Picked by priority, bounded by real capacity, aimed at one clear goal. That\'s a sprint that won\'t blow up.',
    hints: [
      'You review what\'s important before you decide how much of it fits.',
      'Knowing the team\'s velocity is what keeps item selection honest instead of hopeful.',
      'Review backlog priority → Check velocity/capacity → Select items that fit → Set a sprint goal → Commit as a team',
    ],
    xp: 65,
    tool: { name: 'Sprint planning', icon: '🗓️', description: 'Priority, then capacity, then selection, then a goal — never the other order.', fun: 3 },
  },

  {
    id: 'cc-04-confluence-wiki',
    kind: 'sequence',
    npc: 'Wiki Wren',
    title: 'A Wiki Nobody Can Find Anything In',
    prompt: 'Order building a proper Confluence space, from the front door to the detailed records.',
    items: [
      { id: 'home', label: 'Home page (where do I even start?)' },
      { id: 'overview', label: 'Team overview page' },
      { id: 'howwework', label: '"How We Work" page' },
      { id: 'projects', label: 'Individual project pages' },
      { id: 'notes', label: 'Meeting notes template' },
    ],
    correctOrder: ['home', 'overview', 'howwework', 'projects', 'notes'],
    successMessage: 'A home page that actually leads somewhere, and a template so meeting notes stop vanishing into the void.',
    hints: [
      'Someone arriving needs a home page before anything else makes sense to them.',
      'General team info comes before the specifics of any one project.',
      'Home page → Team overview → How We Work → Project pages → Meeting notes template',
    ],
    xp: 60,
    tool: { name: 'Wiki information architecture', icon: '📖', description: 'General to specific — home, team, process, projects, then the day-to-day notes.', fun: 3 },
  },

  {
    id: 'cc-05-slack-workflow',
    kind: 'code',
    language: 'javascript',
    npc: 'Slack Stan',
    title: 'Automating the Morning Nag',
    prompt: 'Someone manually posts a standup reminder every morning and copies responses by hand. Write buildStandupWorkflow() returning a config object with a scheduled trigger, a step that collects responses, and a step that posts a summary to the channel.',
    starter: 'function buildStandupWorkflow() {\n  // return { trigger: ..., steps: [...] }\n}\n',
    runLabel: 'Deploy Workflow',
    simulate(code) {
      const ok = /schedul/i.test(code) && /collect/i.test(code) && /summary/i.test(code)
      return ok
        ? '9:00 AM — reminder posted. 9:15 AM — responses collected. 9:16 AM — summary posted to #team-standup.'
        : 'Workflow deployed, but something\'s missing — no summary appeared this morning.'
    },
    hints: [
      'The workflow needs three pieces: something that fires on a schedule, a step that gathers responses, and a step that summarizes them back to the channel.',
      'Structure it as an object: { trigger: "scheduled", steps: [...] } with a collect step and a summary/post step.',
      "function buildStandupWorkflow() {\n  return {\n    trigger: 'scheduled_9am',\n    steps: [\n      { type: 'collect_responses', channel: '#team-standup' },\n      { type: 'post_summary', channel: '#team-standup' },\n    ],\n  };\n}",
    ],
    xp: 75,
    tool: { name: 'Slack workflow automation', icon: '🤖', description: 'Scheduled trigger → collect responses → post summary — no more manual nagging.', fun: 4 },
    check({ code }) {
      if (!/function buildStandupWorkflow/.test(code)) return { success: false, message: 'Define the function buildStandupWorkflow().' }
      if (!/schedul/i.test(code)) return { success: false, message: 'The workflow needs a scheduled trigger.' }
      if (!/collect/i.test(code)) return { success: false, message: 'Add a step that collects responses.' }
      if (!/summary/i.test(code)) return { success: false, message: 'Add a step that posts a summary.' }
      return { success: true, message: 'Standup runs itself now. Nobody has to remember to post or collect anything by hand.' }
    },
  },

  {
    id: 'cc-06-agile-vs-waterfall',
    kind: 'sequence',
    npc: 'Agile Coach Ari',
    title: 'Adjusting Before It\'s Too Late',
    prompt: 'Order Company B\'s agile approach — the one that catches a wrong direction early instead of after a 6-month build.',
    items: [
      { id: 'plan', label: 'Plan a 2-week sprint' },
      { id: 'build', label: 'Build and demo the result' },
      { id: 'feedback', label: 'Gather real feedback' },
      { id: 'adjust', label: 'Adjust course in the next sprint' },
    ],
    correctOrder: ['plan', 'build', 'feedback', 'adjust'],
    successMessage: 'Small plan, quick build, real feedback, fast correction. Company A won\'t know it built the wrong thing for another five months.',
    hints: [
      'Nothing to demo or get feedback on until a short cycle of planned work is actually built.',
      'Feedback has to come in before the NEXT sprint can be adjusted based on it.',
      'Plan a 2-week sprint → Build and demo → Gather feedback → Adjust next sprint',
    ],
    xp: 60,
    tool: { name: 'Agile iteration', icon: '🔁', description: 'Short cycles mean a wrong turn costs two weeks, not six months.', fun: 4 },
  },

  {
    id: 'cc-07-retrospective',
    kind: 'sequence',
    npc: 'Agile Coach Ari',
    title: 'Running a Retro That Changes Something',
    prompt: 'Order a sprint retrospective, from opening it up to actually walking away with something to do.',
    items: [
      { id: 'well', label: 'Discuss what went well' },
      { id: 'poorly', label: 'Discuss what didn\'t go well' },
      { id: 'improve', label: 'Discuss what to improve' },
      { id: 'actions', label: 'Pick concrete action items' },
    ],
    correctOrder: ['well', 'poorly', 'improve', 'actions'],
    successMessage: 'Celebrated what worked, named what didn\'t, talked through fixes, and walked out with real action items — not just a vibe.',
    hints: [
      'Starting positive (what went well) before what went wrong keeps the conversation constructive.',
      'You can\'t pick action items before you\'ve actually discussed what needs improving.',
      'What went well → What didn\'t → What to improve → Concrete action items',
    ],
    xp: 55,
    tool: { name: 'Sprint retrospective', icon: '🔍', description: 'Well, not-well, improve, action items — a retro that ends in something changing.', fun: 3 },
  },

  {
    id: 'cc-08-notion-allinone',
    kind: 'sequence',
    npc: 'Notion Nate',
    title: 'One Tool Instead of Three',
    prompt: 'A startup can\'t afford separate Jira and Confluence licenses. Order setting up Notion as an all-in-one replacement.',
    items: [
      { id: 'tasks', label: 'Task database with a kanban view' },
      { id: 'wiki', label: 'Team wiki pages' },
      { id: 'tracker', label: 'Project tracker page' },
      { id: 'notes', label: 'Meeting notes, all linked together' },
    ],
    correctOrder: ['tasks', 'wiki', 'tracker', 'notes'],
    successMessage: 'One tool, everything linked — tasks, docs, projects, and notes, all in the same place instead of three different logins.',
    hints: [
      'The task database is the foundation everything else references.',
      'Meeting notes come last because they typically link back to tasks and projects already in the system.',
      'Task database (kanban) → Team wiki → Project tracker → Meeting notes (linked to everything else)',
    ],
    xp: 65,
    tool: { name: 'Notion as all-in-one', icon: '🗂️', description: 'Flexible enough to replace a task tracker AND a wiki, all cross-linked in one place.', fun: 3 },
  },

  {
    id: 'cc-09-okrs',
    kind: 'python',
    npc: 'Team Lead Maya',
    title: 'Are We Working on the Right Things?',
    prompt: "The team has three Key Results this quarter, each with a current and target value: kr1 = {'current': 40, 'target': 100}, kr2 = {'current': 80, 'target': 80}, kr3 = {'current': 10, 'target': 50}. Compute each KR's percent complete (current/target*100), and the Objective's overall progress as the average of the three. Store result = {'kr_percentages': [..three floats..], 'objective_progress': ...average...}.",
    starter: "kr1 = {'current': 40, 'target': 100}\nkr2 = {'current': 80, 'target': 80}\nkr3 = {'current': 10, 'target': 50}\n\nresult = {}  # compute kr_percentages and objective_progress\n",
    hints: [
      'Each KR\'s percent complete is just current / target * 100.',
      'The objective\'s overall progress is the plain average (mean) of the three KR percentages.',
      "krs = [kr1, kr2, kr3]\npercentages = [kr['current'] / kr['target'] * 100 for kr in krs]\nresult = {'kr_percentages': percentages, 'objective_progress': sum(percentages) / len(percentages)}",
    ],
    xp: 80,
    tool: { name: 'OKR progress tracking', icon: '🎯', description: 'Percent-complete per Key Result, averaged into one Objective progress number.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, {
      kr_percentages: [40, 100, 20],
      objective_progress: 53.333333333333336,
    }, 0.01) ?? { success: true, message: 'Now "are we on track" is a number, not a vibe — 53% toward the objective this quarter.' },
  },

  {
    id: 'cc-10-final-boss',
    kind: 'sequence',
    npc: 'Team Lead Maya',
    title: 'The Team\'s Complete Operating System',
    prompt: 'Set up the Commons\' complete team workflow from scratch, start to finish.',
    items: [
      { id: 'jira', label: 'Jira project (epics + backlog)' },
      { id: 'confluence', label: 'Confluence space, linked to Jira' },
      { id: 'slack', label: 'Slack channel with Jira + GitHub integrations' },
      { id: 'sprint', label: 'Sprint planning process' },
      { id: 'retro', label: 'Retrospective template' },
      { id: 'notion', label: 'Notion for async decisions' },
    ],
    correctOrder: ['jira', 'confluence', 'slack', 'sprint', 'retro', 'notion'],
    successMessage: 'Now THIS is how teams work. Every piece connected, nothing living only in someone\'s head.',
    hints: [
      'The work-tracking foundation (Jira) and its linked docs (Confluence) come before the communication layer that references them.',
      'Sprint planning and retros are ongoing processes that run ON TOP of the tools you\'ve already set up — they come after the tooling, not before.',
      'Jira → Confluence (linked) → Slack (integrated) → Sprint planning → Retro template → Notion for async decisions',
    ],
    xp: 220,
    tool: { name: 'Team Orchestrator', icon: '🧭', description: 'Jira, Confluence, Slack, sprint planning, retros, and Notion — one coherent team operating system.', fun: 5 },
  },
]

export const COLLABORATION_COMMONS_ZONE = {
  id: 'collaboration-commons',
  name: 'Collaboration Commons',
  palette: { bg: '#fef9e7', ground: 0xfde9b8, groundAccent: 0xfbbf24 },
  decor: { kind: 'studio' },
  npcIntro: {
    name: 'Team Lead Maya',
    lines: [
      "Welcome to the Commons, Ziro — where every team on Tech Planet is supposed to coordinate.",
      "Supposed to. Nobody knows who's working on what, meetings have no agenda, and our wiki is a graveyard of outdated docs.",
      "None of this is really about the tools — Jira, Slack, a wiki, these are just places to put information. The actual problem is that nobody agreed on where information should live, so it lives everywhere and nowhere at once.",
      "Decisions get made in the hallway and forgotten by lunch. We're all busy, and somehow nothing moves.",
      "Help us bring some structure to the madness — not bureaucracy, just enough that things actually get done. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Team Lead Maya', color: 0xf97316, role: 'main' },
    { x: 2020, y: 560, name: 'Wiki Wren', color: 0x22c55e, flavor: 'A wiki nobody updates is worse than no wiki at all. Let\'s make ours worth trusting.' },
    { x: 260, y: 860, name: 'Slack Stan', color: 0x0ea5e9, flavor: 'If a human has to remember to do it every day, a workflow should be doing it instead.' },
    { x: 2020, y: 1160, name: 'Agile Coach Ari', color: 0xa78bfa, flavor: 'Agile isn\'t a ceremony checklist — it\'s just "build a little, learn, adjust." That\'s it.' },
  ],
  challenges: COLLABORATION_COMMONS_CHALLENGES,
  nextZone: null,
}
