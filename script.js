
"use strict";

/* =====================================
   LOVEBUG LETTERS
   Main editor engine
===================================== */

const $ = (id) => document.getElementById(id);

const canvas = $("letterCanvas");

let stickers = [];
let selectedId = null;
let nextId = 1;
let dragState = null;
let toastTimer;

/* =====================================
   PIXEL ART LIBRARY
===================================== */

const artwork = {
  rose: [
    "....RRRR....",
    "...RRRRRR...",
    "...RRRRRR...",
    "....RRRR....",
    ".....R......",
    ".....R......",
    ".....R......",
    "...GGGG.....",
    "....GG......",
    ".....G......",
    ".....G......",
    "....GG......"
  ],

  tulip: [
    "...RR..RR...",
    "..RRRRRRRR..",
    "...RRRRRR...",
    "....RRRR....",
    ".....R......",
    ".....R......",
    "...GGGGGG....",
    ".....GG......",
    ".....GG......",
    ".....GG......",
    ".....GG......",
    "....GGGG....."
  ],

  daisy: [
    "....WW......",
    "..WWWWWW....",
    ".WWWWWWWW...",
    "..WWYYWW....",
    "...WYYYYW...",
    "....YYYY....",
    ".....G......",
    "....GGGG....",
    ".....GG......",
    ".....GG......",
    "....GG......",
    "...GG......."
  ],

  heart: [
    "..RRR...RRR..",
    ".RRRRR.RRRRR.",
    "RRRRRRRRRRRRR",
    "RRRRRRRRRRRRR",
    ".RRRRRRRRRRR.",
    "..RRRRRRRRR..",
    "...RRRRRRR...",
    "....RRRRR....",
    ".....RRR.....",
    "......R......",
    ".............",
    "............."
  ],

  strawberry: [
    ".....GG......",
    "....GGGG.....",
    "...RRRRRR....",
    "..RRRRRRRR...",
    ".RRRWRRRRRR..",
    ".RRRRRRRRRR..",
    "..RRRWRRRRR..",
    "...RRRRRRR...",
    "....RRRRR....",
    ".....RRR.....",
    "......R......",
    "............."
  ],

  chocolate: [
    ".BBBBBBBBBB..",
    "BBBBBBBBBBBB.",
    "BBLLBBLLBBBB.",
    "BBLLBBLLBBBB.",
    "BBBBBBBBBBBB.",
    "BBLLBBLLBBBB.",
    "BBLLBBLLBBBB.",
    "BBBBBBBBBBBB.",
    ".BBBBBBBBBB..",
    ".............",
    ".............",
    "............."
  ],

  bow: [
    "RRRR....RRRR.",
    "RRRRR..RRRRR.",
    ".RRRRRRRRRR..",
    "..RRRRRRRR...",
    "...RRRRRR....",
    "..RRRRRRRR...",
    ".RRRRRRRRRR..",
    "RRRRR..RRRRR.",
    "RRRR....RRRR.",
    ".............",
    ".............",
    "............."
  ],

  teddy: [
    "..BBBB..BBBB.",
    ".BBBBBBBBBBBB",
    "BBBBBBBBBBBBB",
    "BBWWBBBBWWBBB",
    "BBWWBBBBWWBBB",
    "BBBBBBYBBBBBB",
    ".BBBBBBBBBBB.",
    "..BBBBBBBBB..",
    "..BB.BBBB.BB.",
    "...BBBBBBBB..",
    "...BB....BB..",
    "............."
  ],

  star: [
    "......Y......",
    ".....YYY.....",
    ".....YYY.....",
    "YYYYYYYYYYYYY",
    ".YYYYYYYYYYY.",
    "..YYYYYYYYY..",
    "...YYYYYYY...",
    "..YYYY.YYYY..",
    ".YYY...YYYYY.",
    "YY......YYY..",
    ".............",
    "............."
  ]
};

const colors = {
  R: "#D93657",
  G: "#57966B",
  W: "#FFFFFF",
  Y: "#FFD36A",
  B: "#86452F",
  L: "#C78B62"
};

/* =====================================
   SVG GENERATOR
===================================== */

/**
 * @param {string} name
 * @returns {string}
 */
