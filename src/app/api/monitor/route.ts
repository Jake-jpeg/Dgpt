// DivorceGPT State Law & Rule Monitor
// POST /api/monitor — checks all registered states against current court rules
// GET /api/monitor — returns last check results (no new check)
// 
// Callable via cron job (monthly recommended)
// Uses AI with web_search tool to check official court websites
// Sends email alert to admin@divorcegpt.com on detected changes
//
// Cost: ~$0.02/month for 2 states, ~$0.50/month for 50 states

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getAllRegistryEntries, type StateRegistryEntry } from '@/lib/monitor-registry';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple auth to prevent unauthorized triggers
const MONITOR_SECRET = process.env.MONITOR_SECRET || process.env.FREE_ACCESS_KEYS?.split(',')[0] || '';

interface MonitorResult {
  stateCode: string;
  stateName: string;
  status: 'NO_CHANGES' | 'CHANGES_DETECTED' | 'REVIEW_RECOMMENDED' | 'ERROR';
  summary: string;
  changes: Array<{
    category: string;
    current: string;
    detected: string;
    sourceUrl: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  checkedAt: string;
}

async function checkState(entry: StateRegistryEntry): Promise<MonitorResult> {
  const checkedAt = new Date().toISOString();
  
  try {
    const prompt = `You are a legal research assistant monitoring state divorce laws and court rules for changes.

TASK: Check whether the current divorce rules for ${entry.stateName} match the following baseline. Search the official court website and statute databases to verify.

STATE: ${entry.stateName} (${entry.stateCode.toUpperCase()})
COURT WEBSITE: ${entry.courtWebsite}
STATUTE REFERENCE: ${entry.statuteReference}
COURT RULES REFERENCE: ${entry.courtRulesReference}
E-FILING PORTAL: ${entry.efilingPortal}

CURRENT BASELINE (what DivorceGPT implements):
- Residency Requirement: ${entry.knownRules.residencyRequirement}
- Grounds for Divorce: ${entry.knownRules.groundsForDivorce}
- Waiting Period: ${entry.knownRules.waitingPeriod}
- Filing Fee: ${entry.knownRules.filingFee}
- Defendant Fee: ${entry.knownRules.defendantFee}
- Service Deadline: ${entry.knownRules.serviceDeadlineDays} days
- Response Deadline: ${entry.knownRules.responseDeadlineDays} days
- E-filing Available: ${entry.knownRules.efilingAvailable}
- E-filing Mandatory: ${entry.knownRules.efilingMandatory}
- Divorce on Papers: ${entry.knownRules.divorceOnPapersAvailable} (${entry.knownRules.divorceOnPapersDirective})
- Pro Se Allowed: ${entry.knownRules.proSeAllowed}
- Notarization: ${entry.knownRules.notarizationRequired}
- Required Forms: ${entry.knownRules.requiredForms.join(', ')}
- Special Rules: ${entry.knownRules.specialRules.join('; ')}

INSTRUCTIONS:
1. Search the official court website for the most current uncontested divorce filing requirements
2. Search for any recent changes to the state's domestic relations statutes
3. Check if filing fees have changed
4. Check if any new forms have been mandated or old forms retired
5. Check if e-filing rules have changed
6. Check if any new directives have been issued affecting uncontested divorce procedure

RESPOND IN EXACTLY THIS JSON FORMAT (no other text):
{
  "status": "NO_CHANGES" | "CHANGES_DETECTED" | "REVIEW_RECOMMENDED",
  "summary": "Brief summary of findings",
  "changes": [
    {
      "category": "filing_fee | residency | grounds | forms | efiling | procedure | statute | directive | other",
      "current": "What DivorceGPT currently has",
      "detected": "What the search found",
      "sourceUrl": "URL of the source",
      "urgency": "LOW | MEDIUM | HIGH | CRITICAL"
    }
  ]
}

If everything matches the baseline, return status "NO_CHANGES" with an empty changes array.
If you find potential changes but aren't certain, return "REVIEW_RECOMMENDED".
If you find confirmed changes, return "CHANGES_DETECTED".

CRITICAL: Only flag actual RULE or STATUTE changes. Ignore cosmetic website changes, wording differences that don't change legal requirements, or differences between how the court describes a form vs our internal label.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
      }],
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text from response (may have multiple content blocks due to web search)
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        stateCode: entry.stateCode,
        stateName: entry.stateName,
        status: 'ERROR',
        summary: 'Failed to parse monitor response',
        changes: [],
        checkedAt,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      stateCode: entry.stateCode,
      stateName: entry.stateName,
      status: parsed.status || 'ERROR',
      summary: parsed.summary || 'No summary provided',
      changes: parsed.changes || [],
      checkedAt,
    };
  } catch (error) {
    console.error(`Monitor error for ${entry.stateCode}:`, error);
    return {
      stateCode: entry.stateCode,
      stateName: entry.stateName,
      status: 'ERROR',
      summary: `Monitor check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      changes: [],
      checkedAt,
    };
  }
}

