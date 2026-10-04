const $ = (selector) => document.querySelector(selector);

const textInput = $("#text");
const voiceSelect = $("#voice");
const rateInput = $("#rate");
const pitchInput = $("#pitch");
const volumeInput = $("#volume");
const counter = $("#counter");
const support = $("#support");
const statusText = $("#statusText");
const speakBtn = $("#speakBtn");
const pauseBtn = $("#pauseBtn");
const stopBtn = $("#stopBtn");
const downloadBtn = $("#downloadBtn");
const player = $("#player");
const playerTitle = $("#playerTitle");
const playerMeta = $("#playerMeta");
const historyList = $("#historyList");

const HISTORY_KEY = "ai-voices-history";
const MAX_HISTORY = 8;
const MAX_TEXT = 5000;

let state = {
  audio: null,
  objectUrl: null,
  busy: false,
  generatedVoice: null,
  generatedText: "",
  nativePlaying: false
};

function count() {
  counter.textContent = `${textInput.value.length} / ${MAX_TEXT}`;
}

function setStatus(message, kind = "") {
  support.textContent = message;
  support.className = `support ${kind}`;
}

function setBusy(value) {
  state.busy = value;
  speakBtn.disabled = value;
  pauseBtn.disabled = value || !state.audio;
  stopBtn.disabled = value || (!state.audio && !state.nativePlaying);
}

function releaseAudio() {
  if (state.audio) {
    state.audio.pause();
    state.audio.removeAttribute("src");
    state.audio.load();
    state.audio = null;
  }

  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = null;
  }

  downloadBtn.disabled = true;
  pauseBtn.disabled = state.busy;
  stopBtn.disabled = state.busy || !state.nativePlaying;
}

function resetPlaybackControls() {
  pauseBtn.textContent = "⏸ حبّس مؤقت";
  pauseBtn.disabled = state.busy || !state.audio;
  stopBtn.disabled = state.busy || (!state.audio && !state.nativePlaying);
  player.hidden = true;
}

function stopPlayback(message = "توقف الصوت") {
  releaseAudio();
  if (state.nativePlaying && window.AndroidTts) {
    window.AndroidTts.stop();
    state.nativePlaying = false;
  }
  resetPlaybackControls();
  setStatus(message);
  statusText.textContent = "Gemini TTS";
}

function readHistory() {
  try {
    const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

function saveHistory(item) {
  const items = readHistory();
  items.unshift(item);
  writeHistory(items);
  renderHistory();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[match]));
}

function renderHistory() {
  const items = readHistory();

  if (!items.length) {
    historyList.innerHTML =
      '<div class="empty">مازال ما ولّدنا حتى صوت. أول تجربة راح تظهر هنا.</div>';
    return;
  }

  historyList.innerHTML = items.map((item, index) => `
    <button class="history-item" type="button" data-index="${index}">
      <span>🎙️</span>
      <div>
        <b>${escapeHtml(item.voice)}</b>
        <small>${escapeHtml(item.text.slice(0, 80))}${item.text.length > 80 ? "…" : ""}</small>
      </div>
      <em>${escapeHtml(item.time)}</em>
    </button>
  `).join("");
}

function syncVoiceCards() {
  document.querySelectorAll(".voice-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.voice === voiceSelect.value);
  });
}

function syncAudioSettings() {
  if (!state.audio) return;
  state.audio.playbackRate = Number(rateInput.value);
  state.audio.volume = Number(volumeInput.value);
}

function updateSettingsLabels() {
  $("#rateValue").textContent = `${Number(rateInput.value).toFixed(2)}×`;
  $("#pitchValue").textContent = Number(pitchInput.value).toFixed(2);
  $("#volumeValue").textContent = `${Math.round(Number(volumeInput.value) * 100)}%`;
  syncAudioSettings();
}

