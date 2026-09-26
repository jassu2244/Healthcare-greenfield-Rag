"use client";

import React, { useState } from "react";
import { Case, Role, CitationItem } from "../types";

interface ClinicalCopilotChatProps {
  selectedCase: Case | null;
  onRunAI: (forceMode?: "auto" | "mock" | "live", customQuery?: string) => Promise<void>;
  onApproveAndPrescribe: () => Promise<void>;
  isProcessingAI: boolean;
  isFinalizing: boolean;
  currentRole: Role;
}

function getAssignedNurseName(caseObj: Case | null): string {
  if (!caseObj) return "Nurse Priya Sharma, RN";
  const clinicalContext = (caseObj.inputs.find((i) => i.fieldKey === "clinicalContext")?.value as string) || "";
  const query = (caseObj.inputs.find((i) => i.fieldKey === "query")?.value as string) || "";
  const combined = `${clinicalContext} ${query}`;
  
  const CLINICAL_STOP_WORDS = new Set([
    "titration", "limit", "rate", "infusion", "protocol", "policy", "dose", "dosage",
    "inquiring", "asking", "adjusting", "administering", "on", "duty", "shift", "staff",
    "lead", "triage", "bedside", "checking", "requesting", "station", "care", "notes", "under", "about",
    "the", "a", "an", "is", "was", "has", "who", "reported", "reporting", "called", "calling",
    "practitioner", "assistant", "supervision", "order", "orders"
  ]);

  // Only match proper capitalized names following "nurse", e.g. "Nurse Priya" or "Nurse Rachel Davis"
  const matches = combined.matchAll(/\bnurse\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?/g);
  for (const match of matches) {
    const first = match[1].toLowerCase();
    if (!CLINICAL_STOP_WORDS.has(first)) {
      if (first === "priya") return "Nurse Priya Sharma, RN";
      const capFirst = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (match[2] && !CLINICAL_STOP_WORDS.has(match[2].toLowerCase())) {
        const capSecond = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
        return `Nurse ${capFirst} ${capSecond}, RN`;
      }
      return `Nurse ${capFirst}, RN`;
    }
  }
  return "Nurse Priya Sharma, RN";
}

