// The bonus reserve pool for Cloud Citadel — 2x its 18 real chest positions.
// Once a chest is solved and the player moves past it via "Next", that
// chest's challenge gets replaced with one drawn from here (see
// gameStore.js's BONUS_POOLS registry / swapChallenge / getLiveChallenges),
// same mechanic as every other zone in this rollout. Pre-authored, never
// AI-generated at runtime.
//
// Split three ways:
//   - 12 hands-on (kind: 'sequence' / 'code' / 'terminal' / 'python' — the
//     same four kinds the main zone already uses; 'python' checks read
//     `pyodide.globals.get('result')` directly, matching the main pool's own
//     convention rather than importing a shared helper) covering ground the
//     main 18 don't: S3 lifecycle transitions, Auto Scaling policies, an
//     IAM Condition block, AWS CLI s3 cp/sync, Lambda reading environment
//     variables, CloudFormation Parameters/Outputs, a Step Functions happy
//     path, AWS CLI IAM role/policy commands, a Lambda+DynamoDB write,
//     multi-account AWS Organizations, an HTTPS-only S3 bucket policy, and
//     a CloudFormation Security Group.
//   - 12 MCQ (kind: 'mcq') on cloud-architecture concepts with no single
//     runnable snippet of their own: the Well-Architected Framework, the
//     Shared Responsibility Model, Regions vs. Availability Zones, S3
//     storage class tradeoffs, CloudWatch vs. CloudTrail, Lambda cold
//     starts, VPC peering, Auto Scaling Groups, ALB vs. NLB, Spot
//     Instances, elasticity, and RTO vs. RPO.
//   - 12 matching (kind: 'matching') pairing terms across AWS compute,
//     storage, networking, and database services, IAM vocabulary,
//     Well-Architected pillars, monitoring/observability tools, serverless
//     services, CI/CD tools, disaster-recovery terms, security services,
//     and cost-management terms.

