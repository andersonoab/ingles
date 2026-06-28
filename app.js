const STORAGE_KEY = "lousaFluenciaPonte.v2";
const CUSTOM_KEY = "lousaFluenciaPonte.customPhrases.v2";
const ERROR_KEY = "lousaFluenciaPonte.errorBank.v1";
const DICTIONARY_KEY = "lousaFluenciaPonte.importedDictionary.v1";
const HOVER_SPEAK_KEY = "lousaFluenciaPonte.hoverSpeak.v1";
const ONBOARDING_KEY = "lousaFluenciaPonte.onboardingDone.v1";
const DEFAULT_DICTIONARY_URL = "https://raw.githubusercontent.com/andersonoab/aprenderIngles/refs/heads/main/frases_unicas_1000.txt";

const fallbackPhrases = [
  {
    id: "fallback_001",
    track: "Primeiros passos",
    level: "Sobrevivência",
    title: "Quero falar com você",
    error: "I want falar with you.",
    pt: "Eu quero falar com você.",
    mix: "I want falar with you.",
    en: "I want to talk to you.",
    pronunciation: "Ai uónt tchu tók tchu iu",
    usage: "Use quando você quer chamar alguém para conversar.",
    tip: "A tentativa do aluno vira a ponte. Depois de want, use to + verbo. 'Falar com você' fica mais natural como 'talk to you'.",
    blocks: ["I want to", "talk", "to you"]
  }
];

const state = {
  phrases: [],
  current: null,
  currentIndex: 0,
  activeStep: "error",
  selectedTrack: "all",
  progress: loadJson(STORAGE_KEY, {}),
  errorBank: loadJson(ERROR_KEY, []),
  importedDictionary: loadJson(DICTIONARY_KEY, []),
  lastSpoken: "",
  walkingTimer: null,
  advanceTimer: null,
  deferredInstallPrompt: null,
  guidedReading: false,
  guidedToken: 0,
  walkMode: false,
  wakeLock: null,
  noSleep: null,
  speechResumeInterval: null,
  hoverSpeakEnabled: loadJson(HOVER_SPEAK_KEY, true),
  lastHoverText: "",
  lastHoverAt: 0,
  reducedMotion: typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
};

const els = {
  install: document.getElementById("btnInstall"),
  export: document.getElementById("btnExport"),
  reset: document.getElementById("btnReset"),
  coachHeadline: document.getElementById("coachHeadline"),
  statStudied: document.getElementById("statStudied"),
  statMastered: document.getElementById("statMastered"),
  statReview: document.getElementById("statReview"),
  statErrors: document.getElementById("statErrors"),
  trackSelect: document.getElementById("trackSelect"),
  btnNext: document.getElementById("btnNext"),
  btnReview: document.getElementById("btnReview"),
  btnWorst: document.getElementById("btnWorst"),
  btnSaveCurrentError: document.getElementById("btnSaveCurrentError"),
  cardMeta: document.getElementById("cardMeta"),
  cardTitle: document.getElementById("cardTitle"),
  btnFavorite: document.getElementById("btnFavorite"),
  stepButtons: [...document.querySelectorAll(".step")],
  errorCard: document.getElementById("errorCard"),
  ptCard: document.getElementById("ptCard"),
  mixCard: document.getElementById("mixCard"),
  blocksCard: document.getElementById("blocksCard"),
  enCard: document.getElementById("enCard"),
  errorText: document.getElementById("errorText"),
  ptText: document.getElementById("ptText"),
  mixText: document.getElementById("mixText"),
  enText: document.getElementById("enText"),
  blocksList: document.getElementById("blocksList"),
  pronunciationText: document.getElementById("pronunciationText"),
  usageText: document.getElementById("usageText"),
  tipText: document.getElementById("tipText"),
  btnSpeakEn: document.getElementById("btnSpeakEn"),
  btnSpeakSlow: document.getElementById("btnSpeakSlow"),
  btnStartSpeech: document.getElementById("btnStartSpeech"),
  btnGuidedRead: document.getElementById("btnGuidedRead"),
  btnWalkQuick: document.getElementById("btnWalkQuick"),
  toggleHoverSpeak: document.getElementById("toggleHoverSpeak"),
  audioStatus: document.getElementById("audioStatus"),
  speechResult: document.getElementById("speechResult"),
  btnCorrect: document.getElementById("btnCorrect"),
  btnAlmost: document.getElementById("btnAlmost"),
  btnWrong: document.getElementById("btnWrong"),
  tabs: [...document.querySelectorAll(".tab")],
  tabContents: [...document.querySelectorAll(".tab-content")],
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  phraseList: document.getElementById("phraseList"),
  phraseItemTemplate: document.getElementById("phraseItemTemplate"),
  dictionaryUrl: document.getElementById("dictionaryUrl"),
  dictionaryStatus: document.getElementById("dictionaryStatus"),
  dictionaryPaste: document.getElementById("dictionaryPaste"),
  loadRemoteDictionary: document.getElementById("btnLoadRemoteDictionary"),
  importTxt: document.getElementById("btnImportTxt"),
  txtFile: document.getElementById("txtFile"),
  importDictionaryJson: document.getElementById("btnImportDictionaryJson"),
  dictionaryJsonFile: document.getElementById("dictionaryJsonFile"),
  importPastedDictionary: document.getElementById("btnImportPastedDictionary"),
  clearDictionary: document.getElementById("btnClearDictionary"),
  builderForm: document.getElementById("builderForm"),
  errorForm: document.getElementById("errorForm"),
  errorList: document.getElementById("errorList"),
  importJson: document.getElementById("btnImportJson"),
  jsonFile: document.getElementById("jsonFile"),
  walkingStart: document.getElementById("btnWalkingStart"),
  walkingStop: document.getElementById("btnWalkingStop"),
  walkingQueue: document.getElementById("walkingQueue"),
  walkStatus: document.getElementById("walkStatus"),
  importProgress: document.getElementById("btnImportProgress"),
  progressFile: document.getElementById("progressFile"),
  liveRegion: document.getElementById("liveRegion"),
  onboarding: document.getElementById("onboarding"),
  onboardingDone: document.getElementById("btnOnboardingDone"),
  trackProgressFill: document.getElementById("trackProgressFill"),
  trackProgressPct: document.getElementById("trackProgressPct"),
  trackProgressBar: document.querySelector(".track-progress-bar"),
  btnRevealEn: document.getElementById("btnRevealEn"),
  advanceBar: document.getElementById("advanceBar"),
  advanceText: document.getElementById("advanceText"),
  cancelAdvance: document.getElementById("btnCancelAdvance"),
  toastWrap: document.getElementById("toastWrap"),
  confirmBackdrop: document.getElementById("confirmBackdrop"),
  confirmText: document.getElementById("confirmText"),
  confirmOk: document.getElementById("confirmOk"),
  confirmCancel: document.getElementById("confirmCancel"),
  appHeader: document.querySelector(".app-header")
};

boot();

async function boot() {
  await loadPhrases();
  registerEvents();
  registerAudioDelegation();
  if (els.toggleHoverSpeak) els.toggleHoverSpeak.checked = !!state.hoverSpeakEnabled;
  registerPwa();
  buildTrackSelect();
  chooseInitialPhrase();
  renderAll();
  loadBundledDictionary();
  registerKeyboardShortcuts();
  registerHeaderCollapse();
  maybeShowOnboarding();
}

// Carrega o dicionário. Ordem: embutido (sem rede, funciona em file://),
// depois atualização online quando servido por http/https. Nunca grava no localStorage.
async function loadBundledDictionary() {
  // 1) Embutido em JSON com pronúncia aproximada — instantâneo e à prova de file://
  if (Array.isArray(window.DICIONARIO_JSON) && window.DICIONARIO_JSON.length) {
    const imported = normalizePhrases(
      window.DICIONARIO_JSON
        .map((item, index) => pairToPhrase(item.en, item.pt, index, "dicionário embutido", item.pronunciation))
        .filter(Boolean)
    );
    if (imported.length) {
      state.phrases = dedupePhrases([...state.phrases, ...imported]);
      buildTrackSelect();
      renderAll();
      if (els.dictionaryStatus) {
        els.dictionaryStatus.textContent = state.phrases.length + " frases disponíveis (dicionário embutido, com pronúncia).";
      }
    }
    return; // já temos tudo com pronúncia; não buscar versões sem pronúncia
  }

  // 1b) Compatibilidade: formato antigo em texto (sem pronúncia)
  if (typeof window.DICIONARIO_TXT === "string" && window.DICIONARIO_TXT.length) {
    applyDictionaryText(window.DICIONARIO_TXT, "dicionário embutido");
  }

  const online = location.protocol === "http:" || location.protocol === "https:";
  if (!online) return; // file:// não faz fetch; o embutido já resolveu

  // 2) Atualização opcional direto da internet (igual ao projeto aprenderIngles)
  try {
    const response = await fetch(DEFAULT_DICTIONARY_URL, { cache: "no-store" });
    if (response.ok) {
      applyDictionaryText(await response.text(), "online (GitHub)");
      return;
    }
  } catch (error) {
    // sem internet: mantém o embutido
  }

  // 3) Arquivo local do projeto (quando servido por http)
  try {
    const response = await fetch("data/frases_dicionario.txt", { cache: "no-store" });
    if (response.ok) applyDictionaryText(await response.text(), "arquivo do projeto");
  } catch (error) {
    // mantém o embutido
  }
}