function createPixelSVG(name) {
  const pattern = artwork[name];

  if (!pattern) return "";

  const width = pattern[0].length;
  const height = pattern.length;

  let pixels = "";

  pattern.forEach((line, y) => {
    [...line].forEach((cell, x) => {
      if (colors[cell]) {
        pixels += `
          <rect
            x="${x}"
            y="${y}"
            width="1"
            height="1"
            fill="${colors[cell]}"
          />
        `;
      }
    });
  });

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${width} ${height}"
      shape-rendering="crispEdges"
      role="img"
      aria-label="${name}"
    >
      ${pixels}
    </svg>
  `;
}

/* =====================================
   STICKER CREATION
===================================== */

/**
 * @param {string} type
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {number} rotation
 * @param {number} z
 * @returns {object}
 */
function createSticker(type, x, y, size = 65, rotation = 0, z = null) {
  if (!artwork[type]) return null;

  const sticker = {
    id: nextId++,
    type,
    x,
    y,
    size,
    rotation,
    z: z === null ? stickers.length + 5 : z
  };

  stickers.push(sticker);

  renderSticker(sticker);
  selectSticker(sticker.id);

  return sticker;
}

/* =====================================
   STICKER RENDERING
===================================== */

/**
 * @param {object} sticker
 */
function renderSticker(sticker) {
  let element = document.querySelector(
    `[data-sticker-id="${sticker.id}"]`
  );

  if (!element) {
    element = document.createElement("div");

    element.className = "canvas-sticker";
    element.dataset.stickerId = sticker.id;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", sticker.type + " sticker");
    element.tabIndex = 0;

    element.addEventListener("pointerdown", startDrag);

    element.addEventListener("click", () => {
      selectSticker(sticker.id);
    });

    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSticker(sticker.id);
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        selectSticker(sticker.id);
        deleteSelected();
      }
    });

    canvas.appendChild(element);
  }

  element.innerHTML = createPixelSVG(sticker.type);

  element.style.left = sticker.x + "%";
  element.style.top = sticker.y + "%";
  element.style.width = sticker.size + "px";
  element.style.height = sticker.size + "px";
  element.style.zIndex = sticker.z;
  element.style.transform =
    `translate(-50%, -50%) rotate(${sticker.rotation}deg)`;

  element.classList.toggle(
    "selected",
    sticker.id === selectedId
  );
}

/* =====================================
   SELECTION
===================================== */

/**
 * @param {number|null} id
 */
function selectSticker(id) {
  selectedId = id;

  stickers.forEach(sticker => {
    renderSticker(sticker);
  });

  updateControls();
}

/**
 * @returns {object|undefined}
 */
function getSelected() {
  return stickers.find(sticker => sticker.id === selectedId);
}

function updateControls() {
  const sticker = getSelected();

  const controls = [
    "smallerButton",
    "biggerButton",
    "rotateButton",
    "backButton",
    "frontButton",
    "deleteButton"
  ];

  controls.forEach(id => {
    $(id).disabled = !sticker;
  });

  $("selectedLabel").textContent = sticker
    ? "Selected: " + sticker.type
    : "No sticker selected";
}

/* =====================================
   DRAG AND DROP
===================================== */

/**
 * @param {PointerEvent} event
 */
function startDrag(event) {
  if (event.button !== 0) return;

  const element = event.currentTarget;
  const id = Number(element.dataset.stickerId);

  const sticker = stickers.find(item => item.id === id);

  if (!sticker) return;

  event.preventDefault();

  selectSticker(id);

  const rect = canvas.getBoundingClientRect();

  dragState = {
    id,
    startX: event.clientX,
    startY: event.clientY,
    originalX: sticker.x,
    originalY: sticker.y,
    width: rect.width,
    height: rect.height,
    moved: false
  };

  element.setPointerCapture(event.pointerId);

  element.addEventListener("pointermove", moveSticker);
  element.addEventListener("pointerup", stopDrag);
  element.addEventListener("pointercancel", stopDrag);
}

/**
 * @param {PointerEvent} event
 */
function moveSticker(event) {
  if (!dragState) return;

  const sticker = stickers.find(
    item => item.id === dragState.id
  );

  if (!sticker) return;

  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;

  if (Math.abs(deltaX) + Math.abs(deltaY) > 2) {
    dragState.moved = true;
  }

  sticker.x = Math.max(
    0,
    Math.min(
      100,
      dragState.originalX +
      (deltaX / dragState.width) * 100
    )
  );

  sticker.y = Math.max(
    0,
    Math.min(
      100,
      dragState.originalY +
      (deltaY / dragState.height) * 100
    )
  );

  renderSticker(sticker);
}

/**
 * @param {PointerEvent} event
 */
function stopDrag(event) {
  if (!dragState) return;

  const element = event.currentTarget;

  element.removeEventListener("pointermove", moveSticker);
  element.removeEventListener("pointerup", stopDrag);
  element.removeEventListener("pointercancel", stopDrag);

  dragState = null;

  updateSaveStatus();
}

/* =====================================
   STICKER CONTROLS
===================================== */

function changeSize(amount) {
  const sticker = getSelected();
  if (!sticker) return;

  sticker.size = Math.max(
    25,
    Math.min(180, sticker.size + amount)
  );

  renderSticker(sticker);
  updateSaveStatus();
}

function rotateSticker() {
  const sticker = getSelected();
  if (!sticker) return;

  sticker.rotation = (sticker.rotation + 15) % 360;

  renderSticker(sticker);
  updateSaveStatus();
}

function changeLayer(amount) {
  const sticker = getSelected();
  if (!sticker) return;

  const sorted = [...stickers].sort((a, b) => a.z - b.z);
  const index = sorted.findIndex(item => item.id === sticker.id);

  const target = index + amount;

  if (target < 0 || target >= sorted.length) return;

  const other = sorted[target];
  const oldZ = sticker.z;

  sticker.z = other.z;
  other.z = oldZ;

  stickers.forEach(renderSticker);
  updateSaveStatus();
}

function deleteSelected() {
  if (selectedId === null) return;

  const element = document.querySelector(
    `[data-sticker-id="${selectedId}"]`
  );

  if (element) element.remove();

  stickers = stickers.filter(
    sticker => sticker.id !== selectedId
  );

  selectedId = null;

  updateControls();
  updateSaveStatus();
}

function clearAllStickers() {
  stickers = [];
  selectedId = null;

  canvas.querySelectorAll(".canvas-sticker").forEach(element => {
    element.remove();
  });

  updateControls();
  updateSaveStatus();

  showToast("All decorations cleared.");
}

/* =====================================
   LETTER LIVE PREVIEW
===================================== */

function updateLetter() {
  $("recipientPreview").textContent =
    $("recipientInput").value.trim() || "To someone special";

  $("senderPreview").textContent =
    $("senderInput").value.trim() || "Someone special";

  $("messagePreview").textContent =
    $("messageInput").value || "Your sweet little message goes here...";

  $("messagePreview").style.fontFamily =
    `"${$("fontSelect").value}", cursive`;

  $("characterCount").textContent =
    $("messageInput").value.length;

  const papers = {
    cream: "#FFFAF3",
    pink: "#FFF0F5",
    white: "#FFFEFC",
    rose: "#FFF2F0"
  };

  canvas.style.background =
    papers[$("paperSelect").value] || papers.cream;

  updateSaveStatus();
}

/* =====================================
   TOAST AND SAVE STATUS
===================================== */

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function updateSaveStatus() {
  $("saveStatus").textContent = "Unsaved changes";
}

/* =====================================
   SHAREABLE LETTERS
===================================== */

function getLetterData() {
  return {
    version: 1,

    recipient: $("recipientInput").value,
    sender: $("senderInput").value,
    message: $("messageInput").value,

    font: $("fontSelect").value,
    paper: $("paperSelect").value,

    stickers: stickers.map(sticker => ({
      type: sticker.type,
      x: sticker.x,
      y: sticker.y,
      size: sticker.size,
      rotation: sticker.rotation,
      z: sticker.z
    }))
  };
}

function encodeLetter() {
  const json = JSON.stringify(getLetterData());

  const bytes = new TextEncoder().encode(json);

  let binary = "";

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeLetter(encoded) {
  try {
    let base64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    while (base64.length % 4) {
      base64 += "=";
    }

    const binary = atob(base64);

    const bytes = Uint8Array.from(
      binary,
      char => char.charCodeAt(0)
    );

    return JSON.parse(
      new TextDecoder().decode(bytes)
    );

  } catch (error) {
    return null;
  }
}

async function shareLetter() {
  if (!$("messageInput").value.trim()) {
    showToast("Write your letter first.");
    return;
  }

  try {
    const encoded = encodeLetter();

    const url = new URL(window.location.href);

    url.hash = "letter=" + encoded;

    await navigator.clipboard.writeText(url.href);

    $("saveStatus").textContent = "Letter link copied";

    showToast("Your letter link is ready!");

  } catch (error) {
    showToast("Couldn't copy automatically. Check browser permissions.");
  }
}

/* =====================================
   LOAD SHARED LETTER
===================================== */

function loadSharedLetter() {
  const hash = window.location.hash;

  if (!hash.startsWith("#letter=")) return;

  const encoded = hash.slice(8);

  const data = decodeLetter(encoded);

  if (!data || data.version !== 1) {
    showToast("This letter link is invalid.");
    return;
  }

  $("recipientInput").value = data.recipient || "";
  $("senderInput").value = data.sender || "";
  $("messageInput").value = data.message || "";

  const fonts = [
    "Dancing Script",
    "Playfair Display",
    "Pacifico",
    "Quicksand",
    "DM Sans"
  ];

  const papers = ["cream", "pink", "white", "rose"];

  $("fontSelect").value = fonts.includes(data.font)
    ? data.font
    : "Dancing Script";

  $("paperSelect").value = papers.includes(data.paper)
    ? data.paper
    : "cream";

  stickers = [];
  nextId = 1;
  selectedId = null;

  if (Array.isArray(data.stickers)) {
    data.stickers.slice(0, 80).forEach(item => {
      if (
        !artwork[item.type] ||
        !Number.isFinite(item.x) ||
        !Number.isFinite(item.y)
      ) return;

      createSticker(
        item.type,
        Math.max(0, Math.min(100, item.x)),
        Math.max(0, Math.min(100, item.y)),
        Math.max(25, Math.min(180, Number(item.size) || 65)),
        Number(item.rotation) || 0,
        Number.isFinite(item.z) ? item.z : null
      );
    });
  }

  selectSticker(null);
  updateLetter();

  $("saveStatus").textContent = "Shared letter loaded";
}

/* =====================================
   NEW LETTER
===================================== */

function resetLetter() {
  if (!confirm("Start a new letter? Your current design will be cleared.")) {
    return;
  }

  $("recipientInput").value = "";
  $("senderInput").value = "";
  $("messageInput").value = "";

  $("fontSelect").value = "Dancing Script";
  $("paperSelect").value = "cream";

  clearAllStickers();

  window.history.replaceState(
    null,
    "",
    window.location.pathname
  );

  updateLetter();

  showToast("A fresh little letter!");
}

/* =====================================
   EVENT LISTENERS
===================================== */

[
  "recipientInput",
  "senderInput",
  "messageInput",
  "fontSelect",
  "paperSelect"
].forEach(id => {
  $(id).addEventListener("input", updateLetter);
  $(id).addEventListener("change", updateLetter);
});

document.querySelectorAll("[data-sticker]").forEach(button => {
  button.addEventListener("click", () => {
    const rect = canvas.getBoundingClientRect();

    createSticker(
      button.dataset.sticker,
      50,
      Math.min(50, 50 + (stickers.length * 4) % 30)
    );

    showToast("Decoration added! Drag it anywhere.");
  });
});

$("smallerButton").addEventListener("click", () => changeSize(-10));
$("biggerButton").addEventListener("click", () => changeSize(10));
$("rotateButton").addEventListener("click", rotateSticker);

$("backButton").addEventListener("click", () => changeLayer(-1));
$("frontButton").addEventListener("click", () => changeLayer(1));

$("deleteButton").addEventListener("click", deleteSelected);

$("clearSelection").addEventListener("click", () => {
  selectSticker(null);
});

$("clearStickers").addEventListener("click", clearAllStickers);

$("resetButton").addEventListener("click", resetLetter);

$("shareButton").addEventListener("click", shareLetter);

/* =====================================
   INITIALIZE
===================================== */

updateControls();
loadSharedLetter();
updateLetter();

$("saveStatus").textContent = "Ready to create";

