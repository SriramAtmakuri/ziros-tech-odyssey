// Cloud Citadel — AWS architecture, IAM, serverless, networking, IaC.
// Reuses 'sequence' for architecture/request-path ordering, 'code' for
// IAM policy JSON, Lambda Python, and CloudFormation YAML, and 'terminal'
// for the AWS CLI — no new panel types, same pattern as Data Realm.

const BROKEN_IAM_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::wrong-bucket-name/*"
    }
  ]
}`

export const CLOUD_CITADEL_CHALLENGES = [
  {
    id: 'cc-01-ha-rollout',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'Never a Single Point of Failure',
    prompt: 'Order the steps for rolling out a highly available service across regions.',
    items: [
      { id: 'primary', label: 'Deploy to primary Availability Zone' },
      { id: 'standby', label: 'Deploy a standby copy to a second AZ, same region' },
      { id: 'dr', label: 'Add a cross-region replica for disaster recovery' },
    ],
    correctOrder: ['primary', 'standby', 'dr'],
    successMessage: 'One AZ down doesn\'t take the service down, and one whole region down doesn\'t either.',
    hints: [
      'Start local — get it running in one place first.',
      'A second AZ protects against a single data center failing; a second region protects against a much bigger disaster.',
      'Primary AZ → Standby in a second AZ → Cross-region DR replica',
    ],
    xp: 55,
    tool: { name: 'High availability', icon: '🌐', description: 'Multi-AZ protects against a data center failure; multi-region protects against a regional one.', fun: 3 },
  },

  {
    id: 'cc-02-basic-architecture',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'A Request\'s Journey',
    prompt: 'Order the path a user\'s request takes through a basic AWS web app architecture.',
    items: [
      { id: 'dns', label: 'Route53 (DNS)' },
      { id: 'lb', label: 'Load Balancer (public subnet)' },
      { id: 'ec2', label: 'EC2 App Server (private subnet)' },
      { id: 'rds', label: 'RDS Database (private subnet)' },
    ],
    correctOrder: ['dns', 'lb', 'ec2', 'rds'],
    successMessage: 'DNS resolves, the load balancer routes it in, the app server handles it, the database backs it up. The whole request lifecycle.',
    hints: [
      'A request always resolves a domain name before it can reach anything.',
      'The load balancer sits in a public subnet; the app server and database stay private, reachable only from inside.',
      'Route53 → Load Balancer → EC2 → RDS',
    ],
    xp: 60,
    tool: { name: 'Basic AWS architecture', icon: '🏰', description: 'DNS → load balancer → app tier → data tier, with only the load balancer facing the internet.', fun: 3 },
  },

  {
    id: 'cc-03-iam-chain',
    kind: 'sequence',
    npc: 'IAM Iris',
    title: 'Who Can Do What',
    prompt: 'Order the IAM chain of trust, from a person to an actual permission.',
    items: [
      { id: 'user', label: 'User' },
      { id: 'group', label: 'Group' },
      { id: 'role', label: 'Role' },
      { id: 'policy', label: 'Policy' },
      { id: 'permission', label: 'Permission' },
    ],
    correctOrder: ['user', 'group', 'role', 'policy', 'permission'],
    successMessage: 'A user, grouped, assuming a role, governed by a policy, resolving to an actual permission. That\'s least-privilege access, traced end to end.',
    hints: [
      'A user is the starting point — a real identity.',
      'Policies are attached to roles (or groups), and a policy is what actually grants a permission.',
      'User → Group → Role → Policy → Permission',
    ],
    xp: 65,
    tool: { name: 'IAM chain of trust', icon: '🔐', description: 'User → Group/Role → Policy → Permission — always trace access back to a written policy.', fun: 4 },
  },

  {
    id: 'cc-04-iam-policy-fix',
    kind: 'code',
    language: 'json',
    npc: 'IAM Iris',
    title: 'The Lambda That Can\'t Read Its Bucket',
    prompt: 'This Lambda function needs to read from an S3 bucket called `ziro-uploads`, but its IAM policy points at the wrong bucket entirely. Fix the Resource ARN.',
    starter: BROKEN_IAM_POLICY,
    runLabel: 'Validate Policy',
    simulate(code) {
      const ok = /arn:aws:s3:::ziro-uploads\/\*/.test(code)
      return ok
        ? 'Policy simulation: s3:GetObject on arn:aws:s3:::ziro-uploads/* — ALLOWED'
        : 'Policy simulation: s3:GetObject on arn:aws:s3:::ziro-uploads/* — DENIED (no matching statement)'
    },
    hints: [
      'The Resource ARN names the exact bucket a statement applies to — right now it points at the wrong one.',
      'An S3 object ARN looks like arn:aws:s3:::bucket-name/*.',
      '"Resource": "arn:aws:s3:::ziro-uploads/*"',
    ],
    xp: 65,
    tool: { name: 'IAM policy JSON', icon: '📜', description: 'Effect, Action, Resource — the three things every IAM statement needs to get right.', fun: 3 },
    check({ code }) {
      if (!/arn:aws:s3:::ziro-uploads\/\*/.test(code)) {
        return { success: false, message: 'The Resource still doesn\'t point at ziro-uploads. Fix the ARN.' }
      }
      return { success: true, message: 'The Lambda can finally read its own bucket.' }
    },
  },

  {
    id: 'cc-05-static-site',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'A Website That Never Sleeps',
    prompt: 'Order the pieces of a static website architecture, from where the files live to how a browser finds them securely.',
    items: [
      { id: 's3', label: 'S3 Bucket (the files)' },
      { id: 'cloudfront', label: 'CloudFront Distribution (CDN)' },
      { id: 'acm', label: 'ACM SSL Certificate' },
      { id: 'route53', label: 'Route53 (custom domain)' },
    ],
    correctOrder: ['s3', 'cloudfront', 'acm', 'route53'],
    successMessage: 'Cached at the edge, served over HTTPS, on your own domain — and it never needs a server to be "on."',
    hints: [
      'The files have to exist somewhere before anything can distribute them.',
      'CloudFront needs a certificate to serve HTTPS before Route53 ever points a domain at it.',
      'S3 Bucket → CloudFront Distribution → ACM Certificate → Route53',
    ],
    xp: 65,
    tool: { name: 'S3 + CloudFront', icon: '🌍', description: 'A serverless static site: S3 storage, CloudFront caching, ACM for HTTPS, Route53 for the domain.', fun: 4 },
  },

  {
    id: 'cc-06-lambda-function',
    kind: 'python',
    npc: 'Serverless Sam',
    title: 'Reacting to an Upload',
    prompt: 'Write a Lambda handler that reacts to an S3 upload event: extract the uploaded object\'s key from the event, and store it in `result`. (Pyodide stands in for the Lambda runtime here — same Python, no server either way.)',
    starter: `event = {
    "Records": [
        {"s3": {"object": {"key": "uploads/report.csv"}}}
    ]
}

def handler(event, context):
    pass  # extract the object key

result = handler(event, None)
`,
    hints: [
      'A real S3 event\'s key is buried in event["Records"][0]["s3"]["object"]["key"].',
      'Navigate the nested dict step by step, or chain the lookups directly.',
      'def handler(event, context):\n    return event["Records"][0]["s3"]["object"]["key"]',
    ],
    xp: 70,
    tool: { name: 'Lambda handler', icon: '⚡', description: 'handler(event, context) — the shape of every AWS Lambda function.', fun: 4 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      const got = pyodide.globals.get('result')
      if (got !== 'uploads/report.csv') {
        return { success: false, message: `result was ${JSON.stringify(got)} — dig one level deeper into the event.` }
      }
      return { success: true, message: 'The handler correctly pulled the uploaded file\'s key out of the event.' }
    },
  },

  {
    id: 'cc-07-serverless-api',
    kind: 'sequence',
    npc: 'Serverless Sam',
    title: 'An API With No Servers',
    prompt: 'Order the pieces of a serverless API, from the client\'s request to where the data ends up.',
    items: [
      { id: 'gateway', label: 'API Gateway' },
      { id: 'lambda', label: 'Lambda Function' },
      { id: 'dynamo', label: 'DynamoDB' },
    ],
    correctOrder: ['gateway', 'lambda', 'dynamo'],
    successMessage: 'No server ever sits idle waiting for a request — it only runs when there\'s something to do.',
    hints: [
      'API Gateway is always the front door for a serverless API.',
      'The Lambda function is the one that actually talks to the database.',
      'API Gateway → Lambda Function → DynamoDB',
    ],
    xp: 60,
    tool: { name: 'Serverless API', icon: '🧩', description: 'API Gateway routes the request; Lambda runs the logic; DynamoDB stores the result.', fun: 4 },
  },

  {
    id: 'cc-08-compute-spectrum',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'How Much Do You Want to Manage?',
    prompt: 'Order these compute options from the MOST infrastructure you have to manage yourself to the LEAST.',
    items: [
      { id: 'ec2', label: 'EC2 (you manage the whole VM)' },
      { id: 'ecs', label: 'ECS (you manage containers, not VMs*)' },
      { id: 'eks', label: 'EKS (managed Kubernetes control plane)' },
      { id: 'lambda', label: 'Lambda (no servers at all)' },
    ],
    correctOrder: ['ec2', 'ecs', 'eks', 'lambda'],
    successMessage: 'More management responsibility gives you more control; less gives you more speed. Pick based on what the workload actually needs.',
    hints: [
      'EC2 gives you the most control and the most responsibility — you patch the OS yourself.',
      'Lambda gives you the least control and the least responsibility — AWS runs everything except your code.',
      'EC2 → ECS → EKS → Lambda',
    ],
    xp: 70,
    tool: { name: 'Compute options spectrum', icon: '📶', description: 'EC2 → ECS/EKS → Lambda — a spectrum of control vs. convenience, not a strict hierarchy.', fun: 4 },
  },

  {
    id: 'cc-09-ha-request-flow',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'Fast When It Can Be, Safe When It Has To Be',
    prompt: 'Order the path a request takes through a highly available architecture with caching.',
    items: [
      { id: 'lb', label: 'Load Balancer' },
      { id: 'asg', label: 'Auto Scaling Group (EC2 instances)' },
      { id: 'cache', label: 'ElastiCache (check cache first)' },
      { id: 'rds', label: 'RDS Multi-AZ (fallback on cache miss)' },
    ],
    correctOrder: ['lb', 'asg', 'cache', 'rds'],
    successMessage: 'Most requests never even touch the database — the cache absorbs them, and Multi-AZ RDS is there when it really is needed.',
    hints: [
      'The load balancer always routes to available app servers first.',
      'A well-designed app checks the cache before ever hitting the database.',
      'Load Balancer → Auto Scaling Group → ElastiCache → RDS Multi-AZ',
    ],
    xp: 75,
    tool: { name: 'Cache-aside pattern', icon: '💨', description: 'Check the cache before the database — most reads never need to hit RDS at all.', fun: 4 },
  },

  {
    id: 'cc-10-vpc-networking',
    kind: 'sequence',
    npc: 'Network Nora',
    title: 'In and Out, Safely',
    prompt: 'Order the path outbound internet traffic takes from a private EC2 instance that needs to download an update.',
    items: [
      { id: 'private', label: 'EC2 in Private Subnet' },
      { id: 'nat', label: 'NAT Gateway' },
      { id: 'public', label: 'Public Subnet' },
      { id: 'igw', label: 'Internet Gateway' },
    ],
    correctOrder: ['private', 'nat', 'public', 'igw'],
    successMessage: 'The private instance gets out to the internet without ever being reachable from it — that\'s the whole point of a NAT Gateway.',
    hints: [
      'The request starts inside the private subnet, where the instance actually lives.',
      'A NAT Gateway lives in the public subnet and forwards private traffic out through the Internet Gateway.',
      'EC2 (private subnet) → NAT Gateway → Public Subnet → Internet Gateway',
    ],
    xp: 75,
    tool: { name: 'VPC networking', icon: '🕸️', description: 'NAT Gateway lets private resources reach out without letting the internet reach in.', fun: 4 },
  },

  {
    id: 'cc-11-cloudformation',
    kind: 'code',
    language: 'yaml',
    npc: 'Network Nora',
    title: 'Conjuring Infrastructure From YAML',
    prompt: 'Write a CloudFormation template that declares a VPC and an EC2 instance inside it.',
    starter: 'Resources:\n  # define a VPC and an EC2 instance here\n',
    runLabel: 'Validate Template',
    simulate(code) {
      const ok = /AWS::EC2::VPC/.test(code) && /AWS::EC2::Instance/.test(code)
      return ok
        ? 'Template validation successful. 2 resources will be created: MyVPC, MyInstance.'
        : 'Template validation failed: no VPC or Instance resource found.'
    },
    hints: [
      'CloudFormation resources are declared with a Type, like AWS::EC2::VPC or AWS::EC2::Instance.',
      'Every resource needs a logical name (like MyVPC) and a Type.',
      "Resources:\n  MyVPC:\n    Type: AWS::EC2::VPC\n    Properties:\n      CidrBlock: 10.0.0.0/16\n  MyInstance:\n    Type: AWS::EC2::Instance\n    Properties:\n      InstanceType: t2.micro",
    ],
    xp: 80,
    tool: { name: 'CloudFormation', icon: '📋', description: 'Declare AWS resources as YAML/JSON instead of clicking through the console.', fun: 4 },
    check({ code }) {
      if (!/AWS::EC2::VPC/.test(code)) return { success: false, message: 'Missing a resource of Type AWS::EC2::VPC.' }
      if (!/AWS::EC2::Instance/.test(code)) return { success: false, message: 'Missing a resource of Type AWS::EC2::Instance.' }
      return { success: true, message: 'The template validates — a VPC and an EC2 instance, conjured from text.' }
    },
  },

  {
    id: 'cc-12-fanout',
    kind: 'sequence',
    npc: 'Serverless Sam',
    title: 'One Event, Many Listeners',
    prompt: 'Order this fan-out pattern: one event needs to reach multiple independent consumers.',
    items: [
      { id: 'publish', label: 'Something happens — publish to SNS Topic' },
      { id: 'queue', label: 'SNS fans out to an SQS Queue per consumer' },
      { id: 'consume', label: 'Each Lambda consumes its own queue independently' },
    ],
    correctOrder: ['publish', 'queue', 'consume'],
    successMessage: 'One publish, many independent consumers — and if one consumer is slow, it doesn\'t block the others.',
    hints: [
      'Something has to happen and get published before anyone can react to it.',
      'SNS doesn\'t talk to Lambda directly in this pattern — it fans out to a queue per consumer first, decoupling them.',
      'Publish to SNS Topic → SNS fans out to SQS Queues → Each Lambda consumes its own queue',
    ],
    xp: 75,
    tool: { name: 'SNS + SQS fan-out', icon: '📡', description: 'Pub/sub with a queue per consumer — decoupled, and one slow consumer can\'t block the rest.', fun: 4 },
  },

  {
    id: 'cc-13-cost-audit',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'The $50,000 Bill',
    prompt: 'Order the steps of a cost optimization audit on a bloated AWS bill.',
    items: [
      { id: 'rightsize', label: 'Right-size over-provisioned EC2 instances' },
      { id: 'reserved', label: 'Move steady workloads to Reserved Instances' },
      { id: 'lifecycle', label: 'Enable S3 lifecycle policies for old data' },
      { id: 'cleanup', label: 'Remove unused resources entirely' },
    ],
    correctOrder: ['rightsize', 'reserved', 'lifecycle', 'cleanup'],
    successMessage: 'Right-size first, commit to what you\'ll actually keep running, archive what\'s aging, and delete what\'s dead weight.',
    hints: [
      'Figure out what you\'re over-paying for before you commit to a longer-term discount on it.',
      'Cleanup — deleting things nobody uses — is usually the last and easiest win.',
      'Right-size EC2 → Reserved Instances → S3 lifecycle policies → Remove unused resources',
    ],
    xp: 70,
    tool: { name: 'Cost optimization', icon: '💰', description: 'Right-size, commit, archive, delete — in that order, biggest structural wins first.', fun: 3 },
  },

  {
    id: 'cc-14-disaster-recovery',
    kind: 'sequence',
    npc: 'Network Nora',
    title: 'When the Whole Region Goes Down',
    prompt: 'Order the disaster recovery flow when an entire AWS region becomes unavailable.',
    items: [
      { id: 'primary', label: 'Primary region running normally' },
      { id: 'rds-replicate', label: 'RDS snapshots replicate to the secondary region' },
      { id: 's3-replicate', label: 'S3 cross-region replication keeps files in sync' },
      { id: 'failover', label: 'Route53 health check detects the outage and fails over' },
      { id: 'secondary', label: 'Secondary region takes over traffic' },
    ],
    correctOrder: ['primary', 'rds-replicate', 's3-replicate', 'failover', 'secondary'],
    successMessage: 'Data was already replicating before disaster struck — that\'s what makes the failover survivable instead of catastrophic.',
    hints: [
      'Replication has to be happening continuously, long before any actual failure.',
      'Route53\'s health check is what actually notices the primary region is unreachable and triggers the switch.',
      'Primary running → RDS replication → S3 replication → Route53 health check fails over → Secondary takes over',
    ],
    xp: 85,
    tool: { name: 'Disaster recovery', icon: '🆘', description: 'Continuous replication + automated health-check failover — recoverable instead of catastrophic.', fun: 4 },
  },

  {
    id: 'cc-15-security-layers',
    kind: 'sequence',
    npc: 'IAM Iris',
    title: 'Layers of Defense',
    prompt: 'Order these security measures from foundational to advanced, as you\'d actually roll them out.',
    items: [
      { id: 'kms', label: 'Encrypt S3 data with KMS' },
      { id: 'secrets', label: 'Store secrets in Secrets Manager' },
      { id: 'cloudtrail', label: 'Enable CloudTrail (log every API call)' },
      { id: 'guardduty', label: 'Enable GuardDuty (threat detection)' },
      { id: 'flowlogs', label: 'Review VPC Flow Logs' },
    ],
    correctOrder: ['kms', 'secrets', 'cloudtrail', 'guardduty', 'flowlogs'],
    successMessage: 'Encrypted data and managed secrets first, then logging, then automated threat detection, then the deep network-level review.',
    hints: [
      'Protecting the data itself (encryption, secrets) comes before you even start watching for threats.',
      'You need a log of everything (CloudTrail) before automated threat detection (GuardDuty) has anything to analyze.',
      'KMS encryption → Secrets Manager → CloudTrail → GuardDuty → VPC Flow Logs',
    ],
    xp: 85,
    tool: { name: 'Cloud security layers', icon: '🛡️', description: 'Encrypt, manage secrets, log everything, detect threats, review network traffic.', fun: 4 },
  },

  {
    id: 'cc-16-aws-cli',
    kind: 'terminal',
    npc: 'Nimbus',
    title: 'Commanding the Citadel',
    prompt: 'Use the AWS CLI to check on the citadel\'s infrastructure: list S3 buckets, describe running EC2 instances, then invoke a Lambda function called `citadel-check`.',
    steps: [
      { match: /^aws s3 ls$/i, output: '2024-01-15 10:23:41 ziro-uploads\n2024-02-02 08:11:03 ziro-backups' },
      { match: /^aws ec2 describe-instances$/i, output: 'Reservations: [ { Instances: [ { InstanceId: "i-0a1b2c3d", State: "running" } ] } ]' },
      { match: /^aws lambda invoke --function-name citadel-check .*$/i, output: '{\n  "StatusCode": 200,\n  "ExecutedVersion": "$LATEST"\n}' },
    ],
    successMessage: 'The whole citadel, checked from a single terminal.',
    hints: [
      'Three commands: list S3 buckets, describe EC2 instances, then invoke the Lambda function.',
      'aws s3 ls, aws ec2 describe-instances, and aws lambda invoke --function-name citadel-check need a trailing output file argument too, like out.json.',
      'aws s3 ls\naws ec2 describe-instances\naws lambda invoke --function-name citadel-check out.json',
    ],
    xp: 75,
    tool: { name: 'AWS CLI', icon: '⌨️', description: 'Script anything you can click in the console — s3, ec2, lambda, and more.', fun: 4 },
  },

  {
    id: 'cc-17-final-boss',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'Rebuilding the Citadel',
    prompt: 'The Citadel\'s entire production architecture collapsed. Rebuild it from scratch, in the order a request would flow through it.',
    items: [
      { id: 'dns', label: 'Route53 (DNS)' },
      { id: 'cdn', label: 'CloudFront (CDN + caching)' },
      { id: 'waf', label: 'WAF (filters malicious requests)' },
      { id: 'lb', label: 'Load Balancer' },
      { id: 'asg', label: 'Auto Scaling Group (EC2)' },
      { id: 'cache', label: 'ElastiCache' },
      { id: 'rds', label: 'RDS Multi-AZ' },
    ],
    correctOrder: ['dns', 'cdn', 'waf', 'lb', 'asg', 'cache', 'rds'],
    successMessage: 'DNS resolves, the CDN caches what it can, WAF filters out attacks, the load balancer routes it, auto-scaled servers handle it, cache absorbs repeat reads, and Multi-AZ RDS holds the truth. The citadel stands again.',
    hints: [
      'This combines everything from this zone — DNS and CDN first, security filtering before it ever reaches your servers, then the same cache-aside pattern from before.',
      'WAF filters traffic before the load balancer ever routes it to a real server.',
      'Route53 → CloudFront → WAF → Load Balancer → Auto Scaling Group → ElastiCache → RDS Multi-AZ',
    ],
    xp: 240,
    tool: { name: 'Cloud Architect', icon: '👑', description: 'Designed a complete production-grade AWS architecture, DNS to database.', fun: 5 },
  },
  {
    id: 'cc-bonus-silent-failure',
    kind: 'sequence',
    bonus: true,
    npc: 'Network Nora',
    title: 'The Silent Failure',
    prompt: 'A Lambda function has been quietly failing for days — no alarms, no pages, just a slow trickle of missing records nobody noticed until a customer complained. Build the monitoring that would have caught it on day one.',
    items: [
      { id: 'logs', label: 'Add CloudWatch log groups + metric filters' },
      { id: 'trace', label: 'Add X-Ray tracing (Lambda → DynamoDB)' },
      { id: 'alarm', label: 'Set a CloudWatch alarm on the error metric' },
      { id: 'sns', label: 'Route the alarm through SNS to PagerDuty' },
      { id: 'dashboard', label: 'Build a CloudWatch dashboard for the whole flow' },
    ],
    correctOrder: ['logs', 'trace', 'alarm', 'sns', 'dashboard'],
    successMessage: 'Logs feed metric filters, X-Ray shows exactly where the Lambda hands off to DynamoDB, the alarm trips on the error metric, SNS relays it to PagerDuty, and the dashboard makes the whole flow visible. No more silent failures.',
    hints: [
      'You need something producing a metric before you can trace, alarm, or dashboard anything.',
      'The alarm has to exist before it can route anywhere through SNS; the dashboard pulling it all together comes last.',
      'CloudWatch Logs + Metric Filters → X-Ray Tracing → CloudWatch Alarm → SNS → PagerDuty → CloudWatch Dashboard',
    ],
    xp: 190,
    tool: { name: 'Cloud Watcher', icon: '👁️', description: 'Turned a silent, days-long failure into something that would page someone in minutes.', fun: 4 },
  },
]