export const CLOUD_CITADEL_BONUS_POOL = [
  // ---------- hands-on: sequence / code / terminal / python ----------
  {
    id: 'cc-pool-01-s3-lifecycle',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'A File\'s Whole Life',
    prompt: 'Order the lifecycle of an S3 object as it ages, from upload to eventual deletion.',
    items: [
      { id: 'standard', label: 'Uploaded, stored in S3 Standard (frequent access)' },
      { id: 'ia', label: 'After 30 days, transitions to S3 Standard-IA (infrequent access, cheaper)' },
      { id: 'glacier', label: 'After 90 days, transitions to S3 Glacier (archive, cheapest, slow retrieval)' },
      { id: 'expire', label: 'After 365 days, the object expires and is deleted automatically' },
    ],
    correctOrder: ['standard', 'ia', 'glacier', 'expire'],
    successMessage: 'The object gets cheaper to store as it gets less useful, automatically — nobody had to remember to move or delete it.',
    hints: [
      'Every object starts in the standard tier — the transitions only happen as it ages.',
      'Cost drops (and retrieval time rises) at each stage: Standard → Standard-IA → Glacier → gone.',
      'S3 Standard → S3 Standard-IA (30 days) → S3 Glacier (90 days) → Expiration (365 days)',
    ],
    xp: 65,
    tool: { name: 'S3 lifecycle policies', icon: '📦', description: 'Automatically transitions objects to cheaper storage tiers as they age, then expires them.', fun: 3 },
  },
  {
    id: 'cc-pool-02-autoscaling-policy',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'Growing and Shrinking on Demand',
    prompt: 'Order how an Auto Scaling Group actually responds to changing load.',
    items: [
      { id: 'monitor', label: 'CloudWatch monitors average CPU utilization across the group' },
      { id: 'scaleout', label: 'CPU crosses 70% → a scale-out policy launches new instances' },
      { id: 'cooldown', label: 'A cooldown period prevents launching too many instances too fast' },
      { id: 'scalein', label: 'CPU drops back below threshold → a scale-in policy terminates the extra instances' },
    ],
    correctOrder: ['monitor', 'scaleout', 'cooldown', 'scalein'],
    successMessage: 'Capacity grows under real load and shrinks once it\'s not needed — nobody\'s manually launching or terminating instances.',
    hints: [
      'A metric has to be monitored before any scaling decision can be triggered by it.',
      'The cooldown period sits between scaling actions specifically to prevent over-reacting to a brief spike.',
      'CloudWatch monitors CPU → Scale-out on high CPU → Cooldown period → Scale-in once CPU drops',
    ],
    xp: 70,
    tool: { name: 'Auto Scaling policies', icon: '📶', description: 'Scale out under load, cool down, then scale back in — capacity that tracks real demand.', fun: 4 },
  },
  {
    id: 'cc-pool-03-iam-condition',
    kind: 'code',
    language: 'json',
    npc: 'IAM Iris',
    title: 'Only From the Office',
    prompt: 'This IAM policy allows s3:GetObject from anywhere. Restrict it so it only works when the request comes from the office IP range 203.0.113.0/24, using a Condition block.',
    starter: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::ziro-uploads/*"\n    }\n  ]\n}',
    runLabel: 'Validate Policy',
    simulate(code) {
      const ok = /"IpAddress"/.test(code) && /203\.0\.113\.0\/24/.test(code)
      return ok
        ? 'Policy simulation: request from 198.51.100.5 — DENIED (outside allowed IP range). Request from 203.0.113.10 — ALLOWED.'
        : 'Policy simulation: request from any IP — ALLOWED (no IP restriction found)'
    },
    hints: [
      'A Condition block adds an extra requirement beyond Effect/Action/Resource — here, based on the caller\'s IP.',
      'The condition operator is IpAddress, checking the key aws:SourceIp against the CIDR range.',
      '"Condition": {\n  "IpAddress": {\n    "aws:SourceIp": "203.0.113.0/24"\n  }\n}',
    ],
    xp: 75,
    tool: { name: 'IAM Condition blocks', icon: '🧾', description: 'Add extra requirements to a policy statement — IP range, MFA, time of day, and more.', fun: 4 },
    check({ code }) {
      if (!/"IpAddress"/.test(code)) return { success: false, message: 'Add an IpAddress condition operator.' }
      if (!/aws:SourceIp/.test(code)) return { success: false, message: 'The condition key should be aws:SourceIp.' }
      if (!/203\.0\.113\.0\/24/.test(code)) return { success: false, message: 'The IP range should be 203.0.113.0/24.' }
      return { success: true, message: 'Now the policy only grants access from inside the office network.' }
    },
  },
  {
    id: 'cc-pool-04-aws-cli-s3',
    kind: 'terminal',
    npc: 'Nimbus',
    title: 'Moving Files Into the Cloud',
    prompt: 'Upload a single file report.csv to the ziro-uploads bucket, then sync an entire local folder ./dist to that same bucket.',
    steps: [
      { match: /^aws s3 cp report\.csv s3:\/\/ziro-uploads\/$/i, output: 'upload: ./report.csv to s3://ziro-uploads/report.csv' },
      { match: /^aws s3 sync \.\/dist s3:\/\/ziro-uploads$/i, output: 'upload: dist/index.html to s3://ziro-uploads/index.html\nupload: dist/app.js to s3://ziro-uploads/app.js' },
    ],
    successMessage: 'One file uploaded directly, a whole folder synced in one command — sync only touches what actually changed.',
    hints: [
      'Two commands: aws s3 cp for one file, aws s3 sync for a whole folder.',
      'cp report.csv to s3://ziro-uploads/, then sync ./dist to s3://ziro-uploads.',
      'aws s3 cp report.csv s3://ziro-uploads/\naws s3 sync ./dist s3://ziro-uploads',
    ],
    xp: 60,
    tool: { name: 'aws s3 cp / sync', icon: '📤', description: 'cp uploads one file; sync uploads only what changed in a whole folder.', fun: 3 },
  },
  {
    id: 'cc-pool-05-lambda-env-vars',
    kind: 'python',
    npc: 'Serverless Sam',
    title: 'Stop Hardcoding the Config',
    prompt: "This Lambda hardcodes MAX_RETRIES as 3, ignoring the environment variable AWS actually sets for it. Fix it to read from os.environ instead, and store the parsed integer in `result`.",
    starter: "import os\nos.environ['MAX_RETRIES'] = '5'  # simulates what AWS sets for you\n\nresult = 3  # hardcoded — fix this\n",
    hints: [
      'Lambda functions read their configuration from environment variables via os.environ, not hardcoded values.',
      'os.environ[\'MAX_RETRIES\'] gives you a string — convert it with int(...).',
      "result = int(os.environ['MAX_RETRIES'])",
    ],
    xp: 65,
    tool: { name: 'Lambda environment variables', icon: '🔧', description: 'Read configuration from os.environ instead of hardcoding it into the function.', fun: 3 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      const got = pyodide.globals.get('result')
      if (got !== 5) {
        return { success: false, message: `result was ${JSON.stringify(got)} — read MAX_RETRIES from os.environ instead of hardcoding it.` }
      }
      return { success: true, message: 'Now changing the environment variable changes the function\'s behavior — no redeploy needed.' }
    },
  },
  {
    id: 'cc-pool-06-cloudformation-params',
    kind: 'code',
    language: 'yaml',
    npc: 'Network Nora',
    title: 'Stop Hardcoding the Instance Type',
    prompt: 'Parameterize the EC2 InstanceType with a Parameters block (default t2.micro) instead of hardcoding it, and add an Outputs block that prints the VPC\'s Id.',
    starter: 'Resources:\n  MyVPC:\n    Type: AWS::EC2::VPC\n    Properties:\n      CidrBlock: 10.0.0.0/16\n  MyInstance:\n    Type: AWS::EC2::Instance\n    Properties:\n      InstanceType: t2.micro\n',
    runLabel: 'Validate Template',
    simulate(code) {
      const ok = /Parameters\s*:/i.test(code) && /!Ref\s+InstanceTypeParam/.test(code) && /Outputs\s*:/i.test(code) && /!Ref\s+MyVPC/.test(code)
      return ok
        ? 'Template validation successful. Parameters: 1. Outputs: 1 (VpcId).'
        : 'Template validation successful, but InstanceType is still hardcoded and no Outputs were found.'
    },
    hints: [
      'A Parameters block declares a named, reusable input; an Outputs block prints a value after the stack is created.',
      'InstanceType should reference !Ref InstanceTypeParam instead of a literal string; Outputs should use !Ref MyVPC for the VpcId value.',
      'Parameters:\n  InstanceTypeParam:\n    Type: String\n    Default: t2.micro\n\nResources:\n  MyVPC:\n    Type: AWS::EC2::VPC\n    Properties:\n      CidrBlock: 10.0.0.0/16\n  MyInstance:\n    Type: AWS::EC2::Instance\n    Properties:\n      InstanceType: !Ref InstanceTypeParam\n\nOutputs:\n  VpcId:\n    Value: !Ref MyVPC',
    ],
    xp: 85,
    tool: { name: 'CloudFormation Parameters & Outputs', icon: '🎛️', description: 'Parameterize a template\'s inputs, and surface results with Outputs after it\'s created.', fun: 4 },
    check({ code }) {
      if (!/Parameters\s*:/i.test(code)) return { success: false, message: 'Missing a top-level Parameters block.' }
      if (!/!Ref\s+InstanceTypeParam/.test(code)) return { success: false, message: 'InstanceType should reference !Ref InstanceTypeParam, not a hardcoded value.' }
      if (!/Outputs\s*:/i.test(code)) return { success: false, message: 'Missing a top-level Outputs block.' }
      if (!/!Ref\s+MyVPC/.test(code)) return { success: false, message: 'The VpcId output should reference !Ref MyVPC.' }
      return { success: true, message: 'The instance type is reusable, and the VPC Id prints right after the stack is created.' }
    },
  },
  {
    id: 'cc-pool-07-step-functions',
    kind: 'sequence',
    npc: 'Serverless Sam',
    title: 'Orchestrating Without a Server',
    prompt: 'Order the happy path of a Step Functions state machine processing an order.',
    items: [
      { id: 'start', label: 'State machine execution starts' },
      { id: 'lambda1', label: 'A Task state invokes Lambda1 (validate order)' },
      { id: 'choice', label: 'A Choice state checks whether validation passed' },
      { id: 'lambda2', label: 'On success, a Task state invokes Lambda2 (process payment)' },
      { id: 'succeed', label: 'A Succeed state marks the execution complete' },
    ],
    correctOrder: ['start', 'lambda1', 'choice', 'lambda2', 'succeed'],
    successMessage: 'Every step, every decision, and every outcome — visualized and tracked, with no server managing the flow itself.',
    hints: [
      'Nothing can be checked (Choice) before Lambda1 has actually run and produced a result.',
      'The Succeed state only comes after the whole happy path has actually completed.',
      'Execution starts → Lambda1 validates → Choice checks the result → Lambda2 processes payment → Succeed',
    ],
    xp: 80,
    tool: { name: 'Step Functions', icon: '🔀', description: 'Task, Choice, and Succeed states orchestrate a multi-step serverless workflow visually.', fun: 4 },
  },
  {
    id: 'cc-pool-08-aws-cli-iam',
    kind: 'terminal',
    npc: 'IAM Iris',
    title: 'Creating a Role From the Terminal',
    prompt: 'Create an IAM role called deploy-role, then attach the AWS-managed policy AmazonS3ReadOnlyAccess to it.',
    steps: [
      { match: /^aws iam create-role --role-name deploy-role .*$/i, output: '{\n  "Role": {\n    "RoleName": "deploy-role",\n    "Arn": "arn:aws:iam::123456789012:role/deploy-role"\n  }\n}' },
      { match: /^aws iam attach-role-policy --role-name deploy-role --policy-arn arn:aws:iam::aws:policy\/AmazonS3ReadOnlyAccess$/i, output: 'Policy attached successfully.' },
    ],
    successMessage: 'A role now exists with exactly the read-only S3 access it needs — nothing more.',
    hints: [
      'Two commands: create the role (with a trust policy document argument), then attach a managed policy to it.',
      'create-role needs --role-name and a trailing --assume-role-policy-document argument; attach-role-policy needs --role-name and --policy-arn.',
      'aws iam create-role --role-name deploy-role --assume-role-policy-document file://trust.json\naws iam attach-role-policy --role-name deploy-role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    ],
    xp: 70,
    tool: { name: 'aws iam create-role / attach-role-policy', icon: '🔑', description: 'Create a role, then attach the exact managed policy it actually needs.', fun: 3 },
  },
  {
    id: 'cc-pool-09-lambda-dynamo-write',
    kind: 'python',
    npc: 'Serverless Sam',
    title: 'Writing an Item',
    prompt: "Simulate a DynamoDB write with a plain dict standing in for the table. Write put_item(table, key, value) that adds the item and returns the updated table. Call it with table={}, key='user1', value='active', and store the result in `result`.",
    starter: "def put_item(table, key, value):\n    pass\n\nresult = put_item({}, 'user1', 'active')\n",
    hints: [
      'Setting table[key] = value adds (or overwrites) an item, then return the table so the caller sees the change.',
      'The function needs exactly two lines: assign, then return.',
      "def put_item(table, key, value):\n    table[key] = value\n    return table\n\nresult = put_item({}, 'user1', 'active')",
    ],
    xp: 60,
    tool: { name: 'DynamoDB put_item pattern', icon: '🗄️', description: 'The write-a-key-value-item pattern every DynamoDB write follows.', fun: 3 },
    check: ({ pyodide, error }) => {
      if (error) return { success: false, message: `Python error: ${error}` }
      const got = pyodide.globals.get('result')
      const gotObj = got?.toJs ? got.toJs() : got
      if (!gotObj || gotObj.user1 !== 'active') {
        return { success: false, message: `result didn't come back as {'user1': 'active'} — check put_item sets and returns the table.` }
      }
      return { success: true, message: 'The item is written, and the function correctly hands the updated table back.' }
    },
  },
  {
    id: 'cc-pool-10-multi-account',
    kind: 'sequence',
    npc: 'Nimbus',
    title: 'One Company, Many Accounts',
    prompt: 'Order how a company structures multiple AWS accounts under AWS Organizations.',
    items: [
      { id: 'root', label: 'An AWS Organizations root/management account is created' },
      { id: 'ous', label: 'Organizational Units (OUs) are created to group accounts by team or environment' },
      { id: 'accounts', label: 'Member accounts are created inside the right OU' },
      { id: 'scp', label: 'Service Control Policies (SCPs) are attached to restrict what member accounts can do' },
    ],
    correctOrder: ['root', 'ous', 'accounts', 'scp'],
    successMessage: 'Every team gets their own isolated account, grouped logically, with guardrails nobody inside the account can override.',
    hints: [
      'Nothing can be grouped into an OU until the organization itself (the root) exists.',
      'SCPs are guardrails applied AFTER accounts already exist inside their OU.',
      'Root/management account → Organizational Units → Member accounts → Service Control Policies',
    ],
    xp: 75,
    tool: { name: 'AWS Organizations', icon: '🏢', description: 'Root account, OUs, member accounts, and SCPs — structuring many AWS accounts safely.', fun: 4 },
  },
  {
    id: 'cc-pool-11-bucket-policy-https',
    kind: 'code',
    language: 'json',
    npc: 'IAM Iris',
    title: 'HTTPS or Nothing',
    prompt: 'Write an S3 bucket policy that DENIES any request to the ziro-uploads bucket that isn\'t made over HTTPS (checking aws:SecureTransport is false).',
    starter: '{\n  "Version": "2012-10-17",\n  "Statement": [\n\n  ]\n}',
    runLabel: 'Validate Policy',
    simulate(code) {
      const ok = /"Effect"\s*:\s*"Deny"/.test(code) && /aws:SecureTransport/.test(code) && /"false"/.test(code)
      return ok
        ? 'Policy simulation: HTTP request — DENIED. HTTPS request — ALLOWED (no matching deny).'
        : 'Policy simulation: HTTP request — ALLOWED (no transport restriction found)'
    },
    hints: [
      'This is a resource-based bucket policy with a Deny statement, not an Allow — you\'re blocking something specific, not granting access.',
      'The condition checks the Bool operator on aws:SecureTransport equal to the string "false".',
      '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Principal": "*",\n      "Action": "s3:*",\n      "Resource": "arn:aws:s3:::ziro-uploads/*",\n      "Condition": {\n        "Bool": {\n          "aws:SecureTransport": "false"\n        }\n      }\n    }\n  ]\n}',
    ],
    xp: 80,
    tool: { name: 'HTTPS-only bucket policy', icon: '🔒', description: 'A resource-based Deny statement blocking any non-HTTPS request to a bucket.', fun: 4 },
    check({ code }) {
      if (!/"Effect"\s*:\s*"Deny"/.test(code)) return { success: false, message: 'This needs a Deny statement, not Allow.' }
      if (!/aws:SecureTransport/.test(code)) return { success: false, message: 'Missing the aws:SecureTransport condition key.' }
      if (!/"false"/.test(code)) return { success: false, message: 'The condition should check for "false" (as a string) to catch non-HTTPS requests.' }
      return { success: true, message: 'Any request over plain HTTP now gets denied outright.' }
    },
  },
  {
    id: 'cc-pool-12-cloudformation-sg',
    kind: 'code',
    language: 'yaml',
    npc: 'Network Nora',
    title: 'Only Port 443, Nothing Else',
    prompt: 'Add a Security Group resource that allows inbound traffic only on port 443 (HTTPS) from anywhere (0.0.0.0/0).',
    starter: 'Resources:\n  MyVPC:\n    Type: AWS::EC2::VPC\n    Properties:\n      CidrBlock: 10.0.0.0/16\n  # add a Security Group here\n',
    runLabel: 'Validate Template',
    simulate(code) {
      const ok = /AWS::EC2::SecurityGroup/.test(code) && /FromPort\s*:\s*443/.test(code) && /ToPort\s*:\s*443/.test(code) && /0\.0\.0\.0\/0/.test(code)
      return ok
        ? 'Template validation successful. Security group allows inbound 443 from 0.0.0.0/0.'
        : 'Template validation successful, but no security group restricting inbound traffic to 443 was found.'
    },
    hints: [
      'A Security Group resource has Type AWS::EC2::SecurityGroup, with SecurityGroupIngress rules listing FromPort/ToPort/CidrIp.',
      'FromPort and ToPort should both be 443; CidrIp should be 0.0.0.0/0.',
      'MySecurityGroup:\n  Type: AWS::EC2::SecurityGroup\n  Properties:\n    GroupDescription: Allow HTTPS\n    SecurityGroupIngress:\n      - IpProtocol: tcp\n        FromPort: 443\n        ToPort: 443\n        CidrIp: 0.0.0.0/0',
    ],
    xp: 80,
    tool: { name: 'CloudFormation Security Group', icon: '🛡️', description: 'Declares inbound/outbound firewall rules as part of the template itself.', fun: 4 },
    check({ code }) {
      if (!/AWS::EC2::SecurityGroup/.test(code)) return { success: false, message: 'Missing a resource of Type AWS::EC2::SecurityGroup.' }
      if (!/FromPort\s*:\s*443/.test(code) || !/ToPort\s*:\s*443/.test(code)) return { success: false, message: 'The ingress rule should open exactly port 443.' }
      if (!/0\.0\.0\.0\/0/.test(code)) return { success: false, message: 'The CidrIp should be 0.0.0.0/0 to allow from anywhere.' }
      return { success: true, message: 'Only HTTPS traffic gets in — nothing else is open.' }
    },
  },

  // ---------- MCQ: cloud-architecture concepts ----------
  {
    id: 'cc-pool-13-mcq-well-architected',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'The Well-Architected Framework',
    prompt: "What is AWS's Well-Architected Framework?",
    options: [
      'A set of pillars (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability) and questions for evaluating whether a cloud architecture is actually well designed',
      'A single specific AWS service you deploy',
      'A certification required before you can create an AWS account',
      'A pricing discount for well-behaved customers',
    ],
    correctIndex: 0,
    explanation: 'The Well-Architected Framework is a structured set of pillars and review questions AWS provides for evaluating an architecture\'s tradeoffs — not a service you deploy, but a lens for design review.',
    hints: [
      'It\'s a framework for EVALUATING design decisions, not a service you install.',
      'Think of it as a checklist of pillars/questions, applied during architecture review.',
      'The correct answer is: a set of pillars and questions for evaluating whether an architecture is well designed.',
    ],
    xp: 45,
    tool: { name: 'Well-Architected Framework', icon: '🏛️', description: 'Pillars and questions for evaluating cloud architecture design decisions.', fun: 3 },
  },
  {
    id: 'cc-pool-14-mcq-shared-responsibility',
    kind: 'mcq',
    npc: 'IAM Iris',
    title: 'The Shared Responsibility Model',
    prompt: "In AWS's Shared Responsibility Model, who is responsible for securing your S3 bucket's access permissions?",
    options: [
      'AWS secures the underlying cloud infrastructure ("security OF the cloud"); the customer is responsible for configuring things like IAM permissions and bucket policies correctly ("security IN the cloud")',
      'AWS is responsible for absolutely everything, including your own IAM configuration',
      'The customer is responsible for the physical data center security',
      'Nobody is responsible — it\'s automatically secure',
    ],
    correctIndex: 0,
    explanation: 'AWS secures the infrastructure itself (physical data centers, hypervisor, network); the customer is responsible for how they configure what runs on it — IAM policies, bucket permissions, security groups, and their own data.',
    hints: [
      'The split is "OF the cloud" (AWS\'s job) vs. "IN the cloud" (your job).',
      'Misconfigured IAM/bucket permissions are a very common real-world example of the customer\'s side of this split.',
      'The correct answer is: AWS secures the underlying infrastructure; the customer secures their own configuration within it.',
    ],
    xp: 50,
    tool: { name: 'Shared Responsibility Model', icon: '🤝', description: 'AWS secures the infrastructure; you secure your own configuration on top of it.', fun: 3 },
  },
  {
    id: 'cc-pool-15-mcq-regions-azs',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'Regions vs. Availability Zones',
    prompt: "What's the relationship between an AWS Region and an Availability Zone (AZ)?",
    options: [
      'A Region is a geographic area containing multiple, physically separate Availability Zones, each with its own independent power/networking/cooling',
      'They are exactly the same thing, just different names',
      'An Availability Zone contains multiple Regions',
      'A Region is a single data center; an AZ is a single server rack inside it',
    ],
    correctIndex: 0,
    explanation: 'A Region (like us-east-1) is a broad geographic area made up of multiple isolated AZs — each AZ is one or more physically separate data centers with independent power and networking, so a failure in one AZ doesn\'t take down the others.',
    hints: [
      'One of these terms is the BROADER geographic area; the other is a smaller, physically isolated piece inside it.',
      'The whole point of having multiple AZs is that a failure in one doesn\'t take down the others.',
      'The correct answer is: a Region contains multiple physically separate AZs, each independently powered/networked.',
    ],
    xp: 40,
    tool: { name: 'Regions vs. Availability Zones', icon: '🌍', description: 'A Region is the broad area; AZs are the physically isolated data centers inside it.', fun: 2 },
  },
  {
    id: 'cc-pool-16-mcq-s3-storage-classes',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'Why So Many S3 Storage Classes?',
    prompt: "Why does S3 offer multiple storage classes (Standard, Standard-IA, Glacier, etc.) instead of just one?",
    options: [
      'They trade off storage cost against retrieval speed/cost — frequently accessed data stays in a fast, pricier tier; rarely accessed data moves to slower, cheaper tiers',
      'They all cost exactly the same and only differ in name',
      'Only Glacier can actually store data reliably',
      'Standard is being phased out entirely',
    ],
    correctIndex: 0,
    explanation: 'Data you access constantly belongs in Standard (fast, more expensive); data you rarely touch belongs in cheaper tiers like Standard-IA or Glacier, which trade retrieval speed for a much lower storage cost.',
    hints: [
      'It\'s a straightforward tradeoff between two things: how fast you can get the data back, and how much it costs to store.',
      'Frequently accessed data belongs in the faster, pricier tier; rarely accessed data belongs in the cheaper, slower one.',
      'The correct answer is: they trade off storage cost against retrieval speed, for data accessed at different frequencies.',
    ],
    xp: 45,
    tool: { name: 'S3 storage classes', icon: '🧊', description: 'Cost vs. retrieval-speed tradeoffs across Standard, Standard-IA, and Glacier.', fun: 3 },
  },
  {
    id: 'cc-pool-17-mcq-cloudwatch-cloudtrail',
    kind: 'mcq',
    npc: 'Network Nora',
    title: 'CloudWatch vs. CloudTrail',
    prompt: "What's the difference between CloudWatch and CloudTrail?",
    options: [
      'CloudWatch monitors metrics/logs/performance (e.g. CPU usage, error rates); CloudTrail logs WHO made WHAT API call, for auditing',
      'They are the exact same service with two different names',
      'CloudTrail only works for S3; CloudWatch only works for EC2',
      'CloudWatch is for security; CloudTrail is for performance monitoring',
    ],
    correctIndex: 0,
    explanation: 'CloudWatch answers "how is my system performing right now" (metrics, logs, alarms). CloudTrail answers "who did what, when" — an audit trail of every API call made against your account, critical for security investigations.',
    hints: [
      'One is about PERFORMANCE over time; the other is about WHO DID WHAT, for auditing.',
      'If you need to know which IAM user deleted a resource, you\'d check one specific one of these two.',
      'The correct answer is: CloudWatch monitors metrics/performance; CloudTrail audits who made which API call.',
    ],
    xp: 45,
    tool: { name: 'CloudWatch vs. CloudTrail', icon: '👁️', description: 'CloudWatch monitors performance; CloudTrail audits who did what.', fun: 3 },
  },
  {
    id: 'cc-pool-18-mcq-cold-starts',
    kind: 'mcq',
    npc: 'Serverless Sam',
    title: 'Lambda Cold Starts',
    prompt: 'What is a Lambda "cold start"?',
    options: [
      'The extra latency on a Lambda\'s first invocation after being idle, while AWS initializes a fresh execution environment for it',
      'A Lambda function that has a bug and always fails',
      'A scheduled time when Lambda functions are turned off overnight',
      'A discount pricing tier for infrequently used functions',
    ],
    correctIndex: 0,
    explanation: 'When a Lambda hasn\'t run recently, AWS has to spin up a new execution environment (download code, start the runtime) before your function code even begins — that extra setup time is the "cold start". Subsequent invocations reuse the warm environment and skip that delay.',
    hints: [
      'It\'s specifically about LATENCY on the first call after being idle, not a bug or a discount.',
      'Subsequent calls, while the environment is still "warm", don\'t pay this cost.',
      'The correct answer is: extra latency on the first invocation after idle, while a fresh execution environment initializes.',
    ],
    xp: 45,
    tool: { name: 'Lambda cold starts', icon: '🥶', description: 'Extra latency the first time a Lambda runs after being idle, while its environment initializes.', fun: 3 },
  },
  {
    id: 'cc-pool-19-mcq-vpc-peering',
    kind: 'mcq',
    npc: 'Network Nora',
    title: 'VPC Peering',
    prompt: 'What does VPC peering let you do?',
    options: [
      'Privately connect two VPCs so resources in each can communicate directly, without traffic ever going over the public internet',
      'Merge two VPCs into a single one automatically',
      'Give a VPC internet access for the first time',
      'Automatically encrypt all traffic on the public internet',
    ],
    correctIndex: 0,
    explanation: 'A peering connection routes traffic directly between two VPCs\' private IP space — useful for connecting, say, a shared-services VPC to an application VPC — without exposing that traffic to the public internet at all.',
    hints: [
      'The two VPCs stay entirely separate — this just gives them a private path to talk to each other.',
      'The key benefit is that the traffic between them never touches the public internet.',
      'The correct answer is: privately connects two VPCs so resources can communicate without going over the public internet.',
    ],
    xp: 45,
    tool: { name: 'VPC peering', icon: '🔗', description: 'A private connection between two VPCs, bypassing the public internet entirely.', fun: 3 },
  },
  {
    id: 'cc-pool-20-mcq-asg-purpose',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'What an Auto Scaling Group Actually Is',
    prompt: 'What is an Auto Scaling Group (ASG)?',
    options: [
      'A group of EC2 instances managed together, automatically adding or removing instances to keep a desired capacity based on demand or health checks',
      'A single, very powerful EC2 instance',
      'A billing report showing your EC2 costs',
      'A manual process where an engineer launches new instances by hand',
    ],
    correctIndex: 0,
    explanation: 'An ASG manages a group of EC2 instances as one unit — automatically launching new ones (based on scaling policies or failed health checks) and terminating unneeded ones, to keep the group at its desired capacity without manual intervention.',
    hints: [
      'It manages a GROUP of instances as a single unit, not one instance alone.',
      'The word "Auto" is the key — it acts without a human manually launching or terminating anything.',
      'The correct answer is: a group of EC2 instances automatically scaled and health-managed to a desired capacity.',
    ],
    xp: 40,
    tool: { name: 'Auto Scaling Group', icon: '👥', description: 'Automatically maintains a desired number of healthy EC2 instances.', fun: 2 },
  },
  {
    id: 'cc-pool-21-mcq-alb-nlb',
    kind: 'mcq',
    npc: 'Network Nora',
    title: 'Application vs. Network Load Balancer',
    prompt: "What's the key difference between an Application Load Balancer (ALB) and a Network Load Balancer (NLB)?",
    options: [
      'An ALB operates at the application layer (HTTP/HTTPS, can route by URL path/host), while an NLB operates at the transport layer (raw TCP/UDP), built for extreme throughput and low latency',
      'They are exactly the same service under two different names',
      'An NLB can only be used for databases',
      'An ALB can only handle one request at a time',
    ],
    correctIndex: 0,
    explanation: 'ALB understands HTTP — it can route based on URL paths, hostnames, or headers. NLB works at a lower level (TCP/UDP), handling extreme volumes of connections with very low latency, without understanding HTTP content at all.',
    hints: [
      'One understands HTTP content (path/host routing); the other works at a lower, protocol-agnostic level for raw speed.',
      'Think "smart routing based on the request" vs. "extremely fast, low-level packet forwarding".',
      'The correct answer is: ALB routes at the HTTP layer; NLB operates at the TCP/UDP layer for extreme throughput/low latency.',
    ],
    xp: 55,
    tool: { name: 'ALB vs. NLB', icon: '⚖️', description: 'ALB routes by HTTP content; NLB forwards raw TCP/UDP at very low latency.', fun: 3 },
  },
  {
    id: 'cc-pool-22-mcq-spot-instances',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'Spot Instances',
    prompt: 'What are EC2 Spot Instances, and what\'s the tradeoff?',
    options: [
      'Unused EC2 capacity offered at a steep discount, which AWS can reclaim with short notice — good for fault-tolerant or flexible workloads, risky for anything that can\'t handle sudden interruption',
      'A guaranteed-uptime instance type with no risk of interruption, at a premium price',
      'A free tier available to every new AWS account',
      'A type of storage volume, unrelated to compute',
    ],
    correctIndex: 0,
    explanation: 'Spot Instances let you use AWS\'s unused capacity at up to 90% off On-Demand pricing — but AWS can reclaim that capacity with only a short warning, so Spot is great for batch jobs/fault-tolerant workloads and risky for anything that needs to never be interrupted.',
    hints: [
      'The huge discount comes with a real catch — think about what AWS gets to do in exchange for that price.',
      'It\'s well-suited to work that can tolerate being interrupted and restarted elsewhere.',
      'The correct answer is: steeply discounted unused capacity that AWS can reclaim with short notice.',
    ],
    xp: 45,
    tool: { name: 'Spot Instances', icon: '💸', description: 'Steep discounts on unused capacity, reclaimable by AWS with short notice.', fun: 3 },
  },
  {
    id: 'cc-pool-23-mcq-elasticity',
    kind: 'mcq',
    npc: 'Nimbus',
    title: 'What "Elastic" Actually Means',
    prompt: "In cloud computing, what does it mean for a system to be 'elastic'?",
    options: [
      'It automatically scales resources up or down to match actual demand, so you\'re not stuck paying for idle fixed capacity',
      'It never fails, under any circumstances',
      'It only refers to the physical flexibility of data center cabling',
      'It means the system runs exactly one instance, forever',
    ],
    correctIndex: 0,
    explanation: 'Elasticity is the ability to grow or shrink capacity automatically to match real, changing demand — the opposite of provisioning a fixed amount of hardware up front and hoping it\'s the right size.',
    hints: [
      'It\'s about capacity RESPONDING to demand, growing and shrinking as needed.',
      'The contrast is with fixed, pre-provisioned hardware sized for peak load whether or not it\'s ever actually needed.',
      'The correct answer is: automatically scales resources up or down to match actual demand.',
    ],
    xp: 40,
    tool: { name: 'Elasticity', icon: '🎈', description: 'Resources that scale automatically to match real demand, instead of fixed pre-provisioned capacity.', fun: 2 },
  },
  {
    id: 'cc-pool-24-mcq-rto-rpo',
    kind: 'mcq',
    npc: 'Network Nora',
    title: 'RTO vs. RPO',
    prompt: "In disaster recovery planning, what's the difference between RTO and RPO?",
    options: [
      'RTO (Recovery Time Objective) is how long you can be down before you\'re back up; RPO (Recovery Point Objective) is how much data you can afford to lose, measured in time since the last backup/replication',
      'They are two names for exactly the same metric',
      'RTO only applies to databases; RPO only applies to file storage',
      'RPO measures downtime; RTO measures data loss',
    ],
    correctIndex: 0,
    explanation: 'RTO answers "how fast do we need to be back online?" RPO answers "how much recent data can we afford to lose?" — a low RPO needs frequent backups/continuous replication; a low RTO needs fast, often automated, failover.',
    hints: [
      'One is about TIME TO RECOVER (downtime tolerance); the other is about DATA LOSS TOLERANCE.',
      'A very low RPO usually requires near-continuous replication, not just periodic backups.',
      'The correct answer is: RTO = acceptable downtime before recovery; RPO = acceptable data loss, measured in time.',
    ],
    xp: 55,
    tool: { name: 'RTO vs. RPO', icon: '⏱️', description: 'RTO = how long you can be down; RPO = how much recent data you can afford to lose.', fun: 3 },
  },

  // ---------- matching: term ↔ definition ----------
  {
    id: 'cc-pool-25-match-compute',
    kind: 'matching',
    npc: 'Nimbus',
    title: 'AWS Compute Services',
    prompt: 'Match each AWS compute service to its role.',
    pairs: [
      { id: 'a', left: 'EC2', right: 'A full virtual machine you manage yourself — OS, patching, everything' },
      { id: 'b', left: 'ECS', right: 'Runs containers, typically without managing the underlying VMs (via its Fargate launch type)' },
      { id: 'c', left: 'EKS', right: 'A managed Kubernetes control plane on AWS' },
      { id: 'd', left: 'Lambda', right: 'Runs your code with no servers to manage at all — pay only per invocation' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'These sit on a spectrum from most self-managed (EC2) to least (Lambda).',
      'ECS and EKS both run containers, but EKS specifically gives you a managed Kubernetes control plane.',
      'EC2 → full VM you manage. ECS → containers, no VM management. EKS → managed Kubernetes control plane. Lambda → no servers at all.',
    ],
    xp: 60,
    successMessage: 'The whole compute spectrum, matched to how much you manage vs. how much AWS does.',
    tool: { name: 'AWS compute services', icon: '💻', description: 'EC2, ECS, EKS, and Lambda compared.', fun: 3 },
  },
  {
    id: 'cc-pool-26-match-storage',
    kind: 'matching',
    npc: 'Nimbus',
    title: 'AWS Storage Services',
    prompt: 'Match each AWS storage service to its role.',
    pairs: [
      { id: 'a', left: 'S3', right: 'Object storage — files accessed over HTTP, at massive scale' },
      { id: 'b', left: 'EBS', right: 'Block storage attached to a single EC2 instance, like a virtual hard drive' },
      { id: 'c', left: 'EFS', right: 'A shared file system multiple EC2 instances can mount at once' },
      { id: 'd', left: 'Glacier', right: 'Extremely cheap archival storage, built for data you rarely need to retrieve' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'S3 and Glacier are both object-style storage (Glacier is really an S3 storage class); EBS and EFS both attach as filesystems to EC2.',
      'EBS attaches to ONE instance at a time; EFS can be mounted by MANY instances simultaneously.',
      'S3 → object storage over HTTP. EBS → block storage for one instance. EFS → shared file system for many instances. Glacier → cheap, rarely-accessed archival storage.',
    ],
    xp: 60,
    successMessage: 'Every core AWS storage service, matched to what it\'s actually built for.',
    tool: { name: 'AWS storage services', icon: '💾', description: 'S3, EBS, EFS, and Glacier compared.', fun: 3 },
  },
  {
    id: 'cc-pool-27-match-networking',
    kind: 'matching',
    npc: 'Network Nora',
    title: 'AWS Networking Vocabulary',
    prompt: 'Match each AWS networking term to its meaning.',
    pairs: [
      { id: 'a', left: 'VPC', right: 'Your own private, isolated network within AWS' },
      { id: 'b', left: 'Subnet', right: 'A smaller slice of a VPC\'s IP range, marked public or private' },
      { id: 'c', left: 'Security Group', right: 'A stateful firewall attached to individual resources (like an EC2 instance)' },
      { id: 'd', left: 'NACL', right: 'A stateless firewall applied at the subnet level, checked before the Security Group' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'VPC and Subnet describe the NETWORK STRUCTURE; Security Group and NACL are both FIREWALLS, but at different levels.',
      'Security Groups are stateful and apply per-resource; NACLs are stateless and apply per-subnet.',
      'VPC → your isolated network. Subnet → a slice of the VPC\'s IP range. Security Group → stateful, per-resource firewall. NACL → stateless, per-subnet firewall.',
    ],
    xp: 65,
    successMessage: 'The core building blocks of AWS networking, matched up.',
    tool: { name: 'AWS networking vocabulary', icon: '🕸️', description: 'VPCs, subnets, security groups, and NACLs.', fun: 4 },
  },
  {
    id: 'cc-pool-28-match-databases',
    kind: 'matching',
    npc: 'Nimbus',
    title: 'AWS Database Services',
    prompt: 'Match each AWS database service to its role.',
    pairs: [
      { id: 'a', left: 'RDS', right: 'Managed relational databases (Postgres, MySQL, and others)' },
      { id: 'b', left: 'DynamoDB', right: 'A managed NoSQL key-value/document database, built for massive scale' },
      { id: 'c', left: 'ElastiCache', right: 'A managed in-memory cache (Redis/Memcached) for very fast reads' },
      { id: 'd', left: 'Redshift', right: 'A managed data warehouse, built for large analytical queries' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'RDS and DynamoDB are both primary data stores (relational vs. NoSQL); ElastiCache and Redshift serve very different secondary purposes — speed and analytics.',
      'ElastiCache is about SPEED (in-memory); Redshift is about ANALYTICS (data warehousing).',
      'RDS → managed relational databases. DynamoDB → managed NoSQL at scale. ElastiCache → in-memory cache for fast reads. Redshift → managed data warehouse for analytics.',
    ],
    xp: 60,
    successMessage: 'The core AWS data services, matched to what each is actually built for.',
    tool: { name: 'AWS database services', icon: '🗄️', description: 'RDS, DynamoDB, ElastiCache, and Redshift compared.', fun: 3 },
  },
  {
    id: 'cc-pool-29-match-iamvocab',
    kind: 'matching',
    npc: 'IAM Iris',
    title: 'IAM Vocabulary',
    prompt: 'Match each IAM term to its meaning.',
    pairs: [
      { id: 'a', left: 'User', right: 'A real identity — a person or application with long-term credentials' },
      { id: 'b', left: 'Role', right: 'A set of permissions something can temporarily assume, with no long-term credentials of its own' },
      { id: 'c', left: 'Policy', right: 'A document declaring exactly what actions are allowed or denied' },
      { id: 'd', left: 'Permission boundary', right: 'A ceiling that limits the MAXIMUM permissions a user or role can ever have, even if their policy grants more' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'User and Role are both IDENTITIES, but only one has long-term credentials; Policy and Permission boundary are both about DEFINING what\'s allowed, at different levels.',
      'A permission boundary caps what\'s POSSIBLE, even if the attached policy would otherwise grant more.',
      'User → identity with long-term credentials. Role → temporarily assumable permissions. Policy → declares allowed/denied actions. Permission boundary → caps the maximum possible permissions.',
    ],
    xp: 65,
    successMessage: 'The core IAM vocabulary, matched to its exact role.',
    tool: { name: 'IAM vocabulary', icon: '🔐', description: 'Users, roles, policies, and permission boundaries.', fun: 4 },
  },
  {
    id: 'cc-pool-30-match-wellarchitected',
    kind: 'matching',
    npc: 'Nimbus',
    title: 'Well-Architected Pillars',
    prompt: 'Match each Well-Architected Framework pillar to what it\'s about.',
    pairs: [
      { id: 'a', left: 'Security', right: 'Protecting data, systems, and assets through risk assessment and mitigation' },
      { id: 'b', left: 'Reliability', right: 'The ability to recover from failure and consistently meet demand' },
      { id: 'c', left: 'Performance Efficiency', right: 'Using computing resources efficiently to meet requirements as they evolve' },
      { id: 'd', left: 'Cost Optimization', right: 'Avoiding unnecessary costs while still meeting business needs' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Security and Reliability are both about PROTECTING the system from harm/failure; Performance Efficiency and Cost Optimization are both about USING RESOURCES well.',
      'Reliability is specifically about recovering from failure; Performance Efficiency is about using resources efficiently as needs change.',
      'Security → protects against risk. Reliability → recovers from failure, meets demand. Performance Efficiency → uses resources efficiently. Cost Optimization → avoids unnecessary spend.',
    ],
    xp: 65,
    successMessage: 'Four of the Well-Architected Framework\'s pillars, matched to what each actually evaluates.',
    tool: { name: 'Well-Architected pillars', icon: '🏛️', description: 'Security, reliability, performance efficiency, and cost optimization.', fun: 4 },
  },
  {
    id: 'cc-pool-31-match-observability',
    kind: 'matching',
    npc: 'Network Nora',
    title: 'AWS Monitoring & Observability Tools',
    prompt: 'Match each AWS observability tool to its role.',
    pairs: [
      { id: 'a', left: 'CloudWatch', right: 'Monitors metrics, logs, and alarms across your resources' },
      { id: 'b', left: 'CloudTrail', right: 'Logs every API call made in your account, for auditing' },
      { id: 'c', left: 'X-Ray', right: 'Traces a single request as it flows across multiple services' },
      { id: 'd', left: 'GuardDuty', right: 'Continuously analyzes activity for signs of a security threat' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'CloudWatch and CloudTrail are the two most foundational tools (metrics/logs vs. API audit trail); X-Ray and GuardDuty are more specialized (tracing vs. threat detection).',
      'X-Ray is about following ONE request across services; GuardDuty is about detecting threats automatically.',
      'CloudWatch → metrics/logs/alarms. CloudTrail → API call audit log. X-Ray → traces one request across services. GuardDuty → automated threat detection.',
    ],
    xp: 65,
    successMessage: 'Every core AWS observability tool, matched to its actual job.',
    tool: { name: 'AWS observability tools', icon: '👁️', description: 'CloudWatch, CloudTrail, X-Ray, and GuardDuty.', fun: 4 },
  },
  {
    id: 'cc-pool-32-match-serverless',
    kind: 'matching',
    npc: 'Serverless Sam',
    title: 'Serverless AWS Services',
    prompt: 'Match each serverless AWS service to its role.',
    pairs: [
      { id: 'a', left: 'Lambda', right: 'Runs your code in response to events, with no server to manage' },
      { id: 'b', left: 'API Gateway', right: 'The front door for a serverless API — routes requests to the right Lambda' },
      { id: 'c', left: 'DynamoDB', right: 'A fully managed NoSQL database with no servers to provision' },
      { id: 'd', left: 'Step Functions', right: 'Orchestrates multiple Lambda functions into a single visual workflow' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Lambda and DynamoDB are both individual serverless BUILDING BLOCKS (compute and data); API Gateway and Step Functions both COORDINATE around them.',
      'API Gateway routes a single incoming request; Step Functions orchestrates a whole multi-step workflow.',
      'Lambda → runs code on events. API Gateway → routes requests to Lambda. DynamoDB → managed NoSQL, no servers. Step Functions → orchestrates a multi-step workflow.',
    ],
    xp: 60,
    successMessage: 'The core serverless building blocks, matched to how they fit together.',
    tool: { name: 'Serverless AWS services', icon: '⚡', description: 'Lambda, API Gateway, DynamoDB, and Step Functions.', fun: 3 },
  },
  {
    id: 'cc-pool-33-match-cicd',
    kind: 'matching',
    npc: 'Serverless Sam',
    title: 'AWS CI/CD Tools',
    prompt: 'Match each AWS CI/CD tool to its role.',
    pairs: [
      { id: 'a', left: 'CodeCommit', right: 'A managed Git repository hosting service' },
      { id: 'b', left: 'CodeBuild', right: 'Compiles code, runs tests, and produces build artifacts' },
      { id: 'c', left: 'CodeDeploy', right: 'Automates deploying an application to EC2, Lambda, or ECS' },
      { id: 'd', left: 'CodePipeline', right: 'Orchestrates the whole release process across the other three services' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'CodeCommit and CodeBuild handle the earlier steps (storing code, building it); CodeDeploy and CodePipeline handle the later steps (shipping it, orchestrating the whole thing).',
      'CodePipeline is the "conductor" — it doesn\'t do the work itself, it calls the other three in order.',
      'CodeCommit → hosts Git repos. CodeBuild → compiles/tests/builds. CodeDeploy → automates deployment. CodePipeline → orchestrates the whole release.',
    ],
    xp: 65,
    successMessage: 'The whole AWS-native CI/CD toolchain, matched to its actual role in the pipeline.',
    tool: { name: 'AWS CI/CD tools', icon: '🔁', description: 'CodeCommit, CodeBuild, CodeDeploy, and CodePipeline.', fun: 4 },
  },
  {
    id: 'cc-pool-34-match-disasterrecovery',
    kind: 'matching',
    npc: 'Network Nora',
    title: 'Disaster Recovery Vocabulary',
    prompt: 'Match each disaster-recovery term to its meaning.',
    pairs: [
      { id: 'a', left: 'RTO', right: 'How long you can be down before you must be back online' },
      { id: 'b', left: 'RPO', right: 'How much recent data you can afford to lose, measured in time' },
      { id: 'c', left: 'Failover', right: 'Automatically switching traffic to a healthy standby when the primary fails' },
      { id: 'd', left: 'Multi-region', right: 'Running infrastructure in more than one geographic region, for resilience against a whole-region outage' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'RTO and RPO are both TARGETS/objectives you set; Failover and Multi-region are both real MECHANISMS used to help hit those targets.',
      'RTO is about downtime tolerance; RPO is about data loss tolerance — easy to mix up.',
      'RTO → acceptable downtime before recovery. RPO → acceptable data loss, in time. Failover → automatic switch to a healthy standby. Multi-region → infrastructure spread across regions for resilience.',
    ],
    xp: 65,
    successMessage: 'The core disaster-recovery vocabulary, matched to its exact meaning.',
    tool: { name: 'Disaster recovery vocabulary', icon: '🆘', description: 'RTO, RPO, failover, and multi-region architecture.', fun: 4 },
  },
  {
    id: 'cc-pool-35-match-security',
    kind: 'matching',
    npc: 'IAM Iris',
    title: 'AWS Security Services',
    prompt: 'Match each AWS security service to its role.',
    pairs: [
      { id: 'a', left: 'KMS', right: 'Manages encryption keys used to encrypt data across AWS services' },
      { id: 'b', left: 'Secrets Manager', right: 'Securely stores and rotates credentials like database passwords and API keys' },
      { id: 'c', left: 'WAF', right: 'Filters malicious web traffic (SQL injection, XSS) before it reaches your app' },
      { id: 'd', left: 'Shield', right: 'Protects against DDoS attacks' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'KMS and Secrets Manager both protect SENSITIVE VALUES (encryption keys, credentials); WAF and Shield both protect against INCOMING ATTACK TRAFFIC.',
      'WAF filters based on the CONTENT of a request (like SQL injection patterns); Shield protects against sheer VOLUME (DDoS).',
      'KMS → manages encryption keys. Secrets Manager → stores/rotates credentials. WAF → filters malicious web traffic. Shield → protects against DDoS.',
    ],
    xp: 65,
    successMessage: 'The core AWS security services, matched to what each actually protects against.',
    tool: { name: 'AWS security services', icon: '🛡️', description: 'KMS, Secrets Manager, WAF, and Shield.', fun: 4 },
  },
  {
    id: 'cc-pool-36-match-costmanagement',
    kind: 'matching',
    npc: 'Nimbus',
    title: 'Cost Management Vocabulary',
    prompt: 'Match each cost-management term to its meaning.',
    pairs: [
      { id: 'a', left: 'Reserved Instance', right: 'Commit to using an instance type for 1-3 years, for a significant discount vs. On-Demand' },
      { id: 'b', left: 'Spot Instance', right: 'Unused capacity at a steep discount, reclaimable by AWS with short notice' },
      { id: 'c', left: 'Savings Plan', right: 'Commit to a consistent amount of compute spend over time, for a discount, more flexible than a Reserved Instance' },
      { id: 'd', left: 'Right-sizing', right: 'Matching an instance\'s size to what the workload actually needs, instead of over-provisioning' },
    ],
    rightOrder: ['c', 'a', 'd', 'b'],
    hints: [
      'Reserved Instance and Savings Plan are both COMMITMENT-based discounts (one to a specific instance type, one to a spend amount); Spot Instance and Right-sizing are different LEVERS entirely.',
      'A Savings Plan is more flexible than a Reserved Instance — it commits to a dollar amount, not a specific instance type.',
      'Reserved Instance → discount for committing to an instance type. Spot Instance → steep discount, reclaimable. Savings Plan → flexible spend commitment discount. Right-sizing → matching instance size to actual need.',
    ],
    xp: 65,
    successMessage: 'Every core cost-management lever, matched to how it actually saves money.',
    tool: { name: 'Cost management vocabulary', icon: '💰', description: 'Reserved Instances, Spot Instances, Savings Plans, and right-sizing.', fun: 4 },
  },
]
