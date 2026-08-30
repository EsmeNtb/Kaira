# Kaira Security Model

Kaira is a hackathon prototype that explores privacy-preserving financial decision-making using Midnight zero-knowledge technology.

This document describes the current security model, implemented privacy boundaries, assumptions, validation performed during development, and known limitations.

Kaira has not undergone a professional production security audit.

---

## Security Goals

The Midnight upgrade focuses on reducing unnecessary disclosure of sensitive financial information.

The primary goals are:

- keep sensitive financial values private during Midnight verification;
- prevent the browser from controlling authoritative purchase-risk calculations;
- disclose only the information required for a financial decision;
- avoid persisting unnecessary identity-related financial data;
- separate application data from on-chain disclosure;
- preserve Midnight proof metadata for verification and debugging;
- prevent wallet credentials and private keys from being exposed to the browser.

---

# Kaira Private Guard

Kaira Private Guard verifies whether a proposed purchase satisfies Kaira's financial safety policy.

The application evaluates financial information including:

- current balance;
- upcoming commitments;
- reserved savings;
- safety buffer;
- proposed purchase amount.

The Compact circuit checks whether:

```text
currentBalance
>=
upcomingCommitments
+ reservedSavings
+ safetyBuffer
+ purchaseAmount
```

These values are private inputs to the Compact circuit.

The circuit discloses only the resulting boolean verification state.

Conceptually:

```text
Private financial values
        |
        v
Compact verifyPurchase
        |
        v
true / false
```

The exact values used by the circuit are not published as Midnight public state.

---

## Important Application Privacy Boundary

Midnight privacy and application storage are different security boundaries.

The Kaira server must still process financial information in order to calculate the financial assessment and request the Midnight verification.

Therefore:

```text
Private on Midnight
does not mean
never processed by Kaira
```

The Midnight guarantee demonstrated by this prototype concerns what the Compact contract publicly discloses.

Application-level storage is handled separately by Kaira and Supabase.

---

# Server-Authoritative Purchase Assessment

The browser does not determine whether a purchase is Safe, Warning, or High Risk.

The browser submits only information about the proposed purchase to:

```text
POST /api/guard
```

The Kaira server loads the authoritative financial state and calculates:

- current account balance;
- recurring payments;
- upcoming commitments;
- reserved savings;
- safety buffer;
- Safe-to-Spend;
- purchase risk.

The server then requests Midnight verification.

This prevents the browser from submitting arbitrary values such as:

```text
riskLevel = "safe"
safeToSpend = 999999
upcomingExpenses = 0
```

and having those values accepted as authoritative financial state.

---

# Guard Event Persistence

Kaira distinguishes between a simulation and a protected Guard event.

Safe and Warning simulations do not create high-risk Guard records.

A High Risk simulation may create a Guard event containing application-level information such as:

- purchase name;
- purchase amount;
- risk level;
- projected Safe-to-Spend after the purchase;
- upcoming expenses;
- recommendation;
- Midnight verification result;
- Midnight transaction ID;
- Midnight block height.

This information is stored in Supabase for the Kaira Guard workflow.

It is not the same as information disclosed by the Compact contract.

For example:

```text
Kaira / Supabase
may store purchase amount for a High Risk event

Midnight public state
does not disclose the private purchase circuit inputs
```

---

# Private Financial Identity

Kaira also implements a prototype Private Financial Identity feature.

The goal is to prove that a private financial profile satisfies a policy without permanently storing the underlying financial values in the identity profile.

The prototype supports:

```text
Own income
Financially dependent adult
Minor with guardian
```

---

## Own-Income Verification

The own-income circuit evaluates private predicates including:

```text
age >= 18
monthlyIncome >= minimumRequiredIncome
incomeSourceVerified
taxCompliant
```

The circuit discloses only the resulting eligibility boolean.

---

## Financially Dependent Adult

The dependent identity circuit evaluates:

