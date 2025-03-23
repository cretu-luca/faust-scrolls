import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    // Get the articles from the request body
    const articles = await req.json();

    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'app/utils/python-script.py');

    // Spawn Python process
    const pythonProcess = spawn('python3', [scriptPath]);

    // Send the articles JSON to the Python script
    pythonProcess.stdin.write(JSON.stringify(articles));
    pythonProcess.stdin.end();

    // Collect the output from the Python script
    let result = '';
    for await (const chunk of pythonProcess.stdout) {
      result += chunk;
    }

    // Collect any errors
    let error = '';
    for await (const chunk of pythonProcess.stderr) {
      error += chunk;
    }

    // Wait for the process to complete
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`Python script failed with error: ${error}`);
    }

    // Parse the result
    const processedArticles = JSON.parse(result);

    // If the Python script returned an error
    if (processedArticles.error) {
      throw new Error(processedArticles.error);
    }

    // Get the current articles with embeddings
    const currentArticlesPath = path.join(process.cwd(), 'public/data/articles-with-embeddings.json');
    const currentArticles = JSON.parse(
      await fs.readFile(currentArticlesPath, 'utf-8')
    );

    // Combine the current articles with the new processed ones
    const updatedArticles = [...currentArticles, ...processedArticles];

    // Save the updated articles back to the file
    await fs.writeFile(
      currentArticlesPath,
      JSON.stringify(updatedArticles, null, 2)
    );

    return NextResponse.json({ success: true, articles: processedArticles });
  } catch (error) {
    console.error('Error processing articles:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 