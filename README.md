# RelayMD — Enterprise Clinical AI Copilot & Grounded RAG Platform

> **Clinical Decision Support, Role-Based Bedside Directives & Tamper-Evident SHA-256 Audit Chaining**  
> *Developed for Healthcare Enterprise Environments | Track 04: ClinicalRelay RAG (P-02)*

---

## 🏥 Executive Overview

**RelayMD** is an enterprise-grade clinical decision support and hospital collaboration platform designed to eliminate hallucinations, enforce role-based document access, and safeguard clinician workflow.

Unlike generic chatbot interfaces, RelayMD treats clinical retrieval as a strictly audited, safety-critical medical process:
- **Retrieval-Stage RBAC:** Clinician roles (Attending Physician vs. Bedside Nurse) gate document access *before* passages enter the context window, defending against prompt injection and privilege escalation.
- **Cross-Version Contradiction Engine:** Automatically surfaces conflicting medical protocols (e.g., 2021 legacy trough dosing vs. 2024 AUC-guided vancomycin guidelines) with explicit supersession notices.
- **Loud Clinical Refusal:** Explicitly halts when evidence is missing or investigational, generating structured checklists of required trial data before an order can be drafted.
- **Closed-Loop Doctor-to-Nurse Handover:** Doctors evaluate RAG recommendations, sign tamper-evident prescription orders, and dispatch real-time bedside directives directly to assigned nurses for Medication Administration Record (MAR) sign-off.
- **Persistent PostgreSQL Architecture:** Patient EHR cases, institutional PDF guidelines, prescriptions, and communication logs are backed by a robust PostgreSQL relational schema.
- **Cryptographic Audit Chain:** Every prompt, retrieval filter, human approval, and bedside administration is bound in an append-only, SHA-256 hash-chained audit ledger.

---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph UI ["Clinician Frontend (Next.js 15 App Router)"]
        DOC["🩺 Attending Physician View<br/>• Clinical RAG Inquiries<br/>• 1-Click Grounded Citations<br/>• Directives Dispatch"]
        NURSE["👩‍⚕️ Bedside Nurse View<br/>• Patient Presentation<br/>• MAR Orders Dropdown<br/>• 1-Click Dose Administration"]
        AUDIT_UI["🛡️ Audit & Safety Ledger<br/>• SHA-256 Hash Verification<br/>• Cryptographic Bundle Export"]
    end

    subgraph API ["Application & Security Middleware"]
        RBAC["🔐 Retrieval-Stage RBAC & Delimiter Defense<br/>• Role Enforcement (PHYSICIAN vs NURSE)<br/>• Prompt Isolation Delimiters"]
        RAG_ENGINE["🧠 Clinical RAG Pipeline<br/>• Multi-Document Fusion (Guidelines + Formulary)<br/>• Cross-Version Contradiction Detection<br/>• Loud Refusal on Missing Evidence"]
        API_ROUTES["⚡ RESTful API Endpoints<br/>• /api/foundation/cases<br/>• /api/foundation/corpus<br/>• /api/foundation/prescriptions<br/>• /api/foundation/messages"]
    end

    subgraph DB ["PostgreSQL Relational Storage (healthcareapp)"]
        T_CASES[("cases<br/>• Patient Intake<br/>• Clinical Context<br/>• AI Synthesis")]
        T_CORPUS[("corpus_documents<br/>• Clinical Guidelines (PDFs)<br/>• Formulary Tables<br/>• ICU SOPs")]
        T_RX[("prescriptions<br/>• Medication & Dosage<br/>• SHA-256 Seals<br/>• Administration Logs")]
        T_MSG[("doctor_messages<br/>• Bedside Directives<br/>• Target Nurse Name<br/>• Acknowledgment Receipts")]
    end

    subgraph AUDIT ["Cryptographic Audit Chain"]
        HASH_CHAIN["🔗 Append-Only SHA-256 Ledger<br/>Hash(N) = SHA256(Event_N + Hash_{N-1})<br/>• QUERY_SUBMITTED<br/>• RETRIEVAL_FILTERED<br/>• AI_RESULT_GENERATED<br/>• HUMAN_APPROVED<br/>• FINAL_ACTION_RECORDED"]
    end

    DOC -->|Clinical Query| API_ROUTES
    NURSE -->|Acknowledge / Administer| API_ROUTES
    API_ROUTES --> RBAC
    RBAC --> RAG_ENGINE
    RAG_ENGINE <--> T_CORPUS
    API_ROUTES <--> T_CASES
    API_ROUTES <--> T_RX
    API_ROUTES <--> T_MSG
    API_ROUTES --> HASH_CHAIN
    HASH_CHAIN --> AUDIT_UI
