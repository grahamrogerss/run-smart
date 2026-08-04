import{createRoute}from'../lib/route-service.js';
import{checkRateLimit}from'../lib/rate-limit.js';

export default async function handler(request,response){
  if(request.method!=='POST')return response.status(405).json({error:{code:'METHOD_NOT_ALLOWED',message:'Method not allowed.'}});
  const identity=request.headers['x-forwarded-for']?.split(',')[0]?.trim()||request.socket?.remoteAddress||'unknown',limit=checkRateLimit(identity);response.setHeader('X-RateLimit-Remaining',limit.remaining);if(!limit.allowed){response.setHeader('Retry-After',limit.retryAfter);return response.status(429).json({error:{code:'RATE_LIMITED',message:'Too many route requests. Please wait a minute and try again.'}});}
  try{return response.status(200).json(await createRoute(request.body));}
  catch(error){console.error(error);return response.status(error.status||503).json({error:{code:error.code||'ROUTE_FAILED',message:error.message||'Route generation failed.'}});}
}
