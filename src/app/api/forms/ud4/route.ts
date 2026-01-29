// UD-4 (Sworn Statement of Removal of Barriers to Remarriage) Generator API
// Only generated for religious ceremonies where Defendant has waiver

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

interface UD4Data {
  plaintiffName: string;
  defendantName: string;
  county: string;
  stateSigned?: string;
  countySigned?: string;
}

export async function POST(req: Request) {
  let tempJsonPath = '';
  let tempPdfPath = '';
  
  try {
    const data: UD4Data = await req.json();
    
    // Validate required fields
    const required = ['plaintiffName', 'defendantName', 'county'];
    for (const field of required) {
      if (!data[field as keyof UD4Data]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create temp files
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    tempJsonPath = path.join(tempDir, `ud4_data_${timestamp}.json`);
    tempPdfPath = path.join(tempDir, `ud4_output_${timestamp}.pdf`);
    
    // Write data to temp JSON file
    await writeFile(tempJsonPath, JSON.stringify(data));
    
    // Get the Python script path
    const scriptPath = path.join(process.cwd(), 'src', 'app', 'api', 'forms', 'ud4', 'generate_ud4.py');
    
    // Run Python script
    const result = await new Promise<Buffer>((resolve, reject) => {
      const pythonCode = `
import sys
import json
sys.path.insert(0, '${path.dirname(scriptPath)}')
from generate_ud4 import generate_ud4

with open('${tempJsonPath}', 'r') as f:
    data = json.load(f)

generate_ud4(data, '${tempPdfPath}')
print('SUCCESS')
`;
      
      const python = spawn('python3', ['-c', pythonCode]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', async (code) => {
        if (code !== 0 || !stdout.includes('SUCCESS')) {
          reject(new Error(`Python script failed: ${stderr || stdout}`));
          return;
        }
        
        try {
          const pdfBuffer = await readFile(tempPdfPath);
          resolve(pdfBuffer);
        } catch (err) {
          reject(new Error(`Failed to read PDF: ${err}`));
        }
      });
    });
    
    // Cleanup temp files
    try {
      await unlink(tempJsonPath);
      await unlink(tempPdfPath);
    } catch {
      // Ignore cleanup errors
    }
    
    // Return PDF
    return new NextResponse(new Uint8Array(result), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="UD-4_Barriers_to_Remarriage.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('UD-4 generation error:', error);
    
    // Cleanup on error
    try {
      if (tempJsonPath) await unlink(tempJsonPath);
      if (tempPdfPath) await unlink(tempPdfPath);
    } catch {
      // Ignore cleanup errors
    }
    
    return NextResponse.json(
      { error: 'Failed to generate UD-4 PDF' },
      { status: 500 }
    );
  }
}
