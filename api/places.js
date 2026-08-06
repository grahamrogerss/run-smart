import{loadRunningPlaces}from'../lib/overpass.js';
import{checkRateLimit}from'../lib/rate-limit.js';

export default async function handler(request,response){
  const requestId=`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;response.setHeader('X-Activ-Request-Id',requestId);
  if(request.method!=='GET')return response.status(405).json({error:{code:'METHOD_NOT_ALLOWED',message:'Method not allowed.'}});
  const identity=request.headers['x-forwarded-for']?.split(',')[0]?.trim()||request.socket?.remoteAddress||'unknown',limit=checkRateLimit(identity);response.setHeader('X-RateLimit-Remaining',limit.remaining);if(!limit.allowed){response.setHeader('Retry-After',limit.retryAfter);return response.status(429).json({error:{code:'RATE_LIMITED',message:'Too many place searches. Please wait a minute and try again.'}});}
  const latitude=Number(request.query?.latitude),longitude=Number(request.query?.longitude),radius=Number(request.query?.radius||8047);if(!Number.isFinite(latitude)||latitude<-90||latitude>90||!Number.isFinite(longitude)||longitude<-180||longitude>180)return response.status(400).json({error:{code:'INVALID_LOCATION',message:'Valid latitude and longitude are required.'}});
  try{return response.status(200).json({...await loadRunningPlaces({lat:latitude,lon:longitude},radius),requestId});}catch(error){console.error(requestId,error);return response.status(503).json({requestId,error:{code:error.code||'PLACE_SEARCH_FAILED',message:'Nearby running spots are temporarily unavailable.',attempts:error.attempts||[],durationMs:error.durationMs}});}
}
