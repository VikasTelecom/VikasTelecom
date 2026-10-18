const data = require('./backend/src/seed/data.js');
const q = 'pen drive';
const escaped = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&').replace(/\s+/g, '(?:[\\s-]*)');
const regex = new RegExp(escaped, 'i');
const matches = data.products.filter((p) =>
  regex.test(p.title) ||
  regex.test(p.description || '') ||
  regex.test(p.brand || '') ||
  regex.test(p.category || '') ||
  regex.test(p.generalName || '')
);
console.log('pattern:', escaped);
console.log('count', matches.length);
matches.slice(0, 50).forEach((p) => {
  const matchedIn = [];
  if (regex.test(p.title)) matchedIn.push('title');
  if (regex.test(p.description || '')) matchedIn.push('description');
  if (regex.test(p.brand || '')) matchedIn.push('brand');
  if (regex.test(p.category || '')) matchedIn.push('category');
  if (regex.test(p.generalName || '')) matchedIn.push('generalName');
  console.log(JSON.stringify({ title: p.title, category: p.category, brand: p.brand, matchedIn }));
});
