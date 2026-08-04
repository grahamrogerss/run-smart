import{M_PER_MI,bboxFor,buildGraph,findLoop}from'./routing.js';
import{loadMapData}from'./overpass.js';
const PRESETS=new Set(['balanced','nature','nostops','scenic']);

export async function createRoute(input,dependencies={loadMapData}){
  const latitude=Number(input?.latitude),longitude=Number(input?.longitude),distanceMiles=Number(input?.distanceMiles),preset=String(input?.preset||'balanced');
  if(!Number.isFinite(latitude)||latitude<-90||latitude>90||!Number.isFinite(longitude)||longitude<-180||longitude>180)throw Object.assign(new Error('Valid latitude and longitude are required.'),{status:400,code:'INVALID_LOCATION'});
  if(!Number.isFinite(distanceMiles)||distanceMiles<.5||distanceMiles>20)throw Object.assign(new Error('Distance must be between 0.5 and 20 miles.'),{status:400,code:'INVALID_DISTANCE'});
  if(!PRESETS.has(preset))throw Object.assign(new Error('Unknown route preset.'),{status:400,code:'INVALID_PRESET'});
  const started=performance.now(),origin={lat:latitude,lon:longitude},target=distanceMiles*M_PER_MI,mapStart=performance.now();let mapData;try{mapData=await dependencies.loadMapData(bboxFor(origin,target));}catch(error){if(!error.code)error.code='MAP_UNAVAILABLE';throw error;}const graphStart=performance.now(),graph=buildGraph(mapData.elements),routeStart=performance.now();
  if(graph.nodes.size<10)throw Object.assign(new Error('Not enough runnable paths were found near this location.'),{status:422,code:'INSUFFICIENT_MAP_DATA'});
  const route=findLoop(graph,origin,target,preset);if(!route)throw Object.assign(new Error('No connected loop could be built here.'),{status:422,code:'NO_ROUTE_FOUND'});
  const actual=route.distanceMeters/M_PER_MI;
  return{distanceMiles:Number(actual.toFixed(2)),coordinates:route.coordinates,stats:{greenPercent:Math.round(route.stats.greenMeters/route.distanceMeters*100),crossings:route.stats.crossings,repeatedPercent:Math.round(route.stats.repeatedMeters/route.distanceMeters*100)},meta:{targetErrorPercent:Math.round(Math.abs(actual-distanceMiles)/distanceMiles*100),mapSource:mapData.source||'provided data',nodes:graph.nodes.size,timingsMs:{map:Math.round(graphStart-mapStart),graph:Math.round(routeStart-graphStart),routing:Math.round(performance.now()-routeStart),total:Math.round(performance.now()-started)}}};
}
