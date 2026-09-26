import { NextResponse } from 'next/server';
import {
  getDoctorMessagesForCase,
  getUnreadDoctorMessages,
  sendDoctorMessage,
  markDoctorMessageRead,
  isDBReady
} from '@/foundation/store';

/**
 * GET /api/foundation/messages
 * Query params:
 *   caseId  — fetch messages for a specific case
 *   unread  — if "true", fetch only unread messages across all cases
 */
export async function GET(request: Request) {
  try {
    if (!isDBReady()) {
      return NextResponse.json({
        success: false,
        error: 'PostgreSQL database is not connected. Doctor messages require a live database.',
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const unread = searchParams.get('unread');

    let messages;
    if (unread === 'true') {
      messages = await getUnreadDoctorMessages();
    } else if (caseId) {
      messages = await getDoctorMessagesForCase(caseId);
    } else {
      messages = await getUnreadDoctorMessages();
    }

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/foundation/messages
 * Body: { caseId, patientName?, doctorName, message, messageType?, prescriptionId? }
 *   OR: { action: 'markRead', messageId: number }
 */
export async function POST(request: Request) {
  try {
    if (!isDBReady()) {
      return NextResponse.json({
        success: false,
        error: 'PostgreSQL database is not connected.',
      }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));

    // Mark a message as read
    if (body.action === 'markRead' && body.messageId) {
      await markDoctorMessageRead(body.messageId);
      return NextResponse.json({
        success: true,
        message: `Message ${body.messageId} marked as read by nurse.`,
      });
    }

    // Send a new doctor message
    const { caseId, patientName, doctorName, targetNurse, message, messageType, prescriptionId } = body;

    if (!caseId || !doctorName || !message) {
      return NextResponse.json(
        { error: '"caseId", "doctorName", and "message" are required.' },
        { status: 400 }
      );
    }

    const doctorMsg = await sendDoctorMessage({
      caseId,
      patientName,
      doctorName,
      targetNurse,
      message,
      messageType,
      prescriptionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor message stored in PostgreSQL. Nurse will be notified.',
      doctorMessage: doctorMsg,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
