const UPSTREAM_URL = 'https://api.sambanova.ai/v1/chat/completions';
const ALLOWED_ORIGINS = new Set(['https://aldur13.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const ALLOWED_BODY_FIELDS = ['model','messages','max_tokens','temperature','top_p','response_format','tool_choice'];
function jsonResponse(body,status,corsHeaders){
  return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
}
export async function handleSambaNovaProxy(request,fetchImpl=fetch){
  const origin=request.headers.get('origin')||'';
  const allowedOrigin=ALLOWED_ORIGINS.has(origin);
  const corsHeaders={'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-sambanova-api-key, x-client-info','Access-Control-Max-Age':'86400'};
  if(allowedOrigin)corsHeaders['Access-Control-Allow-Origin']=origin;
  if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigin?204:403,headers:corsHeaders});
  if(!allowedOrigin)return jsonResponse({error:{message:'Origin is not allowed.'}},403,corsHeaders);
  if(request.method!=='POST')return jsonResponse({error:{message:'Only POST is supported.'}},405,corsHeaders);
  const apiKey=(request.headers.get('x-sambanova-api-key')||'').trim();
  if(!apiKey)return jsonResponse({error:{message:'Missing SambaNova API key.'}},400,corsHeaders);
  let input;
  try{const raw=await request.text();if(raw.length>200000)return jsonResponse({error:{message:'Request body is too large.'}},413,corsHeaders);input=JSON.parse(raw);}
  catch(_){return jsonResponse({error:{message:'Request body must be valid JSON.'}},400,corsHeaders);}
  if(!input||typeof input!=='object'||typeof input.model!=='string'||!input.model.trim()||
    !Array.isArray(input.messages)||input.messages.length<1||input.messages.length>8||
    !input.messages.every(m=>m&&typeof m==='object'&&['system','user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.length<=150000)){
    return jsonResponse({error:{message:'Invalid chat-completion request.'}},400,corsHeaders);
  }
  const payload={};for(const field of ALLOWED_BODY_FIELDS)if(Object.prototype.hasOwnProperty.call(input,field))payload[field]=input[field];
  if(payload.max_tokens!=null&&(!Number.isInteger(payload.max_tokens)||payload.max_tokens<1||payload.max_tokens>8192))
    return jsonResponse({error:{message:'max_tokens is outside the permitted range.'}},400,corsHeaders);
  try{
    const upstream=await fetchImpl(UPSTREAM_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify(payload)});
    return new Response(await upstream.text(),{status:upstream.status,headers:{...corsHeaders,'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'}});
  }catch(_){return jsonResponse({error:{message:'Could not reach SambaNova.'}},502,corsHeaders);}
}
