const textEl=document.querySelector("#text");const voiceEl=document.querySelector("#voice");const rateEl=document.querySelector("#rate");const pitchEl=document.querySelector("#pitch");const volumeEl=document.querySelector("#volume");const counter=document.querySelector("#counter");const support=document.querySelector("#support");let voices=[];

function updateCounter(){counter.textContent=`${textEl.value.length} / 5000`}
function loadVoices(){voices=window.speechSynthesis?.getVoices?.()||[];voiceEl.innerHTML="";const arabic=voices.filter(v=>/^ar([_-]|$)/i.test(v.lang));const ordered=[...arabic,...voices.filter(v=>!arabic.includes(v))];ordered.forEach((v,i)=>{const o=document.createElement("option");o.value=voices.indexOf(v);o.textContent=`${v.name} — ${v.lang}`;voiceEl.appendChild(o)});if(arabic.length)voiceEl.value=String(voices.indexOf(arabic[0]))}
function speak(){const value=textEl.value.trim();if(!value)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(value);const v=voices[Number(voiceEl.value)];if(v)u.voice=v;u.rate=Number(rateEl.value);u.pitch=Number(pitchEl.value);u.volume=Number(volumeEl.value);window.speechSynthesis.speak(u)}
function setOutput(id,value){document.querySelector(id).textContent=value}
textEl.addEventListener("input",updateCounter);
document.querySelector("#clearBtn").addEventListener("click",()=>{textEl.value="";updateCounter();textEl.focus()});
document.querySelector("#speakBtn").addEventListener("click",speak);
document.querySelector("#pauseBtn").addEventListener("click",()=>window.speechSynthesis?.paused?window.speechSynthesis.resume():window.speechSynthesis?.pause());
document.querySelector("#stopBtn").addEventListener("click",()=>window.speechSynthesis?.cancel());
rateEl.addEventListener("input",()=>setOutput("#rateValue",Number(rateEl.value).toFixed(1)+"×"));
pitchEl.addEventListener("input",()=>setOutput("#pitchValue",Number(pitchEl.value).toFixed(1)));
volumeEl.addEventListener("input",()=>setOutput("#volumeValue",Math.round(Number(volumeEl.value)*100)+"%"));
if("speechSynthesis" in window){support.textContent="✓ تحويل الصوت متاح في هذا المتصفح.";support.classList.add("ok");loadVoices();window.speechSynthesis.addEventListener("voiceschanged",loadVoices)}else{support.textContent="✕ متصفحك لا يدعم Web Speech API.";support.classList.add("bad");document.querySelector("#speakBtn").disabled=true}
updateCounter();