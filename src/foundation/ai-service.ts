/**
 * AIService (Provider Abstraction) — Antigravity Healthcare Foundation
 * Implements the 11-step safe execution pipeline, prompt-injection defenses,
 * schema validation with repair, deterministic mock execution, and safe fallback.
 */

import { Case, Actor, AIResultEnvelope, AIMeta, SchemaValidationResult } from './types';
import { getTaskDefinition } from './task-registry';
import { minimize } from './data-minimization';
import { recordAuditEvent } from './audit';
import { safeLog } from './safe-logging';

export interface RunAIOptions {
  taskName?: string;
  forceMode?: 'live' | 'mock' | 'auto';
}

export interface AIServiceResponse {
  envelope: AIResultEnvelope;
  minimizedPayload: Record<string, any>;
  boundaryReport: {
    sent: Array<{ fieldKey: string; label: string; sensitivity: string; source: string }>;
    withheld: Array<{ fieldKey: string; label: string; sensitivity: string; source: string }>;
  };
}

/**
 * Executes a raw HTTP call to the configured LLM provider.
 */
async function callLiveProvider(
  systemPrompt: string,
  userPrompt: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per §A5.3

  try {
    if (provider.toLowerCase() === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini provider');
      return text;
    } else {
      // Default / OpenAI-compatible endpoint
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response from AI provider');
      return text;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Safe 11-step execution pipeline per §A5.3
 */
export async function runTask(
  taskName: string,
  targetCase: Case,
  actor: Actor,
  options: RunAIOptions = {}
): Promise<AIServiceResponse> {
  const startTime = Date.now();
  const task = getTaskDefinition(taskName);

  if (!task) {
    throw new Error(`Unknown AI task: "${taskName}". Ensure it is registered in the task registry.`);
  }

  // 1. Load case (received as targetCase)
  const caseId = targetCase.id;

  // 2. Minimize input to the task's allowedInputFields
  const minimization = minimize(targetCase.inputs, task.allowedInputFields, caseId);
  const { minimizedPayload, sentFieldKeys, boundaryReport } = minimization;

  // 3. Record AI_DATA_ACCESSED audit event listing field KEYS (never values)
  recordAuditEvent({
    caseId,
    actor: { id: actor.id, role: actor.role, displayName: actor.displayName },
    action: 'AI_DATA_ACCESSED',
    resource: `case_${caseId}/inputs`,
    dataAccessed: sentFieldKeys,
    details: {
      taskName,
      sentKeysCount: sentFieldKeys.length,
      withheldKeysCount: minimization.withheldFieldKeys.length,
      pseudonymized: minimization.pseudonymized
    }
  });

  // 4. Record AI_REQUESTED
  recordAuditEvent({
    caseId,
    actor: { id: actor.id, role: actor.role, displayName: actor.displayName },
    action: 'AI_REQUESTED',
    resource: `case_${caseId}/tasks/${taskName}`,
    dataAccessed: sentFieldKeys,
    details: {
      taskName,
      promptVersion: task.promptVersion
    }
  });

  // Resolve mode configuration
  const envMode = (process.env.AI_MODE || 'auto').toLowerCase();
  const useMockAiEnv = process.env.USE_MOCK_AI === 'true';
  const effectiveMode = useMockAiEnv ? 'mock' : options.forceMode || envMode;

  const provider = process.env.AI_PROVIDER || 'gemini';
  const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o-mini');
  const apiKey =
    provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  let rawOutputText: string | null = null;
  let executionMode: 'LIVE' | 'MOCK' | 'FALLBACK' = 'MOCK';
  let fallbackReason: string | undefined = undefined;

  // 5. Call provider per mode
  if (effectiveMode === 'mock') {
    executionMode = 'MOCK';
    safeLog('AI_MOCK_EXECUTION', { taskName, caseId });
  } else if (effectiveMode === 'live' || effectiveMode === 'auto') {
    if (!apiKey) {
      if (effectiveMode === 'live') {
        throw new Error(`Live AI requested, but no API key is configured for provider "${provider}"`);
      }
      executionMode = 'FALLBACK';
      fallbackReason = `Missing API key for ${provider}; safely degraded to deterministic mock`;
    } else {
      try {
        const userPrompt = task.buildUserPrompt(minimizedPayload);
        rawOutputText = await callLiveProvider(task.systemPrompt, userPrompt, provider, model, apiKey);
        executionMode = 'LIVE';
      } catch (err: any) {
        if (effectiveMode === 'live') {
          recordAuditEvent({
            caseId,
            actor: { id: 'ai_system', role: 'AI_SYSTEM' },
            action: 'AI_OUTPUT_REJECTED',
            resource: `case_${caseId}/ai_result`,
            status: 'FAILURE',
            details: { taskName, error: err.message }
          });
          throw err;
        }
        executionMode = 'FALLBACK';
        fallbackReason = `Provider call failed (${err.message}); safely degraded to deterministic fallback`;
        safeLog('AI_PROVIDER_FALLBACK', { taskName, caseId, reason: fallbackReason });
      }
    }
  }

  // 6. Parse + validate against outputSchema
  let parsedOutput: any = null;
  let validationResult: SchemaValidationResult<any> = { valid: false, errors: [] };

  if (executionMode === 'LIVE' && rawOutputText) {
    try {
      parsedOutput = JSON.parse(rawOutputText);
      validationResult = task.validateOutput(parsedOutput);

      // 7. On validation failure: ONE repair retry per §A5.3
      if (!validationResult.valid && apiKey) {
        safeLog('AI_SCHEMA_RETRY', { taskName, caseId, errors: validationResult.errors });
        const repairPrompt = `The previous response failed schema validation with errors: ${JSON.stringify(validationResult.errors)}.
Repair the JSON and output ONLY valid JSON matching the exact schema:
<previous_output>
${rawOutputText}
</previous_output>`;
        try {
          const repairedText = await callLiveProvider(task.systemPrompt, repairPrompt, provider, model, apiKey);
          parsedOutput = JSON.parse(repairedText);
          validationResult = task.validateOutput(parsedOutput);
        } catch {
          // Retry failed, fall back
        }
      }
    } catch (parseErr: any) {
      validationResult = { valid: false, errors: [`JSON parse failure: ${parseErr.message}`] };
    }

    if (!validationResult.valid) {
      if (effectiveMode === 'live') {
        throw new Error(`Schema validation failed after repair: ${validationResult.errors?.join(', ')}`);
      }
      executionMode = 'FALLBACK';
      fallbackReason = `Live model output failed schema validation (${validationResult.errors?.join(', ')}); fallback applied`;
    }
  }

  // If in mock or fallback mode, run deterministic mockGenerator
  if (executionMode === 'MOCK' || executionMode === 'FALLBACK') {
    parsedOutput = task.mockGenerator(minimizedPayload);
    validationResult = task.validateOutput(parsedOutput);
  }

  const finalOutput = validationResult.data || parsedOutput;

  // 8. Build evidence via evidenceMapper
  const evidence = task.evidenceMapper(minimizedPayload, finalOutput);

  const latencyMs = Date.now() - startTime;

  // 9. Wrap in AIResultEnvelope with full AIMeta
  const meta: AIMeta = {
    mode: executionMode,
    provider: executionMode === 'LIVE' ? provider : 'deterministic_mock_engine',
    model: executionMode === 'LIVE' ? model : 'deterministic_v1',
    promptVersion: task.promptVersion,
    schemaVersion: task.schemaVersion,
    generatedAt: new Date().toISOString(),
    latencyMs,
    inputFieldsSent: sentFieldKeys,
    fallbackReason
  };

  const envelope: AIResultEnvelope = {
    id: `air_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    taskName,
    output: finalOutput,
    evidence,
    warnings: finalOutput.warnings || [],
    missingInformation: finalOutput.missingInformation || [],
    uncertainty: finalOutput.uncertainty || 'LOW',
    meta
  };

  // 10. Record AI_RESULT_GENERATED (or AI_FALLBACK_USED)
  const auditAction = executionMode === 'FALLBACK' ? 'AI_FALLBACK_USED' : 'AI_RESULT_GENERATED';
  recordAuditEvent({
    caseId,
    actor: { id: 'ai_system', role: 'AI_SYSTEM', displayName: `${meta.provider}/${meta.model}` },
    action: auditAction,
    resource: `case_${caseId}/ai_results/${envelope.id}`,
    dataAccessed: sentFieldKeys,
    ai: {
      mode: meta.mode,
      provider: meta.provider,
      model: meta.model,
      promptVersion: meta.promptVersion
    },
    status: 'SUCCESS',
    details: {
      taskName,
      latencyMs,
      evidenceItemsCount: evidence.length,
      uncertainty: envelope.uncertainty,
      fallbackReason
    }
  });

  return {
    envelope,
    minimizedPayload,
    boundaryReport
  };
}
