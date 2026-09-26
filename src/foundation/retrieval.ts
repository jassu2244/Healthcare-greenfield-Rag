import { CLINICAL_CORPUS } from './corpus';
import { getAllCorpusDocs } from './store';
import { CorpusDocument, RetrievedPassage } from './types';

export interface RetrievalOptions {
  userRole: string; // e.g. 'NURSE' | 'PHYSICIAN' | 'PHARMACIST' | 'REVIEWER' | 'SUBMITTER'
  topK?: number;
  minScoreThreshold?: number;
  corpus?: CorpusDocument[];
}

export interface RetrievalResult {
  query: string;
  userRole: string;
  totalCorpusDocs: number;
  authorizedDocsCount: number;
  blockedDocsCount: number;
  passages: RetrievedPassage[];
  blockedPassages: RetrievedPassage[];
  insufficientEvidence: boolean;
  detectedContradictions: Array<{
    topic: string;
    activeDoc: string;
    supersededDoc: string;
    description: string;
  }>;
}

function normalizeRole(role: string): string {
  const r = (role || '').toUpperCase();
  if (r.includes('PHYSICIAN') || r.includes('DOCTOR') || r.includes('ATTENDING') || r === 'REVIEWER') {
    return 'PHYSICIAN';
  }
  if (r.includes('PHARMACIST')) {
    return 'PHARMACIST';
  }
  if (r.includes('NURSE') || r === 'SUBMITTER') {
    return 'NURSE';
  }
  return r;
}

function checkAccess(doc: CorpusDocument, userRole: string): { granted: boolean; reason?: string } {
  const normalized = normalizeRole(userRole);
  const allowed = doc.minRequiredRole.map((r) => r.toUpperCase());
  
  if (allowed.includes(normalized) || allowed.includes('SUBMITTER') || allowed.includes('REVIEWER')) {
    return { granted: true };
  }
  return {
    granted: false,
    reason: `Document '${doc.title}' requires elevated credentials (${doc.minRequiredRole.join(', ')}). Role '${userRole}' is restricted.`
  };
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'does', 'how', 'are', 'was', 'this', 'that',
  'from', 'have', 'has', 'had', 'been', 'which', 'who', 'whom', 'where', 'when',
  'why', 'give', 'provide', 'can', 'should', 'would', 'could', 'may', 'might',
  'must', 'per', 'any', 'all', 'into', 'onto', 'upon', 'about', 'some'
]);

/**
 * Tokenize text into normalized word stems for reliable in-memory scoring
 */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Enterprise RAG Retrieval Engine — Track 04 P-02
 * Enforces retrieval-level RBAC, hybrid scoring across sections & tables,
 * guideline version conflict detection, and loud insufficiency checking.
 */
