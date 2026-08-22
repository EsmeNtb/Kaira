Ignition Hacks
# Kaira

Kaira is a personal finance management prototype that helps users understand how much of their current balance is actually safe to spend.

Traditional banking interfaces show how much money is available in an account, but that number does not account for upcoming subscriptions, recurring expenses, savings commitments, or near-term financial obligations. Kaira combines those factors into a forward-looking view of a user's finances and helps evaluate the impact of new purchases before they are made.

Built for a hackathon, Kaira focuses on proactive financial decision-making rather than historical expense tracking alone.

## Problem

A bank balance does not represent true spending capacity.

Users may have money in their account while part of that balance is effectively committed to:

* recurring payments;
* subscriptions;
* upcoming expenses;
* savings goals;
* financial safety margins.

This creates a gap between **current balance** and **actually disposable money**.

Kaira is designed around closing that gap.

## Solution

Kaira processes financial activity and upcoming commitments to provide a more useful representation of available money.

The application combines recurring-payment detection, expense forecasting, savings reservations, and purchase simulation into a single financial workflow.

The core model can be summarized as:

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

## Core Features

### Safe-to-Spend Calculation

Kaira calculates a more realistic spending limit based on the user's current financial position.

The calculation considers the current account balance together with upcoming financial obligations and protected funds.

This value becomes the foundation for the rest of the application.

### Recurring Payment Detection

Transaction data is analyzed to identify recurring charges and expected future payments.

Detected recurring expenses are used to forecast upcoming commitments rather than treating past transactions as isolated events.

### Subscription Controls

Recurring payments can be reviewed and managed individually.

The objective is to give users more visibility over automatic charges and reduce unexpected subscription renewals.

### Upcoming Expense Forecasting

Kaira projects detected recurring payments into the near future.

This allows the application to reason about money that is currently present in the account but is likely to be required soon.

### Savings Goals

Users can create savings goals and reserve part of their balance for a specific purpose.

Reserved funds are excluded from available spending capacity.

Users can:

* create goals;
* reserve funds;
* move funds between goals;
* release funds back into available spending.

The savings system is integrated into the rest of Kaira's financial calculations rather than operating as an isolated tracker.

### Purchase Simulator

The purchase simulator evaluates the financial impact of a hypothetical purchase before the user makes it.

For each simulation, Kaira compares:

* safe-to-spend before the purchase;
* purchase amount;
* safe-to-spend after the purchase;
* upcoming commitments;
* configured safety buffer.

The result is classified into three risk levels:

```text
Safe
Warning
High Risk
```

This creates a simple decision layer between account data and an actual purchase.

### Kaira Guard

When a simulated purchase introduces financial risk, Kaira Guard can trigger an additional protection workflow.

The feature receives the purchase context and risk assessment and returns a recommendation intended to help the user reconsider or delay spending that could interfere with upcoming obligations.

### Voice Warnings

For high-risk scenarios, Kaira can generate an audible warning through the application's voice endpoint.

This extends the financial warning beyond the dashboard and demonstrates how Kaira could support more proactive interventions in future versions.

## System Architecture

Kaira separates financial data, financial logic, API workflows, and presentation.

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
                         High-risk case
                               |
                +--------------+--------------+
                |                             |
                v                             v
        +---------------+             +---------------+
        |  Kaira Guard  |             | Voice Warning |
        +---------------+             +---------------+
```

## Financial Logic

Kaira is designed around a simple principle:

```text
Available balance != Safe-to-spend balance
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

The exact value changes dynamically as savings are reserved or released and as future commitments change.

The purchase simulator then evaluates:

```text
Projected Safe-to-Spend
=
Safe-to-Spend
- Proposed Purchase
```

That projected value is used to determine the risk associated with the purchase.

## Technology

Kaira is built as a full-stack web application using:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Next.js API routes
* Custom recurring-payment detection logic
* Custom financial forecasting logic
* Custom purchase-risk engine
* AI-assisted recommendation workflows
* Voice warning integration
* Lucide React

The financial engines are kept separate from the interface so that recurring detection, forecasting, savings logic, and purchase simulation can evolve independently.

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
│
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
├── types/
└── utils/
```

## Running the Project

### Requirements

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Prototype Scope

Kaira is currently a hackathon prototype.

The current implementation demonstrates the core product concept and financial decision engine using application data and simulated financial activity.

It does not currently execute real banking transactions or move real funds.

The project is intended to demonstrate how financial data, recurring-payment forecasting, savings protection, and decision-support workflows can work together in a production financial application.

## Key Design Decision

Kaira intentionally separates **balance visibility** from **spending availability**.

Most finance dashboards are retrospective. They show transactions, categories, and account balances after financial decisions have already been made.

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
```

This makes purchase simulation and safe-to-spend calculation part of the core financial model rather than secondary analytics.

## Future Development

A production version of Kaira could extend the current architecture with:

* real banking integrations;
* automatic transaction synchronization;
* more advanced recurring-payment classification;
* configurable subscription authorization;
* subscription cancellation workflows;
* personalized safety buffers;
* longer-term cash-flow forecasting;
* notifications before recurring charges;
* adaptive spending recommendations;
* automated savings allocation;
* user authentication and encrypted financial storage.

## Status

Hackathon prototype.

Core financial logic, recurring-payment analysis, savings management, purchase simulation, Kaira Guard, and warning workflows are implemented as part of the current demo.
