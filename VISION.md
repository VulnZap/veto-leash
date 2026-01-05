# VISION.md

> **Stop AI agents from deleting files, leaking secrets, or pushing to prod—without slowing devs down.**

This document defines who we are, what we're building, and how we win. Read this before writing code.

---

## The Opportunity

AI agents are crossing from demos to production. Every major company is deploying agents that can execute code, access databases, call APIs, and interact with production systems. This creates a **massive trust gap**:

- Agents can `rm -rf /` your filesystem
- Agents can read `.env` and exfiltrate secrets
- Agents can push untested code to main
- Agents can make network requests you never see
- Agents can run indefinitely without human approval

Today, teams either (1) disable agents entirely, (2) trust blindly and hope, or (3) build custom guardrails that don't scale. **There is no standard permission layer for AI agents.**

That's what Veto is.

---

## What Veto Is

**Veto is the authorization kernel for AI agents.**

Think: `sudo` for agents. Or OPA (Open Policy Agent) for the agentic era.

### Product Shape

```
┌─────────────────────────────────────────────────────────────────┐
│                        Veto CLI (OSS)                           │
│  - Creates veto/ folder with config + rules                    │
│  - Enforces guardrails locally by default                      │
│  - Plugin system for different agent types                     │
│  - Works offline, no account required                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Veto Cloud (Paid)                         │
│  - Natural language → structured policies                      │
│  - Sync policies across repos and teams                        │
│  - Dashboard for compliance monitoring                         │
│  - Approval workflows and audit logs                           │
│  - SSO, SIEM integration, enterprise features                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Interface

One interface governs all agents:

| Agent Type | Examples | Status |
|------------|----------|--------|
| **Coding agents** | Claude Code, Cursor, Windsurf, Copilot, Aider | Now |
| **DevOps agents** | Infrastructure automation, CI/CD agents | Next |
| **Finance agents** | Trading bots, expense automation | Future |
| **Browser agents** | Web automation, data extraction | Future |
| **Custom agents** | Any tool-calling LLM application | SDK ready |

The plugin architecture means the same policy UX scales across domains.

---

## How Veto Cloud Works

### User Workflow

```
1. User writes policy in natural language:
   "Block any command that deletes more than 10 files"
   "Require approval for git push to main"
   "Never allow access to /etc or ~/.ssh"

2. Veto converts to structured policy:
   - Parses intent
   - Generates YAML rules
   - Validates against schema

3. Cloud syncs to all connected repos:
   - Push from dashboard → all team members get update
   - Version controlled policies
   - Rollback capability

4. Dashboard shows compliance:
   - Which repos have Veto installed
   - Policy violations across team
   - Approval queue for "ask" rules
   - Audit log of all agent actions
```

### Team Manager View

```
┌─────────────────────────────────────────────────────────────────┐
│  Veto Cloud Dashboard                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Team: Acme Engineering (23 repos, 47 developers)              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 1,247       │  │ 12          │  │ 3           │            │
│  │ Actions     │  │ Blocked     │  │ Pending     │            │
│  │ today       │  │ today       │  │ approval    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  Recent Activity:                                               │
│  • Agent tried to run `rm -rf node_modules` → BLOCKED          │
│  • Agent pushed to feature branch → ALLOWED                    │
│  • Agent tried to read .env.production → BLOCKED               │
│                                                                 │
│  [ Push New Policy ] [ View Audit Log ] [ Manage Team ]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## How We Make Money

### Business Model

| Tier | Price | Features |
|------|-------|----------|
| **OSS CLI** | Free forever | Local enforcement, all rules, BYOK models |
| **Cloud Pro** | $29/dev/mo | Sync, dashboard, 5 repos, audit log |
| **Cloud Team** | $79/dev/mo | Unlimited repos, approval workflows, SSO |
| **Enterprise** | Custom | SIEM, on-prem, SLAs, dedicated support |