function applyDictionaryText(text, label) {
  try {
    const imported = normalizePhrases(parseDictionaryText(text, { source: label }));
    if (!imported.length) return;
    state.phrases = dedupePhrases([...state.phrases, ...imported]);
    buildTrackSelect();
    renderAll();
    if (els.dictionaryStatus) {
      els.dictionaryStatus.textContent = state.phrases.length + " frases disponíveis (" + label + ").";
    }
  } catch (error) {
    // ignora texto inválido e mantém o que já existe
  }
}

async function loadPhrases() {
  const baseEmbutida = Array.isArray(window.FRASES_BASE) && window.FRASES_BASE.length ? window.FRASES_BASE : fallbackPhrases;
  try {
    const response = await fetch("data/frases.json", { cache: "no-store" });
    const loaded = response.ok ? await response.json() : baseEmbutida;
    const custom = loadJson(CUSTOM_KEY, []);
    state.importedDictionary = loadJson(DICTIONARY_KEY, []);
    state.phrases = dedupePhrases(normalizePhrases([...loaded, ...state.importedDictionary, ...custom]));
  } catch (error) {
    const custom = loadJson(CUSTOM_KEY, []);
    state.importedDictionary = loadJson(DICTIONARY_KEY, []);
    state.phrases = dedupePhrases(normalizePhrases([...baseEmbutida, ...state.importedDictionary, ...custom]));
  }
}

function normalizePhrases(phrases) {
  return phrases
    .filter(Boolean)
    .map((phrase, index) => {
      const mix = phrase.mix || phrase.bridge || phrase.error || "";
      const error = phrase.error || phrase.wrong || mix;
      return {
        id: phrase.id || `custom_${Date.now()}_${index}`,
        track: phrase.track || "Geral",
        level: phrase.level || "Básico",
        source: phrase.source || "base",
        title: phrase.title || phrase.pt || phrase.en || "Frase",
        error,
        pt: phrase.pt || "",
        mix,
        en: phrase.en || "",
        pronunciation: phrase.pronunciation || "",
        usage: phrase.usage || "Use para praticar fala em uma situação real.",
        tip: phrase.tip || "Compare a tentativa real, a frase português/inglês e o inglês natural. O erro vira mapa de correção.",
        blocks: Array.isArray(phrase.blocks) && phrase.blocks.length ? phrase.blocks : splitIntoBlocks(phrase.en || mix)
      };
    });
}

function dedupePhrases(phrases) {
  const seen = new Set();
  const result = [];
  for (const phrase of phrases) {
    const key = phraseKey(phrase);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(phrase);
  }
  return result;
}

function phraseKey(phrase) {
  return normalizeText([phrase.en, phrase.pt, phrase.mix || phrase.error].filter(Boolean).join("|"));
}

function splitIntoBlocks(text) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const blocks = [];
  for (let i = 0; i < words.length; i += 2) {
    blocks.push(words.slice(i, i + 2).join(" "));
  }
  return blocks;
}

function registerEvents() {
  els.btnNext.addEventListener("click", () => nextPhrase());
  els.btnReview.addEventListener("click", () => selectReviewPhrase());
  els.btnWorst.addEventListener("click", () => selectWorstPhrase());
  els.btnSaveCurrentError.addEventListener("click", saveCurrentError);
  els.trackSelect.addEventListener("change", event => {
    state.selectedTrack = event.target.value;
    nextPhrase(true);
  });

  els.stepButtons.forEach(button => {
    button.addEventListener("click", () => {
      state.activeStep = button.dataset.step;
      renderSteps();
    });
  });

  els.btnFavorite.addEventListener("click", toggleFavorite);
  els.btnSpeakEn.addEventListener("click", () => speakCurrent(1));
  els.btnSpeakSlow.addEventListener("click", () => speakCurrent(0.72));
  els.btnStartSpeech.addEventListener("click", startSpeechPractice);
  if (els.btnGuidedRead) els.btnGuidedRead.addEventListener("click", toggleGuidedReading);
  if (els.btnWalkQuick) els.btnWalkQuick.addEventListener("click", toggleWalkingMode);
  if (els.toggleHoverSpeak) {
    els.toggleHoverSpeak.addEventListener("change", event => {
      state.hoverSpeakEnabled = !!event.target.checked;
      localStorage.setItem(HOVER_SPEAK_KEY, JSON.stringify(state.hoverSpeakEnabled));
      setAudioStatus(state.hoverSpeakEnabled ? "Áudio por palavra/bloco ativado." : "Áudio por palavra/bloco desativado.");
    });
  }
  els.speechResult.addEventListener("click", event => {
    if (event.target.matches("[data-action='save-spoken-error']")) saveSpokenAsError();
  });
  els.btnCorrect.addEventListener("click", () => markCurrent("correct"));
  els.btnAlmost.addEventListener("click", () => markCurrent("almost"));
  els.btnWrong.addEventListener("click", () => markCurrent("wrong"));

  els.tabs.forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  els.searchInput.addEventListener("input", renderPhraseList);
  els.statusFilter.addEventListener("change", renderPhraseList);
  els.loadRemoteDictionary.addEventListener("click", loadRemoteDictionary);
  els.importTxt.addEventListener("click", () => els.txtFile.click());
  els.txtFile.addEventListener("change", importDictionaryTextFile);
  els.importDictionaryJson.addEventListener("click", () => els.dictionaryJsonFile.click());
  els.dictionaryJsonFile.addEventListener("change", importDictionaryJsonFile);
  els.importPastedDictionary.addEventListener("click", importPastedDictionary);
  els.clearDictionary.addEventListener("click", clearImportedDictionary);
  els.builderForm.addEventListener("submit", addCustomPhrase);
  els.errorForm.addEventListener("submit", addPhraseFromErrorForm);
  els.importJson.addEventListener("click", () => els.jsonFile.click());
  els.jsonFile.addEventListener("change", importJsonFile);
  els.export.addEventListener("click", exportProgress);
  if (els.importProgress) els.importProgress.addEventListener("click", () => els.progressFile.click());
  if (els.progressFile) els.progressFile.addEventListener("change", importProgressFile);
  if (els.btnRevealEn) els.btnRevealEn.addEventListener("click", revealEnglish);
  if (els.cancelAdvance) els.cancelAdvance.addEventListener("click", cancelAdvance);
  if (els.onboardingDone) els.onboardingDone.addEventListener("click", dismissOnboarding);
  if (els.confirmCancel) els.confirmCancel.addEventListener("click", () => closeConfirm(false));
  if (els.confirmOk) els.confirmOk.addEventListener("click", () => closeConfirm(true));
  els.reset.addEventListener("click", resetProgress);
  els.walkingStart.addEventListener("click", startWalkingMode);
  els.walkingStop.addEventListener("click", stopWalkingMode);
}

/* ==========================================================================
   v9 — Funções de usabilidade, acessibilidade e UX
   ========================================================================== */

/* Item 3 — Anúncio em região aria-live para leitor de tela */
function announce(message) {
  if (!els.liveRegion || !message) return;
  els.liveRegion.textContent = "";
  // força a re-leitura mesmo se o texto repetir
  setTimeout(() => { els.liveRegion.textContent = message; }, 40);
}

