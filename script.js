
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

let isDrawing = false;
let currentTool = "brush";
let lastX = 0;
let lastY = 0;

let undoStack = [];
let redoStack = [];

let canvasWidth = 0;
let canvasHeight = 0;
let pixelRatio = window.devicePixelRatio || 1;

// Get accurate mouse/touch coordinates relative to the canvas
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Set up the canvas without stretching the drawing coordinates
function setupCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const oldImage = canvas.width && canvas.height
        ? canvas.toDataURL()
        : null;

    canvasWidth = rect.width;
    canvasHeight = rect.height;
    pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);

    // Draw using CSS pixel coordinates
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (oldImage) {
        const image = new Image();

        image.onload = () => {
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        };

        image.src = oldImage;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}

function saveState() {
    undoStack.push(canvas.toDataURL());

    if (undoStack.length > 50) {
        undoStack.shift();
    }

    redoStack = [];
}

function restoreState(dataURL) {
    const image = new Image();

    image.onload = () => {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    };

    image.src = dataURL;
}

function startDrawing(event) {
    event.preventDefault();

    isDrawing = true;

    const point = getCanvasCoordinates(event);

    // Convert backing-canvas coordinates to CSS pixels
    lastX = point.x / pixelRatio;
    lastY = point.y / pixelRatio;

    saveState();

    canvas.setPointerCapture(event.pointerId);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    // Draw a dot when the user clicks without moving
    ctx.lineTo(lastX + 0.01, lastY + 0.01);
    applyBrushSettings();
    ctx.stroke();
}

function draw(event) {
    if (!isDrawing) return;

    event.preventDefault();

    const point = getCanvasCoordinates(event);

    const x = point.x / pixelRatio;
    const y = point.y / pixelRatio;

    applyBrushSettings();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    if (!isDrawing) return;

    isDrawing = false;
    ctx.beginPath();
}

function applyBrushSettings() {
    ctx.lineWidth = Number(brushSize.value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
        ctx.strokeStyle = "#ffffff";
    } else {
        ctx.strokeStyle = colorPicker.value;
    }
}

// Brush tool
brushBtn.addEventListener("click", () => {
    currentTool = "brush";
    brushBtn.classList.add("active");
    eraserBtn.classList.remove("active");
});

// Eraser tool
eraserBtn.addEventListener("click", () => {
    currentTool = "eraser";
    eraserBtn.classList.add("active");
    brushBtn.classList.remove("active");
});

// Brush size
brushSize.addEventListener("input", () => {
    brushSizeValue.textContent = brushSize.value;
});

// Drawing events
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

// Undo
undoBtn.addEventListener("click", () => {
    if (undoStack.length === 0) return;

    redoStack.push(canvas.toDataURL());

    const previousState = undoStack.pop();
    restoreState(previousState);
});

// Redo
redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;

    undoStack.push(canvas.toDataURL());

    const nextState = redoStack.pop();
    restoreState(nextState);
});

// Clear canvas
clearBtn.addEventListener("click", () => {
    const confirmed = confirm("Clear your entire drawing?");

    if (!confirmed) return;

    saveState();

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
});

// Save drawing as PNG
saveBtn.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const exportCtx = exportCanvas.getContext("2d");
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = "my-doodle.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
});

// Keep the canvas aligned when the window changes size
let resizeTimeout;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
        setupCanvas();
    }, 150);
});

// Initialize
setupCanvas();
