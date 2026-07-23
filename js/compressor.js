"use strict";

/* =========================================================
   IMAGE TOOLS
   Image Compressor
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeNavigation();
    initializeFooter();
    initializeCompressor();
});


/* =========================================================
   CONFIGURATION
   ========================================================= */

const COMPRESSOR_CONFIG = {
    maxFileSize: 20 * 1024 * 1024,

    allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp"
    ],

    sessionStorageKey: "imageToolsSelectedImage"
};


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    if (!themeToggle || !themeIcon) {
        return;
    }

    const savedTheme = localStorage.getItem("imageToolsTheme");

    const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme = savedTheme || (
        systemPrefersDark ? "dark" : "light"
    );

    applyTheme(initialTheme, themeIcon);

    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "dark";

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        applyTheme(newTheme, themeIcon);

        localStorage.setItem("imageToolsTheme", newTheme);
    });
}


function applyTheme(theme, themeIcon) {
    document.documentElement.setAttribute("data-theme", theme);

    if (themeIcon) {
        themeIcon.textContent = theme === "dark" ? "☀" : "☾";
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {
    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const mobileNavigation =
        document.getElementById("mobileNavigation");

    if (!mobileMenuButton || !mobileNavigation) {
        return;
    }

    mobileMenuButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen =
            mobileNavigation.classList.toggle("is-open");

        mobileMenuButton.classList.toggle(
            "is-open",
            isOpen
        );

        mobileMenuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    mobileNavigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            closeMobileNavigation(
                mobileMenuButton,
                mobileNavigation
            );
        });
    });

    document.addEventListener("click", (event) => {
        const clickedInsideNavigation =
            mobileNavigation.contains(event.target);

        const clickedMenuButton =
            mobileMenuButton.contains(event.target);

        if (!clickedInsideNavigation && !clickedMenuButton) {
            closeMobileNavigation(
                mobileMenuButton,
                mobileNavigation
            );
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileNavigation(
                mobileMenuButton,
                mobileNavigation
            );
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileNavigation(
                mobileMenuButton,
                mobileNavigation
            );
        }
    });
}


function closeMobileNavigation(button, navigation) {
    navigation.classList.remove("is-open");
    button.classList.remove("is-open");

    button.setAttribute("aria-expanded", "false");
}


/* =========================================================
   FOOTER
   ========================================================= */

function initializeFooter() {
    const currentYear =
        document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent =
            String(new Date().getFullYear());
    }
}


/* =========================================================
   COMPRESSOR
   ========================================================= */

function initializeCompressor() {
    const elements = getCompressorElements();

    if (
        !elements.uploadZone ||
        !elements.imageInput ||
        !elements.compressButton
    ) {
        return;
    }

    const state = {
        originalFile: null,
        imageElement: null,
        originalObjectUrl: null,
        compressedBlob: null,
        compressedObjectUrl: null,
        compressedFileName: null,
        isProcessing: false
    };

    bindUploadEvents(elements, state);
    bindControlEvents(elements, state);
    bindActionEvents(elements, state);

    updateQualityDisplay(elements);

    loadTransferredImage(elements, state);
}


/* =========================================================
   ELEMENT REFERENCES
   ========================================================= */

function getCompressorElements() {
    return {
        uploadZone:
            document.getElementById("compressorUploadZone"),

        imageInput:
            document.getElementById("compressorImageInput"),

        browseButton:
            document.getElementById("compressorBrowseButton"),

        errorMessage:
            document.getElementById("compressorErrorMessage"),

        compressorInterface:
            document.getElementById("compressorInterface"),

        thumbnail:
            document.getElementById("compressorThumbnail"),

        fileName:
            document.getElementById("compressorFileName"),

        fileMeta:
            document.getElementById("compressorFileMeta"),

        changeImageButton:
            document.getElementById(
                "compressorChangeImageButton"
            ),

        originalImagePreview:
            document.getElementById("originalImagePreview"),

        compressedImagePreview:
            document.getElementById(
                "compressedImagePreview"
            ),

        compressedPlaceholder:
            document.getElementById(
                "compressedPlaceholder"
            ),

        originalImageSize:
            document.getElementById("originalImageSize"),

        compressedImageSize:
            document.getElementById(
                "compressedImageSize"
            ),

        compressionStatus:
            document.getElementById("compressionStatus"),

        qualityRange:
            document.getElementById("qualityRange"),

        qualityValue:
            document.getElementById("qualityValue"),

        outputFormat:
            document.getElementById("outputFormat"),

        originalStatSize:
            document.getElementById("originalStatSize"),

        compressedStatSize:
            document.getElementById(
                "compressedStatSize"
            ),

        spaceSavedValue:
            document.getElementById("spaceSavedValue"),

        imageDimensions:
            document.getElementById("imageDimensions"),

        compressButton:
            document.getElementById("compressButton"),

        downloadButton:
            document.getElementById(
                "downloadCompressedButton"
            ),

        resetButton:
            document.getElementById(
                "resetCompressorButton"
            )
    };
}


