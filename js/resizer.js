"use strict";

/* ==========================================================
   ImageTools - Image Resizer
   Part 1
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();
    initializeNavigation();
    initializeFooter();
    initializeResizer();

});


/* ==========================================================
   Configuration
   ========================================================== */

const RESIZER_CONFIG = {

    maxFileSize: 20 * 1024 * 1024,

    allowedTypes: [

        "image/jpeg",
        "image/png",
        "image/webp"

    ],

    sessionStorageKey: "imageToolsSelectedImage"

};


/* ==========================================================
   State
   ========================================================== */

const resizeState = {

    originalFile: null,

    originalImage: null,

    originalWidth: 0,

    originalHeight: 0,

    objectURL: null,

    resizedBlob: null,

    resizedObjectURL: null,

    aspectRatio: 1,

    processing: false

};


/* ==========================================================
   Elements
   ========================================================== */

const elements = {};



/* ==========================================================
   Initialize
   ========================================================== */

function initializeResizer() {

    cacheElements();

    bindUploadEvents();

    bindResizeControls();

    loadTransferredImage();

}



/* ==========================================================
   Cache DOM
   ========================================================== */

function cacheElements() {
    elements.browseButton =
    document.getElementById("resizerBrowseButton");

    elements.uploadZone =
        document.getElementById("resizerUploadZone");

    elements.imageInput =
        document.getElementById("resizerImageInput");

    elements.error =
        document.getElementById("resizerErrorMessage");

    elements.interface =
        document.getElementById("resizerInterface");

    elements.thumbnail =
        document.getElementById("resizerThumbnail");

    elements.fileName =
        document.getElementById("resizerFileName");

    elements.fileMeta =
        document.getElementById("resizerFileMeta");

    elements.changeButton =
        document.getElementById("resizerChangeImageButton");

    elements.originalPreview =
        document.getElementById("originalImagePreview");

    elements.resizedPreview =
        document.getElementById("resizedImagePreview");

    elements.placeholder =
        document.getElementById("resizedPlaceholder");



    elements.width =
        document.getElementById("resizeWidth");

    elements.height =
        document.getElementById("resizeHeight");

    elements.lockAspect =
        document.getElementById("lockAspectRatio");

    elements.resizeMode =
        document.getElementById("resizeMode");

    elements.resizePercentage =
        document.getElementById("resizePercentage");

    elements.resizePreset =
        document.getElementById("resizePreset");

    elements.outputFormat =
        document.getElementById("resizeOutputFormat");



    elements.originalSize =
        document.getElementById("originalStatSize");

    elements.resizedSize =
        document.getElementById("resizedStatSize");

    elements.sizeDifference =
        document.getElementById("sizeDifferenceValue");

    elements.dimensions =
        document.getElementById("imageDimensions");



    elements.status =
        document.getElementById("resizeStatus");

    elements.resizeButton =
        document.getElementById("resizeButton");

    elements.downloadButton =
        document.getElementById("downloadResizedButton");

    elements.resetButton =
        document.getElementById("resetResizerButton");

}



/* ==========================================================
   Upload Events
   ========================================================== */

function bindUploadEvents() {

    elements.uploadZone.addEventListener("click", (event) => {

        if (event.target === elements.browseButton) {
            return;
        }

        elements.imageInput.click();

    });

    elements.browseButton.addEventListener("click", (event) => {

        event.stopPropagation();

        elements.imageInput.click();

    });


    elements.imageInput.addEventListener(

        "change",

        async (event) => {

            const file = event.target.files[0];

            if (!file) return;

            await handleFile(file);

        }

    );


    elements.uploadZone.addEventListener(

        "dragover",

        (event) => {

            event.preventDefault();

            elements.uploadZone.classList.add("dragging");

        }

    );


    elements.uploadZone.addEventListener(

        "dragleave",

        () => {

            elements.uploadZone.classList.remove("dragging");

        }

    );


    elements.uploadZone.addEventListener(

        "drop",

        async (event) => {

            event.preventDefault();

            elements.uploadZone.classList.remove("dragging");

            const file = event.dataTransfer.files[0];

            if (!file) return;

            await handleFile(file);

        }

    );


    elements.changeButton.addEventListener(

        "click",

        () => {

            elements.imageInput.click();

        }

    );

}



/* ==========================================================
   Resize Controls
   ========================================================== */

function bindResizeControls() {

    elements.width.addEventListener(

        "input",

        updateHeightFromWidth

    );



    elements.height.addEventListener(

        "input",

        updateWidthFromHeight

    );



    elements.resizeMode.addEventListener(

        "change",

        switchResizeMode

    );


    elements.resizePreset.addEventListener(

        "change",

        applyPreset

    );

}