async function sendAlertEmail(results: MonitorResult[]): Promise<boolean> {
  const alertResults = results.filter(r => 
    r.status === 'CHANGES_DETECTED' || r.status === 'REVIEW_RECOMMENDED' || r.status === 'ERROR'
  );
  
  if (alertResults.length === 0) return false;

  const emailBody = alertResults.map(r => {
    const statusEmoji = r.status === 'CHANGES_DETECTED' ? '🚨' : r.status === 'REVIEW_RECOMMENDED' ? '⚠️' : '❌';
    let section = `${statusEmoji} ${r.stateName} (${r.stateCode.toUpperCase()}) — ${r.status}\n`;
    section += `Summary: ${r.summary}\n`;
    
    if (r.changes.length > 0) {
      section += '\nChanges detected:\n';
      for (const change of r.changes) {
        section += `  • [${change.urgency}] ${change.category}: ${change.detected}\n`;
        section += `    Current: ${change.current}\n`;
        section += `    Source: ${change.sourceUrl}\n`;
      }
    }
    
    return section;
  }).join('\n---\n\n');

  const allClear = results.filter(r => r.status === 'NO_CHANGES');
  
  const fullBody = `DivorceGPT State Law Monitor — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

${alertResults.length} state(s) require attention. ${allClear.length} state(s) confirmed current.

${emailBody}

${'—'.repeat(40)}
States confirmed current (no changes):
${allClear.map(r => `✅ ${r.stateName}`).join('\n') || 'None'}

${'—'.repeat(40)}
This is an automated alert from DivorceGPT's State Law Monitor.
Do NOT reply to this email. Review the flagged changes and update the state configuration as needed.
Monitor registry: src/lib/monitor-registry.ts
`;

  // Use the existing send-session-email infrastructure or Google Workspace SMTP
  try {
    // Try using the existing email API if available
    const emailApiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${emailApiUrl}/api/send-monitor-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'admin@divorcegpt.com',
        subject: `[DivorceGPT Monitor] ${alertResults.length} state(s) flagged — ${alertResults.map(r => r.stateCode.toUpperCase()).join(', ')}`,
        body: fullBody,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to send monitor alert email:', error);
    // Log the alert to console as fallback
    console.log('=== MONITOR ALERT (email failed) ===');
    console.log(fullBody);
    return false;
  }
}

// POST: Run the monitor check for all registered states
export async function POST(req: Request) {
  try {
    // Auth check
    const { secret } = await req.json().catch(() => ({ secret: '' }));
    if (!secret || secret !== MONITOR_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = getAllRegistryEntries();
    
    if (entries.length === 0) {
      return NextResponse.json({ message: 'No states registered', results: [] });
    }

    // Run checks sequentially to avoid rate limits
    const results: MonitorResult[] = [];
    for (const entry of entries) {
      console.log(`[Monitor] Checking ${entry.stateName}...`);
      const result = await checkState(entry);
      results.push(result);
      console.log(`[Monitor] ${entry.stateName}: ${result.status}`);
    }

    // Send email if any issues detected
    const emailSent = await sendAlertEmail(results);

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      statesChecked: results.length,
      results,
      alertsSent: emailSent,
      summary: {
        noChanges: results.filter(r => r.status === 'NO_CHANGES').length,
        changesDetected: results.filter(r => r.status === 'CHANGES_DETECTED').length,
        reviewRecommended: results.filter(r => r.status === 'REVIEW_RECOMMENDED').length,
        errors: results.filter(r => r.status === 'ERROR').length,
      },
    });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ error: 'Monitor check failed' }, { status: 500 });
  }
}

// GET: Return info about the monitor (no check triggered)
export async function GET() {
  const entries = getAllRegistryEntries();
  
  return NextResponse.json({
    registeredStates: entries.map(e => ({
      stateCode: e.stateCode,
      stateName: e.stateName,
      lastChecked: e.lastChecked,
      lastConfirmedCurrent: e.lastConfirmedCurrent,
      courtWebsite: e.courtWebsite,
    })),
    totalStates: entries.length,
    triggerEndpoint: 'POST /api/monitor with { "secret": "YOUR_MONITOR_SECRET" }',
    recommendedFrequency: 'Monthly',
  });
}
