import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'articles-with-embeddings.json');
    await writeFile(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving visualization data:', error);
    return NextResponse.json({ error: 'Failed to save visualization data' }, { status: 500 });
  }
} 