/* ==========================================================
   Handle Image
   ========================================================== */

async function handleFile(file) {

    clearError();

    if (

        !RESIZER_CONFIG.allowedTypes.includes(file.type)

    ) {

        showError("Unsupported image format.");

        return;

    }


    if (

        file.size > RESIZER_CONFIG.maxFileSize

    ) {

        showError("Maximum size is 20 MB.");

        return;

    }


    const image = await loadImage(file);


    resizeState.originalFile = file;

    resizeState.originalImage = image;

    resizeState.originalWidth = image.width;

    resizeState.originalHeight = image.height;

    resizeState.aspectRatio =
        image.width / image.height;


    displayImage();

}



/* ==========================================================
   Load Image
   ========================================================== */

function loadImage(file) {

    return new Promise((resolve) => {

        if (resizeState.objectURL)

            URL.revokeObjectURL(resizeState.objectURL);

        resizeState.objectURL =
            URL.createObjectURL(file);

        const img = new Image();

        img.onload = () => resolve(img);

        img.src = resizeState.objectURL;

    });

}



/* ==========================================================
   Display
   ========================================================== */

function displayImage() {

    elements.uploadZone.hidden = true;

    elements.interface.hidden = false;


    elements.thumbnail.src =
        resizeState.objectURL;

    elements.originalPreview.src =
        resizeState.objectURL;


    elements.fileName.textContent =
        resizeState.originalFile.name;

    elements.fileMeta.textContent =

        `${formatSize(resizeState.originalFile.size)} • ${resizeState.originalWidth} × ${resizeState.originalHeight}`;


    elements.width.value =
        resizeState.originalWidth;

    elements.height.value =
        resizeState.originalHeight;


    elements.originalSize.textContent =
        formatSize(resizeState.originalFile.size);

    elements.dimensions.textContent =

        `${resizeState.originalWidth} × ${resizeState.originalHeight}`;

}



/* ==========================================================
   Helper
   ========================================================== */

function formatSize(bytes) {

    if (bytes < 1024)

        return bytes + " B";

    if (bytes < 1024 * 1024)

        return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";

}



function showError(message) {

    elements.error.hidden = false;

    elements.error.textContent = message;

}



function clearError() {

    elements.error.hidden = true;

    elements.error.textContent = "";

}

/* ==========================================================
   ImageTools - Image Resizer
   Part 2: Controls and Image Resizing
   ========================================================== */


/* ==========================================================
   Part 2 Event Setup
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeResizeProcessing
);


function initializeResizeProcessing() {

    const pixelControls =
        document.getElementById(
            "pixelResizeControls"
        );

    const percentageControls =
        document.getElementById(
            "percentageResizeControls"
        );

    elements.pixelControls =
        pixelControls;

    elements.percentageControls =
        percentageControls;


    if (elements.resizePercentage) {

        elements.resizePercentage.addEventListener(
            "input",
            updateDimensionsFromPercentage
        );

    }


    if (elements.lockAspect) {

        elements.lockAspect.addEventListener(
            "change",
            handleAspectRatioToggle
        );

    }


    if (elements.outputFormat) {

        elements.outputFormat.addEventListener(
            "change",
            clearResizedResult
        );

    }


    if (elements.resizeButton) {

        elements.resizeButton.addEventListener(
            "click",
            resizeImage
        );

    }


    switchResizeMode();

}


/* ==========================================================
   Aspect Ratio
   ========================================================== */

function updateHeightFromWidth() {

    if (
        !resizeState.originalImage ||
        !elements.lockAspect.checked
    ) {

        clearResizedResult();

        return;

    }


    const width =
        Number(elements.width.value);


    if (!Number.isFinite(width) || width < 1) {

        return;

    }


    const calculatedHeight =
        Math.round(
            width / resizeState.aspectRatio
        );


    elements.height.value =
        calculatedHeight;


    clearResizedResult();

}


function updateWidthFromHeight() {

    if (
        !resizeState.originalImage ||
        !elements.lockAspect.checked
    ) {

        clearResizedResult();

        return;

    }


    const height =
        Number(elements.height.value);


    if (!Number.isFinite(height) || height < 1) {

        return;

    }


    const calculatedWidth =
        Math.round(
            height * resizeState.aspectRatio
        );


    elements.width.value =
        calculatedWidth;


    clearResizedResult();

}


function handleAspectRatioToggle() {

    if (
        elements.lockAspect.checked &&
        resizeState.originalImage
    ) {

        updateHeightFromWidth();

    }


    clearResizedResult();

}


