const $=s=>document.querySelector(s);
const t=$("#text"),v=$("#voice"),r=$("#rate"),p=$("#pitch"),vol=$("#volume"),c=$("#counter");
const support=$("#support"),statusText=$("#statusText"),speakBtn=$("#speakBtn"),pauseBtn=$("#pauseBtn"),stopBtn=$("#stopBtn"),downloadBtn=$("#downloadBtn"),player=$("#player"),playerTitle=$("#playerTitle"),playerMeta=$("#playerMeta"),historyList=$("#historyList");
let audio=null,audioUrl=null,busy=false;

function count(){c.textContent=t.value.length+" / 5000"}
function setStatus(message,kind=""){support.textContent=message;support.className="support "+kind}
function stopAudio(){if(audio){audio.pause();audio.currentTime=0;audio=null}if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}downloadBtn.disabled=true}
function saveHistory(item){const items=JSON.parse(localStorage.getItem("ai-voices-history")||"[]");items.unshift(item);localStorage.setItem("ai-voices-history",JSON.stringify(items.slice(0,8)));renderHistory()}
function renderHistory(){const items=JSON.parse(localStorage.getItem("ai-voices-history")||"[]");if(!items.length){historyList.innerHTML='<div class="empty">مازال ما ولّدنا حتى صوت. أول تجربة راح تظهر هنا.</div>';return}historyList.innerHTML=items.map((x,i)=>'<button class="history-item" data-i="'+i+'"><span>🎙️</span><div><b>'+escapeHtml(x.voice)+'</b><small>'+escapeHtml(x.text.slice(0,80))+(x.text.length>80?"…":"")+'</small></div><em>'+escapeHtml(x.time)+'</em></button>').join("")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function speak(){
 const text=t.value.trim(); if(!text){t.focus();return} if(busy)return;
 busy=true;speakBtn.disabled=true;setStatus("⏳ راهو يولّد الصوت...","loading");statusText.textContent="جاري التوليد";stopAudio();
 try{
  const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,voice:v.value,rate:+r.value,pitch:+p.value})});
  if(!response.ok){let msg="صار مشكل في توليد الصوت";try{const d=await response.json();if(d.error)msg=d.error}catch{}throw new Error(msg)}
  const blob=await response.blob();if(!blob.size)throw new Error("ما رجع حتى ملف صوتي");
  audioUrl=URL.createObjectURL(blob);audio=new Audio(audioUrl);audio.volume=+vol.value;audio.playbackRate=+r.value;
  player.hidden=false;playerTitle.textContent="آخر توليد · "+v.value;playerMeta.textContent=(text.length+" حرف")+" · WAV";
  downloadBtn.disabled=false;downloadBtn.onclick=()=>{const a=document.createElement("a");a.href=audioUrl;a.download="ai-voices-"+v.value.toLowerCase()+".wav";a.click()};
  audio.onended=()=>{setStatus("✓ الصوت واجد","ok");statusText.textContent="الصوت واجد";speakBtn.disabled=false;pauseBtn.textContent="⏸ حبّس مؤقت"};
  audio.onerror=()=>{setStatus("تعذر تشغيل الملف الصوتي","bad");speakBtn.disabled=false};
  await audio.play();setStatus("▶ راهو يتشغّل بـ "+v.value,"ok");statusText.textContent=v.value+" · Gemini TTS";
  saveHistory({voice:v.value,text,time:new Date().toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit"})});
 }catch(error){setStatus("✕ "+(error.message||"تعذر توليد الصوت"),"bad");statusText.textContent="كاين مشكل"}
 finally{busy=false;speakBtn.disabled=false}
}
function update(){if(audio){audio.playbackRate=+r.value;audio.volume=+vol.value}}
t.addEventListener("input",count);$("#clearBtn").onclick=()=>{stopAudio();t.value="";count();t.focus()};
speakBtn.onclick=speak;pauseBtn.onclick=()=>{if(!audio)return;if(audio.paused){audio.play();pauseBtn.textContent="⏸ حبّس مؤقت"}else{audio.pause();pauseBtn.textContent="▶ كمّل"}};
stopBtn.onclick=()=>{stopAudio();pauseBtn.textContent="⏸ حبّس مؤقت";setStatus("توقف الصوت","")};
r.oninput=()=>{$("#rateValue").textContent=(+r.value).toFixed(2)+"×";update()};p.oninput=()=>$("#pitchValue").textContent=(+p.value).toFixed(2);vol.oninput=()=>{$("#volumeValue").textContent=Math.round(+vol.value*100)+"%";update()};
v.onchange=()=>document.querySelectorAll(".voice-card").forEach(x=>x.classList.toggle("active",x.dataset.voice===v.value));
document.querySelectorAll(".voice-card").forEach(x=>x.onclick=()=>{v.value=x.dataset.voice;v.dispatchEvent(new Event("change"));document.querySelector("#studio").scrollIntoView({behavior:"smooth",block:"start"})});
$("#clearHistory").onclick=()=>{localStorage.removeItem("ai-voices-history");renderHistory()};
t.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();speak()}});
count();renderHistory();