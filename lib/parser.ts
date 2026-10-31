import { z } from 'zod';
import OpenAI from 'openai';
import seedData from '@/data/seed.json';

// ── Zod Schema for LLM response (Hard Rule 8) ───────────────────
export const LLMParseOutputSchema = z.object({
  exam: z.string().nullable().describe('Exam slug, e.g. "usg", "xray", "cbc" or null'),
  genderPref: z.enum(['male', 'female', 'any']).nullable().describe('Doctor gender preference: "male", "female", "any", or null if not specified'),
  area: z.string().nullable().describe('Area name in Dhaka or null'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence between 0 and 1'),
});

export type LLMParseOutput = z.infer<typeof LLMParseOutputSchema>;

export interface ParsedEntity {
  examSlug: string | null;
  examName: { en: string; bn: string } | null;
  genderPref: 'male' | 'female' | 'any' | null;
  areaId: string | null;
  areaName: { en: string; bn: string } | null;
  confidence: number;
}

export interface ParseResult {
  success: boolean;
  parsed: ParsedEntity;
  raw: {
    exam: string | null;
    genderPref: string | null;
    area: string | null;
  };
  modelUsed?: string;
  fromCache?: boolean;
  fallback?: boolean;
  fallbackMessage?: string;
}

// ── Static Knowledge from Seed ──────────────────────────────────
export interface AreaInfo {
  id: string;
  name_en: string;
  name_bn: string;
  aliases: string[];
}

export interface ExamInfo {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  aliases: string[];
}

export const KNOWN_AREAS: AreaInfo[] = seedData.areas;
export const KNOWN_EXAMS: ExamInfo[] = seedData.exams;

// ── In-Memory Cache ──────────────────────────────────────────────
interface CacheEntry {
  result: ParseResult;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 300;
const parseCache = new Map<string, CacheEntry>();

export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── Fuzzy / Alias Mapping ───────────────────────────────────────
export function matchExam(input: string | null): ExamInfo | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // 1. Direct slug or name match
  for (const e of KNOWN_EXAMS) {
    if (e.slug.toLowerCase() === clean || e.name_en.toLowerCase() === clean || e.name_bn === clean) {
      return e;
    }
  }

  // 2. Alias match
  for (const e of KNOWN_EXAMS) {
    for (const alias of e.aliases) {
      if (clean === alias.toLowerCase() || clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean)) {
        return e;
      }
    }
  }

  return null;
}

export function matchArea(input: string | null): AreaInfo | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // 1. Direct name match
  for (const a of KNOWN_AREAS) {
    if (a.name_en.toLowerCase() === clean || a.name_bn === clean) {
      return a;
    }
  }

  // 2. Alias match
  for (const a of KNOWN_AREAS) {
    for (const alias of a.aliases) {
      const aLower = alias.toLowerCase();
      if (clean === aLower || clean.includes(aLower) || aLower.includes(clean)) {
        return a;
      }
    }
  }

  return null;
}

/**
 * Strict gender preference detection (Hard Rule 2).
 * Words like "wife", "husband", "বউ", "স্ত্রী" describe patient, NEVER doctor gender!
 */