/* ==========================================================
   Resize Mode
   ========================================================== */

function switchResizeMode() {

    if (
        !elements.resizeMode ||
        !elements.pixelControls ||
        !elements.percentageControls
    ) {

        return;

    }


    const mode =
        elements.resizeMode.value;


    if (mode === "percentage") {

        elements.pixelControls.hidden =
            true;

        elements.percentageControls.hidden =
            false;


        updateDimensionsFromPercentage();

    } else {

        elements.pixelControls.hidden =
            false;

        elements.percentageControls.hidden =
            true;

    }


    clearResizedResult();

}


/* ==========================================================
   Percentage Resize
   ========================================================== */

function updateDimensionsFromPercentage() {

    if (!resizeState.originalImage) {

        return;

    }


    let percentage =
        Number(
            elements.resizePercentage.value
        );


    if (!Number.isFinite(percentage)) {

        return;

    }


    percentage =
        Math.min(
            500,
            Math.max(1, percentage)
        );


    const resizedWidth =
        Math.max(
            1,
            Math.round(
                resizeState.originalWidth *
                percentage /
                100
            )
        );


    const resizedHeight =
        Math.max(
            1,
            Math.round(
                resizeState.originalHeight *
                percentage /
                100
            )
        );


    elements.width.value =
        resizedWidth;

    elements.height.value =
        resizedHeight;


    clearResizedResult();

}


/* ==========================================================
   Preset Sizes
   ========================================================== */

function applyPreset() {

    if (!resizeState.originalImage) {

        return;

    }


    const presetValue =
        elements.resizePreset.value;


    if (!presetValue) {

        return;

    }


    if (presetValue === "original") {

        elements.width.value =
            resizeState.originalWidth;

        elements.height.value =
            resizeState.originalHeight;

        elements.resizePercentage.value =
            100;


        clearResizedResult();

        return;

    }


    const dimensions =
        presetValue.split("x");


    if (dimensions.length !== 2) {

        return;

    }


    const presetWidth =
        Number(dimensions[0]);

    const presetHeight =
        Number(dimensions[1]);


    if (
        !Number.isFinite(presetWidth) ||
        !Number.isFinite(presetHeight)
    ) {

        return;

    }


    /*
     * Presets use their exact dimensions.
     * Aspect ratio lock is disabled because square
     * and social-media presets may crop or stretch
     * the original ratio.
     */

    elements.lockAspect.checked =
        false;


    elements.resizeMode.value =
        "pixels";


    switchResizeMode();


    elements.width.value =
        presetWidth;

    elements.height.value =
        presetHeight;


    clearResizedResult();

}


/* ==========================================================
   Validate Resize Settings
   ========================================================== */

function getResizeDimensions() {

    let width;
    let height;


    if (
        elements.resizeMode.value ===
        "percentage"
    ) {

        const percentage =
            Number(
                elements.resizePercentage.value
            );


        if (
            !Number.isFinite(percentage) ||
            percentage < 1 ||
            percentage > 500
        ) {

            throw new Error(
                "Resize percentage must be between 1% and 500%."
            );

        }


        width =
            Math.max(
                1,
                Math.round(
                    resizeState.originalWidth *
                    percentage /
                    100
                )
            );


        height =
            Math.max(
                1,
                Math.round(
                    resizeState.originalHeight *
                    percentage /
                    100
                )
            );

    } else {

        width =
            Number(elements.width.value);

        height =
            Number(elements.height.value);


        if (
            !Number.isInteger(width) ||
            width < 1
        ) {

            throw new Error(
                "Please enter a valid width."
            );

        }


        if (
            !Number.isInteger(height) ||
            height < 1
        ) {

            throw new Error(
                "Please enter a valid height."
            );

        }

    }


    const maximumDimension = 10000;


    if (
        width > maximumDimension ||
        height > maximumDimension
    ) {

        throw new Error(
            "Width and height cannot exceed 10,000 pixels."
        );

    }


    const totalPixels =
        width * height;


    const maximumPixels =
        60_000_000;


    if (totalPixels > maximumPixels) {

        throw new Error(
            "The requested image dimensions are too large for browser processing."
        );

    }


    return {

        width,

        height

    };

}


/* ==========================================================
   Resize Image
   ========================================================== */