/* Item 2 — Toast não bloqueante (substitui alert) */
function showToast(message, type = "info", duration = 3200) {
  if (!els.toastWrap || !message) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastWrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  announce(message);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* Item 2 — Confirmação não bloqueante (substitui confirm), retorna Promise */
function askConfirm(message) {
  return new Promise(resolve => {
    if (!els.confirmBackdrop) { resolve(window.confirm(message)); return; }
    els.confirmText.textContent = message;
    els.confirmBackdrop.hidden = false;
    state._confirmResolver = resolve;
    setTimeout(() => els.confirmOk && els.confirmOk.focus(), 30);
  });
}

function closeConfirm(result) {
  if (!els.confirmBackdrop) return;
  els.confirmBackdrop.hidden = true;
  const resolver = state._confirmResolver;
  state._confirmResolver = null;
  if (resolver) resolver(result);
}

/* Item 1 — Atalhos de teclado para o ciclo principal */
function registerKeyboardShortcuts() {
  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const tag = (target && target.tagName) || "";
    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (target && target.isContentEditable);
    if (editing) return;
    // Espaço/Enter já ativam botões e tokens com foco; não duplicar a ação
    const isInteractive = tag === "BUTTON" || (target && target.closest && target.closest("[data-speak], [role='button']"));
    if (isInteractive && (event.key === " " || event.key === "Enter")) return;
    if (els.confirmBackdrop && !els.confirmBackdrop.hidden) return;
    if (els.onboarding && !els.onboarding.hidden) return;

    const key = event.key.toLowerCase();
    const map = {
      " ": () => speakCurrent(1),
      "s": () => speakCurrent(0.72),
      "1": () => markCurrent("correct"),
      "2": () => markCurrent("almost"),
      "3": () => markCurrent("wrong"),
      "n": () => nextPhrase(),
      "r": () => selectReviewPhrase(),
      "f": () => toggleFavorite(),
      "e": () => revealEnglish(),
      "p": () => startSpeechPractice()
    };
    const action = map[key];
    if (!action) return;
    event.preventDefault();
    action();
  });
}

/* Item 5 — Revelar o inglês natural explicitamente */
function revealEnglish() {
  if (!state.current) return;
  cancelAdvance();
  state.activeStep = "en";
  renderSteps();
  speakCurrent(1);
  announce("Inglês natural revelado.");
}

/* Item 6 — Auto-avanço com contagem visível e cancelamento */
function startAdvanceCountdown(seconds = 3) {
  cancelAdvance();
  if (!els.advanceBar) { scheduleAdvance(); return; }
  if (state.reducedMotion) {
    // sem animação de contagem, mas ainda dá tempo de cancelar
    els.advanceBar.hidden = false;
    els.advanceText.textContent = "Avançando para a próxima frase.";
    state.advanceTimer = setTimeout(() => { els.advanceBar.hidden = true; nextPhrase(); }, 1600);
    return;
  }
  let remaining = seconds;
  els.advanceBar.hidden = false;
  els.advanceText.textContent = `Próxima frase em ${remaining}…`;
  state.advanceCountdown = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      cancelAdvance();
      nextPhrase();
      return;
    }
    els.advanceText.textContent = `Próxima frase em ${remaining}…`;
  }, 1000);
}

function cancelAdvance() {
  clearTimeout(state.advanceTimer);
  clearInterval(state.advanceCountdown);
  state.advanceCountdown = null;
  if (els.advanceBar) els.advanceBar.hidden = true;
}

