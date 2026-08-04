import{createRoute}from'../lib/route-service.js';

export default async function handler(request,response){
  if(request.method!=='POST')return response.status(405).json({error:'Method not allowed.'});
  try{return response.status(200).json(await createRoute(request.body));}
  catch(error){console.error(error);return response.status(error.status||503).json({error:error.message||'Route generation failed.'});}
}