/* =========================================================
   UPLOAD EVENTS
   ========================================================= */

function bindUploadEvents(elements, state) {
    elements.uploadZone.addEventListener("click", (event) => {
        if (event.target === elements.browseButton) {
            return;
        }

        elements.imageInput.click();
    });

    elements.browseButton?.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            elements.imageInput.click();
        }
    );

    elements.uploadZone.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                elements.imageInput.click();
            }
        }
    );

    elements.imageInput.addEventListener(
        "change",
        async () => {
            const file = elements.imageInput.files?.[0];

            if (file) {
                await handleSelectedFile(
                    file,
                    elements,
                    state
                );
            }

            elements.imageInput.value = "";
        }
    );

    ["dragenter", "dragover"].forEach((eventName) => {
        elements.uploadZone.addEventListener(
            eventName,
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                elements.uploadZone.classList.add(
                    "is-dragover"
                );
            }
        );
    });

    ["dragleave", "drop"].forEach((eventName) => {
        elements.uploadZone.addEventListener(
            eventName,
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                elements.uploadZone.classList.remove(
                    "is-dragover"
                );
            }
        );
    });

    elements.uploadZone.addEventListener(
        "drop",
        async (event) => {
            const file =
                event.dataTransfer?.files?.[0];

            if (file) {
                await handleSelectedFile(
                    file,
                    elements,
                    state
                );
            }
        }
    );
}


/* =========================================================
   CONTROL EVENTS
   ========================================================= */

function bindControlEvents(elements, state) {
    elements.qualityRange?.addEventListener(
        "input",
        () => {
            updateQualityDisplay(elements);

            if (state.compressedBlob) {
                clearCompressedResult(elements, state);
                setStatus(elements, "Ready", "ready");
            }
        }
    );

    elements.outputFormat?.addEventListener(
        "change",
        () => {
            if (state.compressedBlob) {
                clearCompressedResult(elements, state);
                setStatus(elements, "Ready", "ready");
            }
        }
    );
}


/* =========================================================
   ACTION EVENTS
   ========================================================= */

function bindActionEvents(elements, state) {
    elements.changeImageButton?.addEventListener(
        "click",
        () => {
            elements.imageInput.click();
        }
    );

    elements.compressButton.addEventListener(
        "click",
        async () => {
            await compressSelectedImage(
                elements,
                state
            );
        }
    );

    elements.downloadButton?.addEventListener(
        "click",
        () => {
            downloadCompressedImage(state);
        }
    );

    elements.resetButton?.addEventListener(
        "click",
        () => {
            resetCompressor(elements, state);
        }
    );
}


/* =========================================================
   FILE SELECTION
   ========================================================= */

async function handleSelectedFile(
    file,
    elements,
    state
) {
    clearError(elements);

    const validationMessage = validateImageFile(file);

    if (validationMessage) {
        showError(elements, validationMessage);
        return;
    }

    try {
        setStatus(elements, "Loading", "processing");

        const loadedImage = await loadImageFromFile(file);

        clearStateUrls(state);

        state.originalFile = file;
        state.imageElement = loadedImage.image;
        state.originalObjectUrl = loadedImage.objectUrl;

        clearCompressedResult(elements, state);

        showSelectedImage(elements, state);

        setStatus(elements, "Ready", "ready");
    } catch (error) {
        console.error("Image loading failed:", error);

        showError(
            elements,
            "The image could not be opened. It may be damaged or use an unsupported format."
        );

        setStatus(elements, "Error", "error");
    }
}


