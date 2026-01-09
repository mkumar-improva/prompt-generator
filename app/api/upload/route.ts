import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse Excel file with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    const jsonData: Record<string, string | number>[] = [];
    
    // Get headers from first row
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value?.toString() || '');
    });
    
    // Convert rows to JSON
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const rowData: Record<string, string | number> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value?.toString() || '';
          }
        });
        jsonData.push(rowData);
      }
    });

    // Store in database
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO excel_data (filename, data) VALUES (?, ?)'
    );
    const result = stmt.run(file.name, JSON.stringify(jsonData));

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      rowCount: jsonData.length,
      data: jsonData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = getDb();
    const latest = db
      .prepare('SELECT * FROM excel_data ORDER BY uploaded_at DESC LIMIT 1')
      .get() as { id: number; filename: string; data: string; uploaded_at: string } | undefined;

    if (!latest) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      id: latest.id,
      filename: latest.filename,
      data: JSON.parse(latest.data),
      uploaded_at: latest.uploaded_at,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
