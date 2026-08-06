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

test('nearby places start loading immediately and expand to five miles',()=>{
  const setLocation=html.match(/function setLocation\(.*?\n/s)?.[0]||'';
  assert.match(setLocation,/discoverPlaces\(\)/);
  assert.match(html,/fetchPlaces\(2414,'near'\)/);
  assert.match(html,/fetchPlaces\(8047,'five-mile'\)/);
});

test('a selected place is sent to routing as a destination',()=>{
  assert.match(html,/destinationLat:state\.selectedPlace\.lat/);
  assert.match(html,/destinationLon:state\.selectedPlace\.lon/);
});

test('failed discovery is never described as no nearby parks',()=>{
  assert.match(html,/Couldn’t load nearby spots/);
  assert.match(html,/Search unavailable/);
  assert.match(html,/nearFailed\|\|farFailed/);
});

test('developer diagnostics expose actionable discovery details',()=>{
  for(const field of['requestId','httpStatus','durationMs','radiusMeters','attempts'])assert.match(html,new RegExp(field));
  assert.match(html,/Copy diagnostic report/);
  assert.match(html,/location:state\.location\?\{lat:Number\(state\.location\.lat\.toFixed\(3\)\)/);
});