function validateImageFile(file) {
    if (!file) {
        return "Please select an image.";
    }

    if (
        !COMPRESSOR_CONFIG.allowedTypes.includes(file.type)
    ) {
        return "Unsupported image format. Please use JPG, PNG, or WebP.";
    }

    if (file.size > COMPRESSOR_CONFIG.maxFileSize) {
        return "The selected image is larger than 20 MB.";
    }

    if (file.size === 0) {
        return "The selected image is empty.";
    }

    return "";
}


/* =========================================================
   IMAGE LOADING
   ========================================================= */

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            resolve({
                image,
                objectUrl
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Unable to decode image."));
        };

        image.src = objectUrl;
    });
}


/* =========================================================
   DISPLAY SELECTED IMAGE
   ========================================================= */

function showSelectedImage(elements, state) {
    const file = state.originalFile;
    const image = state.imageElement;
    const previewUrl = state.originalObjectUrl;

    if (!file || !image || !previewUrl) {
        return;
    }

    elements.uploadZone.hidden = true;
    elements.compressorInterface.hidden = false;

    elements.thumbnail.src = previewUrl;
    elements.originalImagePreview.src = previewUrl;

    elements.fileName.textContent = file.name;

    elements.fileMeta.textContent =
        `${formatFileSize(file.size)} • ${getReadableFileType(file.type)}`;

    elements.originalImageSize.textContent =
        formatFileSize(file.size);

    elements.originalStatSize.textContent =
        formatFileSize(file.size);

    elements.imageDimensions.textContent =
        `${image.naturalWidth} × ${image.naturalHeight}`;

    elements.compressedImageSize.textContent = "—";
    elements.compressedStatSize.textContent = "—";
    elements.spaceSavedValue.textContent = "—";

    elements.compressButton.disabled = false;
    elements.downloadButton.disabled = true;

    elements.compressorInterface.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   QUALITY DISPLAY
   ========================================================= */

function updateQualityDisplay(elements) {
    if (!elements.qualityRange) {
        return;
    }

    const quality = Number(elements.qualityRange.value);
    const minimum = Number(elements.qualityRange.min);
    const maximum = Number(elements.qualityRange.max);

    const progress =
        ((quality - minimum) / (maximum - minimum)) * 100;

    if (elements.qualityValue) {
        elements.qualityValue.textContent = `${quality}%`;
    }

    elements.qualityRange.style.background = `
        linear-gradient(
            to right,
            var(--primary) 0%,
            var(--secondary) ${progress}%,
            var(--border) ${progress}%,
            var(--border) 100%
        )
    `;
}


/* =========================================================
   COMPRESSION
   ========================================================= */

async function compressSelectedImage(
    elements,
    state
) {
    if (
        !state.originalFile ||
        !state.imageElement ||
        state.isProcessing
    ) {
        return;
    }

    state.isProcessing = true;

    setProcessingState(elements, true);
    clearError(elements);

    try {
        const quality =
            Number(elements.qualityRange.value) / 100;

        const outputType = getSelectedOutputType(
            elements,
            state.originalFile.type
        );

        const compressedBlob = await createCompressedBlob({
            image: state.imageElement,
            outputType,
            quality
        });

        if (!compressedBlob) {
            throw new Error(
                "The browser did not create an output image."
            );
        }

        if (state.compressedObjectUrl) {
            URL.revokeObjectURL(
                state.compressedObjectUrl
            );
        }

        state.compressedBlob = compressedBlob;

        state.compressedObjectUrl =
            URL.createObjectURL(compressedBlob);

        state.compressedFileName =
            createOutputFileName(
                state.originalFile.name,
                outputType
            );

        displayCompressedResult(
            elements,
            state
        );

        setStatus(elements, "Complete", "complete");
    } catch (error) {
        console.error("Compression failed:", error);

        showError(
            elements,
            "Compression failed. Please try another image or output format."
        );

        setStatus(elements, "Error", "error");
    } finally {
        state.isProcessing = false;
        setProcessingState(elements, false);
    }
}


function createCompressedBlob({
    image,
    outputType,
    quality
}) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
            alpha: outputType !== "image/jpeg"
        });

        if (!context) {
            reject(
                new Error("Canvas is unavailable.")
            );

            return;
        }

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        /*
         * JPEG does not support transparency.
         * A white background prevents transparent areas
         * from becoming black.
         */
        if (outputType === "image/jpeg") {
            context.fillStyle = "#ffffff";

            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(
                        new Error(
                            "Canvas output was empty."
                        )
                    );

                    return;
                }

                resolve(blob);
            },
            outputType,
            quality
        );
    });
}


