< p align= "center">
      <ima src="kaira\public\Banner.png" alt= Banner width="100%>
</p>

# Kaira

**Know your money. Protect your future.**

Kaira is a personal finance management prototype designed to help users understand how much of their current balance is actually safe to spend.

Traditional banking interfaces often show what is available *right now*, but that number does not necessarily reflect what is already committed to subscriptions, recurring payments, savings goals, safety buffers, or near-term obligations.

Kaira takes a forward-looking approach to personal finance by combining recurring-payment detection, expense forecasting, protected savings, and purchase simulation into a single decision layer.

> **Kaira asks a different question:**  
> *How much can I spend without compromising what comes next?*

---

## Project Story

Kaira was born at **Ignition Hack V7**.

The project started from a simple frustration: many financial applications feel visually repetitive, reactive, and focused on showing what already happened rather than helping users understand what their money means *before* they make a decision.

Kaira began as an attempt to rethink that experience from a different angle: not just another transaction dashboard, but a financial companion centered on **safe-to-spend awareness, future commitments, and proactive decision-making**.

The project was later revisited for the **Midnight Hackathon, August 28–29, 2026**, under the track:

> **Integrate Midnight to Upgrade an Existing App**

For this evolution, the focus is not on rebuilding Kaira from scratch. The goal is to upgrade an existing financial prototype with a meaningful privacy and security layer using Midnight.

---

## Problem

A bank balance does not represent true spending capacity.

Users may have money in their account while part of that balance is effectively committed to:

- recurring payments;
- subscriptions;
- upcoming expenses;
- savings goals;
- financial safety margins.

This creates a gap between **current balance** and **actually disposable money**.

Kaira is designed around closing that gap.

---

## Solution

Kaira processes financial activity and upcoming commitments to provide a more useful representation of available money.

```text
Current Balance
      |
      +-- Upcoming recurring expenses
      +-- Reserved savings
      +-- Safety buffer
      |
      v
Safe-to-Spend Amount
      |
      v
Purchase Simulation
      |
      +-- Safe
      +-- Warning
      +-- High Risk
```

Instead of asking only:

> How much money do I have?

Kaira is designed to answer:

> How much can I spend without affecting my upcoming commitments?

---

## Core Features

### Safe-to-Spend Calculation

Kaira calculates a more realistic spending limit using the user's current financial position together with upcoming commitments, protected savings, and a configurable safety buffer.

### Recurring Payment Detection

Transaction data is analyzed to identify recurring charges and expected future payments.

Detected recurring expenses are used to forecast upcoming commitments rather than treating past transactions as isolated events.

### Subscription Controls

Recurring payments can be reviewed and managed individually to improve visibility over automatic charges and reduce surprise renewals.

### Upcoming Expense Forecasting

Kaira projects detected recurring payments into the near future so the application can reason about money that is present today but likely needed soon.

### Savings Goals

Users can reserve part of their balance for specific goals.

Reserved funds are excluded from available spending capacity and can be:

- created;
- funded;
- moved between goals;
- released back into available spending.

### Purchase Simulator

The purchase simulator evaluates the impact of a hypothetical purchase before the user makes it.

It compares:

- safe-to-spend before the purchase;
- proposed purchase amount;
- projected safe-to-spend after the purchase;
- upcoming commitments;
- configured safety buffer.

The result is classified as:

```text
Safe
Warning
High Risk
```

### Kaira Guard

When a simulated purchase introduces financial risk, Kaira Guard can trigger an additional protection workflow and return a recommendation intended to help the user reconsider or delay spending that may interfere with upcoming obligations.

### Voice Warnings

For high-risk scenarios, Kaira can generate an audible warning using **ElevenLabs**, extending financial alerts beyond the dashboard.

### Automation Workflows

Kaira uses **n8n** to automate supporting processes and workflow orchestration around the prototype.

---

## Midnight Security Upgrade

Kaira is being extended for the **Integrate Midnight to Upgrade an Existing App** track.

The goal of this upgrade is to demonstrate how a financial application can verify a financial safety condition **without disclosing the sensitive financial values used to evaluate it**.

### Before Midnight

The original Kaira prototype calculates a user's Safe-to-Spend amount from:

- current balance;
- upcoming commitments;
- reserved savings;
- safety buffer.

The purchase simulator then evaluates how a hypothetical purchase would affect that financial position.

