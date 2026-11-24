import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSambaNovaProxy } from '../supabase/functions/sambanova-proxy/proxy.mjs';
const appOrigin='https://aldur13.github.io';
function request(method,{origin=appOrigin,key='test-sambanova-key',body}={}){
 return new Request('https://example.test/functions/v1/sambanova-proxy',{method,headers:{...(origin?{Origin:origin}:{}),...(key?{'x-sambanova-api-key':key}:{}),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
test('proxy handles CORS preflight for the deployed app',async()=>{
 const r=await handleSambaNovaProxy(request('OPTIONS',{key:''}));
 assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),appOrigin);
});
test('proxy rejects unknown origins and missing provider keys',async()=>{
 const denied=await handleSambaNovaProxy(request('POST',{origin:'https://untrusted.example',body:{}}));assert.equal(denied.status,403);
 const missing=await handleSambaNovaProxy(request('POST',{key:'',body:{model:'GLM-5.3',messages:[{role:'user',content:'hi'}]}}));assert.equal(missing.status,400);
});
test('proxy forwards whitelisted payload and strips upstream headers',async()=>{
 let seen;const r=await handleSambaNovaProxy(request('POST',{body:{model:'GLM-5.3',messages:[{role:'user',content:'Return JSON.'}],max_tokens:256,unexpected:'no'}}),async(url,options)=>{
  seen={url,options};return new Response('{"choices":[{"message":{"content":"ok"}}]}',{status:200,headers:{'content-type':'application/json','x-upstream-secret':'hidden'}});
 });
 assert.equal(r.status,200);assert.equal(seen.url,'https://api.sambanova.ai/v1/chat/completions');
 assert.equal(seen.options.headers.Authorization,'Bearer test-sambanova-key');
 assert.deepEqual(JSON.parse(seen.options.body),{model:'GLM-5.3',messages:[{role:'user',content:'Return JSON.'}],max_tokens:256});
 assert.equal(r.headers.get('x-upstream-secret'),null);
});
test('proxy hides upstream network error details',async()=>{
 const r=await handleSambaNovaProxy(request('POST',{body:{model:'GLM-5.3',messages:[{role:'user',content:'hi'}]}}),async()=>{throw new Error('secret-bearing exception')});
 assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/secret-bearing|test-sambanova-key/);
});
