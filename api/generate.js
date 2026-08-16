const ALLOWED_MODELS = new Set([
  'zimage','flux','seedream5','nanobanana-2','gptimage','kontext','seedream','seedream-pro',
  'nanobanana','nanobanana-pro','gptimage-large','gpt-image-2','klein','nova-canvas'
]);
const ALLOWED_SIZES = new Set(['1024x1024','1024x1280','1280x720','720x1280','1536x1024']);

function json(res, status, body){
  res.status(status).setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if(req.method !== 'POST') return json(res,405,{error:'Method not allowed'});
  if(!process.env.POLLINATIONS_API_KEY) return json(res,500,{error:'POLLINATIONS_API_KEY belum diset di server.'});
  try{
    const {prompt,model='zimage',size='1024x1024'}=req.body||{};
    if(typeof prompt!=='string'||prompt.trim().length<2) return json(res,400,{error:'Prompt tidak valid.'});
    if(prompt.length>32000) return json(res,400,{error:'Prompt terlalu panjang.'});
    const safeModel=ALLOWED_MODELS.has(model)?model:'zimage';
    const safeSize=ALLOWED_SIZES.has(size)?size:'1024x1024';
    const upstream=await fetch('https://gen.pollinations.ai/v1/images/generations',{
      method:'POST',headers:{'Authorization':`Bearer ${process.env.POLLINATIONS_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({prompt:prompt.trim(),model:safeModel,n:1,size:safeSize,response_format:'b64_json'})
    });
    const text=await upstream.text();
    let data;try{data=JSON.parse(text)}catch{data=null}
    if(!upstream.ok){
      const msg=data?.error?.message||data?.error||`Upstream HTTP ${upstream.status}`;
      return json(res,502,{error:String(msg)});
    }
    const b64=data?.data?.[0]?.b64_json;
    const url=data?.data?.[0]?.url;
    if(b64) return json(res,200,{image:`data:image/png;base64,${b64}`});
    if(url) return json(res,200,{image:url});
    return json(res,502,{error:'API tidak mengembalikan data gambar.'});
  }catch(err){
    return json(res,500,{error:err?.message||'Internal server error'});
  }
};
