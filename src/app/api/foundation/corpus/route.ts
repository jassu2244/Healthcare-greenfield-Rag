import { NextResponse } from 'next/server';
import { getAllCorpusDocsAsync, addCorpusDocument } from '@/foundation/store';

export async function GET() {
  try {
    const documents = await getAllCorpusDocsAsync();
    return NextResponse.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      docType = 'guideline',
      version = 'v1.0-Ingested',
      accessLevel = 'CLINICAL_STAFF',
      minRequiredRole = ['NURSE', 'PHYSICIAN', 'PHARMACIST', 'SUBMITTER', 'REVIEWER'],
      summary,
      content,
      clauseNumber
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Document "title" is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Document "content" (extracted text) is required' }, { status: 400 });
    }

    const newDoc = await addCorpusDocument({
      title: title.trim(),
      docType,
      version: version.trim(),
      accessLevel,
      minRequiredRole,
      summary: summary?.trim(),
      content: content.trim(),
      clauseNumber: clauseNumber?.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Clinical guideline ingested into hospital database successfully.',
      document: newDoc
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
