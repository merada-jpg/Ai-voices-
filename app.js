const t=document.querySelector("#text"),v=document.querySelector("#voice"),r=document.querySelector("#rate"),p=document.querySelector("#pitch"),vol=document.querySelector("#volume"),c=document.querySelector("#counter"),s=document.querySelector("#support"),statusText=document.querySelector("#statusText");
let voices=[],androidReady=false;
function count(){c.textContent=t.value.length+" / 5000"}
function load(){if(!("speechSynthesis"in window))return;voices=speechSynthesis.getVoices();v.innerHTML="";const a=voices.filter(x=>/^ar([_-]|$)/i.test(x.lang));[...a,...voices.filter(x=>!a.includes(x))].forEach(x=>{const o=document.createElement("option");o.value=voices.indexOf(x);o.textContent=x.name+" — "+x.lang;v.appendChild(o)});if(a[0])v.value=voices.indexOf(a[0])}
window.androidTtsReady=function(ok){androidReady=ok;if(ok){s.textContent="✓ محرك الصوت تاع Android راهو واجد";s.className="support ok";statusText.textContent="راه يخدم على الجهاز"}};
function speak(){const text=t.value.trim();if(!text){t.focus();return}if(androidReady&&window.AndroidTts){window.AndroidTts.speak(text,+r.value,+p.value,+vol.value);return}if("speechSynthesis"in window){const u=new SpeechSynthesisUtterance(text);if(voices[v.value])u.voice=voices[v.value];u.rate=+r.value;u.pitch=+p.value;u.volume=+vol.value;speechSynthesis.cancel();speechSynthesis.speak(u)}}
function stop(){if(androidReady&&window.AndroidTts)window.AndroidTts.stop();else if("speechSynthesis"in window)speechSynthesis.cancel()}
t.addEventListener("input",count);
document.querySelector("#clearBtn").onclick=()=>{stop();t.value="";count();t.focus()};
document.querySelector("#speakBtn").onclick=speak;
document.querySelector("#pauseBtn").onclick=()=>androidReady?window.AndroidTts.stop():(speechSynthesis.paused?speechSynthesis.resume():speechSynthesis.pause());
document.querySelector("#stopBtn").onclick=stop;
r.oninput=()=>document.querySelector("#rateValue").textContent=(+r.value).toFixed(1)+"×";
p.oninput=()=>document.querySelector("#pitchValue").textContent=(+p.value).toFixed(1);
vol.oninput=()=>document.querySelector("#volumeValue").textContent=Math.round(+vol.value*100)+"%";
t.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();speak()}});
if("speechSynthesis"in window){s.textContent="✓ تحويل النص للصوت متوفر";s.className="support ok";load();speechSynthesis.onvoiceschanged=load}else{s.textContent="لازم متصفح يدعم تحويل النص للصوت، أو استعمل تطبيق Android";s.className="support bad"}
count();