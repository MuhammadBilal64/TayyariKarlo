import fs from 'node:fs';

const text = fs.readFileSync(
  'apps/api/src/questions/question.seed-data.ts',
  'utf8',
);
const re =
  /q\(\s*'([^']+)',\s*'([^']+)',\s*'((?:\\'|[^'])*)',\s*\[([^\]]+)\],\s*(\d)/g;

const known = [
  ['CDN primarily helps with:', 'Serving content closer to users'],
  [
    'What is the average time complexity of binary search on a sorted array?',
    'O(log n)',
  ],
  ['Horizontal scaling means:', 'Adding more machines/instances'],
  ['A stack follows which access order?', 'LIFO'],
];

let m;
let n = 0;
const bad = [];
while ((m = re.exec(text))) {
  n += 1;
  const prompt = m[3].replace(/\\'/g, "'");
  const opts = [...m[4].matchAll(/'((?:\\'|[^'])*)'/g)].map((x) =>
    x[1].replace(/\\'/g, "'"),
  );
  const idx = Number(m[5]);
  if (idx < 0 || idx >= opts.length) {
    bad.push({ prompt, idx, reason: 'index out of range' });
  }
  for (const [p, ans] of known) {
    if (prompt === p && opts[idx] !== ans) {
      bad.push({ prompt, got: opts[idx], want: ans, idx });
    }
  }
}

console.log(JSON.stringify({ count: n, bad }, null, 2));
