const MAX_CHARACTERS = 500;

const textInput = document.querySelector('#speech-text');
const characterCount = document.querySelector('#character-count');
const characterCurrent = document.querySelector('#character-current');
const speakButton = document.querySelector('#speak-button');
const stopButton = document.querySelector('#stop-button');
const clearButton = document.querySelector('#clear-button');
const voiceSelect = document.querySelector('#voice-select');
const speedSlider = document.querySelector('#speed-slider');
const speedValue = document.querySelector('#speed-value');
const volumeSlider = document.querySelector('#volume-slider');
const volumeValue = document.querySelector('#volume-value');
const statusLine = document.querySelector('.status-line');
const statusMessage = document.querySelector('#status-message');

let voices = [];
let isSpeaking = false;

function setStatus(message, state = '') {
  statusMessage.textContent = message;
  statusLine.classList.remove('is-speaking', 'is-error', 'is-finished');

  if (state) {
    statusLine.classList.add(`is-${state}`);
  }
}

function updateCharacterCount() {
  const count = Array.from(textInput.value).length;

  characterCurrent.textContent = count;

  characterCount.setAttribute(
    'aria-label',
    `${count} of ${MAX_CHARACTERS} characters`,
  );
}

function setBusy(isBusy) {
  isSpeaking = isBusy;
  speakButton.disabled = isBusy;
  stopButton.disabled = !isBusy;
}

function loadVoices() {
  if (!('speechSynthesis' in window)) {
    voiceSelect.replaceChildren(new Option('Speech not supported', ''));
    voiceSelect.disabled = true;

    setStatus('Speech synthesis is not supported on this browser.', 'error');

    return;
  }

  voices = window.speechSynthesis.getVoices();

  voiceSelect.replaceChildren();

  if (voices.length === 0) {
    voiceSelect.add(new Option('Loading voices...', ''));
    return;
  }

  voices.forEach((voice, index) => {
    const option = new Option(`${voice.name} (${voice.lang})`, index);

    voiceSelect.add(option);
  });

  voiceSelect.disabled = false;
}

function getSpeechRate() {
  const wpm = Number(speedSlider.value);

  // Convert 100-250 WPM into a natural speechSynthesis rate.
  return 0.6 + ((wpm - 100) / 150) * 0.9;
}

function speak() {
  const text = textInput.value;
  const characterLength = Array.from(text).length;

  if (!text.trim()) {
    setStatus('Enter some text before speaking.', 'error');
    textInput.focus();
    return;
  }

  if (characterLength > MAX_CHARACTERS) {
    setStatus('Text must be 500 characters or fewer.', 'error');
    return;
  }

  if (!('speechSynthesis' in window)) {
    setStatus('Speech synthesis is not supported on this browser.', 'error');
    return;
  }

  // Stop any previous speech.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Selected voice.
  const selectedIndex = Number(voiceSelect.value);

  if (!Number.isNaN(selectedIndex) && voices[selectedIndex]) {
    utterance.voice = voices[selectedIndex];
  }

  // Speech speed.
  utterance.rate = getSpeechRate();

  // Volume.
  utterance.volume = Number(volumeSlider.value) / 100;

  utterance.pitch = 1;

  utterance.onstart = () => {
    setBusy(true);
    setStatus('Speaking...', 'speaking');
  };

  utterance.onend = () => {
    setBusy(false);
    setStatus('Finished', 'finished');
  };

  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') {
      return;
    }

    setBusy(false);
    setStatus('Speech playback failed. Please try again.', 'error');
  };

  setBusy(true);
  setStatus('Speaking...', 'speaking');

  window.speechSynthesis.speak(utterance);
}

function stop() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  setBusy(false);
  setStatus('Stopped');
}

textInput.addEventListener('input', () => {
  const characters = Array.from(textInput.value);

  if (characters.length > MAX_CHARACTERS) {
    textInput.value = characters.slice(0, MAX_CHARACTERS).join('');
  }

  updateCharacterCount();

  if (statusLine.classList.contains('is-error')) {
    setStatus('Ready to speak');
  }
});

speakButton.addEventListener('click', speak);

stopButton.addEventListener('click', stop);

clearButton.addEventListener('click', () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  textInput.value = '';

  updateCharacterCount();

  setBusy(false);
  setStatus('Ready to speak');

  textInput.focus();
});

speedSlider.addEventListener('input', () => {
  speedValue.textContent = `${speedSlider.value} WPM`;
});

volumeSlider.addEventListener('input', () => {
  volumeValue.textContent = `${volumeSlider.value}%`;
});

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

updateCharacterCount();
loadVoices();