```text
age >= 18
supporterMonthlyIncome >= minimumRequiredIncome
supporterVerified
relationshipVerified
supporterTaxCompliant
```

Only the resulting verification state is disclosed.

---

## Minor With Guardian

The minor identity circuit evaluates:

```text
age < 18
guardianMonthlyIncome >= minimumRequiredIncome
guardianVerified
relationshipVerified
guardianTaxCompliant
```

Only the resulting verification state is disclosed.

---

# Trusted Demo Attestations

Some identity predicates are supplied by the Kaira server rather than controlled directly by browser checkboxes.

Examples include:

- income source verification;
- compliance status;
- supporter verification;
- guardian verification;
- relationship verification.

This prevents a browser user from simply selecting:

```text
Income verified = true
Compliance valid = true
Guardian verified = true
```

and having those statements automatically treated as trusted credentials.

However, these values are currently **demo attestations**.

They are not cryptographically signed credentials issued by:

- banks;
- employers;
- tax authorities;
- government institutions;
- identity providers.

This distinction is important.

The current Midnight proof demonstrates that:

```text
the supplied private values
satisfy the configured circuit policy
```

It does not independently prove that every private value originated from a real-world trusted institution.

A production version would require signed credentials or another cryptographically verifiable issuer mechanism.

---

# Identity Data Persistence

After a Private Financial Identity verification, Kaira persists proof metadata such as:

```text
profile_type
midnight_verified
midnight_transaction_id
midnight_block_height
verified_at
```

The financial identity profile intentionally does not persist values such as:

```text
exact age
exact income
supporter income
guardian income
financial documents
tax details
compliance details
```

The design principle is:

> Kaira stores the proof result, not the financial secret.

---

# Midnight Bridge

Kaira communicates with Midnight through a local server-side bridge.

The bridge exposes endpoints such as:

```text
GET  /health
POST /verify
POST /verify-identity
```

The application flow is:

```text
Kaira UI
   |
   v
Next.js API
   |
   v
Midnight Bridge
   |
   v
Compact Contract
   |
   v
Zero-Knowledge Proof
```

The browser does not directly manage the Midnight wallet.

---

# Wallet and Secret Handling

The Midnight wallet is handled by the server-side Midnight project.

Wallet seeds, private keys, banking credentials, and other real financial secrets must never be committed to the repository.

Environment-specific configuration should remain outside version control when it contains sensitive information.

The hackathon deployment uses a local Midnight development environment.

The network label:

```text
undeployed
```

is used by the local Midnight development configuration and does not mean that the Compact contract was never deployed.

---

# Midnight Transaction Metadata

Successful Midnight calls may return metadata including:

```text
transaction ID
block height
verification result
```

Kaira uses this metadata to demonstrate that a real Midnight transaction occurred.

The exact transaction ID and block height change between local development runs.

---

# Explicit Disclosure Boundary

Compact circuit parameters are private unless explicitly disclosed.

Kaira's circuits use:

```text
disclose(...)
```

for the final boolean verification result.

For example:

```text
lastVerification = disclose(eligible);
```

and:

```text
lastIdentityVerification = disclose(eligible);
```

This means the circuit intentionally reveals the result required by Kaira while keeping the underlying circuit inputs private.

---

# Validation Performed

The implementation was manually and programmatically validated during the hackathon.

Validation included:

- TypeScript compilation;
- Next.js generated route type validation;
- Compact contract compilation;
- Midnight contract deployment;
- Midnight wallet synchronization;
- zero-knowledge proof generation;
- transaction submission;
- public contract state reads;
- contract state transitions;
- Safe purchase verification;
- High Risk purchase verification;
- Supabase Guard event persistence;
- positive Private Financial Identity verification;
- negative Private Financial Identity verification;
- financially dependent adult verification;
- minor with guardian verification;
- financial identity proof persistence.

---

## Transactional Midnight E2E Test