export function extractStrictGenderPref(text: string, rawPref: 'male' | 'female' | 'any' | null): 'male' | 'female' | 'any' | null {
  const t = text.toLowerCase();

  // Explicit female doctor requests
  const femaleKeywords = [
    'female doctor', 'lady doctor', 'woman doctor', 'female physician',
    'মহিলা ডাক্তার', 'লেডি ডাক্তার', 'মেয়ে ডাক্তার', 'নারী ডাক্তার', 'মহিলা চিকিৎসক',
    'female sonographer', 'female radiologist'
  ];
  for (const kw of femaleKeywords) {
    if (t.includes(kw)) return 'female';
  }

  // Explicit male doctor requests
  const maleKeywords = [
    'male doctor', 'man doctor', 'male physician',
    'পুরুষ ডাক্তার', 'ছেলে ডাক্তার', 'পুরুষ চিকিৎসক',
    'male sonographer', 'male radiologist'
  ];
  for (const kw of maleKeywords) {
    if (t.includes(kw)) return 'male';
  }

  // Explicit any / no preference
  const anyKeywords = [
    'any doctor', 'anyone', 'no preference', 'either gender',
    'যেকোনো ডাক্তার', 'যে কেউ', 'বাধ্যবাধকতা নেই'
  ];
  for (const kw of anyKeywords) {
    if (t.includes(kw)) return 'any';
  }

  // If text only mentions "female" or "মহিলা" without words like "wife"/"sister", verify context:
  const isFemaleStandalone = /\b(female|lady)\b/.test(t) || t.includes('মহিলা') || t.includes('লেডি');
  const isWifeOrPatientOnly = (t.includes('wife') || t.includes('স্ত্রী') || t.includes('বউ') || t.includes('patient')) &&
    !t.includes('female doctor') && !t.includes('মহিলা ডাক্তার') && !t.includes('লেডি ডাক্তার');

  if (isWifeOrPatientOnly) {
    // Hard Rule: "wife" or "বউ" says nothing about doctor gender. Never guess it.
    return null;
  }

  if (isFemaleStandalone) {
    return 'female';
  }

  const isMaleStandalone = /\b(male)\b/.test(t) || t.includes('পুরুষ');
  if (isMaleStandalone && !t.includes('husband') && !t.includes('স্বামী')) {
    return 'male';
  }

  // If rawPref came from LLM, confirm it was not hallucinated from "wife"/"বউ"
  if (rawPref && !isWifeOrPatientOnly) {
    return rawPref;
  }

  return null;
}

// ── Code-based Fallback Parser (Rule-based) ─────────────────────
export function parseQueryWithRules(text: string): ParsedEntity {
  const norm = text.toLowerCase();

  // 1. Exam search
  let matchedExam: ExamInfo | null = null;
  for (const exam of KNOWN_EXAMS) {
    if (norm.includes(exam.slug.toLowerCase()) || norm.includes(exam.name_en.toLowerCase()) || norm.includes(exam.name_bn)) {
      matchedExam = exam;
      break;
    }
    for (const alias of exam.aliases) {
      if (norm.includes(alias.toLowerCase())) {
        matchedExam = exam;
        break;
      }
    }
    if (matchedExam) break;
  }

  // 2. Area search
  let matchedArea: AreaInfo | null = null;
  for (const area of KNOWN_AREAS) {
    if (norm.includes(area.name_en.toLowerCase()) || norm.includes(area.name_bn)) {
      matchedArea = area;
      break;
    }
    for (const alias of area.aliases) {
      if (norm.includes(alias.toLowerCase())) {
        matchedArea = area;
        break;
      }
    }
    if (matchedArea) break;
  }

  // 3. Gender search
  const genderPref = extractStrictGenderPref(text, null);

  const confidence = (matchedExam ? 0.4 : 0) + (matchedArea ? 0.4 : 0) + (genderPref ? 0.2 : 0);

  return {
    examSlug: matchedExam ? matchedExam.slug : null,
    examName: matchedExam ? { en: matchedExam.name_en, bn: matchedExam.name_bn } : null,
    genderPref,
    areaId: matchedArea ? matchedArea.id : null,
    areaName: matchedArea ? { en: matchedArea.name_en, bn: matchedArea.name_bn } : null,
    confidence,
  };
}