### Revenue Streams

1. **Cloud sync + team management** (primary)
   - Central policy distribution
   - Compliance dashboard
   - Approval workflows
   - Audit logs

2. **Managed model inference** (secondary)
   - Seamless onboarding: create account → start using instantly
   - Inference runs on our managed credits (Gemini under the hood)
   - Abstracted behind Veto's policy UX and tuning
   - Users don't think about models—they think about policies

3. **Policy marketplace** (future)
   - Community-contributed rule sets
   - Premium policy packs (SOC2, HIPAA, PCI)
   - Plugin ecosystem for custom integrations

### The Moat

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEFENSIBILITY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INTEGRATIONS                                                │
│     First to integrate with every major coding agent           │
│     Each integration = switching cost for users                 │
│                                                                 │
│  2. ENFORCEMENT CHOKE POINT                                     │
│     We sit between agent and action                            │
│     No bypass path = real security                             │
│                                                                 │
│  3. POLICY UX                                                   │
│     Natural language → structured rules                        │
│     Lowest friction way to define what agents can do           │
│                                                                 │
│  4. TELEMETRY-DRIVEN INTELLIGENCE                               │
│     Learn from all agent actions across all users              │
│     "Ask vs auto-approve" gets smarter over time               │
│     Network effects in safety                                  │
│                                                                 │
│  5. ECOSYSTEM LOCK-IN                                           │
│     Policies, plugins, marketplace = platform stickiness       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Model Strategy

### Default Path (Frictionless)

```
User signs up → Gets managed inference credits → Starts using immediately
```

- **Backend**: Gemini (cost-effective, fast)
- **Abstraction**: Users see "Veto" not "Gemini"
- **Tuning**: Our prompts, our policy format, our UX
- **Future**: Migrate to veto-warden-4b when ready

### BYOK Path (Power Users)

```
User brings own API key → Full local control → Still syncs to cloud
```

- Supported for enthusiasts who want control
- Not the default onboarding path
- Cloud sync and team compliance work best with managed path
- Trade-off: convenience + org guarantees ↔ flexibility

### Long-Term: veto-warden-4b

We're training `veto-warden-4b`—a purpose-built model for policy evaluation:

- Trained on 30k+ policy decision examples
- Optimized for: "Given this action and these rules, allow/deny/ask?"
- Runs locally via Ollama (privacy-preserving)
- Becomes the default when hosted infrastructure is ready

---

## Positioning

### Not This → This

| Old Framing | New Framing |
|-------------|-------------|
| "Permission layer for AI agents" | "Stop agents from breaking prod" |
| "Guardrails SDK" | "sudo for AI agents" |
| "Policy enforcement" | "The authorization kernel for the agentic era" |
| Feature-led | Outcome-led |

### One-Liner Options

- "Stop AI agents from deleting files, leaking secrets, or pushing to prod."
- "The authorization kernel for AI agents."
- "sudo for the agentic era."
- "Because trusting GPT-4 with `rm -rf` is insane."

### Tagline

> **Control what AI agents can do. Everywhere.**

---

## Who It's For

### Primary: Engineering Teams Using Coding Agents

**Pain points:**
- "Claude just deleted my node_modules"
- "I don't know what Cursor is doing in the background"
- "We can't use AI tools because security said no"

**Value prop:**
- 10-minute setup, instant protection
- Keep using AI tools, but safely
- Unblock security team approval

### Secondary: Platform Teams Building Agentic Apps

**Pain points:**
- "Our agent can theoretically do anything"
- "We need guardrails but don't want to build them"
- "Compliance is asking about AI governance"

**Value prop:**
- Drop-in SDK, no behavior change for AI
- YAML rules, version controlled
- Audit log for compliance

### Tertiary: AppSec / GRC Teams

**Pain points:**
- "We have no visibility into what AI is doing"
- "There's no policy framework for agents"
- "How do we prove AI isn't exfiltrating data?"