The project includes a transactional Midnight end-to-end check.

It validates:

```text
contract connection
public state read
ZK proof generation
transaction submission
state transition
```

A successful execution confirms that the prototype can generate a real proof, submit a Midnight transaction, and observe the resulting contract state transition in the local development environment.

---

# Threats Reduced by the Current Design

The current architecture reduces several prototype-level risks.

## Client-Side Financial Manipulation

The browser cannot directly decide the authoritative purchase risk because Kaira recalculates the financial state on the server.

## Excessive On-Chain Financial Disclosure

Raw financial circuit inputs are not explicitly disclosed by the Compact contract.

## Unnecessary Identity Data Persistence

Exact age and income values are not stored in the Private Financial Identity profile after verification.

## User-Controlled Credential Flags

Credential predicates used by the identity demo are supplied by the server rather than editable browser checkboxes.

## Browser Wallet Exposure

The browser does not receive the Midnight wallet seed or private wallet keys.

---

# Known Limitations

Kaira is not production financial software.

Known limitations include:

- no professional security audit;
- no penetration testing by an independent security team;
- no real banking integration;
- no real government integration;
- no institution-issued financial credentials;
- no production-grade identity verification;
- no production-grade key-management infrastructure;
- no complete production authentication and authorization model;
- no guarantee that user-entered financial claims originate from a financial institution;
- demo attestations are not equivalent to cryptographically signed credentials;
- the local bridge is designed for development rather than internet-facing production deployment;
- the prototype currently uses a local Midnight development network;
- the system has not been evaluated for financial regulatory compliance.

A valid Midnight proof demonstrates that the configured computation was satisfied for the supplied private inputs.

It does not independently prove the real-world truth or institutional origin of every private input.

---

# Security Assumptions

The prototype assumes that:

- the Kaira server has not been compromised;
- the Midnight bridge is running in a trusted local environment;
- wallet files and environment configuration remain private;
- Supabase credentials are handled securely;
- server-side demo attestations have not been maliciously modified;
- the local Midnight node, indexer, and proof server are operating correctly.

These assumptions would need stronger controls in a production deployment.

---

# Production Security Requirements

Before Kaira could safely process real financial information, additional work would be required.

This could include:

- professional security audits;
- penetration testing;
- secure authentication;
- role-based authorization;
- encrypted sensitive storage;
- production secret management;
- hardware-backed or managed key infrastructure;
- trusted banking integrations;
- signed financial credentials;
- cryptographic issuer verification;
- secure credential revocation;
- rate limiting;
- abuse prevention;
- request validation and monitoring;
- logging and incident-response procedures;
- infrastructure hardening;
- backup and disaster recovery procedures;
- privacy review;
- legal and regulatory compliance review.

---

# Banking and Government Integrations

A future production version of Kaira could integrate with regulated banks, financial institutions, and appropriate government or compliance services.

These integrations would be intended to provide legitimate and trusted sources for financial claims and credentials.

The long-term privacy goal would remain:

```text
verify what Kaira needs to know
without collecting more information than necessary
```

Midnight or similar privacy-preserving technologies could then be used to prove policies over institution-backed credentials without exposing every underlying detail.

---

# Responsible Security Disclosure

If you discover a security issue in Kaira, please avoid publishing sensitive exploit details in a public GitHub issue.

Contact:

```text
esmeentb@gmail.com
```

Please include:

- a description of the issue;
- steps to reproduce it;
- affected components;
- potential impact.

Do not test Kaira against real financial accounts, real funds, government systems, banking infrastructure, or other third-party systems without explicit authorization.

---

# Security Status

Kaira is currently:

```text
Hackathon prototype
Local Midnight development environment
Not professionally audited
Not connected to real financial institutions
Not intended for production financial use
```

The current implementation demonstrates how privacy-preserving verification can be incorporated into an existing financial application while minimizing unnecessary disclosure of sensitive data.