async function resizeImage() {

    clearError();


    if (
        !resizeState.originalFile ||
        !resizeState.originalImage
    ) {

        showError(
            "Please select an image first."
        );

        return;

    }


    if (resizeState.processing) {

        return;

    }


    let dimensions;


    try {

        dimensions =
            getResizeDimensions();

    } catch (error) {

        showError(error.message);

        return;

    }


    resizeState.processing =
        true;


    setResizeProcessingState(true);

    setResizeStatus(
        "Resizing",
        "processing"
    );


    try {

        const outputType =
            getSelectedOutputType();


        const resizedBlob =
            await createResizedBlob(

                resizeState.originalImage,

                dimensions.width,

                dimensions.height,

                outputType

            );


        if (!resizedBlob) {

            throw new Error(
                "The browser could not create the resized image."
            );

        }


        if (
            resizeState.resizedObjectURL
        ) {

            URL.revokeObjectURL(
                resizeState.resizedObjectURL
            );

        }


        resizeState.resizedBlob =
            resizedBlob;


        resizeState.resizedObjectURL =
            URL.createObjectURL(
                resizedBlob
            );


        resizeState.resizedWidth =
            dimensions.width;


        resizeState.resizedHeight =
            dimensions.height;


        resizeState.outputType =
            outputType;


        displayResizedResult();


        setResizeStatus(
            "Complete",
            "complete"
        );

    } catch (error) {

        console.error(
            "Image resizing failed:",
            error
        );


        showError(
            error.message ||
            "The image could not be resized."
        );


        setResizeStatus(
            "Error",
            "error"
        );

    } finally {

        resizeState.processing =
            false;


        setResizeProcessingState(false);

    }

}


/* ==========================================================
   Output Type
   ========================================================== */

function getSelectedOutputType() {

    const selectedValue =
        elements.outputFormat.value;


    if (
        selectedValue === "original" ||
        !selectedValue
    ) {

        return resizeState.originalFile.type;

    }


    return selectedValue;

}


/* ==========================================================
   Canvas Resize
   ========================================================== */

