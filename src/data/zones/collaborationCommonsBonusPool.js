import { pyGet } from '../../utils/pyValue.js'
import { deepEqual } from '../../utils/pyCheck.js'

// The bonus reserve pool for Collaboration Commons — 2x its 10 real chest
// positions. Once a chest is solved and the player moves past it via
// "Next", that chest's challenge gets replaced with one drawn from here
// (see gameStore.js's BONUS_POOLS registry / swapChallenge /
// getLiveChallenges), same mechanic as every other zone in this rollout.
// Pre-authored, never AI-generated at runtime.
//
// Ids use the `comm-pool-` prefix rather than `cc-pool-` — Collaboration
// Commons' own challenges happen to share the `cc-` id prefix with Cloud
// Citadel (an existing, unrelated coincidence in this codebase), and
// Cloud Citadel's bonus pool already uses `cc-pool-*`. Using a distinct
// prefix here avoids any id collision between the two zones' pools.
//
// Split three ways:
//   - 7 hands-on (2x kind: 'python' — same checkResult/pyGet convention
//     the main pool's cc-09-okrs challenge uses; 2x kind: 'code'
//     (markdown/javascript), same pattern-checked convention as the main
//     pool's cc-02/cc-05; 3x kind: 'sequence') covering ground the main
//     10 don't: a sprint burndown calculation, a Kanban WIP-limit check,
//     writing an Architecture Decision Record, building a meeting-agenda
//     generator, Definition of Done, backlog refinement, and an RFC/
//     decision-making process.
//   - 7 MCQ (kind: 'mcq') on team-collaboration concepts with no single
//     runnable snippet of their own: the RACI matrix, Scrum vs. Kanban,
//     async vs. sync communication tradeoffs, story points vs. hour
//     estimates, the SBI feedback framework, Definition of Done vs.
//     Definition of Ready, and Kanban WIP limits.
//   - 6 matching (kind: 'matching') pairing terms across meeting types,
//     agile ceremonies, documentation types, collaboration tool
//     purposes, user story components, and RACI roles.

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

