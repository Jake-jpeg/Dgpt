import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const {
      plaintiffName,
      defendantName,
      county,
      indexNumber,
      plaintiffAddress,
      defendantAddress,
      marriageDate,
      marriageCity,
      marriageState,
      breakdownDate,
      religiousCeremony,
    } = data;

    // Validate required fields
    if (!plaintiffName || !defendantName || !county) {
      return NextResponse.json(
        { error: 'Missing required fields: plaintiffName, defendantName, county' },
        { status: 400 }
      );
    }

    // Create temp file for output
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `ud10_${Date.now()}.pdf`);
    
    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'src', 'app', 'api', 'forms', 'ud10', 'generate_ud10.py');

    // Build Python code to run
    const pythonCode = `
import sys
sys.path.insert(0, '${path.dirname(scriptPath)}')
from generate_ud10 import generate_ud10

data = {
    "plaintiffName": """${plaintiffName.replace(/"/g, '\\"')}""",
    "defendantName": """${defendantName.replace(/"/g, '\\"')}""",
    "county": """${county.replace(/"/g, '\\"')}""",
    "indexNumber": """${(indexNumber || '').replace(/"/g, '\\"')}""",
    "plaintiffAddress": """${(plaintiffAddress || '').replace(/"/g, '\\"')}""",
    "defendantAddress": """${(defendantAddress || '').replace(/"/g, '\\"')}""",
    "marriageDate": """${(marriageDate || '').replace(/"/g, '\\"')}""",
    "marriageCity": """${(marriageCity || '').replace(/"/g, '\\"')}""",
    "marriageState": """${(marriageState || '').replace(/"/g, '\\"')}""",
    "breakdownDate": """${(breakdownDate || '').replace(/"/g, '\\"')}""",
    "religiousCeremony": ${religiousCeremony ? 'True' : 'False'},
}

generate_ud10(data, """${outputPath}""")
`;

    // Run Python
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('python3', ['-c', pythonCode]);
      
      proc.stderr.on('data', (data) => console.error('Python stderr:', data.toString()));
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });
      proc.on('error', reject);
    });

    // Read the generated PDF
    const pdfBuffer = fs.readFileSync(outputPath);
    
    // Clean up temp file
    fs.unlinkSync(outputPath);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="UD-10_Findings_of_Fact.pdf"`,
      },
    });
  } catch (error) {
    console.error('UD-10 generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate UD-10' },
      { status: 500 }
    );
  }
}
