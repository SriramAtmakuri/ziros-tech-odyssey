// Healthcare Highlands — HIPAA, HL7/FHIR, clinical coding, clinical trials, telehealth.
// Reuses 'sequence' for process/architecture ordering and 'code' (JSON, pattern-checked,
// no live execution engine) for FHIR resources — same pattern as Cloud Citadel's IAM
// policy challenge. No new panel types.

const BROKEN_OBSERVATION = `{
  "resourceType": "Observation",
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature"
      }
    ]
  }
}`

export const HEALTHCARE_HIGHLANDS_CHALLENGES = [
  {
    id: 'hh-01-hipaa-process',
    kind: 'sequence',
    npc: 'Privacy Patricia',
    title: 'Protecting What Matters',
    prompt: 'Order the process for handling Protected Health Information (PHI) correctly, from first contact with the data to ongoing oversight.',
    items: [
      { id: 'identify', label: 'Identify what counts as PHI' },
      { id: 'restrict', label: 'Restrict access to only those who need it' },
      { id: 'encrypt', label: 'Encrypt it at rest' },
      { id: 'log', label: 'Log every access' },
      { id: 'audit', label: 'Audit the logs regularly' },
    ],
    correctOrder: ['identify', 'restrict', 'encrypt', 'log', 'audit'],
    successMessage: 'You can\'t protect data you haven\'t identified, and you can\'t trust access controls you never audit. Every step earns the next.',
    hints: [
      'You can\'t restrict, encrypt, or log something until you know it\'s PHI in the first place.',
      'Access control and encryption are preventive; logging and auditing are how you catch what preventive measures missed.',
      'Identify PHI → Restrict access → Encrypt at rest → Log every access → Audit the logs',
    ],
    xp: 60,
    tool: { name: 'HIPAA data handling', icon: '🔒', description: 'Identify, restrict, encrypt, log, audit — the minimum lifecycle for any Protected Health Information.', fun: 3 },
  },

  {
    id: 'hh-02-hl7-segments',
    kind: 'sequence',
    npc: 'Integration Irene',
    title: 'An HL7 Message, Piece by Piece',
    prompt: 'Order the segments of an HL7 v2 ADT (Admit/Discharge/Transfer) message, from the top of the message down.',
    items: [
      { id: 'msh', label: 'MSH (message header)' },
      { id: 'pid', label: 'PID (patient identification)' },
      { id: 'pv1', label: 'PV1 (patient visit / encounter info)' },
      { id: 'obx', label: 'OBX (observation / result)' },
    ],
    correctOrder: ['msh', 'pid', 'pv1', 'obx'],
    successMessage: 'Header first, then who the patient is, then the visit itself, then any results tied to it. Every HL7 parser expects exactly this shape.',
    hints: [
      'Every HL7 v2 message opens with a header segment describing the message itself.',
      'You need to know who the patient is before you can describe their visit, and the visit exists before any observation tied to it.',
      'MSH → PID → PV1 → OBX',
    ],
    xp: 60,
    tool: { name: 'HL7 v2 segments', icon: '📠', description: 'MSH, PID, PV1, OBX — the building blocks of every HL7 ADT message hospitals exchange.', fun: 3 },
  },

  {
    id: 'hh-03-fhir-architecture',
    kind: 'sequence',
    npc: 'Integration Irene',
    title: 'How a Third-Party App Reads a Chart',
    prompt: 'Order the FHIR architecture that lets an outside app securely read data out of a hospital\'s EHR.',
    items: [
      { id: 'ehr', label: 'EHR System (holds the real data)' },
      { id: 'api', label: 'FHIR API (exposes it in a standard format)' },
      { id: 'server', label: 'FHIR Server' },
      { id: 'app', label: 'Third-party App (via SMART on FHIR authorization)' },
    ],
    correctOrder: ['ehr', 'api', 'server', 'app'],
    successMessage: 'The data starts locked inside the EHR, gets exposed through a standard API, served up, and finally authorized out to an app that asked nicely.',
    hints: [
      'The EHR is the source of truth — nothing can be exposed before it exists there first.',
      'A FHIR Server is what actually serves the FHIR API to the outside world; SMART on FHIR is the authorization layer an app has to go through last.',
      'EHR System → FHIR API → FHIR Server → Third-party App (SMART on FHIR)',
    ],
    xp: 60,
    tool: { name: 'FHIR architecture', icon: '🗂️', description: 'EHR data, exposed through a FHIR API and server, reachable by authorized third-party apps via SMART on FHIR.', fun: 4 },
  },

  {
    id: 'hh-04-fhir-patient',
    kind: 'code',
    language: 'json',
    npc: 'Integration Irene',
    title: 'Building a Patient Resource',
    prompt: 'Write a FHIR Patient resource as JSON: a "resourceType" of "Patient", an "id", and a "name" array with at least one entry containing "family" and "given".',
    starter: '{\n  \n}',
    runLabel: 'Validate Resource',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate resource.'
      }
      if (parsed && parsed.resourceType === 'Patient' && Array.isArray(parsed.name) && parsed.name.length > 0) {
        return `Patient resource validated. ${parsed.name.length} name entry found.`
      }
      return 'Validation Error: resource is missing required Patient fields (resourceType, id, name).'
    },
    hints: [
      'A minimal FHIR resource always starts with "resourceType" naming what kind of resource it is.',
      'The "name" field is an array of objects — each with "family" (last name) and "given" (an array of first names).',
      '{\n  "resourceType": "Patient",\n  "id": "patient-001",\n  "name": [\n    { "family": "Rivera", "given": ["Alex"] }\n  ]\n}',
    ],
    xp: 70,
    tool: { name: 'FHIR Patient resource', icon: '🧾', description: 'resourceType, id, and a name array — the minimum shape of a valid FHIR Patient.', fun: 4 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'Patient') {
        return { success: false, message: 'resourceType must be exactly "Patient".' }
      }
      if (!parsed.id || typeof parsed.id !== 'string' || parsed.id.trim() === '') {
        return { success: false, message: 'The resource needs a non-empty "id" field.' }
      }
      if (!Array.isArray(parsed.name) || parsed.name.length === 0) {
        return { success: false, message: 'The resource needs a "name" array with at least one entry.' }
      }
      const hasValidName = parsed.name.some((n) => n && n.family && n.given)
      if (!hasValidName) {
        return { success: false, message: 'At least one name entry needs both "family" and "given".' }
      }
      return { success: true, message: 'A valid FHIR Patient resource — any system that speaks FHIR can read it now.' }
    },
  },

  {
    id: 'hh-05-patient-record-order',
    kind: 'sequence',
    npc: 'Dr. Mara',
    title: 'Building a Complete Chart',
    prompt: 'Order the FHIR resources you\'d typically create for a new patient visit, in dependency order.',
    items: [
      { id: 'patient', label: 'Patient (who they are)' },
      { id: 'encounter', label: 'Encounter (the visit itself)' },
      { id: 'condition', label: 'Condition (why they\'re here)' },
      { id: 'observation', label: 'Observation (vitals/labs taken)' },
      { id: 'medicationrequest', label: 'MedicationRequest (what\'s prescribed)' },
    ],
    correctOrder: ['patient', 'encounter', 'condition', 'observation', 'medicationrequest'],
    successMessage: 'A person, then their visit, then why they came, then what was measured, then what was prescribed. Each resource references the one before it.',
    hints: [
      'Every other resource in a visit references back to the Patient — it has to exist first.',
      'You have to know why the patient is there (Condition) and what was observed before you\'d prescribe anything.',
      'Patient → Encounter → Condition → Observation → MedicationRequest',
    ],
    xp: 80,
    tool: { name: 'FHIR resource chain', icon: '📋', description: 'Patient, Encounter, Condition, Observation, MedicationRequest — each resource links back to the ones before it.', fun: 4 },
  },

  {
    id: 'hh-06-coding-systems',
    kind: 'sequence',
    npc: 'Dr. Mara',
    title: 'Coding a Diagnosis Correctly',
    prompt: 'Order the process of coding a clinical encounter, from the patient\'s symptom to the recorded lab result.',
    items: [
      { id: 'symptom', label: 'Identify the patient\'s symptom in clinical terms (SNOMED CT)' },
      { id: 'diagnosis', label: 'Map it to a billing diagnosis code (ICD-10)' },
      { id: 'labtest', label: 'Order any needed lab test using its standard code (LOINC)' },
      { id: 'result', label: 'Record the result against that same LOINC code' },
    ],
    correctOrder: ['symptom', 'diagnosis', 'labtest', 'result'],
    successMessage: 'Clinical description, billing code, ordered test, recorded result — three different coding systems, one coherent encounter.',
    hints: [
      'SNOMED CT captures the clinical picture before anything gets translated into a billing code.',
      'A lab test has to be ordered under a LOINC code before a result can be recorded against that same code.',
      'SNOMED CT symptom → ICD-10 diagnosis → LOINC test order → LOINC-coded result',
    ],
    xp: 65,
    tool: { name: 'Clinical coding systems', icon: '🏷️', description: 'SNOMED CT (clinical terms), ICD-10 (billing diagnoses), and LOINC (labs) — three systems, one encounter.', fun: 3 },
  },

  {
    id: 'hh-07-hospital-integration',
    kind: 'sequence',
    npc: 'Integration Irene',
    title: 'Connecting the Systems',
    prompt: 'Order a hospital\'s data integration architecture, from the system of record to the dashboard someone actually reads.',
    items: [
      { id: 'epic', label: 'Epic EHR (source of truth)' },
      { id: 'hl7engine', label: 'HL7 Interface Engine (translates messages)' },
      { id: 'fhirserver', label: 'FHIR Server (modern API layer)' },
      { id: 'cloud', label: 'Cloud Data Platform (e.g. AWS HealthLake)' },
      { id: 'dashboard', label: 'Analytics Dashboard' },
    ],
    correctOrder: ['epic', 'hl7engine', 'fhirserver', 'cloud', 'dashboard'],
    successMessage: 'Data flows from the EHR, gets translated, exposed as FHIR, landed in the cloud, and finally visualized. Every layer earning the next.',
    hints: [
      'Epic holds the real clinical data — nothing downstream exists without it.',
      'Legacy HL7 messages get translated before a modern FHIR API layer can expose the same data, which then lands in a cloud platform before analytics ever sees it.',
      'Epic EHR → HL7 Interface Engine → FHIR Server → Cloud Data Platform → Analytics Dashboard',
    ],
    xp: 85,
    tool: { name: 'Hospital data integration', icon: '🏥', description: 'EHR → HL7 engine → FHIR server → cloud platform → dashboard — a hospital\'s full data path.', fun: 4 },
  },

  {
    id: 'hh-08-clinical-trial-phases',
    kind: 'sequence',
    npc: 'Clinical Carl',
    title: 'Testing a New Treatment',
    prompt: 'Order the phases a new treatment goes through in clinical trials, from first human test to long-term monitoring.',
    items: [
      { id: 'phase1', label: 'Phase 1 (small group, testing safety)' },
      { id: 'phase2', label: 'Phase 2 (larger group, testing efficacy)' },
      { id: 'phase3', label: 'Phase 3 (large-scale, comparing to standard treatment)' },
      { id: 'phase4', label: 'Phase 4 (post-market monitoring after approval)' },
    ],
    correctOrder: ['phase1', 'phase2', 'phase3', 'phase4'],
    successMessage: 'Safety first in a small group, then does it actually work, then how does it compare at scale, then what happens once it\'s out in the world.',
    hints: [
      'You always test safety in a small group before testing whether the treatment actually works.',
      'The largest, most rigorous comparison trial happens right before approval — monitoring happens only after that.',
      'Phase 1 (safety) → Phase 2 (efficacy) → Phase 3 (large-scale comparison) → Phase 4 (post-market monitoring)',
    ],
    xp: 60,
    tool: { name: 'Clinical trial phases', icon: '💊', description: 'Phase 1 through 4 — safety, efficacy, comparison, then real-world monitoring after approval.', fun: 3 },
  },

  {
    id: 'hh-09-telehealth-stack',
    kind: 'sequence',
    npc: 'Dr. Mara',
    title: 'A Visit From the Couch',
    prompt: 'Order a telehealth platform\'s architecture, from the patient\'s device to the visit itself.',
    items: [
      { id: 'app', label: 'Patient\'s App' },
      { id: 'apimgmt', label: 'API Management Layer' },
      { id: 'ehrfhir', label: 'EHR/FHIR Integration' },
      { id: 'video', label: 'Video Visit + AI Triage' },
    ],
    correctOrder: ['app', 'apimgmt', 'ehrfhir', 'video'],
    successMessage: 'The request starts on the patient\'s device, gets managed and authenticated, pulls in their real chart, and only then does the actual visit happen.',
    hints: [
      'Every telehealth visit starts with the patient opening the app on their device.',
      'The platform needs to pull the patient\'s real EHR data through FHIR before the visit itself can be clinically useful.',
      'Patient\'s App → API Management Layer → EHR/FHIR Integration → Video Visit + AI Triage',
    ],
    xp: 65,
    tool: { name: 'Telehealth architecture', icon: '📱', description: 'Patient app, API management, EHR/FHIR integration, then the video visit itself.', fun: 4 },
  },

  {
    id: 'hh-10-fhir-debug',
    kind: 'code',
    language: 'json',
    npc: 'Integration Irene',
    title: 'The Resource That Won\'t Validate',
    prompt: 'This FHIR Observation resource is missing its required "status" field. Add a valid status (e.g. "final") so it validates.',
    starter: BROKEN_OBSERVATION,
    runLabel: 'Validate Resource',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate resource.'
      }
      if (parsed && typeof parsed.status === 'string' && parsed.status.trim() !== '') {
        return `Observation resource validated. Status: ${parsed.status}.`
      }
      return 'Validation Error: Observation.status is a required field.'
    },
    hints: [
      'Every FHIR Observation needs a "status" field alongside "resourceType" and "code" — it\'s missing here.',
      'Valid values include registered, preliminary, final, and amended.',
      '"status": "final"',
    ],
    xp: 70,
    tool: { name: 'FHIR Observation debugging', icon: '🔍', description: 'status is a required field on every Observation — without it, the resource never validates.', fun: 3 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'Observation') {
        return { success: false, message: 'resourceType must remain "Observation".' }
      }
      if (!parsed.status || typeof parsed.status !== 'string' || parsed.status.trim() === '') {
        return { success: false, message: 'Observation.status is still missing — add one (e.g. "final").' }
      }
      return { success: true, message: 'The resource validates now — status tells every downstream system whether to trust this result yet.' }
    },
  },

  {
    id: 'hh-11-er-integration',
    kind: 'sequence',
    npc: 'Dr. Mara',
    title: 'The Patient Who Can\'t Speak',
    prompt: 'An unconscious patient just arrived and their records are scattered across systems. Order the real-time integration needed to get a full picture.',
    items: [
      { id: 'epic', label: 'Query the Epic EHR record' },
      { id: 'lab', label: 'Query the lab system record' },
      { id: 'pharmacy', label: 'Query the pharmacy system record' },
      { id: 'merge', label: 'Merge into one unified FHIR view' },
      { id: 'dashboard', label: 'Display on the ER dashboard' },
    ],
    correctOrder: ['epic', 'lab', 'pharmacy', 'merge', 'dashboard'],
    successMessage: 'Every fragmented system, queried and merged into one view, on the screen the ER doctor is actually looking at. Seconds, not hours.',
    hints: [
      'Query every source system first — you can\'t merge data you haven\'t retrieved yet.',
      'The merge into a single FHIR view has to happen before anything is fit to display.',
      'Query Epic → Query lab system → Query pharmacy system → Merge into unified FHIR view → Display on ER dashboard',
    ],
    xp: 85,
    tool: { name: 'ER record integration', icon: '🚑', description: 'Querying every fragmented system and merging into one FHIR view — the difference between minutes and hours in an ER.', fun: 4 },
  },

  {
    id: 'hh-12-final-boss',
    kind: 'sequence',
    npc: 'Dr. Mara',
    title: 'Integrating the Fragmented System',
    prompt: 'The Highlands\' entire patient data system is fragmented across incompatible hospitals. Bring it all together, in the order it would actually flow for a real patient.',
    items: [
      { id: 'pull', label: 'Pull records from every fragmented system (Epic, lab, pharmacy)' },
      { id: 'normalize', label: 'Normalize each into FHIR resources' },
      { id: 'merge', label: 'Merge into one unified patient view' },
      { id: 'validate', label: 'Validate the merged record' },
      { id: 'deliver', label: 'Deliver it to the ER dashboard in real time' },
    ],
    correctOrder: ['pull', 'normalize', 'merge', 'validate', 'deliver'],
    successMessage: 'Every fragmented system, pulled, normalized, merged, validated, and delivered in real time. For the first time, a doctor sees the whole patient at once.',
    hints: [
      'This mirrors the ER integration you already built, but every record has to be normalized into FHIR before it can be merged with the others.',
      'The merged record gets validated before anyone trusts it enough to put it in front of a doctor.',
      'Pull from every system → Normalize into FHIR → Merge into unified view → Validate → Deliver to ER dashboard in real time',
    ],
    xp: 220,
    tool: { name: 'Healthcare Integrator', icon: '🏥', description: 'Unified every fragmented hospital system into one validated, real-time FHIR record.', fun: 5 },
  },
]

