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

let requestController = null;
let currentAudio = null;
let currentAudioUrl = null;

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
  speakButton.disabled = isBusy;
  stopButton.disabled = !isBusy;
}

function releaseAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

async function loadVoices() {
  voiceSelect.disabled = true;

  try {
    const response = await fetch('/voices');
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Voice settings are unavailable.');
    }

    voiceSelect.replaceChildren();

    if (result.voices.length === 0) {
      voiceSelect.add(new Option('No voices available', ''));
      return;
    }

    result.voices.forEach((voice) => {
      voiceSelect.add(new Option(voice.name, voice.id));
    });
  } catch (error) {
    voiceSelect.replaceChildren(new Option('Voices unavailable', ''));
    setStatus(error.message || 'Voice settings are unavailable.', 'error');
  } finally {
    voiceSelect.disabled = voiceSelect.options.length === 0
      || voiceSelect.options[0].value === '';
  }
}

async function speak() {
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

  releaseAudio();
  requestController = new AbortController();
  setBusy(true);
  setStatus('Generating speech...', 'speaking');

  try {
    const response = await fetch('/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: voiceSelect.value || null,
        rate: Number(speedSlider.value),
      }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Speech could not be generated.');
    }

    const audioBlob = await response.blob();
    currentAudioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(currentAudioUrl);
    currentAudio.volume = Number(volumeSlider.value) / 100;
    currentAudio.onended = () => {
      releaseAudio();
      requestController = null;
      setBusy(false);
      setStatus('Finished', 'finished');
    };
    currentAudio.onerror = () => {
      releaseAudio();
      requestController = null;
      setBusy(false);
      setStatus('Speech playback failed. Please try again.', 'error');
    };

    setStatus('Speaking...', 'speaking');
    await currentAudio.play();
  } catch (error) {
    releaseAudio();
    requestController = null;
    setBusy(false);

    if (error.name === 'AbortError') {
      return;
    }

    setStatus(error.message || 'Speech could not be generated. Please try again.', 'error');
  }
}

function stop() {
  if (requestController) {
    requestController.abort();
    requestController = null;
  }

  releaseAudio();
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
  stop();
  textInput.value = '';
  updateCharacterCount();
  setStatus('Ready to speak');
  textInput.focus();
});

speedSlider.addEventListener('input', () => {
  speedValue.textContent = `${speedSlider.value} WPM`;
});

volumeSlider.addEventListener('input', () => {
  volumeValue.textContent = `${volumeSlider.value}%`;

  if (currentAudio) {
    currentAudio.volume = Number(volumeSlider.value) / 100;
  }
});

updateCharacterCount();
loadVoices();
