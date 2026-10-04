const t=document.querySelector("#text"),v=document.querySelector("#voice"),r=document.querySelector("#rate"),p=document.querySelector("#pitch"),vol=document.querySelector("#volume"),c=document.querySelector("#counter"),s=document.querySelector("#support"),statusText=document.querySelector("#statusText"),speakBtn=document.querySelector("#speakBtn"),pauseBtn=document.querySelector("#pauseBtn"),stopBtn=document.querySelector("#stopBtn"),downloadBtn=document.querySelector("#downloadBtn"),hint=document.querySelector("#hint");
let audio=null,audioUrl=null,busy=false;

function count(){c.textContent=t.value.length+" / 5000"}

function setStatus(message,kind=""){
  s.textContent=message;
  s.className="support"+(kind?" "+kind:"");
}

function stopAudio(){
  if(audio){audio.pause();audio.currentTime=0;audio=null}
  if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}
  downloadBtn.disabled=true;
}

async function speak(){
  const text=t.value.trim();
  if(!text){t.focus();return}
  if(busy)return;
  busy=true;
  speakBtn.disabled=true;
  setStatus("⏳ راهو يولّد الصوت...","loading");
  statusText.textContent="جاري التوليد";
  stopAudio();

  try{
    const response=await fetch("/api/generate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        text,
        voice:v.value,
        rate:Number(r.value),
        pitch:Number(p.value)
      })
    });
    if(!response.ok){
      let message="صار مشكل في توليد الصوت";
      try{const data=await response.json();if(data.error)message=data.error}catch{}
      throw new Error(message);
    }

    const blob=await response.blob();
    if(!blob.size)throw new Error("ما رجع حتى ملف صوتي");
    audioUrl=URL.createObjectURL(blob);
    audio=new Audio(audioUrl);
    audio.volume=Number(vol.value);
    audio.playbackRate=Number(r.value);
    audio.onended=()=>{setStatus("✓ الصوت واجد","ok");statusText.textContent="الصوت واجد";speakBtn.disabled=false};
    audio.onerror=()=>{setStatus("تعذر تشغيل الملف الصوتي","bad");speakBtn.disabled=false};
    downloadBtn.disabled=false;
    downloadBtn.onclick=()=>{
      const a=document.createElement("a");
      a.href=audioUrl;a.download="ai-voices-"+v.value.toLowerCase()+".wav";a.click();
    };
    await audio.play();
    setStatus("▶ راهو يتشغّل بالصوت المختار","ok");
    statusText.textContent=v.value+" · Gemini TTS";
  }catch(error){
    setStatus("✕ "+(error.message||"تعذر توليد الصوت"),"bad");
    statusText.textContent="كاين مشكل";
  }finally{
    busy=false;
    speakBtn.disabled=false;
  }
}

function updateAudioSettings(){
  if(audio){
    audio.playbackRate=Number(r.value);
    audio.volume=Number(vol.value);
  }
}

t.addEventListener("input",count);
document.querySelector("#clearBtn").onclick=()=>{stopAudio();t.value="";count();t.focus()};
speakBtn.onclick=speak;
pauseBtn.onclick=()=>{
  if(!audio)return;
  if(audio.paused){audio.play();pauseBtn.textContent="⏸ حبّس مؤقت"}
  else{audio.pause();pauseBtn.textContent="▶ كمّل"}
};
stopBtn.onclick=()=>{stopAudio();pauseBtn.textContent="⏸ حبّس مؤقت";setStatus("توقف الصوت","")};
r.oninput=()=>{document.querySelector("#rateValue").textContent=(+r.value).toFixed(2)+"×";updateAudioSettings()};
p.oninput=()=>document.querySelector("#pitchValue").textContent=(+p.value).toFixed(2);
vol.oninput=()=>{document.querySelector("#volumeValue").textContent=Math.round(+vol.value*100)+"%";updateAudioSettings()};
t.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();speak()}});

setStatus("✓ Gemini TTS واجد","ok");
statusText.textContent="Gemini TTS";
count();