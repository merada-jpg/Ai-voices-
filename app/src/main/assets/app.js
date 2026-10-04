const t=document.querySelector("#text"),v=document.querySelector("#voice"),r=document.querySelector("#rate"),p=document.querySelector("#pitch"),vol=document.querySelector("#volume"),c=document.querySelector("#counter"),s=document.querySelector("#support");
let voices=[],androidReady=false;
function count(){c.textContent=t.value.length+" / 5000"}
function load(){if(!("speechSynthesis"in window))return;voices=speechSynthesis.getVoices();v.innerHTML="";const a=voices.filter(x=>/^ar([_-]|$)/i.test(x.lang));[...a,...voices.filter(x=>!a.includes(x))].forEach(x=>{const o=document.createElement("option");o.value=voices.indexOf(x);o.textContent=x.name+" — "+x.lang;v.appendChild(o)});if(a[0])v.value=voices.indexOf(a[0])}
window.androidTtsReady=function(ok){androidReady=ok;if(ok)s.textContent="✓ محرك Android TTS جاهز";};
function speak(){const text=t.value.trim();if(!text)return;if(androidReady&&window.AndroidTts){window.AndroidTts.speak(text,Number(r.value),Number(p.value),Number(vol.value));return}if("speechSynthesis"in window){const u=new SpeechSynthesisUtterance(text);if(voices[v.value])u.voice=voices[v.value];u.rate=+r.value;u.pitch=+p.value;u.volume=+vol.value;speechSynthesis.cancel();speechSynthesis.speak(u)}}
t.addEventListener("input",count);
document.querySelector("#speakBtn").onclick=speak;
document.querySelector("#pauseBtn").onclick=()=>androidReady?window.AndroidTts.stop():(speechSynthesis.paused?speechSynthesis.resume():speechSynthesis.pause());
document.querySelector("#stopBtn").onclick=()=>androidReady?window.AndroidTts.stop():speechSynthesis.cancel();
r.oninput=()=>document.querySelector("#rateValue").textContent=(+r.value).toFixed(1)+"×";
p.oninput=()=>document.querySelector("#pitchValue").textContent=(+p.value).toFixed(1);
vol.oninput=()=>document.querySelector("#volumeValue").textContent=Math.round(+vol.value*100)+"%";
if("speechSynthesis"in window){s.textContent="✓ تحويل الصوت متاح";load();speechSynthesis.onvoiceschanged=load}else{s.textContent="محرك Android TTS أو متصفح يدعم تحويل النص إلى كلام مطلوب"}
count();