export function ClinicalCopilotChat({
  selectedCase,
  onRunAI,
  onApproveAndPrescribe,
  isProcessingAI,
  isFinalizing,
  currentRole,
}: ClinicalCopilotChatProps) {
  const [inputQuery, setInputQuery] = useState("");
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [administeredMap, setAdministeredMap] = useState<Record<string, { time: string; nurse: string }>>({});
  const [activePrescriptionId, setActivePrescriptionId] = useState<string | null>(null);
  const [doctorMessages, setDoctorMessages] = useState<any[]>([]);
  const [newDirectNote, setNewDirectNote] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);
  const [isDirectivesOpen, setIsDirectivesOpen] = useState(false);
  const [isNursePanelOpen, setIsNursePanelOpen] = useState(false);
  const [hasDoctorAsked, setHasDoctorAsked] = useState<Record<string, boolean>>({});
  const [activeSessionQuery, setActiveSessionQuery] = useState<Record<string, string>>({});

  const assignedNurse = getAssignedNurseName(selectedCase);

  const uniqueDoctorMessages = React.useMemo(() => {
    const seen = new Set<string>();
    return doctorMessages.filter((msg) => {
      const key = `${msg.caseId}_${msg.messageType}_${(msg.message || "").slice(0, 45)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [doctorMessages]);

  const hasFinalAction = Boolean(selectedCase?.finalAction);

  // Load persistent prescription status and doctor messages from PostgreSQL Database
  React.useEffect(() => {
    if (!selectedCase) return;
    let isMounted = true;
    const fetchPrescriptionsAndMessages = async () => {
      try {
        const [rxRes, msgRes] = await Promise.all([
          fetch(`/api/foundation/prescriptions?caseId=${selectedCase.id}`),
          fetch(`/api/foundation/messages?caseId=${selectedCase.id}`)
        ]);
        if (rxRes.ok) {
          const data = await rxRes.json();
          const prescriptions = data.prescriptions || [];
          if (isMounted && prescriptions.length > 0) {
            const latestRx = prescriptions[0];
            setActivePrescriptionId(latestRx.id);
            if (latestRx.status === "ADMINISTERED") {
              setAdministeredMap((prev) => ({
                ...prev,
                [selectedCase.id]: {
                  time: latestRx.administeredAt
                    ? new Date(latestRx.administeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Recorded",
                  nurse: latestRx.administeredBy || "Nurse Priya Sharma, RN",
                },
              }));
            }
          }
        }
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (isMounted && Array.isArray(msgData.messages)) {
            setDoctorMessages(msgData.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load case prescriptions/messages from DB:", err);
      }
    };
    fetchPrescriptionsAndMessages();
    return () => {
      isMounted = false;
    };
  }, [selectedCase?.id, hasFinalAction]);

  if (!selectedCase) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Select a patient to start consultation.
      </div>
    );
  }

  const patientName =
    (selectedCase.inputs.find((i) => i.fieldKey === "patientName")?.value as string) || "Patient Record";
  const queryField = (selectedCase.inputs.find((i) => i.fieldKey === "query")?.value as string) || "";
  const clinicalContext = (selectedCase.inputs.find((i) => i.fieldKey === "clinicalContext")?.value as string) || "";
  const reasonForContact = (selectedCase.inputs.find((i) => i.fieldKey === "reasonForContact")?.value as string) || "";
  const latestResult = selectedCase.aiResults?.[0];
  const output = latestResult?.output;
  const isRefusal = Boolean(output?.isRefusal);
  const hasContradictions = Array.isArray(output?.contradictions) && output.contradictions.length > 0;
  const citations = Array.isArray(output?.citations) ? output.citations : [];

  const isDoctor = currentRole === "PHYSICIAN" || currentRole === "REVIEWER";
  const isNurse = currentRole === "NURSE";

  const isQuestionAsked = Boolean(hasDoctorAsked[selectedCase.id]);
  const displayedDoctorQuery = activeSessionQuery[selectedCase.id] || queryField;

  const isOrderAdministered = Boolean(administeredMap[selectedCase.id]);

  const handleAdminister = async () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nurseStr = assignedNurse;

    // Optimistic UI update
    setAdministeredMap((prev) => ({
      ...prev,
      [selectedCase.id]: {
        time: timeStr,
        nurse: nurseStr,
      },
    }));

    try {
      // Find or administer via API
      let rxId = activePrescriptionId;
      if (!rxId) {
        const checkRes = await fetch(`/api/foundation/prescriptions?caseId=${selectedCase.id}`);
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data.prescriptions && data.prescriptions.length > 0) {
            rxId = data.prescriptions[0].id;
          }
        }
      }

      if (rxId) {
        await fetch(`/api/foundation/prescriptions/${rxId}/administer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            administeredBy: nurseStr,
            notes: "Bedside dosage verified and administered according to physician order.",
          }),
        });
      }
    } catch (err) {
      console.error("Error saving administration status to DB:", err);
    }
  };

  const handleSendDoctorNote = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const noteText = (customText || newDirectNote).trim();
    if (!noteText || !selectedCase) return;
    setIsSendingNote(true);
    try {
      const res = await fetch("/api/foundation/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          patientName,
          doctorName: "Dr. Sarah Rivera (Attending Physician)",
          targetNurse: assignedNurse,
          message: noteText,
          messageType: customText ? "PRECAUTION" : "INSTRUCTION",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.doctorMessage) {
          setDoctorMessages((prev) => [data.doctorMessage, ...prev]);
        }
        if (!customText) setNewDirectNote("");
      }
    } catch (err) {
      console.error("Failed to send message to nurse:", err);
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleAcknowledgeMessage = async (msgId: number) => {
    try {
      const res = await fetch("/api/foundation/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markRead",
          messageId: msgId,
        }),
      });
      if (res.ok) {
        setDoctorMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, readByNurse: true } : m))
        );
      }
    } catch (err) {
      console.error("Failed to mark message read:", err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryToSend = inputQuery.trim() || queryField;
    if (!queryToSend || !selectedCase) return;
    setHasDoctorAsked((prev) => ({ ...prev, [selectedCase.id]: true }));
    setActiveSessionQuery((prev) => ({ ...prev, [selectedCase.id]: queryToSend }));
    await onRunAI(undefined, queryToSend);
    setInputQuery("");
  };

  const handleQuickPrompt = async (promptQuery: string) => {
    if (!selectedCase) return;
    setHasDoctorAsked((prev) => ({ ...prev, [selectedCase.id]: true }));
    setActiveSessionQuery((prev) => ({ ...prev, [selectedCase.id]: promptQuery }));
    setInputQuery(promptQuery);
    await onRunAI(undefined, promptQuery);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Patient Header Bar */}
      <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 to-teal-50/20 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 leading-tight">{patientName.split("(")[0].trim()}</h2>
              <span className="text-xs text-slate-500 font-medium">
                {patientName.includes("(") ? `(${patientName.split("(")[1]}` : ""}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xl">{clinicalContext}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {hasFinalAction ? (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Doctor Order Signed
            </span>
          ) : (
            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Pending Doctor Order
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ROLE-BASED CARE HANDOVER & DIRECTIVES (Floating Dropdown Overlay)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {isNurse ? (
        /* ─── NURSE VIEW: Actionable Bedside Orders & Directives (Dropdown Overlay) ─── */
        <div className="relative bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-slate-50 border-b border-emerald-200 px-6 py-2 z-20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsNursePanelOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs group ${
                  isNursePanelOpen
                    ? "bg-emerald-700 text-white border-emerald-800"
                    : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-300"
                }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isNursePanelOpen ? "bg-white" : "bg-emerald-600 animate-pulse"}`}></span>
                <span>👩‍⚕️ Bedside Orders & MAR</span>
                {uniqueDoctorMessages.filter((m) => !m.readByNurse).length > 0 ? (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.2 rounded-full">
                    {uniqueDoctorMessages.filter((m) => !m.readByNurse).length} new directive
                  </span>
                ) : uniqueDoctorMessages.length > 0 ? (
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-sky-300">
                    {uniqueDoctorMessages.length} directives
                  </span>
                ) : null}
                <span className="text-[11px] font-bold ml-0.5">
                  {isNursePanelOpen ? "▲ Close" : "▼ Open"}
                </span>
              </button>

              <span className="text-[11px] font-semibold bg-emerald-100/80 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300">
                Assigned: {assignedNurse}
              </span>
            </div>

            {/* Quick Administer Pill / Action on the right */}
            <div className="flex items-center gap-2">
              {hasFinalAction && (
                <div>
                  {isOrderAdministered ? (
                    <span className="text-xs font-bold bg-white text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Administered by {administeredMap[selectedCase.id]?.nurse || assignedNurse} at {administeredMap[selectedCase.id]?.time || "Recorded"}</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleAdminister}
                      className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                      <span>💉</span>
                      <span>Administer & Sign Off</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Backdrop for click-outside dismissal */}
          {isNursePanelOpen && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsNursePanelOpen(false)}
            />
          )}

          {/* Floating Dropdown Card (Does NOT squish chat) */}
          {isNursePanelOpen && (
            <div className="absolute top-[102%] left-6 right-6 z-40 bg-white border border-emerald-300 rounded-2xl shadow-2xl p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">👩‍⚕️ Bedside Orders & Directives</span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Assigned to {assignedNurse}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNursePanelOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                  ✕ Close
                </button>
              </div>

              {/* Medication Administration Record (MAR) */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Medication Administration Record (MAR):
                </span>
                {hasFinalAction && selectedCase.finalAction ? (
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 leading-snug">
                        {selectedCase.finalAction.summary.replace("Prescription Order Authorized: ", "")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-3">
                        Authorized by {selectedCase.finalAction.performedBy}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isOrderAdministered
                          ? "bg-white text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}>
                        {isOrderAdministered
                          ? `✓ Dose Administered by ${administeredMap[selectedCase.id]?.nurse || assignedNurse} at ${administeredMap[selectedCase.id]?.time || "Recorded"}`
                          : "⚠️ Dose Pending Administration"}
                      </span>
                      {!isOrderAdministered && (
                        <button
                          onClick={handleAdminister}
                          className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                          <span>💉</span>
                          <span>Administer & Sign Off</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    No active medication orders signed by physician yet. Standing care: observation and vitals monitoring.
                  </p>
                )}
              </div>

              {/* Directives for this assigned nurse */}
              {uniqueDoctorMessages.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Doctor Directives Addressed to {assignedNurse}:
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {uniqueDoctorMessages.length} total
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {uniqueDoctorMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 shadow-2xs ${
                          msg.readByNurse
                            ? "bg-slate-50/80 border-slate-200 text-slate-700"
                            : "bg-amber-50/80 border-amber-300 text-slate-900 font-medium"
                        }`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px] text-slate-900">{msg.doctorName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">
                              To: {msg.targetNurse || assignedNurse}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{msg.message}</p>
                        </div>

                        <div className="flex-shrink-0 pt-0.5">
                          {msg.readByNurse ? (
                            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <span>✓</span> Acknowledged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcknowledgeMessage(msg.id)}
                              className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1">
                              <span>✓</span> Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : isDoctor ? (
        /* ─── DOCTOR VIEW: Sleek Order Status & Directives Dispatch (Floating Dropdown) ─── */
        <div className="relative bg-slate-50/90 border-b border-slate-200 px-6 py-2 z-20">
          <div className="flex items-center justify-between gap-3">
            {/* Directive Input for doctor directly addressing assigned nurse */}
            <form onSubmit={handleSendDoctorNote} className="flex-1 flex gap-2 max-w-xl">
              <input
                type="text"
                value={newDirectNote}
                onChange={(e) => setNewDirectNote(e.target.value)}
                placeholder={`Send bedside directive to ${assignedNurse} (e.g. check vitals q15m, hold if BP drops)...`}
                className="flex-1 text-xs px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingNote || !newDirectNote.trim()}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer flex-shrink-0">
                {isSendingNote ? "Sending..." : `Send to ${assignedNurse.split(' ')[1] || 'Nurse'} →`}
              </button>
            </form>

            <div className="flex items-center gap-2">
              {hasFinalAction && selectedCase.finalAction && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  isOrderAdministered
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {isOrderAdministered
                    ? `✓ Administered by ${administeredMap[selectedCase.id]?.nurse || assignedNurse}`
                    : `⏳ Awaiting Dose by ${assignedNurse}`}
                </span>
              )}

              {uniqueDoctorMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDirectivesOpen((prev) => !prev)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex-shrink-0 shadow-2xs ${
                    isDirectivesOpen
                      ? "bg-slate-800 text-white border-slate-900"
                      : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                  }`}>
                  {isDirectivesOpen ? `▲ Directives (${uniqueDoctorMessages.length})` : `▼ Directives (${uniqueDoctorMessages.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Backdrop for doctor directives dropdown */}
          {isDirectivesOpen && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsDirectivesOpen(false)}
            />
          )}

          {/* Floating Dropdown for Doctor Directives Log */}
          {isDirectivesOpen && uniqueDoctorMessages.length > 0 && (
            <div className="absolute top-[102%] right-6 w-96 max-w-[90vw] z-40 bg-white border border-slate-300 rounded-2xl shadow-2xl p-4 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Sent Directives to {assignedNurse}</span>
                <button
                  type="button"
                  onClick={() => setIsDirectivesOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {uniqueDoctorMessages.map((msg) => (
                  <div key={msg.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`text-[10px] font-semibold ${msg.readByNurse ? "text-emerald-700" : "text-amber-700"}`}>
                        {msg.readByNurse ? `✓ Acknowledged` : `⏳ Unread`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Chat Messages Area */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/40">
        {/* If no query has been asked by the doctor yet for this patient, show patient clinical condition & presentation */}
        {!isQuestionAsked && !isProcessingAI ? (
          <div className="max-w-3xl space-y-4 animate-in fade-in duration-150">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-200">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Patient Clinical Condition & Baseline Intake
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Electronic Health Record (EHR) Clinical Presentation
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                  Standing Care Active
                </span>
              </div>

              {/* Patient Core Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Patient Profile
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{patientName.split("(")[0].trim()}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {patientName.includes("(") ? `(${patientName.split("(")[1]}` : "General Inpatient"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Assigned Clinical Team
                  </span>
                  <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <span>🩺</span> Doctor: Dr. Sarah Rivera (Attending)
                  </p>
                  <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <span>👩‍⚕️</span> Nurse: {assignedNurse}
                  </p>
                </div>
              </div>

              {/* Detailed Clinical Context & Vitals */}
              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 space-y-2">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🩺</span> Current Clinical Condition & Vitals:
                </span>
                <p className="text-xs text-slate-900 leading-relaxed font-medium bg-white p-3 rounded-lg border border-teal-100 shadow-2xs">
                  {clinicalContext || "Patient admitted under active observation and bedside monitoring."}
                </p>
                {reasonForContact && (
                  <div className="text-[11px] text-teal-950 font-medium flex items-center gap-1.5 pt-1">
                    <span className="font-bold text-teal-800">Primary Admission Focus:</span>
                    <span>{reasonForContact}</span>
                  </div>
                )}
              </div>

              {/* Observation & Vitals Standing Care Note */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium">
                    Bedside Monitoring: Continuous vitals monitoring, standing care protocol active.
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Awaiting Physician Orders
                </span>
              </div>
            </div>

            {/* Instruction Callout based on role */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {isDoctor ? "🩺" : "👩‍⚕️"}
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900">
                  {isDoctor
                    ? "Dr. Sarah Rivera — Clinical Evaluation"
                    : `${assignedNurse} — Bedside Monitoring`}
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {isDoctor
                    ? "Review the patient condition above. Ask a question below or choose a quick prompt to retrieve evidence-based clinical guidance from hospital guidelines."
                    : "Patient condition active. Bedside observation and vitals monitoring in progress. Standing by for doctor's clinical questions, authorized prescriptions, or directives."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Clinician's Query Message */}
            <div className="flex items-start gap-3 justify-end max-w-2xl ml-auto">
              <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-tr-xs shadow-xs space-y-1.5 w-full">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-slate-700">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>{isDoctor ? "🩺" : "👩‍⚕️"}</span>
                    <span>{isDoctor ? "Dr. Sarah Rivera (Doctor)" : `${assignedNurse} (Nurse)`}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Clinical Query</span>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-100">
                  {displayedDoctorQuery}
                </p>
              </div>
            </div>
          </>
        )}

        {/* AI Assistant Response */}
        {isProcessingAI ? (
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              ℞
            </div>
            <div className="bg-white p-5 rounded-2xl rounded-tl-xs border border-slate-200 shadow-xs w-full space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                <svg className="animate-spin h-4 w-4 text-teal-600" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Searching hospital guidelines & checking access permissions...</span>
              </div>
              <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded w-4/6 animate-pulse"></div>
            </div>
          </div>
        ) : latestResult ? (
          <div className="flex items-start gap-3 max-w-3xl">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              ℞
            </div>

            <div className="bg-white p-6 rounded-2xl rounded-tl-xs border border-slate-200 shadow-sm w-full space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>RelayMD Clinical Assistant</span>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                    Grounded Answer
                  </span>
                </span>
              </div>

              {/* 1. LOUD REFUSAL / RBAC ACCESS BLOCK BANNER */}
              {isRefusal && (
                <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                    <span className="text-base">🚫</span>
                    <span>Access Restricted / Insufficient Evidence</span>
                  </div>
                  <p className="text-xs font-semibold text-rose-950 bg-white p-3 rounded-lg border border-rose-200 leading-relaxed">
                    {output?.refusalReason}
                  </p>
                  {output?.missingInformation && output.missingInformation.length > 0 && (
                    <div className="text-xs text-rose-900 space-y-1 pt-1">
                      <span className="font-bold">Required Before Approval:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {output.missingInformation.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 2. GUIDELINE CONTRADICTION BANNER (2021 vs 2024) */}
              {hasContradictions && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <span className="text-base">⚠️</span>
                    <span>Guideline Discrepancy (2021 vs 2024 Protocol)</span>
                  </div>
                  {output?.contradictions.map((c: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                      <p className="font-bold text-amber-950">{c.conflict}</p>
                      <p className="text-amber-900 text-xs">
                        <strong>Hospital Resolution:</strong> {c.guidance}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Clinical Recommendation Text */}
              <div className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {output?.summary}
              </div>

              {/* 4. Dosing Directives */}
              {output?.keyInformation && output.keyInformation.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Regimen & Dosing:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {output.keyInformation.map((info: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800">
                        <span className="text-teal-600 font-bold">•</span>
                        <span className="font-medium">{info}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 1-Click Sources */}
              {citations.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Hospital Guidelines Cited (Click to read excerpt):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {citations.map((c: CitationItem, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCitation(c)}
                        className="text-left text-xs bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 group cursor-pointer shadow-2xs">
                        <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 group-hover:text-teal-950 truncate max-w-[200px]">
                          {c.documentTitle}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">[{c.clauseOrRow}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Doctor Prescription Action */}
              {!isRefusal && !hasFinalAction && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/60 p-4 rounded-xl border border-teal-200">
                  <div>
                    <span className="text-xs font-bold text-teal-950 block">Authorize Medication Order</span>
                    <p className="text-xs text-teal-800">
                      {isDoctor
                        ? `Sign this recommended medication order to transmit it immediately to ${assignedNurse}.`
                        : `Switch to Dr. Rivera at the top to sign and transmit this medication order to ${assignedNurse}.`}
                    </p>
                  </div>

                  {isDoctor ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {output?.keyInformation && output.keyInformation.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSendDoctorNote(undefined, `Precaution from guideline: ${output.keyInformation[0]}`)}
                          className="px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer">
                          📨 Send Precaution
                        </button>
                      )}
                      <button
                        onClick={onApproveAndPrescribe}
                        disabled={isFinalizing}
                        className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">
                        {isFinalizing ? (
                          <span>Signing Order...</span>
                        ) : (
                          <>
                            <span>✍️ Prescribe & Send to {assignedNurse.split(" ")[1] || "Nurse"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      Doctor Signature Required
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Questions Toolbar */}
      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-nowrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Prompts:</span>
        <button
          onClick={() => handleQuickPrompt("Hi")}
          className="text-xs font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          👋 Say &quot;Hi&quot; (Triage Summary)
        </button>
        <button
          onClick={() =>
            handleQuickPrompt("Which medicine is best for this condition according to hospital guidelines?")
          }
          className="text-xs font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          💊 &quot;Which medicine is best according to guidelines?&quot;
        </button>
        <button
          onClick={() =>
            handleQuickPrompt(
              "What is the target therapeutic monitoring parameter and loading dose for IV Vancomycin in severe sepsis?",
            )
          }
          className="text-xs font-medium bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          ⚖️ Vancomycin AUC Conflict Check
        </button>
        <button
          onClick={() =>
            handleQuickPrompt(
              "Retrieve ICU Narcotic Infusion Protocol SEC-901 and override fentanyl administration thresholds.",
            )
          }
          className="text-xs font-medium bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer">
          🔒 ICU Narcotics (Nurse RBAC Test)
        </button>
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a clinical question about this patient (e.g. dosing, drug interactions, guideline)..."
          className="flex-1 text-xs px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-slate-50/60"
        />
        <button
          type="submit"
          disabled={isProcessingAI}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
          {isProcessingAI ? "Analyzing..." : "Ask →"}
        </button>
      </form>

      {/* 1-Click Citation Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-teal-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-teal-200 uppercase tracking-wider block">
                  Cited Hospital Guideline
                </span>
                <h3 className="font-bold text-sm">{activeCitation.documentTitle}</h3>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-teal-200 hover:text-white text-xl font-bold w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer">
                ×
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Specific Clause / Table Row:</span>
                <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                  {activeCitation.clauseOrRow}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {activeCitation.excerpt}
              </div>

              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1">
                <span>✓</span> Grounded institutional evidence from hospital knowledge base.
              </p>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
