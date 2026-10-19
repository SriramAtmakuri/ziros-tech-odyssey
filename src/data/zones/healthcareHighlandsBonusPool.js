// The bonus reserve pool for Healthcare Highlands — 2x its 12 real chest
// positions. Once a chest is solved and the player moves past it via
// "Next", that chest's challenge gets replaced with one drawn from here
// (see gameStore.js's BONUS_POOLS registry / swapChallenge /
// getLiveChallenges), same mechanic as every other zone in this rollout.
// Pre-authored, never AI-generated at runtime.
//
// Split three ways:
//   - 8 hands-on (4x kind: 'code' — FHIR JSON, pattern-checked, no live
//     engine, same as the main zone's FHIR challenges; 4x kind: 'sequence')
//     covering ground the main 12 don't: a FHIR Condition resource, a FHIR
//     MedicationRequest resource, a FHIR AllergyIntolerance resource (which
//     directly solves the zone's own intro flavor text — "penicillin
//     allergy written a hundred different ways"), a FHIR Bundle wrapping
//     multiple resources, a de-identification process, the four levels of
//     interoperability maturity, a consent-management flow, and a prior
//     authorization workflow.
//   - 8 MCQ (kind: 'mcq') on healthcare-tech/compliance concepts with no
//     single runnable snippet of their own: covered entities vs. business
//     associates, the minimum necessary standard, FHIR vs. HL7 v2, why
//     semantic interoperability specifically matters, the breach
//     notification rule, HIPAA's two de-identification methods, SMART on
//     FHIR, and why clinical trials use randomization/control groups.
//   - 8 matching (kind: 'matching') pairing terms across FHIR resource
//     types, HL7/FHIR vocabulary, clinical coding systems, HIPAA
//     vocabulary, de-identification vocabulary, clinical trial vocabulary,
//     interoperability levels, and telehealth/remote-care vocabulary.

