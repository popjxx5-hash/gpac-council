'use client';
import { useState, useRef, useEffect } from 'react';

const MEMBERS = [
  {icon:'👑',name:'البارون'},{icon:'🏢',name:'رهف'},{icon:'📊',name:'جوزيف'},
  {icon:'🔍',name:'فيكتور'},{icon:'💰',name:'أحمد'},{icon:'📈',name:'محمود'},
  {icon:'🏗️',name:'سيلين'},{icon:'🌐',name:'سيلينا'},{icon:'🏛️',name:'فالنتينا'},
  {icon:'🚨',name:'مارتينا'},{icon:'💻',name:'سيلا'},
];

const TOPICS = [
  {icon:'📋',label:'IFRS 16 — عقود الإيجار',q:'كيف أسجّل عقد إيجار وفق IFRS 16؟'},
  {icon:'💰',label:'ضريبة الدخل الأردنية',q:'كيف أحسب ضريبة الدخل في الأردن؟'},
  {icon:'🔍',label:'التدقيق الداخلي',q:'كيف أبني برنامج التدقيق الداخلي وفق IIA؟'},
  {icon:'📊',label:'تحليل القوائم المالية',q:'كيف أحلل القوائم المالية بالنسب العشرين؟'},
  {icon:'🏢',label:'IFRS 3 — اندماج الشركات',q:'اشرح IFRS 3 مع مثال وقيود محاسبية.'},
  {icon:'📉',label:'IAS 36 — انخفاض القيمة',q:'كيف أحسب انخفاض قيمة الأصول وفق IAS 36؟'},
  {icon:'🇯🇴',label:'وساطة مالية — JSC',q:'ما متطلبات ترخيص شركة وساطة في JSC الأردن؟'},
  {icon:'🏗️',label:'نظام تكاليف ABC',q:'كيف أبني نظام محاسبة تكاليف ABC؟'},
];

function fmt(s){
  return s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*([^*]+)\*\*/g,'<strong style="color:#e8cc6a">$1</strong>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.2);border-radius:3px;padding:1px 5px;font-size:.82em;color:#e8cc6a;font-family:monospace">$1</code>');
}