/* =========================================================
   OUTPUT TYPE
   ========================================================= */

function getSelectedOutputType(
    elements,
    originalType
) {
    const selectedValue =
        elements.outputFormat?.value || "original";

    if (selectedValue === "original") {
        return originalType;
    }

    return selectedValue;
}


/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function displayCompressedResult(elements, state) {
    if (
        !state.compressedBlob ||
        !state.compressedObjectUrl ||
        !state.originalFile
    ) {
        return;
    }

    const originalSize = state.originalFile.size;
    const compressedSize = state.compressedBlob.size;

    elements.compressedPlaceholder.hidden = true;

    elements.compressedImagePreview.hidden = false;
    elements.compressedImagePreview.src =
        state.compressedObjectUrl;

    elements.compressedImageSize.textContent =
        formatFileSize(compressedSize);

    elements.compressedStatSize.textContent =
        formatFileSize(compressedSize);

    elements.spaceSavedValue.textContent =
        calculateSpaceSaved(
            originalSize,
            compressedSize
        );

    elements.downloadButton.disabled = false;

    elements.downloadButton.classList.add(
        "button-success"
    );
}


/* =========================================================
   STATISTICS
   ========================================================= */

function calculateSpaceSaved(
    originalSize,
    compressedSize
) {
    if (!originalSize) {
        return "—";
    }

    const difference =
        originalSize - compressedSize;

    const percentage =
        Math.abs((difference / originalSize) * 100);

    if (difference > 0) {
        return `${percentage.toFixed(1)}%`;
    }

    if (difference < 0) {
        return `${percentage.toFixed(1)}% larger`;
    }

    return "No change";
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadCompressedImage(state) {
    if (
        !state.compressedBlob ||
        !state.compressedObjectUrl
    ) {
        return;
    }

    const downloadLink =
        document.createElement("a");

    downloadLink.href =
        state.compressedObjectUrl;

    downloadLink.download =
        state.compressedFileName ||
        "compressed-image";

    document.body.appendChild(downloadLink);

    downloadLink.click();
    downloadLink.remove();
}


/* =========================================================
   FILE NAME
   ========================================================= */

function createOutputFileName(
    originalName,
    outputType
) {
    const baseName =
        originalName.replace(/\.[^/.]+$/, "");

    const extensionMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const extension =
        extensionMap[outputType] || "jpg";

    return `${baseName}-compressed.${extension}`;
}


/* =========================================================
   CLEAR RESULT
   ========================================================= */

function clearCompressedResult(elements, state) {
    if (state.compressedObjectUrl) {
        URL.revokeObjectURL(
            state.compressedObjectUrl
        );
    }

    state.compressedBlob = null;
    state.compressedObjectUrl = null;
    state.compressedFileName = null;

    elements.compressedImagePreview.src = "";
    elements.compressedImagePreview.hidden = true;

    elements.compressedPlaceholder.hidden = false;

    elements.compressedImageSize.textContent = "—";
    elements.compressedStatSize.textContent = "—";
    elements.spaceSavedValue.textContent = "—";

    elements.downloadButton.disabled = true;

    elements.downloadButton.classList.remove(
        "button-success"
    );
}


/* =========================================================
   RESET
   ========================================================= */

function resetCompressor(elements, state) {
    clearError(elements);
    clearStateUrls(state);

    state.originalFile = null;
    state.imageElement = null;
    state.originalObjectUrl = null;
    state.compressedBlob = null;
    state.compressedObjectUrl = null;
    state.compressedFileName = null;
    state.isProcessing = false;

    elements.imageInput.value = "";

    elements.thumbnail.src = "";
    elements.originalImagePreview.src = "";
    elements.compressedImagePreview.src = "";

    elements.fileName.textContent = "";
    elements.fileMeta.textContent = "";

    elements.originalImageSize.textContent = "—";
    elements.compressedImageSize.textContent = "—";

    elements.originalStatSize.textContent = "—";
    elements.compressedStatSize.textContent = "—";
    elements.spaceSavedValue.textContent = "—";
    elements.imageDimensions.textContent = "—";

    elements.compressedImagePreview.hidden = true;
    elements.compressedPlaceholder.hidden = false;

    elements.compressorInterface.hidden = true;
    elements.uploadZone.hidden = false;

    elements.qualityRange.value = "80";
    elements.outputFormat.value = "original";

    elements.compressButton.disabled = false;
    elements.downloadButton.disabled = true;

    elements.downloadButton.classList.remove(
        "button-success"
    );

    setProcessingState(elements, false);
    setStatus(elements, "Ready", "ready");

    updateQualityDisplay(elements);

    sessionStorage.removeItem(
        COMPRESSOR_CONFIG.sessionStorageKey
    );

    elements.uploadZone.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   PROCESSING STATE
   ========================================================= */

function setProcessingState(elements, isProcessing) {
    elements.compressorInterface.classList.toggle(
        "is-processing",
        isProcessing
    );

    elements.compressButton.disabled = isProcessing;

    elements.qualityRange.disabled = isProcessing;
    elements.outputFormat.disabled = isProcessing;

    elements.changeImageButton.disabled = isProcessing;
    elements.resetButton.disabled = isProcessing;

    elements.compressButton.textContent =
        isProcessing
            ? "Compressing..."
            : "Compress image";
}


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(elements, text, type) {
    const status = elements.compressionStatus;

    if (!status) {
        return;
    }

    status.textContent = text;

    status.classList.remove(
        "is-processing",
        "is-complete",
        "is-error"
    );

    if (type === "processing") {
        status.classList.add("is-processing");
    }

    if (type === "complete") {
        status.classList.add("is-complete");
    }

    if (type === "error") {
        status.classList.add("is-error");
    }
}


/* =========================================================
   ERRORS
   ========================================================= */

function showError(elements, message) {
    if (!elements.errorMessage) {
        return;
    }

    elements.errorMessage.textContent = message;
    elements.errorMessage.hidden = false;

    elements.errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function clearError(elements) {
    if (!elements.errorMessage) {
        return;
    }

    elements.errorMessage.textContent = "";
    elements.errorMessage.hidden = true;
}


/* =========================================================
   FILE FORMATTING
   ========================================================= */

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return "—";
    }

    if (bytes === 0) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const value =
        bytes / Math.pow(1024, unitIndex);

    const decimalPlaces =
        value >= 100 || unitIndex === 0 ? 0 : 2;

    return `${value.toFixed(decimalPlaces)} ${units[unitIndex]}`;
}


function getReadableFileType(type) {
    const names = {
        "image/jpeg": "JPG",
        "image/png": "PNG",
        "image/webp": "WebP"
    };

    return names[type] || "Image";
}


/* =========================================================
   OBJECT URL CLEANUP
   ========================================================= */

function clearStateUrls(state) {
    if (state.originalObjectUrl) {
        URL.revokeObjectURL(
            state.originalObjectUrl
        );
    }

    if (state.compressedObjectUrl) {
        URL.revokeObjectURL(
            state.compressedObjectUrl
        );
    }
}


/* =========================================================
   HOMEPAGE IMAGE TRANSFER
   ========================================================= */

/*
 * Your homepage can store a selected image using:
 *
 * sessionStorage.setItem(
 *     "imageToolsSelectedImage",
 *     JSON.stringify({
 *         name: file.name,
 *         type: file.type,
 *         dataUrl: result
 *     })
 * );
 *
 * The compressor page will then load it automatically.
 */

async function loadTransferredImage(elements, state) {
    const storedValue = sessionStorage.getItem(
        COMPRESSOR_CONFIG.sessionStorageKey
    );

    if (!storedValue) {
        return;
    }

    try {
        const storedImage = JSON.parse(storedValue);

        if (
            !storedImage ||
            typeof storedImage.dataUrl !== "string"
        ) {
            return;
        }

        const response = await fetch(
            storedImage.dataUrl
        );

        const blob = await response.blob();

        const file = new File(
            [blob],
            storedImage.name || "selected-image",
            {
                type:
                    storedImage.type ||
                    blob.type ||
                    "image/jpeg"
            }
        );

        await handleSelectedFile(
            file,
            elements,
            state
        );

        sessionStorage.removeItem(
            COMPRESSOR_CONFIG.sessionStorageKey
        );
    } catch (error) {
        console.warn(
            "Transferred image could not be loaded:",
            error
        );

        sessionStorage.removeItem(
            COMPRESSOR_CONFIG.sessionStorageKey
        );
    }
}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener("beforeunload", () => {
    /*
     * Object URLs are automatically cleared when the document
     * closes. This listener remains available for future cleanup
     * work without storing application state globally.
     */
});