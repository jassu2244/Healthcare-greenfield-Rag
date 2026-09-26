This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Hackathon Demo — Track 04: ClinicalRelay RAG (Problem P-02)

**ClinicalRelay RAG** is an enterprise clinical retrieval-augmented generation and audit system built from zero for healthcare organizations.

### Key Capabilities
- **Heterogeneous Corpus:** Clinical guidelines (2024 active vs 2021 legacy), multi-column formulary tables, operational ED SOPs, and restricted ICU policies.
- **Retrieval-Stage RBAC:** Documents are filtered at the retrieval engine stage before reaching model prompts (e.g. bedside nurses cannot retrieve restricted ICU narcotic titration policies).
- **1-Click Grounded Citations:** Every synthesized clinical claim links directly to the specific guideline paragraph or formulary table row.
- **Explicit Contradiction Detection:** Cross-checks multiple guideline revisions (e.g., 2021 vancomycin trough vs 2024 AUC target) and surfaces conflicts explicitly rather than silently guessing.
- **Loud Clinical Refusal:** Fails loudly when evidence is missing or out-of-scope, providing an explicit missing information list.
- **Human-in-the-Loop Review:** Clinician review interface with tracked diffs and mandatory rejection reason capture.
- **Cryptographic Audit Trail:** Append-only SHA-256 continuous hash chain tracking every query, retrieval event, and clinical approval with 1-click verification.

### Running the App
```bash
# Run acceptance tests (Smoke suite + Clinical RAG suite)
npm test

# Start the interactive application
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Fully functional offline in deterministic mock mode.

### Deliverables
- Threat Model & Data Touchpoints: [`deliverables/privacy-threat-sketch.md`](deliverables/privacy-threat-sketch.md)
- Exported Cryptographic Audit Trail: [`deliverables/audit-trail-clinical-sepsis-rag.json`](deliverables/audit-trail-clinical-sepsis-rag.json)
- Human-Readable Audit Table: [`deliverables/audit-trail-clinical-sepsis-rag.md`](deliverables/audit-trail-clinical-sepsis-rag.md)

### AI Coding Assistant Declaration
In accordance with hackathon rules, this project was developed using **Google Antigravity** as an AI pair-programming assistant for rapid scaffolding, test generation, and architectural implementation.