export const CLOUD_CITADEL_ZONE = {
  id: 'cloud-citadel',
  name: 'Cloud Citadel',
  palette: { bg: '#7dd3fc', ground: 0xf8fafc, groundAccent: 0xe2e8f0 },
  decor: { kind: 'cloud' },
  npcIntro: {
    name: 'Nimbus',
    lines: [
      "Welcome to Cloud Citadel, Ziro — a castle that floats because nothing here touches physical ground anymore.",
      "A single misconfiguration brought the whole thing down. No servers, no database, no security. All of it, gone in an instant.",
      "A castle that floats needs no bedrock — that's the whole idea of 'the cloud.' Instead of one building that collapses if its foundation cracks, everything runs on shared, replaceable stone that can be swapped out without anyone noticing. We lost that when our one foundation gave way.",
      "We need to rebuild — properly this time. Redundant, secure, and never dependent on any one machine.",
      "Will you help us architect it from scratch?",
    ],
  },
  npcs: [
    { x: 150, y: 150, name: 'Nimbus', color: 0xfbbf24, role: 'main' },
    { x: 2020, y: 560, name: 'IAM Iris', color: 0xef4444, flavor: 'Every permission should trace back to a written policy. Never trust, always verify.' },
    { x: 260, y: 860, name: 'Serverless Sam', color: 0x8b5cf6, flavor: 'Why manage a server that\'s idle 99% of the time? Let\'s go serverless.' },
    { x: 2020, y: 1160, name: 'Network Nora', color: 0x0ea5e9, flavor: 'Public subnets face the world. Private subnets never should. Let\'s get the networking right.' },
  ],
  challenges: CLOUD_CITADEL_CHALLENGES,
  nextZone: 'algorithm-dungeon',
}