```

---

---

## 🧠 Theoretical RAG Architecture & Execution Pipeline

The RelayMD Retrieval-Augmented Generation (RAG) pipeline is structured as an 8-stage safety-critical pipeline designed specifically for clinical environments. Unlike generic consumer RAG setups, it implements multi-layered security gates, versioned conflict detection, and tamper-evident audit verification.

### Clinical RAG Pipeline Flow

```mermaid
flowchart TD
    subgraph INGESTION ["1. Corpus Ingestion & Indexing"]
        PDF["📄 Clinical Guidelines (PDFs)<br/>• 2024 Sepsis Protocol<br/>• 2021 Legacy Guidelines"]
        FORM["📊 Formulary Tables<br/>• Antibiotic Dosing<br/>• Renal Adjustments"]
        SOP["🔒 Restricted SOPs<br/>• ICU SEC-901 Narcotic Policy"]
        
        PARSE["⚙️ Chunking & Metadata Tagging<br/>• Document Version<br/>• Clause / Row Identifier<br/>• Role Access Permissions"]
        
        CORPUS_DB[("🐘 PostgreSQL Corpus Store<br/>corpus_documents")]
        
        PDF --> PARSE
        FORM --> PARSE
        SOP --> PARSE
        PARSE --> CORPUS_DB
    end

    subgraph QUERY_STAGE ["2. Query & Security Gating"]
        QUERY["💬 Clinician Query + Context<br/>EHR presentation, vitals, patient inquiry"]
        ROLE{"🔐 Retrieval-Stage RBAC Filter<br/>Check Clinician Role"}
        
        QUERY --> ROLE
        ROLE -->|PHYSICIAN| ALLOW_ALL["✅ Access All Institutional Documents"]
        ROLE -->|NURSE| FILTER_RESTRICTED["🛡️ Access General Care Documents<br/>Withhold Restricted ICU Policies"]
    end

    subgraph RETRIEVAL_STAGE ["3. Retrieval & Ranking"]
        PASSAGES["📚 Permitted Passages Pool"]
        SCORING["🔍 Hybrid Retrieval & Relevance Scoring<br/>• Lexical Keyword Matching<br/>• Passage Filtering & Ranking"]
        TOP_K["📋 Top-K Clinical Passages Selected"]
        
        CORPUS_DB --> PASSAGES
        ALLOW_ALL --> PASSAGES
        FILTER_RESTRICTED --> PASSAGES
        PASSAGES --> SCORING
        SCORING --> TOP_K
    end

    subgraph ANALYSIS_STAGE ["4. Evidence Analysis & Contradiction Detection"]
        CONFLICT{"⚠️ Version Conflict Analysis<br/>Compare Guideline Revisions"}
        GATE{"🩺 Evidence Sufficiency Gate<br/>Sufficient Validated Evidence?"}
        
        TOP_K --> CONFLICT
        CONFLICT -->|Conflicting Revisions Found| FLAG_CONFLICT["Flag Active vs Superseded Conflict<br/>e.g. 2021 Trough vs 2024 AUC Target"]
        CONFLICT -->|No Conflict| GATE
        FLAG_CONFLICT --> GATE
    end

    subgraph DECISION_STAGE ["5. Synthesis or Loud Refusal"]
        GATE -->|No / Missing Evidence| REFUSAL["🚫 Loud Clinical Refusal<br/>• State Inability to Generate<br/>• Enumerate Missing Clinical Data<br/>• Flag High Uncertainty"]
        GATE -->|Yes / Sufficient Evidence| DELIMITER["🛡️ Non-Executable Delimiter Wrapping<br/>Prompt Isolation: <<<DOCUMENT>>>...<<<END>>>"]
        
        DELIMITER --> SYNTHESIS["🤖 Grounded Clinical Synthesis<br/>• Direct Guideline Evidence Only<br/>• Zero Hallucination Policy<br/>• Structured Dosage & Timing"]
        SYNTHESIS --> CITATIONS["📎 1-Click Traceable Citations<br/>Direct mapping to Clause & Table Row"]
    end

    subgraph AUDIT_STAGE ["6. Cryptographic Audit & Handover"]
        AUDIT_LOG["🔗 Append-Only SHA-256 Chaining<br/>Hash(N) = SHA256(Event_N + Hash_{N-1})"]
        REVIEW["👨‍⚕️ Clinician Review & Prescription Sign-Off"]
        MAR["👩‍⚕️ Nurse Handover & Bedside MAR Administration"]
        
        REFUSAL --> AUDIT_LOG
        CITATIONS --> AUDIT_LOG
        AUDIT_LOG --> REVIEW
        REVIEW --> MAR
    end
