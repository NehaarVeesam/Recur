import { parseProblem, generateProblemText } from '../src/utils/parser.ts';

const sample = `Title: Two Sum
Date: 2026-06-23
Difficulty: Easy
Tags: Array, HashMap
Platform: LeetCode
Favorite: true
Status: Mastered

Statement:
Given an array of integers.

Approach: Hash Map
Time Complexity: O(n)
Space Complexity: O(n)
Use a hash map.

Learning:
Great problem.

Code:
function twoSum() {}
`;

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

console.log('Parser tests');
const parsed = parseProblem('two-sum.txt', sample);
assert('parses title', parsed.title === 'Two Sum');
assert('parses tags', parsed.tags.includes('Array') && parsed.tags.includes('HashMap'));
assert('parses statement', parsed.statement?.includes('Given an array'));
assert('parses approaches', parsed.approaches.length === 1 && parsed.approaches[0].timeComplexity === 'O(n)');
assert('parses learning', parsed.learning?.includes('Great problem'));
assert('parses code', parsed.code?.includes('function twoSum'));
assert('parses favorite', parsed.favorite === true);
assert('parses status', parsed.status === 'Mastered');
assert('stores raw', parsed.raw === sample);

const regenerated = generateProblemText(parsed);
const reparsed = parseProblem('two-sum.txt', regenerated);
assert('round-trip title', reparsed.title === parsed.title);
assert('round-trip approaches count', reparsed.approaches.length === parsed.approaches.length);
assert('round-trip mistakes field exists', reparsed.mistakes === parsed.mistakes);

async function testApi(baseUrl) {
  console.log(`\nAPI tests (${baseUrl})`);
  const listRes = await fetch(`${baseUrl}/api/problems`);
  assert('GET /api/problems', listRes.ok);
  const problems = await listRes.json();
  assert('returns array', Array.isArray(problems));
  assert('has problem files', problems.length > 0);
  assert('files have content', problems.every(p => (p.content || '').trim().length > 0));

  const testFile = `verify-test-${Date.now()}.txt`;
  const testContent = `Title: Verify Test\nDate: 2026-06-23\nDifficulty: Easy\nTags: Test\nFavorite: false\nStatus: Need Revision\n\nStatement:\nTest.\n\nLearning:\n\n\nCode:\n`;
  const createRes = await fetch(`${baseUrl}/api/problems/${testFile}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: testContent }),
  });
  assert('POST create', createRes.ok);

  const badRes = await fetch(`${baseUrl}/api/problems/bad.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'x' }),
  });
  assert('POST rejects non-txt', badRes.status === 400);

  const delRes = await fetch(`${baseUrl}/api/problems/${testFile}`, { method: 'DELETE' });
  assert('DELETE problem', delRes.ok);

  const spaRes = await fetch(`${baseUrl}/`);
  assert('serves frontend', spaRes.ok);
}

try {
  await testApi('http://localhost:3000');
} catch (e) {
  failed++;
  console.error('  ✗ Dev API unreachable:', e.message);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
