"use strict";

/* =========================================================
   IMAGE TOOLS
   Image Converter
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeNavigation();
    initializeFooter();
    initializeConverter();
});


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONVERTER_CONFIG = {
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
    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");

    if (!themeToggle || !themeIcon) {
        return;
    }

    const savedTheme =
        localStorage.getItem("imageToolsTheme");

    const systemPrefersDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    const initialTheme =
        savedTheme ||
        (systemPrefersDark ? "dark" : "light");

    applyTheme(initialTheme, themeIcon);

    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute(
                "data-theme"
            ) || "dark";

        const nextTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        applyTheme(nextTheme, themeIcon);

        localStorage.setItem(
            "imageToolsTheme",
            nextTheme
        );
    });
}


function applyTheme(theme, themeIcon) {
    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    themeIcon.textContent =
        theme === "dark" ? "☀" : "☾";
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {
    const mobileMenuButton =
        document.getElementById(
            "mobileMenuButton"
        );

    const mobileNavigation =
        document.getElementById(
            "mobileNavigation"
        );

    if (!mobileMenuButton || !mobileNavigation) {
        return;
    }

    mobileMenuButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            const isOpen =
                mobileNavigation.classList.toggle(
                    "is-open"
                );

            mobileMenuButton.classList.toggle(
                "is-open",
                isOpen
            );

            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }
    );

    mobileNavigation
        .querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener("click", () => {
                closeMobileNavigation(
                    mobileMenuButton,
                    mobileNavigation
                );
            });
        });

    document.addEventListener(
        "click",
        (event) => {
            const clickedInsideNavigation =
                mobileNavigation.contains(
                    event.target
                );

            const clickedMenuButton =
                mobileMenuButton.contains(
                    event.target
                );

            if (
                !clickedInsideNavigation &&
                !clickedMenuButton
            ) {
                closeMobileNavigation(
                    mobileMenuButton,
                    mobileNavigation
                );
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Escape") {
                closeMobileNavigation(
                    mobileMenuButton,
                    mobileNavigation
                );
            }
        }
    );

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileNavigation(
                mobileMenuButton,
                mobileNavigation
            );
        }
    });
}


function closeMobileNavigation(
    button,
    navigation
) {
    navigation.classList.remove("is-open");
    button.classList.remove("is-open");

    button.setAttribute(
        "aria-expanded",
        "false"
    );
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
   CONVERTER
   ========================================================= */

function initializeConverter() {
    const elements = getConverterElements();

    if (
        !elements.uploadZone ||
        !elements.imageInput ||
        !elements.convertButton
    ) {
        console.error(
            "Converter elements were not found."
        );

        return;
    }

    const state = {
        originalFile: null,
        imageElement: null,
        originalObjectUrl: null,

        convertedBlob: null,
        convertedObjectUrl: null,
        convertedFileName: "",

        isProcessing: false
    };

    bindUploadEvents(elements, state);
    bindControlEvents(elements, state);
    bindActionEvents(elements, state);

    loadTransferredImage(elements, state);
}


/* =========================================================
   ELEMENT REFERENCES
   ========================================================= */

function getConverterElements() {
    return {
        uploadZone:
            getElement(
                "converterUploadZone",
                "compressorUploadZone"
            ),

        imageInput:
            getElement(
                "converterImageInput",
                "compressorImageInput"
            ),

        browseButton:
            getElement(
                "converterBrowseButton",
                "compressorBrowseButton"
            ),

        errorMessage:
            getElement(
                "converterErrorMessage",
                "compressorErrorMessage"
            ),

        converterInterface:
            getElement(
                "converterInterface",
                "compressorInterface"
            ),

        thumbnail:
            getElement(
                "converterThumbnail",
                "compressorThumbnail"
            ),

        fileName:
            getElement(
                "converterFileName",
                "compressorFileName"
            ),

        fileMeta:
            getElement(
                "converterFileMeta",
                "compressorFileMeta"
            ),

        changeImageButton:
            getElement(
                "converterChangeImageButton",
                "compressorChangeImageButton"
            ),

        originalImagePreview:
            document.getElementById(
                "originalImagePreview"
            ),

        convertedImagePreview:
            getElement(
                "convertedImagePreview",
                "compressedImagePreview"
            ),

        convertedPlaceholder:
            getElement(
                "convertedPlaceholder",
                "compressedPlaceholder"
            ),

        originalImageSize:
            document.getElementById(
                "originalImageSize"
            ),

        convertedImageSize:
            getElement(
                "convertedImageSize",
                "compressedImageSize"
            ),

        conversionStatus:
            getElement(
                "conversionStatus",
                "compressionStatus"
            ),

        outputFormat:
            document.getElementById(
                "outputFormat"
            ),

        originalStatSize:
            document.getElementById(
                "originalStatSize"
            ),

        convertedStatSize:
            getElement(
                "convertedStatSize",
                "compressedStatSize"
            ),

        sizeDifferenceValue:
            getElement(
                "sizeDifferenceValue",
                "spaceSavedValue"
            ),

        imageDimensions:
            document.getElementById(
                "imageDimensions"
            ),

        convertButton:
            getElement(
                "convertButton",
                "compressButton"
            ),

        downloadButton:
            getElement(
                "downloadConvertedButton",
                "downloadCompressedButton"
            ),

        resetButton:
            getElement(
                "resetConverterButton",
                "resetCompressorButton"
            )
    };
}


