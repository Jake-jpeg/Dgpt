// DivorceGPT Unified Form Filler API — Multi-State Dynamic Route
// Route: /api/forms/chat/[state]
// Each state's AI instructions live in /lib/states/{code}.ts

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getStateConfig } from '@/lib/states';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state } = await params;
    
    // Load state-specific configuration
    const stateConfig = getStateConfig(state);
    if (!stateConfig) {
      return NextResponse.json(
        { reply: `State "${state}" is not yet supported. Check back soon.`, extractedData: null },
        { status: 404 }
      );
    }

    // Extract field keys from FieldDef arrays
    const p1Keys = stateConfig.phase1Fields.map(f => f.key);
    const p2Keys = stateConfig.phase2Fields.map(f => f.key);
    const p3Keys = stateConfig.phase3Fields.map(f => f.key);

    const { messages, currentPhase, phase1Data, phase2Data, phase3Data } = await req.json();

    // Build context based on current phase
    let contextMessage = '\n\n[SYSTEM STATUS: ';
    contextMessage += `Current Phase: ${currentPhase || 1}. `;
    contextMessage += `State: ${stateConfig.name}. `;
    
    if (phase1Data && Object.keys(phase1Data).length > 0) {
      contextMessage += `Phase 1 Data: ${JSON.stringify(phase1Data)}. `;
    }
    
    if (currentPhase === 1) {
      const collected = p1Keys.filter(f => phase1Data?.[f]);
      const missing = p1Keys.filter(f => !phase1Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 1 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 1 COMPLETE - output {"phase1Complete": true}. ';
      }
    }
    
    if (currentPhase === 2) {
      contextMessage += `Phase 2 Data: ${JSON.stringify(phase2Data || {})}. `;
      const isReligious = phase1Data?.ceremonyType === 'religious';
      
      const collected = p2Keys.filter(f => phase2Data?.[f]);
      const missing = p2Keys.filter(f => !phase2Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 2 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 2 COMPLETE - output {"phase2Complete": true}. ';
      }
      
      if (isReligious) {
        contextMessage += 'RELIGIOUS CEREMONY - UD-7 contains DRL §253 waiver. Defendant must sign UD-7. Do not ask about separate waiver. ';
      }
    }
    
    if (currentPhase === 3) {
      contextMessage += `Phase 3 Data: ${JSON.stringify(phase3Data || {})}. `;
      const missing = p3Keys.filter(f => !phase3Data?.[f]);
      
      if (missing.length > 0) {
        contextMessage += `Phase 3 missing: ${missing.join(', ')}. `;
      } else {
        contextMessage += 'Phase 3 COMPLETE - output {"phase3Complete": true}. ';
      }
    }
    
    contextMessage += ']';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: stateConfig.systemPrompt + contextMessage,
      messages: messages,
    });

    const textContent = response.content[0];
    const reply = textContent.type === 'text' ? textContent.text : '';

    // Parse JSON blocks
    const jsonMatches = [...reply.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
    let extractedData: Record<string, string | boolean> = {};
    let phase1Complete = false;
    let phase2Complete = false;
    let phase3Complete = false;
    let isDisqualified = false;
    let disqualifyReason = '';
    let isTerminated = false;
    let terminateReason = '';
    let validationWarning = '';

    // Helper: Parse date string to Date object
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
      const match = dateStr.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
      if (match) {
        const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        const monthIndex = monthNames.indexOf(match[1].toLowerCase());
        if (monthIndex !== -1) {
          return new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
        }
      }
      return null;
    };

    // Helper: Check if date is at least N months ago
    const isAtLeastMonthsAgo = (date: Date, months: number): boolean => {
      const now = new Date();
      const threshold = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
      return date <= threshold;
    };

    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        
        if (parsed.phase1Complete) phase1Complete = true;
        if (parsed.phase2Complete) phase2Complete = true;
        if (parsed.phase3Complete) phase3Complete = true;
        
        if (parsed.disqualified) {
          isDisqualified = true;
          disqualifyReason = parsed.reason || '';
        }
        
        if (parsed.terminate) {
          isTerminated = true;
          terminateReason = parsed.reason || 'policy_violation';
        }
        
        if (parsed.field && parsed.value !== undefined) {
          const field = parsed.field;
          const value = parsed.value;

          // ═══════════════════════════════════════════════════════════════
          // SERVER-SIDE NAME VALIDATION
          // ═══════════════════════════════════════════════════════════════
          if (['plaintiffName', 'defendantName'].includes(field)) {
            if (value.trim().length < 3) {
              validationWarning = `Please provide a full legal name (first and last name).`;
              continue;
            }
            if (!/\s/.test(value.trim())) {
              validationWarning = `Please provide both first and last name.`;
              continue;
            }
            if (/\d/.test(value)) {
              validationWarning = `Name should not contain numbers. Please re-enter your legal name.`;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // SERVER-SIDE ADDRESS VALIDATION
          // ═══════════════════════════════════════════════════════════════
          if (['qualifyingAddress', 'plaintiffAddress', 'defendantAddress', 'defendantCurrentAddress'].includes(field)) {
            const hasZip = /\d{5}(-\d{4})?/.test(value);
            if (!hasZip) {
              validationWarning = `Address must include a ZIP code. Please re-enter the complete address.`;
              continue;
            }
            
            const statePattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/i;
            if (!statePattern.test(value)) {
              validationWarning = `Address must include a state (e.g., "${stateConfig.code.toUpperCase()}"). Please re-enter the complete address.`;
              continue;
            }
            
            if (value.trim().length < 15) {
              validationWarning = `Address appears incomplete. Please provide a full street address including city, state, and ZIP code.`;
              continue;
            }
            
            const hasStreetNumber = /^\d+\s/.test(value.trim()) || /\s\d+[,\s]/.test(value);
            if (!hasStreetNumber) {
              validationWarning = `Address should include a street number. Please verify and re-enter.`;
            }
            
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // SERVER-SIDE DATE VALIDATION
          // ═══════════════════════════════════════════════════════════════
          
          if (field === 'marriageDate') {
            const marriageDate = parseDate(value);
            if (!marriageDate) {
              validationWarning = `Could not parse marriage date. Please use format like "June 15, 2015".`;
              continue;
            }
            const today = new Date();
            if (marriageDate > today) {
              validationWarning = `Marriage date cannot be in the future. Please verify and re-enter.`;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          if (field === 'summonsDate') {
            const summonsDate = parseDate(value);
            if (!summonsDate) {
              validationWarning = `Could not parse filing date. Please use format like "January 10, 2027".`;
              continue;
            }
            const today = new Date();
            if (summonsDate > today) {
              validationWarning = `The filing date cannot be in the future. Please verify.`;
              continue;
            }
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && summonsDate < marriageDate) {
                validationWarning = `Filing date (${value}) cannot be before marriage date (${phase2Data.marriageDate}). Please verify your dates.`;
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          if (field === 'breakdownDate') {
            const breakdownDate = parseDate(value);
            const requiredMonths = stateConfig.breakdownMonths || 6;
            
            if (!breakdownDate) {
              const approxMatch = value.toLowerCase().match(/(\d+)\s*(year|month|week)/);
              if (approxMatch) {
                const amount = parseInt(approxMatch[1]);
                const unit = approxMatch[2];
                let monthsAgo = 0;
                if (unit === 'year') monthsAgo = amount * 12;
                else if (unit === 'month') monthsAgo = amount;
                else if (unit === 'week') monthsAgo = Math.floor(amount / 4);
                
                if (monthsAgo >= requiredMonths) {
                  extractedData[field] = value;
                  continue;
                } else {
                  validationWarning = `The relationship must have been irretrievably broken for at least ${requiredMonths} months. "${value}" appears to be less than ${requiredMonths} months. Please verify.`;
                  continue;
                }
              }
              if (value.length > 3) {
                extractedData[field] = value;
                continue;
              }
              validationWarning = `Could not understand breakdown date. Please provide a date or approximate time like "January 2024" or "about a year ago".`;
              continue;
            }
            
            if (!isAtLeastMonthsAgo(breakdownDate, requiredMonths)) {
              validationWarning = `The relationship must have been irretrievably broken for at least ${requiredMonths} months. The date you provided (${value}) is less than ${requiredMonths} months ago. Please verify.`;
              continue;
            }
            
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && breakdownDate < marriageDate) {
                validationWarning = `Breakdown date cannot be before marriage date. Please verify your dates.`;
                continue;
              }
            }
            
            extractedData[field] = value;
            continue;
          }

          if (field === 'plaintiffPhone') {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 10) {
              validationWarning = `Please provide a complete 10-digit phone number.`;
              continue;
            }
            if (digits.length > 11 || (digits.length === 11 && digits[0] !== '1')) {
              validationWarning = `Phone number format not recognized. Please use format like (555) 123-4567.`;
              continue;
            }
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // JUDGMENT ENTRY DATE VALIDATION
          // ═══════════════════════════════════════════════════════════════
          if (field === 'judgmentEntryDate') {
            const entryDate = parseDate(value);
            if (!entryDate) {
              validationWarning = `Could not parse judgment entry date. Please use format like "February 28, 2027".`;
              continue;
            }
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (entryDate > today) {
              validationWarning = `The Judgment entry date cannot be in the future. The Judgment must already be entered before proceeding. Please verify.`;
              continue;
            }
            if (phase2Data?.summonsDate) {
              const summonsDate = parseDate(phase2Data.summonsDate);
              if (summonsDate && entryDate < summonsDate) {
                validationWarning = `Judgment entry date (${value}) cannot be before the filing date (${phase2Data.summonsDate}). Please verify.`;
                continue;
              }
            }
            if (phase2Data?.marriageDate) {
              const marriageDate = parseDate(phase2Data.marriageDate);
              if (marriageDate && entryDate < marriageDate) {
                validationWarning = `Judgment entry date cannot be before the marriage date. Please verify.`;
                continue;
              }
            }
            extractedData[field] = value;
            continue;
          }

          // ═══════════════════════════════════════════════════════════════
          // INDEX NUMBER VALIDATION
          // ═══════════════════════════════════════════════════════════════
          if (field === 'indexNumber') {
            const indexMatch = value.match(/^\d+\/\d{4}$/) || value.match(/^\d{4}\/\d+$/);
            if (!indexMatch) {
              validationWarning = `Index number format should be like "12345/2026". Please verify.`;
            }
            extractedData[field] = value;
            continue;
          }

          // Default: save the field
          extractedData[field] = value;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // OUTSIDE COUNSEL CHECK
    // ═══════════════════════════════════════════════════════════════
    if (currentPhase === 2 && !phase1Data?.plaintiffName && extractedData['indexNumber']) {
      isDisqualified = true;
      disqualifyReason = 'outside_counsel_case';
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVER-SIDE PHASE COMPLETION SAFETY NET
    // ═══════════════════════════════════════════════════════════════
    
    // Smart field inference: auto-fill address fields
    const mergedP1 = { ...phase1Data, ...extractedData };
    if (mergedP1.plaintiffAddress && !mergedP1.qualifyingAddress && mergedP1.qualifyingParty === 'plaintiff') {
      extractedData['qualifyingAddress'] = mergedP1.plaintiffAddress as string;
    }
    if (mergedP1.qualifyingAddress && !mergedP1.plaintiffAddress && mergedP1.qualifyingParty === 'plaintiff') {
      extractedData['plaintiffAddress'] = mergedP1.qualifyingAddress as string;
    }
    
    if (currentPhase === 1 && !phase1Complete) {
      const merged = { ...phase1Data, ...extractedData };
      const allPresent = p1Keys.every(f => merged[f]);
      if (allPresent) {
        phase1Complete = true;
      }
    }
    
    if (currentPhase === 2 && !phase2Complete) {
      const merged = { ...phase2Data, ...extractedData };
      const allPresent = p2Keys.every(f => merged[f]);
      if (allPresent) {
        phase2Complete = true;
      }
    }
    
    if (currentPhase === 3 && !phase3Complete) {
      const merged = { ...phase3Data, ...extractedData };
      const allPresent = p3Keys.every(f => merged[f]);
      if (allPresent) {
        phase3Complete = true;
      }
    }

    // Clean reply and append validation warning if present
    let cleanReply = reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
    if (validationWarning && !isTerminated && !isDisqualified) {
      cleanReply = validationWarning + '\n\n' + cleanReply;
    }

    return NextResponse.json({
      reply: cleanReply,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : null,
      phase1Complete,
      phase2Complete,
      phase3Complete,
      isDisqualified,
      disqualifyReason,
      isTerminated,
      terminateReason,
    });
  } catch (error) {
    console.error('Form filler API error:', error);
    return NextResponse.json(
      { reply: 'Sorry, something went wrong. Please try again.', extractedData: null },
      { status: 500 }
    );
  }
}