/* Item 4 — Importar progresso de um arquivo exportado */
function importProgressFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (typeof data !== "object" || !data) throw new Error("Arquivo inválido.");
      let restored = 0;

      if (data.progress && typeof data.progress === "object") {
        state.progress = { ...state.progress, ...data.progress };
        saveProgress();
        restored += Object.keys(data.progress).length;
      }
      if (Array.isArray(data.errorBank)) {
        const existing = new Set(state.errorBank.map(e => normalizeText(e.error)));
        data.errorBank.forEach(e => {
          if (e && e.error && !existing.has(normalizeText(e.error))) state.errorBank.push(e);
        });
        saveErrorBank();
      }
      if (Array.isArray(data.customPhrases) && data.customPhrases.length) {
        const normalized = normalizePhrases(data.customPhrases);
        const custom = loadJson(CUSTOM_KEY, []);
        const merged = dedupePhrases([...custom, ...normalized]);
        try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(merged)); } catch (e) {}
        state.phrases = dedupePhrases([...state.phrases, ...normalized]);
      }
      if (Array.isArray(data.importedDictionary) && data.importedDictionary.length) {
        const normalized = normalizePhrases(data.importedDictionary);
        state.importedDictionary = dedupePhrases([...state.importedDictionary, ...normalized]);
        state.phrases = dedupePhrases([...state.phrases, ...normalized]);
        try {
          localStorage.setItem(DICTIONARY_KEY, JSON.stringify(state.importedDictionary.map(slimPhraseForStorage)));
        } catch (e) {}
      }

      buildTrackSelect();
      renderAll(`Progresso importado. ${restored} frase(s) restauradas.`);
      showToast("Progresso importado com sucesso.", "success");
    } catch (error) {
      showToast(`Não consegui importar o progresso: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

/* Item 13 — Onboarding de primeira execução */
function maybeShowOnboarding() {
  if (!els.onboarding) return;
  const done = loadJson(ONBOARDING_KEY, false);
  const semProgresso = Object.keys(state.progress).length === 0;
  if (!done && semProgresso) els.onboarding.hidden = false;
}

function dismissOnboarding() {
  if (els.onboarding) els.onboarding.hidden = true;
  try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(true)); } catch (e) {}
  focusCardTitle();
}

/* Item 9 — Mover o foco para o título ao trocar de frase */
function focusCardTitle() {
  if (!els.cardTitle) return;
  els.cardTitle.setAttribute("tabindex", "-1");
  els.cardTitle.focus({ preventScroll: true });
}

/* Item 11 — Cabeçalho colapsa ao rolar (mobile) */
function registerHeaderCollapse() {
  if (!els.appHeader) return;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      els.appHeader.classList.toggle("compact", window.scrollY > 80);
      ticking = false;
    });
  }, { passive: true });
}

function registerPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    els.install.hidden = false;
  });

  els.install.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    els.install.hidden = true;
  });
}

function buildTrackSelect() {
  const tracks = ["all", ...new Set(state.phrases.map(phrase => phrase.track).sort((a, b) => a.localeCompare(b, "pt-BR")))];
  els.trackSelect.innerHTML = tracks
    .map(track => `<option value="${escapeHtml(track)}">${track === "all" ? "Todas as trilhas" : escapeHtml(track)}</option>`)
    .join("");
}

function chooseInitialPhrase() {
  const due = getFilteredPhrases().find(phrase => phraseStatus(phrase.id) === "review");
  state.current = due || getFilteredPhrases()[0] || state.phrases[0];
  state.currentIndex = Math.max(0, state.phrases.findIndex(phrase => phrase.id === state.current?.id));
}

function getFilteredPhrases() {
  if (state.selectedTrack === "all") return state.phrases;
  return state.phrases.filter(phrase => phrase.track === state.selectedTrack);
}

function scheduleAdvance(delay = 1200) {
  clearTimeout(state.advanceTimer);
  state.advanceTimer = setTimeout(() => nextPhrase(), delay);
}

function nextPhrase(reset = false) {
  cancelAdvance();
  const list = getFilteredPhrases();
  if (!list.length) return;

  if (reset) {
    state.current = list[0];
  } else {
    const currentPosition = list.findIndex(phrase => phrase.id === state.current?.id);
    const nextPosition = currentPosition >= 0 ? (currentPosition + 1) % list.length : 0;
    state.current = list[nextPosition];
  }

  state.currentIndex = state.phrases.findIndex(phrase => phrase.id === state.current.id);
  state.activeStep = state.current.error ? "error" : "pt";
  renderAll();
  focusCardTitle();
}

function selectReviewPhrase() {
  cancelAdvance();
  const list = getFilteredPhrases().filter(phrase => phraseStatus(phrase.id) === "review");
  state.current = list[0] || getFilteredPhrases()[0] || state.phrases[0];
  state.activeStep = state.current?.error ? "error" : "mix";
  renderAll("Revise primeiro o erro que virou ponte.");
  focusCardTitle();
}

function selectWorstPhrase() {
  cancelAdvance();
  const sorted = [...getFilteredPhrases()].sort((a, b) => {
    const pa = state.progress[a.id] || {};
    const pb = state.progress[b.id] || {};
    return (pb.wrong || 0) - (pa.wrong || 0) || (pa.correct || 0) - (pb.correct || 0);
  });
  state.current = sorted[0] || state.phrases[0];
  state.activeStep = state.current?.error ? "error" : "mix";
  renderAll("Vamos transformar sua frase mais difícil em treino.");
  focusCardTitle();
}

function renderAll(customHeadline) {
  renderCurrent();
  renderSteps();
  renderStats(customHeadline);
  renderPhraseList();
  renderErrorList();
  renderWalkingQueue();
  renderDictionaryStatus();
  updateAudioButtons();
}

function renderCurrent() {
  if (!state.current) return;
  const phrase = state.current;
  els.cardMeta.textContent = `${phrase.track} • ${phrase.level}`;
  els.cardTitle.textContent = phrase.title;
  setSpeakableText(els.errorText, phrase.error || phrase.mix || "Sem tentativa errada registrada.", "en-US");
  setSpeakableText(els.ptText, phrase.pt, "pt-BR");
  setSpeakableText(els.mixText, phrase.mix || phrase.error, "en-US");
  setSpeakableText(els.enText, phrase.en, "en-US");
  els.pronunciationText.textContent = phrase.pronunciation || "Treine ouvindo a frase em inglês.";
  els.usageText.textContent = phrase.usage;
  els.tipText.textContent = phrase.tip;
  els.blocksList.innerHTML = phrase.blocks.map(block => `<span class="speak-token" tabindex="0" role="button" data-speak="${escapeHtml(block)}" data-lang="en-US">${escapeHtml(block)}</span>`).join("");
  const isFav = getProgress(phrase.id).favorite;
  els.btnFavorite.textContent = isFav ? "★" : "☆";
  els.btnFavorite.setAttribute("aria-pressed", isFav ? "true" : "false");
  els.btnFavorite.setAttribute("aria-label", isFav ? "Remover dos favoritos" : "Favoritar frase");
  els.btnFavorite.title = isFav ? "Remover dos favoritos" : "Favoritar frase";
  els.speechResult.hidden = true;
  els.speechResult.innerHTML = "";
}

function renderSteps() {
  els.stepButtons.forEach(button => {
    const active = button.dataset.step === state.activeStep;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  const order = ["error", "pt", "mix", "blocks", "en"];
  const activeIndex = Math.max(0, order.indexOf(state.activeStep));
  const show = step => order.indexOf(step) <= activeIndex;

  els.errorCard.classList.toggle("hidden", !show("error") || !state.current?.error);
  els.ptCard.classList.toggle("hidden", !show("pt"));
  els.mixCard.classList.toggle("hidden", !show("mix"));
  els.blocksCard.classList.toggle("hidden", !show("blocks"));
  els.enCard.classList.toggle("hidden", !show("en"));
}

function renderStats(customHeadline) {
  const entries = Object.values(state.progress);
  const studied = entries.filter(item => (item.correct || 0) + (item.almost || 0) + (item.wrong || 0) > 0).length;
  const mastered = state.phrases.filter(phrase => phraseStatus(phrase.id) === "mastered").length;
  const review = state.phrases.filter(phrase => phraseStatus(phrase.id) === "review").length;

  els.statStudied.textContent = studied;
  els.statMastered.textContent = mastered;
  els.statReview.textContent = review;
  els.statErrors.textContent = state.errorBank.length;

  // Item 10 — progresso da trilha atual (dominadas / total)
  if (els.trackProgressFill) {
    const trackList = getFilteredPhrases();
    const trackTotal = trackList.length || 1;
    const trackMastered = trackList.filter(phrase => phraseStatus(phrase.id) === "mastered").length;
    const pct = Math.round((trackMastered / trackTotal) * 100);
    els.trackProgressFill.style.width = `${pct}%`;
    els.trackProgressPct.textContent = `${pct}%`;
    if (els.trackProgressBar) els.trackProgressBar.setAttribute("aria-valuenow", String(pct));
    const label = document.getElementById("trackProgressLabel");
    if (label) label.textContent = state.selectedTrack === "all" ? "Dominadas no total" : `Trilha: ${state.selectedTrack}`;
  }

  if (customHeadline) {
    els.coachHeadline.textContent = customHeadline;
  } else if (state.errorBank.length > 0) {
    els.coachHeadline.textContent = `Você tem ${state.errorBank.length} erro(s) salvo(s) para virar frase.`;
  } else if (review > 0) {
    els.coachHeadline.textContent = `Você tem ${review} frase(s) para revisar.`;
  } else if (studied === 0) {
    els.coachHeadline.textContent = "Comece pelo erro real, veja a ponte e depois fale o inglês natural.";
  } else {
    els.coachHeadline.textContent = "Continue falando. O erro é material de treino, não motivo para parar.";
  }
}

function renderPhraseList() {
  const query = normalizeText(els.searchInput.value || "");
  const filter = els.statusFilter.value;

  const list = state.phrases.filter(phrase => {
    const haystack = normalizeText([phrase.title, phrase.error, phrase.pt, phrase.mix, phrase.en, phrase.track, phrase.blocks.join(" ")].join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const status = phraseStatus(phrase.id);
    const progress = getProgress(phrase.id);
    const matchesStatus = filter === "all" ||
      (filter === "favorite" && progress.favorite) ||
      (filter === "review" && status === "review") ||
      (filter === "mastered" && status === "mastered");
    return matchesQuery && matchesStatus;
  });

  els.phraseList.innerHTML = "";
  if (!list.length) {
    els.phraseList.innerHTML = `<p class="muted">Nenhuma frase encontrada.</p>`;
    return;
  }

  const LISTA_LIMITE = 150;
  list.slice(0, LISTA_LIMITE).forEach(phrase => {
    const node = els.phraseItemTemplate.content.cloneNode(true);
    node.querySelector("h4").textContent = phrase.title;
    const errorEl = node.querySelector(".item-error");
    const mixEl = node.querySelector(".item-mix");
    const enEl = node.querySelector(".item-en");
    errorEl.textContent = phrase.error ? `Erro: ${phrase.error}` : "";
    mixEl.textContent = `Ponte: ${phrase.mix || phrase.error}`;
    enEl.textContent = `Inglês: ${phrase.en}`;
    setSpeakableData(errorEl, phrase.error || "", "en-US");
    setSpeakableData(mixEl, phrase.mix || phrase.error || "", "en-US");
    setSpeakableData(enEl, phrase.en, "en-US");
    node.querySelector(".mini-badge").textContent = statusLabel(phraseStatus(phrase.id));
    node.querySelector("button").addEventListener("click", () => {
      state.current = phrase;
      state.activeStep = phrase.error ? "error" : "pt";
      renderAll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.phraseList.appendChild(node);
  });

  if (list.length > LISTA_LIMITE) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Mostrando " + LISTA_LIMITE + " de " + list.length + " frases. Use a busca acima para encontrar as demais.";
    els.phraseList.appendChild(note);
  }
}

function renderErrorList() {
  els.errorList.innerHTML = "";
  if (!state.errorBank.length) {
    els.errorList.innerHTML = `<p class="muted">Nenhum erro capturado ainda.</p>`;
    return;
  }

  state.errorBank
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .forEach(item => {
      const card = document.createElement("article");
      card.className = "phrase-item error-item";
      card.innerHTML = `
        <div>
          <h4>${escapeHtml(item.error || "Erro salvo")}</h4>
          <p class="item-mix">Contexto: ${escapeHtml(item.context || "Tentativa do aluno")}</p>
          <p class="item-en">Alvo: ${escapeHtml(item.target || "")}</p>
        </div>
        <div class="item-actions">
          <button class="small" data-action="use-error" data-id="${escapeHtml(item.id)}">Usar</button>
          <button class="small ghost" data-action="delete-error" data-id="${escapeHtml(item.id)}">Excluir</button>
        </div>
      `;
      card.addEventListener("click", event => {
        const action = event.target.dataset.action;
        const id = event.target.dataset.id;
        if (action === "use-error") fillErrorForm(id);
        if (action === "delete-error") deleteError(id);
      });
      els.errorList.appendChild(card);
    });
}

function renderWalkingQueue() {
  const list = getFilteredPhrases().slice(0, 8);
  els.walkingQueue.innerHTML = list
    .map(phrase => `<li><strong>${escapeHtml(phrase.en)}</strong><br><span class="muted">${escapeHtml(phrase.error || phrase.mix)} → ${escapeHtml(phrase.pt)}</span></li>`)
    .join("");
}

function renderDictionaryStatus() {
  if (!els.dictionaryStatus) return;
  const count = state.importedDictionary.length;
  const total = state.phrases.length;
  if (!count) {
    els.dictionaryStatus.textContent = `Dicionário base: ${total} frase(s). Nenhum dicionário externo carregado neste navegador.`;
    return;
  }
  els.dictionaryStatus.textContent = `Dicionário importado salvo: ${count} frase(s). Total disponível na lousa: ${total} frase(s).`;
}

function setSpeakableText(element, text, lang = "en-US") {
  if (!element) return;
  const value = String(text || "").trim();
  element.textContent = value;
  element.dataset.speak = value;
  element.dataset.lang = lang;
  element.classList.add("speakable-text");
  element.tabIndex = 0;
  element.setAttribute("role", "button");
}

function setSpeakableData(element, text, lang = "en-US") {
  if (!element) return;
  const value = String(text || "").trim();
  if (!value) return;
  element.dataset.speak = value;
  element.dataset.lang = lang;
  element.classList.add("speakable-text");
  element.tabIndex = 0;
  element.setAttribute("role", "button");
}

function registerAudioDelegation() {
  const handler = event => {
    const target = event.target.closest?.("[data-speak]");
    if (!target || !state.hoverSpeakEnabled) return;
    if (target.closest("button") && !target.classList.contains("speak-token")) return;
    const text = target.dataset.speak || target.textContent;
    const lang = target.dataset.lang || "en-US";
    speakHoverText(text, lang);
  };

  document.addEventListener("pointerenter", handler, true);
  document.addEventListener("click", handler, true);
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest?.("[data-speak]");
    if (!target || !state.hoverSpeakEnabled) return;
    event.preventDefault();
    speakHoverText(target.dataset.speak || target.textContent, target.dataset.lang || "en-US");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.walkMode) {
      requestWakeLock();
      if ("speechSynthesis" in window && window.speechSynthesis.paused) window.speechSynthesis.resume();
    }
  });

  window.addEventListener("pagehide", () => {
    stopWalkingMode({ silent: true });
    stopGuidedReading({ silent: true });
  });
}

function speakHoverText(text, lang = "en-US") {
  const value = String(text || "").trim();
  if (!value) return;
  const now = Date.now();
  if (state.lastHoverText === value && now - state.lastHoverAt < 700) return;
  state.lastHoverText = value;
  state.lastHoverAt = now;
  speakText(value, lang, lang === "pt-BR" ? 1.04 : 0.96, { cancel: true });
  setAudioStatus(`Tocando: ${value}`);
}

function speakCurrent(rate = 1) {
  if (!state.current) return;
  speakText(state.current.en, "en-US", rate, { cancel: true });
  setAudioStatus(rate < 0.9 ? "Tocando inglês devagar." : "Tocando inglês natural.");
}

function setAudioStatus(message) {
  if (els.audioStatus) els.audioStatus.textContent = message;
}

function startSpeechPractice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.speechResult.hidden = false;
    els.speechResult.innerHTML = "Seu navegador não liberou reconhecimento de voz. Treine ouvindo e repetindo em voz alta; depois marque Acertei, Quase ou Errei.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  els.speechResult.hidden = false;
  els.speechResult.textContent = "Ouvindo... fale a frase em inglês natural.";

  recognition.onresult = event => {
    const spoken = event.results[0][0].transcript;
    state.lastSpoken = spoken;
    const score = similarity(normalizeText(spoken), normalizeText(state.current.en));
    const percent = Math.round(score * 100);
    const saveButton = percent < 82
      ? `<br><button class="small secondary" data-action="save-spoken-error">Salvar essa tentativa como erro</button>`
      : "";
    const diff = buildSpeechDiff(spoken, state.current.en);
    els.speechResult.innerHTML = `Você falou: <strong>${escapeHtml(spoken)}</strong><br>${diff}<br>Aproximação: <strong>${percent}%</strong><br>${speechAdvice(percent)}${saveButton}`;
    announce(`Aproximação de ${percent} por cento. ${speechAdvice(percent)}`);
  };

  recognition.onerror = () => {
    els.speechResult.textContent = "Não consegui capturar a fala. Tente de novo em um lugar menos barulhento ou use a autoavaliação.";
  };

  recognition.start();
}

function buildSpeechDiff(spoken, expected) {
  const spokenSet = new Set(normalizeText(spoken).split(" ").filter(Boolean));
  const expectedWords = String(expected || "").trim().split(/\s+/).filter(Boolean);
  if (!expectedWords.length) return "";
  const html = expectedWords.map(word => {
    const clean = normalizeText(word);
    const hit = clean && spokenSet.has(clean);
    return `<span class="w ${hit ? "hit" : "miss"}">${escapeHtml(word)}</span>`;
  }).join("");
  return `<span class="muted" style="font-size:.8rem">Esperado (verde = você acertou, riscado = faltou):</span><div class="speech-diff">${html}</div>`;
}

function speechAdvice(percent) {
  if (percent >= 82) return "Boa aproximação. Marque Acertei se conseguiu falar sem travar.";
  if (percent >= 55) return "Está perto. Salve a tentativa se ela mostrar um erro útil.";
  return "Essa tentativa pode virar frase ponte. Salve o erro e corrija depois.";
}

function similarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length, 1);
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function markCurrent(result) {
  if (!state.current) return;
  cancelAdvance();
  const progress = getProgress(state.current.id);
  progress[result] = (progress[result] || 0) + 1;
  progress.lastResult = result;
  progress.lastSeen = new Date().toISOString();
  progress.status = deriveStatus(progress);
  state.progress[state.current.id] = progress;
  saveProgress();

  if (result === "correct") {
    state.activeStep = "en";
    renderAll("Boa. Indo para a próxima frase...");
    announce("Acertei. Próxima frase em instantes.");
    startAdvanceCountdown(3);
  } else if (result === "almost") {
    state.activeStep = "blocks";
    renderAll("Quase. Monte pelos blocos e fale de novo.");
    announce("Quase. Use os blocos e tente falar de novo.");
  } else {
    saveCurrentError(false);
    state.activeStep = state.current.error ? "error" : "mix";
    renderAll("Erro salvo. Agora ele vira ponte para o inglês natural.");
    announce("Erro salvo. Ele virou ponte para o inglês natural.");
  }
}

function deriveStatus(progress) {
  const correct = progress.correct || 0;
  const almost = progress.almost || 0;
  const wrong = progress.wrong || 0;
  if (correct >= 3 && wrong === 0) return "mastered";
  if (correct >= 5 && correct > wrong + almost) return "mastered";
  if (wrong > correct || progress.lastResult === "wrong") return "review";
  if (almost > correct) return "review";
  return "learning";
}

function phraseStatus(id) {
  return getProgress(id).status || "new";
}

function statusLabel(status) {
  return ({
    new: "Nova",
    learning: "Treinando",
    review: "Revisar",
    mastered: "Dominada"
  })[status] || "Nova";
}

function getProgress(id) {
  if (!state.progress[id]) {
    state.progress[id] = { correct: 0, almost: 0, wrong: 0, favorite: false, status: "new" };
  }
  return state.progress[id];
}

function toggleFavorite() {
  if (!state.current) return;
  const progress = getProgress(state.current.id);
  progress.favorite = !progress.favorite;
  saveProgress();
  renderAll(progress.favorite ? "Frase marcada como favorita." : "Frase removida das favoritas.");
}

function addCustomPhrase(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const phrase = buildPhraseFromFormData(formData, {
    idPrefix: "custom",
    level: "Personalizada",
    usage: "Frase criada pelo aluno para treino pessoal."
  });
  saveCustomPhrase(phrase);
  event.currentTarget.reset();
  activateTab("glossary");
  renderAll("Frase criada. Agora treine do erro até o inglês natural.");
}

function addPhraseFromErrorForm(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const phrase = buildPhraseFromFormData(formData, {
    idPrefix: "error_phrase",
    level: "Erro convertido",
    usage: "Frase criada a partir de uma tentativa errada real."
  });
  saveCustomPhrase(phrase);
  deleteMatchingError(phrase.error);
  event.currentTarget.reset();
  activateTab("glossary");
  renderAll("Erro transformado em frase de estudo.");
}

function buildPhraseFromFormData(formData, options) {
  const error = formData.get("error")?.trim() || "";
  const pt = formData.get("pt")?.trim() || "";
  const mix = formData.get("mix")?.trim() || error;
  const en = formData.get("en")?.trim() || "";
  return normalizePhrases([{
    id: `${options.idPrefix}_${Date.now()}`,
    track: formData.get("track")?.trim() || "Minhas frases",
    level: options.level,
    title: pt || en || error || "Minha frase",
    error: error || mix,
    pt,
    mix,
    en,
    pronunciation: formData.get("pronunciation")?.trim() || "",
    usage: options.usage,
    tip: formData.get("tip")?.trim() || "A tentativa errada vira a ponte. Compare com a versão natural e repita em voz alta.",
    blocks: splitIntoBlocks(en || mix)
  }])[0];
}

function saveCustomPhrase(phrase) {
  const custom = loadJson(CUSTOM_KEY, []);
  custom.push(phrase);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  state.phrases.push(phrase);
  state.current = phrase;
  state.activeStep = phrase.error ? "error" : "pt";
  buildTrackSelect();
  els.trackSelect.value = state.selectedTrack;
}

function saveCurrentError(showMessage = true) {
  if (!state.current) return;
  const errorText = state.lastSpoken || state.current.error || state.current.mix || state.current.pt;
  saveError({
    error: errorText,
    target: state.current.en,
    context: state.current.title,
    phraseId: state.current.id
  });
  if (showMessage) {
    activateTab("errors");
    renderAll("Erro salvo. Complete português e inglês natural para virar frase.");
  }
}

function saveSpokenAsError() {
  if (!state.lastSpoken) return;
  saveError({
    error: state.lastSpoken,
    target: state.current?.en || "",
    context: state.current?.title || "Treino de fala",
    phraseId: state.current?.id || ""
  });
  activateTab("errors");
  renderAll("Tentativa de fala salva como erro.");
}

function saveError(payload) {
  const clean = String(payload.error || "").trim();
  if (!clean) return;
  const exists = state.errorBank.some(item => normalizeText(item.error) === normalizeText(clean));
  if (exists) return;
  state.errorBank.push({
    id: `err_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    error: clean,
    target: payload.target || "",
    context: payload.context || "Tentativa do aluno",
    phraseId: payload.phraseId || "",
    createdAt: new Date().toISOString()
  });
  saveErrorBank();
}