function getElement(primaryId, fallbackId) {
    return (
        document.getElementById(primaryId) ||
        document.getElementById(fallbackId)
    );
}


/* =========================================================
   UPLOAD EVENTS
   ========================================================= */

function bindUploadEvents(elements, state) {
    elements.uploadZone.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                elements.browseButton
            ) {
                return;
            }

            elements.imageInput.click();
        }
    );

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
            const file =
                elements.imageInput.files?.[0];

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

    ["dragenter", "dragover"].forEach(
        (eventName) => {
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
        }
    );

    ["dragleave", "drop"].forEach(
        (eventName) => {
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
        }
    );

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
    elements.outputFormat?.addEventListener(
        "change",
        () => {
            clearConvertedResult(
                elements,
                state
            );

            clearError(elements);

            setStatus(
                elements,
                "Ready",
                "ready"
            );
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

    elements.convertButton.addEventListener(
        "click",
        async () => {
            await convertSelectedImage(
                elements,
                state
            );
        }
    );

    elements.downloadButton?.addEventListener(
        "click",
        () => {
            downloadConvertedImage(state);
        }
    );

    elements.resetButton?.addEventListener(
        "click",
        () => {
            resetConverter(elements, state);
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

    const validationMessage =
        validateImageFile(file);

    if (validationMessage) {
        showError(
            elements,
            validationMessage
        );

        return;
    }

    try {
        setStatus(
            elements,
            "Loading",
            "processing"
        );

        const loadedImage =
            await loadImageFromFile(file);

        clearStateUrls(state);

        state.originalFile = file;
        state.imageElement =
            loadedImage.image;

        state.originalObjectUrl =
            loadedImage.objectUrl;

        clearConvertedResult(
            elements,
            state
        );

        showSelectedImage(
            elements,
            state
        );

        chooseDefaultOutputFormat(
            elements,
            file.type
        );

        setStatus(
            elements,
            "Ready",
            "ready"
        );
    } catch (error) {
        console.error(
            "Image loading failed:",
            error
        );

        showError(
            elements,
            "The image could not be opened. It may be damaged or unsupported."
        );

        setStatus(
            elements,
            "Error",
            "error"
        );
    }
}


function validateImageFile(file) {
    if (!file) {
        return "Please select an image.";
    }

    if (
        !CONVERTER_CONFIG.allowedTypes.includes(
            file.type
        )
    ) {
        return "Unsupported image format. Please use JPG, PNG, or WebP.";
    }

    if (
        file.size >
        CONVERTER_CONFIG.maxFileSize
    ) {
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
    return new Promise(
        (resolve, reject) => {
            const objectUrl =
                URL.createObjectURL(file);

            const image = new Image();

            image.onload = () => {
                resolve({
                    image,
                    objectUrl
                });
            };

            image.onerror = () => {
                URL.revokeObjectURL(
                    objectUrl
                );

                reject(
                    new Error(
                        "Unable to decode image."
                    )
                );
            };

            image.src = objectUrl;
        }
    );
}


/* =========================================================
   DISPLAY SELECTED IMAGE
   ========================================================= */

function showSelectedImage(
    elements,
    state
) {
    const file =
        state.originalFile;

    const image =
        state.imageElement;

    const previewUrl =
        state.originalObjectUrl;

    if (!file || !image || !previewUrl) {
        return;
    }

    elements.uploadZone.hidden = true;

    elements.converterInterface.hidden =
        false;

    elements.thumbnail.src =
        previewUrl;

    elements.originalImagePreview.src =
        previewUrl;

    elements.fileName.textContent =
        file.name;

    elements.fileMeta.textContent =
        `${formatFileSize(file.size)} • ${getReadableFileType(file.type)}`;

    elements.originalImageSize.textContent =
        formatFileSize(file.size);

    elements.originalStatSize.textContent =
        formatFileSize(file.size);

    elements.imageDimensions.textContent =
        `${image.naturalWidth} × ${image.naturalHeight}`;

    elements.convertedImageSize.textContent =
        "—";

    elements.convertedStatSize.textContent =
        "—";

    elements.sizeDifferenceValue.textContent =
        "—";

    elements.convertButton.disabled = false;
    elements.downloadButton.disabled = true;

    elements.converterInterface.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   DEFAULT OUTPUT FORMAT
   ========================================================= */

function chooseDefaultOutputFormat(
    elements,
    originalType
) {
    if (!elements.outputFormat) {
        return;
    }

    const options =
        Array.from(
            elements.outputFormat.options
        );

    const currentValue =
        elements.outputFormat.value;

    if (
        currentValue &&
        currentValue !== originalType
    ) {
        return;
    }

    const preferredOrder = [
        "image/webp",
        "image/jpeg",
        "image/png"
    ];

    const availableType =
        preferredOrder.find(
            (type) =>
                type !== originalType &&
                options.some(
                    (option) =>
                        option.value === type
                )
        );

    elements.outputFormat.value =
        availableType || "";
}


/* =========================================================
   CONVERSION
   ========================================================= */

async function convertSelectedImage(
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

    const outputType =
        elements.outputFormat?.value;

    if (!outputType) {
        showError(
            elements,
            "Please select an output format."
        );

        elements.outputFormat?.focus();

        return;
    }

    if (
        outputType ===
        state.originalFile.type
    ) {
        showError(
            elements,
            `The image is already ${getReadableFileType(outputType)}. Please choose another format.`
        );

        elements.outputFormat?.focus();

        return;
    }

    state.isProcessing = true;

    clearError(elements);

    setProcessingState(
        elements,
        true
    );

    setStatus(
        elements,
        "Converting",
        "processing"
    );

    try {
        const convertedBlob =
            await createConvertedBlob({
                image:
                    state.imageElement,

                outputType
            });

        if (!convertedBlob) {
            throw new Error(
                "The browser did not create an output image."
            );
        }

        if (
            state.convertedObjectUrl
        ) {
            URL.revokeObjectURL(
                state.convertedObjectUrl
            );
        }

        state.convertedBlob =
            convertedBlob;

        state.convertedObjectUrl =
            URL.createObjectURL(
                convertedBlob
            );

        state.convertedFileName =
            createOutputFileName(
                state.originalFile.name,
                outputType
            );

        displayConvertedResult(
            elements,
            state
        );

        setStatus(
            elements,
            "Complete",
            "complete"
        );
    } catch (error) {
        console.error(
            "Conversion failed:",
            error
        );

        showError(
            elements,
            "Conversion failed. Please try another image or output format."
        );

        setStatus(
            elements,
            "Error",
            "error"
        );
    } finally {
        state.isProcessing = false;

        setProcessingState(
            elements,
            false
        );
    }
}


/* =========================================================
   CREATE CONVERTED IMAGE
   ========================================================= */

function createConvertedBlob({
    image,
    outputType
}) {
    return new Promise(
        (resolve, reject) => {
            const canvas =
                document.createElement(
                    "canvas"
                );

            const context =
                canvas.getContext("2d", {
                    alpha:
                        outputType !==
                        "image/jpeg"
                });

            if (!context) {
                reject(
                    new Error(
                        "Canvas is unavailable."
                    )
                );

                return;
            }

            canvas.width =
                image.naturalWidth;

            canvas.height =
                image.naturalHeight;

            if (
                outputType ===
                "image/jpeg"
            ) {
                context.fillStyle =
                    "#ffffff";

                context.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }

            context.imageSmoothingEnabled =
                true;

            context.imageSmoothingQuality =
                "high";

            context.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const quality =
                outputType ===
                    "image/jpeg" ||
                outputType ===
                    "image/webp"
                    ? 0.92
                    : undefined;

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
        }
    );
}


/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function displayConvertedResult(
    elements,
    state
) {
    if (
        !state.convertedBlob ||
        !state.convertedObjectUrl ||
        !state.originalFile
    ) {
        return;
    }

    const originalSize =
        state.originalFile.size;

    const convertedSize =
        state.convertedBlob.size;

    elements.convertedPlaceholder.hidden =
        true;

    elements.convertedImagePreview.hidden =
        false;

    elements.convertedImagePreview.src =
        state.convertedObjectUrl;

    elements.convertedImageSize.textContent =
        formatFileSize(convertedSize);

    elements.convertedStatSize.textContent =
        formatFileSize(convertedSize);

    elements.sizeDifferenceValue.textContent =
        calculateSizeDifference(
            originalSize,
            convertedSize
        );

    elements.downloadButton.disabled =
        false;

    elements.downloadButton.classList.add(
        "button-success"
    );
}


/* =========================================================
   SIZE DIFFERENCE
   ========================================================= */

function calculateSizeDifference(
    originalSize,
    convertedSize
) {
    if (!originalSize) {
        return "—";
    }

    const difference =
        convertedSize - originalSize;

    const percentage =
        Math.abs(
            (difference / originalSize) *
                100
        );

    if (difference < 0) {
        return `${percentage.toFixed(1)}% smaller`;
    }

    if (difference > 0) {
        return `${percentage.toFixed(1)}% larger`;
    }

    return "No change";
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadConvertedImage(state) {
    if (
        !state.convertedBlob ||
        !state.convertedObjectUrl
    ) {
        return;
    }

    const downloadLink =
        document.createElement("a");

    downloadLink.href =
        state.convertedObjectUrl;

    downloadLink.download =
        state.convertedFileName ||
        "converted-image";

    document.body.appendChild(
        downloadLink
    );

    downloadLink.click();
    downloadLink.remove();
}


/* =========================================================
   OUTPUT FILE NAME
   ========================================================= */

function createOutputFileName(
    originalName,
    outputType
) {
    const baseName =
        originalName.replace(
            /\.[^/.]+$/,
            ""
        );

    const extensionMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const extension =
        extensionMap[outputType] ||
        "jpg";

    return `${baseName}-converted.${extension}`;
}


/* =========================================================
   CLEAR CONVERTED RESULT
   ========================================================= */

function clearConvertedResult(
    elements,
    state
) {
    if (
        state.convertedObjectUrl
    ) {
        URL.revokeObjectURL(
            state.convertedObjectUrl
        );
    }

    state.convertedBlob = null;
    state.convertedObjectUrl = null;
    state.convertedFileName = "";

    if (
        elements.convertedImagePreview
    ) {
        elements.convertedImagePreview.src =
            "";

        elements.convertedImagePreview.hidden =
            true;
    }

    if (
        elements.convertedPlaceholder
    ) {
        elements.convertedPlaceholder.hidden =
            false;
    }

    if (
        elements.convertedImageSize
    ) {
        elements.convertedImageSize.textContent =
            "—";
    }

    if (
        elements.convertedStatSize
    ) {
        elements.convertedStatSize.textContent =
            "—";
    }

    if (
        elements.sizeDifferenceValue
    ) {
        elements.sizeDifferenceValue.textContent =
            "—";
    }

    if (
        elements.downloadButton
    ) {
        elements.downloadButton.disabled =
            true;

        elements.downloadButton.classList.remove(
            "button-success"
        );
    }
}


/* =========================================================
   RESET
   ========================================================= */

function resetConverter(
    elements,
    state
) {
    clearStateUrls(state);

    state.originalFile = null;
    state.imageElement = null;
    state.originalObjectUrl = null;

    state.convertedBlob = null;
    state.convertedObjectUrl = null;
    state.convertedFileName = "";

    state.isProcessing = false;

    elements.imageInput.value = "";

    elements.uploadZone.hidden = false;

    elements.converterInterface.hidden =
        true;

    elements.thumbnail.src = "";
    elements.originalImagePreview.src = "";

    elements.convertedImagePreview.src = "";
    elements.convertedImagePreview.hidden =
        true;

    elements.convertedPlaceholder.hidden =
        false;

    elements.fileName.textContent = "";
    elements.fileMeta.textContent = "";

    elements.originalImageSize.textContent =
        "—";

    elements.convertedImageSize.textContent =
        "—";

    elements.originalStatSize.textContent =
        "—";

    elements.convertedStatSize.textContent =
        "—";

    elements.sizeDifferenceValue.textContent =
        "—";

    elements.imageDimensions.textContent =
        "—";

    elements.downloadButton.disabled =
        true;

    elements.downloadButton.classList.remove(
        "button-success"
    );

    if (elements.outputFormat) {
        elements.outputFormat.value = "";
    }

    clearError(elements);

    setStatus(
        elements,
        "Ready",
        "ready"
    );

    sessionStorage.removeItem(
        CONVERTER_CONFIG.sessionStorageKey
    );

    elements.uploadZone.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   PROCESSING STATE
   ========================================================= */

function setProcessingState(
    elements,
    isProcessing
) {
    elements.convertButton.disabled =
        isProcessing;

    elements.outputFormat.disabled =
        isProcessing;

    elements.changeImageButton.disabled =
        isProcessing;

    elements.resetButton.disabled =
        isProcessing;

    elements.convertButton.textContent =
        isProcessing
            ? "Converting..."
            : "Convert image";
}


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(
    elements,
    text,
    status
) {
    if (!elements.conversionStatus) {
        return;
    }

    elements.conversionStatus.textContent =
        text;

    elements.conversionStatus.dataset.status =
        status;
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showError(elements, message) {
    if (!elements.errorMessage) {
        return;
    }

    elements.errorMessage.textContent =
        message;

    elements.errorMessage.hidden =
        false;

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
   CLEAR URLS
   ========================================================= */

function clearStateUrls(state) {
    if (state.originalObjectUrl) {
        URL.revokeObjectURL(
            state.originalObjectUrl
        );
    }

    if (state.convertedObjectUrl) {
        URL.revokeObjectURL(
            state.convertedObjectUrl
        );
    }

    state.originalObjectUrl = null;
    state.convertedObjectUrl = null;
}


/* =========================================================
   FILE SIZE
   ========================================================= */

function formatFileSize(bytes) {
    if (
        !Number.isFinite(bytes) ||
        bytes < 0
    ) {
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

    const unitIndex =
        Math.min(
            Math.floor(
                Math.log(bytes) /
                    Math.log(1024)
            ),
            units.length - 1
        );

    const value =
        bytes /
        Math.pow(1024, unitIndex);

    const decimals =
        unitIndex === 0 ? 0 : 2;

    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}


/* =========================================================
   READABLE FILE TYPE
   ========================================================= */

function getReadableFileType(type) {
    const typeMap = {
        "image/jpeg": "JPG",
        "image/png": "PNG",
        "image/webp": "WebP"
    };

    return typeMap[type] || "Image";
}


/* =========================================================
   SESSION STORAGE IMAGE
   ========================================================= */

async function loadTransferredImage(
    elements,
    state
) {
    const storedValue =
        sessionStorage.getItem(
            CONVERTER_CONFIG.sessionStorageKey
        );

    if (!storedValue) {
        return;
    }

    try {
        const storedImage =
            JSON.parse(storedValue);

        if (
            !storedImage ||
            typeof storedImage.dataUrl !==
                "string"
        ) {
            throw new Error(
                "Invalid stored image."
            );
        }

        const response =
            await fetch(
                storedImage.dataUrl
            );

        const blob =
            await response.blob();

        const fileName =
            storedImage.name ||
            `selected-image.${getExtensionFromType(blob.type)}`;

        const file = new File(
            [blob],
            fileName,
            {
                type:
                    blob.type ||
                    storedImage.type ||
                    "image/png"
            }
        );

        await handleSelectedFile(
            file,
            elements,
            state
        );
    } catch (error) {
        console.error(
            "Stored image could not be loaded:",
            error
        );
    } finally {
        sessionStorage.removeItem(
            CONVERTER_CONFIG.sessionStorageKey
        );
    }
}


function getExtensionFromType(type) {
    const extensionMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    return extensionMap[type] || "png";
}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {
        /*
         * Object URLs are automatically released when
         * the page closes. This listener is kept so the
         * cleanup intention remains explicit.
         */
    }
);