**Value prop:**
- Central dashboard across all repos
- Push policies to entire org
- SIEM integration, audit trail

---

## Top Risks We Solve

| Risk | How Veto Helps |
|------|----------------|
| **Destructive actions** | Block `rm -rf`, `DROP TABLE`, force pushes |
| **Silent exfiltration** | Block/monitor network calls, API requests |
| **No central policy** | Cloud sync pushes rules to all repos |
| **No approval workflow** | "Ask" mode requires human approval |
| **Weak audit trail** | Every action logged, exportable |
| **Provider churn** | Works with any LLM, any agent framework |

---

## Go-to-Market

### Phase 1: OSS Wedge (Now)

```
Goal: Get Veto CLI installed in 10,000 repos

Tactics:
- Launch on Hacker News, Reddit, Twitter
- "10-minute setup" positioning
- Blog posts: "How Claude almost deleted my project"
- GitHub stars as social proof
- Integrations with Claude, Cursor, Windsurf
```

### Phase 2: Cloud Launch (Q2)

```
Goal: Convert 5% of OSS users to paid

Tactics:
- "Sync your policies across team" CTA in CLI
- Team features: central dashboard, approvals
- Case studies from design partners
- SOC2 compliance story
```

### Phase 3: Enterprise (Q3-Q4)

```
Goal: Land 10 enterprise accounts

Tactics:
- SSO, SIEM, on-prem options
- Dedicated support, SLAs
- Compliance certifications
- Channel partnerships (security vendors)
```

### Phase 4: Platform (2026)

```
Goal: Become the standard for agent authorization

Tactics:
- Policy marketplace launch
- Plugin ecosystem for non-coding agents
- API for third-party integrations
- "Powered by Veto" certification
```

---

## The Ecosystem

### Company Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          Plaw, Inc.                             │
│                      (Parent Company)                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VulnZap                                │
│              (Security Product Line / Brand)                    │
│                                                                 │
│  "AI-native security tools for the agentic era"               │
│                                                                 │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│         Faraday            │              Veto                  │
│    (Code Security)         │      (Runtime Control)             │
│                            │                                    │
│  • Scans code for vulns    │  • Governs agent actions          │
│  • AI-powered patching     │  • Policy enforcement             │
│  • Pre-commit / CI         │  • Real-time interception         │
│                            │                                    │
│  "Reduce code risk"        │  "Prevent dangerous side effects" │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

### How They Work Together

```
Developer writes code with AI agent
            │
            ▼
    ┌───────────────┐
    │    Veto       │ ← Blocks dangerous agent actions in real-time
    └───────────────┘
            │
            ▼
    Code is written safely
            │
            ▼
    ┌───────────────┐
    │   Faraday     │ ← Scans code for vulnerabilities
    └───────────────┘
            │
            ▼
    Secure code ships to production
```

### Brand Positioning

| Product | Tagline | Domain |
|---------|---------|--------|
| **VulnZap** | AI-native security | vulnzap.com |
| **Faraday** | Secure your code | faraday.dev |
| **Veto** | Control your agents | veto.run |

---

## Why We Win

1. **First mover** in agent authorization space
2. **OSS-first** builds trust and adoption
3. **Integration depth** with every major coding agent
4. **Policy UX** that non-security people can use
5. **Telemetry flywheel** makes the product smarter
6. **Ecosystem play** (Faraday + Veto) for full coverage

---

## The North Star

> **Every AI agent in production runs through Veto.**

Not because we force it. Because it's the obvious choice.

- Developers love it (10-minute setup, doesn't slow them down)
- Security teams love it (visibility, control, audit trail)
- Executives love it (risk reduction, compliance story)

We're not building a feature. We're building infrastructure.

The authorization kernel for the agentic era.

---

*This document is the strategic foundation. For technical implementation details, see [AGENTS.md](./AGENTS.md).*