function fillErrorForm(id) {
  const item = state.errorBank.find(error => error.id === id);
  if (!item) return;
  const form = els.errorForm;
  form.elements.error.value = item.error || "";
  form.elements.pt.value = "";
  form.elements.mix.value = item.error || "";
  form.elements.en.value = item.target || "";
  form.elements.track.value = "Erros convertidos";
  form.elements.tip.value = "Explique o que mudou entre a tentativa do aluno e o inglês natural.";
  activateTab("errors");
  form.elements.pt.focus();
}

function deleteError(id) {
  state.errorBank = state.errorBank.filter(item => item.id !== id);
  saveErrorBank();
  renderAll("Erro removido da fila.");
}

function deleteMatchingError(errorText) {
  const normalized = normalizeText(errorText);
  state.errorBank = state.errorBank.filter(item => normalizeText(item.error) !== normalized);
  saveErrorBank();
}

function saveErrorBank() {
  localStorage.setItem(ERROR_KEY, JSON.stringify(state.errorBank));
}

function importJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("O arquivo precisa ser uma lista JSON.");
      const normalized = normalizePhrases(imported.map((phrase, index) => ({ ...phrase, id: phrase.id || `import_${Date.now()}_${index}` })));
      const custom = loadJson(CUSTOM_KEY, []);
      try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify([...custom, ...normalized]));
      } catch (e) {
        // não couberam no navegador; seguem disponíveis nesta sessão
      }
      state.phrases.push(...normalized);
      buildTrackSelect();
      renderAll(`${normalized.length} frase(s) importada(s).`);
    } catch (error) {
      showToast(`Não consegui importar: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}


async function loadRemoteDictionary() {
  const url = normalizeGithubRawUrl(els.dictionaryUrl.value || DEFAULT_DICTIONARY_URL);
  if (!url) {
    showToast("Informe a URL do dicionário.", "error");
    return;
  }
  els.dictionaryUrl.value = url; // mostra a URL corrigida (raw) para o usuário

  els.dictionaryStatus.textContent = "Carregando dicionário online...";
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const imported = parseDictionaryText(text, { source: "dicionário GitHub" });
    saveImportedDictionary(imported, `Dicionário online carregado: ${imported.length} frase(s) interpretada(s).`);
  } catch (error) {
    els.dictionaryStatus.textContent = "Não foi possível carregar a URL. Você ainda pode baixar o TXT e importar manualmente.";
    showToast(`Não consegui carregar o dicionário: ${error.message}`, "error");
  }
}

function normalizeGithubRawUrl(url) {
  const u = String(url || "").trim();
  // github.com/<user>/<repo>/blob/<branch>/<caminho> -> raw.githubusercontent.com/<user>/<repo>/<branch>/<caminho>
  const blob = u.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
  if (blob) return "https://raw.githubusercontent.com/" + blob[1] + "/" + blob[2] + "/" + blob[3];
  return u;
}

function importDictionaryTextFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseDictionaryText(String(reader.result || ""), { source: file.name || "TXT importado" });
      saveImportedDictionary(imported, `${imported.length} frase(s) importada(s) do TXT.`);
    } catch (error) {
      showToast(`Não consegui importar o TXT: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function importDictionaryJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseDictionaryJson(String(reader.result || ""), file.name || "JSON importado");
      saveImportedDictionary(imported, `${imported.length} frase(s) importada(s) do JSON.`);
    } catch (error) {
      showToast(`Não consegui importar o JSON: ${error.message}`, "error");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function importPastedDictionary() {
  const text = els.dictionaryPaste.value.trim();
  if (!text) {
    showToast("Cole frases no formato inglês | português.", "error");
    return;
  }
  try {
    const imported = parseDictionaryText(text, { source: "texto colado" });
    saveImportedDictionary(imported, `${imported.length} frase(s) importada(s) do texto colado.`);
    els.dictionaryPaste.value = "";
  } catch (error) {
    showToast(`Não consegui importar o texto: ${error.message}`, "error");
  }
}

function clearImportedDictionary() {
  askConfirm("Limpar apenas as frases importadas do dicionário? As frases base, frases criadas manualmente, erros e progresso serão mantidos.").then(confirmed => {
    if (!confirmed) return;
    state.importedDictionary = [];
    localStorage.removeItem(DICTIONARY_KEY);
    loadPhrases().then(() => {
      buildTrackSelect();
      chooseInitialPhrase();
      renderAll("Dicionário importado removido deste navegador.");
      showToast("Dicionário importado removido.", "success");
    });
  });
}

function parseDictionaryJson(raw, sourceName) {
  const data = JSON.parse(raw);
  if (Array.isArray(data)) return normalizeDictionaryObjects(data, sourceName);
  if (Array.isArray(data.phrases)) return normalizeDictionaryObjects(data.phrases, sourceName);
  if (Array.isArray(data.customPhrases)) return normalizeDictionaryObjects(data.customPhrases, sourceName);
  throw new Error("O JSON precisa ser uma lista de frases ou ter a chave phrases/customPhrases.");
}

function normalizeDictionaryObjects(items, sourceName) {
  return items
    .filter(Boolean)
    .map((item, index) => {
      const en = item.en || item.english || item.frase_en || item.fraseIngles || "";
      const pt = item.pt || item.portuguese || item.traducao || item.frase_pt || item.frasePortugues || "";
      const mix = item.mix || item.bridge || item.error || generateBridge(en, pt);
      return {
        ...item,
        id: item.id || `dict_json_${Date.now()}_${index}`,
        track: item.track || item.categoria || "Dicionário importado",
        level: item.level || item.nivel || "Dicionário",
        source: sourceName,
        title: item.title || item.titulo || pt || en,
        error: item.error || item.wrong || mix,
        pt,
        mix,
        en,
        usage: item.usage || item.uso || "Frase importada do dicionário para treino de fala.",
        tip: item.tip || item.dica || "Frase importada. Use a ponte para sair do português/inglês e chegar ao inglês natural.",
        blocks: Array.isArray(item.blocks) ? item.blocks : splitIntoBlocks(en || mix)
      };
    })
    .filter(item => item.en && item.pt);
}

function parseDictionaryText(raw, options = {}) {
  const clean = String(raw || "").replace(/\r/g, "").trim();
  if (!clean) throw new Error("Arquivo vazio.");
  if (clean.startsWith("[") || clean.startsWith("{")) return parseDictionaryJson(clean, options.source || "JSON em texto");

  const pairs = [];
  const lines = clean.split(/\n+/).map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    if (!line.includes("|")) continue;
    const parsed = parsePipeLine(line);
    pairs.push(...parsed);
  }

  const phrases = pairs
    .map((pair, index) => pairToPhrase(pair.en, pair.pt, index, options.source || "TXT importado"))
    .filter(Boolean);

  if (!phrases.length) {
    throw new Error("Não encontrei pares no padrão inglês | português.");
  }
  return phrases;
}

function parsePipeLine(line) {
  const segments = line.split("|").map(part => cleanupImportedPart(part)).filter(Boolean);
  if (segments.length < 2) return [];

  if (segments.length === 2) {
    return [orientPair(segments[0], segments[1])].filter(Boolean);
  }

  const pairs = [];
  let currentEnglish = segments[0];
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (!currentEnglish) {
      currentEnglish = segment;
      continue;
    }

    if (i === segments.length - 1) {
      const pair = orientPair(currentEnglish, segment);
      if (pair) pairs.push(pair);
      break;
    }

    const split = splitPortugueseAndNextEnglish(segment);
    if (split) {
      const pair = orientPair(currentEnglish, split.pt);
      if (pair) pairs.push(pair);
      currentEnglish = split.en;
    } else {
      const pair = orientPair(currentEnglish, segment);
      if (pair) pairs.push(pair);
      currentEnglish = "";
    }
  }

  return pairs;
}