function renderMd(text){
  const lines=text.split('\n');
  let html='',inUl=false;
  const close=()=>{if(inUl){html+='</ul>';inUl=false;}};
  for(const line of lines){
    if(/^[-─━═]{3,}$/.test(line)){close();html+='<hr style="border:none;border-top:1px solid rgba(212,175,55,.2);margin:8px 0"/>';continue;}
    if(line.startsWith('### ')){close();html+=`<h3 style="color:#e8cc6a;font-size:.88rem;margin:10px 0 4px;font-weight:600">${fmt(line.slice(4))}</h3>`;continue;}
    if(line.startsWith('## ')){close();html+=`<h2 style="color:#e8cc6a;font-size:.95rem;margin:12px 0 5px;font-weight:600">${fmt(line.slice(3))}</h2>`;continue;}
    if(line.startsWith('# ')){close();html+=`<h1 style="color:#e8cc6a;font-size:1.05rem;margin:14px 0 6px;font-weight:700">${fmt(line.slice(2))}</h1>`;continue;}
    if(/^[•\-\*] /.test(line)){if(!inUl){html+='<ul style="padding-right:18px;margin:5px 0">';inUl=true;}html+=`<li style="margin:3px 0">${fmt(line.slice(2))}</li>`;continue;}
    close();
    if(line.trim()===''){html+='<div style="height:4px"></div>';continue;}
    html+=`<p style="margin:3px 0;line-height:1.9">${fmt(line)}</p>`;
  }
  close();
  return html;
}
export default function Home(){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState('');
  const [status,setStatus]=useState('● المجلس في وضع الاستعداد');
  const [level,setLevel]=useState('المستوى: غير محدد');
  const [active,setActive]=useState(false);
  const [err,setErr]=useState('');
  const [focused,setFocused]=useState(false);
  const [time,setTime]=useState(new Date());
  const endRef=useRef(null);
  const taRef=useRef(null);

  useEffect(()=>{const id=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,streaming]);

  const dateStr=time.toLocaleDateString('ar-JO',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const timeStr=time.toLocaleTimeString('ar-JO',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const curT=time.toLocaleTimeString('ar-JO',{hour:'2-digit',minute:'2-digit'});

  async function send(txt){
    const q=(txt||input).trim();
    if(!q||loading)return;
    setInput('');setErr('');setLoading(true);setActive(true);
    setStatus('⏳ البارون يستشير أعضاء المجلس...');
    if(taRef.current)taRef.current.style.height='auto';
    const history=[...msgs,{role:'user',content:q}];
    setMsgs(history);
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});
      if(!res.ok){const e=await res.text();throw new Error(e||`خطأ ${res.status}`);}
      let full='';
      const reader=res.body.getReader();
      const dec=new TextDecoder();
      setStreaming(' ');
      while(true){
        const{done,value}=await reader.read();
        if(done)break;
        for(const line of dec.decode(value).split('\n')){
          if(!line.startsWith('data: '))continue;
          const d=line.slice(6);
          if(d==='[DONE]')continue;
          try{const p=JSON.parse(d);if(p.type==='content_block_delta'&&p.delta?.text){full+=p.delta.text;setStreaming(full);}}catch(_){}
        }
      }
      setStreaming('');
      setMsgs(prev=>[...prev,{role:'assistant',content:full}]);
      const lm=full.match(/المستوى\s*[:(]\s*([أبجد])/);
      if(lm){const map={'أ':'🟢 أ','ب':'🟡 ب','ج':'🔴 ج','د':'⚫ د'};setLevel('المستوى: '+(map[lm[1]]||lm[1]));}
      setStatus('✅ الجلسة نشطة');
    }catch(e){
      setStreaming('');setErr(e.message);
      setMsgs(prev=>prev.slice(0,-1));
      setStatus('● المجلس في وضع الاستعداد');
    }finally{setLoading(false);setActive(false);}
  }
const clear=()=>{if(loading)return;setMsgs([]);setStreaming('');setErr('');setLevel('المستوى: غير محدد');setStatus('● المجلس في وضع الاستعداد');};

  const bdr=(role)=>role==='assistant'?{border:'1px solid rgba(212,175,55,.1)',borderRight:'3px solid #a0832a'}:{border:'1px solid rgba(80,100,200,.17)'};

  return(
    <div style={{direction:'rtl',fontFamily:"'Noto Naskh Arabic',serif",background:'#020202',color:'#ede5cc',height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <style>{`.chip:hover{background:rgba(212,175,55,.12)!important;color:#e8cc6a!important;transform:translateY(-1px)}.d1{animation:bounce 1.4s ease-in-out infinite}.d2{animation:bounce 1.4s .2s ease-in-out infinite}.d3{animation:bounce 1.4s .4s ease-in-out infinite}`}</style>
      <div style={{padding:'12px 20px 8px',borderBottom:'1px solid rgba(212,175,55,.12)',background:'rgba(8,7,4,.98)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,175,55,.16),rgba(212,175,55,.03))',border:'1px solid rgba(212,175,55,.32)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🔱</div>
            <div>
              <div style={{fontWeight:700,fontSize:'1rem',color:'#e8cc6a'}}>مجلس المحاسبة الاحترافي العالمي</div>
              <div style={{fontSize:'0.6rem',color:'#5a5248'}}>GLOBAL PROFESSIONAL ACCOUNTING COUNCIL</div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            <div style={{fontSize:'0.62rem',color:'#5a5248',display:'flex',gap:5,alignItems:'center'}}>
              <div style={{width:5,height:5,background:'#22c55e',borderRadius:'50%',animation:'blink 2s infinite'}}></div>{dateStr}
            </div>
            <div style={{fontSize:'0.62rem',color:'#5a5248'}}>⏱ {timeStr}</div>
            <button onClick={clear} style={{background:'none',border:'1px solid rgba(212,175,55,.14)',color:'#5a5248',fontSize:'0.6rem',padding:'2px 8px',borderRadius:7,cursor:'pointer',fontFamily:'inherit'}}>✕ مسح</button>
          </div>
        </div>
        <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(212,175,55,.35),transparent)',margin:'7px 0 5px'}}></div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {MEMBERS.map((m,i)=>(
            <span key={i} style={{fontSize:'0.58rem',padding:'2px 8px',borderRadius:20,border:`1px solid ${active?'rgba(212,175,55,.32)':'rgba(212,175,55,.1)'}`,background:active?'rgba(212,175,55,.08)':'transparent',color:active?'#e8cc6a':'#5a5248',transition:'all .3s',whiteSpace:'nowrap'}}>
              {m.icon} {m.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:16}}>
        {msgs.length===0&&!streaming&&(
          <div style={{textAlign:'center',padding:'28px 12px'}}>
            <div style={{fontSize:'3rem',marginBottom:12,filter:'drop-shadow(0 0 16px rgba(212,175,55,.38))'}}>🔱</div>
            <div style={{fontSize:'1.2rem',fontWeight:700,color:'#e8cc6a',marginBottom:7}}>مجلس المحاسبة الاحترافي العالمي</div>
            <div style={{fontSize:'0.76rem',color:'#5a5248',fontStyle:'italic',maxWidth:420,margin:'0 auto 18px',lineHeight:1.9,borderRight:'2px solid #a0832a',paddingRight:12,textAlign:'right'}}>
              &quot;لا يُقدَّم رأي ما لم يكن مستنداً. ولا يُصدَر حكم ما لم يكن مكتملاً.&quot;<br/>
              <strong style={{color:'#d4af37'}}>— البارون محمد القرعان</strong>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:640,margin:'0 auto'}}>
              {TOPICS.map((t,i)=>(
                <span key={i} className="chip" onClick={()=>send(t.q)} style={{background:'rgba(212,175,55,.04)',border:'1px solid rgba(212,175,55,.13)',color:'#ede5cc',padding:'6px 13px',borderRadius:22,fontSize:'0.71rem',cursor:'pointer',transition:'all .2s',fontFamily:'inherit'}}>
                  {t.icon} {t.label}
                </span>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:9,flexDirection:m.role==='user'?'row-reverse':'row'}}>
            <div style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,background:m.role==='user'?'linear-gradient(135deg,#1a1a2e,#16213e)':'radial-gradient(circle,rgba(212,175,55,.14),rgba(212,175,55,.03))',border:m.role==='user'?'1px solid rgba(80,100,200,.22)':'1px solid rgba(212,175,55,.28)'}}>
              {m.role==='user'?'👤':'🔱'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.58rem',color:'#5a5248',marginBottom:3,textAlign:m.role==='user'?'left':'right'}}>{m.role==='user'?`أنت · ${curT}`:`المجلس · ${curT}`}</div>
              <div style={{padding:'12px 15px',borderRadius:m.role==='user'?'13px 4px 13px 13px':'4px 13px 13px 13px',lineHeight:1.9,fontSize:'0.84rem',background:m.role==='user'?'rgba(26,32,66,.42)':'linear-gradient(135deg,rgba(16,14,9,.97),rgba(11,10,6,.99))',color:m.role==='user'?'#b0c0e0':'#ede5cc',...bdr(m.role)}}>
                {m.role==='user'?<span>{m.content}</span>:<div dangerouslySetInnerHTML={{__html:renderMd(m.content)}}/>}
              </div>
            </div>
          </div>
        ))}
        {streaming&&(
          <div style={{display:'flex',gap:9}}>
            <div style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'radial-gradient(circle,rgba(212,175,55,.14),rgba(212,175,55,.03))',border:'1px solid rgba(212,175,55,.28)'}}>🔱</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.58rem',color:'#5a5248',marginBottom:3}}>المجلس · {curT}</div>
              <div style={{padding:'12px 15px',borderRadius:'4px 13px 13px 13px',lineHeight:1.9,fontSize:'0.84rem',background:'linear-gradient(135deg,rgba(16,14,9,.97),rgba(11,10,6,.99))',color:'#ede5cc',...bdr('assistant')}}>
                <div dangerouslySetInnerHTML={{__html:renderMd(streaming)}}/>
              </div>
            </div>
          </div>
        )}
        {loading&&!streaming&&(
          <div style={{display:'flex',gap:9}}>
            <div style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(circle,rgba(212,175,55,.14),rgba(212,175,55,.03))',border:'1px solid rgba(212,175,55,.28)'}}>🔱</div>
            <div style={{display:'flex',alignItems:'center',gap:5,padding:'12px 15px',background:'linear-gradient(135deg,rgba(16,14,9,.97),rgba(11,10,6,.99))',...bdr('assistant'),borderRadius:'4px 13px 13px 13px'}}>
              <span style={{fontSize:'0.65rem',color:'#5a5248',marginLeft:4}}>البارون يستشير...</span>
              <div className="d1" style={{width:6,height:6,background:'#d4af37',borderRadius:'50%'}}></div>
              <div className="d2" style={{width:6,height:6,background:'#d4af37',borderRadius:'50%'}}></div>
              <div className="d3" style={{width:6,height:6,background:'#d4af37',borderRadius:'50%'}}></div>
            </div>
          </div>
        )}
        {err&&<div style={{background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.22)',borderRadius:9,padding:'9px 13px',color:'rgba(239,68,68,.8)',fontSize:'0.76rem'}}>⚠️ {err}</div>}
        <div ref={endRef}/>
      </div>
                             <div style={{padding:'10px 20px 14px',background:'rgba(6,6,6,.98)',borderTop:'1px solid rgba(212,175,55,.12)',flexShrink:0}}>
        <div style={{display:'flex',gap:7,alignItems:'flex-end',background:'#0d0d0d',border:`1px solid ${focused?'rgba(212,175,55,.38)':'rgba(212,175,55,.11)'}`,borderRadius:11,padding:'8px 11px',transition:'all .2s'}}>
          <button disabled={loading||!input.trim()} onClick={()=>send()} style={{width:36,height:36,background:loading||!input.trim()?'rgba(212,175,55,.12)':'linear-gradient(135deg,#a0832a,#d4af37)',border:'none',borderRadius:8,cursor:loading||!input.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',flexShrink:0,opacity:loading||!input.trim()?0.45:1}}>➤</button>
          <textarea ref={taRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();send();}}}
            onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';}}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="اطرح سؤالك على المجلس…" rows={1}
            style={{flex:1,background:'none',border:'none',outline:'none',color:'#ede5cc',fontFamily:'inherit',fontSize:'0.84rem',lineHeight:1.7,resize:'none',direction:'rtl',textAlign:'right',maxHeight:120,minHeight:22}}/>
        </div>
        <div style={{display:'flex',gap:7,marginTop:5}}>
          <span style={{fontSize:'0.58rem',padding:'2px 8px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)',background:'rgba(34,197,94,.04)',color:'#22c55e'}}>{status}</span>
          <span style={{fontSize:'0.58rem',padding:'2px 8px',borderRadius:20,border:'1px solid rgba(212,175,55,.2)',background:'rgba(212,175,55,.04)',color:'#e8cc6a'}}>{level}</span>
        </div>
      </div>
    </div>
  );
                        }                
    