// ── OpenRouter Models Orchestrator ──────────────────────────────
export async function parseQueryWithLLM(text: string, lang: 'en' | 'bn' = 'en'): Promise<ParseResult> {
  const cacheKey = `${normalizeText(text)}::${lang}`;
  const cached = parseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { ...cached.result, fromCache: true };
  }

  // Read model list from env var
  const envModels = process.env.OPENROUTER_MODELS;
  const models = envModels ? envModels.split(',').map((m) => m.trim()).filter(Boolean) : [];
  const apiKey = process.env.OPENROUTER_API_KEY;

  // If no models configured or no API key, use rule-based parser immediately
  if (models.length === 0 || !apiKey) {
    const fallbackParsed = parseQueryWithRules(text);
    const result: ParseResult = {
      success: true,
      parsed: fallbackParsed,
      raw: {
        exam: fallbackParsed.examSlug,
        genderPref: fallbackParsed.genderPref,
        area: fallbackParsed.areaName ? fallbackParsed.areaName.en : null,
      },
      modelUsed: 'rule-based',
      fallback: models.length > 0 && !apiKey,
      fallbackMessage: models.length > 0 && !apiKey ? 'Our assistant is busy, please use the form below' : undefined,
    };
    parseCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://healthmatch-bd.vercel.app',
      'X-Title': 'HealthMatch BD',
    },
  });

  const validExamSlugs = KNOWN_EXAMS.map((e) => `"${e.slug}" (${e.name_en} / ${e.name_bn})`).join(', ');
  const validAreaNames = KNOWN_AREAS.map((a) => `"${a.name_en}" / "${a.name_bn}"`).join(', ');

  const systemPrompt = `You are a medical search query parser for Dhaka, Bangladesh.
Your task is to extract structured fields from the user's message in JSON format.
Valid exam slugs: ${validExamSlugs}.
Known areas: ${validAreaNames}.

IMPORTANT RULES:
1. Return ONLY valid JSON matching this schema:
   {
     "exam": "<slug or null>",
     "genderPref": "male" | "female" | "any" | null,
     "area": "<area name or null>",
     "confidence": <number between 0 and 1>
   }
2. Doctor gender: "genderPref" MUST be null unless the user clearly expressed a preference for the DOCTOR's gender (e.g., "female doctor", "মহিলা ডাক্তার"). Words like "wife", "husband", "স্ত্রী", "বউ" describe the patient and say NOTHING about doctor gender. Never infer or guess doctor gender from patient relationship.
3. If no exam or area is mentioned, set to null.
4. Output nothing else, no markdown fences, no explanatory text, only the raw JSON.`;

  for (const model of models) {
    // Try each model with up to 1 retry (Hard Rule 8) and 8s timeout
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await openai.chat.completions.create(
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text },
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        const content = response.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error('Empty response from model');

        let jsonPayload: unknown;
        try {
          jsonPayload = JSON.parse(content);
        } catch {
          // If JSON.parse fails, attempt cleanup if wrapped in markdown
          const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
          jsonPayload = JSON.parse(cleaned);
        }

        const validated = LLMParseOutputSchema.safeParse(jsonPayload);
        if (!validated.success) {
          console.warn(`[Parse] Model ${model} validation failed (attempt ${attempt + 1}):`, validated.error.flatten());
          continue; // retry once
        }

        const data = validated.data;

        // Map to known entities in code (Hard Rule 1)
        const matchedExam = matchExam(data.exam);
        const matchedArea = matchArea(data.area);
        const strictGender = extractStrictGenderPref(text, data.genderPref);

        const parsedEntity: ParsedEntity = {
          examSlug: matchedExam ? matchedExam.slug : null,
          examName: matchedExam ? { en: matchedExam.name_en, bn: matchedExam.name_bn } : null,
          genderPref: strictGender,
          areaId: matchedArea ? matchedArea.id : null,
          areaName: matchedArea ? { en: matchedArea.name_en, bn: matchedArea.name_bn } : null,
          confidence: data.confidence ?? 0.8,
        };

        const result: ParseResult = {
          success: true,
          parsed: parsedEntity,
          raw: {
            exam: data.exam,
            genderPref: data.genderPref,
            area: data.area,
          },
          modelUsed: model,
          fromCache: false,
        };

        if (parseCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = parseCache.keys().next().value;
          if (firstKey) parseCache.delete(firstKey);
        }
        parseCache.set(cacheKey, { result, timestamp: Date.now() });

        return result;
      } catch (err: unknown) {
        console.warn(`[Parse] Model ${model} error (attempt ${attempt + 1}):`, err instanceof Error ? err.message : err);
      }
    }
  }

  // All models failed or timed out: fall back to rule-based parser (Rule 8 fallback)
  const fallbackParsed = parseQueryWithRules(text);
  const fallbackResult: ParseResult = {
    success: true,
    parsed: fallbackParsed,
    raw: {
      exam: fallbackParsed.examSlug,
      genderPref: fallbackParsed.genderPref,
      area: fallbackParsed.areaName ? fallbackParsed.areaName.en : null,
    },
    fallback: true,
    fallbackMessage: 'Our assistant is busy, please use the form below',
    modelUsed: 'fallback-rules',
  };

  parseCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
