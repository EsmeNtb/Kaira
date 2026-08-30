# Kaira Security Model

Kaira is a hackathon prototype that explores privacy-preserving financial decision-making using Midnight zero-knowledge technology.

This document describes the current security model, implemented privacy boundaries, assumptions, and known limitations.

Kaira has not undergone a professional production security audit.

---

## Security Goals

The Midnight upgrade focuses on reducing unnecessary disclosure of sensitive financial information.

The primary goals are:

- keep sensitive financial values private during Midnight verification;
- prevent the browser from controlling authoritative financial-risk calculations;
- disclose only the information necessary to make a financial decision;
- avoid persisting unnecessary identity-related financial data;
- separate application data from on-chain disclosure;
- preserve proof metadata for verification and audit purposes.

---

# Kaira Private Guard

Kaira Private Guard verifies whether a proposed purchase satisfies Kaira's financial safety condition.

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