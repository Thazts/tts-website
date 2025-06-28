// === Persistent Text Storage ===
const textInput = document.getElementById('text-input');
const LS_KEY = 'tts-text';
textInput.value = localStorage.getItem(LS_KEY) || '';
textInput.addEventListener('input', () => {
  localStorage.setItem(LS_KEY, textInput.value);
});

// === Pitch & Volume Controls ===
const controlsDiv = document.querySelector('.controls');
const pitchSlider = document.createElement('input');
pitchSlider.type = 'range';
pitchSlider.min = 0;
pitchSlider.max = 2;
pitchSlider.step = 0.01;
pitchSlider.value = 1;
pitchSlider.title = 'Pitch';
pitchSlider.style.width = '80px';
pitchSlider.id = 'pitch-slider';

const volumeSlider = document.createElement('input');
volumeSlider.type = 'range';
volumeSlider.min = 0;
volumeSlider.max = 1;
volumeSlider.step = 0.01;
volumeSlider.value = 1;
volumeSlider.title = 'Volume';
volumeSlider.style.width = '80px';
volumeSlider.id = 'volume-slider';

const pitchLabel = document.createElement('label');
pitchLabel.textContent = 'Pitch';
pitchLabel.htmlFor = 'pitch-slider';
pitchLabel.style.marginLeft = '10px';

const volumeLabel = document.createElement('label');
volumeLabel.textContent = 'Volume';
volumeLabel.htmlFor = 'volume-slider';
volumeLabel.style.marginLeft = '10px';

controlsDiv.appendChild(pitchLabel);
controlsDiv.appendChild(pitchSlider);
controlsDiv.appendChild(volumeLabel);
controlsDiv.appendChild(volumeSlider);

// === Download Speech as Audio (Experimental) ===
const recordBtn = document.createElement('button');
recordBtn.textContent = 'Record & Download';
recordBtn.type = 'button';
recordBtn.style.marginLeft = '10px';
controlsDiv.appendChild(recordBtn);

let mediaRecorder, audioChunks = [];
recordBtn.addEventListener('click', async () => {
  if (!window.MediaRecorder) {
    alert('Recording not supported in this browser.');
    return;
  }
  // Use SpeechSynthesisUtterance and capture via Web Audio API
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(textInput.value);
  utter.voice = voices[voiceSelect.value] || voices[0];
  utter.pitch = parseFloat(pitchSlider.value);
  utter.volume = parseFloat(volumeSlider.value);
  utter.rate = 1;

  // Setup audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();
  const synthNode = audioCtx.createOscillator(); // Dummy node to keep context alive

  // Patch speechSynthesis to output to destination
  window.speechSynthesis.speak(utter);
  // NOTE: Real browser support for capturing speechSynthesis output is limited.
  // This is a placeholder for future browser support or polyfills.

  // Fallback: Notify user
  alert('Sorry, direct speech download is not supported in most browsers yet. Try using a screen recorder or browser extension.');
});

// === Auto-scroll Highlight ===
const highlightSpan = document.createElement('span');
highlightSpan.style.background = 'rgba(79,140,255,0.25)';
highlightSpan.style.borderRadius = '4px';

let lastHighlight = null;
function highlightWord(start, end) {
  const text = textInput.value;
  if (lastHighlight !== null) {
    textInput.value = text; // Remove previous highlight
  }
  if (start < end && end <= text.length) {
    textInput.setSelectionRange(start, end);
    textInput.focus();
    lastHighlight = [start, end];
  }
}

// === Theme Auto-switch ===
function autoTheme() {
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if (prefersLight) {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '🌞';
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.textContent = '🌙';
  }
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', autoTheme);
window.addEventListener('DOMContentLoaded', autoTheme);

// === Keyboard Shortcuts ===
document.addEventListener('keydown', (e) => {
  if (e.target === textInput) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        resumeBtn.click();
      } else {
        pauseBtn.click();
      }
    } else {
      speakBtn.click();
    }
  }
  if (e.key.toLowerCase() === 's') {
    stopBtn.click();
  }
  if (e.key.toLowerCase() === 'c') {
    clearBtn.click();
  }
});

// === Multiple Languages & Dialects ===
const langSelect = document.createElement('select');
langSelect.id = 'lang-select';
langSelect.style.minWidth = '120px';
langSelect.style.marginRight = '10px';
controlsDiv.insertBefore(langSelect, voiceSelect);

function populateLanguages() {
  const langs = new Set();
  voices.forEach(v => langs.add(v.lang));
  langSelect.innerHTML = '';
  Array.from(langs).sort().forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang;
    langSelect.appendChild(opt);
  });
}
langSelect.addEventListener('change', () => {
  const selectedLang = langSelect.value;
  voiceSelect.innerHTML = '';
  voices.filter(v => v.lang === selectedLang).forEach((voice, i) => {
    const option = document.createElement('option');
    option.value = voices.indexOf(voice);
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [default]' : ''}`;
    voiceSelect.appendChild(option);
  });
});

// === Save Favorite Voices ===
const favBtn = document.createElement('button');
favBtn.textContent = '★';
favBtn.title = 'Save as favorite voice';
favBtn.type = 'button';
favBtn.style.marginLeft = '10px';
controlsDiv.appendChild(favBtn);

const FAV_KEY = 'tts-fav-voice';
favBtn.addEventListener('click', () => {
  localStorage.setItem(FAV_KEY, voiceSelect.value);
  favBtn.textContent = '★ Saved';
  setTimeout(() => favBtn.textContent = '★', 1200);
});
window.addEventListener('DOMContentLoaded', () => {
  const fav = localStorage.getItem(FAV_KEY);
  if (fav && voiceSelect.options[fav]) {
    voiceSelect.value = fav;
  }
});

// === Integrate with main speech logic ===
function updateUtteranceSettings(utter) {
  utter.pitch = parseFloat(pitchSlider.value);
  utter.volume = parseFloat(volumeSlider.value);
  utter.lang = voices[voiceSelect.value]?.lang || utter.lang;
}

// Patch speakFrom to use pitch/volume/lang and highlight
if (typeof speakFrom === 'function') {
  const origSpeakFrom = speakFrom;
  window.speakFrom = function(charIndex = 0, newVoiceIndex = null) {
    if (!currentText) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(currentText.slice(charIndex));
      const selectedVoice = voices[newVoiceIndex !== null ? newVoiceIndex : voiceSelect.value] || voices[0];
      if (selectedVoice) utterance.voice = selectedVoice;
      updateUtteranceSettings(utterance);

      utterance.onboundary = (event) => {
        if (event.charIndex !== undefined && utterance.text.length > 0) {
          currentCharIndex = charIndex + event.charIndex;
          highlightWord(currentCharIndex, currentCharIndex + event.charLength || 1);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };
}

// Update voices and languages when available
if (typeof populateVoices === 'function') {
  const origPopulateVoices = populateVoices;
  window.populateVoices = function() {
    origPopulateVoices();
    populateLanguages();
    // Restore favorite voice if available
    const fav = localStorage.getItem(FAV_KEY);
    if (fav && voiceSelect.options[fav]) {
      voiceSelect.value = fav;
    }
  };
}

// Initial population
if (typeof populateVoices === 'function') {
  populateVoices();
}