export const HEALTHCARE_HIGHLANDS_ZONE = {
  id: 'healthcare-highlands',
  name: 'Healthcare Highlands',
  palette: { bg: '#e0f2fe', ground: 0xffffff, groundAccent: 0xf1f5f9 },
  decor: { kind: 'medical' },
  npcIntro: {
    name: 'Dr. Mara',
    lines: [
      "Welcome to Healthcare Highlands, Ziro.",
      "Every hospital up here runs its own system, and none of them speak to each other. Patient data is fragmented across incompatible records.",
      "Imagine every hospital writing 'penicillin allergy' a hundred different ways, in a hundred different formats. That's not an exaggeration — that's literally what's happening between these systems, and it's why a chart from one building might as well not exist in the next one.",
      "An unconscious patient just arrived in my ER. I can't see their labs, their medications, or their history — because none of it is in one place.",
      "Help me integrate these systems, piece by piece, before it costs someone their life.",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Dr. Mara', color: 0xef4444, role: 'main' },
    { x: 2020, y: 560, name: 'Integration Irene', color: 0x38bdf8, flavor: 'HL7 and FHIR are how these systems are supposed to talk to each other. Let\'s make sure they actually do.' },
    { x: 260, y: 860, name: 'Clinical Carl', color: 0x22c55e, flavor: 'Every treatment we prescribe went through years of trials before it ever reached a patient. Let\'s see how that process works.' },
    { x: 2020, y: 1160, name: 'Privacy Patricia', color: 0xa78bfa, flavor: 'Integration means nothing if we leak PHI along the way. HIPAA isn\'t paperwork — it\'s the whole point.' },
  ],
  challenges: HEALTHCARE_HIGHLANDS_CHALLENGES,
  nextZone: 'supply-chain-docks',
}
