import { CorpusDocument } from './types';

/**
 * Greenfield Healthcare Enterprise Corpus — Track 04 P-02
 * A heterogeneous corpus of clinical guidelines, superseded versions,
 * table-heavy formulary restrictions, operational SOPs, and restricted ICU policies.
 * 
 * All content is 100% synthetic and de-identified.
 */

export const CLINICAL_CORPUS: CorpusDocument[] = [
  {
    id: 'doc_guideline_sepsis_2024',
    title: 'Hospital Clinical Guideline: Inpatient Adult Sepsis Management (2024 Revision)',
    docType: 'guideline',
    version: 'v4.1-2024',
    effectiveDate: '2024-03-15',
    isSuperseded: false,
    accessLevel: 'PUBLIC_CLINICAL',
    minRequiredRole: ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
    summary: 'Current standard of care for adult inpatient sepsis, emphasizing 1-hour antibiotic administration, balanced crystalloids, and modern AUC-targeted vancomycin dosing.',
    sections: [
      {
        id: 'sepsis_2024_sec1',
        heading: '1. Resuscitation & Crystalloid Fluid Timing',
        clauseNumber: 'Guideline-2024-1.1',
        text: 'Administer 30 mL/kg of balanced crystalloids (Lactated Ringer’s or Plasma-Lyte) within the first 3 hours of sepsis recognition for patients with sepsis-induced hypoperfusion or lactate >= 4.0 mmol/L. Reassess hemodynamic status using dynamic measures (passive leg raise, stroke volume variation, capillary refill) rather than static central venous pressure (CVP).'
      },
      {
        id: 'sepsis_2024_sec2',
        heading: '2. Empiric Antimicrobial Administration',
        clauseNumber: 'Guideline-2024-2.1',
        text: 'Initiate broad-spectrum IV antimicrobials within 1 hour of sepsis recognition. For community-acquired sepsis of unknown source, first-line therapy is Piperacillin-Tazobactam 4.5g IV every 8 hours as an extended 4-hour infusion, combined with weight-based Vancomycin. Blood cultures must be obtained prior to initiation if this does not cause delay > 45 minutes.'
      },
      {
        id: 'sepsis_2024_sec3',
        heading: '3. Vancomycin Weight-Based Dosing & AUC Monitoring',
        clauseNumber: 'Guideline-2024-3.2',
        text: 'Initial Vancomycin loading dose is 25 to 30 mg/kg IV (maximum 3000 mg) based on actual body weight for critically ill patients. Maintenance dosing must target an AUC/MIC ratio of 400 to 600 mg*h/L using Bayesian pharmacokinetics software. Trough-only monitoring (historical 15-20 mcg/mL target) is officially SUPERSEDED and deprecated due to significant increases in acute kidney injury (AKI) risk.'
      },
      {
        id: 'sepsis_2024_sec4',
        heading: '4. Vasopressor Support',
        clauseNumber: 'Guideline-2024-4.1',
        text: 'Norepinephrine is the first-choice vasopressor to target Mean Arterial Pressure (MAP) >= 65 mmHg. If MAP remains inadequate despite moderate-dose norepinephrine (>= 0.25 mcg/kg/min), add Vasopressin at a fixed dose of 0.03 units/min rather than escalating norepinephrine alone.'
      }
    ]
  },
  {
    id: 'doc_guideline_sepsis_2021',
    title: 'Hospital Clinical Guideline: Inpatient Sepsis Care (2021 Historical Protocol)',
    docType: 'guideline',
    version: 'v3.0-2021',
    effectiveDate: '2021-06-01',
    isSuperseded: true,
    supersedingDocId: 'doc_guideline_sepsis_2024',
    accessLevel: 'PUBLIC_CLINICAL',
    minRequiredRole: ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
    summary: 'Deprecated 2021 sepsis protocol. Retained in repository for clinical audit and historical comparison. Features obsolete trough-only vancomycin dosing and CVP fluid targets.',
    sections: [
      {
        id: 'sepsis_2021_sec1',
        heading: '1. Resuscitation & CVP Targets (SUPERSEDED)',
        clauseNumber: 'Guideline-2021-1.3',
        text: 'Resuscitation fluids should target Central Venous Pressure (CVP) of 8 to 12 mmHg (12-15 mmHg if mechanically ventilated) using 0.9% Normal Saline boluses.'
      },
      {
        id: 'sepsis_2021_sec2',
        heading: '2. Vancomycin Trough Monitoring (SUPERSEDED)',
        clauseNumber: 'Guideline-2021-2.4',
        text: 'Vancomycin should be initiated at 15 to 20 mg/kg IV every 8 to 12 hours. Clinicians should maintain serum trough concentrations between 15 and 20 mcg/mL for all severe sepsis and bacteremia cases.'
      }
    ]
  },
  {
    id: 'doc_formulary_table_2024',
    title: 'Hospital Antimicrobial Formulary & Medication Tier Restrictions (2024 Q3)',
    docType: 'formulary_table',
    version: '2024.3',
    effectiveDate: '2024-07-01',
    isSuperseded: false,
    accessLevel: 'CLINICAL_STAFF',
    minRequiredRole: ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
    summary: 'Official multi-column antimicrobial formulary table detailing tier status, required Infectious Disease approvals, standard dosing, and mandatory renal adjustments.',
    sections: [
      {
        id: 'formulary_table_sec1',
        heading: 'Table 1: Parenteral Antibiotic Formulary & Stewardship Restrictions',
        clauseNumber: 'Formulary-Table-1',
        text: 'Summary of Tier 1 (Unrestricted), Tier 2 (Hospital restricted), and Tier 3 (Infectious Disease approval required within 24 hours).',
        tableData: [
          {
            medication: 'Piperacillin-Tazobactam (Zosyn)',
            form: 'IV Infusion',
            tier: 'Tier 1 (Unrestricted)',
            idApprovalRequired: 'NO',
            standardAdultDose: '4.5g IV q8h (extended 4h infusion)',
            renalAdjustmentCrCl30: '2.25g IV q8h (4h infusion)',
            stewardshipNotice: 'Automatic 72-hour de-escalation review required'
          },
          {
            medication: 'Vancomycin',
            form: 'IV Infusion',
            tier: 'Tier 1 (Unrestricted)',
            idApprovalRequired: 'NO (First 48h)',
            standardAdultDose: '25-30 mg/kg load, maintenance AUC-guided',
            renalAdjustmentCrCl30: 'Extend dosing interval; pharmacy consult mandatory',
            stewardshipNotice: 'Mandatory pharmacy pharmacokinetic consultation on admission'
          },
          {
            medication: 'Meropenem',
            form: 'IV Infusion',
            tier: 'Tier 3 (Restricted)',
            idApprovalRequired: 'YES (ID Approval within 24h)',
            standardAdultDose: '1.0g IV q8h (3h extended infusion)',
            renalAdjustmentCrCl30: '500mg IV q12h',
            stewardshipNotice: 'Strictly restricted to documented ESBL or severe penicillin anaphylaxis'
          },
          {
            medication: 'Cefepime',
            form: 'IV Infusion',
            tier: 'Tier 2 (Monitored)',
            idApprovalRequired: 'NO',
            standardAdultDose: '2.0g IV q8h',
            renalAdjustmentCrCl30: '1.0g IV q12h (Neurotoxicity risk if unadjusted)',
            stewardshipNotice: 'Avoid in non-pseudomonal infections'
          },
          {
            medication: 'Linezolid',
            form: 'IV / Oral',
            tier: 'Tier 3 (Restricted)',
            idApprovalRequired: 'YES (ID Approval mandatory)',
            standardAdultDose: '600mg IV/PO q12h',
            renalAdjustmentCrCl30: 'No dose adjustment; monitor platelet count weekly',
            stewardshipNotice: 'Restricted for VRE or documented vancomycin treatment failure'
          }
        ]
      }
    ]
  },
  {
    id: 'doc_sop_ed_triage',
    title: 'ED Clinical SOP: Sepsis Alert Activation & Nursing Pathway SOP-ED-402',
    docType: 'sop',
    version: 'Rev 2.4',
    effectiveDate: '2024-01-10',
    isSuperseded: false,
    accessLevel: 'CLINICAL_STAFF',
    minRequiredRole: ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
    summary: 'Operational nursing and triage SOP detailing criteria for triggering Code Sepsis alerts and immediate bedside clinical actions.',
    sections: [
      {
        id: 'sop_ed_sec1',
        heading: '1. Sepsis Alert Activation Criteria',
        clauseNumber: 'SOP-ED-402.1',
        text: 'Nursing staff must trigger a CODE SEPSIS alert when a patient presents with a known or suspected infection PLUS at least two of the following: (a) Temp > 38.3°C or < 36.0°C; (b) Heart Rate > 90 bpm; (c) Respiratory Rate > 20 bpm; (d) Systolic Blood Pressure < 90 mmHg or MAP < 65 mmHg; or (e) Point-of-care venous Lactate > 2.0 mmol/L.'
      },
      {
        id: 'sop_ed_sec2',
        heading: '2. Immediate Nursing Bedside Checklist (Within 15 Minutes)',
        clauseNumber: 'SOP-ED-402.2',
        text: 'Upon Code Sepsis activation: (1) Establish two large-bore IV lines (18-gauge preferred); (2) Draw two sets of peripheral blood cultures from distinct anatomical sites; (3) Send stat lactate, CBC, and comprehensive metabolic panel; (4) Initiate balanced crystalloid bolus at 30 mL/kg; (5) Notify attending physician immediately for antibiotic order verification.'
      }
    ]
  },
  {
    id: 'doc_restricted_icu_narcotics',
    title: 'ICU Monitored High-Risk Narcotic Infusion & Sedation Protocol SEC-901',
    docType: 'restricted_policy',
    version: 'v5.0-RESTRICTED',
    effectiveDate: '2024-05-01',
    isSuperseded: false,
    accessLevel: 'RESTRICTED_ATTENDING',
    minRequiredRole: ['PHYSICIAN', 'PHARMACIST', 'ATTENDING', 'CLINICAL_LEAD'],
    summary: 'Restricted clinical policy governing continuous infusion titration of remifentanil, dexmedetomidine, and monitored fentanyl in mechanically ventilated ICU patients.',
    sections: [
      {
        id: 'narcotics_sec1',
        heading: '1. Prescriber Authorization & Credential Boundaries',
        clauseNumber: 'SEC-901.1',
        text: 'RESTRICTED ACCESS: Only board-certified Critical Care Physicians (Attending Intensivists) or Clinical Pharmacists in consultation with Critical Care may initiate or modify high-dose continuous narcotic infusions. General nursing staff may NOT independently titrate infusion rates without a signed physician protocol order.'
      },
      {
        id: 'narcotics_sec2',
        heading: '2. Dexmedetomidine & Remifentanil Titration Limits',
        clauseNumber: 'SEC-901.2',
        text: 'Dexmedetomidine infusion must initiate at 0.2 mcg/kg/hr and may not exceed 1.4 mcg/kg/hr. Remifentanil infusions must strictly maintain continuous invasive arterial line monitoring and bedside naloxone emergency reversal kits.'
      }
    ]
  }
];