export function retrieveClinicalPassages(
  query: string,
  options: RetrievalOptions
): RetrievalResult {
  const topK = options.topK ?? 4;
  const threshold = options.minScoreThreshold ?? 1.5;
  const userRole = options.userRole || 'PHYSICIAN';
  
  const queryTokens = tokenize(query);
  const passages: RetrievedPassage[] = [];
  const blockedPassages: RetrievedPassage[] = [];
  let authorizedCount = 0;
  let blockedCount = 0;

  const activeCorpus = options.corpus || (typeof getAllCorpusDocs === 'function' ? getAllCorpusDocs() : CLINICAL_CORPUS);

  for (const doc of activeCorpus) {
    const access = checkAccess(doc, userRole);
    if (access.granted) {
      authorizedCount++;
    } else {
      blockedCount++;
    }

    for (const sec of doc.sections) {
      // If section has structured table data, score each row individually
      if (sec.tableData && sec.tableData.length > 0) {
        for (let idx = 0; idx < sec.tableData.length; idx++) {
          const row = sec.tableData[idx];
          const rowText = Object.entries(row)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`)
            .join(' | ');
          const rowTokens = tokenize(rowText + ' ' + sec.heading + ' ' + doc.title);
          
          let score = 0;
          for (const qt of queryTokens) {
            if (rowTokens.includes(qt)) {
              score += 1.5;
            }
          }

          // Exact medication entity match boost
          if (row.medication && tokenize(row.medication).some((m) => queryTokens.includes(m))) {
            score += 3.0;
          }

          if (score > 0) {
            const passage: RetrievedPassage = {
              passageId: `${doc.id}_${sec.id}_row${idx + 1}`,
              docId: doc.id,
              docTitle: doc.title,
              sectionHeading: sec.heading,
              clauseOrRow: `Row ${idx + 1} (${row.medication || 'Medication Entry'})`,
              text: rowText,
              score,
              accessGranted: access.granted,
              denialReason: access.reason,
              isSuperseded: doc.isSuperseded
            };

            if (access.granted) {
              passages.push(passage);
            } else {
              blockedPassages.push(passage);
            }
          }
        }
      } else {
        // Standard prose section
        const secTokens = tokenize(sec.text + ' ' + sec.heading + ' ' + doc.title);
        let score = 0;
        for (const qt of queryTokens) {
          if (secTokens.includes(qt)) {
            score += 1.0;
          }
          // Extra weight if title contains keyword
          if (tokenize(doc.title).includes(qt)) {
            score += 0.5;
          }
        }

        if (score > 0) {
          const passage: RetrievedPassage = {
            passageId: `${doc.id}_${sec.id}`,
            docId: doc.id,
            docTitle: doc.title,
            sectionHeading: sec.heading,
            clauseOrRow: doc.isSuperseded ? `${sec.clauseNumber || 'Section'} (SUPERSEDED)` : (sec.clauseNumber || 'Section'),
            text: sec.text,
            score,
            accessGranted: access.granted,
            denialReason: access.reason,
            isSuperseded: doc.isSuperseded
          };

          if (access.granted) {
            passages.push(passage);
          } else {
            blockedPassages.push(passage);
          }
        }
      }
    }
  }

  // Sort by relevance score descending
  passages.sort((a, b) => b.score - a.score);
  blockedPassages.sort((a, b) => b.score - a.score);

  // Diverse top passage selection (Maximal Marginal Relevance / Multi-Doc Coverage)
  // Ensures not all top slots are monopolized by a single document when multiple docs match
  const selectedPassages: RetrievedPassage[] = [];
  const docCounts: Record<string, number> = {};
  const maxPerDoc = 2;

  for (const p of passages) {
    const count = docCounts[p.docId] || 0;
    if (count < maxPerDoc) {
      selectedPassages.push(p);
      docCounts[p.docId] = count + 1;
    }
    if (selectedPassages.length >= topK) break;
  }

  // Backfill if slots remain
  if (selectedPassages.length < topK) {
    for (const p of passages) {
      if (!selectedPassages.some((sp) => sp.passageId === p.passageId)) {
        selectedPassages.push(p);
        if (selectedPassages.length >= topK) break;
      }
    }
  }

  const topPassages = selectedPassages;
  const highestScore = topPassages.length > 0 ? topPassages[0].score : 0;

  // Calculate term overlap of query against the best passage
  const bestPassageTokens = topPassages.length > 0 ? tokenize(topPassages[0].text + ' ' + topPassages[0].sectionHeading + ' ' + topPassages[0].docTitle) : [];
  const matchedQueryTokens = queryTokens.filter(qt => bestPassageTokens.includes(qt));
  const queryCoverage = queryTokens.length > 0 ? matchedQueryTokens.length / queryTokens.length : 0;

  // Evidence is insufficient if score is below threshold OR if less than 40% of the query's keywords matched
  const insufficientEvidence = highestScore < threshold || (queryTokens.length >= 4 && queryCoverage < 0.40);

  // Dynamic metadata-driven contradiction & supersession detection:
  // Inspects all retrieved passages. If any retrieved passage belongs to a document marked
  // as superseded, it automatically links the active superseding policy and surfaces the conflict.
  const detectedContradictions: RetrievalResult['detectedContradictions'] = [];
  const retrievedDocIds = new Set(topPassages.map((p) => p.docId));

  for (const passage of topPassages) {
    const doc = activeCorpus.find((d) => d.id === passage.docId);
    if (doc?.isSuperseded && doc.supersedingDocId) {
      const activeDoc = activeCorpus.find((d) => d.id === doc.supersedingDocId);
      if (activeDoc) {
        const alreadyFlagged = detectedContradictions.some((c) => c.supersededDoc === doc.title);
        if (!alreadyFlagged) {
          detectedContradictions.push({
            topic: `${doc.title} (Superseded by ${activeDoc.title})`,
            activeDoc: activeDoc.title,
            supersededDoc: doc.title,
            description: `Document '${doc.title}' (${doc.version}) is marked as SUPERSEDED and deprecated by current institutional policy '${activeDoc.title}' (${activeDoc.version}). Current active guidance takes precedence.`
          });
        }
      }
    }
  }

  return {
    query,
    userRole,
    totalCorpusDocs: activeCorpus.length,
    authorizedDocsCount: authorizedCount,
    blockedDocsCount: blockedCount,
    passages: topPassages,
    blockedPassages: blockedPassages.slice(0, topK),
    insufficientEvidence,
    detectedContradictions
  };
}
