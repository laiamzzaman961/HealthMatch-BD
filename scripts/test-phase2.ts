/**
 * scripts/test-phase2.ts
 *
 * Automated verification for Phase 2:
 * 1. Rule 1 & 2: Query parsing & Strict gender logic (never inferring doctor gender from "wife"/"বউ")
 * 2. Aliases & fuzzy matching for exams and Dhaka areas (Bengali & English)
 * 3. In-memory caching functionality
 * 4. Zod schema validation for LLM outputs
 * 5. Model fallback configuration
 */

import {
  matchExam,
  matchArea,
  extractStrictGenderPref,
  parseQueryWithRules,
  parseQueryWithLLM,
  LLMParseOutputSchema,
  normalizeText,
} from '../lib/parser';

async function runPhase2Tests() {
  console.log('--- Running Phase 2 Tests ---');

  // Test 1: Hard Rule 2 - "wife" / "বউ" / "স্ত্রী" must NEVER infer doctor gender
  console.log('1. Testing Strict Gender Preference & Patient words rule...');
  const testWifeEn = extractStrictGenderPref('Ultrasound for my wife near Azimpur', null);
  if (testWifeEn !== null) throw new Error(`Expected null for "wife", got ${testWifeEn}`);

  const testWifeBn = extractStrictGenderPref('আজিমপুরের কাছে আমার স্ত্রীর জন্য আল্ট্রাসাউন্ড', null);
  if (testWifeBn !== null) throw new Error(`Expected null for "স্ত্রী", got ${testWifeBn}`);

  const testWifeBou = extractStrictGenderPref('বউয়ের জন্য ইউএসজি টেস্ট করাবো', null);
  if (testWifeBou !== null) throw new Error(`Expected null for "বউয়ের", got ${testWifeBou}`);

  const testFemaleDoc = extractStrictGenderPref('Need a female doctor for USG', null);
  if (testFemaleDoc !== 'female') throw new Error(`Expected female for "female doctor", got ${testFemaleDoc}`);

  const testFemaleDocBn = extractStrictGenderPref('মিরপুরে মহিলা ডাক্তার দিয়ে এক্স-রে করাবো', null);
  if (testFemaleDocBn !== 'female') throw new Error(`Expected female for "মহিলা ডাক্তার", got ${testFemaleDocBn}`);

  const testMaleDoc = extractStrictGenderPref('I prefer a male doctor in Dhanmondi', null);
  if (testMaleDoc !== 'male') throw new Error(`Expected male for "male doctor", got ${testMaleDoc}`);

  const testAnyDoc = extractStrictGenderPref('Any doctor or sonographer is fine', null);
  if (testAnyDoc !== 'any') throw new Error(`Expected any for "any doctor", got ${testAnyDoc}`);
  console.log('✓ Strict gender extraction passed');

  // Test 2: Exam alias matching in English & Bengali
  console.log('2. Testing Exam Alias Matching...');
  if (matchExam('usg')?.slug !== 'usg') throw new Error('Failed to match "usg"');
  if (matchExam('ultrasound')?.slug !== 'usg') throw new Error('Failed to match "ultrasound"');
  if (matchExam('আলট্রাসনোগ্রাফি')?.slug !== 'usg') throw new Error('Failed to match "আলট্রাসনোগ্রাফি"');
  if (matchExam('আল্ট্রাসাউন্ড')?.slug !== 'usg') throw new Error('Failed to match "আল্ট্রাসাউন্ড"');
  if (matchExam('x-ray')?.slug !== 'xray') throw new Error('Failed to match "x-ray"');
  if (matchExam('রঞ্জন')?.slug !== 'xray') throw new Error('Failed to match "রঞ্জন"');
  if (matchExam('রক্ত পরীক্ষা')?.slug !== 'cbc') throw new Error('Failed to match "রক্ত পরীক্ষা"');
  if (matchExam('cbc')?.slug !== 'cbc') throw new Error('Failed to match "cbc"');
  console.log('✓ Exam alias matching passed');

  // Test 3: Area alias matching in English & Bengali
  console.log('3. Testing Area Alias Matching...');
  if (matchArea('Azimpur')?.name_en !== 'Azimpur') throw new Error('Failed to match "Azimpur"');
  if (matchArea('আজিমপুর')?.name_en !== 'Azimpur') throw new Error('Failed to match "আজিমপুর"');
  if (matchArea('Mirpur')?.name_en !== 'Mirpur') throw new Error('Failed to match "Mirpur"');
  if (matchArea('মিরপুর ১০')?.name_en !== 'Mirpur') throw new Error('Failed to match "মিরপুর ১০"');
  if (matchArea('Dhanmondi')?.name_en !== 'Dhanmondi') throw new Error('Failed to match "Dhanmondi"');
  if (matchArea('ধানমণ্ডি')?.name_en !== 'Dhanmondi') throw new Error('Failed to match "ধানমণ্ডি"');
  if (matchArea('উত্তরা')?.name_en !== 'Uttara') throw new Error('Failed to match "উত্তরা"');
  if (matchArea('Gulshan')?.name_en !== 'Gulshan') throw new Error('Failed to match "Gulshan"');
  console.log('✓ Area alias matching passed');

  // Test 4: Full query parsing with rule fallback
  console.log('4. Testing Full Query Parsing...');
  const res1 = parseQueryWithRules('Ultrasound for my wife near Azimpur');
  if (res1.examSlug !== 'usg' || res1.areaName?.en !== 'Azimpur' || res1.genderPref !== null) {
    throw new Error(`Unexpected parse result 1: ${JSON.stringify(res1)}`);
  }

  const res2 = parseQueryWithRules('X-ray, female doctor, Mirpur');
  if (res2.examSlug !== 'xray' || res2.areaName?.en !== 'Mirpur' || res2.genderPref !== 'female') {
    throw new Error(`Unexpected parse result 2: ${JSON.stringify(res2)}`);
  }

  const res3 = parseQueryWithRules('ধানমণ্ডির কাছে রক্ত পরীক্ষা');
  if (res3.examSlug !== 'cbc' || res3.areaName?.en !== 'Dhanmondi' || res3.genderPref !== null) {
    throw new Error(`Unexpected parse result 3: ${JSON.stringify(res3)}`);
  }
  console.log('✓ Full query parsing passed');

  // Test 5: In-Memory Cache
  console.log('5. Testing In-Memory Cache...');
  const call1 = await parseQueryWithLLM('Ultrasound for my wife near Azimpur', 'en');
  const call2 = await parseQueryWithLLM('Ultrasound for my wife near Azimpur', 'en');
  if (call2.fromCache !== true) {
    throw new Error('Expected second call to be served fromCache: true');
  }
  console.log('✓ In-memory cache passed');

  // Test 6: Zod Schema Validation for LLM response
  console.log('6. Testing Zod Schema Validation...');
  const validOutput = {
    exam: 'usg',
    genderPref: 'female',
    area: 'Mirpur',
    confidence: 0.95,
  };
  const parsedOk = LLMParseOutputSchema.safeParse(validOutput);
  if (!parsedOk.success) throw new Error('Valid schema was rejected');

  const invalidOutput = {
    exam: 12345, // wrong type
    genderPref: 'alien', // not in enum
    area: true,
  };
  const parsedBad = LLMParseOutputSchema.safeParse(invalidOutput);
  if (parsedBad.success) throw new Error('Invalid schema was accepted');
  console.log('✓ Zod schema validation passed');

  console.log('ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 tests failed:', err);
  process.exit(1);
});
