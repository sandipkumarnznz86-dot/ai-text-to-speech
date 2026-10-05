const MAX_CHARACTERS = 500;

const textInput = document.querySelector("#speech-text");
const characterCount = document.querySelector("#character-count");
const characterCurrent = document.querySelector("#character-current");
const speakButton = document.querySelector("#speak-button");
const stopButton = document.querySelector("#stop-button");
const clearButton = document.querySelector("#clear-button");
const voiceSelect = document.querySelector("#voice-select");
const speedSlider = document.querySelector("#speed-slider");
const speedValue = document.querySelector("#speed-value");
const volumeSlider = document.querySelector("#volume-slider");
const volumeValue = document.querySelector("#volume-value");
const statusLine = document.querySelector(".status-line");
const statusMessage = document.querySelector("#status-message");

let activeAudio = null;
let activeAudioUrl = null;
let requestController = null;

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  statusLine.classList.remove("is-speaking", "is-error", "is-finished");
  if (state) {
    statusLine.classList.add(`is-${state}`);
  }
}

function updateCharacterCount() {
  const count = Array.from(textInput.value).length;
  characterCurrent.textContent = count;
  characterCount.setAttribute("aria-label", `${count} of ${MAX_CHARACTERS} characters`);
}

function setBusy(isBusy) {
  speakButton.disabled = isBusy;
  stopButton.disabled = !isBusy;
}

function clearAudioUrl() {
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
}

async function loadVoices() {
  try {
    const response = await fetch("/voices");
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Voice settings are unavailable.");
    }

    voiceSelect.replaceChildren();
    if (result.voices.length === 0) {
      voiceSelect.add(new Option("No voices available", ""));
      voiceSelect.disabled = true;
      return;
    }
    result.voices.forEach((voice) => {
      voiceSelect.add(new Option(voice.name, voice.id));
    });
  } catch {
    voiceSelect.replaceChildren(new Option("Voice settings unavailable", ""));
    voiceSelect.disabled = true;
  }
}

async function speak() {
  const text = textInput.value;
  const characterLength = Array.from(text).length;
  if (!text.trim()) {
    setStatus("Enter some text before speaking.", "error");
    textInput.focus();
    return;
  }
  if (characterLength > MAX_CHARACTERS) {
    setStatus("Text must be 500 characters or fewer.", "error");
    return;
  }

  const audioSupport = document.createElement("audio");
  if (typeof audioSupport.play !== "function" || !audioSupport.canPlayType("audio/wav")) {
    setStatus("Audio playback is not supported on this device.", "error");
    return;
  }

  setBusy(true);
  setStatus("Generating speech…", "speaking");
  requestController = new AbortController();

  try {
    const response = await fetch("/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: voiceSelect.value,
        rate: Number(speedSlider.value),
      }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The server could not generate speech. Please try again.");
      }
      throw new Error(result.message || "Speech could not be generated. Please try again.");
    }

    const audioBlob = await response.blob();
    activeAudioUrl = URL.createObjectURL(audioBlob);
    activeAudio = new Audio(activeAudioUrl);
    activeAudio.volume = Number(volumeSlider.value) / 100;
    activeAudio.addEventListener("ended", () => {
      activeAudio = null;
      clearAudioUrl();
      setBusy(false);
      setStatus("Finished", "finished");
    }, { once: true });
    activeAudio.addEventListener("error", () => {
      activeAudio = null;
      clearAudioUrl();
      setBusy(false);
      setStatus("Audio playback failed. Please try again.", "error");
    }, { once: true });

    setStatus("Speaking…", "speaking");
    await activeAudio.play();
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    clearAudioUrl();
    const message = error instanceof TypeError
      ? "Could not reach the local server. Check that Voxly AI is running and try again."
      : error.message || "The server could not generate speech. Please try again.";
    setStatus(message, "error");
    setBusy(false);
    requestController = null;
    activeAudio = null;
    return;
  }

  requestController = null;
}

function stop() {
  if (requestController) {
    requestController.abort();
    requestController = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  clearAudioUrl();
  setBusy(false);
  setStatus("Stopped");
}

textInput.addEventListener("input", () => {
  const characters = Array.from(textInput.value);
  if (characters.length > MAX_CHARACTERS) {
    textInput.value = characters.slice(0, MAX_CHARACTERS).join("");
  }
  updateCharacterCount();
  if (statusLine.classList.contains("is-error")) {
    setStatus("Ready to speak");
  }
});

speakButton.addEventListener("click", speak);
stopButton.addEventListener("click", stop);
clearButton.addEventListener("click", () => {
  textInput.value = "";
  updateCharacterCount();
  if (!requestController && !activeAudio) {
    setStatus("Ready to speak");
  }
  textInput.focus();
});

speedSlider.addEventListener("input", () => {
  speedValue.textContent = `${speedSlider.value} WPM`;
});

volumeSlider.addEventListener("input", () => {
  volumeValue.textContent = `${volumeSlider.value}%`;
  if (activeAudio) {
    activeAudio.volume = Number(volumeSlider.value) / 100;
  }
});

updateCharacterCount();
loadVoices();
