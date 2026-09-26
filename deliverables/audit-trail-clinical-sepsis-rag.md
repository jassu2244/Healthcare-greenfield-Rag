# Verified Audit Trail — ClinicalRelay RAG Journey (Track 04 P-02)

- **Case Reference:** case_rag_001_happy
- **Exported At:** 2026-09-26T05:07:10.698Z
- **Chain Integrity:** VALID (100% Cryptographically Verified)
- **Total Chained Events:** 10

| Seq | Timestamp | Action | Actor | Resource | Data Accessed | Prev Hash | Event Hash |
|---|---|---|---|---|---|---|---|
| 1 | 2026-09-26T05:07:10.684Z | `CASE_CREATED` | Dr. Robert Chen (PHYSICIAN) | `case_rag_001_happy` | patientName, query, clinicalContext | `GENESIS_00...` | `7be6343c0f...` |
| 2 | 2026-09-26T05:07:10.686Z | `QUERY_SUBMITTED` | Dr. Robert Chen (PHYSICIAN) | `query_sepsis_firstline` | query | `7be6343c0f...` | `2174a760f9...` |
| 3 | 2026-09-26T05:07:10.686Z | `ACCESS_CONTROL_ENFORCED` | Enterprise RBAC Guard (SYSTEM) | `corpus_access_boundary` | userRole | `2174a760f9...` | `4d2d1a281b...` |
| 4 | 2026-09-26T05:07:10.687Z | `RETRIEVAL_FILTERED` | ClinicalRelay Retriever (SYSTEM) | `corpus_hybrid_index` | doc_guideline_sepsis_2024, doc_formulary_table_2024, doc_sop_ed_triage | `4d2d1a281b...` | `a5bdd7d3b3...` |
| 5 | 2026-09-26T05:07:10.689Z | `AI_DATA_ACCESSED` | Data Minimizer (SYSTEM) | `ai_prompt_builder` | query, clinicalContext, userRole | `a5bdd7d3b3...` | `9637ada4be...` |
| 6 | 2026-09-26T05:07:10.689Z | `AI_RESULT_GENERATED` | ClinicalRelay Engine (AI_SYSTEM) | `ai_result_envelope_001` | citations, summary, keyInformation | `9637ada4be...` | `e9c02c2456...` |
| 7 | 2026-09-26T05:07:10.691Z | `HUMAN_REVIEW_STARTED` | Dr. Sarah Vance (Attending Reviewer) (REVIEWER) | `review_panel_001` | summary, citations, suggestedNextStep | `e9c02c2456...` | `d8e0d21cfb...` |
| 8 | 2026-09-26T05:07:10.692Z | `HUMAN_EDITED` | Dr. Sarah Vance (Attending Reviewer) (REVIEWER) | `review_edits_001` | suggestedNextStep | `d8e0d21cfb...` | `86429b34f0...` |
| 9 | 2026-09-26T05:07:10.693Z | `HUMAN_APPROVED` | Dr. Sarah Vance (Attending Reviewer) (REVIEWER) | `review_decision_001` | None | `86429b34f0...` | `c555ffb063...` |
| 10 | 2026-09-26T05:07:10.695Z | `FINAL_ACTION_RECORDED` | Dr. Sarah Vance (Attending Reviewer) (REVIEWER) | `order_bundle_sepsis_001` | None | `c555ffb063...` | `3b29d2956a...` |