function orientPair(left, right) {
  const a = cleanupImportedPart(left);
  const b = cleanupImportedPart(right);
  if (!a || !b) return null;
  if (looksPortuguese(a) && !looksPortuguese(b)) return { en: b, pt: a };
  return { en: a, pt: b };
}

function splitPortugueseAndNextEnglish(segment) {
  const starters = [
    "I ", "I'm", "I'll", "I'd", "I've", "I’ll", "You ", "You're", "You should", "Can you", "Could you", "Would you", "Do you", "Are you", "Is it",
    "What's", "What are", "What do", "What time", "Where", "Where's", "How", "Let's", "Let me", "Send me", "Talk to", "See you", "Bye", "Good to", "Long time", "Nice to", "Hey",
    "For real", "Tell me", "No doubt", "Maybe", "Absolutely", "Excuse me", "Make yourself", "Thanks", "Sorry", "Actually", "Anyway", "For instance", "In other words", "Long story short", "As far", "If I'm", "Speaking of", "By the way", "Before I", "Come to", "Welcome", "Please", "Thank you",
    "Our", "We ", "We're", "We've", "They", "It ", "It's", "This", "That", "The", "Some", "Nobody", "Don't", "Stop", "Take", "Then", "My", "Everyone", "Life", "Give me", "Tomorrow", "Brazil", "Health insurance", "Employee", "Income tax", "Social security", "LGPD"
  ];

  let bestIndex = -1;
  for (const starter of starters) {
    const index = segment.toLowerCase().indexOf(` ${starter.toLowerCase()}`);
    if (index > 2 && (bestIndex === -1 || index < bestIndex)) bestIndex = index;
  }

  if (bestIndex === -1) return null;
  return {
    pt: cleanupImportedPart(segment.slice(0, bestIndex)),
    en: cleanupImportedPart(segment.slice(bestIndex))
  };
}