```

---

### Detailed Stage-by-Stage RAG Methodology

#### Stage 1: Heterogeneous Corpus Ingestion & Access Tagging
- **Multi-Format Ingestion:** Ingests narrative guidelines, tabular antimicrobial formularies, and operational hospital SOPs into structured JSON representations.
- **Granular Access Metadata:** Every document chunk is tagged with its authoritative revision year (`version: '2024'`), document type, and role authorization array (`allowedRoles: ['PHYSICIAN', 'NURSE']` vs `['PHYSICIAN']`).

#### Stage 2: Retrieval-Stage RBAC Gating & Delimiter Defense
- **Pre-Prompt Role Filtering:** Rather than filtering model responses post-hoc, the retrieval engine actively prunes unauthorized documents *before* they can enter the retrieval pool or LLM prompt. If a Bedside Nurse queries restricted narcotic titration policies (such as SEC-901), the document is excluded at the database retrieval level.
- **Prompt Injection Immunity:** Passages inserted into the LLM context are encapsulated within strict non-executable boundary tags (`<<<DOCUMENT>>>...<<<END_DOCUMENT>>>`), preventing indirect prompt injection from malicious or corrupted EHR text.

#### Stage 3: Hybrid Retrieval & Relevance Scoring
- **Passage-Level Precision:** Retrieval matches against discrete clinical clauses and formulary rows rather than large generic pages, ensuring pinpoint citation accuracy.
- **Top-K Window Curation:** Retains only high-scoring passages meeting threshold relevance, minimizing context pollution and focus degradation.

#### Stage 4: Cross-Version Contradiction Detection
- **Multi-Version Cross-Checking:** When multiple institutional guidelines address the same clinical condition (e.g. Surviving Sepsis Campaign 2021 vs. 2024 revisions), the engine evaluates both versions.
- **Supersession Transparency:** Rather than blending contradictory guidance or silently picking one, the system explicitly flags the contradiction, cites both clauses, and highlights the supersession rationale.

#### Stage 5: Evidence Sufficiency Gate & Loud Refusal
- **Missing Information Check:** If a clinician's query concerns off-label indications, missing formulary rows, or unverified neonate therapies without grounded evidence, the model is strictly forbidden from extrapolating or guessing.
- **Structured Refusal Contract:** Triggers a loud refusal with:
  1. High uncertainty rating (`uncertainty: HIGH`).
  2. Clear rationale explaining evidence limitations.
  3. Structured checklist of required clinical trial data before an order can be approved.

#### Stage 6: Grounded Generation & 1-Click Traceable Citations
- **Zero-Speculation Synthesis:** Generates concise, guideline-grounded recommendations where every dosage, route, and interval is tied directly to a source passage.
- **1-Click Inspector:** Clinicians can click any citation badge in the UI to immediately view the exact institutional guideline paragraph or formulary table row in an inspector modal.

#### Stage 7: Tamper-Evident SHA-256 Audit Chaining
- **Cryptographic Event Chain:** Every step in the RAG lifecycle generates an immutable audit record:
  $$\text{Hash}_n = \text{SHA256}(\text{Event}_n + \text{Hash}_{n-1})$$
- **Logged Events:** `QUERY_SUBMITTED` $\rightarrow$ `RETRIEVAL_FILTERED` $\rightarrow$ `AI_RESULT_GENERATED` $\rightarrow$ `HUMAN_APPROVED` $\rightarrow$ `FINAL_ACTION_RECORDED`.
- **Exportable Legal Package:** 1-click export of a cryptographically sealed audit bundle with verified integrity stamps for clinical governance and compliance.

#### Stage 8: Closed-Loop Human Review & Nurse Handover
- **Human-in-the-Loop Governance:** AI outputs are draft-only. Physicians review, edit, and digitally sign prescriptions.
- **Directives & MAR Integration:** Physician orders and precaution directives are dispatched to the assigned bedside nurse's floating Medication Administration Record (MAR) dropdown for bedside verification and sign-off.

---

## 🗄️ PostgreSQL Database Schema

The system persists all clinical state across 4 core relational tables:

```sql
-- 1. Patient Cases Table (EHR records & synthesis)
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(64) PRIMARY KEY,
    status VARCHAR(32) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    inputs JSONB NOT NULL DEFAULT '[]',
    ai_results JSONB NOT NULL DEFAULT '[]',
    human_reviews JSONB NOT NULL DEFAULT '[]',
    final_action JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Institutional Clinical Corpus (Guidelines, SOPs & Formularies)
