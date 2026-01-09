import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { rowData, templateId } = await request.json();

    if (!rowData) {
      return NextResponse.json(
        { error: 'Row data is required' },
        { status: 400 }
      );
    }

    // Get template
    const db = getDb();
    const template = db
      .prepare('SELECT * FROM prompt_templates WHERE id = ?')
      .get(templateId || 1) as { id: number; template: string } | undefined;

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Replace template variables
    let prompt = template.template;
    
    // Replace {{data}} with formatted row data
    const formattedData = Object.entries(rowData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    prompt = prompt.replace(/\{\{data\}\}/g, formattedData);
    
    // Replace individual field variables like {{fieldName}}
    Object.entries(rowData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, String(value));
    });

    // Check if API key is provided
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // If no API key, return the formatted prompt without AI generation
      return NextResponse.json({
        success: true,
        prompt: prompt,
        generatedText: 'API key not configured. Please set GEMINI_API_KEY environment variable.',
        usedAI: false,
      });
    }

    // Generate with Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Store in database
    const stmt = db.prepare(
      'INSERT INTO generated_prompts (row_data, template_id, prompt) VALUES (?, ?, ?)'
    );
    stmt.run(JSON.stringify(rowData), template.id, generatedText);

    return NextResponse.json({
      success: true,
      prompt: prompt,
      generatedText: generatedText,
      usedAI: true,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