function pairToPhrase(en, pt, index, sourceName, pronunciation = "") {
  const english = cleanupImportedPart(en);
  const portuguese = cleanupImportedPart(pt);
  if (!english || !portuguese) return null;
  if (english.length < 2 || portuguese.length < 2) return null;

  const bridge = generateBridge(english, portuguese);
  return {
    id: `dict_${Date.now()}_${index}_${Math.floor(Math.random() * 99999)}`,
    track: inferTrack(english, portuguese),
    level: "Dicionário",
    source: sourceName,
    title: portuguese,
    error: bridge,
    pt: portuguese,
    mix: bridge,
    en: english,
    pronunciation: pronunciation || "",
    usage: "Frase importada do dicionário. Treine primeiro a ponte e depois o inglês natural.",
    tip: bridge === english
      ? "Frase importada sem erro registrado. Use como frase natural e crie uma ponte manual se quiser."
      : "Ponte gerada automaticamente a partir do par inglês/português. Ajuste manualmente se quiser deixar mais parecida com o erro real do aluno.",
    blocks: splitIntoBlocks(english)
  };
}

function generateBridge(en, pt) {
  let bridge = String(en || "");
  const portuguese = normalizeText(pt);
  const replacements = [
    { en: /\bto talk\b|\btalk\b|\bspeak\b/gi, pt: "falar", cues: ["falar", "fala"] },
    { en: /\blearning\b|\blearn\b/gi, pt: "aprendendo", cues: ["aprendendo", "aprender"] },
    { en: /\brepeat\b|\bsay that again\b/gi, pt: "repetir", cues: ["repetir", "repete"] },
    { en: /\bmore slowly\b|\bslower\b|\bslowly\b/gi, pt: "mais devagar", cues: ["devagar"] },
    { en: /\bcheck\b|\bverify\b/gi, pt: "verificar", cues: ["verificar", "conferir"] },
    { en: /\bsend\b/gi, pt: "enviar", cues: ["enviar", "mandar"] },
    { en: /\breport\b/gi, pt: "relatório", cues: ["relatorio", "relatorio"] },
    { en: /\bquestion\b/gi, pt: "pergunta", cues: ["pergunta", "duvida"] },
    { en: /\bagree\b/gi, pt: "concordo", cues: ["concordo", "concordar"] },
    { en: /\bpayroll\b/gi, pt: "folha de pagamento", cues: ["folha", "pagamento"] },
    { en: /\btake the bus\b|\bcatch the bus\b/gi, pt: "pegar the bus", cues: ["onibus"] },
    { en: /\bbus\b/gi, pt: "ônibus", cues: ["onibus"] },
    { en: /\bmoney\b/gi, pt: "dinheiro", cues: ["dinheiro"] },
    { en: /\bhelp\b/gi, pt: "ajudar", cues: ["ajuda", "ajudar"] },
    { en: /\bmeeting\b/gi, pt: "reunião", cues: ["reuniao"] },
    { en: /\bdeadline\b/gi, pt: "prazo", cues: ["prazo"] },
    { en: /\bemail\b|\be-mail\b/gi, pt: "e-mail", cues: ["email", "e mail"] },
    { en: /\bcall\b/gi, pt: "ligar", cues: ["ligar", "chamar"] },
    { en: /\blook\b/gi, pt: "olhar", cues: ["olhar", "olhada"] },
    { en: /\btime\b/gi, pt: "tempo", cues: ["tempo"] },
    { en: /\bdone\b/gi, pt: "terminei", cues: ["terminei", "terminado"] }
  ];

  for (const item of replacements) {
    if (item.cues.some(cue => portuguese.includes(cue))) {
      bridge = bridge.replace(item.en, item.pt);
    }
  }

  if (bridge !== en) return bridge;

  const ptClean = String(pt || "").replace(/[.!?]+$/g, "").trim();
  if (/^I\b/i.test(en) && /^eu\s+/i.test(ptClean)) return `I ${lowerFirst(ptClean.replace(/^eu\s+/i, ""))}.`;
  if (/^I'm\b|^I am\b/i.test(en) && /^(estou|tô|to|eu estou)\s+/i.test(ptClean)) {
    return `I'm ${lowerFirst(ptClean.replace(/^(eu estou|estou|tô|to)\s+/i, ""))}.`;
  }
  if (/^Can you\b/i.test(en) && /(pode|você pode|voce pode)/i.test(ptClean)) {
    return `Can you ${lowerFirst(ptClean.replace(/^(você pode|voce pode|pode)\s+/i, ""))}?`;
  }
  return en;
}

function inferTrack(en, pt) {
  const haystack = normalizeText(`${en} ${pt}`);
  if (/payroll|folha|report|relatorio|meeting|reuniao|deadline|prazo|email|trabalho|work/.test(haystack)) return "Trabalho";
  if (/help|ajuda|repeat|repetir|slow|devagar|question|pergunta/.test(haystack)) return "Pedir ajuda";
  if (/bus|onibus|where|onde|room|hotel|menu|check|conta|water|agua/.test(haystack)) return "Vida diária";
  if (/happy|sad|worried|nervous|cansado|feliz|preocupado/.test(haystack)) return "Sentimentos";
  return "Dicionário importado";
}

function slimPhraseForStorage(p) {
  // Guarda só o essencial; campos longos (tip/usage/blocks) são recriados no carregamento.
  return { id: p.id, track: p.track, level: p.level, source: p.source,
    title: p.title, error: p.error, pt: p.pt, mix: p.mix, en: p.en, pronunciation: p.pronunciation };
}

function saveImportedDictionary(imported, headline) {
  if (!Array.isArray(imported) || !imported.length) {
    showToast("Nenhuma frase válida encontrada.", "error");
    return;
  }

  const normalized = normalizePhrases(imported);
  const beforeKeys = new Set(state.importedDictionary.map(phraseKey));
  const merged = dedupePhrases([...state.importedDictionary, ...normalized]);
  const added = merged.filter(phrase => !beforeKeys.has(phraseKey(phrase))).length;

  state.importedDictionary = merged;
  state.phrases = dedupePhrases([...state.phrases, ...normalized]);

  // Persistência tolerante: dicionários grandes podem estourar a cota do navegador (sobretudo em file://).
  let aviso = "";
  try {
    localStorage.setItem(DICTIONARY_KEY, JSON.stringify(state.importedDictionary.map(slimPhraseForStorage)));
  } catch (error) {
    try { localStorage.removeItem(DICTIONARY_KEY); } catch (e) {}
    aviso = " As frases ficam disponíveis nesta sessão; como são muitas, não couberam no armazenamento do navegador e serão recarregadas do dicionário a cada abertura.";
  }

  buildTrackSelect();
  if (!state.current && state.phrases.length) state.current = state.phrases[0];
  renderAll(added ? (headline || added + " frase(s) importada(s).") + aviso : "Essas frases já estavam no dicionário.");
  activateTab("glossary");
}

function cleanupImportedPart(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\-–—]+\s*/, "")
    .replace(/\s*[,;:\-–—]+$/, "")
    .trim();
}

