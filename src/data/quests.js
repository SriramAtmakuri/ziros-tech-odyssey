// Cross-cutting side quests — each rewards the player for completing
// specific real challenges that happen to share a theme across MULTIPLE
// different zones (observability, debugging, the data lifecycle, security).
// Purely a meta-layer over challenge completion that already happens during
// normal play — no new challenge content, no new panel kind, no new engine
// mechanic. requiredChallengeIds always reference real, permanent main-pool
// challenge ids (never a rotating bonus-pool occupant id, which isn't
// guaranteed to ever get drawn in a given playthrough) — every player who
// plays all 13 zones normally will encounter every required challenge.
export const QUESTS = [
  {
    id: 'quest-observability-tour',
    title: 'The Observability Tour',
    description: 'Real systems fail quietly until someone builds the dashboards, alerts, and logs that catch it. Prove you can do that across three completely different stacks.',
    requiredChallengeIds: ['cc-bonus-silent-failure', 'dr-14-incident-response', 'ss-bonus-breach-nobody-saw'],
    reward: {
      xp: 150,
      tool: {
        name: 'Observability Mindset',
        icon: '📡',
        description: 'Logs, metrics, traces, and alerts — the instinct to make failures visible before a user reports them, no matter what stack you\'re in.',
        fun: 5,
      },
    },
  },
  {
    id: 'quest-fullstack-debugger',
    title: 'Full-Stack Debugger',
    description: 'A bug is a bug whether it\'s in a CI pipeline, a browser, or a hospital record system. Fix a real one in three completely different corners of Tech Planet.',
    requiredChallengeIds: ['ck-05-jenkins-debug', 'wd-07-es6-debug', 'hh-10-fhir-debug'],
    reward: {
      xp: 150,
      tool: {
        name: 'Debugging Instinct',
        icon: '🔍',
        description: 'The same patient, methodical process finds the bug whether it\'s a broken pipeline, broken JavaScript, or a malformed medical record.',
        fun: 5,
      },
    },
  },
  {
    id: 'quest-data-lifecycle',
    title: 'The Data Lifecycle',
    description: 'Data has a whole life: it starts as a single query, gets shaped into a pipeline, and eventually feeds a model. Walk the whole path.',
    requiredChallengeIds: ['sql-01-select-star', 'dr-01-elt-pipeline', 'ai-01-ml-pipeline'],
    reward: {
      xp: 150,
      tool: {
        name: 'End-to-End Data Sense',
        icon: '🔄',
        description: 'Seeing the whole path data takes — from a raw query, through a pipeline, to a model\'s training set — instead of just one link in the chain.',
        fun: 5,
      },
    },
  },
  {
    id: 'quest-security-everywhere',
    title: 'Security, Everywhere',
    description: 'Security isn\'t just one zone\'s job. Handle a real security or compliance concern in three places that aren\'t the Security Stronghold.',
    requiredChallengeIds: ['cc-03-iam-chain', 'hh-01-hipaa-process', 'wd-13-auth-flow'],
    reward: {
      xp: 150,
      tool: {
        name: 'Security-First Habit',
        icon: '🛡️',
        description: 'IAM policies, HIPAA compliance, auth flows — security shows up everywhere on Tech Planet, not just in the zone with "Security" in the name.',
        fun: 5,
      },
    },
  },
]
