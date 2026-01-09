import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const templates = db.prepare('SELECT * FROM prompt_templates ORDER BY updated_at DESC').all();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, template } = await request.json();

    if (!name || !template) {
      return NextResponse.json(
        { error: 'Name and template are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO prompt_templates (name, template) VALUES (?, ?)'
    );
    const result = stmt.run(name, template);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, template } = await request.json();

    if (!id || !name || !template) {
      return NextResponse.json(
        { error: 'ID, name, and template are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const stmt = db.prepare(
      'UPDATE prompt_templates SET name = ?, template = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(name, template, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
