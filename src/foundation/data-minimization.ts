/**
 * Data Minimization & AI Data Boundary — Antigravity Healthcare Foundation
 * Implements strict data minimization to ensure AI receives only allow-listed fields.
 */

import { InputRecord } from './types';

export interface MinimizationResult {
  minimizedPayload: Record<string, any>;
  sentFieldKeys: string[];
  withheldFieldKeys: string[];
  pseudonymized: boolean;
  boundaryReport: {
    sent: Array<{ fieldKey: string; label: string; sensitivity: string; source: string }>;
    withheld: Array<{ fieldKey: string; label: string; sensitivity: string; source: string }>;
  };
}

/**
 * Filters case inputs against the task's allowed input fields and pseudonymizes identifiable names.
 */
export function minimize(
  inputs: InputRecord[],
  allowedFields: string[],
  caseId: string
): MinimizationResult {
  const allowedSet = new Set(allowedFields);
  const minimizedPayload: Record<string, any> = {};
  const sentFieldKeys: string[] = [];
  const withheldFieldKeys: string[] = [];

  const boundaryReport: MinimizationResult['boundaryReport'] = {
    sent: [],
    withheld: []
  };

  let pseudonymized = false;
  const pseudonym = `PATIENT_REF_${caseId.slice(-6)}`;

  for (const input of inputs) {
    const isAllowed = allowedSet.has(input.fieldKey);

    if (isAllowed) {
      sentFieldKeys.push(input.fieldKey);
      boundaryReport.sent.push({
        fieldKey: input.fieldKey,
        label: input.label,
        sensitivity: input.sensitivity,
        source: input.source
      });

      // Apply pseudonymization if this field is patient name or direct identifier
      if (['name', 'patientName', 'fullName'].includes(input.fieldKey)) {
        minimizedPayload[input.fieldKey] = pseudonym;
        pseudonymized = true;
      } else {
        minimizedPayload[input.fieldKey] = input.value;
      }
    } else {
      withheldFieldKeys.push(input.fieldKey);
      boundaryReport.withheld.push({
        fieldKey: input.fieldKey,
        label: input.label,
        sensitivity: input.sensitivity,
        source: input.source
      });
    }
  }

  return {
    minimizedPayload,
    sentFieldKeys,
    withheldFieldKeys,
    pseudonymized,
    boundaryReport
  };
}
