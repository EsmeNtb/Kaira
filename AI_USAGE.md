# AI Usage Disclosure

Artificial intelligence tools were used as development assistants during the Midnight Hackathon.

## Tool Used

- ChatGPT / OpenAI

## How AI Was Used

ChatGPT was primarily used as a technical advisor and development guide throughout the hackathon.

AI assistance included:

- architecture exploration;
- explaining unfamiliar tools and workflows;
- Docker and local development guidance;
- Midnight and zero-knowledge integration guidance;
- code drafting and code review;
- debugging support;
- security reasoning;
- documentation drafting and editing;
- development planning;
- visual ideation.

This was especially useful when working with technologies that were new to the project author, including Docker-based development environments and parts of the Midnight development stack.

## Decision Making

AI suggestions were treated as recommendations rather than autonomous decisions.

The project author decided:

- which architecture to use;
- which proposed fixes to implement;
- how Kaira's financial logic should behave;
- how the purchase-risk flow should work;
- which data should be persisted;
- which data should remain private;
- how Midnight should be integrated into the existing application;
- how the user experience should evolve;
- which security tradeoffs were acceptable for the hackathon prototype.

Several implementation ideas were changed or rejected after testing when they did not fit Kaira's intended behavior or when they didn't meet my expectations.

For example, the Guard workflow was adjusted so that only high-risk events are persisted as protected Guard events, rather than storing every purchase simulation.

## Human Review and Validation

All product decisions, implementation choices, integration work, testing, and final project decisions were reviewed and directed by the project author.


Validation included:

- TypeScript compilation;
- manual application testing;
- purchase simulation testing;
- Safe and High Risk Guard scenarios;
- Supabase persistence checks;
- Midnight transaction verification;
- positive and negative Private Financial Identity tests;
- transactional zero-knowledge end-to-end testing.

AI-generated suggestions were not considered complete until they were successfully integrated and validated in the running application.

## What Was Not Delegated

AI did not autonomously operate the repository, select the final product direction, make the final security decisions, or submit the project.

The project author remained responsible for:

- product direction;
- architecture decisions;
- code integration;
- testing;
- debugging decisions;
- security boundaries;
- final documentation;
- final hackathon submission.

## AI-Generated Visual Assets

The current Kaira koi mascot was generated using ChatGPT / OpenAI image generation based on creative direction provided by the project author.

The koi replaced an earlier squirrel mascot concept as part of a branding decision to give Kaira a more distinctive visual identity and avoid unnecessary similarity with another existing application using a squirrel mascot.

## Transparency

This disclosure is provided to clearly document how AI-assisted tools contributed to the development process.

AI was used as a collaborative development tool, while implementation decisions, testing, integration work, and final responsibility remained with the project author.