export const COLLABORATION_COMMONS_BONUS_POOL = [
  // ---------- hands-on: python / code / sequence ----------
  {
    id: 'comm-pool-01-burndown',
    kind: 'python',
    npc: 'Agile Coach Ari',
    title: 'Are We On Track to Finish the Sprint?',
    prompt: "A 10-day sprint started with 80 story points. remaining_by_day = [80, 74, 68, 65, 55, 50, 40, 32, 20, 8] — points remaining at the end of each day. Compute the ideal remaining-points value for each day if work burned down perfectly linearly from 80 to 0 over 10 days (day 1 = 72, day 2 = 64, ... day 10 = 0), and store that ideal list in `result`.",
    starter: 'total_points = 80\nsprint_days = 10\nresult = []\n',
    hints: [
      'A perfectly linear burndown drops by the same amount each day: total_points / sprint_days per day.',
      'For day i (1-indexed), the ideal remaining is total_points - (total_points / sprint_days) * i.',
      "ideal_per_day = total_points / sprint_days\nresult = [round(total_points - ideal_per_day * day, 2) for day in range(1, sprint_days + 1)]",
    ],
    xp: 75,
    tool: { name: 'Sprint burndown', icon: '📉', description: 'The ideal line drops evenly to zero — comparing actual remaining work against it is how a burndown chart reveals whether a sprint is on track.', fun: 4 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, [72, 64, 56, 48, 40, 32, 24, 16, 8, 0], 0.01) ?? { success: true, message: 'That\'s the ideal line — plot the real remaining_by_day next to it and you can see exactly which days fell behind.' },
  },
  {
    id: 'comm-pool-02-wip-limit',
    kind: 'python',
    npc: 'Agile Coach Ari',
    title: 'Too Many Things "In Progress" at Once',
    prompt: "This Kanban board's 'In Progress' column has a WIP (work-in-progress) limit of 3, meant to stop the team from starting more than it can actually finish. in_progress = ['Fix login bug', 'Update docs', 'Refactor API', 'Add dark mode', 'Write tests']. Determine whether the column is currently OVER its WIP limit, and by how many items. Store result = {'over_limit': ..bool.., 'excess': ..int..} (excess should be 0 if not over).",
    starter: "in_progress = ['Fix login bug', 'Update docs', 'Refactor API', 'Add dark mode', 'Write tests']\nwip_limit = 3\nresult = {}\n",
    hints: [
      'Compare len(in_progress) against wip_limit — if it\'s greater, the column is over the limit.',
      'The excess is simply how many items are beyond the limit: max(0, len(in_progress) - wip_limit).',
      "count = len(in_progress)\nexcess = max(0, count - wip_limit)\nresult = {'over_limit': count > wip_limit, 'excess': excess}",
    ],
    xp: 70,
    tool: { name: 'Kanban WIP limits', icon: '🚦', description: 'A WIP limit caps how many items can be in progress at once — forcing the team to finish things before starting new ones, instead of starting everything and finishing nothing.', fun: 3 },
    check: ({ pyodide, error }) => checkResult(pyodide, error, { over_limit: true, excess: 2 }) ?? { success: true, message: '5 items against a limit of 3 — 2 over. Someone needs to finish something before starting anything new.' },
  },
  {
    id: 'comm-pool-03-adr',
    kind: 'code',
    language: 'markdown',
    npc: 'Wiki Wren',
    title: 'A Decision Nobody Wrote Down',
    prompt: 'The team switched from REST to GraphQL six months ago, and now a new hire keeps asking "wait, why did we do that?" — nobody wrote it down. Write an Architecture Decision Record (ADR) with sections for Status, Context, Decision, and Consequences.',
    starter: '# ADR: (title here)\n\n(fill in Status, Context, Decision, and Consequences sections)\n',
    runLabel: 'Submit ADR',
    simulate(code) {
      const hasStatus = /##?\s*status/i.test(code)
      const hasContext = /##?\s*context/i.test(code)
      const hasDecision = /##?\s*decision/i.test(code)
      const hasConsequences = /##?\s*consequences/i.test(code)
      const ok = hasStatus && hasContext && hasDecision && hasConsequences
      return ok
        ? 'ADR published to the wiki. The next person who asks "why GraphQL?" gets linked to an answer instead of a shrug.'
        : 'ADR published, but incomplete — a teammate asks "this doesn\'t say why we didn\'t just stick with REST."'
    },
    hints: [
      'An ADR has four standard sections: Status (accepted/proposed/superseded), Context (the situation that forced a decision), Decision (what was chosen), and Consequences (the tradeoffs, good and bad).',
      'Use a markdown heading for each of the four sections: Status, Context, Decision, Consequences.',
      '# ADR-001: Adopt GraphQL for the public API\n\n## Status\nAccepted\n\n## Context\nOur REST API was over-fetching data on mobile, requiring many round trips.\n\n## Decision\nAdopt GraphQL for the public API, letting clients request exactly the fields they need.\n\n## Consequences\nFaster mobile responses, but a steeper learning curve for new engineers and more complex server-side resolver code.',
    ],
    xp: 65,
    tool: { name: 'Architecture Decision Record (ADR)', icon: '📄', description: 'Status, Context, Decision, Consequences — a written record of WHY a decision was made, so it never has to be re-litigated from memory.', fun: 3 },
    check({ code }) {
      const hasStatus = /##?\s*status/i.test(code)
      const hasContext = /##?\s*context/i.test(code)
      const hasDecision = /##?\s*decision/i.test(code)
      const hasConsequences = /##?\s*consequences/i.test(code)
      if (!hasStatus || !hasContext || !hasDecision || !hasConsequences) {
        return { success: false, message: 'An ADR needs all four sections: Status, Context, Decision, and Consequences.' }
      }
      return { success: true, message: 'Now the "why" behind this decision lives in the wiki, not just in whoever happened to be in the room.' }
    },
  },
  {
    id: 'comm-pool-04-meeting-agenda',
    kind: 'code',
    language: 'javascript',
    npc: 'Team Lead Maya',
    title: 'A Meeting With No Point',
    prompt: 'Meetings here run 45 minutes with no agenda and nobody remembers what was decided. Write buildMeetingAgenda(topic) returning an object with a topic, a list of discussion items, and a field for decisions/action items to be filled in during the meeting.',
    starter: 'function buildMeetingAgenda(topic) {\n  // return { topic, items: [...], actionItems: [] }\n}\n',
    runLabel: 'Send Invite',
    simulate(code) {
      const ok = /items/i.test(code) && /actionItems/i.test(code)
      return ok
        ? 'Invite sent with an agenda attached. Someone actually opened it before the meeting this time.'
        : 'Invite sent with no visible structure — attendees show up unsure what this meeting is even about.'
    },
    hints: [
      'The object needs a topic, a list of discussion items, and a (starts-empty) place to record decisions/action items as the meeting happens.',
      'Structure it as { topic, items: [...], actionItems: [] } — actionItems starts empty since it gets filled in live.',
      "function buildMeetingAgenda(topic) {\n  return {\n    topic,\n    items: ['Review last week\\'s action items', 'Main discussion', 'Open questions'],\n    actionItems: [],\n  };\n}",
    ],
    xp: 60,
    tool: { name: 'Meeting agenda structure', icon: '🗒️', description: 'A topic, a list of discussion items, and a place to capture decisions — the difference between a meeting and everyone just showing up.', fun: 3 },
    check({ code }) {
      if (!/function buildMeetingAgenda/.test(code)) return { success: false, message: 'Define the function buildMeetingAgenda(topic).' }
      if (!/items/i.test(code)) return { success: false, message: 'The returned object needs an items array listing discussion topics.' }
      if (!/actionItems/i.test(code)) return { success: false, message: 'The returned object needs an actionItems field to capture decisions made during the meeting.' }
      return { success: true, message: 'Now this meeting has a shape — a topic, what to discuss, and somewhere to write down what got decided.' }
    },
  },
  {
    id: 'comm-pool-05-definition-of-done',
    kind: 'sequence',
    npc: 'Agile Coach Ari',
    title: 'When Is a Story Actually "Done"?',
    prompt: 'Order building out a team\'s Definition of Done — a shared checklist for what "done" really means, so "done" stops meaning something different to every person.',
    items: [
      { id: 'code', label: 'Code is written and passes all tests' },
      { id: 'review', label: 'Code has been peer-reviewed and approved' },
      { id: 'docs', label: 'Documentation is updated if needed' },
      { id: 'deployed', label: 'Change is deployed and verified in production' },
    ],
    correctOrder: ['code', 'review', 'docs', 'deployed'],
    successMessage: 'Written, reviewed, documented, deployed and verified — a story isn\'t "done" until every one of those is true, not just the first one.',
    hints: [
      'Nothing else can happen until the code itself actually exists and passes its own tests.',
      'A team\'s Definition of Done usually goes further than "it works on my machine" — it isn\'t truly done until it\'s live and confirmed working.',
      'Code written and tested → Peer-reviewed and approved → Documentation updated → Deployed and verified in production',
    ],
    xp: 60,
    tool: { name: 'Definition of Done', icon: '✅', description: 'A shared checklist for what "done" actually means — so it stops being whatever the person saying it happens to think.', fun: 3 },
  },
  {
    id: 'comm-pool-06-backlog-refinement',
    kind: 'sequence',
    npc: 'Team Lead Maya',
    title: 'A Backlog Nobody Can Estimate',
    prompt: 'Order a backlog refinement (grooming) session, which prepares upcoming stories BEFORE sprint planning ever sees them.',
    items: [
      { id: 'pick', label: 'Pick upcoming stories from the backlog' },
      { id: 'clarify', label: 'Clarify requirements and ask open questions' },
      { id: 'splitup', label: 'Split any story that\'s too large into smaller ones' },
      { id: 'estimate', label: 'Estimate story points as a team' },
    ],
    correctOrder: ['pick', 'clarify', 'splitup', 'estimate'],
    successMessage: 'Picked, clarified, right-sized, and estimated — by the time sprint planning happens, there\'s no scrambling to figure out what a story even means.',
    hints: [
      'You can\'t clarify or estimate stories that haven\'t even been selected for review yet.',
      'A story that\'s still too big and vague is hard to estimate honestly — splitting it up usually comes before a confident estimate.',
      'Pick upcoming stories → Clarify requirements → Split oversized stories → Estimate story points',
    ],
    xp: 60,
    tool: { name: 'Backlog refinement', icon: '🧹', description: 'Clarifying, splitting, and estimating stories BEFORE sprint planning — so planning day isn\'t also the day requirements get invented.', fun: 3 },
  },
  {
    id: 'comm-pool-07-rfc-process',
    kind: 'sequence',
    npc: 'Wiki Wren',
    title: 'Getting Buy-In Before Building It',
    prompt: 'Order an RFC (Request for Comments) process — a way to get team buy-in on a significant technical decision BEFORE it\'s built.',
    items: [
      { id: 'draft', label: 'Author writes a draft RFC proposing an approach' },
      { id: 'share', label: 'RFC is shared with the team for comments' },
      { id: 'discuss', label: 'Feedback and objections are discussed openly' },
      { id: 'decide', label: 'A final decision is made and recorded' },
    ],
    correctOrder: ['draft', 'share', 'discuss', 'decide'],
    successMessage: 'Drafted, shared, discussed, decided — disagreements surface on paper before a single line of code is written, not after.',
    hints: [
      'Nothing can be commented on until a draft actually exists to react to.',
      'The whole point of sharing it widely is to surface objections and discuss them BEFORE the decision is locked in, not after.',
      'Author drafts the RFC → Shared with the team → Feedback and objections discussed → Final decision recorded',
    ],
    xp: 65,
    tool: { name: 'RFC process', icon: '📝', description: 'Draft, share, discuss, decide — team buy-in on a big technical choice happens on paper, before any code gets written.', fun: 4 },
  },

  // ---------- MCQ ----------
  {
    id: 'comm-pool-08-mcq-raci',
    kind: 'mcq',
    npc: 'Team Lead Maya',
    title: 'Who\'s Actually On the Hook for This?',
    prompt: 'In a RACI matrix, what is the key difference between "Responsible" and "Accountable" for a given task?',
    options: [
      'Responsible is whoever actually does the work; Accountable is the single person who ultimately owns the outcome and signs off on it',
      'They\'re two names for the exact same role on a task',
      'Accountable people do the work; Responsible people just watch',
      'RACI only has two roles total — Responsible and Accountable are the entire framework'
    ],
    correctIndex: 0,
    explanation: 'RACI has four roles: Responsible (does the work, can be multiple people), Accountable (the single person ultimately answerable for the outcome — RACI conventionally allows only one Accountable per task to avoid diffused ownership), Consulted (gives input beforehand), and Informed (kept updated after). Responsible and Accountable are deliberately distinct so "who did it" and "who owns it" aren\'t assumed to always be the same person.',
    hints: [
      'One of these can apply to multiple people on a task; the other is conventionally held by exactly one person to keep ownership clear.',
      'The person doing the work isn\'t always the same person who\'s ultimately answerable for whether it succeeded.',
      'The correct answer is: Responsible does the work, Accountable is the single owner of the outcome.',
    ],
    xp: 50,
    tool: { name: 'RACI matrix', icon: '📋', description: 'Responsible does the work, Accountable owns the outcome, Consulted gives input, Informed is kept in the loop — four distinct roles, not two names for one.', fun: 3 },
  },
  {
    id: 'comm-pool-09-mcq-scrum-vs-kanban',
    kind: 'mcq',
    npc: 'Agile Coach Ari',
    title: 'Two Agile Flavors, Not the Same Thing',
    prompt: 'What is the core structural difference between Scrum and Kanban?',
    options: [
      'Scrum works in fixed-length sprints with planned commitments; Kanban is a continuous flow of work limited by WIP limits, with no fixed iteration length',
      'Kanban requires sprints and Scrum does not',
      'They are simply two different names for the same process',
      'Scrum has no roles or ceremonies at all, unlike Kanban'
    ],
    correctIndex: 0,
    explanation: 'Scrum organizes work into fixed-length sprints (commonly 2 weeks) with a committed scope, sprint planning, and a sprint review/retro cadence. Kanban has no fixed iterations at all — work flows continuously through columns, and WIP limits (not sprint boundaries) are what constrain how much is in progress at once.',
    hints: [
      'One of these has a fixed time-boxed cycle with a planned commitment; the other has no fixed cycle at all, just continuous flow.',
      'Kanban\'s WIP limit does the job that Scrum\'s sprint boundary does — constraining how much work is happening at once — but via a completely different mechanism.',
      'The correct answer is: Scrum uses fixed sprints with committed scope; Kanban is continuous flow constrained by WIP limits.',
    ],
    xp: 55,
    tool: { name: 'Scrum vs. Kanban', icon: '🔄', description: 'Scrum time-boxes work into sprints; Kanban lets work flow continuously, constrained by WIP limits instead of iteration boundaries.', fun: 4 },
  },
  {
    id: 'comm-pool-10-mcq-story-points',
    kind: 'mcq',
    npc: 'Team Lead Maya',
    title: 'Why Not Just Estimate in Hours?',
    prompt: 'Why do many agile teams estimate work in story points (relative sizing) instead of hours?',
    options: [
      'Story points measure relative effort/complexity, which stays comparable across team members and over time — hour estimates vary wildly by who\'s doing the work and are easy to mistake for a hard deadline',
      'Story points are just a rebranding of hours, with no actual difference',
      'Hours are always a more accurate unit, so points are strictly worse',
      'Points are used only because Jira requires them technically'
    ],
    correctIndex: 0,
    explanation: 'A "5-hour task" for a senior engineer might be a "20-hour task" for a junior one — hour estimates are person-dependent and tend to get treated as commitments. Story points instead measure relative complexity/effort/uncertainty (often via Fibonacci-like scales), staying meaningful for velocity tracking regardless of who ends up doing the work.',
    hints: [
      'The problem with hours isn\'t that they\'re a bad unit in general — it\'s that the SAME task takes wildly different hours depending on who does it.',
      'Points are meant to capture relative size/complexity, which is more stable across different people than a raw time estimate.',
      'The correct answer is: points measure relative effort/complexity, staying comparable across people, unlike person-dependent hour estimates.',
    ],
    xp: 50,
    tool: { name: 'Story points vs. hours', icon: '🔢', description: 'Story points estimate relative complexity, which stays consistent across the team — hour estimates vary by who\'s doing the work and get mistaken for commitments.', fun: 3 },
  },
  {
    id: 'comm-pool-11-mcq-async-sync',
    kind: 'mcq',
    npc: 'Slack Stan',
    title: 'Why Not Just Have a Meeting?',
    prompt: 'A distributed team spanning many timezones is deciding between a live meeting and an async written proposal (e.g. a shared doc with comments) for a decision. What is the main tradeoff?',
    options: [
      'Sync (live meetings) gets faster real-time back-and-forth but excludes anyone in an inconvenient timezone; async lets everyone contribute on their own schedule, at the cost of slower back-and-forth',
      'Async communication is strictly worse in every situation and should never be used',
      'Timezones have no real effect on which approach works better',
      'Sync meetings require no scheduling and are always available on demand'
    ],
    correctIndex: 0,
    explanation: 'Real-time discussion resolves ambiguity quickly, but forces a shared time slot — which structurally disadvantages or excludes people in far-apart timezones. Async communication (a written doc, a Slack thread) lets every timezone contribute at a reasonable hour, at the cost of a slower total back-and-forth loop.',
    hints: [
      'The tradeoff here is specifically about SPEED of resolution versus WHO can realistically participate.',
      'A live meeting needs everyone awake at the same moment — that\'s the whole tradeoff in a distributed, multi-timezone team.',
      'The correct answer is: sync is faster but timezone-exclusionary; async includes everyone but resolves more slowly.',
    ],
    xp: 55,
    tool: { name: 'Async vs. sync communication', icon: '🌍', description: 'Sync is fast but excludes distant timezones from real-time participation; async includes everyone at the cost of a slower resolution loop.', fun: 4 },
  },
  {
    id: 'comm-pool-12-mcq-sbi-feedback',
    kind: 'mcq',
    npc: 'Agile Coach Ari',
    title: 'Giving Feedback Without It Landing as an Attack',
    prompt: 'The SBI (Situation-Behavior-Impact) feedback framework structures feedback around three things. What does it prescribe, and why?',
    options: [
      'Describe the specific Situation, the observed Behavior, and its Impact — grounding feedback in concrete facts rather than character judgments, which is easier to hear and act on',
      'State the person\'s Strengths, Blame, and an Insult, in that order',
      'It\'s a scoring rubric that assigns a numeric grade to an employee\'s overall personality',
      'It only applies to written performance reviews, never spoken feedback'
    ],
    correctIndex: 0,
    explanation: 'SBI structures feedback as: the specific Situation it happened in, the observable Behavior (not a character trait or intent you\'re guessing at), and the concrete Impact it had. Grounding feedback in specific, observable facts rather than "you always..." character judgments makes it far more likely to be heard non-defensively and actually acted on.',
    hints: [
      'This is a feedback-delivery framework meant to keep things concrete and non-judgmental, not a scoring or grading system.',
      'The key move is describing an observable BEHAVIOR and its IMPACT, rather than assuming or naming a character trait/intent.',
      'The correct answer is: Situation, Behavior, Impact — concrete and factual, not a character judgment.',
    ],
    xp: 55,
    tool: { name: 'SBI feedback framework', icon: '💬', description: 'Situation, Behavior, Impact — grounding feedback in specific, observable facts instead of character judgments makes it easier to hear and act on.', fun: 3 },
  },
  {
    id: 'comm-pool-13-mcq-dod-vs-dor',
    kind: 'mcq',
    npc: 'Team Lead Maya',
    title: 'Ready to Start vs. Actually Finished',
    prompt: 'What is the difference between a "Definition of Ready" (DoR) and a "Definition of Done" (DoD)?',
    options: [
      'Definition of Ready is the checklist a story must meet BEFORE work starts (clear requirements, estimated, etc.); Definition of Done is the checklist it must meet AFTER work finishes (tested, reviewed, deployed, etc.)',
      'They are the same checklist, just used at different meetings',
      'Definition of Ready applies only to bugs; Definition of Done applies only to new features',
      'Definition of Done is checked before a sprint starts, and Definition of Ready is checked after it ends'
    ],
    correctIndex: 0,
    explanation: 'Definition of Ready gates entry INTO a sprint — a story shouldn\'t be pulled into work until its requirements are clear, estimated, and unblocked. Definition of Done gates exit — a story shouldn\'t be considered complete until it\'s met the team\'s bar for tested, reviewed, and deployed. They apply at opposite ends of a story\'s lifecycle.',
    hints: [
      'One of these is a gate for entering work; the other is a gate for exiting it — think about which end of a story\'s lifecycle each applies to.',
      'A vague, unestimated story failing "Ready" should never even start; a story that started but wasn\'t tested/reviewed fails "Done."',
      'The correct answer is: Definition of Ready gates work BEFORE it starts, Definition of Done gates it AFTER it finishes.',
    ],
    xp: 55,
    tool: { name: 'Definition of Ready vs. Done', icon: '🚦', description: 'Definition of Ready gates a story before work starts; Definition of Done gates it after work finishes — opposite ends of the same story\'s lifecycle.', fun: 3 },
  },
  {
    id: 'comm-pool-14-mcq-wip-purpose',
    kind: 'mcq',
    npc: 'Slack Stan',
    title: 'Why Cap How Much Is "In Progress"?',
    prompt: 'What problem does a Kanban WIP (work-in-progress) limit actually solve?',
    options: [
      'It forces the team to finish existing work before starting new work, which reduces context-switching and surfaces bottlenecks faster',
      'It\'s purely a visual/aesthetic rule with no effect on how work actually gets done',
      'It guarantees every task will be completed exactly on schedule',
      'It only limits how many people can be on the team, not how much work is active'
    ],
    correctIndex: 0,
    explanation: 'Without a WIP limit, teams tend to start many things at once, and everything ends up half-finished with heavy context-switching costs. A WIP limit forces a "stop starting, start finishing" discipline — and when a column hits its limit, it visibly signals a bottleneck (something downstream isn\'t keeping pace), which is exactly the kind of problem Kanban is meant to surface early.',
    hints: [
      'The core problem it targets is starting too many things at once and never finishing any of them.',
      'When a column is capped and stuck at its limit, that\'s Kanban visibly telling you where the bottleneck is.',
      'The correct answer is: it forces finishing before starting new work, reducing context-switching and surfacing bottlenecks.',
    ],
    xp: 50,
    tool: { name: 'Kanban WIP limits (purpose)', icon: '🚧', description: 'A WIP limit forces "finish before you start" discipline and makes bottlenecks visible the moment a column fills up.', fun: 3 },
  },

  // ---------- matching ----------
  {
    id: 'comm-pool-15-match-meeting-types',
    kind: 'matching',
    npc: 'Team Lead Maya',
    title: 'Meeting Types',
    prompt: 'Match each meeting type to its purpose.',
    pairs: [
      { id: 'a', left: 'Daily standup', right: 'A short daily sync on progress and blockers' },
      { id: 'b', left: '1:1', right: 'A private, recurring check-in between a manager and a direct report' },
      { id: 'c', left: 'Sprint retrospective', right: 'Reflecting on what went well/poorly and picking action items' },
      { id: 'd', left: 'Sprint planning', right: 'Deciding what work the team commits to for the upcoming sprint' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'The standup is about DAILY status; the retrospective is about looking BACK over the whole sprint that just ended.',
      'Sprint planning looks FORWARD (what\'s next); the retrospective looks BACKWARD (what just happened).',
      'Daily standup → daily sync, 1:1 → manager/report check-in, retrospective → reflect on the past sprint, sprint planning → commit to the next sprint.',
    ],
    xp: 55,
    tool: { name: 'Meeting types', icon: '🗓️', description: 'Standups sync daily, 1:1s check in privately, retros look backward, and planning looks forward — each meeting type has a distinct job.', fun: 3 },
  },
  {
    id: 'comm-pool-16-match-agile-ceremonies',
    kind: 'matching',
    npc: 'Agile Coach Ari',
    title: 'Agile Ceremony Vocabulary',
    prompt: 'Match each Scrum ceremony/artifact to what it is.',
    pairs: [
      { id: 'a', left: 'Sprint', right: 'A fixed-length time-box (commonly 2 weeks) of committed work' },
      { id: 'b', left: 'Backlog', right: 'The full, prioritized list of all work not yet done' },
      { id: 'c', left: 'Velocity', right: "A team's average story points completed per sprint, used to plan capacity" },
      { id: 'd', left: 'Story', right: 'A single unit of user-facing work, usually written "As a... I want... so that..."' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'The backlog holds EVERYTHING not yet done; a sprint is just the fixed time-box committed work happens inside.',
      'Velocity is a measurement DERIVED from past sprints, used to plan how much fits in future ones.',
      'Sprint → fixed time-box, backlog → full prioritized work list, velocity → average points per sprint, story → one unit of user-facing work.',
    ],
    xp: 55,
    tool: { name: 'Agile ceremony/artifact vocabulary', icon: '🔁', description: 'Sprint, backlog, velocity, and story are the basic building blocks Scrum uses to structure and measure work.', fun: 3 },
  },
  {
    id: 'comm-pool-17-match-doc-types',
    kind: 'matching',
    npc: 'Wiki Wren',
    title: 'Documentation Types',
    prompt: 'Match each documentation type to its purpose.',
    pairs: [
      { id: 'a', left: 'ADR (Architecture Decision Record)', right: "Records WHY a specific technical decision was made, for future reference" },
      { id: 'b', left: 'RFC (Request for Comments)', right: 'A proposal circulated for team feedback BEFORE a decision is finalized' },
      { id: 'c', left: 'Runbook', right: 'Step-by-step operational instructions for handling a specific recurring task or incident' },
      { id: 'd', left: 'Wiki page', right: 'General reference knowledge, meant to stay current and be found by anyone on the team' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'An RFC exists BEFORE a decision is made (to gather input); an ADR exists AFTER, to record what was actually decided and why.',
      'A runbook is operational and procedural (what to DO); a wiki page is more general reference knowledge.',
      'ADR → records a past decision\'s reasoning, RFC → a pre-decision proposal for feedback, runbook → step-by-step operational instructions, wiki page → general reference knowledge.',
    ],
    xp: 60,
    tool: { name: 'Documentation types', icon: '📚', description: 'RFCs gather input before a decision, ADRs record it afterward, runbooks guide operational tasks, and wikis hold general reference knowledge.', fun: 4 },
  },
  {
    id: 'comm-pool-18-match-tool-purposes',
    kind: 'matching',
    npc: 'Slack Stan',
    title: 'Collaboration Tool Purposes',
    prompt: 'Match each collaboration tool to its primary purpose.',
    pairs: [
      { id: 'a', left: 'Jira', right: 'Tracking issues, stories, and sprints on a structured board' },
      { id: 'b', left: 'Confluence', right: 'Long-form team documentation and knowledge base' },
      { id: 'c', left: 'Slack', right: 'Real-time and async team messaging and notifications' },
      { id: 'd', left: 'Notion', right: "A flexible all-in-one workspace combining docs, databases, and tasks" },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Jira is specifically structured around ISSUE TRACKING; Confluence is built for longer-form written documentation.',
      'Notion\'s whole pitch is flexibility — combining what Jira and Confluence do separately into one workspace.',
      'Jira → issue/sprint tracking, Confluence → long-form docs, Slack → messaging, Notion → flexible all-in-one workspace.',
    ],
    xp: 55,
    tool: { name: 'Collaboration tool purposes', icon: '🧰', description: 'Jira tracks issues, Confluence documents, Slack messages, and Notion flexibly combines all three — different tools for different jobs.', fun: 3 },
  },
  {
    id: 'comm-pool-19-match-user-story',
    kind: 'matching',
    npc: 'Team Lead Maya',
    title: 'Parts of a User Story',
    prompt: 'Match each part of a well-formed user story to what it captures.',
    pairs: [
      { id: 'a', left: '"As a..."', right: 'Who the user is — their role or persona' },
      { id: 'b', left: '"I want..."', right: 'What capability or action they need' },
      { id: 'c', left: '"So that..."', right: 'Why they need it — the underlying goal or value' },
      { id: 'd', left: 'Acceptance criteria', right: 'The specific, testable conditions that prove the story is complete' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      '"As a / I want / so that" together capture WHO, WHAT, and WHY — acceptance criteria is a separate, more testable piece.',
      'Acceptance criteria is what actually gets checked against the Definition of Done — it\'s concrete and verifiable, unlike the narrative "so that" clause.',
      '"As a..." → who, "I want..." → what, "so that..." → why, acceptance criteria → testable completion conditions.',
    ],
    xp: 55,
    tool: { name: 'User story structure', icon: '📝', description: '"As a / I want / so that" captures who, what, and why — acceptance criteria adds the testable proof that it\'s actually done.', fun: 3 },
  },
  {
    id: 'comm-pool-20-match-raci-roles',
    kind: 'matching',
    npc: 'Team Lead Maya',
    title: 'RACI Roles',
    prompt: 'Match each RACI role to its meaning.',
    pairs: [
      { id: 'a', left: 'Responsible', right: 'Does the actual work — can be more than one person' },
      { id: 'b', left: 'Accountable', right: 'The single person ultimately answerable for the outcome' },
      { id: 'c', left: 'Consulted', right: 'Gives input before the work happens — a two-way conversation' },
      { id: 'd', left: 'Informed', right: 'Kept updated on progress or outcome — a one-way notification' },
    ],
    rightOrder: ['a', 'b', 'c', 'd'],
    hints: [
      'Only one of these roles is conventionally held by exactly one person — the one meant to keep ownership unambiguous.',
      'Consulted implies two-way dialogue BEFORE the work; Informed is a one-way update, often AFTER.',
      'Responsible → does the work (can be many), Accountable → the single owner, Consulted → two-way input beforehand, Informed → one-way updates.',
    ],
    xp: 55,
    tool: { name: 'RACI roles', icon: '🧭', description: 'Responsible does the work, Accountable owns it, Consulted gives two-way input, Informed gets one-way updates.', fun: 3 },
  },
]