function looksPortuguese(value) {
  const text = normalizeText(value);
  return /\b(eu|voce|você|nao|não|preciso|quero|trabalho|folha|pagamento|pode|com|para|pra|porque|obrigado|obrigada|estou|to|tô|fala|falar|repetir|devagar|relatorio|relatório|onibus|ônibus|dinheiro|pergunta|duvida|dúvida|reuniao|reunião|prazo|ajuda|ajudar|cansado|feliz|preocupado|onde|quando|quanto|como)\b/.test(text) || /[áàâãéêíóôõúç]/i.test(value);
}

function lowerFirst(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function activateTab(tabName) {
  els.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === tabName));
  els.tabContents.forEach(content => content.classList.toggle("active", content.id === `tab-${tabName}`));
}

async function speakText(text, lang = "en-US", rate = 1, options = {}) {
  const value = String(text || "").trim();
  if (!value || !("speechSynthesis" in window)) return false;
  const cancel = options.cancel !== false;
  if (cancel) window.speechSynthesis.cancel();

  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAudioTokenActive(token) {
  return token === state.guidedToken && (state.guidedReading || state.walkMode);
}

async function playGuidedSequence(phrase, token, mode = "guided") {
  if (!phrase) return false;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  const sequence = [
    { text: phrase.en, lang: "en-US", rate: mode === "walk" ? 0.86 : 0.96, label: "inglês natural" },
    { text: phrase.en, lang: "en-US", rate: 0.72, label: "inglês devagar" },
    { text: phrase.pt, lang: "pt-BR", rate: 1.03, label: "português" },
    { text: phrase.mix || phrase.error, lang: "en-US", rate: 0.84, label: "frase ponte" },
    { text: phrase.en, lang: "en-US", rate: 0.94, label: "inglês final" }
  ].filter(item => item.text);

  for (const item of sequence) {
    if (!isAudioTokenActive(token)) return false;
    setAudioStatus(`${mode === "walk" ? "Caminhada" : "Leitura guiada"}: ${item.label}.`);
    await speakText(item.text, item.lang, item.rate, { cancel: false });
    await wait(mode === "walk" ? 550 : 350);
  }
  return true;
}

function toggleGuidedReading() {
  if (state.guidedReading && !state.walkMode) {
    stopGuidedReading();
    return;
  }
  startGuidedReading();
}

async function startGuidedReading() {
  stopWalkingMode({ silent: true });
  state.guidedReading = true;
  state.guidedToken += 1;
  const token = state.guidedToken;
  updateAudioButtons();
  setAudioStatus("Leitura guiada ativa: inglês, devagar, português, ponte e inglês final.");

  while (state.guidedReading && token === state.guidedToken) {
    const phrase = state.current || getFilteredPhrases()[0];
    state.activeStep = "en";
    renderAll("Leitura guiada ativa. Ouça, repita e deixe a frase andar.");
    await playGuidedSequence(phrase, token, "guided");
    if (!state.guidedReading || token !== state.guidedToken) break;
    nextPhrase();
    await wait(700);
  }
}

function stopGuidedReading(options = {}) {
  state.guidedReading = false;
  state.guidedToken += 1;
  if (!options.silent && "speechSynthesis" in window) window.speechSynthesis.cancel();
  updateAudioButtons();
  if (!options.silent) setAudioStatus("Leitura guiada parada.");
}

function toggleWalkingMode() {
  if (state.walkMode) stopWalkingMode();
  else startWalkingMode();
}

async function startWalkingMode() {
  stopGuidedReading({ silent: true });
  const list = getFilteredPhrases();
  if (!list.length) return;

  state.walkMode = true;
  state.guidedReading = true;
  state.guidedToken += 1;
  const token = state.guidedToken;
  document.body.classList.add("walk-mode");
  updateAudioButtons();
  updateWalkStatus("Modo caminhada ativo. Leitura contínua ligada; tente bloquear a tela somente depois de começar a ouvir.");
  startSpeechResumer();
  startNoSleepAudio();
  await requestWakeLock();

  let index = Math.max(0, list.findIndex(phrase => phrase.id === state.current?.id));
  while (state.walkMode && token === state.guidedToken) {
    const phrase = list[index % list.length];
    state.current = phrase;
    state.activeStep = "en";
    renderAll("Modo caminhada ativo. Ouça e repita sem olhar a tela.");
    await playGuidedSequence(phrase, token, "walk");
    index += 1;
    await wait(900);
  }
}

function stopWalkingMode(options = {}) {
  const wasActive = state.walkMode;
  state.walkMode = false;
  if (wasActive || state.guidedReading) state.guidedToken += 1;
  if (!options.silent && "speechSynthesis" in window) window.speechSynthesis.cancel();
  state.guidedReading = false;
  document.body.classList.remove("walk-mode");
  stopSpeechResumer();
  stopNoSleepAudio();
  releaseWakeLock();
  updateAudioButtons();
  if (!options.silent) {
    updateWalkStatus("Modo caminhada parado.");
    setAudioStatus("Modo caminhada parado.");
  }
}

function updateAudioButtons() {
  if (els.btnGuidedRead) {
    els.btnGuidedRead.textContent = state.guidedReading && !state.walkMode ? "Parar leitura" : "Leitura guiada";
    els.btnGuidedRead.classList.toggle("walk-active", state.guidedReading && !state.walkMode);
  }
  if (els.btnWalkQuick) {
    els.btnWalkQuick.textContent = state.walkMode ? "Parar caminhada" : "Modo caminhada";
    els.btnWalkQuick.classList.toggle("walk-active", state.walkMode);
  }
  if (els.walkingStart) els.walkingStart.disabled = state.walkMode;
  if (els.walkingStop) els.walkingStop.disabled = !state.walkMode;
}

function updateWalkStatus(message) {
  if (els.walkStatus) els.walkStatus.textContent = message;
  if (els.audioStatus && state.walkMode) els.audioStatus.textContent = message;
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible") {
    updateWalkStatus("Modo caminhada ativo. Wake Lock não disponível neste navegador; o áudio contínuo ajuda a manter o treino ativo.");
    return;
  }
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => {
      if (state.walkMode) updateWalkStatus("Modo caminhada ativo. O navegador liberou o Wake Lock; toque novamente se a tela dormir.");
    });
    updateWalkStatus("Modo caminhada ativo com Wake Lock. Tela escura e leitura contínua.");
  } catch (error) {
    updateWalkStatus("Modo caminhada ativo. O navegador não concedeu Wake Lock agora, mas a leitura contínua segue funcionando.");
  }
}

function releaseWakeLock() {
  if (!state.wakeLock) return;
  try { state.wakeLock.release(); } catch (error) {}
  state.wakeLock = null;
}

function startSpeechResumer() {
  if (state.speechResumeInterval) return;
  state.speechResumeInterval = setInterval(() => {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  }, 4000);
}

function stopSpeechResumer() {
  if (!state.speechResumeInterval) return;
  clearInterval(state.speechResumeInterval);
  state.speechResumeInterval = null;
}

function startNoSleepAudio() {
  if (state.noSleep) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    ctx.resume?.();
    state.noSleep = { ctx, oscillator, gain };
  } catch (error) {
    try {
      const audio = document.createElement("audio");
      audio.loop = true;
      audio.playsInline = true;
      audio.volume = 0.01;
      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
      audio.play().catch(() => {});
      state.noSleep = { audio };
    } catch (fallbackError) {}
  }
}

function stopNoSleepAudio() {
  if (!state.noSleep) return;
  try {
    if (state.noSleep.oscillator) state.noSleep.oscillator.stop();
    if (state.noSleep.ctx) state.noSleep.ctx.close();
    if (state.noSleep.audio) {
      state.noSleep.audio.pause();
      state.noSleep.audio.src = "";
    }
  } catch (error) {}
  state.noSleep = null;
}

function exportProgress() {
  const payload = {
    exportedAt: new Date().toISOString(),
    progress: state.progress,
    customPhrases: loadJson(CUSTOM_KEY, []),
    importedDictionary: state.importedDictionary,
    errorBank: state.errorBank
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lousa-fluencia-progresso-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Progresso exportado. Guarde o arquivo para restaurar depois.", "success");
}

function resetProgress() {
  askConfirm("Zerar apenas o progresso salvo neste navegador? As frases personalizadas e erros salvos serão mantidos.").then(confirmed => {
    if (!confirmed) return;
    state.progress = {};
    localStorage.removeItem(STORAGE_KEY);
    renderAll("Progresso local zerado.");
    showToast("Progresso local zerado.", "success");
  });
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (error) {
    // sem espaço para salvar: o progresso continua válido nesta sessão
  }
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