The pre-Midnight version is preserved at:

```text
v0.1-before-midnight
```

### After Midnight

The Midnight integration introduces **Kaira Private Guard**.

Instead of exposing the financial inputs used to evaluate a purchase, Kaira can generate a privacy-preserving proof that the purchase satisfies the configured financial safety condition.

Conceptually:

```text
Safe-to-Spend >= Proposed Purchase
```

The proof is designed to reveal the result of the condition without revealing the user's exact:

- balance;
- savings;
- commitments;
- safety buffer;
- Safe-to-Spend value.

---

## Privacy Model

### Private Data

The prototype treats the following information as confidential:

- current account balance;
- upcoming financial commitments;
- protected / reserved savings;
- safety buffer;
- calculated Safe-to-Spend amount.

### Public / Disclosed Data

The prototype may disclose:

- the purchase amount being evaluated;
- a commitment to the relevant financial snapshot;
- proof metadata;
- whether the financial condition was satisfied.

The objective is **selective disclosure**: prove what is needed for a decision while keeping the underlying financial state private.

---

## Security Model

The Midnight upgrade is designed around:

- zero-knowledge verification;
- private financial inputs;
- financial snapshot commitments;
- proof expiration;
- replay protection;
- explicit disclosure boundaries.

No wallet seed phrase, private key, banking credential, or real user financial secret should ever be stored in this repository.

---

## Prototype Security Limitations

Kaira is a hackathon prototype and has **not** undergone a production security audit.

The current implementation uses simulated financial data and does not connect to real banking accounts or execute real banking transactions.

A valid zero-knowledge proof demonstrates that the specified computation was satisfied for the committed private inputs. In this prototype, it does **not** independently prove that those inputs originated from a real financial institution.

A production system would require additional trusted data sources, authentication, key management, security review, compliance controls, and real-world financial integrations.

---

## Not a Financial Institution

Kaira is an experimental software prototype.

It is not a bank, financial institution, investment advisor, payment processor, or financial service provider.

The application does not currently hold, transmit, custody, or move real user funds.

---

## Financial Logic

Kaira is built around a simple principle:

```text
Available balance != Safe-to-Spend balance
```

At a high level:

```text
Safe-to-Spend
=
Current Balance
- Upcoming Commitments
- Protected / Reserved Funds
- Safety Buffer
```

The purchase simulator then evaluates:

```text
Projected Safe-to-Spend
=
Safe-to-Spend
- Proposed Purchase
```

That projected value is used to determine the risk associated with the purchase.

---

## System Architecture

```text
                    +----------------------+
                    |   Account / Finance  |
                    |        Data          |
                    +----------+-----------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
   +--------------------+          +-----------------------+
   | Recurring Payment  |          |    Savings Goals      |
   |     Detection      |          | Reserved Funds Logic  |
   +---------+----------+          +-----------+-----------+
             |                                 |
             v                                 |
   +--------------------+                      |
   | Expense Forecasting|                      |
   +---------+----------+                      |
             |                                 |
             +----------------+----------------+
                              |
                              v
                   +-----------------------+
                   | Financial Calculation |
                   |   / Safe-to-Spend     |
                   +-----------+-----------+
                               |
                               v
                   +-----------------------+
                   |  Purchase Simulator   |
                   | Safe / Warning / Risk |
                   +-----------+-----------+
                               |
                               v
                   +-----------------------+
                   |      Kaira Guard      |
                   +-----------+-----------+
                               |
                    Midnight Security Layer
                               |
                               v
                   +-----------------------+
                   |   Kaira Private Guard |
                   |   Private ZK Proofs   |
                   +-----------------------+
```

---

## Technology

Kaira is built as a full-stack web application.

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

### Backend & Data

- Next.js API routes
- Supabase
- Custom financial data models
- Custom recurring-payment detection logic
- Custom financial forecasting logic
- Custom purchase-risk engine

### Automation

- n8n

### Voice & AI-Assisted Workflows

- ElevenLabs
- AI-assisted recommendation workflows

### Privacy & Security Upgrade

- Midnight
- Compact / zero-knowledge proof logic
- Privacy-preserving financial verification

---

## Project Structure

The application follows a modular structure similar to:

```text
app/
├── api/
│   ├── goals/
│   ├── guard/
│   └── voice-warning/
│
├── ...

components/
├── financial dashboard components
├── purchase simulator
├── savings goals
└── recurring payment controls

lib/
├── data/
│   ├── accounts
│   ├── transactions
│   ├── recurring-controls
│   └── savings-goals
│
├── engines/
│   ├── recurring-engine
│   ├── forecasting logic
│   └── collision-engine
│
├── midnight/
│   └── privacy / proof integration
│
├── types/
└── utils/
```

---

## Running the Project

### Requirements

- Node.js
- npm

### Installation

```bash
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Prototype Scope

Kaira is currently a hackathon prototype.

The project demonstrates the core product concept, financial decision engine, recurring-payment analysis, savings logic, purchase simulation, warning workflows, and an evolving Midnight-based privacy layer.

It does not currently execute real banking transactions or move real funds.

---

## Key Design Decision

Kaira intentionally separates **balance visibility** from **spending availability**.

Most finance dashboards are retrospective. They show transactions, categories, and balances after financial decisions have already been made.

Kaira introduces a forward-looking layer:

```text
Past
Transactions and recurring-pattern detection

Present
Current balance and reserved savings

Future
Upcoming charges and financial commitments

Decision
Impact of a potential purchase

Privacy
Verify the decision without exposing the full financial state
```

---

## AI-Assisted Development

Artificial intelligence tools were used as development assistants during the hackathon.

AI assistance may include:

- architecture exploration;
- code generation and review;
- debugging;
- documentation drafting;
- security analysis;
- visual ideation.

All product decisions, implementation choices, testing, integration work, and final project submission are reviewed and directed by the project author/team.

### Tools Used

- **ChatGPT / OpenAI** — architecture exploration, documentation support, debugging assistance, security reasoning, code review, and development planning.

This disclosure is included for transparency in accordance with the hackathon's AI tooling rules.

## Project Provenance

Kaira maintains its development history through Git.

Important milestones:

- `v0.1-before-midnight` — Kaira before the Midnight integration.
- `v0.2-midnight` — Kaira with the Midnight privacy/security upgrade.

The Git history documents the evolution of the implementation and the work introduced during each hackathon stage.

### Hackathon History

- **Ignition Hack V7** — original Kaira prototype.
- **Midnight Hackathon — August 28–30, 2026** — privacy/security evolution under the **Integrate Midnight to Upgrade an Existing App** track.

---

## Future Development

A future production version of Kaira could include:

- real banking integrations;
- automatic transaction synchronization;
- more advanced recurring-payment classification;
- configurable subscription authorization;
- subscription cancellation workflows;
- personalized safety buffers;
- longer-term cash-flow forecasting;
- notifications before recurring charges;
- adaptive spending recommendations;
- automated savings allocation;
- stronger authentication and encrypted financial storage;
- additional privacy-preserving financial proofs;
- trusted financial attestations;
- production security audits.

---

## Intellectual Property & Usage

Copyright © 2026 **Kenia Esmeralda Ramos Javier**.  
All rights reserved.

Kaira and the original source code, documentation, application content, and original visual assets contained in this repository are the intellectual property of their respective author(s), except where third-party components are explicitly identified.

This repository may be made publicly viewable for hackathon evaluation, technical demonstration, and portfolio purposes.

No open-source license is granted for the original Kaira source code unless explicitly stated otherwise.

No permission is granted to reproduce, redistribute, sublicense, commercialize, or create derivative works from the original Kaira source code except where permitted by applicable law, GitHub's Terms of Service, or a separate written agreement from the copyright holder.

Third-party libraries, frameworks, SDKs, assets, and dependencies remain subject to their respective licenses.

Public availability of this repository should not be interpreted as permission to use the Kaira name, branding, original assets, or source code beyond the permissions provided by applicable law and platform terms.

---

## Responsible Security Disclosure

If you discover a security issue in Kaira, please do not publish sensitive exploit details in a public GitHub issue.

Contact:

```text
[esmeentb@gmail.com]
```

Please include:

- a description of the issue;
- steps to reproduce it;
- affected components;
- potential impact.

This prototype should never be tested against real financial accounts, real funds, or third-party infrastructure without authorization.

---

## Status

**Hackathon prototype — active development.**

Core financial logic, recurring-payment analysis, savings management, purchase simulation, Kaira Guard, voice warnings, automation workflows, Supabase-backed data flows, and the Midnight privacy/security upgrade are part of the current or evolving prototype.