function createResizedBlob(

    image,

    width,

    height,

    outputType

) {

    return new Promise(

        (resolve, reject) => {

            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                width;

            canvas.height =
                height;


            const context =
                canvas.getContext(
                    "2d",
                    {

                        alpha:
                            outputType !==
                            "image/jpeg"

                    }
                );


            if (!context) {

                reject(
                    new Error(
                        "Canvas processing is not supported by this browser."
                    )
                );

                return;

            }


            /*
             * JPG cannot preserve transparency.
             * Transparent areas are filled white.
             */

            if (
                outputType ===
                "image/jpeg"
            ) {

                context.fillStyle =
                    "#ffffff";


                context.fillRect(

                    0,

                    0,

                    width,

                    height

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

                width,

                height

            );


            let quality;


            if (
                outputType === "image/jpeg" ||
                outputType === "image/webp"
            ) {

                quality = 0.92;

            }


            canvas.toBlob(

                (blob) => {

                    if (!blob) {

                        reject(
                            new Error(
                                "The resized image output was empty."
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


/* ==========================================================
   Display Resized Result
   ========================================================== */

function displayResizedResult() {

    if (
        !resizeState.resizedBlob ||
        !resizeState.resizedObjectURL
    ) {

        return;

    }


    elements.placeholder.hidden =
        true;


    elements.resizedPreview.hidden =
        false;


    elements.resizedPreview.src =
        resizeState.resizedObjectURL;


    const resizedImageSize =
        document.getElementById(
            "resizedImageSize"
        );


    if (resizedImageSize) {

        resizedImageSize.textContent =
            formatSize(
                resizeState.resizedBlob.size
            );

    }


    elements.resizedSize.textContent =
        formatSize(
            resizeState.resizedBlob.size
        );


    elements.sizeDifference.textContent =
        calculateSizeDifference(

            resizeState.originalFile.size,

            resizeState.resizedBlob.size

        );


    elements.dimensions.textContent =

        `${resizeState.resizedWidth} × ${resizeState.resizedHeight}`;


    elements.downloadButton.disabled =
        false;

}


/* ==========================================================
   Size Difference
   ========================================================== */

function calculateSizeDifference(

    originalSize,

    resizedSize

) {

    if (!originalSize) {

        return "—";

    }


    const difference =
        resizedSize - originalSize;


    const percentage =
        Math.abs(

            difference /
            originalSize *
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


/* ==========================================================
   Clear Previous Result
   ========================================================== */

function clearResizedResult() {

    if (
        resizeState.resizedObjectURL
    ) {

        URL.revokeObjectURL(
            resizeState.resizedObjectURL
        );

    }


    resizeState.resizedBlob =
        null;


    resizeState.resizedObjectURL =
        null;


    resizeState.resizedWidth =
        0;


    resizeState.resizedHeight =
        0;


    if (elements.resizedPreview) {

        elements.resizedPreview.src =
            "";


        elements.resizedPreview.hidden =
            true;

    }


    if (elements.placeholder) {

        elements.placeholder.hidden =
            false;

    }


    if (elements.resizedSize) {

        elements.resizedSize.textContent =
            "—";

    }


    if (elements.sizeDifference) {

        elements.sizeDifference.textContent =
            "—";

    }


    const resizedImageSize =
        document.getElementById(
            "resizedImageSize"
        );


    if (resizedImageSize) {

        resizedImageSize.textContent =
            "—";

    }


    if (elements.downloadButton) {

        elements.downloadButton.disabled =
            true;

    }


    if (
        resizeState.originalImage &&
        elements.dimensions
    ) {

        elements.dimensions.textContent =

            `${resizeState.originalWidth} × ${resizeState.originalHeight}`;

    }


    if (
        resizeState.originalImage &&
        elements.status
    ) {

        setResizeStatus(
            "Ready",
            "ready"
        );

    }

}


/* ==========================================================
   Processing State
   ========================================================== */

function setResizeProcessingState(

    processing

) {

    if (elements.resizeButton) {

        elements.resizeButton.disabled =
            processing;


        elements.resizeButton.textContent =

            processing
                ? "Resizing..."
                : "Resize image";

    }


    if (elements.downloadButton) {

        elements.downloadButton.disabled =

            processing ||
            !resizeState.resizedBlob;

    }


    if (elements.width) {

        elements.width.disabled =
            processing;

    }


    if (elements.height) {

        elements.height.disabled =
            processing;

    }


    if (elements.resizeMode) {

        elements.resizeMode.disabled =
            processing;

    }


    if (elements.resizePercentage) {

        elements.resizePercentage.disabled =
            processing;

    }


    if (elements.resizePreset) {

        elements.resizePreset.disabled =
            processing;

    }


    if (elements.outputFormat) {

        elements.outputFormat.disabled =
            processing;

    }


    if (elements.lockAspect) {

        elements.lockAspect.disabled =
            processing;

    }

}


/* ==========================================================
   Resize Status
   ========================================================== */

function setResizeStatus(

    text,

    status

) {

    if (!elements.status) {

        return;

    }


    elements.status.textContent =
        text;


    elements.status.dataset.status =
        status;

}

/* ==========================================================
   ImageTools - Image Resizer
   Part 3: Download, Reset, Transfer and Shared Page Functions
   ========================================================== */


/* ==========================================================
   Final Event Setup
   ========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeResizerActions
);


function initializeResizerActions() {

    if (elements.downloadButton) {

        elements.downloadButton.addEventListener(
            "click",
            downloadResizedImage
        );

    }


    if (elements.resetButton) {

        elements.resetButton.addEventListener(
            "click",
            resetResizer
        );

    }

}


/* ==========================================================
   Download Resized Image
   ========================================================== */

function downloadResizedImage() {

    if (
        !resizeState.resizedBlob ||
        !resizeState.resizedObjectURL ||
        !resizeState.originalFile
    ) {

        showError(
            "Resize the image before downloading."
        );

        return;

    }


    const outputType =
        resizeState.outputType ||
        resizeState.originalFile.type;


    const fileName =
        createResizedFileName(
            resizeState.originalFile.name,
            outputType,
            resizeState.resizedWidth,
            resizeState.resizedHeight
        );


    const downloadLink =
        document.createElement("a");


    downloadLink.href =
        resizeState.resizedObjectURL;


    downloadLink.download =
        fileName;


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();


    downloadLink.remove();

}


/* ==========================================================
   Create Download File Name
   ========================================================== */

function createResizedFileName(

    originalName,

    outputType,

    width,

    height

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
        getOriginalFileExtension(
            originalName
        ) ||
        "png";


    return (
        `${baseName}-${width}x${height}-resized.${extension}`
    );

}


/* ==========================================================
   Original File Extension
   ========================================================== */

function getOriginalFileExtension(
    fileName
) {

    const match =
        fileName.match(
            /\.([a-zA-Z0-9]+)$/
        );


    if (!match) {

        return "";

    }


    const extension =
        match[1].toLowerCase();


    if (
        extension === "jpeg"
    ) {

        return "jpg";

    }


    return extension;

}


/* ==========================================================
   Reset Resizer
   ========================================================== */

function resetResizer() {

    clearError();


    releaseObjectURLs();


    resizeState.originalFile =
        null;


    resizeState.originalImage =
        null;


    resizeState.originalWidth =
        0;


    resizeState.originalHeight =
        0;


    resizeState.aspectRatio =
        1;


    resizeState.resizedBlob =
        null;


    resizeState.resizedWidth =
        0;


    resizeState.resizedHeight =
        0;


    resizeState.outputType =
        null;


    resizeState.processing =
        false;


    if (elements.imageInput) {

        elements.imageInput.value =
            "";

    }


    if (elements.uploadZone) {

        elements.uploadZone.hidden =
            false;

    }


    if (elements.interface) {

        elements.interface.hidden =
            true;

    }


    if (elements.thumbnail) {

        elements.thumbnail.src =
            "";

    }


    if (elements.originalPreview) {

        elements.originalPreview.src =
            "";

    }


    if (elements.resizedPreview) {

        elements.resizedPreview.src =
            "";


        elements.resizedPreview.hidden =
            true;

    }


    if (elements.placeholder) {

        elements.placeholder.hidden =
            false;

    }


    if (elements.fileName) {

        elements.fileName.textContent =
            "";

    }


    if (elements.fileMeta) {

        elements.fileMeta.textContent =
            "";

    }


    if (elements.width) {

        elements.width.value =
            "";

    }


    if (elements.height) {

        elements.height.value =
            "";

    }


    if (elements.resizeMode) {

        elements.resizeMode.value =
            "pixels";

    }


    if (elements.resizePercentage) {

        elements.resizePercentage.value =
            "100";

    }


    if (elements.resizePreset) {

        elements.resizePreset.value =
            "";

    }


    if (elements.outputFormat) {

        elements.outputFormat.value =
            "original";

    }


    if (elements.lockAspect) {

        elements.lockAspect.checked =
            true;

    }


    if (elements.pixelControls) {

        elements.pixelControls.hidden =
            false;

    }


    if (elements.percentageControls) {

        elements.percentageControls.hidden =
            true;

    }


    if (elements.originalSize) {

        elements.originalSize.textContent =
            "—";

    }


    if (elements.resizedSize) {

        elements.resizedSize.textContent =
            "—";

    }


    if (elements.sizeDifference) {

        elements.sizeDifference.textContent =
            "—";

    }


    if (elements.dimensions) {

        elements.dimensions.textContent =
            "—";

    }


    const originalImageSize =
        document.getElementById(
            "originalImageSize"
        );


    if (originalImageSize) {

        originalImageSize.textContent =
            "—";

    }


    const resizedImageSize =
        document.getElementById(
            "resizedImageSize"
        );


    if (resizedImageSize) {

        resizedImageSize.textContent =
            "—";

    }


    if (elements.resizeButton) {

        elements.resizeButton.disabled =
            false;


        elements.resizeButton.textContent =
            "Resize image";

    }


    if (elements.downloadButton) {

        elements.downloadButton.disabled =
            true;

    }


    setResizeStatus(
        "Ready",
        "ready"
    );


    sessionStorage.removeItem(
        RESIZER_CONFIG.sessionStorageKey
    );


    elements.uploadZone?.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

}


/* ==========================================================
   Release Object URLs
   ========================================================== */

function releaseObjectURLs() {

    if (resizeState.objectURL) {

        URL.revokeObjectURL(
            resizeState.objectURL
        );

    }


    if (
        resizeState.resizedObjectURL
    ) {

        URL.revokeObjectURL(
            resizeState.resizedObjectURL
        );

    }


    resizeState.objectURL =
        null;


    resizeState.resizedObjectURL =
        null;

}


/* ==========================================================
   Load Image Transferred From Homepage
   ========================================================== */

async function loadTransferredImage() {

    const storedValue =
        sessionStorage.getItem(
            RESIZER_CONFIG.sessionStorageKey
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
                "The transferred image data is invalid."
            );

        }


        const response =
            await fetch(
                storedImage.dataUrl
            );


        if (!response.ok) {

            throw new Error(
                "The transferred image could not be loaded."
            );

        }


        const blob =
            await response.blob();


        const imageType =
            blob.type ||
            storedImage.type ||
            "image/png";


        const fileName =
            storedImage.name ||
            `selected-image.${getExtensionFromMimeType(imageType)}`;


        const file =
            new File(

                [blob],

                fileName,

                {

                    type: imageType

                }

            );


        await handleFile(file);

    } catch (error) {

        console.error(

            "Transferred image loading failed:",

            error

        );


        showError(
            "The selected image from the homepage could not be loaded."
        );

    } finally {

        sessionStorage.removeItem(
            RESIZER_CONFIG.sessionStorageKey
        );

    }

}


/* ==========================================================
   Extension From MIME Type
   ========================================================== */

function getExtensionFromMimeType(
    mimeType
) {

    const extensionMap = {

        "image/jpeg": "jpg",

        "image/png": "png",

        "image/webp": "webp"

    };


    return (
        extensionMap[mimeType] ||
        "png"
    );

}


/* ==========================================================
   Improved Image Loading Error Handling
   ========================================================== */

function loadImage(file) {

    return new Promise(

        (resolve, reject) => {

            if (
                resizeState.objectURL
            ) {

                URL.revokeObjectURL(
                    resizeState.objectURL
                );

            }


            resizeState.objectURL =
                URL.createObjectURL(file);


            const image =
                new Image();


            image.onload = () => {

                resolve(image);

            };


            image.onerror = () => {

                URL.revokeObjectURL(
                    resizeState.objectURL
                );


                resizeState.objectURL =
                    null;


                reject(
                    new Error(
                        "The selected image could not be opened."
                    )
                );

            };


            image.src =
                resizeState.objectURL;

        }

    );

}


/* ==========================================================
   Improved File Handler
   Replaces the Part 1 version because later function
   declarations override earlier declarations.
   ========================================================== */

async function handleFile(file) {

    clearError();


    if (!file) {

        showError(
            "Please select an image."
        );

        return;

    }


    if (
        !RESIZER_CONFIG.allowedTypes.includes(
            file.type
        )
    ) {

        showError(
            "Unsupported format. Please select a JPG, PNG or WebP image."
        );

        return;

    }


    if (file.size === 0) {

        showError(
            "The selected image is empty."
        );

        return;

    }


    if (
        file.size >
        RESIZER_CONFIG.maxFileSize
    ) {

        showError(
            "The image is larger than the 20 MB limit."
        );

        return;

    }


    try {

        setResizeStatus(
            "Loading",
            "processing"
        );


        clearResizedResult();


        const image =
            await loadImage(file);


        resizeState.originalFile =
            file;


        resizeState.originalImage =
            image;


        resizeState.originalWidth =
            image.naturalWidth ||
            image.width;


        resizeState.originalHeight =
            image.naturalHeight ||
            image.height;


        resizeState.aspectRatio =

            resizeState.originalWidth /
            resizeState.originalHeight;


        resizeState.resizedBlob =
            null;


        resizeState.resizedWidth =
            0;


        resizeState.resizedHeight =
            0;


        displayImage();


        setResizeStatus(
            "Ready",
            "ready"
        );

    } catch (error) {

        console.error(

            "Image loading failed:",

            error

        );


        showError(

            error.message ||
            "The image could not be loaded."

        );


        setResizeStatus(
            "Error",
            "error"
        );

    } finally {

        if (elements.imageInput) {

            elements.imageInput.value =
                "";

        }

    }

}


/* ==========================================================
   Improved Display Function
   Replaces the Part 1 version.
   ========================================================== */

function displayImage() {

    if (
        !resizeState.originalFile ||
        !resizeState.originalImage ||
        !resizeState.objectURL
    ) {

        return;

    }


    elements.uploadZone.hidden =
        true;


    elements.interface.hidden =
        false;


    elements.thumbnail.src =
        resizeState.objectURL;


    elements.originalPreview.src =
        resizeState.objectURL;


    elements.fileName.textContent =
        resizeState.originalFile.name;


    elements.fileMeta.textContent =

        `${formatSize(resizeState.originalFile.size)} • ${getReadableImageType(resizeState.originalFile.type)}`;


    elements.width.value =
        resizeState.originalWidth;


    elements.height.value =
        resizeState.originalHeight;


    elements.resizePercentage.value =
        "100";


    elements.resizePreset.value =
        "";


    elements.resizeMode.value =
        "pixels";


    elements.lockAspect.checked =
        true;


    if (elements.pixelControls) {

        elements.pixelControls.hidden =
            false;

    }


    if (elements.percentageControls) {

        elements.percentageControls.hidden =
            true;

    }


    elements.originalSize.textContent =
        formatSize(
            resizeState.originalFile.size
        );


    elements.resizedSize.textContent =
        "—";


    elements.sizeDifference.textContent =
        "—";


    elements.dimensions.textContent =

        `${resizeState.originalWidth} × ${resizeState.originalHeight}`;


    const originalImageSize =
        document.getElementById(
            "originalImageSize"
        );


    if (originalImageSize) {

        originalImageSize.textContent =
            formatSize(
                resizeState.originalFile.size
            );

    }


    const resizedImageSize =
        document.getElementById(
            "resizedImageSize"
        );


    if (resizedImageSize) {

        resizedImageSize.textContent =
            "—";

    }


    elements.placeholder.hidden =
        false;


    elements.resizedPreview.hidden =
        true;


    elements.resizedPreview.src =
        "";


    elements.downloadButton.disabled =
        true;


    elements.resizeButton.disabled =
        false;


    elements.interface.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


/* ==========================================================
   Readable Image Type
   ========================================================== */

function getReadableImageType(
    mimeType
) {

    const typeMap = {

        "image/jpeg": "JPG",

        "image/png": "PNG",

        "image/webp": "WebP"

    };


    return (
        typeMap[mimeType] ||
        "Image"
    );

}


/* ==========================================================
   Improved File Size Formatter
   Replaces the Part 1 version.
   ========================================================== */

function formatSize(bytes) {

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
        Math.pow(
            1024,
            unitIndex
        );


    const decimals =

        unitIndex === 0
            ? 0
            : 2;


    return (

        `${value.toFixed(decimals)} ${units[unitIndex]}`

    );

}


/* ==========================================================
   Theme
   ========================================================== */

function initializeTheme() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    const themeIcon =
        document.getElementById(
            "themeIcon"
        );


    if (
        !themeToggle ||
        !themeIcon
    ) {

        return;

    }


    const savedTheme =
        localStorage.getItem(
            "imageToolsTheme"
        );


    const systemPrefersDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    const initialTheme =

        savedTheme ||

        (
            systemPrefersDark
                ? "dark"
                : "light"
        );


    applyTheme(
        initialTheme,
        themeIcon
    );


    themeToggle.addEventListener(

        "click",

        () => {

            const currentTheme =

                document.documentElement
                    .getAttribute(
                        "data-theme"
                    ) ||
                "dark";


            const nextTheme =

                currentTheme === "dark"
                    ? "light"
                    : "dark";


            applyTheme(
                nextTheme,
                themeIcon
            );


            localStorage.setItem(

                "imageToolsTheme",

                nextTheme

            );

        }

    );

}


/* ==========================================================
   Apply Theme
   ========================================================== */

function applyTheme(
    theme,
    themeIcon
) {

    document.documentElement.setAttribute(

        "data-theme",

        theme

    );


    themeIcon.textContent =

        theme === "dark"
            ? "☀"
            : "☾";

}


/* ==========================================================
   Mobile Navigation
   ========================================================== */

function initializeNavigation() {

    const menuButton =
        document.getElementById(
            "mobileMenuButton"
        );


    const mobileNavigation =
        document.getElementById(
            "mobileNavigation"
        );


    if (
        !menuButton ||
        !mobileNavigation
    ) {

        return;

    }


    menuButton.addEventListener(

        "click",

        (event) => {

            event.stopPropagation();


            const isOpen =

                mobileNavigation.classList.toggle(
                    "is-open"
                );


            menuButton.classList.toggle(

                "is-open",

                isOpen

            );


            menuButton.setAttribute(

                "aria-expanded",

                String(isOpen)

            );

        }

    );


    mobileNavigation
        .querySelectorAll("a")
        .forEach(

            (link) => {

                link.addEventListener(

                    "click",

                    () => {

                        closeMobileNavigation(

                            menuButton,

                            mobileNavigation

                        );

                    }

                );

            }

        );


    document.addEventListener(

        "click",

        (event) => {

            const clickedNavigation =

                mobileNavigation.contains(
                    event.target
                );


            const clickedButton =

                menuButton.contains(
                    event.target
                );


            if (
                !clickedNavigation &&
                !clickedButton
            ) {

                closeMobileNavigation(

                    menuButton,

                    mobileNavigation

                );

            }

        }

    );


    document.addEventListener(

        "keydown",

        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeMobileNavigation(

                    menuButton,

                    mobileNavigation

                );

            }

        }

    );


    window.addEventListener(

        "resize",

        () => {

            if (
                window.innerWidth >
                900
            ) {

                closeMobileNavigation(

                    menuButton,

                    mobileNavigation

                );

            }

        }

    );

}


/* ==========================================================
   Close Mobile Navigation
   ========================================================== */

function closeMobileNavigation(

    menuButton,

    mobileNavigation

) {

    mobileNavigation.classList.remove(
        "is-open"
    );


    menuButton.classList.remove(
        "is-open"
    );


    menuButton.setAttribute(

        "aria-expanded",

        "false"

    );

}


/* ==========================================================
   Footer Year
   ========================================================== */

function initializeFooter() {

    const currentYear =
        document.getElementById(
            "currentYear"
        );


    if (currentYear) {

        currentYear.textContent =
            String(
                new Date().getFullYear()
            );

    }

}


/* ==========================================================
   Page Cleanup
   ========================================================== */

window.addEventListener(

    "beforeunload",

    releaseObjectURLs

);