async function speak() {
  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    setStatus("اكتب النص قبل ما تولّد الصوت.", "bad");
    return;
  }

  if (text.length > MAX_TEXT) {
    setStatus(`النص طويل بزاف. الحد الأقصى هو ${MAX_TEXT} حرف.`, "bad");
    return;
  }

  if (state.busy) return;

  setBusy(true);
  releaseAudio();
  if (state.nativePlaying && window.AndroidTts) {
    window.AndroidTts.stop();
    state.nativePlaying = false;
  }
  setStatus("⏳ راهو يولّد الصوت...", "loading");
  statusText.textContent = "جاري التوليد";

  try {
    if (window.AndroidTts && window.androidTtsReadyState === true) {
      window.AndroidTts.speak(
        text,
        Number(rateInput.value),
        Number(pitchInput.value),
        Number(volumeInput.value)
      );
      state.generatedVoice = voiceSelect.value;
      state.generatedText = text;
      state.nativePlaying = true;
      player.hidden = false;
      playerTitle.textContent = `تشغيل Android · ${state.generatedVoice}`;
      playerMeta.textContent = `${text.length} حرف · محرك Android`;
      pauseBtn.disabled = true;
      stopBtn.disabled = false;
      downloadBtn.disabled = true;
      setStatus("▶ راهو يتشغّل بمحرك Android", "ok");
      statusText.textContent = `${state.generatedVoice} · Android TTS`;
      saveHistory({
        voice: state.generatedVoice,
        text,
        time: new Date().toLocaleTimeString("ar-DZ", {
          hour: "2-digit",
          minute: "2-digit"
        })
      });
      return;
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: voiceSelect.value,
        pitch: Number(pitchInput.value)
      })
    });

    if (!response.ok) {
      let message = "صار مشكل في توليد الصوت";
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch {}
      throw new Error(message);
    }

    const mimeType = (response.headers.get("content-type") || "audio/wav").split(";")[0].trim();
    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("ما رجع حتى ملف صوتي");
    }

    state.objectUrl = URL.createObjectURL(
      new Blob([blob], { type: mimeType })
    );
    state.audio = new Audio(state.objectUrl);
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    state.generatedVoice = voiceSelect.value;
    state.generatedText = text;

    syncAudioSettings();

    player.hidden = false;
    playerTitle.textContent = `آخر توليد · ${state.generatedVoice}`;
    playerMeta.textContent = `${text.length} حرف · ${mimeType.split(";")[0].toUpperCase()}`;

    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
      if (!state.objectUrl) return;
      const link = document.createElement("a");
      link.href = state.objectUrl;
      const extension = mimeType.includes("mpeg") ? "mp3"
        : mimeType.includes("ogg") ? "ogg"
        : mimeType.includes("webm") ? "webm"
        : "wav";
      link.download = `ai-voices-${state.generatedVoice.toLowerCase()}.${extension}`;
      link.click();
    };

    state.audio.onended = () => {
      pauseBtn.textContent = "⏸ حبّس مؤقت";
      setStatus("✓ الصوت واجد", "ok");
      statusText.textContent = "الصوت واجد";
    };

    state.audio.onerror = () => {
      releaseAudio();
      resetPlaybackControls();
      setStatus("تعذر تشغيل الملف الصوتي", "bad");
      statusText.textContent = "كاين مشكل";
    };

    await state.audio.play();

    setStatus(`▶ راهو يتشغّل بـ ${state.generatedVoice}`, "ok");
    statusText.textContent = `${state.generatedVoice} · Gemini TTS`;

    saveHistory({
      voice: state.generatedVoice,
      text,
      time: new Date().toLocaleTimeString("ar-DZ", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  } catch (error) {
    releaseAudio();
    resetPlaybackControls();
    setStatus(`✕ ${error.message || "تعذر توليد الصوت"}`, "bad");
    statusText.textContent = "كاين مشكل";
  } finally {
    setBusy(false);
  }
}

textInput.addEventListener("input", count);

$("#clearBtn").addEventListener("click", () => {
  stopPlayback("النص تفرغ");
  textInput.value = "";
  count();
  textInput.focus();
});

speakBtn.addEventListener("click", speak);

pauseBtn.addEventListener("click", async () => {
  if (state.nativePlaying) {
    setStatus("محرك Android ما يدعمش الإيقاف المؤقت من الواجهة.", "");
    return;
  }
  if (!state.audio) return;

  if (state.audio.paused) {
    try {
      await state.audio.play();
      pauseBtn.textContent = "⏸ حبّس مؤقت";
      setStatus("▶ راهو يتشغّل", "ok");
    } catch {
      setStatus("تعذر مواصلة التشغيل", "bad");
    }
  } else {
    state.audio.pause();
    pauseBtn.textContent = "▶ كمّل";
    setStatus("⏸ الصوت محبوس مؤقتًا");
  }
});

stopBtn.addEventListener("click", () => stopPlayback());

rateInput.addEventListener("input", updateSettingsLabels);
pitchInput.addEventListener("input", updateSettingsLabels);
volumeInput.addEventListener("input", updateSettingsLabels);

voiceSelect.addEventListener("change", syncVoiceCards);

document.querySelectorAll(".voice-card").forEach((card) => {
  card.addEventListener("click", () => {
    voiceSelect.value = card.dataset.voice;
    syncVoiceCards();
    $("#studio").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

window.androidTtsReady = (ready) => {
  window.androidTtsReadyState = Boolean(ready);
  if (ready) {
    setStatus("✓ محرك Android TTS واجد", "ok");
    statusText.textContent = "Android TTS واجد";
  }
};

$("#clearHistory").addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

historyList.addEventListener("click", (event) => {
  const item = event.target.closest(".history-item");
  if (!item) return;

  const record = readHistory()[Number(item.dataset.index)];
  if (!record) return;

  textInput.value = record.text.slice(0, MAX_TEXT);
  if ([...voiceSelect.options].some((option) => option.value === record.voice)) {
    voiceSelect.value = record.voice;
  }
  syncVoiceCards();
  count();
  $("#studio").scrollIntoView({ behavior: "smooth", block: "start" });
  setStatus("رجّعت النص من السجل. اضغط «ولّد الصوت» باش تعاود التوليد.", "ok");
});

textInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    speak();
  }
});

window.addEventListener("beforeunload", releaseAudio);

count();
updateSettingsLabels();
syncVoiceCards();
renderHistory();
resetPlaybackControls();
