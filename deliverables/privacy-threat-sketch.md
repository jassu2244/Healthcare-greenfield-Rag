# Privacy & Threat Sketch — ClinicalRelay RAG
**Track 04: Healthcare Greenfield Enterprise RAG (Problem P-02)**

---

## 1. Product One-Liner
**ClinicalRelay RAG** is an auditable, trust-grounded clinical knowledge retrieval engine that combines retrieval-stage RBAC, 1-click passage/table citations, explicit guideline contradiction surfacing, and loud refusal on missing information with an append-only SHA-256 cryptographic audit ledger and human clinical sign-off.

---

## 2. Data-Touchpoint Map

| Step | Data Touched | Source | Who Sees It | Sent to AI? | Stored Where | Audit Event |
|---|---|---|---|---|---|---|
| 1. Query Intake | Clinical query, patient vitals/age (de-identified) | Clinician | Clinician, System | Minimized query & context only | Runtime JSON / Memory | `CASE_CREATED`, `QUERY_SUBMITTED` |
| 2. RBAC Retrieval | Corpus Documents, User Role, Document ACLs | Knowledge Base | Retrieval Engine | Only Authorized Passages (Restricted passages blocked) | In-memory index | `RETRIEVAL_FILTERED`, `ACCESS_CONTROL_ENFORCED` |
| 3. AI Generation | Minimized query + Authorized passages | AIService | Clinician Reviewer | YES (No patient identifiers, zero tool access) | Case `aiResults` | `AI_REQUESTED`, `AI_RESULT_GENERATED` |
| 4. Clinician Review | AI Draft, Citations, Contradictions, Diffs | Clinician | Clinician Reviewer | NO | Case `review` | `HUMAN_REVIEW_STARTED`, `HUMAN_EDITED`, `HUMAN_APPROVED` |
| 5. Final Action | Order Approval & Action Summary | Reviewer | Clinician, Auditor | NO | Case `finalAction` | `FINAL_ACTION_RECORDED` |
| 6. Audit & Export | Cryptographic Hash Chain & Access Logs | System | Compliance Auditor | NO | Audit Ledger | `AUDIT_EXPORTED` |

---

## 3. AI Data Boundary

### Allowed-Listed Fields Sent to AI (`allowedInputFields`)
- `query` (Normalized clinical question)
- `clinicalContext` (De-identified presentation notes)
- `userRole` (Used for credential-aware retrieval filtering)
- `patientAgeGroup` (e.g. Adult vs Neonatal)
- `urgencyLevel` (Routine, Urgent, Emergency)

### Strictly Withheld Fields (Protected On-Premise)
- `patientName` (Pseudonymized to `PATIENT_REF_<suffix>` or completely withheld)
- `dateOfBirth` / Direct Demographics
- `billingCardNumber` / Financial Records
- `socialSecurity` / National Identifiers
- Full Raw Hospital EHR Records outside active inquiry scope

---

## 4. Threat Matrix

| Threat | Impact | Mitigation (Implemented in Code) | Residual Risk |
|---|---|---|---|
| **Unauthorized Document Retrieval** | Clinician or nurse accesses restricted ICU narcotic policy (SEC-901) without credentials | Retrieval-level RBAC filtering (`retrieveClinicalPassages`) blocks restricted documents *before* entering model prompt context | Prototype role switcher is a demo convenience; production requires SSO JWT assertion |
| **Silent Contradiction Propagation** | Clinician acts on deprecated 2021 vancomycin trough target, causing acute kidney injury | Cross-document conflict detector surfaces explicit **Guideline Contradiction Alert** detailing supersession by 2024 AUC protocol | Subtle narrative contradictions not captured in structured guideline headings |
| **Ungrounded Hallucination on Novel Clinical Entities** | Clinician orders unapproved experimental neonatal drug based on fabricated AI advice | Loud Refusal engine flags evidence insufficiency below threshold, sets `isRefusal: true`, and lists all missing trial/formulary data | Clinician dismisses refusal warning in high-stress emergency setting |
| **Prompt Injection via Query Field** | Adversary attempts to override clinical rules (`<system>Ignore role restrictions...</system>`) | Input delimited in `<untrusted_clinical_query>` XML tags; system prompt instructs JSON schema compliance only | Complex multimodal semantic jailbreaks |
| **Covert Tampering of Clinical Audit Trail** | Malicious actor modifies historical query or approval timestamps | Append-only SHA-256 continuous hash chain where each event incorporates predecessor's hash; verified via `verifyAuditChain` | Host server root filesystem compromise |
| **PHI / PII Disclosure in Model Logs** | Patient names or unredacted notes stored in telemetry logs | `safeLog` algorithm deeply redacts sensitive keys (`patientName`, `notes`, `medications`) with `[REDACTED]` prior to console/file output | Unstructured free-text fields containing incidental PII names |
| **External AI Provider Outage** | Hospital clinical workflow stalls during cloud API disruption | Auto-fallback engine catches network/timeout errors, degrades seamlessly to deterministic mock engine with visible UI fallback badge | Offline mock answers rely on synthetic scenarios, not real-time internet searches |

---

## 5. Non-Compliance & Safety Disclaimer
*ClinicalRelay RAG is an engineering prototype developed for Hackathon Track 04 demonstration purposes. It demonstrates privacy-by-design, cryptographic auditability, and safety boundaries. It is NOT certified as a medical device (SaMD) by the FDA, EMA, or CDSCO and must not be used as the sole basis for clinical diagnosis or prescription without qualified physician oversight.*