export const HEALTHCARE_HIGHLANDS_BONUS_POOL = [
  // ---------- hands-on: code (FHIR JSON) / sequence ----------
  {
    id: 'hh-pool-01-fhir-condition',
    kind: 'code',
    language: 'json',
    npc: 'Integration Irene',
    title: 'Recording Why They\'re Here',
    prompt: 'Write a FHIR Condition resource: resourceType "Condition", a "subject" reference to the patient (e.g. { "reference": "Patient/patient-001" }), and a SNOMED CT "code" describing the diagnosis.',
    starter: '{\n  \n}',
    runLabel: 'Validate Resource',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate resource.'
      }
      if (parsed && parsed.resourceType === 'Condition' && parsed.subject?.reference && parsed.code?.coding) {
        return 'Condition resource validated.'
      }
      return 'Validation Error: resource is missing required Condition fields (resourceType, subject, code).'
    },
    hints: [
      'A Condition needs to say WHO it belongs to (subject) and WHAT it is (code) — the same shape as the other FHIR resources you\'ve already built.',
      'subject is a reference object like { "reference": "Patient/patient-001" }; code.coding is an array with a SNOMED CT system, code, and display.',
      '{\n  "resourceType": "Condition",\n  "subject": { "reference": "Patient/patient-001" },\n  "code": {\n    "coding": [\n      { "system": "http://snomed.info/sct", "code": "38341003", "display": "Hypertension" }\n    ]\n  }\n}',
    ],
    xp: 75,
    tool: { name: 'FHIR Condition resource', icon: '🩺', description: 'Records a diagnosis, coded in SNOMED CT, tied back to a specific patient.', fun: 4 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'Condition') return { success: false, message: 'resourceType must be exactly "Condition".' }
      if (!parsed.subject || typeof parsed.subject.reference !== 'string' || !parsed.subject.reference.trim()) {
        return { success: false, message: 'The resource needs a "subject" with a non-empty "reference".' }
      }
      if (!parsed.code || !Array.isArray(parsed.code.coding) || parsed.code.coding.length === 0) {
        return { success: false, message: 'The resource needs a "code" with a non-empty "coding" array.' }
      }
      return { success: true, message: 'A valid Condition — tied to a real patient, coded in a standard clinical vocabulary.' }
    },
  },
  {
    id: 'hh-pool-02-fhir-medicationrequest',
    kind: 'code',
    language: 'json',
    npc: 'Dr. Mara',
    title: 'Prescribing, in a Format Every System Understands',
    prompt: 'Write a FHIR MedicationRequest resource: resourceType "MedicationRequest", "status" of "active", a "subject" reference, and a "medicationCodeableConcept" naming the drug.',
    starter: '{\n  \n}',
    runLabel: 'Validate Resource',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate resource.'
      }
      if (parsed && parsed.resourceType === 'MedicationRequest' && parsed.status && parsed.subject?.reference && parsed.medicationCodeableConcept) {
        return `MedicationRequest validated. Status: ${parsed.status}.`
      }
      return 'Validation Error: resource is missing required MedicationRequest fields.'
    },
    hints: [
      'Four required pieces: resourceType, status (the request\'s current state), subject (who it\'s for), and medicationCodeableConcept (what\'s being prescribed).',
      'medicationCodeableConcept can be as simple as { "text": "Amoxicillin 500mg" }.',
      '{\n  "resourceType": "MedicationRequest",\n  "status": "active",\n  "subject": { "reference": "Patient/patient-001" },\n  "medicationCodeableConcept": { "text": "Amoxicillin 500mg" }\n}',
    ],
    xp: 75,
    tool: { name: 'FHIR MedicationRequest', icon: '💊', description: 'A prescription, standardized — status, patient, and medication, all in one interoperable shape.', fun: 4 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'MedicationRequest') return { success: false, message: 'resourceType must be exactly "MedicationRequest".' }
      if (!parsed.status || typeof parsed.status !== 'string' || !parsed.status.trim()) return { success: false, message: 'The resource needs a non-empty "status" field.' }
      if (!parsed.subject || typeof parsed.subject.reference !== 'string' || !parsed.subject.reference.trim()) {
        return { success: false, message: 'The resource needs a "subject" with a non-empty "reference".' }
      }
      if (!parsed.medicationCodeableConcept) return { success: false, message: 'The resource needs a "medicationCodeableConcept" naming the drug.' }
      return { success: true, message: 'A valid prescription — readable by any system that speaks FHIR.' }
    },
  },
  {
    id: 'hh-pool-03-fhir-allergyintolerance',
    kind: 'code',
    language: 'json',
    npc: 'Dr. Mara',
    title: 'One Way to Write "Penicillin Allergy"',
    prompt: 'This is exactly the problem Dr. Mara described: a hundred hospitals writing "penicillin allergy" a hundred different ways. Fix it with a standard FHIR AllergyIntolerance resource: resourceType "AllergyIntolerance", a "patient" reference, and a "code" naming the allergen.',
    starter: '{\n  \n}',
    runLabel: 'Validate Resource',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate resource.'
      }
      if (parsed && parsed.resourceType === 'AllergyIntolerance' && parsed.patient?.reference && parsed.code?.coding) {
        return 'AllergyIntolerance resource validated.'
      }
      return 'Validation Error: resource is missing required AllergyIntolerance fields.'
    },
    hints: [
      'This resource uses "patient" (not "subject") for the reference — a naming quirk worth knowing.',
      'code.coding names the allergen using a standard system, like SNOMED CT, instead of free text.',
      '{\n  "resourceType": "AllergyIntolerance",\n  "patient": { "reference": "Patient/patient-001" },\n  "code": {\n    "coding": [\n      { "system": "http://snomed.info/sct", "code": "764146007", "display": "Penicillin" }\n    ]\n  }\n}',
    ],
    xp: 80,
    tool: { name: 'FHIR AllergyIntolerance', icon: '⚠️', description: 'One standard code for an allergen, instead of a hundred different free-text spellings.', fun: 4 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'AllergyIntolerance') return { success: false, message: 'resourceType must be exactly "AllergyIntolerance".' }
      if (!parsed.patient || typeof parsed.patient.reference !== 'string' || !parsed.patient.reference.trim()) {
        return { success: false, message: 'The resource needs a "patient" reference (not "subject" — AllergyIntolerance uses "patient").' }
      }
      if (!parsed.code || !Array.isArray(parsed.code.coding) || parsed.code.coding.length === 0) {
        return { success: false, message: 'The resource needs a "code" with a non-empty "coding" array naming the allergen.' }
      }
      return { success: true, message: 'Now every hospital reads the exact same allergy, coded the exact same way — no more guessing.' }
    },
  },
  {
    id: 'hh-pool-04-fhir-bundle',
    kind: 'code',
    language: 'json',
    npc: 'Integration Irene',
    title: 'Sending Several Resources at Once',
    prompt: 'Wrap a Patient and an Observation into a single FHIR Bundle for one combined submission: resourceType "Bundle", a "type" of "transaction", and an "entry" array containing at least 2 resources (each entry has its own "resource" object with a "resourceType").',
    starter: '{\n  \n}',
    runLabel: 'Validate Bundle',
    simulate(code) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return 'Parse Error: invalid JSON — cannot validate bundle.'
      }
      const validEntries = Array.isArray(parsed?.entry) && parsed.entry.length >= 2 && parsed.entry.every((e) => e?.resource?.resourceType)
      if (parsed && parsed.resourceType === 'Bundle' && parsed.type && validEntries) {
        return `Bundle validated. ${parsed.entry.length} resources bundled as a "${parsed.type}".`
      }
      return 'Validation Error: bundle is missing required fields, or has fewer than 2 valid entries.'
    },
    hints: [
      'A Bundle is a container — "entry" is an array, and each item in it wraps one real FHIR resource under a "resource" key.',
      'Each entry needs { "resource": { "resourceType": "...", ... } } — two entries means two separate resources, e.g. a Patient and an Observation.',
      '{\n  "resourceType": "Bundle",\n  "type": "transaction",\n  "entry": [\n    { "resource": { "resourceType": "Patient", "id": "patient-001" } },\n    { "resource": { "resourceType": "Observation", "id": "obs-001", "status": "final" } }\n  ]\n}',
    ],
    xp: 85,
    tool: { name: 'FHIR Bundle', icon: '📦', description: 'Wraps multiple resources into one transactional submission, instead of sending each separately.', fun: 4 },
    check({ code }) {
      let parsed
      try {
        parsed = JSON.parse(code)
      } catch {
        return { success: false, message: 'That\'s not valid JSON — check for missing commas, quotes, or braces.' }
      }
      if (!parsed || parsed.resourceType !== 'Bundle') return { success: false, message: 'resourceType must be exactly "Bundle".' }
      if (!parsed.type || typeof parsed.type !== 'string') return { success: false, message: 'The bundle needs a "type" field (e.g. "transaction").' }
      if (!Array.isArray(parsed.entry) || parsed.entry.length < 2) return { success: false, message: 'The bundle needs an "entry" array with at least 2 resources.' }
      const validEntries = parsed.entry.every((e) => e && e.resource && e.resource.resourceType)
      if (!validEntries) return { success: false, message: 'Each entry needs a "resource" object with its own "resourceType".' }
      return { success: true, message: 'Two resources, submitted together as one bundle.' }
    },
  },
  {
    id: 'hh-pool-05-deidentification',
    kind: 'sequence',
    npc: 'Privacy Patricia',
    title: 'Making Data Safe for Research',
    prompt: 'Order the de-identification process for turning patient records into a safe research dataset.',
    items: [
      { id: 'identifiers', label: 'Remove direct identifiers (name, SSN, exact address, phone number)' },
      { id: 'quasi', label: 'Generalize quasi-identifiers (exact birthdate → birth year, exact zip → first 3 digits)' },
      { id: 'kanon', label: 'Check that no remaining record is uniquely identifiable (k-anonymity)' },
      { id: 'release', label: 'Release the de-identified dataset for research' },
    ],
    correctOrder: ['identifiers', 'quasi', 'kanon', 'release'],
    successMessage: 'Direct identifiers gone, quasi-identifiers generalized, uniqueness checked, and only then released. Research value kept, privacy protected.',
    hints: [
      'The most obvious identifiers get removed first; less obvious ones (birthdate, zip code) get generalized rather than removed entirely, since they\'re still useful for research.',
      'k-anonymity checks that even the generalized data can\'t be traced back to one specific person — that check happens before anything is released.',
      'Remove direct identifiers → Generalize quasi-identifiers → Check k-anonymity → Release for research',
    ],
    xp: 80,
    tool: { name: 'De-identification process', icon: '🕶️', description: 'Removing and generalizing identifiers until no record can be traced back to one person.', fun: 4 },
  },
  {
    id: 'hh-pool-06-interoperability-levels',
    kind: 'sequence',
    npc: 'Integration Irene',
    title: 'Four Kinds of "Talking to Each Other"',
    prompt: 'Order the four levels of healthcare system interoperability, from most basic to most complete.',
    items: [
      { id: 'foundational', label: 'Foundational: data can be sent from one system and received by another at all' },
      { id: 'structural', label: 'Structural: the data has a standard format both systems understand (e.g. HL7, FHIR)' },
      { id: 'semantic', label: 'Semantic: both systems agree on the MEANING of the coded data (e.g. shared SNOMED/LOINC codes)' },
      { id: 'organizational', label: 'Organizational: policies, workflows, and trust agreements let the exchange actually happen in practice' },
    ],
    correctOrder: ['foundational', 'structural', 'semantic', 'organizational'],
    successMessage: 'Send it, structure it, agree on what it means, and put the real-world policies in place to let it actually happen — all four levels, together.',
    hints: [
      'Foundational is the bare minimum — data moves at all. Each level after adds a deeper kind of agreement between the systems.',
      'Structural is about FORMAT; Semantic is about MEANING — a system can have one without the other.',
      'Foundational → Structural → Semantic → Organizational',
    ],
    xp: 80,
    tool: { name: 'Interoperability maturity levels', icon: '🪜', description: 'Foundational, structural, semantic, organizational — four levels of "systems talking to each other."', fun: 4 },
  },
  {
    id: 'hh-pool-07-consent-management',
    kind: 'sequence',
    npc: 'Privacy Patricia',
    title: 'What the Patient Actually Agreed To',
    prompt: 'Order a proper patient consent management flow, from asking permission to enforcing it.',
    items: [
      { id: 'present', label: 'Patient is presented with a consent form describing how their data may be shared' },
      { id: 'grant', label: 'Patient grants or denies specific data-sharing permissions' },
      { id: 'record', label: 'Consent choices are recorded in the system as structured, checkable rules' },
      { id: 'check', label: 'Every future data access request is checked against those recorded rules before anything is released' },
    ],
    correctOrder: ['present', 'grant', 'record', 'check'],
    successMessage: 'Asked, decided, recorded, and enforced on every single future request — consent that actually means something, not just paperwork.',
    hints: [
      'A patient has to be asked before they can grant or deny anything.',
      'Recording the decision as structured rules is what makes it possible to actually CHECK against it automatically later, instead of just filing it away.',
      'Present consent form → Patient grants/denies → Record as structured rules → Check every future access request against them',
    ],
    xp: 75,
    tool: { name: 'Consent management', icon: '✅', description: 'Turns a patient\'s stated preference into a rule the system actually enforces on every future request.', fun: 4 },
  },
  {
    id: 'hh-pool-08-prior-authorization',
    kind: 'sequence',
    npc: 'Clinical Carl',
    title: 'Getting the Insurer to Say Yes',
    prompt: 'Order the prior authorization workflow for an expensive treatment or medication.',
    items: [
      { id: 'submit', label: 'Provider submits a prior authorization request for the treatment' },
      { id: 'review', label: 'Payer (insurance) reviews the request against its clinical criteria' },
      { id: 'decision', label: 'Payer approves or denies the request' },
      { id: 'proceed', label: 'Provider proceeds with treatment, or appeals a denial' },
    ],
    correctOrder: ['submit', 'review', 'decision', 'proceed'],
    successMessage: 'Submitted, reviewed against real criteria, decided, and acted on — the full loop a provider goes through before an insurer will cover an expensive treatment.',
    hints: [
      'Nothing can be reviewed before it\'s actually submitted, and nothing can be decided before it\'s reviewed.',
      'A denial isn\'t necessarily the end — providers can appeal, which is why "proceed" covers both outcomes.',
      'Provider submits request → Payer reviews against criteria → Payer decides → Provider proceeds or appeals',
    ],
    xp: 70,
    tool: { name: 'Prior authorization workflow', icon: '📝', description: 'Submit, review, decide, act — the loop before an insurer covers an expensive treatment.', fun: 3 },
  },

  // ---------- MCQ: healthcare-tech / compliance concepts ----------
  {
    id: 'hh-pool-09-mcq-covered-entities',
    kind: 'mcq',
    npc: 'Privacy Patricia',
    title: 'Who HIPAA Actually Applies To',
    prompt: "What's the difference between a HIPAA 'covered entity' and a 'business associate'?",
    options: [
      'A covered entity (like a hospital or health plan) is directly regulated by HIPAA; a business associate is a vendor that handles PHI on the covered entity\'s behalf, bound by a signed Business Associate Agreement that extends similar obligations to them',
      'They are two names for the exact same thing',
      'A business associate is always a government agency',
      'Covered entities are only hospitals, never insurance companies or clinics',
    ],
    correctIndex: 0,
    explanation: 'Covered entities (providers, health plans, clearinghouses) are directly bound by HIPAA. When they use an outside vendor that touches PHI (a billing company, a cloud host), that vendor becomes a "business associate" and must sign a Business Associate Agreement extending comparable privacy/security obligations to them.',
    hints: [
      'One of these is directly regulated; the other becomes bound through a signed agreement because they handle PHI on the first one\'s behalf.',
      'Think of a hospital (covered entity) hiring an outside billing company (business associate) that touches the same PHI.',
      'The correct answer is: covered entities are directly regulated; business associates are vendors bound via a signed agreement.',
    ],
    xp: 50,
    tool: { name: 'Covered entity vs. business associate', icon: '📜', description: 'Directly regulated vs. bound through a signed Business Associate Agreement.', fun: 3 },
  },
  {
    id: 'hh-pool-10-mcq-minimum-necessary',
    kind: 'mcq',
    npc: 'Privacy Patricia',
    title: 'The Minimum Necessary Standard',
    prompt: "What does HIPAA's 'minimum necessary' standard require?",
    options: [
      'Only the minimum amount of PHI needed to accomplish a specific task should be accessed, used, or shared — not a whole chart when only one data point is needed',
      'Every hospital must hire the minimum number of staff legally required',
      'Patients must be given the minimum amount of information about their own care',
      'Data can only be stored for a minimum of one year',
    ],
    correctIndex: 0,
    explanation: 'The minimum necessary standard means access, use, and disclosure of PHI should be limited to what\'s actually needed for the purpose at hand — a billing clerk doesn\'t need access to a patient\'s full psychiatric notes just to process a claim.',
    hints: [
      'It\'s about limiting HOW MUCH PHI is touched for a given task, not about staffing or storage duration.',
      'Think about a billing clerk who only needs a diagnosis code, not an entire medical history.',
      'The correct answer is: only the minimum PHI needed for a specific task should be accessed, used, or shared.',
    ],
    xp: 45,
    tool: { name: 'Minimum necessary standard', icon: '🔎', description: 'Access only the PHI actually needed for the task at hand — never more.', fun: 3 },
  },
  {
    id: 'hh-pool-11-mcq-fhir-vs-hl7v2',
    kind: 'mcq',
    npc: 'Integration Irene',
    title: 'Why FHIR Exists Alongside HL7 v2',
    prompt: "Why was FHIR created when HL7 v2 already existed?",
    options: [
      'HL7 v2 uses an older pipe-delimited message format that\'s hard to integrate with modern web/mobile apps; FHIR uses REST and JSON/XML, making it far easier to build apps against, using patterns web developers already know',
      'FHIR completely replaced HL7 v2, which is no longer used anywhere',
      'FHIR is only used for billing, and HL7 v2 is only used for clinical data',
      'They are actually the exact same standard with two different names',
    ],
    correctIndex: 0,
    explanation: 'HL7 v2\'s message format predates the modern web and is genuinely awkward to integrate with today\'s apps. FHIR was built around REST APIs and JSON/XML specifically so building a modern web or mobile app against healthcare data feels like building against any other modern API — HL7 v2 is still widely used in existing hospital systems, not replaced.',
    hints: [
      'Think about what modern web/mobile developers are already used to working with, versus an older message format designed decades earlier.',
      'HL7 v2 hasn\'t disappeared — it\'s still everywhere in existing hospital systems, which is exactly why "interface engines" translating between the two still exist.',
      'The correct answer is: FHIR uses modern REST/JSON, far easier to build apps against than HL7 v2\'s older message format.',
    ],
    xp: 55,
    tool: { name: 'FHIR vs. HL7 v2', icon: '📠', description: 'FHIR brings modern REST/JSON APIs to healthcare data exchange, alongside still-widespread HL7 v2.', fun: 3 },
  },
  {
    id: 'hh-pool-12-mcq-semantic-interop',
    kind: 'mcq',
    npc: 'Integration Irene',
    title: 'Why Semantic Interoperability Specifically Matters',
    prompt: "Two hospitals can successfully send each other patient files (structural interoperability works). Why might they still fail to understand each other's data?",
    options: [
      'Without semantic interoperability, the two systems might use different codes or free text for the same concept (like "penicillin allergy"), so the data arrives readable but isn\'t understood the same way by both sides',
      'This is impossible — structural interoperability always guarantees full understanding',
      'It only happens if one hospital uses a slower internet connection',
      'Semantic interoperability is only relevant to billing, never clinical data',
    ],
    correctIndex: 0,
    explanation: 'Structural interoperability just means the message FORMAT is understood — the file parses correctly. Semantic interoperability means both sides agree on what the CODED VALUES inside actually mean, which is exactly the "penicillin allergy written a hundred different ways" problem this whole zone is built around.',
    hints: [
      'The file arriving and PARSING correctly is different from both systems agreeing on what the data inside actually MEANS.',
      'This is literally the exact problem described in this zone\'s opening story.',
      'The correct answer is: without semantic interoperability, the same concept can be coded differently and not be understood the same way by both sides.',
    ],
    xp: 55,
    tool: { name: 'Semantic interoperability', icon: '🧩', description: 'Format arriving correctly is not the same as both systems agreeing on what it means.', fun: 4 },
  },
  {
    id: 'hh-pool-13-mcq-breach-notification',
    kind: 'mcq',
    npc: 'Privacy Patricia',
    title: 'When a Breach Happens',
    prompt: "What does HIPAA's Breach Notification Rule require after a breach of unsecured PHI?",
    options: [
      'Affected individuals (and, for larger breaches, HHS and sometimes the media) must be notified within specific required timeframes',
      'Nothing — HIPAA has no requirement to ever disclose a breach',
      'Only the hospital\'s own IT department needs to be informed, with no outside notification ever required',
      'The affected records must be permanently deleted immediately, with no notification necessary',
    ],
    correctIndex: 0,
    explanation: 'The Breach Notification Rule requires notifying affected individuals without unreasonable delay (generally within 60 days), and for breaches affecting 500+ individuals, notifying HHS and often local media as well — transparency is mandatory, not optional.',
    hints: [
      'It\'s specifically about WHO must be told, and by WHEN — not about deleting anything or staying silent.',
      'Larger breaches trigger even broader notification requirements, including to a federal agency.',
      'The correct answer is: affected individuals (and for large breaches, HHS/media) must be notified within required timeframes.',
    ],
    xp: 50,
    tool: { name: 'Breach Notification Rule', icon: '🚨', description: 'Requires timely notification of affected individuals — and for large breaches, HHS and the media.', fun: 3 },
  },
  {
    id: 'hh-pool-14-mcq-deidentification-methods',
    kind: 'mcq',
    npc: 'Dr. Mara',
    title: 'Two Ways to De-Identify Data',
    prompt: "HIPAA recognizes two different accepted methods for de-identifying PHI. What are they?",
    options: [
      'Safe Harbor (removing 18 specific categories of identifiers listed by name) and Expert Determination (a qualified statistician/expert certifies re-identification risk is very small)',
      'Encryption and password-protection — the only two methods HIPAA recognizes',
      'Deleting the data entirely, or making a copy of it — those are the only two options',
      'There is only one accepted de-identification method, not two',
    ],
    correctIndex: 0,
    explanation: 'Safe Harbor is a checklist method — strip out 18 specifically named identifier types (names, dates more precise than year, exact geographic subdivisions smaller than a state, etc.). Expert Determination instead has a qualified expert apply statistical methods to certify the re-identification risk is very small — useful when Safe Harbor would remove too much research value.',
    hints: [
      'One method is a literal checklist of specific fields to remove; the other relies on an expert\'s statistical judgment instead of a fixed list.',
      'Encryption and deletion aren\'t what "de-identification" means here at all — this is specifically about anonymizing data while keeping it usable.',
      'The correct answer is: Safe Harbor (remove 18 listed identifier types) and Expert Determination (expert-certified low re-identification risk).',
    ],
    xp: 55,
    tool: { name: 'De-identification methods', icon: '🕶️', description: 'Safe Harbor\'s fixed checklist vs. Expert Determination\'s statistical certification.', fun: 4 },
  },
  {
    id: 'hh-pool-15-mcq-smart-on-fhir',
    kind: 'mcq',
    npc: 'Integration Irene',
    title: 'What SMART on FHIR Actually Adds',
    prompt: 'What does SMART on FHIR provide, on top of the FHIR data standard itself?',
    options: [
      'An OAuth2-based authorization framework letting a third-party app securely request exactly the patient data it needs, with the patient\'s (or provider\'s) explicit consent — FHIR alone defines data shape, not who\'s allowed to see it',
      'A faster version of the FHIR API with no other differences',
      'A replacement for FHIR that doesn\'t use JSON at all',
      'A billing system unrelated to app authorization',
    ],
    correctIndex: 0,
    explanation: 'FHIR standardizes what the DATA looks like. SMART on FHIR standardizes HOW an app gets AUTHORIZED to access that data — built on OAuth2, so a third-party app can request specific scopes of a patient\'s record with explicit consent, without needing hospital-specific custom authorization code.',
    hints: [
      'FHIR itself is about the SHAPE of the data; this is specifically about WHO gets permission to access it, and how that\'s granted.',
      'It\'s built on a well-known web authorization standard, applied to the healthcare context.',
      'The correct answer is: an OAuth2-based authorization framework for apps to securely request patient data with consent.',
    ],
    xp: 55,
    tool: { name: 'SMART on FHIR', icon: '🔑', description: 'OAuth2-based authorization letting apps securely request exactly the FHIR data they need.', fun: 4 },
  },
  {
    id: 'hh-pool-16-mcq-clinical-trial-controls',
    kind: 'mcq',
    npc: 'Clinical Carl',
    title: 'Why Trials Need a Control Group',
    prompt: 'Why do Phase 3 clinical trials use randomization and a control/comparison group instead of just giving everyone the new treatment and seeing what happens?',
    options: [
      'Without a comparable group NOT getting the new treatment, there\'s no way to tell whether an observed outcome was actually caused by the treatment, or would have happened anyway (placebo effect, natural recovery, chance)',
      'Control groups exist purely to reduce the cost of running the trial',
      'Randomization is only used to decide which hospital runs the trial',
      'A control group is legally required paperwork with no scientific purpose',
    ],
    correctIndex: 0,
    explanation: 'Without a comparison group, you can\'t isolate the treatment\'s actual effect from other explanations — the placebo effect, the condition improving on its own, or pure chance. Randomly assigning patients to treatment vs. control also helps ensure the two groups are otherwise similar, so any difference in outcome is more confidently attributable to the treatment itself.',
    hints: [
      'Without something to compare against, you can\'t rule out that the outcome would have happened anyway, treatment or not.',
      'Randomization\'s job is making sure the treatment and control groups are otherwise similar, so the comparison is fair.',
      'The correct answer is: a control group is needed to isolate whether the treatment itself caused the outcome, versus chance or other explanations.',
    ],
    xp: 55,
    tool: { name: 'Clinical trial control groups', icon: '💊', description: 'Isolates whether a treatment actually caused the outcome, instead of chance or the placebo effect.', fun: 4 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'hh-pool-17-match-fhirresources',
    kind: 'matching',
    npc: 'Integration Irene',
    title: 'FHIR Resource Types',
    prompt: 'Match each FHIR resource type to its purpose.',
    pairs: [
      { id: 'a', left: 'Patient', right: 'Who the person is — demographics and identity' },
      { id: 'b', left: 'Encounter', right: 'A specific visit or interaction with the healthcare system' },
      { id: 'c', left: 'Condition', right: 'A diagnosis or health problem the patient has' },
      { id: 'd', left: 'Observation', right: 'A measured or recorded data point — a vital sign, a lab result' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Patient and Encounter describe WHO and WHEN; Condition and Observation describe WHAT was found or measured during that encounter.',
      'A Condition is a diagnosis; an Observation is a specific measurement (which might support that diagnosis).',
      'Patient → who they are. Encounter → the visit itself. Condition → a diagnosis. Observation → a measured data point.',
    ],
    xp: 60,
    successMessage: 'Every core FHIR resource in a patient\'s chart, matched to what it actually represents.',
    tool: { name: 'FHIR resource types', icon: '🗂️', description: 'Patient, Encounter, Condition, and Observation compared.', fun: 3 },
  },
  {
    id: 'hh-pool-18-match-hl7fhirvocab',
    kind: 'matching',
    npc: 'Integration Irene',
    title: 'HL7 / FHIR Vocabulary',
    prompt: 'Match each HL7/FHIR term to its meaning.',
    pairs: [
      { id: 'a', left: 'HL7 v2', right: 'An older, pipe-delimited message format still widely used between hospital systems' },
      { id: 'b', left: 'FHIR', right: 'A modern standard using REST APIs and JSON/XML for healthcare data exchange' },
      { id: 'c', left: 'SMART on FHIR', right: 'An OAuth2-based authorization layer for apps requesting FHIR data with consent' },
      { id: 'd', left: 'Interface Engine', right: 'Software that translates messages between different formats/standards (e.g. HL7 v2 to FHIR)' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'HL7 v2 and FHIR are the two DATA STANDARDS themselves; SMART on FHIR and Interface Engine are both SUPPORTING pieces around those standards.',
      'SMART on FHIR is about authorization; an Interface Engine is about translation between formats.',
      'HL7 v2 → older pipe-delimited format. FHIR → modern REST/JSON standard. SMART on FHIR → OAuth2 authorization for apps. Interface Engine → translates between formats.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind how hospital systems actually exchange data, matched up.',
    tool: { name: 'HL7 / FHIR vocabulary', icon: '📠', description: 'HL7 v2, FHIR, SMART on FHIR, and interface engines.', fun: 4 },
  },
  {
    id: 'hh-pool-19-match-codingsystems',
    kind: 'matching',
    npc: 'Dr. Mara',
    title: 'Clinical Coding Systems',
    prompt: 'Match each clinical coding system to what it\'s used for.',
    pairs: [
      { id: 'a', left: 'SNOMED CT', right: 'Detailed clinical terminology — symptoms, findings, diagnoses, in clinical detail' },
      { id: 'b', left: 'ICD-10', right: 'Billing/diagnostic codes, standardized for insurance claims and statistics' },
      { id: 'c', left: 'LOINC', right: 'Standard codes for lab tests and clinical observations' },
      { id: 'd', left: 'CPT', right: 'Standard codes for medical procedures and services performed' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'SNOMED CT and ICD-10 both describe DIAGNOSES, but at different levels of clinical detail vs. billing standardization; LOINC and CPT describe TESTS and PROCEDURES respectively.',
      'LOINC is specifically for lab tests/observations; CPT is specifically for procedures/services performed.',
      'SNOMED CT → detailed clinical terminology. ICD-10 → billing diagnosis codes. LOINC → lab test/observation codes. CPT → procedure/service codes.',
    ],
    xp: 65,
    successMessage: 'Four coding systems, each covering a different piece of a clinical encounter, matched up.',
    tool: { name: 'Clinical coding systems', icon: '🏷️', description: 'SNOMED CT, ICD-10, LOINC, and CPT compared.', fun: 4 },
  },
  {
    id: 'hh-pool-20-match-hipaavocab',
    kind: 'matching',
    npc: 'Privacy Patricia',
    title: 'HIPAA Vocabulary',
    prompt: 'Match each HIPAA term to its meaning.',
    pairs: [
      { id: 'a', left: 'Covered entity', right: 'A provider, health plan, or clearinghouse directly regulated by HIPAA' },
      { id: 'b', left: 'Business associate', right: 'A vendor handling PHI on a covered entity\'s behalf, bound by a signed agreement' },
      { id: 'c', left: 'PHI', right: 'Protected Health Information — individually identifiable health data' },
      { id: 'd', left: 'Minimum necessary standard', right: 'Only access, use, or share the minimum PHI actually needed for the task' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Covered entity and Business associate are both ROLES (who\'s bound by HIPAA, and how); PHI and Minimum necessary standard are both about the DATA itself and how much of it to touch.',
      'A business associate becomes bound through a signed agreement — they\'re not directly a covered entity themselves.',
      'Covered entity → directly regulated. Business associate → vendor bound by agreement. PHI → identifiable health data. Minimum necessary → only touch what\'s actually needed.',
    ],
    xp: 65,
    successMessage: 'The core HIPAA vocabulary, matched to its exact meaning.',
    tool: { name: 'HIPAA vocabulary', icon: '🔒', description: 'Covered entities, business associates, PHI, and the minimum necessary standard.', fun: 4 },
  },
  {
    id: 'hh-pool-21-match-deidentificationvocab',
    kind: 'matching',
    npc: 'Privacy Patricia',
    title: 'De-Identification Vocabulary',
    prompt: 'Match each de-identification term to its meaning.',
    pairs: [
      { id: 'a', left: 'Direct identifier', right: 'Immediately identifies someone on its own — name, SSN, exact address' },
      { id: 'b', left: 'Quasi-identifier', right: 'Not identifying alone, but can identify someone when combined with other data (birthdate, zip code)' },
      { id: 'c', left: 'Safe Harbor method', right: 'Removes 18 specific, named categories of identifiers as a fixed checklist' },
      { id: 'd', left: 'Expert Determination method', right: 'A qualified expert statistically certifies re-identification risk is very small' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Direct identifier and Quasi-identifier describe TYPES OF DATA; Safe Harbor and Expert Determination describe the two accepted HIPAA METHODS for removing/handling them.',
      'A quasi-identifier alone seems harmless, but combined with a few others it can still pinpoint one person.',
      'Direct identifier → identifies alone. Quasi-identifier → identifies only combined with other data. Safe Harbor → fixed checklist removal. Expert Determination → expert-certified statistical risk assessment.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind turning patient records into safe research data, matched up.',
    tool: { name: 'De-identification vocabulary', icon: '🕶️', description: 'Direct/quasi-identifiers, Safe Harbor, and Expert Determination.', fun: 4 },
  },
  {
    id: 'hh-pool-22-match-clinicaltrialvocab',
    kind: 'matching',
    npc: 'Clinical Carl',
    title: 'Clinical Trial Vocabulary',
    prompt: 'Match each clinical trial term to its meaning.',
    pairs: [
      { id: 'a', left: 'Placebo', right: 'An inactive treatment given to the control group, indistinguishable from the real one' },
      { id: 'b', left: 'Control group', right: 'The group NOT receiving the new treatment, used as a comparison baseline' },
      { id: 'c', left: 'Randomization', right: 'Randomly assigning patients to treatment or control, so the two groups start out comparable' },
      { id: 'd', left: 'Informed consent', right: 'The patient is fully told the risks/purpose of the trial and agrees to participate, in writing' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Placebo and Control group both describe the COMPARISON side of a trial; Randomization and Informed consent describe how patients get ASSIGNED and how they AGREE to participate.',
      'A placebo is what the control group actually RECEIVES; randomization is HOW patients get split between the two groups in the first place.',
      'Placebo → inactive comparison treatment. Control group → the non-treatment comparison group. Randomization → random assignment for a fair comparison. Informed consent → fully informed, written agreement to participate.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind every rigorous clinical trial, matched up.',
    tool: { name: 'Clinical trial vocabulary', icon: '💊', description: 'Placebo, control groups, randomization, and informed consent.', fun: 4 },
  },
  {
    id: 'hh-pool-23-match-interoplevels',
    kind: 'matching',
    npc: 'Integration Irene',
    title: 'Interoperability Levels',
    prompt: 'Match each interoperability level to what it actually guarantees.',
    pairs: [
      { id: 'a', left: 'Foundational', right: 'Data can be sent from one system and received by another at all' },
      { id: 'b', left: 'Structural', right: 'The data has a standard format both systems understand' },
      { id: 'c', left: 'Semantic', right: 'Both systems agree on the meaning of the coded data' },
      { id: 'd', left: 'Organizational', right: 'Policies, workflows, and trust agreements let the exchange actually happen in practice' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Foundational and Structural are both about the MECHANICS of exchange (can it move, does the format parse); Semantic and Organizational are about deeper AGREEMENT (meaning, and real-world policy) needed for it to matter.',
      'Structural is about FORMAT; Semantic is about MEANING — a common point of confusion worth locking in.',
      'Foundational → can send/receive at all. Structural → shared format. Semantic → shared meaning. Organizational → real-world policies/trust enabling it.',
    ],
    xp: 65,
    successMessage: 'The four levels of interoperability, matched to what each one actually guarantees.',
    tool: { name: 'Interoperability levels', icon: '🪜', description: 'Foundational, structural, semantic, and organizational interoperability.', fun: 4 },
  },
  {
    id: 'hh-pool-24-match-telehealthvocab',
    kind: 'matching',
    npc: 'Dr. Mara',
    title: 'Telehealth & Remote Care Vocabulary',
    prompt: 'Match each telehealth/remote-care term to its meaning.',
    pairs: [
      { id: 'a', left: 'Telehealth', right: 'Delivering clinical care remotely, over video or phone, instead of in person' },
      { id: 'b', left: 'Remote patient monitoring', right: 'Devices at home continuously send a patient\'s vitals back to their care team' },
      { id: 'c', left: 'AI triage', right: 'An automated system helps assess urgency and route a patient before they see a clinician' },
      { id: 'd', left: 'Store-and-forward', right: 'Clinical data is captured and sent for later review, instead of requiring a live real-time connection' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Telehealth and Remote patient monitoring are both about care happening OUTSIDE a clinic; AI triage and Store-and-forward describe two specific TECHNIQUES used within remote care.',
      'Store-and-forward is specifically about NOT needing a live connection — data gets captured now, reviewed later.',
      'Telehealth → remote clinical care, live. Remote patient monitoring → continuous vitals from home devices. AI triage → automated urgency assessment/routing. Store-and-forward → captured now, reviewed later, no live connection needed.',
    ],
    xp: 65,
    successMessage: 'The core vocabulary behind care delivered outside the clinic, matched up.',
    tool: { name: 'Telehealth vocabulary', icon: '📱', description: 'Telehealth, remote patient monitoring, AI triage, and store-and-forward.', fun: 4 },
  },
]
