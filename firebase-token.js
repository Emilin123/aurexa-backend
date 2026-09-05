const axios=require('axios');
const jwt=require('jsonwebtoken');

const CERTS_URL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache={certs:null,expiresAt:0};

async function getGoogleCerts(){
  const now=Date.now();
  if(certCache.certs&&now<certCache.expiresAt)return certCache.certs;
  const r=await axios.get(CERTS_URL,{timeout:10000});
  const cacheControl=String(r.headers['cache-control']||'');
  const m=cacheControl.match(/max-age=(\d+)/i);
  const maxAgeMs=(m?Number(m[1]):3600)*1000;
  certCache={certs:r.data,expiresAt:now+Math.min(maxAgeMs,6*60*60*1000)};
  return certCache.certs;
}

async function verifyFirebaseIdToken(token,projectId){
  const clean=String(token||'').trim();
  if(clean.length<100)throw new Error('Token de Firebase demasiado corto');
  const decoded=jwt.decode(clean,{complete:true});
  if(!decoded?.header?.kid||decoded.header.alg!=='RS256')throw new Error('Token Firebase con formato no válido');
  const certs=await getGoogleCerts();
  const cert=certs[decoded.header.kid];
  if(!cert)throw new Error('Firma Firebase no reconocida');
  try{
    const claims=jwt.verify(clean,cert,{algorithms:['RS256'],audience:projectId,issuer:`https://securetoken.google.com/${projectId}`});
    if(!claims.sub)throw new Error('Token Firebase sin usuario');
    return claims;
  }catch(e){
    console.error('Firebase JWT verification detail',{name:e.name,message:e.message,code:e.code||null,kid:decoded.header.kid,alg:decoded.header.alg,projectId});
    const x=new Error(`Token Firebase inválido: ${e.name}: ${e.message}`);
    x.firebaseCode='JWT_'+String(e.name||'INVALID');
    throw x;
  }
}

module.exports={verifyFirebaseIdToken};
