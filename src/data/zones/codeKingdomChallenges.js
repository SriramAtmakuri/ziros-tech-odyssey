// Code Kingdom — Git, CI/CD, Docker, Kubernetes, Terraform.
// Three challenge "kinds" beyond SQL Island's Monaco+sql.js combo:
//   'terminal' — type real CLI commands against a simulated shell
//   'sequence' — click shuffled pieces into the correct order
//   'code'     — write/fix Dockerfile & Terraform text, pattern-checked (no live engine)

const JENKINSFILE_BROKEN = `pipeline {
  stages {
    stage('Build') {
      step {
        echo 'Building...'
      }
    }
    stage('Test') {
      steps {
        echo 'Testing...'
      }
    }
  }
}`

const DOCKERFILE_BROKEN = `FROM node
CMD npm start
COPY . /app
EXPOSE "3000"
WORKDIR /app`

export const CODE_KINGDOM_CHALLENGES = [
  {
    id: 'ck-00-first-command',
    kind: 'terminal',
    npc: 'Sir Commit',
    title: 'Your First Command',
    prompt: 'Let\'s get comfortable with this box first. Type exactly: pwd — then press Enter. It just asks "where am I right now?"',
    steps: [
      { match: /^pwd$/i, output: '/kingdom' },
    ],
    successMessage: 'pwd means "print working directory" — you just ran your first terminal command.',
    hints: [
      'You don\'t need to know what it does yet — just type the 3 letters shown and press Enter.',
      'It\'s exactly: pwd',
      'pwd',
    ],
    xp: 15,
    tool: {
      name: 'pwd', icon: '📍', description: 'Shows which folder you\'re currently standing in.', fun: 1,
    },
  },

  {
    id: 'ck-00-second-command',
    kind: 'terminal',
    npc: 'Sir Commit',
    title: 'One More',
    prompt: 'One more before the real work. Type exactly: ls — then press Enter. It lists what\'s in this folder.',
    steps: [
      { match: /^ls$/i, output: 'battle_plan.txt  README.md' },
    ],
    successMessage: 'ls lists files in the current folder. Two commands down — you\'ve got the hang of this.',
    hints: [
      'Same idea as before — just type the 2 letters shown and press Enter.',
      'It\'s exactly: ls',
      'ls',
    ],
    xp: 15,
    tool: {
      name: 'ls', icon: '📋', description: 'Lists the files and folders in your current location.', fun: 1,
    },
  },

  {
    id: 'ck-01-git-init',
    kind: 'terminal',
    npc: 'Sir Commit',
    title: 'Tracking the Scrolls',
    prompt: 'The kingdom\'s code has no history at all — one mistake and it\'s gone forever. Initialize a repository, stage everything, then make the first commit.',
    steps: [
      { match: /^git init$/i, output: 'Initialized empty Git repository in /kingdom/.git/' },
      { match: /^git add \.$/i, output: 'Staged all scrolls for commit.' },
      { match: /^git commit -m ".+"$/i, output: '[main (root-commit) a1b2c3d] your message\n 1 file changed, 1 insertion(+)' },
    ],
    successMessage: 'The kingdom\'s first commit. History begins now.',
    hints: [
      'Three commands, in order: create the repo, stage everything, then commit.',
      '`git init` starts it. `git add .` stages every file. `git commit -m "..."` needs a message in quotes.',
      'git init\ngit add .\ngit commit -m "first commit"',
    ],
    xp: 50,
    tool: { name: 'git init / add / commit', icon: '📜', description: 'Create a repo, stage changes, and record a snapshot.', fun: 4 },
  },

  {
    id: 'ck-02-branch-merge',
    kind: 'terminal',
    npc: 'Sir Commit',
    title: 'Two Knights, One Scroll',
    prompt: 'Two knights need to work on the same scroll without stepping on each other. Create a branch called `feature`, switch to it, switch back to `main`, then merge `feature` in.',
    steps: [
      { match: /^git branch feature$/i, output: 'Branch \'feature\' created.' },
      { match: /^git (checkout|switch) feature$/i, output: 'Switched to branch \'feature\'.' },
      { match: /^git (checkout|switch) main$/i, output: 'Switched to branch \'main\'.' },
      { match: /^git merge feature$/i, output: 'Merge made by the \'ort\' strategy. No conflicts.' },
    ],
    successMessage: 'Two knights, one scroll, zero conflicts.',
    hints: [
      'Four commands: make the branch, move to it, move back to main, then merge.',
      '`git branch feature`, then `git checkout feature`, then `git checkout main`, then `git merge feature`.',
      'git branch feature\ngit checkout feature\ngit checkout main\ngit merge feature',
    ],
    xp: 55,
    tool: { name: 'git branch / checkout / merge', icon: '🌿', description: 'Isolate work on a branch, then bring it back into main.', fun: 4 },
  },

  {
    id: 'ck-03-log-revert',
    kind: 'terminal',
    npc: 'Sir Commit',
    title: 'The Cursed Scroll',
    prompt: 'The last commit turned out to be cursed. Look at the history, then undo it safely without erasing the record that it happened.',
    steps: [
      { match: /^git log --oneline$/i, output: 'a1b2c3d (HEAD -> main) the cursed change\nf9e8d7c first commit' },
      { match: /^git revert head$/i, output: '[main 7c6b5a4] Revert "the cursed change"\n 1 file changed, 1 deletion(-)' },
    ],
    successMessage: 'Undone, and the history remembers why. That\'s the difference between revert and reset.',
    hints: [
      'First, see the history. Then undo the most recent commit without deleting it from the log.',
      '`git log --oneline` lists commits compactly. `git revert HEAD` creates a new commit that undoes the last one.',
      'git log --oneline\ngit revert HEAD',
    ],
    xp: 60,
    tool: { name: 'git log / revert', icon: '🕰️', description: 'See history, and undo a commit by creating an inverse one instead of deleting it.', fun: 3 },
  },

  {
    id: 'ck-04-pr-flow',
    kind: 'sequence',
    npc: 'Lady Pipeline',
    title: 'The Review Ritual',
    prompt: 'No code reaches the castle\'s main branch without review. Put the pull request ritual in the right order.',
    items: [
      { id: 'open', label: 'Open Pull Request' },
      { id: 'review', label: 'Request Review' },
      { id: 'feedback', label: 'Address Feedback' },
      { id: 'approve', label: 'Reviewer Approves' },
      { id: 'merge', label: 'Merge to Main' },
    ],
    correctOrder: ['open', 'review', 'feedback', 'approve', 'merge'],
    successMessage: 'The review ritual, done right. Quality in, bugs out.',
    hints: [
      'You can\'t get approval before anyone\'s reviewed it, and you can\'t merge before approval.',
      'Opening comes first, merging comes last — the middle three are review, feedback, approval, in that order.',
      'Open Pull Request → Request Review → Address Feedback → Reviewer Approves → Merge to Main',
    ],
    xp: 55,
    tool: { name: 'Pull Request workflow', icon: '🔍', description: 'Open → review → address feedback → approve → merge.', fun: 3 },
  },

  {
    id: 'ck-05-jenkins-debug',
    kind: 'code',
    language: 'yaml',
    npc: 'Lady Pipeline',
    title: 'The Broken Pipeline',
    prompt: 'This Jenkins pipeline has bugs stopping every build. Find and fix them — Jenkins stages need a `steps` block (not `step`), and every stage should actually run.',
    starter: JENKINSFILE_BROKEN,
    runLabel: 'Run Pipeline',
    simulate(code) {
      const ok = /steps\s*\{/.test(code) && !/\bstep\s*\{/.test(code)
      return ok
        ? 'Started by user Ziro\n[Pipeline] stage (Build)\nBuilding...\n[Pipeline] stage (Test)\nTesting...\nFinished: SUCCESS'
        : 'Started by user Ziro\n[Pipeline] stage (Build)\nERROR: No such DSL method \'step\' found among steps\nFinished: FAILURE'
    },
    hints: [
      'Jenkins declarative pipelines use a `steps { }` block inside each stage — check both stages use the same keyword.',
      'One stage has `step { }` (singular) instead of `steps { }` (plural) — that\'s invalid syntax.',
      'pipeline {\n  stages {\n    stage(\'Build\') {\n      steps {\n        echo \'Building...\'\n      }\n    }\n    stage(\'Test\') {\n      steps {\n        echo \'Testing...\'\n      }\n    }\n  }\n}',
    ],
    xp: 65,
    tool: { name: 'Jenkins pipeline', icon: '⚙️', description: 'Declarative CI pipeline: stages, each with a steps block.', fun: 3 },
    check({ code }) {
      if (/\bstep\s*\{/.test(code)) {
        return { success: false, message: 'Still see a `step {` block — Jenkins needs `steps {` (plural).' }
      }
      if (!/steps\s*\{[^}]*echo/.test(code) || (code.match(/steps\s*\{/g) || []).length < 2) {
        return { success: false, message: 'Both stages need a working `steps {}` block with their echo command inside.' }
      }
      return { success: true, message: 'Both stages run clean. The pipeline is green again.' }
    },
  },

  {
    id: 'ck-06-actions-workflow',
    kind: 'sequence',
    npc: 'Lady Pipeline',
    title: 'Building the Workflow',
    prompt: 'Assemble a GitHub Actions workflow for the kingdom\'s app, in the order it should run.',
    items: [
      { id: 'checkout', label: 'Checkout code' },
      { id: 'install', label: 'Install dependencies' },
      { id: 'test', label: 'Run tests' },
      { id: 'build', label: 'Build' },
      { id: 'deploy', label: 'Deploy' },
    ],
    correctOrder: ['checkout', 'install', 'test', 'build', 'deploy'],
    successMessage: 'A real CI/CD workflow. Releases stop being terrifying.',
    hints: [
      'You need the code before you can install anything, and you shouldn\'t deploy before it\'s tested.',
      'Checkout always comes first; deploy always comes last.',
      'Checkout code → Install dependencies → Run tests → Build → Deploy',
    ],
    xp: 70,
    tool: { name: 'GitHub Actions workflow', icon: '🔁', description: 'checkout → install → test → build → deploy, automated on every push.', fun: 4 },
  },

  {
    id: 'ck-07-write-dockerfile',
    kind: 'code',
    language: 'dockerfile',
    npc: 'Lord Container',
    title: 'Packaging the App',
    prompt: 'Package the kingdom\'s app so it runs identically anywhere. Write a Dockerfile: base image, copy the app in, expose port 3000, and start it with `npm start`.',
    starter: '# FROM, COPY, EXPOSE, CMD\n',
    runLabel: 'Build Image',
    simulate(code) {
      const hasFrom = /^FROM\s+\S+/im.test(code)
      return hasFrom
        ? 'Step 1/4 : FROM node\nStep 2/4 : COPY . /app\nStep 3/4 : EXPOSE 3000\nStep 4/4 : CMD ["npm", "start"]\nSuccessfully built ziro-app:latest'
        : 'Error: Dockerfile parse error — no FROM statement found'
    },
    hints: [
      'Every Dockerfile starts with a base image via FROM, then copies files, exposes a port, and defines a start command.',
      'You need: FROM node, COPY . /app, EXPOSE 3000, and CMD to run npm start.',
      'FROM node\nWORKDIR /app\nCOPY . /app\nEXPOSE 3000\nCMD ["npm", "start"]',
    ],
    xp: 70,
    tool: { name: 'Dockerfile', icon: '🐳', description: 'FROM base image, COPY app files, EXPOSE a port, CMD to run it.', fun: 4 },
    check({ code }) {
      const hasFrom = /^FROM\s+\S+/im.test(code)
      const hasCopy = /^COPY\s+\S+\s+\S+/im.test(code)
      const hasExpose = /^EXPOSE\s+3000/im.test(code)
      const hasCmd = /^CMD\s+/im.test(code)
      if (!hasFrom) return { success: false, message: 'Missing a FROM line — every Dockerfile needs a base image.' }
      if (!hasCopy) return { success: false, message: 'Missing a COPY line to get your app files into the image.' }
      if (!hasExpose) return { success: false, message: 'Missing EXPOSE 3000 — the port the app listens on.' }
      if (!hasCmd) return { success: false, message: 'Missing a CMD line to actually start the app.' }
      return { success: true, message: 'Image builds clean. The app now runs the same everywhere.' }
    },
  },

  {
    id: 'ck-08-fix-dockerfile',
    kind: 'code',
    language: 'dockerfile',
    npc: 'Lord Container',
    title: 'A Dockerfile Full of Mistakes',
    prompt: 'This Dockerfile has four classic mistakes: instructions in the wrong order, a quoted port number, and a start command that\'ll break. Fix all of them.',
    starter: DOCKERFILE_BROKEN,
    runLabel: 'Build Image',
    simulate(code) {
      const order = code.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter(Boolean)
      const fromIdx = order.indexOf('FROM')
      const cmdIdx = order.indexOf('CMD')
      const copyIdx = order.indexOf('COPY')
      const ok = fromIdx === 0 && copyIdx < cmdIdx && !/EXPOSE\s+"/i.test(code)
      return ok
        ? 'Step 1/5 : FROM node\n...\nSuccessfully built ziro-app:latest'
        : 'Error: Dockerfile parse error on a misordered or malformed instruction'
    },
    hints: [
      'Instructions run top to bottom — you can\'t COPY files after you\'ve already told it to CMD, and EXPOSE takes a plain number, not a quoted string.',
      'Order should be: FROM, WORKDIR/COPY, EXPOSE (no quotes), then CMD last.',
      'FROM node\nWORKDIR /app\nCOPY . /app\nEXPOSE 3000\nCMD ["npm", "start"]',
    ],
    xp: 75,
    tool: { name: 'Dockerfile debugging', icon: '🔧', description: 'Instructions run in order — COPY before CMD, plain numbers for EXPOSE.', fun: 3 },
    check({ code }) {
      const lines = code.split('\n').map((l) => l.trim()).filter(Boolean)
      const firstKeyword = (lines[0] || '').split(/\s+/)[0]
      if (firstKeyword !== 'FROM') return { success: false, message: 'FROM should be the very first instruction.' }
      const copyIdx = lines.findIndex((l) => l.startsWith('COPY'))
      const cmdIdx = lines.findIndex((l) => l.startsWith('CMD'))
      if (copyIdx === -1 || cmdIdx === -1 || copyIdx > cmdIdx) {
        return { success: false, message: 'COPY needs to happen before CMD — you can\'t run code that isn\'t in the image yet.' }
      }
      if (/EXPOSE\s+"/i.test(code)) {
        return { success: false, message: 'EXPOSE takes a plain port number, not a quoted string — try EXPOSE 3000.' }
      }
      return { success: true, message: 'All four mistakes fixed. The image builds and runs correctly now.' }
    },
  },

  {
    id: 'ck-09-container-stack',
    kind: 'sequence',
    npc: 'Lord Container',
    title: 'What\'s Really Running',
    prompt: 'Arrange the container stack from the bottom (physical hardware) to the top (your running app).',
    items: [
      { id: 'hardware', label: 'Physical Server / Cloud Host' },
      { id: 'hostos', label: 'Host Operating System' },
      { id: 'engine', label: 'Docker Engine' },
      { id: 'container', label: 'Container' },
      { id: 'app', label: 'Your Application' },
    ],
    correctOrder: ['hardware', 'hostos', 'engine', 'container', 'app'],
    successMessage: 'Now you see why containers share the host OS kernel instead of virtualizing hardware like a VM does.',
    hints: [
      'This is a stack — each layer runs on top of the one below it.',
      'Containers share the host\'s OS kernel through the Docker Engine — no separate guest OS like a VM would need.',
      'Physical Server → Host OS → Docker Engine → Container → Your Application',
    ],
    xp: 60,
    tool: { name: 'Containers vs VMs', icon: '📦', description: 'Containers share the host OS kernel; VMs virtualize entire machines.', fun: 4 },
  },

  {
    id: 'ck-10-build-to-deploy',
    kind: 'sequence',
    npc: 'Lord Container',
    title: 'From Code to Cluster',
    prompt: 'Order the path your code takes from a commit to running in production.',
    items: [
      { id: 'code', label: 'Code Committed' },
      { id: 'build', label: 'Docker Build' },
      { id: 'push', label: 'Push to Registry' },
      { id: 'deploy', label: 'Kubernetes Deploy' },
    ],
    correctOrder: ['code', 'build', 'push', 'deploy'],
    successMessage: 'That\'s the whole path from a commit to a running pod.',
    hints: [
      'You need an image built before you can push it anywhere, and pushed before a cluster can pull it.',
      'Code first, then Docker builds an image, then it\'s pushed to a registry, then Kubernetes deploys it.',
      'Code Committed → Docker Build → Push to Registry → Kubernetes Deploy',
    ],
    xp: 65,
    tool: { name: 'Build → Push → Deploy', icon: '🚀', description: 'The path from a commit to a running container in a cluster.', fun: 4 },
  },

  {
    id: 'ck-11-kubectl',
    kind: 'terminal',
    npc: 'Lord Container',
    title: 'Commanding the Cluster',
    prompt: 'The castle now runs 50 containers under Kubernetes. Check on the pods, scale a deployment called `castle-app` to 5 replicas, then restart its rollout.',
    steps: [
      { match: /^kubectl get pods$/i, output: 'NAME                          READY   STATUS\ncastle-app-7d9f8b6c5d-x2k9p   1/1     Running' },
      { match: /^kubectl scale deployment castle-app --replicas=5$/i, output: 'deployment.apps/castle-app scaled' },
      { match: /^kubectl rollout restart deployment castle-app$/i, output: 'deployment.apps/castle-app restarted' },
    ],
    successMessage: 'Fifty containers, one command at a time. The cluster obeys.',
    hints: [
      'Three commands: list pods, scale the deployment, then restart its rollout.',
      '`kubectl get pods`, then `kubectl scale deployment castle-app --replicas=5`, then `kubectl rollout restart deployment castle-app`.',
      'kubectl get pods\nkubectl scale deployment castle-app --replicas=5\nkubectl rollout restart deployment castle-app',
    ],
    xp: 75,
    tool: { name: 'kubectl', icon: '☸️', description: 'get, scale, and rollout restart — the daily-driver Kubernetes commands.', fun: 4 },
  },

  {
    id: 'ck-12-k8s-architecture',
    kind: 'sequence',
    npc: 'Lord Container',
    title: 'How Traffic Finds Your App',
    prompt: 'Order these Kubernetes pieces along the path an external request takes to reach your app.',
    items: [
      { id: 'ingress', label: 'Ingress' },
      { id: 'service', label: 'Service' },
      { id: 'deployment', label: 'Deployment' },
      { id: 'pod', label: 'Pod' },
    ],
    correctOrder: ['ingress', 'service', 'deployment', 'pod'],
    successMessage: 'Ingress routes it in, the Service load-balances it, the Deployment manages the Pods that actually run your code.',
    hints: [
      'Requests enter from outside the cluster first, and land inside a running container last.',
      'Ingress is the front door; a Pod is where your code actually runs.',
      'Ingress → Service → Deployment → Pod',
    ],
    xp: 80,
    tool: { name: 'Kubernetes traffic path', icon: '🕸️', description: 'Ingress → Service → Deployment → Pod is how a request reaches your app.', fun: 4 },
  },

  {
    id: 'ck-13-terraform-ec2',
    kind: 'code',
    language: 'hcl',
    npc: 'Arch Mage Terraform',
    title: 'Conjuring a Server',
    prompt: 'Write Terraform to conjure a server from thin air: declare the AWS provider and an aws_instance resource with an ami and instance_type.',
    starter: '# provider "aws" { region = "us-east-1" }\n# resource "aws_instance" "app" { ... }\n',
    runLabel: 'Plan & Apply',
    simulate(code) {
      const ok = /resource\s+"aws_instance"/.test(code)
      return ok
        ? 'Terraform will perform the following actions:\n  + aws_instance.app will be created\nPlan: 1 to add, 0 to change, 0 to destroy.\nApply complete! Resources: 1 added.'
        : 'Error: no aws_instance resource found in configuration'
    },
    hints: [
      'You need a provider block for aws, and a resource block of type "aws_instance".',
      'A resource block looks like: resource "aws_instance" "app" { ami = "..." instance_type = "t2.micro" }',
      'provider "aws" {\n  region = "us-east-1"\n}\n\nresource "aws_instance" "app" {\n  ami           = "ami-12345"\n  instance_type = "t2.micro"\n}',
    ],
    xp: 85,
    tool: { name: 'Terraform (HCL)', icon: '🏗️', description: 'Declare infrastructure as code — provider + resource blocks.', fun: 4 },
    check({ code }) {
      if (!/provider\s+"aws"/.test(code)) return { success: false, message: 'Missing a provider "aws" block.' }
      if (!/resource\s+"aws_instance"\s+"\w+"/.test(code)) return { success: false, message: 'Missing a resource "aws_instance" block.' }
      if (!/ami\s*=/.test(code)) return { success: false, message: 'The instance needs an `ami` attribute.' }
      if (!/instance_type\s*=/.test(code)) return { success: false, message: 'The instance needs an `instance_type` attribute.' }
      return { success: true, message: 'terraform apply complete. A server now exists that didn\'t a moment ago.' }
    },
  },

  {
    id: 'ck-14-iac-chain',
    kind: 'sequence',
    npc: 'Arch Mage Terraform',
    title: 'The Full Chain of Creation',
    prompt: 'Order the tools in the chain that takes the kingdom from nothing to a running app.',
    items: [
      { id: 'terraform', label: 'Terraform creates the infrastructure' },
      { id: 'ansible', label: 'Ansible configures it' },
      { id: 'docker', label: 'Docker packages the app' },
      { id: 'kubernetes', label: 'Kubernetes runs it' },
    ],
    correctOrder: ['terraform', 'ansible', 'docker', 'kubernetes'],
    successMessage: 'Infrastructure, then configuration, then packaging, then orchestration. The full chain of creation.',
    hints: [
      'You can\'t configure a server that doesn\'t exist yet, and you can\'t run a container image that hasn\'t been built.',
      'Terraform builds the raw infrastructure first; Kubernetes is the very last step, running what Docker packaged.',
      'Terraform → Ansible → Docker → Kubernetes',
    ],
    xp: 80,
    tool: { name: 'IaC tool chain', icon: '⛓️', description: 'Terraform provisions, Ansible configures, Docker packages, Kubernetes runs.', fun: 5 },
  },

  {
    id: 'ck-15-final-boss',
    kind: 'sequence',
    npc: 'Sir Commit',
    title: 'The Kingdom\'s First Automated Release',
    prompt: 'Design the kingdom\'s complete release pipeline from scratch, start to finish.',
    items: [
      { id: 'commit', label: 'Git Commit' },
      { id: 'actions', label: 'GitHub Actions Triggers' },
      { id: 'build', label: 'Docker Build' },
      { id: 'push', label: 'Push to ECR' },
      { id: 'terraform', label: 'Terraform Provisions EKS' },
      { id: 'deploy', label: 'Kubernetes Deploys' },
      { id: 'helm', label: 'Helm Manages Config' },
    ],
    correctOrder: ['commit', 'actions', 'build', 'push', 'terraform', 'deploy', 'helm'],
    successMessage: 'The kingdom\'s first fully automated release, from commit to running config. Releases stop taking three months.',
    hints: [
      'This chains together everything you\'ve learned in this zone, in the order it would actually happen.',
      'A commit triggers CI, which builds and pushes an image; the cluster needs to exist (Terraform) before Kubernetes can deploy to it; Helm manages config after deployment.',
      'Git Commit → GitHub Actions Triggers → Docker Build → Push to ECR → Terraform Provisions EKS → Kubernetes Deploys → Helm Manages Config',
    ],
    xp: 220,
    tool: { name: 'DevOps Knight', icon: '👑', description: 'Committed to reading the entire release pipeline, end to end.', fun: 5 },
  },
  {
    id: 'ck-bonus-observability',
    kind: 'sequence',
    bonus: true,
    npc: 'Lady Pipeline',
    title: 'The Deployment That Broke Everything',
    prompt: 'A release went out clean, then the whole kingdom went silent — nobody could tell what broke, or where. Set up observability so this never happens blind again.',
    items: [
      { id: 'agent', label: 'Install the Datadog agent on every host' },
      { id: 'dashboard', label: 'Build a dashboard (CPU, memory, request rate, error rate)' },
      { id: 'alert', label: "Set an alert: error rate over 5% pages on-call" },
      { id: 'page', label: 'Alert fires, PagerDuty pages the on-call knight' },
      { id: 'trace', label: 'Add distributed tracing (APM) to find the slow endpoint' },
    ],
    correctOrder: ['agent', 'dashboard', 'alert', 'page', 'trace'],
    successMessage: 'The agent reports in, the dashboard lights up with real numbers, the alert catches the spike, PagerDuty wakes someone up, and the trace points straight at the slow endpoint. Nothing breaks in silence again.',
    hints: [
      'You need data flowing before you can dashboard it, and a dashboard before an alert threshold means anything.',
      'The alert has to exist before it can page anyone; tracing to find the actual slow endpoint is the deepest, last tool you reach for.',
      'Install Datadog Agent → Build Dashboard → Set Alert (error rate > 5%) → PagerDuty Pages On-Call → Add Distributed Tracing (APM)',
    ],
    xp: 180,
    tool: { name: 'Observability Pioneer', icon: '📡', description: 'Made sure the kingdom never goes quiet during an outage again.', fun: 4 },
  },
]

export const CODE_KINGDOM_ZONE = {
  id: 'code-kingdom',
  name: 'Code Kingdom',
  palette: { bg: '#3b3540', ground: 0x8a7f6b, groundAccent: 0x6b6355 },
  decor: { kind: 'torch' },
  npcIntro: {
    name: 'Sir Commit',
    lines: [
      "Welcome to Code Kingdom, Ziro.",
      "Our releases take three months each. Everything is done by hand, copied between machines, prayed over.",
      "The last release corrupted a knight's entire scroll collection because nobody could tell which copy was current.",
      "Sir Alan and Sir Cedric both edited our battle plan scroll last week. Sir Alan's changes just... vanished. Nobody could tell whose copy was the real one, or when it happened.",
      "That's what version control fixes — it remembers every change, by everyone, forever, so nothing is ever silently lost again. The same goes for the rest: pipelines remember how to build and ship correctly, containers remember how to run anywhere, infrastructure as code remembers how the whole kingdom is wired.",
      "Help us modernize — version control, automated pipelines, containers, infrastructure as code. Will you?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Sir Commit', color: 0x9ca3af, role: 'main' },
    { x: 2020, y: 560, name: 'Lady Pipeline', color: 0xf472b6, flavor: 'A release pipeline should run itself. Let\'s automate the whole thing.' },
    { x: 260, y: 860, name: 'Lord Container', color: 0x38bdf8, flavor: 'Package it once, run it anywhere — that\'s the whole promise of containers.' },
    { x: 2020, y: 1160, name: 'Arch Mage Terraform', color: 0xa78bfa, flavor: 'Infrastructure as code means never clicking through a console again.' },
  ],
  challenges: CODE_KINGDOM_CHALLENGES,
  nextZone: 'python-jungle',
}
