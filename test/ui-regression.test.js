import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('the selected route is always rendered as a solid line',()=>{
  const selectRoute=html.match(/function selectRoute\(index\)\{.*?\n/s)?.[0]||'';
  assert.match(selectRoute,/L\.polyline\(route\.coordinates/);
  assert.doesNotMatch(selectRoute,/dashArray|dashOffset/);
});

test('the winner animation cannot hide route segments at different zoom levels',()=>{
  const winnerStyles=html.match(/\.winner-path\{.*?@keyframes winner\{.*?\}\}/s)?.[0]||'';
  assert.match(winnerStyles,/opacity/);
  assert.doesNotMatch(winnerStyles,/stroke-dash/);
});
