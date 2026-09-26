export const defaultScope='workflow:weekly-research';
export function initialDecision(){return{verdict:'waiting',standing:false,scope:defaultScope,requestScope:defaultScope,history:[]};}
export function decide(state,choice){
 if(!['once','always','deny'].includes(choice))throw new Error('Unknown decision');
 if(state.verdict!=='waiting')throw new Error('This request already has a decision');
 return {...state,verdict:choice==='deny'?'denied':'allowed',standing:choice==='always'||state.standing,scope:choice==='always'?state.requestScope:state.scope,history:[...state.history,{kind:'decision',choice,scope:state.requestScope}]};
}
export function repeatRequest(state,scope=defaultScope){
 const permitted=state.standing&&state.scope===scope;
 return {...state,requestScope:scope,verdict:permitted?'allowed':'waiting',history:[...state.history,{kind:'repeat',choice:permitted?'standing':'waiting',scope}]};
}
export function revoke(state){return{...state,standing:false,verdict:'waiting',history:[...state.history,{kind:'revoke',scope:state.scope}]};}
export function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
export function matchesResource(item,query='',category='all',topic='all'){
 return (category==='all'||item.category===category)
  &&(topic==='all'||item.topic===topic)
  &&normalize([item.title,item.summary,...(item.tags||[])].join(' ')).includes(normalize(query));
}
export function accessibleItems(items,role,model){if(!['local','cloud'].includes(model))return [];return items.filter(item=>(item.readers||[]).includes(role)&&(model!=='cloud'||item.route!=='local'));}
export const demoKnowledge=[
 {id:'position',title:'Company positioning',kind:'Document',route:'cloud',readers:['operator','vera','ava'],note:'The approved company description and audience.'},
 {id:'research',title:'Research sources',kind:'Collection',route:'cloud',readers:['operator','vera','ava'],note:'Public sources gathered for a research brief.'},
 {id:'voice',title:'Writing method',kind:'Skill',route:'cloud',readers:['operator','vera'],note:'The method Vera follows when preparing a draft.'},
 {id:'plan',title:'Private strategy',kind:'Document',route:'local',readers:['operator'],note:'Operator access. Kept out of cloud retrieval.'},
 {id:'draft',title:'Unreleased campaign',kind:'Document',route:'local',readers:['operator','vera'],note:'Available to Vera locally, excluded from cloud retrieval.'}
];
export function applicationPayload(fields){
 const name=String(fields.name||'').trim(),email=String(fields.email||'').trim(),company=String(fields.company||'').trim();
 const building=String(fields.building||'').trim(),platform=String(fields.platform||'').trim(),interest=String(fields.interest||'').trim();
 if(!name||name.length>120||!email||email.length>254||company.length>160||building.length<20||building.length>1900||!platform||!interest)throw Error('Complete the required fields, including your platform and main interest.');
 // Submission of the explicitly labelled joint form, followed by email confirmation.
 return {name,email,company,building,platform,interest,website:String(fields.website||''),signupConsent:{accepted:true,wordingVersion:'joint-alpha-product-updates-2026-09-20'}};
}
export async function submitApplication(fields,{preview=false,endpoint='',fetcher=globalThis.fetch}={}){
 const payload=applicationPayload(fields);
 if(preview)return {kind:'preview'};
 if(!endpoint)throw Error('Applications are not configured. Please use the contact form for help.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
 const result=await response.json();
 if(!response.ok)throw Error('We could not confirm your submission. Your details are still here. Try again, or use the contact form.');
 if(result.ok===true&&result.verificationRequired===true)return{kind:'verification-required'};
 if(result.already===true)return{kind:'duplicate'};
 if(result.ok===true)return{kind:'received'};
 throw Error('The service did not confirm your request. Try again or use the contact form.');
 }finally{clearTimeout(timer)}
}