CREATE TABLE IF NOT EXISTS corpus_documents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    allowed_roles JSONB NOT NULL,
    passages JSONB NOT NULL DEFAULT '[]',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctor Prescriptions & MAR Sign-Offs
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(id),
    patient_name VARCHAR(255) NOT NULL,
    medication TEXT NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    prescribed_by VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_ADMINISTRATION',
    administered_by VARCHAR(255),
    administered_at TIMESTAMP WITH TIME ZONE,
    audit_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Closed-Loop Doctor-to-Nurse Bedside Directives
CREATE TABLE IF NOT EXISTS doctor_messages (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES cases(id),
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    target_nurse VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(32) NOT NULL DEFAULT 'INSTRUCTION',
    prescription_id VARCHAR(64),
    read_by_nurse BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛡️ Clinical Safety & Governance Pillars

| Safety Guardrail | Implementation | Clinical Rationale |
| :--- | :--- | :--- |
| **Retrieval-Stage RBAC** | Document filtering applied before prompt assembly | Prevents nurses or unauthorized roles from accessing restricted ICU narcotics protocols (e.g. SEC-901 policy). |
| **Loud Clinical Refusal** | Structured refusal schema with missing info breakdown | Refuses to guess when clinical trials or formulary rows are unverified, preventing lethal off-label dosage advice. |
| **Contradiction Detection** | Cross-version comparative evaluation | Identifies when legacy 2021 guidance (Trough target) conflicts with 2024 guidance (AUC target) and surfaces supersession alerts. |
| **Tamper-Evident Audit Chain** | Continuous SHA-256 rolling hash chain | Creates legally admissible, cryptographically verifiable records for malpractice defense and hospital compliance. |
| **Delimiter Containment** | Non-executable token framing | Immunizes the clinical RAG prompt against indirect adversarial prompt injection inside clinical notes. |

---

## 🧪 Acceptance Test Suite (26/26 Passing)

The solution is verified by an automated test suite ([`scripts/test-clinical-rag.mjs`](scripts/test-clinical-rag.mjs)) covering all acceptance criteria:

```text
=== RUNNING CLINICALRELAY RAG ACCEPTANCE TESTS (P-02) ===

Test 1: Task Registry Verification
  ✓ PASS: clinical_enterprise_rag task is registered in registry
  ✓ PASS: Prompt version is v2.0.0-rag
  ✓ PASS: Allowed input fields include query

Test 2: Happy Path Retrieval & Grounded 1-Click Citations
  ✓ PASS: Happy path output strictly validates against ClinicalRAGOutput schema
  ✓ PASS: Happy path does not trigger refusal
  ✓ PASS: Happy path produces at least 2 grounded citations
  ✓ PASS: Cites 2024 Sepsis Guideline
  ✓ PASS: Cites Antimicrobial Formulary Table
  ✓ PASS: Happy path yields LOW uncertainty

Test 3: Cross-Version Guideline Contradiction Surfacing
  ✓ PASS: Explicitly flags guideline contradiction
  ✓ PASS: Lists both conflicting guideline sources
  ✓ PASS: Provides supersession resolution guidance
  ✓ PASS: Includes citation to superseded clause for transparency

Test 4: Loud Clinical Refusal on Evidence Gaps
  ✓ PASS: Refusal is triggered loudly
  ✓ PASS: Refusal reason explains lack of validated evidence
  ✓ PASS: Enumerates missing clinical trial & formulary data
  ✓ PASS: Uncertainty is rated HIGH

Test 5: Retrieval-Stage RBAC & Prompt Containment
  ✓ PASS: Retrieval engine blocks restricted document for role NURSE
  ✓ PASS: ICU SEC-901 policy is withheld from passages
  ✓ PASS: Access boundary violation triggers refusal
  ✓ PASS: Warns about credential boundary and prompt injection
  ✓ PASS: Provides access boundary notice

Test 6: Tamper-Evident SHA-256 Audit Chain
  ✓ PASS: Audit chain passes cryptographic SHA-256 hash verification
  ✓ PASS: Exact sequence of 5 events verified
  ✓ PASS: Export bundle includes all 5 events
  ✓ PASS: Export bundle includes verified integrity stamp

=========================================
  Tests Passed: 26 | Tests Failed: 0
=========================================
ALL CLINICALRELAY RAG TESTS PASSED CLEANLY.
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14+ running locally or in the cloud (default port: `5432`)
- **Package Manager**: `npm` or `pnpm`

### 2. Environment Configuration
Create a `.env.local` file in the root directory (refer to [`.env.example`](.env.example)):

```bash
# AI Execution Mode ('auto', 'mock', 'live')
AI_MODE=auto
USE_MOCK_AI=false

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:password@localhost:5432/healthcareapp

# Optional LLM API Keys (for live inference; offline mock mode operates without keys)
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### 3. Installation & Seeding
```bash
# 1. Install dependencies
npm install

# 2. Seed clinical patient cases into PostgreSQL
node scripts/seed-patients-db.mjs

# 3. Ingest sample PDF guidelines into PostgreSQL
node scripts/generate-deliverables.mjs
```

### 4. Running the Test Suite
```bash
# Execute the comprehensive 26-test acceptance verification
npx tsx scripts/test-clinical-rag.mjs
```

### 5. Starting the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📂 Project Structure

```text
├── context/                             # Architecture specifications & clinical directives
├── deliverables/                        # Track 04 compliance artifacts
│   ├── audit-trail-clinical-sepsis-rag.json  # Cryptographic audit export
│   ├── audit-trail-clinical-sepsis-rag.md    # Human-readable audit log
│   └── privacy-threat-sketch.md              # Threat model & data touchpoint analysis
├── public/                              # Static icons & problem statement specifications
├── scripts/
│   ├── generate-deliverables.mjs        # Deliverables generator script
│   ├── seed-patients-db.mjs             # PostgreSQL patient database seeder
│   └── test-clinical-rag.mjs            # 26-step automated acceptance test suite
├── src/
│   ├── app/                             # Next.js 15 App Router routes
│   │   ├── api/foundation/cases/        # Patient case intake & review endpoints
│   │   ├── api/foundation/corpus/       # PDF & guideline ingestion endpoint
│   │   ├── api/foundation/messages/     # Doctor-to-Nurse messaging endpoint
│   │   ├── api/foundation/prescriptions/# Prescription & MAR administration endpoints
│   │   ├── api/foundation/reset/        # Database & session state reset
│   │   └── foundation/page.tsx          # Main RelayMD clinical consultation workspace
│   └── foundation/                      # Core Clinical Engine
│       ├── ai-service.ts                # Grounded prompt construction & LLM integration
│       ├── audit.ts                     # Tamper-evident SHA-256 audit chaining
│       ├── components/                  # UI components
│       │   ├── ClinicalCopilotChat.tsx  # Interactive chat with floating MAR dropdown
│       │   ├── Header.tsx               # One-click Doctor / Nurse role switcher
│       │   ├── IngestDataModal.tsx      # PDF / Guideline parser & DB uploader
│       │   └── AuditTimeline.tsx        # Cryptographic verification viewer
│       ├── corpus.ts                    # Clinical guidelines & formulary records
│       ├── db.ts                        # PostgreSQL connection pool & schema migrations
│       ├── retrieval.ts                 # Lexical/vector retrieval with RBAC enforcement
│       ├── store.ts                     # Dual-layer store (PostgreSQL + memory cache)
│       └── task-registry.ts             # Schema validation, contradiction & refusal rules
└── README.md
```

---

## ⚖️ Compliance & AI Assistant Declaration

- **AI Coding Assistant Declaration:** In accordance with hackathon guidelines, this system was developed utilizing **Google Antigravity** as an AI pair-programming assistant for rapid scaffolding, database synchronization, and UI optimization.
- **Human-in-the-Loop Guarantee:** Under hospital policy and Section B8 of the Hackathon Governance Framework, AI outputs are strictly treated as non-binding drafts; all clinical actions require mandatory physician authorization and nurse sign-off.
