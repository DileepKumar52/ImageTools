"use strict";

/* ==========================================================
   ImageTools - Metadata Viewer
   Part 1 of 3
   Initialization, Upload and Basic Image Information
   ========================================================== */


/* ==========================================================
   Configuration
   ========================================================== */

const METADATA_CONFIG = {
    maxFileSize: 20 * 1024 * 1024,

    allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp"
    ],

    sessionStorageKey: "imageToolsSelectedImage"
};


/* ==========================================================
   Application State
   ========================================================== */

const metadataState = {
    originalFile: null,

    imageElement: null,

    imageObjectURL: null,

    width: 0,

    height: 0,

    aspectRatio: "",

    basicMetadata: {},

    exifMetadata: {},

    cameraMetadata: {},

    gpsMetadata: {},

    reportData: null,

    isProcessing: false
};


/* ==========================================================
   Cached Elements
   ========================================================== */

const elements = {};


/* ==========================================================
   Page Initialization
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();

    initializeNavigation();

    initializeFooter();

    initializeMetadataViewer();
});


/* ==========================================================
   Metadata Viewer Initialization
   ========================================================== */

function initializeMetadataViewer() {
    cacheMetadataElements();

    if (
        !elements.uploadZone ||
        !elements.imageInput ||
        !elements.interface
    ) {
        console.error(
            "Required metadata viewer elements were not found."
        );

        return;
    }

    bindUploadEvents();

    bindMetadataActions();

    loadTransferredImage();
}


/* ==========================================================
   Cache Metadata Elements
   ========================================================== */

function cacheMetadataElements() {
    elements.uploadZone =
        document.getElementById(
            "metadataUploadZone"
        );

    elements.imageInput =
        document.getElementById(
            "metadataImageInput"
        );

    elements.browseButton =
        document.getElementById(
            "metadataBrowseButton"
        );

    elements.errorMessage =
        document.getElementById(
            "metadataErrorMessage"
        );

    elements.interface =
        document.getElementById(
            "metadataInterface"
        );

    elements.thumbnail =
        document.getElementById(
            "metadataThumbnail"
        );

    elements.fileName =
        document.getElementById(
            "metadataFileName"
        );

    elements.fileMeta =
        document.getElementById(
            "metadataFileMeta"
        );

    elements.changeImageButton =
        document.getElementById(
            "metadataChangeImageButton"
        );

    elements.originalImagePreview =
        document.getElementById(
            "originalImagePreview"
        );

    elements.metadataImagePreview =
        document.getElementById(
            "metadataImagePreview"
        );

    elements.metadataPlaceholder =
        document.getElementById(
            "metadataPlaceholder"
        );

    elements.originalImageSize =
        document.getElementById(
            "originalImageSize"
        );

    elements.metadataImageSize =
        document.getElementById(
            "metadataImageSize"
        );

    elements.metadataStatus =
        document.getElementById(
            "metadataStatus"
        );

    elements.basicMetadata =
        document.getElementById(
            "basicMetadata"
        );

    elements.exifMetadata =
        document.getElementById(
            "exifMetadata"
        );

    elements.cameraMetadata =
        document.getElementById(
            "cameraMetadata"
        );

    elements.gpsMetadata =
        document.getElementById(
            "gpsMetadata"
        );

    elements.originalStatSize =
        document.getElementById(
            "originalStatSize"
        );

    elements.imageStatSize =
        document.getElementById(
            "imageStatSize"
        );

    elements.fileTypeValue =
        document.getElementById(
            "fileTypeValue"
        );

    elements.resolutionValue =
        document.getElementById(
            "resolutionValue"
        );

    elements.analyzeButton =
        document.getElementById(
            "analyzeMetadataButton"
        );

    elements.downloadButton =
        document.getElementById(
            "downloadMetadataButton"
        );

    elements.resetButton =
        document.getElementById(
            "resetMetadataButton"
        );
}


/* ==========================================================
   Upload Events
   ========================================================== */

function bindUploadEvents() {
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
                await handleSelectedMetadataFile(
                    file
                );
            }

            elements.imageInput.value = "";
        }
    );

    [
        "dragenter",
        "dragover"
    ].forEach((eventName) => {
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

    [
        "dragleave",
        "drop"
    ].forEach((eventName) => {
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
                await handleSelectedMetadataFile(
                    file
                );
            }
        }
    );
}


/* ==========================================================
   Metadata Action Events
   ========================================================== */

function bindMetadataActions() {
    elements.changeImageButton?.addEventListener(
        "click",
        () => {
            elements.imageInput.click();
        }
    );

    elements.analyzeButton?.addEventListener(
        "click",
        async () => {
            await analyzeSelectedMetadata();
        }
    );

    elements.downloadButton?.addEventListener(
        "click",
        () => {
            downloadMetadataReport();
        }
    );

    elements.resetButton?.addEventListener(
        "click",
        () => {
            resetMetadataViewer();
        }
    );
}


/* ==========================================================
   Handle Selected File
   ========================================================== */

async function handleSelectedMetadataFile(file) {
    clearMetadataError();

    const validationError =
        validateMetadataFile(file);

    if (validationError) {
        showMetadataError(
            validationError
        );

        return;
    }

    try {
        setMetadataStatus(
            "Loading",
            "processing"
        );

        clearPreviousMetadataResult();

        const loadedImage =
            await loadMetadataImage(file);

        releaseOriginalImageURL();

        metadataState.originalFile =
            file;

        metadataState.imageElement =
            loadedImage.image;

        metadataState.imageObjectURL =
            loadedImage.objectURL;

        metadataState.width =
            loadedImage.image.naturalWidth;

        metadataState.height =
            loadedImage.image.naturalHeight;

        metadataState.aspectRatio =
            calculateAspectRatio(
                metadataState.width,
                metadataState.height
            );

        metadataState.basicMetadata =
            createBasicMetadata(file);

        displaySelectedMetadataImage();

        setMetadataStatus(
            "Ready",
            "ready"
        );
    } catch (error) {
        console.error(
            "Metadata image loading failed:",
            error
        );

        showMetadataError(
            "The selected image could not be opened. It may be damaged or unsupported."
        );

        setMetadataStatus(
            "Error",
            "error"
        );
    }
}


/* ==========================================================
   Validate File
   ========================================================== */

function validateMetadataFile(file) {
    if (!file) {
        return "Please select an image.";
    }

    if (
        !METADATA_CONFIG.allowedTypes.includes(
            file.type
        )
    ) {
        return "Unsupported format. Please select a JPG, PNG, or WebP image.";
    }

    if (file.size === 0) {
        return "The selected image is empty.";
    }

    if (
        file.size >
        METADATA_CONFIG.maxFileSize
    ) {
        return "The image is larger than the 20 MB limit.";
    }

    return "";
}


/* ==========================================================
   Load Image
   ========================================================== */

function loadMetadataImage(file) {
    return new Promise(
        (resolve, reject) => {
            const objectURL =
                URL.createObjectURL(file);

            const image =
                new Image();

            image.onload = () => {
                resolve({
                    image,
                    objectURL
                });
            };

            image.onerror = () => {
                URL.revokeObjectURL(
                    objectURL
                );

                reject(
                    new Error(
                        "Unable to decode image."
                    )
                );
            };

            image.src = objectURL;
        }
    );
}


/* ==========================================================
   Create Basic Metadata
   ========================================================== */

function createBasicMetadata(file) {
    return {
        fileName:
            file.name,

        fileType:
            getReadableImageType(
                file.type
            ),

        mimeType:
            file.type,

        fileSize:
            formatFileSize(
                file.size
            ),

        fileSizeBytes:
            file.size,

        width:
            metadataState.width,

        height:
            metadataState.height,

        resolution:
            `${metadataState.width} × ${metadataState.height}`,

        totalPixels:
            metadataState.width *
            metadataState.height,

        megapixels:
            calculateMegapixels(
                metadataState.width,
                metadataState.height
            ),

        aspectRatio:
            metadataState.aspectRatio,

        lastModified:
            formatLastModifiedDate(
                file.lastModified
            ),

        extension:
            getFileExtension(
                file.name
            )
    };
}


/* ==========================================================
   Display Selected Image
   ========================================================== */

function displaySelectedMetadataImage() {
    const file =
        metadataState.originalFile;

    const imageURL =
        metadataState.imageObjectURL;

    if (!file || !imageURL) {
        return;
    }

    elements.uploadZone.hidden =
        true;

    elements.interface.hidden =
        false;

    if (elements.thumbnail) {
        elements.thumbnail.src =
            imageURL;
    }

    if (
        elements.originalImagePreview
    ) {
        elements.originalImagePreview.src =
            imageURL;
    }

    if (
        elements.metadataImagePreview
    ) {
        elements.metadataImagePreview.src =
            imageURL;

        elements.metadataImagePreview.hidden =
            false;
    }

    if (
        elements.metadataPlaceholder
    ) {
        elements.metadataPlaceholder.hidden =
            true;
    }

    if (elements.fileName) {
        elements.fileName.textContent =
            file.name;
    }

    if (elements.fileMeta) {
        elements.fileMeta.textContent =
            `${formatFileSize(file.size)} • ${getReadableImageType(file.type)}`;
    }

    if (
        elements.originalImageSize
    ) {
        elements.originalImageSize.textContent =
            formatFileSize(file.size);
    }

    if (
        elements.metadataImageSize
    ) {
        elements.metadataImageSize.textContent =
            formatFileSize(file.size);
    }

    if (
        elements.originalStatSize
    ) {
        elements.originalStatSize.textContent =
            formatFileSize(file.size);
    }

    if (
        elements.imageStatSize
    ) {
        elements.imageStatSize.textContent =
            formatFileSize(file.size);
    }

    if (
        elements.fileTypeValue
    ) {
        elements.fileTypeValue.textContent =
            getReadableImageType(
                file.type
            );
    }

    if (
        elements.resolutionValue
    ) {
        elements.resolutionValue.textContent =
            `${metadataState.width} × ${metadataState.height}`;
    }

    if (elements.analyzeButton) {
        elements.analyzeButton.disabled =
            false;
    }

    if (elements.downloadButton) {
        elements.downloadButton.disabled =
            true;
    }

    renderBasicMetadata();

    elements.interface.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* ==========================================================
   Render Basic Metadata
   ========================================================== */

function renderBasicMetadata() {
    if (!elements.basicMetadata) {
        return;
    }

    const data =
        metadataState.basicMetadata;

    elements.basicMetadata.innerHTML = `
        <div class="metadata-row">
            <span>File name</span>
            <strong>${escapeHTML(data.fileName)}</strong>
        </div>

        <div class="metadata-row">
            <span>File type</span>
            <strong>${escapeHTML(data.fileType)}</strong>
        </div>

        <div class="metadata-row">
            <span>MIME type</span>
            <strong>${escapeHTML(data.mimeType)}</strong>
        </div>

        <div class="metadata-row">
            <span>File size</span>
            <strong>${escapeHTML(data.fileSize)}</strong>
        </div>

        <div class="metadata-row">
            <span>Resolution</span>
            <strong>${escapeHTML(data.resolution)}</strong>
        </div>

        <div class="metadata-row">
            <span>Megapixels</span>
            <strong>${escapeHTML(data.megapixels)}</strong>
        </div>

        <div class="metadata-row">
            <span>Aspect ratio</span>
            <strong>${escapeHTML(data.aspectRatio)}</strong>
        </div>

        <div class="metadata-row">
            <span>Last modified</span>
            <strong>${escapeHTML(data.lastModified)}</strong>
        </div>
    `;
}


/* ==========================================================
   Calculate Aspect Ratio
   ========================================================== */

function calculateAspectRatio(
    width,
    height
) {
    if (!width || !height) {
        return "—";
    }

    const divisor =
        greatestCommonDivisor(
            width,
            height
        );

    const ratioWidth =
        width / divisor;

    const ratioHeight =
        height / divisor;

    if (
        ratioWidth <= 100 &&
        ratioHeight <= 100
    ) {
        return `${ratioWidth}:${ratioHeight}`;
    }

    return (
        width / height
    ).toFixed(2);
}


/* ==========================================================
   Greatest Common Divisor
   ========================================================== */

function greatestCommonDivisor(
    firstNumber,
    secondNumber
) {
    let first =
        Math.abs(firstNumber);

    let second =
        Math.abs(secondNumber);

    while (second) {
        const remainder =
            first % second;

        first =
            second;

        second =
            remainder;
    }

    return first || 1;
}


/* ==========================================================
   Megapixels
   ========================================================== */

function calculateMegapixels(
    width,
    height
) {
    const megapixels =
        width * height /
        1_000_000;

    return `${megapixels.toFixed(2)} MP`;
}


/* ==========================================================
   File Extension
   ========================================================== */

function getFileExtension(fileName) {
    const match =
        fileName.match(
            /\.([a-zA-Z0-9]+)$/
        );

    if (!match) {
        return "";
    }

    return match[1].toLowerCase();
}


/* ==========================================================
   Last Modified Date
   ========================================================== */

function formatLastModifiedDate(
    timestamp
) {
    if (!timestamp) {
        return "Unknown";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }

    return date.toLocaleString();
}


/* ==========================================================
   Readable Image Type
   ========================================================== */

function getReadableImageType(type) {
    const typeMap = {
        "image/jpeg": "JPG",
        "image/png": "PNG",
        "image/webp": "WebP"
    };

    return typeMap[type] || "Image";
}


/* ==========================================================
   File Size Formatter
   ========================================================== */

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
        Math.pow(
            1024,
            unitIndex
        );

    const decimals =
        unitIndex === 0
            ? 0
            : 2;

    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}


/* ==========================================================
   Escape HTML
   ========================================================== */

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================================
   Error Handling
   ========================================================== */

function showMetadataError(message) {
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


function clearMetadataError() {
    if (!elements.errorMessage) {
        return;
    }

    elements.errorMessage.textContent =
        "";

    elements.errorMessage.hidden =
        true;
}


/* ==========================================================
   Metadata Status
   ========================================================== */

function setMetadataStatus(
    text,
    status
) {
    if (!elements.metadataStatus) {
        return;
    }

    elements.metadataStatus.textContent =
        text;

    elements.metadataStatus.dataset.status =
        status;
}


/* ==========================================================
   Clear Previous Metadata Result
   ========================================================== */

function clearPreviousMetadataResult() {
    metadataState.exifMetadata = {};

    metadataState.cameraMetadata = {};

    metadataState.gpsMetadata = {};

    metadataState.reportData = null;

    if (elements.exifMetadata) {
        elements.exifMetadata.textContent =
            "No EXIF data loaded.";
    }

    if (elements.cameraMetadata) {
        elements.cameraMetadata.textContent =
            "Camera information will appear here.";
    }

    if (elements.gpsMetadata) {
        elements.gpsMetadata.textContent =
            "No GPS information.";
    }

    if (elements.downloadButton) {
        elements.downloadButton.disabled =
            true;
    }
}


/* ==========================================================
   Release Current Image URL
   ========================================================== */

function releaseOriginalImageURL() {
    if (
        metadataState.imageObjectURL
    ) {
        URL.revokeObjectURL(
            metadataState.imageObjectURL
        );

        metadataState.imageObjectURL =
            null;
    }
}

/* ==========================================================
   ImageTools - Metadata Viewer
   Part 2A
   EXIF Parsing and Metadata Extraction
   ========================================================== */


/* ==========================================================
   EXIF Tag Names
   ========================================================== */

const EXIF_TAGS = {
    0x010E: "ImageDescription",
    0x010F: "Make",
    0x0110: "Model",
    0x0112: "Orientation",
    0x011A: "XResolution",
    0x011B: "YResolution",
    0x0128: "ResolutionUnit",
    0x0131: "Software",
    0x0132: "DateTime",
    0x013B: "Artist",
    0x8298: "Copyright",
    0x8769: "ExifIFDPointer",
    0x8825: "GPSInfoIFDPointer"
};


const EXIF_SUB_TAGS = {
    0x829A: "ExposureTime",
    0x829D: "FNumber",
    0x8822: "ExposureProgram",
    0x8827: "ISO",
    0x8830: "SensitivityType",
    0x9000: "ExifVersion",
    0x9003: "DateTimeOriginal",
    0x9004: "DateTimeDigitized",
    0x9101: "ComponentsConfiguration",
    0x9102: "CompressedBitsPerPixel",
    0x9201: "ShutterSpeedValue",
    0x9202: "ApertureValue",
    0x9203: "BrightnessValue",
    0x9204: "ExposureBiasValue",
    0x9205: "MaxApertureValue",
    0x9206: "SubjectDistance",
    0x9207: "MeteringMode",
    0x9208: "LightSource",
    0x9209: "Flash",
    0x920A: "FocalLength",
    0x9214: "SubjectArea",
    0x927C: "MakerNote",
    0x9286: "UserComment",
    0x9290: "SubSecTime",
    0x9291: "SubSecTimeOriginal",
    0x9292: "SubSecTimeDigitized",
    0xA000: "FlashpixVersion",
    0xA001: "ColorSpace",
    0xA002: "PixelXDimension",
    0xA003: "PixelYDimension",
    0xA004: "RelatedSoundFile",
    0xA005: "InteroperabilityIFDPointer",
    0xA20E: "FocalPlaneXResolution",
    0xA20F: "FocalPlaneYResolution",
    0xA210: "FocalPlaneResolutionUnit",
    0xA217: "SensingMethod",
    0xA300: "FileSource",
    0xA301: "SceneType",
    0xA302: "CFAPattern",
    0xA401: "CustomRendered",
    0xA402: "ExposureMode",
    0xA403: "WhiteBalance",
    0xA404: "DigitalZoomRatio",
    0xA405: "FocalLengthIn35mmFilm",
    0xA406: "SceneCaptureType",
    0xA407: "GainControl",
    0xA408: "Contrast",
    0xA409: "Saturation",
    0xA40A: "Sharpness",
    0xA40C: "SubjectDistanceRange",
    0xA420: "ImageUniqueID",
    0xA430: "CameraOwnerName",
    0xA431: "BodySerialNumber",
    0xA432: "LensSpecification",
    0xA433: "LensMake",
    0xA434: "LensModel",
    0xA435: "LensSerialNumber"
};


const GPS_TAGS = {
    0x0000: "GPSVersionID",
    0x0001: "GPSLatitudeRef",
    0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef",
    0x0004: "GPSLongitude",
    0x0005: "GPSAltitudeRef",
    0x0006: "GPSAltitude",
    0x0007: "GPSTimeStamp",
    0x0008: "GPSSatellites",
    0x0009: "GPSStatus",
    0x000A: "GPSMeasureMode",
    0x000B: "GPSDOP",
    0x000C: "GPSSpeedRef",
    0x000D: "GPSSpeed",
    0x000E: "GPSTrackRef",
    0x000F: "GPSTrack",
    0x0010: "GPSImgDirectionRef",
    0x0011: "GPSImgDirection",
    0x0012: "GPSMapDatum",
    0x0013: "GPSDestLatitudeRef",
    0x0014: "GPSDestLatitude",
    0x0015: "GPSDestLongitudeRef",
    0x0016: "GPSDestLongitude",
    0x0017: "GPSDestBearingRef",
    0x0018: "GPSDestBearing",
    0x0019: "GPSDestDistanceRef",
    0x001A: "GPSDestDistance",
    0x001B: "GPSProcessingMethod",
    0x001C: "GPSAreaInformation",
    0x001D: "GPSDateStamp",
    0x001E: "GPSDifferential",
    0x001F: "GPSHPositioningError"
};


/* ==========================================================
   EXIF Data Types
   ========================================================== */

const EXIF_TYPE_SIZES = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    7: 1,
    9: 4,
    10: 8
};


/* ==========================================================
   Read Metadata From File
   ========================================================== */

async function extractMetadataFromFile(file) {
    if (!file) {
        throw new Error(
            "No image file is available."
        );
    }

    const arrayBuffer =
        await file.arrayBuffer();

    const dataView =
        new DataView(arrayBuffer);

    const metadata = {
        exif: {},
        camera: {},
        gps: {},
        raw: {},
        hasExif: false
    };

    if (
        file.type === "image/jpeg"
    ) {
        const jpegMetadata =
            parseJPEGMetadata(dataView);

        Object.assign(
            metadata,
            jpegMetadata
        );
    }

    metadata.camera =
        createCameraMetadata(
            metadata.exif
        );

    metadata.gps =
        createGPSMetadata(
            metadata.raw
        );

    return metadata;
}


/* ==========================================================
   Parse JPEG Metadata
   ========================================================== */

function parseJPEGMetadata(dataView) {
    const result = {
        exif: {},
        camera: {},
        gps: {},
        raw: {},
        hasExif: false
    };

    if (
        dataView.byteLength < 4 ||
        dataView.getUint16(0, false) !== 0xFFD8
    ) {
        return result;
    }

    let offset = 2;

    while (
        offset + 4 <=
        dataView.byteLength
    ) {
        if (
            dataView.getUint8(offset) !==
            0xFF
        ) {
            offset += 1;
            continue;
        }

        const marker =
            dataView.getUint8(
                offset + 1
            );

        if (
            marker === 0xD9 ||
            marker === 0xDA
        ) {
            break;
        }

        if (
            marker === 0x00 ||
            marker === 0x01 ||
            (
                marker >= 0xD0 &&
                marker <= 0xD7
            )
        ) {
            offset += 2;
            continue;
        }

        if (
            offset + 4 >
            dataView.byteLength
        ) {
            break;
        }

        const segmentLength =
            dataView.getUint16(
                offset + 2,
                false
            );

        if (
            segmentLength < 2 ||
            offset + 2 + segmentLength >
                dataView.byteLength
        ) {
            break;
        }

        if (
            marker === 0xE1
        ) {
            const exifStart =
                offset + 4;

            if (
                isExifSegment(
                    dataView,
                    exifStart
                )
            ) {
                const parsedExif =
                    parseExifSegment(
                        dataView,
                        exifStart
                    );

                result.exif =
                    parsedExif.exif;

                result.raw =
                    parsedExif.raw;

                result.hasExif =
                    Object.keys(
                        parsedExif.raw
                    ).length > 0;

                break;
            }
        }

        offset +=
            2 + segmentLength;
    }

    return result;
}


/* ==========================================================
   Confirm EXIF Marker
   ========================================================== */

function isExifSegment(
    dataView,
    offset
) {
    if (
        offset + 6 >
        dataView.byteLength
    ) {
        return false;
    }

    return (
        dataView.getUint8(offset) === 0x45 &&
        dataView.getUint8(offset + 1) === 0x78 &&
        dataView.getUint8(offset + 2) === 0x69 &&
        dataView.getUint8(offset + 3) === 0x66 &&
        dataView.getUint8(offset + 4) === 0x00 &&
        dataView.getUint8(offset + 5) === 0x00
    );
}


/* ==========================================================
   Parse EXIF Segment
   ========================================================== */

function parseExifSegment(
    dataView,
    exifStart
) {
    const tiffStart =
        exifStart + 6;

    const emptyResult = {
        exif: {},
        raw: {}
    };

    if (
        tiffStart + 8 >
        dataView.byteLength
    ) {
        return emptyResult;
    }

    const byteOrder =
        dataView.getUint16(
            tiffStart,
            false
        );

    let littleEndian;

    if (
        byteOrder === 0x4949
    ) {
        littleEndian = true;
    } else if (
        byteOrder === 0x4D4D
    ) {
        littleEndian = false;
    } else {
        return emptyResult;
    }

    const tiffMarker =
        dataView.getUint16(
            tiffStart + 2,
            littleEndian
        );

    if (
        tiffMarker !== 0x002A
    ) {
        return emptyResult;
    }

    const firstIFDOffset =
        dataView.getUint32(
            tiffStart + 4,
            littleEndian
        );

    const firstIFDPosition =
        tiffStart +
        firstIFDOffset;

    if (
        firstIFDPosition < tiffStart ||
        firstIFDPosition >=
            dataView.byteLength
    ) {
        return emptyResult;
    }

    const rawMetadata = {};

    const firstIFD =
        readIFDDirectory(
            dataView,
            firstIFDPosition,
            tiffStart,
            littleEndian,
            EXIF_TAGS
        );

    Object.assign(
        rawMetadata,
        firstIFD.values
    );

    const exifPointer =
        firstIFD.values
            .ExifIFDPointer;

    if (
        Number.isFinite(
            exifPointer
        )
    ) {
        const exifIFDPosition =
            tiffStart +
            exifPointer;

        if (
            exifIFDPosition >= tiffStart &&
            exifIFDPosition <
                dataView.byteLength
        ) {
            const exifIFD =
                readIFDDirectory(
                    dataView,
                    exifIFDPosition,
                    tiffStart,
                    littleEndian,
                    EXIF_SUB_TAGS
                );

            Object.assign(
                rawMetadata,
                exifIFD.values
            );
        }
    }

    const gpsPointer =
        firstIFD.values
            .GPSInfoIFDPointer;

    if (
        Number.isFinite(
            gpsPointer
        )
    ) {
        const gpsIFDPosition =
            tiffStart +
            gpsPointer;

        if (
            gpsIFDPosition >= tiffStart &&
            gpsIFDPosition <
                dataView.byteLength
        ) {
            const gpsIFD =
                readIFDDirectory(
                    dataView,
                    gpsIFDPosition,
                    tiffStart,
                    littleEndian,
                    GPS_TAGS
                );

            Object.assign(
                rawMetadata,
                gpsIFD.values
            );
        }
    }

    return {
        raw:
            rawMetadata,

        exif:
            createReadableExifMetadata(
                rawMetadata
            )
    };
}


/* ==========================================================
   Read IFD Directory
   ========================================================== */

function readIFDDirectory(
    dataView,
    directoryOffset,
    tiffStart,
    littleEndian,
    tagMap
) {
    const values = {};

    if (
        directoryOffset + 2 >
        dataView.byteLength
    ) {
        return {
            values,
            nextIFDOffset: 0
        };
    }

    const entryCount =
        dataView.getUint16(
            directoryOffset,
            littleEndian
        );

    const maximumEntries =
        Math.min(
            entryCount,
            1000
        );

    for (
        let index = 0;
        index < maximumEntries;
        index += 1
    ) {
        const entryOffset =
            directoryOffset +
            2 +
            index * 12;

        if (
            entryOffset + 12 >
            dataView.byteLength
        ) {
            break;
        }

        const tag =
            dataView.getUint16(
                entryOffset,
                littleEndian
            );

        const type =
            dataView.getUint16(
                entryOffset + 2,
                littleEndian
            );

        const count =
            dataView.getUint32(
                entryOffset + 4,
                littleEndian
            );

        const tagName =
            tagMap[tag];

        if (!tagName) {
            continue;
        }

        try {
            const value =
                readExifValue(
                    dataView,
                    entryOffset,
                    tiffStart,
                    littleEndian,
                    type,
                    count
                );

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                values[tagName] =
                    value;
            }
        } catch (error) {
            console.warn(
                `Unable to read EXIF tag ${tagName}:`,
                error
            );
        }
    }

    const nextOffsetLocation =
        directoryOffset +
        2 +
        entryCount * 12;

    let nextIFDOffset = 0;

    if (
        nextOffsetLocation + 4 <=
        dataView.byteLength
    ) {
        nextIFDOffset =
            dataView.getUint32(
                nextOffsetLocation,
                littleEndian
            );
    }

    return {
        values,
        nextIFDOffset
    };
}


/* ==========================================================
   Read EXIF Value
   ========================================================== */

function readExifValue(
    dataView,
    entryOffset,
    tiffStart,
    littleEndian,
    type,
    count
) {
    const typeSize =
        EXIF_TYPE_SIZES[type];

    if (
        !typeSize ||
        !Number.isFinite(count) ||
        count < 1
    ) {
        return undefined;
    }

    const totalSize =
        typeSize * count;

    let valueOffset;

    if (
        totalSize <= 4
    ) {
        valueOffset =
            entryOffset + 8;
    } else {
        const relativeOffset =
            dataView.getUint32(
                entryOffset + 8,
                littleEndian
            );

        valueOffset =
            tiffStart +
            relativeOffset;
    }

    if (
        valueOffset < 0 ||
        valueOffset + totalSize >
            dataView.byteLength
    ) {
        return undefined;
    }

    switch (type) {
        case 1:
            return readUnsignedByteValues(
                dataView,
                valueOffset,
                count
            );

        case 2:
            return readAsciiValue(
                dataView,
                valueOffset,
                count
            );

        case 3:
            return readUnsignedShortValues(
                dataView,
                valueOffset,
                count,
                littleEndian
            );

        case 4:
            return readUnsignedLongValues(
                dataView,
                valueOffset,
                count,
                littleEndian
            );

        case 5:
            return readUnsignedRationalValues(
                dataView,
                valueOffset,
                count,
                littleEndian
            );

        case 7:
            return readUndefinedValues(
                dataView,
                valueOffset,
                count
            );

        case 9:
            return readSignedLongValues(
                dataView,
                valueOffset,
                count,
                littleEndian
            );

        case 10:
            return readSignedRationalValues(
                dataView,
                valueOffset,
                count,
                littleEndian
            );

        default:
            return undefined;
    }
}


/* ==========================================================
   Read BYTE Values
   ========================================================== */

function readUnsignedByteValues(
    dataView,
    offset,
    count
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        values.push(
            dataView.getUint8(
                offset + index
            )
        );
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read ASCII Value
   ========================================================== */

function readAsciiValue(
    dataView,
    offset,
    count
) {
    let value = "";

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        const characterCode =
            dataView.getUint8(
                offset + index
            );

        if (
            characterCode === 0
        ) {
            break;
        }

        value +=
            String.fromCharCode(
                characterCode
            );
    }

    return value.trim();
}


/* ==========================================================
   Read SHORT Values
   ========================================================== */

function readUnsignedShortValues(
    dataView,
    offset,
    count,
    littleEndian
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        values.push(
            dataView.getUint16(
                offset +
                index * 2,
                littleEndian
            )
        );
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read LONG Values
   ========================================================== */

function readUnsignedLongValues(
    dataView,
    offset,
    count,
    littleEndian
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        values.push(
            dataView.getUint32(
                offset +
                index * 4,
                littleEndian
            )
        );
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read Signed LONG Values
   ========================================================== */

function readSignedLongValues(
    dataView,
    offset,
    count,
    littleEndian
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        values.push(
            dataView.getInt32(
                offset +
                index * 4,
                littleEndian
            )
        );
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read Unsigned Rational Values
   ========================================================== */

function readUnsignedRationalValues(
    dataView,
    offset,
    count,
    littleEndian
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        const valueOffset =
            offset +
            index * 8;

        const numerator =
            dataView.getUint32(
                valueOffset,
                littleEndian
            );

        const denominator =
            dataView.getUint32(
                valueOffset + 4,
                littleEndian
            );

        values.push({
            numerator,
            denominator,
            value:
                denominator === 0
                    ? 0
                    : numerator /
                      denominator
        });
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read Signed Rational Values
   ========================================================== */

function readSignedRationalValues(
    dataView,
    offset,
    count,
    littleEndian
) {
    const values = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        const valueOffset =
            offset +
            index * 8;

        const numerator =
            dataView.getInt32(
                valueOffset,
                littleEndian
            );

        const denominator =
            dataView.getInt32(
                valueOffset + 4,
                littleEndian
            );

        values.push({
            numerator,
            denominator,
            value:
                denominator === 0
                    ? 0
                    : numerator /
                      denominator
        });
    }

    return (
        count === 1
            ? values[0]
            : values
    );
}


/* ==========================================================
   Read Undefined Values
   ========================================================== */

function readUndefinedValues(
    dataView,
    offset,
    count
) {
    const bytes = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        bytes.push(
            dataView.getUint8(
                offset + index
            )
        );
    }

    const readableText =
        bytes
            .filter(
                (byte) =>
                    byte >= 32 &&
                    byte <= 126
            )
            .map(
                (byte) =>
                    String.fromCharCode(
                        byte
                    )
            )
            .join("")
            .trim();

    if (
        readableText.length >= 3
    ) {
        return readableText;
    }

    return bytes;
}


/* ==========================================================
   Create Readable EXIF Metadata
   ========================================================== */

function createReadableExifMetadata(
    rawMetadata
) {
    const readable = {};

    addReadableExifValue(
        readable,
        "Camera manufacturer",
        rawMetadata.Make
    );

    addReadableExifValue(
        readable,
        "Camera model",
        rawMetadata.Model
    );

    addReadableExifValue(
        readable,
        "Lens model",
        rawMetadata.LensModel
    );

    addReadableExifValue(
        readable,
        "Lens manufacturer",
        rawMetadata.LensMake
    );

    addReadableExifValue(
        readable,
        "Date taken",
        formatExifDate(
            rawMetadata.DateTimeOriginal
        )
    );

    addReadableExifValue(
        readable,
        "Date digitized",
        formatExifDate(
            rawMetadata.DateTimeDigitized
        )
    );

    addReadableExifValue(
        readable,
        "Modified date",
        formatExifDate(
            rawMetadata.DateTime
        )
    );

    addReadableExifValue(
        readable,
        "Orientation",
        getOrientationLabel(
            rawMetadata.Orientation
        )
    );

    addReadableExifValue(
        readable,
        "Software",
        rawMetadata.Software
    );

    addReadableExifValue(
        readable,
        "Exposure time",
        formatExposureTime(
            rawMetadata.ExposureTime
        )
    );

    addReadableExifValue(
        readable,
        "Aperture",
        formatAperture(
            rawMetadata.FNumber
        )
    );

    addReadableExifValue(
        readable,
        "ISO",
        formatSimpleExifValue(
            rawMetadata.ISO
        )
    );

    addReadableExifValue(
        readable,
        "Focal length",
        formatFocalLength(
            rawMetadata.FocalLength
        )
    );

    addReadableExifValue(
        readable,
        "35 mm focal length",
        formatMillimetres(
            rawMetadata.FocalLengthIn35mmFilm
        )
    );

    addReadableExifValue(
        readable,
        "Exposure bias",
        formatExposureBias(
            rawMetadata.ExposureBiasValue
        )
    );

    addReadableExifValue(
        readable,
        "Exposure program",
        getExposureProgramLabel(
            rawMetadata.ExposureProgram
        )
    );

    addReadableExifValue(
        readable,
        "Exposure mode",
        getExposureModeLabel(
            rawMetadata.ExposureMode
        )
    );

    addReadableExifValue(
        readable,
        "Metering mode",
        getMeteringModeLabel(
            rawMetadata.MeteringMode
        )
    );

    addReadableExifValue(
        readable,
        "White balance",
        getWhiteBalanceLabel(
            rawMetadata.WhiteBalance
        )
    );

    addReadableExifValue(
        readable,
        "Flash",
        getFlashLabel(
            rawMetadata.Flash
        )
    );

    addReadableExifValue(
        readable,
        "Color space",
        getColorSpaceLabel(
            rawMetadata.ColorSpace
        )
    );

    addReadableExifValue(
        readable,
        "Scene type",
        getSceneCaptureTypeLabel(
            rawMetadata.SceneCaptureType
        )
    );

    addReadableExifValue(
        readable,
        "Digital zoom",
        formatDigitalZoom(
            rawMetadata.DigitalZoomRatio
        )
    );

    addReadableExifValue(
        readable,
        "Image description",
        rawMetadata.ImageDescription
    );

    addReadableExifValue(
        readable,
        "Artist",
        rawMetadata.Artist
    );

    addReadableExifValue(
        readable,
        "Copyright",
        rawMetadata.Copyright
    );

    return readable;
}


/* ==========================================================
   Add Readable EXIF Value
   ========================================================== */

function addReadableExifValue(
    target,
    label,
    value
) {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "Unknown"
    ) {
        return;
    }

    target[label] = value;
}


/* ==========================================================
   Create Camera Metadata
   ========================================================== */

function createCameraMetadata(
    exifMetadata
) {
    return {
        manufacturer:
            exifMetadata[
                "Camera manufacturer"
            ] || "Unknown",

        model:
            exifMetadata[
                "Camera model"
            ] || "Unknown",

        lens:
            exifMetadata[
                "Lens model"
            ] || "Unknown",

        aperture:
            exifMetadata[
                "Aperture"
            ] || "Unknown",

        exposureTime:
            exifMetadata[
                "Exposure time"
            ] || "Unknown",

        iso:
            exifMetadata[
                "ISO"
            ] || "Unknown",

        focalLength:
            exifMetadata[
                "Focal length"
            ] || "Unknown",

        flash:
            exifMetadata[
                "Flash"
            ] || "Unknown",

        software:
            exifMetadata[
                "Software"
            ] || "Unknown"
    };
}


/* ==========================================================
   Create GPS Metadata
   ========================================================== */

function createGPSMetadata(
    rawMetadata
) {
    const latitude =
        convertGPSCoordinate(
            rawMetadata.GPSLatitude,
            rawMetadata.GPSLatitudeRef
        );

    const longitude =
        convertGPSCoordinate(
            rawMetadata.GPSLongitude,
            rawMetadata.GPSLongitudeRef
        );

    const altitude =
        formatGPSAltitude(
            rawMetadata.GPSAltitude,
            rawMetadata.GPSAltitudeRef
        );

    const date =
        formatGPSDateTime(
            rawMetadata.GPSDateStamp,
            rawMetadata.GPSTimeStamp
        );

    const hasCoordinates =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);

    return {
        hasCoordinates,

        latitude:
            hasCoordinates
                ? latitude
                : null,

        longitude:
            hasCoordinates
                ? longitude
                : null,

        latitudeFormatted:
            hasCoordinates
                ? latitude.toFixed(6)
                : "Not available",

        longitudeFormatted:
            hasCoordinates
                ? longitude.toFixed(6)
                : "Not available",

        altitude:
            altitude || "Not available",

        date:
            date || "Not available",

        mapURL:
            hasCoordinates
                ? createMapURL(
                    latitude,
                    longitude
                )
                : ""
    };
}


/* ==========================================================
   Convert GPS Coordinates
   ========================================================== */

function convertGPSCoordinate(
    coordinate,
    reference
) {
    if (
        !Array.isArray(coordinate) ||
        coordinate.length < 3
    ) {
        return null;
    }

    const degrees =
        getRationalNumber(
            coordinate[0]
        );

    const minutes =
        getRationalNumber(
            coordinate[1]
        );

    const seconds =
        getRationalNumber(
            coordinate[2]
        );

    if (
        !Number.isFinite(degrees) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds)
    ) {
        return null;
    }

    let decimal =
        degrees +
        minutes / 60 +
        seconds / 3600;

    const normalizedReference =
        String(
            reference || ""
        ).toUpperCase();

    if (
        normalizedReference === "S" ||
        normalizedReference === "W"
    ) {
        decimal *= -1;
    }

    return decimal;
}


/* ==========================================================
   Format GPS Altitude
   ========================================================== */

function formatGPSAltitude(
    altitude,
    altitudeReference
) {
    const altitudeValue =
        getRationalNumber(
            altitude
        );

    if (
        !Number.isFinite(
            altitudeValue
        )
    ) {
        return "";
    }

    const isBelowSeaLevel =
        altitudeReference === 1 ||
        (
            Array.isArray(
                altitudeReference
            ) &&
            altitudeReference[0] === 1
        );

    const signedAltitude =
        isBelowSeaLevel
            ? -altitudeValue
            : altitudeValue;

    return `${signedAltitude.toFixed(2)} m`;
}


/* ==========================================================
   Format GPS Date and Time
   ========================================================== */

function formatGPSDateTime(
    dateStamp,
    timeStamp
) {
    const dateText =
        typeof dateStamp ===
            "string"
            ? dateStamp.trim()
            : "";

    if (
        !dateText &&
        !Array.isArray(timeStamp)
    ) {
        return "";
    }

    let formattedTime = "";

    if (
        Array.isArray(timeStamp) &&
        timeStamp.length >= 3
    ) {
        const hours =
            Math.floor(
                getRationalNumber(
                    timeStamp[0]
                ) || 0
            );

        const minutes =
            Math.floor(
                getRationalNumber(
                    timeStamp[1]
                ) || 0
            );

        const seconds =
            Math.floor(
                getRationalNumber(
                    timeStamp[2]
                ) || 0
            );

        formattedTime =
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")} UTC`;
    }

    return [
        dateText,
        formattedTime
    ]
        .filter(Boolean)
        .join(" ");
}


/* ==========================================================
   Create Map URL
   ========================================================== */

function createMapURL(
    latitude,
    longitude
) {
    return (
        "https://www.google.com/maps/search/" +
        `?api=1&query=${encodeURIComponent(
            `${latitude},${longitude}`
        )}`
    );
}


/* ==========================================================
   Format EXIF Date
   ========================================================== */

function formatExifDate(value) {
    if (
        typeof value !==
            "string" ||
        !value.trim()
    ) {
        return "";
    }

    const match =
        value
            .trim()
            .match(
                /^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/
            );

    if (!match) {
        return value.trim();
    }

    const [
        ,
        year,
        month,
        day,
        hours,
        minutes,
        seconds
    ] = match;

    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            Number(seconds)
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value.trim();
    }

    return date.toLocaleString();
}


/* ==========================================================
   Rational Number Helper
   ========================================================== */

function getRationalNumber(value) {
    if (
        typeof value === "number"
    ) {
        return value;
    }

    if (
        value &&
        typeof value === "object" &&
        Number.isFinite(value.value)
    ) {
        return value.value;
    }

    return null;
}


/* ==========================================================
   Simple EXIF Value Formatter
   ========================================================== */

function formatSimpleExifValue(value) {
    if (
        Array.isArray(value)
    ) {
        return value.join(", ");
    }

    if (
        value &&
        typeof value === "object" &&
        Number.isFinite(value.value)
    ) {
        return String(
            value.value
        );
    }

    return (
        value === undefined ||
        value === null
            ? ""
            : String(value)
    );
}


/* ==========================================================
   Exposure Time
   ========================================================== */

function formatExposureTime(value) {
    const seconds =
        getRationalNumber(value);

    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {
        return "";
    }

    if (
        seconds >= 1
    ) {
        return `${formatDecimal(seconds)} sec`;
    }

    const denominator =
        Math.round(
            1 / seconds
        );

    return `1/${denominator} sec`;
}


/* ==========================================================
   Aperture
   ========================================================== */

function formatAperture(value) {
    const aperture =
        getRationalNumber(value);

    if (
        !Number.isFinite(aperture) ||
        aperture <= 0
    ) {
        return "";
    }

    return `f/${formatDecimal(aperture)}`;
}


/* ==========================================================
   Focal Length
   ========================================================== */

function formatFocalLength(value) {
    const focalLength =
        getRationalNumber(value);

    if (
        !Number.isFinite(
            focalLength
        )
    ) {
        return "";
    }

    return `${formatDecimal(focalLength)} mm`;
}


/* ==========================================================
   Millimetres
   ========================================================== */

function formatMillimetres(value) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "";
    }

    return `${formatDecimal(number)} mm`;
}


/* ==========================================================
   Exposure Bias
   ========================================================== */

function formatExposureBias(value) {
    const bias =
        getRationalNumber(value);

    if (
        !Number.isFinite(bias)
    ) {
        return "";
    }

    const sign =
        bias > 0
            ? "+"
            : "";

    return `${sign}${formatDecimal(bias)} EV`;
}


/* ==========================================================
   Digital Zoom
   ========================================================== */

function formatDigitalZoom(value) {
    const zoom =
        getRationalNumber(value);

    if (
        !Number.isFinite(zoom)
    ) {
        return "";
    }

    if (zoom === 0) {
        return "Not used";
    }

    return `${formatDecimal(zoom)}×`;
}


/* ==========================================================
   Decimal Formatter
   ========================================================== */

function formatDecimal(value) {
    if (
        !Number.isFinite(value)
    ) {
        return "";
    }

    if (
        Number.isInteger(value)
    ) {
        return String(value);
    }

    return value
        .toFixed(2)
        .replace(/\.?0+$/, "");
}


/* ==========================================================
   Orientation Label
   ========================================================== */

function getOrientationLabel(value) {
    const labels = {
        1: "Normal",
        2: "Mirrored horizontally",
        3: "Rotated 180°",
        4: "Mirrored vertically",
        5: "Mirrored horizontally and rotated 270°",
        6: "Rotated 90° clockwise",
        7: "Mirrored horizontally and rotated 90°",
        8: "Rotated 270° clockwise"
    };

    return labels[value] || "";
}


/* ==========================================================
   Exposure Program Label
   ========================================================== */

function getExposureProgramLabel(value) {
    const labels = {
        0: "Not defined",
        1: "Manual",
        2: "Normal program",
        3: "Aperture priority",
        4: "Shutter priority",
        5: "Creative program",
        6: "Action program",
        7: "Portrait mode",
        8: "Landscape mode"
    };

    return labels[value] || "";
}


/* ==========================================================
   Exposure Mode Label
   ========================================================== */

function getExposureModeLabel(value) {
    const labels = {
        0: "Automatic",
        1: "Manual",
        2: "Auto bracket"
    };

    return labels[value] || "";
}


/* ==========================================================
   Metering Mode Label
   ========================================================== */

function getMeteringModeLabel(value) {
    const labels = {
        0: "Unknown",
        1: "Average",
        2: "Center-weighted average",
        3: "Spot",
        4: "Multi-spot",
        5: "Pattern",
        6: "Partial",
        255: "Other"
    };

    return labels[value] || "";
}


/* ==========================================================
   White Balance Label
   ========================================================== */

function getWhiteBalanceLabel(value) {
    const labels = {
        0: "Automatic",
        1: "Manual"
    };

    return labels[value] || "";
}


/* ==========================================================
   Flash Label
   ========================================================== */

function getFlashLabel(value) {
    if (
        !Number.isFinite(value)
    ) {
        return "";
    }

    const fired =
        (value & 1) === 1;

    return fired
        ? "Flash fired"
        : "Flash did not fire";
}


/* ==========================================================
   Color Space Label
   ========================================================== */

function getColorSpaceLabel(value) {
    const labels = {
        1: "sRGB",
        65535: "Uncalibrated"
    };

    return labels[value] || "";
}


/* ==========================================================
   Scene Capture Type
   ========================================================== */

function getSceneCaptureTypeLabel(value) {
    const labels = {
        0: "Standard",
        1: "Landscape",
        2: "Portrait",
        3: "Night scene"
    };

    return labels[value] || "";
}

/* ==========================================================
   ImageTools - Metadata Viewer
   Part 2B-1
   Metadata Analysis and Result Rendering
   ========================================================== */


/* ==========================================================
   Analyze Selected Image
   ========================================================== */

async function analyzeSelectedMetadata() {
    if (
        metadataState.isProcessing
    ) {
        return;
    }

    if (
        !metadataState.originalFile
    ) {
        showMetadataError(
            "Please select an image before analyzing its metadata."
        );

        return;
    }

    clearMetadataError();

    metadataState.isProcessing =
        true;

    setMetadataAnalysisControls(
        true
    );

    setMetadataStatus(
        "Analyzing",
        "processing"
    );

    try {
        const extractedMetadata =
            await extractMetadataFromFile(
                metadataState.originalFile
            );

        metadataState.exifMetadata =
            extractedMetadata.exif || {};

        metadataState.cameraMetadata =
            extractedMetadata.camera || {};

        metadataState.gpsMetadata =
            extractedMetadata.gps || {};

        metadataState.reportData =
            createMetadataReportData(
                extractedMetadata
            );

        renderMetadataResults(
            extractedMetadata
        );

        if (
            elements.downloadButton
        ) {
            elements.downloadButton.disabled =
                false;
        }

        setMetadataStatus(
            extractedMetadata.hasExif
                ? "Analyzed"
                : "Basic data only",
            extractedMetadata.hasExif
                ? "success"
                : "ready"
        );
    } catch (error) {
        console.error(
            "Metadata analysis failed:",
            error
        );

        showMetadataError(
            "The image could not be analyzed. The file may contain damaged or unsupported metadata."
        );

        setMetadataStatus(
            "Error",
            "error"
        );
    } finally {
        metadataState.isProcessing =
            false;

        setMetadataAnalysisControls(
            false
        );
    }
}


/* ==========================================================
   Analysis Control State
   ========================================================== */

function setMetadataAnalysisControls(
    isProcessing
) {
    if (
        elements.analyzeButton
    ) {
        elements.analyzeButton.disabled =
            isProcessing;

        elements.analyzeButton.textContent =
            isProcessing
                ? "Analyzing..."
                : "Analyze Metadata";
    }

    if (
        elements.changeImageButton
    ) {
        elements.changeImageButton.disabled =
            isProcessing;
    }

    if (
        elements.resetButton
    ) {
        elements.resetButton.disabled =
            isProcessing;
    }

    if (
        elements.downloadButton &&
        isProcessing
    ) {
        elements.downloadButton.disabled =
            true;
    }
}


/* ==========================================================
   Render All Metadata Results
   ========================================================== */

function renderMetadataResults(
    extractedMetadata
) {
    renderBasicMetadata();

    renderExifMetadata(
        extractedMetadata.exif,
        extractedMetadata.hasExif
    );

    renderCameraMetadata(
        extractedMetadata.camera,
        extractedMetadata.hasExif
    );

    renderGPSMetadata(
        extractedMetadata.gps,
        extractedMetadata.hasExif
    );

    updateMetadataPreviewState(
        extractedMetadata.hasExif
    );
}


/* ==========================================================
   Render EXIF Metadata
   ========================================================== */

function renderExifMetadata(
    exifMetadata,
    hasExif
) {
    if (
        !elements.exifMetadata
    ) {
        return;
    }

    const entries =
        Object.entries(
            exifMetadata || {}
        ).filter(
            ([, value]) =>
                hasDisplayableMetadataValue(
                    value
                )
        );

    if (
        !hasExif ||
        entries.length === 0
    ) {
        elements.exifMetadata.innerHTML = `
            <div class="metadata-empty-state">
                <span
                    class="metadata-empty-icon"
                    aria-hidden="true"
                >
                    ◌
                </span>

                <div>
                    <strong>No EXIF metadata found</strong>

                    <p>
                        This image does not contain readable EXIF information.
                        Screenshots, edited images and social-media downloads
                        often have their metadata removed.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    elements.exifMetadata.innerHTML =
        entries
            .map(
                ([label, value]) =>
                    createMetadataRowHTML(
                        label,
                        formatMetadataDisplayValue(
                            value
                        )
                    )
            )
            .join("");
}


/* ==========================================================
   Render Camera Metadata
   ========================================================== */

function renderCameraMetadata(
    cameraMetadata,
    hasExif
) {
    if (
        !elements.cameraMetadata
    ) {
        return;
    }

    const cameraRows = [
        {
            label:
                "Manufacturer",

            value:
                cameraMetadata
                    ?.manufacturer
        },

        {
            label:
                "Camera model",

            value:
                cameraMetadata
                    ?.model
        },

        {
            label:
                "Lens",

            value:
                cameraMetadata
                    ?.lens
        },

        {
            label:
                "Aperture",

            value:
                cameraMetadata
                    ?.aperture
        },

        {
            label:
                "Exposure time",

            value:
                cameraMetadata
                    ?.exposureTime
        },

        {
            label:
                "ISO",

            value:
                cameraMetadata
                    ?.iso
        },

        {
            label:
                "Focal length",

            value:
                cameraMetadata
                    ?.focalLength
        },

        {
            label:
                "Flash",

            value:
                cameraMetadata
                    ?.flash
        },

        {
            label:
                "Software",

            value:
                cameraMetadata
                    ?.software
        }
    ];

    const availableRows =
        cameraRows.filter(
            (item) =>
                hasDisplayableMetadataValue(
                    item.value
                ) &&
                item.value !== "Unknown"
        );

    if (
        !hasExif ||
        availableRows.length === 0
    ) {
        elements.cameraMetadata.innerHTML = `
            <div class="metadata-empty-state">
                <span
                    class="metadata-empty-icon"
                    aria-hidden="true"
                >
                    ◉
                </span>

                <div>
                    <strong>No camera details found</strong>

                    <p>
                        The image does not provide readable camera,
                        lens or exposure information.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    elements.cameraMetadata.innerHTML =
        availableRows
            .map(
                (item) =>
                    createMetadataRowHTML(
                        item.label,
                        formatMetadataDisplayValue(
                            item.value
                        )
                    )
            )
            .join("");
}


/* ==========================================================
   Render GPS Metadata
   ========================================================== */

function renderGPSMetadata(
    gpsMetadata,
    hasExif
) {
    if (
        !elements.gpsMetadata
    ) {
        return;
    }

    if (
        !hasExif ||
        !gpsMetadata ||
        !gpsMetadata.hasCoordinates
    ) {
        elements.gpsMetadata.innerHTML = `
            <div class="metadata-empty-state">
                <span
                    class="metadata-empty-icon"
                    aria-hidden="true"
                >
                    ◎
                </span>

                <div>
                    <strong>No GPS information found</strong>

                    <p>
                        This image does not contain readable location
                        coordinates.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    const latitude =
        gpsMetadata.latitudeFormatted;

    const longitude =
        gpsMetadata.longitudeFormatted;

    const altitude =
        gpsMetadata.altitude;

    const gpsDate =
        gpsMetadata.date;

    const mapURL =
        gpsMetadata.mapURL;

    elements.gpsMetadata.innerHTML = `
        ${createMetadataRowHTML(
            "Latitude",
            latitude
        )}

        ${createMetadataRowHTML(
            "Longitude",
            longitude
        )}

        ${createMetadataRowHTML(
            "Altitude",
            altitude
        )}

        ${createMetadataRowHTML(
            "GPS date",
            gpsDate
        )}

        ${
            mapURL
                ? `
                    <a
                        class="metadata-map-link"
                        href="${escapeHTML(mapURL)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open location in Google Maps
                    </a>
                `
                : ""
        }

        <div class="metadata-location-warning">
            <span aria-hidden="true">!</span>

            <p>
                GPS metadata may reveal where a photo was taken.
                Remove location data before publicly sharing sensitive images.
            </p>
        </div>
    `;
}


/* ==========================================================
   Create Metadata Row
   ========================================================== */

function createMetadataRowHTML(
    label,
    value
) {
    return `
        <div class="metadata-row">
            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value)}
            </strong>
        </div>
    `;
}


/* ==========================================================
   Displayable Metadata Check
   ========================================================== */

function hasDisplayableMetadataValue(
    value
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    if (
        typeof value === "number"
    ) {
        return Number.isFinite(
            value
        );
    }

    if (
        typeof value === "string"
    ) {
        const normalizedValue =
            value
                .trim()
                .toLowerCase();

        return (
            normalizedValue !== "" &&
            normalizedValue !== "unknown" &&
            normalizedValue !== "not available"
        );
    }

    if (
        Array.isArray(value)
    ) {
        return value.length > 0;
    }

    if (
        typeof value === "object"
    ) {
        return (
            Object.keys(value)
                .length > 0
        );
    }

    return true;
}


/* ==========================================================
   Format Metadata Display Value
   ========================================================== */

function formatMetadataDisplayValue(
    value
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "Not available";
    }

    if (
        typeof value === "number"
    ) {
        return Number.isInteger(value)
            ? String(value)
            : formatDecimal(value);
    }

    if (
        typeof value === "string"
    ) {
        return value.trim();
    }

    if (
        Array.isArray(value)
    ) {
        return value
            .map(
                (item) =>
                    formatMetadataDisplayValue(
                        item
                    )
            )
            .join(", ");
    }

    if (
        typeof value === "object"
    ) {
        if (
            Number.isFinite(
                value.value
            )
        ) {
            return formatDecimal(
                value.value
            );
        }

        try {
            return JSON.stringify(
                value
            );
        } catch {
            return String(value);
        }
    }

    return String(value);
}


/* ==========================================================
   Update Metadata Preview
   ========================================================== */

function updateMetadataPreviewState(
    hasExif
) {
    if (
        elements.metadataImagePreview &&
        metadataState.imageObjectURL
    ) {
        elements.metadataImagePreview.src =
            metadataState.imageObjectURL;

        elements.metadataImagePreview.hidden =
            false;
    }

    if (
        elements.metadataPlaceholder
    ) {
        elements.metadataPlaceholder.hidden =
            true;
    }

    if (
        elements.metadataImageSize &&
        metadataState.originalFile
    ) {
        elements.metadataImageSize.textContent =
            hasExif
                ? "Metadata found"
                : "No EXIF data";
    }
}


/* ==========================================================
   Create Metadata Report Data
   ========================================================== */

function createMetadataReportData(
    extractedMetadata
) {
    const file =
        metadataState.originalFile;

    const basic =
        metadataState.basicMetadata;

    const exif =
        extractedMetadata.exif || {};

    const camera =
        extractedMetadata.camera || {};

    const gps =
        extractedMetadata.gps || {};

    return {
        report: {
            title:
                "Image Metadata Report",

            generatedAt:
                new Date().toISOString(),

            generatedWith:
                "ImageTools Metadata Viewer"
        },

        file: {
            name:
                file?.name || "",

            type:
                getReadableImageType(
                    file?.type || ""
                ),

            mimeType:
                file?.type || "",

            extension:
                basic.extension || "",

            size:
                basic.fileSize || "",

            sizeBytes:
                file?.size || 0,

            lastModified:
                basic.lastModified || ""
        },

        image: {
            width:
                metadataState.width,

            height:
                metadataState.height,

            resolution:
                basic.resolution || "",

            megapixels:
                basic.megapixels || "",

            aspectRatio:
                basic.aspectRatio || ""
        },

        metadataSummary: {
            exifFound:
                Boolean(
                    extractedMetadata.hasExif
                ),

            cameraInformationFound:
                hasUsefulCameraMetadata(
                    camera
                ),

            gpsCoordinatesFound:
                Boolean(
                    gps.hasCoordinates
                )
        },

        exif:
            sanitizeReportObject(
                exif
            ),

        camera:
            sanitizeReportObject(
                camera
            ),

        gps:
            createGPSReportData(
                gps
            )
    };
}


/* ==========================================================
   Check Useful Camera Metadata
   ========================================================== */

function hasUsefulCameraMetadata(
    cameraMetadata
) {
    if (
        !cameraMetadata ||
        typeof cameraMetadata !==
            "object"
    ) {
        return false;
    }

    return Object.values(
        cameraMetadata
    ).some(
        (value) =>
            hasDisplayableMetadataValue(
                value
            ) &&
            value !== "Unknown"
    );
}


/* ==========================================================
   GPS Report Data
   ========================================================== */

function createGPSReportData(
    gpsMetadata
) {
    if (
        !gpsMetadata ||
        !gpsMetadata.hasCoordinates
    ) {
        return {
            available:
                false,

            latitude:
                null,

            longitude:
                null,

            altitude:
                null,

            date:
                null,

            mapURL:
                null
        };
    }

    return {
        available:
            true,

        latitude:
            gpsMetadata.latitude,

        longitude:
            gpsMetadata.longitude,

        latitudeFormatted:
            gpsMetadata.latitudeFormatted,

        longitudeFormatted:
            gpsMetadata.longitudeFormatted,

        altitude:
            gpsMetadata.altitude,

        date:
            gpsMetadata.date,

        mapURL:
            gpsMetadata.mapURL
    };
}


/* ==========================================================
   Sanitize Report Object
   ========================================================== */

function sanitizeReportObject(
    source
) {
    if (
        !source ||
        typeof source !== "object"
    ) {
        return {};
    }

    const sanitized = {};

    Object.entries(source)
        .forEach(
            ([key, value]) => {
                const safeValue =
                    sanitizeReportValue(
                        value
                    );

                if (
                    safeValue !== undefined
                ) {
                    sanitized[key] =
                        safeValue;
                }
            }
        );

    return sanitized;
}


/* ==========================================================
   Sanitize Report Value
   ========================================================== */

function sanitizeReportValue(
    value
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return undefined;
    }

    if (
        typeof value === "number"
    ) {
        return Number.isFinite(value)
            ? value
            : undefined;
    }

    if (
        typeof value === "string" ||
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        Array.isArray(value)
    ) {
        return value
            .map(
                (item) =>
                    sanitizeReportValue(
                        item
                    )
            )
            .filter(
                (item) =>
                    item !== undefined
            );
    }

    if (
        typeof value === "object"
    ) {
        if (
            Number.isFinite(
                value.value
            )
        ) {
            return value.value;
        }

        return sanitizeReportObject(
            value
        );
    }

    return String(value);
}


/* ==========================================================
   Metadata Summary Text
   ========================================================== */

function createMetadataSummaryText() {
    const report =
        metadataState.reportData;

    if (!report) {
        return "";
    }

    const lines = [];

    lines.push(
        "IMAGE METADATA REPORT"
    );

    lines.push(
        "====================="
    );

    lines.push("");

    lines.push(
        `File: ${report.file.name}`
    );

    lines.push(
        `Type: ${report.file.type}`
    );

    lines.push(
        `File size: ${report.file.size}`
    );

    lines.push(
        `Resolution: ${report.image.resolution}`
    );

    lines.push(
        `Megapixels: ${report.image.megapixels}`
    );

    lines.push(
        `Aspect ratio: ${report.image.aspectRatio}`
    );

    lines.push("");

    lines.push(
        `EXIF found: ${
            report.metadataSummary.exifFound
                ? "Yes"
                : "No"
        }`
    );

    lines.push(
        `Camera information found: ${
            report.metadataSummary.cameraInformationFound
                ? "Yes"
                : "No"
        }`
    );

    lines.push(
        `GPS coordinates found: ${
            report.metadataSummary.gpsCoordinatesFound
                ? "Yes"
                : "No"
        }`
    );

    appendReportSection(
        lines,
        "EXIF INFORMATION",
        report.exif
    );

    appendReportSection(
        lines,
        "CAMERA INFORMATION",
        report.camera
    );

    appendReportSection(
        lines,
        "GPS INFORMATION",
        report.gps
    );

    lines.push("");

    lines.push(
        `Generated: ${new Date(
            report.report.generatedAt
        ).toLocaleString()}`
    );

    lines.push(
        "Generated with ImageTools Metadata Viewer"
    );

    return lines.join("\n");
}


/* ==========================================================
   Append Text Report Section
   ========================================================== */

function appendReportSection(
    lines,
    heading,
    data
) {
    if (
        !data ||
        typeof data !== "object"
    ) {
        return;
    }

    const entries =
        Object.entries(data)
            .filter(
                ([, value]) =>
                    hasDisplayableMetadataValue(
                        value
                    )
            );

    if (
        entries.length === 0
    ) {
        return;
    }

    lines.push("");

    lines.push(heading);

    lines.push(
        "-".repeat(
            heading.length
        )
    );

    entries.forEach(
        ([key, value]) => {
            lines.push(
                `${formatMetadataLabel(key)}: ` +
                `${formatMetadataDisplayValue(value)}`
            );
        }
    );
}


/* ==========================================================
   Format Metadata Label
   ========================================================== */

function formatMetadataLabel(
    value
) {
    return String(value)
        .replace(
            /([a-z0-9])([A-Z])/g,
            "$1 $2"
        )
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        )
        .trim();
}

/* ==========================================================
   ImageTools - Metadata Viewer
   Part 2B-2A
   Report Export and Download Utilities
   ========================================================== */


/* ==========================================================
   Download Metadata Report
   ========================================================== */

function downloadMetadataReport() {
    clearMetadataError();

    if (
        !metadataState.originalFile
    ) {
        showMetadataError(
            "Please select an image before exporting a metadata report."
        );

        return;
    }

    if (
        !metadataState.reportData
    ) {
        showMetadataError(
            "Analyze the image metadata before exporting the report."
        );

        return;
    }

    try {
        const reportFormat =
            getSelectedMetadataReportFormat();

        const baseFileName =
            createMetadataReportFileName(
                metadataState.originalFile.name
            );

        if (
            reportFormat === "txt"
        ) {
            exportMetadataTextReport(
                baseFileName
            );

            return;
        }

        exportMetadataJSONReport(
            baseFileName
        );
    } catch (error) {
        console.error(
            "Metadata report export failed:",
            error
        );

        showMetadataError(
            "The metadata report could not be exported."
        );
    }
}


/* ==========================================================
   Determine Report Format
   ========================================================== */

function getSelectedMetadataReportFormat() {
    const formatSelect =
        document.getElementById(
            "metadataReportFormat"
        );

    if (
        !formatSelect
    ) {
        return "json";
    }

    const selectedFormat =
        String(
            formatSelect.value || ""
        )
            .trim()
            .toLowerCase();

    if (
        selectedFormat === "txt"
    ) {
        return "txt";
    }

    return "json";
}


/* ==========================================================
   Export JSON Report
   ========================================================== */

function exportMetadataJSONReport(
    baseFileName
) {
    const reportJSON =
        JSON.stringify(
            metadataState.reportData,
            null,
            2
        );

    const reportBlob =
        new Blob(
            [reportJSON],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );

    downloadMetadataBlob(
        reportBlob,
        `${baseFileName}.json`
    );

    setMetadataStatus(
        "Report exported",
        "success"
    );
}


/* ==========================================================
   Export Text Report
   ========================================================== */

function exportMetadataTextReport(
    baseFileName
) {
    const reportText =
        createMetadataSummaryText();

    if (
        !reportText
    ) {
        throw new Error(
            "No metadata report text is available."
        );
    }

    const reportBlob =
        new Blob(
            [reportText],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );

    downloadMetadataBlob(
        reportBlob,
        `${baseFileName}.txt`
    );

    setMetadataStatus(
        "Report exported",
        "success"
    );
}


/* ==========================================================
   Download Blob
   ========================================================== */

function downloadMetadataBlob(
    blob,
    fileName
) {
    if (
        !(blob instanceof Blob)
    ) {
        throw new TypeError(
            "A valid report file could not be created."
        );
    }

    const downloadURL =
        URL.createObjectURL(
            blob
        );

    const downloadLink =
        document.createElement(
            "a"
        );

    downloadLink.href =
        downloadURL;

    downloadLink.download =
        fileName;

    downloadLink.style.display =
        "none";

    downloadLink.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.appendChild(
        downloadLink
    );

    downloadLink.click();

    downloadLink.remove();

    window.setTimeout(
        () => {
            URL.revokeObjectURL(
                downloadURL
            );
        },
        1000
    );
}


/* ==========================================================
   Create Report Filename
   ========================================================== */

function createMetadataReportFileName(
    originalFileName
) {
    const safeOriginalName =
        removeFileExtension(
            originalFileName ||
            "image"
        );

    const sanitizedName =
        sanitizeDownloadFileName(
            safeOriginalName
        );

    return (
        sanitizedName
            ? `${sanitizedName}-metadata-report`
            : "image-metadata-report"
    );
}


/* ==========================================================
   Remove File Extension
   ========================================================== */

function removeFileExtension(
    fileName
) {
    const normalizedName =
        String(
            fileName || ""
        ).trim();

    if (
        !normalizedName
    ) {
        return "";
    }

    const lastDotIndex =
        normalizedName.lastIndexOf(
            "."
        );

    if (
        lastDotIndex <= 0
    ) {
        return normalizedName;
    }

    return normalizedName.slice(
        0,
        lastDotIndex
    );
}


/* ==========================================================
   Sanitize Download Filename
   ========================================================== */

function sanitizeDownloadFileName(
    fileName
) {
    return String(
        fileName || ""
    )
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[<>:"/\\|?*\u0000-\u001F]/g,
            "-"
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^[.\-\s]+|[.\-\s]+$/g,
            ""
        )
        .slice(
            0,
            100
        );
}


/* ==========================================================
   Copy Metadata Report
   ========================================================== */

async function copyMetadataReportToClipboard() {
    clearMetadataError();

    if (
        !metadataState.reportData
    ) {
        showMetadataError(
            "Analyze an image before copying its metadata report."
        );

        return false;
    }

    const reportText =
        createMetadataSummaryText();

    if (
        !reportText
    ) {
        showMetadataError(
            "No metadata report is available to copy."
        );

        return false;
    }

    try {
        await writeMetadataTextToClipboard(
            reportText
        );

        setMetadataStatus(
            "Report copied",
            "success"
        );

        return true;
    } catch (error) {
        console.error(
            "Clipboard copy failed:",
            error
        );

        showMetadataError(
            "The metadata report could not be copied to the clipboard."
        );

        return false;
    }
}


/* ==========================================================
   Write Text to Clipboard
   ========================================================== */

async function writeMetadataTextToClipboard(
    text
) {
    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {
        await navigator.clipboard.writeText(
            text
        );

        return;
    }

    copyMetadataTextWithFallback(
        text
    );
}


/* ==========================================================
   Clipboard Fallback
   ========================================================== */

function copyMetadataTextWithFallback(
    text
) {
    const temporaryTextArea =
        document.createElement(
            "textarea"
        );

    temporaryTextArea.value =
        text;

    temporaryTextArea.setAttribute(
        "readonly",
        ""
    );

    temporaryTextArea.style.position =
        "fixed";

    temporaryTextArea.style.top =
        "-9999px";

    temporaryTextArea.style.left =
        "-9999px";

    temporaryTextArea.style.opacity =
        "0";

    document.body.appendChild(
        temporaryTextArea
    );

    temporaryTextArea.select();

    temporaryTextArea.setSelectionRange(
        0,
        temporaryTextArea.value.length
    );

    const copySucceeded =
        document.execCommand(
            "copy"
        );

    temporaryTextArea.remove();

    if (
        !copySucceeded
    ) {
        throw new Error(
            "Clipboard access was unavailable."
        );
    }
}


/* ==========================================================
   Export Raw EXIF Data
   ========================================================== */

function exportRawMetadataReport() {
    clearMetadataError();

    if (
        !metadataState.originalFile
    ) {
        showMetadataError(
            "Please select an image before exporting raw metadata."
        );

        return;
    }

    if (
        !metadataState.reportData
    ) {
        showMetadataError(
            "Analyze the image before exporting raw metadata."
        );

        return;
    }

    try {
        const rawReport = {
            file:
                metadataState.reportData.file,

            image:
                metadataState.reportData.image,

            exif:
                metadataState.exifMetadata || {},

            camera:
                metadataState.cameraMetadata || {},

            gps:
                metadataState.gpsMetadata || {},

            exportedAt:
                new Date().toISOString()
        };

        const rawJSON =
            JSON.stringify(
                rawReport,
                null,
                2
            );

        const rawBlob =
            new Blob(
                [rawJSON],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );

        const baseFileName =
            createMetadataReportFileName(
                metadataState.originalFile.name
            );

        downloadMetadataBlob(
            rawBlob,
            `${baseFileName}-raw.json`
        );

        setMetadataStatus(
            "Raw data exported",
            "success"
        );
    } catch (error) {
        console.error(
            "Raw metadata export failed:",
            error
        );

        showMetadataError(
            "The raw metadata could not be exported."
        );
    }
}


/* ==========================================================
   Create Compact Metadata Summary
   ========================================================== */

function createCompactMetadataSummary() {
    const report =
        metadataState.reportData;

    if (!report) {
        return "";
    }

    const summaryParts = [
        report.file.name,
        report.image.resolution,
        report.file.size
    ];

    const cameraName =
        createCameraDisplayName(
            report.camera
        );

    if (
        cameraName
    ) {
        summaryParts.push(
            cameraName
        );
    }

    if (
        report.metadataSummary
            .gpsCoordinatesFound
    ) {
        summaryParts.push(
            "GPS data found"
        );
    }

    return summaryParts
        .filter(Boolean)
        .join(" • ");
}


/* ==========================================================
   Create Camera Display Name
   ========================================================== */

function createCameraDisplayName(
    cameraMetadata
) {
    if (
        !cameraMetadata ||
        typeof cameraMetadata !==
            "object"
    ) {
        return "";
    }

    const manufacturer =
        normalizeMetadataText(
            cameraMetadata.manufacturer
        );

    const model =
        normalizeMetadataText(
            cameraMetadata.model
        );

    if (
        !manufacturer &&
        !model
    ) {
        return "";
    }

    if (
        manufacturer &&
        model &&
        model
            .toLowerCase()
            .startsWith(
                manufacturer.toLowerCase()
            )
    ) {
        return model;
    }

    return [
        manufacturer,
        model
    ]
        .filter(Boolean)
        .join(" ");
}


/* ==========================================================
   Normalize Metadata Text
   ========================================================== */

function normalizeMetadataText(
    value
) {
    if (
        typeof value !==
            "string"
    ) {
        return "";
    }

    const normalizedValue =
        value.trim();

    if (
        !normalizedValue ||
        normalizedValue.toLowerCase() ===
            "unknown" ||
        normalizedValue.toLowerCase() ===
            "not available"
    ) {
        return "";
    }

    return normalizedValue;
}


/* ==========================================================
   Serialize Metadata Value
   ========================================================== */

function serializeMetadataValue(
    value
) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    if (
        typeof value === "string"
    ) {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (
        Array.isArray(value)
    ) {
        return value
            .map(
                (item) =>
                    serializeMetadataValue(
                        item
                    )
            )
            .filter(Boolean)
            .join(", ");
    }

    if (
        typeof value === "object"
    ) {
        if (
            Number.isFinite(
                value.value
            )
        ) {
            return String(
                value.value
            );
        }

        try {
            return JSON.stringify(
                value
            );
        } catch {
            return "[Unserializable data]";
        }
    }

    return String(value);
}


/* ==========================================================
   Create Flat Metadata Entries
   ========================================================== */

function createFlatMetadataEntries(
    source,
    prefix = ""
) {
    if (
        !source ||
        typeof source !==
            "object"
    ) {
        return [];
    }

    const entries = [];

    Object.entries(source)
        .forEach(
            ([key, value]) => {
                const fullKey =
                    prefix
                        ? `${prefix}.${key}`
                        : key;

                if (
                    value &&
                    typeof value ===
                        "object" &&
                    !Array.isArray(value) &&
                    !Number.isFinite(
                        value.value
                    )
                ) {
                    entries.push(
                        ...createFlatMetadataEntries(
                            value,
                            fullKey
                        )
                    );

                    return;
                }

                entries.push({
                    key:
                        fullKey,

                    value:
                        serializeMetadataValue(
                            value
                        )
                });
            }
        );

    return entries;
}


/* ==========================================================
   Create CSV Metadata Report
   ========================================================== */

function createMetadataCSVReport() {
    if (
        !metadataState.reportData
    ) {
        return "";
    }

    const flattenedEntries =
        createFlatMetadataEntries(
            metadataState.reportData
        );

    const rows = [
        [
            "Field",
            "Value"
        ]
    ];

    flattenedEntries.forEach(
        (entry) => {
            rows.push([
                entry.key,
                entry.value
            ]);
        }
    );

    return rows
        .map(
            (row) =>
                row
                    .map(
                        (value) =>
                            escapeMetadataCSVValue(
                                value
                            )
                    )
                    .join(",")
        )
        .join("\n");
}


/* ==========================================================
   Escape CSV Value
   ========================================================== */

function escapeMetadataCSVValue(
    value
) {
    const stringValue =
        String(
            value ?? ""
        );

    if (
        /[",\n\r]/.test(
            stringValue
        )
    ) {
        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;
    }

    return stringValue;
}


/* ==========================================================
   Export CSV Report
   ========================================================== */

function exportMetadataCSVReport() {
    clearMetadataError();

    if (
        !metadataState.reportData
    ) {
        showMetadataError(
            "Analyze an image before exporting a CSV report."
        );

        return;
    }

    try {
        const csvReport =
            createMetadataCSVReport();

        if (
            !csvReport
        ) {
            throw new Error(
                "No CSV report data was generated."
            );
        }

        const csvBlob =
            new Blob(
                [
                    "\uFEFF",
                    csvReport
                ],
                {
                    type:
                        "text/csv;charset=utf-8"
                }
            );

        const baseFileName =
            createMetadataReportFileName(
                metadataState.originalFile
                    ?.name
            );

        downloadMetadataBlob(
            csvBlob,
            `${baseFileName}.csv`
        );

        setMetadataStatus(
            "CSV exported",
            "success"
        );
    } catch (error) {
        console.error(
            "CSV metadata export failed:",
            error
        );

        showMetadataError(
            "The CSV metadata report could not be exported."
        );
    }
}

/* ==========================================================
   ImageTools - Metadata Viewer
   Part 2B-2B
   Reset, Transferred Images and Shared Page Utilities
   ========================================================== */


/* ==========================================================
   Reset Metadata Viewer
   ========================================================== */

function resetMetadataViewer() {
    if (
        metadataState.isProcessing
    ) {
        return;
    }

    releaseOriginalImageURL();

    metadataState.originalFile =
        null;

    metadataState.originalImage =
        null;

    metadataState.imageObjectURL =
        "";

    metadataState.width =
        0;

    metadataState.height =
        0;

    metadataState.basicMetadata =
        {};

    metadataState.exifMetadata =
        {};

    metadataState.cameraMetadata =
        {};

    metadataState.gpsMetadata =
        {};

    metadataState.reportData =
        null;

    metadataState.isProcessing =
        false;

    if (
        elements.imageInput
    ) {
        elements.imageInput.value =
            "";
    }

    if (
        elements.interface
    ) {
        elements.interface.hidden =
            true;
    }

    if (
        elements.uploadZone
    ) {
        elements.uploadZone.hidden =
            false;

        elements.uploadZone.classList.remove(
            "drag-over"
        );

        elements.uploadZone.classList.remove(
            "has-file"
        );
    }

    if (
        elements.thumbnail
    ) {
        elements.thumbnail.src =
            "";

        elements.thumbnail.alt =
            "Selected image preview";
    }

    if (
        elements.metadataImagePreview
    ) {
        elements.metadataImagePreview.src =
            "";

        elements.metadataImagePreview.hidden =
            true;
    }

    if (
        elements.metadataPlaceholder
    ) {
        elements.metadataPlaceholder.hidden =
            false;
    }

    if (
        elements.fileName
    ) {
        elements.fileName.textContent =
            "No image selected";
    }

    if (
        elements.fileMeta
    ) {
        elements.fileMeta.textContent =
            "Choose an image to inspect";
    }

    if (
        elements.basicMetadata
    ) {
        elements.basicMetadata.innerHTML =
            createInitialMetadataMessage(
                "Basic image information will appear here."
            );
    }

    if (
        elements.exifMetadata
    ) {
        elements.exifMetadata.innerHTML =
            createInitialMetadataMessage(
                "No EXIF data loaded."
            );
    }

    if (
        elements.cameraMetadata
    ) {
        elements.cameraMetadata.innerHTML =
            createInitialMetadataMessage(
                "Camera information will appear here."
            );
    }

    if (
        elements.gpsMetadata
    ) {
        elements.gpsMetadata.innerHTML =
            createInitialMetadataMessage(
                "No GPS information."
            );
    }

    if (
        elements.imageStatSize
    ) {
        elements.imageStatSize.textContent =
            "—";
    }

    if (
        elements.fileTypeValue
    ) {
        elements.fileTypeValue.textContent =
            "—";
    }

    if (
        elements.resolutionValue
    ) {
        elements.resolutionValue.textContent =
            "—";
    }

    if (
        elements.metadataImageSize
    ) {
        elements.metadataImageSize.textContent =
            "No metadata analyzed";
    }

    if (
        elements.analyzeButton
    ) {
        elements.analyzeButton.disabled =
            false;

        elements.analyzeButton.textContent =
            "Analyze Metadata";
    }

    if (
        elements.downloadButton
    ) {
        elements.downloadButton.disabled =
            true;
    }

    if (
        elements.changeImageButton
    ) {
        elements.changeImageButton.disabled =
            false;
    }

    if (
        elements.resetButton
    ) {
        elements.resetButton.disabled =
            false;
    }

    const reportFormat =
        document.getElementById(
            "metadataReportFormat"
        );

    if (
        reportFormat
    ) {
        reportFormat.value =
            "json";
    }

    clearMetadataError();

    setMetadataStatus(
        "Ready",
        "ready"
    );

    clearTransferredImageStorage();
}


/* ==========================================================
   Initial Metadata Message
   ========================================================== */

function createInitialMetadataMessage(
    message
) {
    return `
        <div class="metadata-initial-message">
            ${escapeHTML(message)}
        </div>
    `;
}


/* ==========================================================
   Load Transferred Image
   ========================================================== */

async function loadTransferredImage() {
    const transferredImage =
        getTransferredImageData();

    if (
        !transferredImage
    ) {
        return false;
    }

    try {
        const file =
            await createFileFromTransferredData(
                transferredImage
            );

        if (
            !file
        ) {
            clearTransferredImageStorage();

            return false;
        }

        const validationResult =
            validateMetadataFile(
                file
            );

        if (
            validationResult !== true
        ) {
            clearTransferredImageStorage();

            return false;
        }

        await handleSelectedMetadataFile(
            file
        );

        clearTransferredImageStorage();

        return true;
    } catch (error) {
        console.error(
            "Transferred image could not be loaded:",
            error
        );

        clearTransferredImageStorage();

        return false;
    }
}


/* ==========================================================
   Read Transferred Image Data
   ========================================================== */

function getTransferredImageData() {
    const possibleKeys = [
        "imageToolsTransferredImage",
        "imageToolsImageTransfer",
        "transferredImage",
        "selectedImageData",
        "imageToolTransfer"
    ];

    for (
        const key of possibleKeys
    ) {
        const storedValue =
            getStorageValue(
                key
            );

        if (
            !storedValue
        ) {
            continue;
        }

        const parsedValue =
            parseTransferredImageValue(
                storedValue
            );

        if (
            parsedValue
        ) {
            parsedValue.storageKey =
                key;

            return parsedValue;
        }
    }

    return null;
}


/* ==========================================================
   Get Storage Value
   ========================================================== */

function getStorageValue(
    key
) {
    try {
        return (
            sessionStorage.getItem(
                key
            ) ||
            localStorage.getItem(
                key
            )
        );
    } catch (error) {
        console.warn(
            "Browser storage could not be accessed:",
            error
        );

        return null;
    }
}


/* ==========================================================
   Parse Transferred Image Value
   ========================================================== */

function parseTransferredImageValue(
    storedValue
) {
    if (
        typeof storedValue !==
            "string" ||
        !storedValue.trim()
    ) {
        return null;
    }

    const normalizedValue =
        storedValue.trim();

    if (
        normalizedValue.startsWith(
            "data:image/"
        )
    ) {
        return {
            dataURL:
                normalizedValue,

            name:
                "transferred-image",

            type:
                getMimeTypeFromDataURL(
                    normalizedValue
                )
        };
    }

    try {
        const parsed =
            JSON.parse(
                normalizedValue
            );

        if (
            !parsed ||
            typeof parsed !==
                "object"
        ) {
            return null;
        }

        const dataURL =
            parsed.dataURL ||
            parsed.dataUrl ||
            parsed.imageData ||
            parsed.image ||
            parsed.src ||
            "";

        if (
            typeof dataURL !==
                "string" ||
            !dataURL.startsWith(
                "data:image/"
            )
        ) {
            return null;
        }

        return {
            dataURL,

            name:
                parsed.name ||
                parsed.fileName ||
                parsed.filename ||
                "transferred-image",

            type:
                parsed.type ||
                parsed.mimeType ||
                getMimeTypeFromDataURL(
                    dataURL
                ),

            lastModified:
                Number(
                    parsed.lastModified
                ) ||
                Date.now()
        };
    } catch {
        return null;
    }
}


/* ==========================================================
   Create File From Transferred Data
   ========================================================== */

async function createFileFromTransferredData(
    transferredImage
) {
    if (
        !transferredImage ||
        !transferredImage.dataURL
    ) {
        return null;
    }

    const response =
        await fetch(
            transferredImage.dataURL
        );

    if (
        !response.ok
    ) {
        throw new Error(
            "The transferred image data is invalid."
        );
    }

    const blob =
        await response.blob();

    const mimeType =
        transferredImage.type ||
        blob.type ||
        "image/png";

    const extension =
        getExtensionFromMimeType(
            mimeType
        );

    let fileName =
        String(
            transferredImage.name ||
            "transferred-image"
        ).trim();

    if (
        !fileName
    ) {
        fileName =
            "transferred-image";
    }

    if (
        !/\.[a-z0-9]+$/i.test(
            fileName
        )
    ) {
        fileName +=
            `.${extension}`;
    }

    return new File(
        [blob],
        fileName,
        {
            type:
                mimeType,

            lastModified:
                transferredImage.lastModified ||
                Date.now()
        }
    );
}


/* ==========================================================
   Get MIME Type From Data URL
   ========================================================== */

function getMimeTypeFromDataURL(
    dataURL
) {
    const match =
        String(
            dataURL || ""
        ).match(
            /^data:([^;,]+)/
        );

    return match
        ? match[1]
        : "image/png";
}


/* ==========================================================
   Get Extension From MIME Type
   ========================================================== */

function getExtensionFromMimeType(
    mimeType
) {
    const extensionMap = {
        "image/jpeg":
            "jpg",

        "image/jpg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp",

        "image/gif":
            "gif",

        "image/bmp":
            "bmp",

        "image/svg+xml":
            "svg",

        "image/avif":
            "avif",

        "image/tiff":
            "tiff",

        "image/x-icon":
            "ico"
    };

    return (
        extensionMap[
            String(
                mimeType || ""
            ).toLowerCase()
        ] ||
        "png"
    );
}


/* ==========================================================
   Clear Transferred Image Storage
   ========================================================== */

function clearTransferredImageStorage() {
    const possibleKeys = [
        "imageToolsTransferredImage",
        "imageToolsImageTransfer",
        "transferredImage",
        "selectedImageData",
        "imageToolTransfer"
    ];

    possibleKeys.forEach(
        (key) => {
            try {
                sessionStorage.removeItem(
                    key
                );

                localStorage.removeItem(
                    key
                );
            } catch (error) {
                console.warn(
                    `Unable to clear stored image key "${key}":`,
                    error
                );
            }
        }
    );
}


/* ==========================================================
   Initialize Theme
   ========================================================== */

function initializeTheme() {
    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    const savedTheme =
        getSavedTheme();

    const preferredTheme =
        savedTheme ||
        getPreferredTheme();

    applyTheme(
        preferredTheme
    );

    if (
        !themeToggle ||
        themeToggle.dataset
            .metadataThemeBound ===
            "true"
    ) {
        return;
    }

    themeToggle.dataset
        .metadataThemeBound =
        "true";

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
                currentTheme ===
                    "dark"
                    ? "light"
                    : "dark";

            applyTheme(
                nextTheme
            );

            saveTheme(
                nextTheme
            );
        }
    );
}


/* ==========================================================
   Get Saved Theme
   ========================================================== */

function getSavedTheme() {
    try {
        const savedTheme =
            localStorage.getItem(
                "imageToolsTheme"
            ) ||
            localStorage.getItem(
                "theme"
            );

        return (
            savedTheme === "light" ||
            savedTheme === "dark"
                ? savedTheme
                : ""
        );
    } catch {
        return "";
    }
}


/* ==========================================================
   Preferred Theme
   ========================================================== */

function getPreferredTheme() {
    if (
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: light)"
        ).matches
    ) {
        return "light";
    }

    return "dark";
}


/* ==========================================================
   Apply Theme
   ========================================================== */

function applyTheme(
    theme
) {
    const normalizedTheme =
        theme === "light"
            ? "light"
            : "dark";

    document.documentElement
        .setAttribute(
            "data-theme",
            normalizedTheme
        );

    document.body?.setAttribute(
        "data-theme",
        normalizedTheme
    );

    updateThemeToggle(
        normalizedTheme
    );
}


/* ==========================================================
   Save Theme
   ========================================================== */

function saveTheme(
    theme
) {
    try {
        localStorage.setItem(
            "imageToolsTheme",
            theme
        );
    } catch (error) {
        console.warn(
            "Theme preference could not be saved:",
            error
        );
    }
}


/* ==========================================================
   Update Theme Toggle
   ========================================================== */

function updateThemeToggle(
    theme
) {
    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    if (
        !themeToggle
    ) {
        return;
    }

    const isDarkTheme =
        theme === "dark";

    themeToggle.setAttribute(
        "aria-label",
        isDarkTheme
            ? "Switch to light theme"
            : "Switch to dark theme"
    );

    themeToggle.setAttribute(
        "title",
        isDarkTheme
            ? "Switch to light theme"
            : "Switch to dark theme"
    );

    themeToggle.setAttribute(
        "aria-pressed",
        String(
            !isDarkTheme
        )
    );

    const themeIcon =
        themeToggle.querySelector(
            "[data-theme-icon]"
        );

    if (
        themeIcon
    ) {
        themeIcon.textContent =
            isDarkTheme
                ? "☀"
                : "☾";
    }
}


/* ==========================================================
   Initialize Navigation
   ========================================================== */

function initializeNavigation() {
    const menuButton =
        document.getElementById(
            "menuButton"
        ) ||
        document.getElementById(
            "mobileMenuButton"
        ) ||
        document.querySelector(
            ".menu-toggle"
        );

    const navigation =
        document.getElementById(
            "navigation"
        ) ||
        document.getElementById(
            "navLinks"
        ) ||
        document.querySelector(
            ".nav-links"
        );

    if (
        menuButton &&
        navigation &&
        menuButton.dataset
            .metadataNavigationBound !==
            "true"
    ) {
        menuButton.dataset
            .metadataNavigationBound =
            "true";

        menuButton.addEventListener(
            "click",
            () => {
                const isOpen =
                    navigation.classList
                        .toggle(
                            "open"
                        );

                menuButton.classList.toggle(
                    "active",
                    isOpen
                );

                menuButton.setAttribute(
                    "aria-expanded",
                    String(
                        isOpen
                    )
                );
            }
        );

        navigation
            .querySelectorAll(
                "a"
            )
            .forEach(
                (link) => {
                    link.addEventListener(
                        "click",
                        () => {
                            navigation.classList
                                .remove(
                                    "open"
                                );

                            menuButton.classList
                                .remove(
                                    "active"
                                );

                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    );
                }
            );
    }

    markActiveNavigationLink();
}


/* ==========================================================
   Mark Active Navigation Link
   ========================================================== */

function markActiveNavigationLink() {
    const currentPage =
        window.location.pathname
            .split("/")
            .pop() ||
        "index.html";

    document
        .querySelectorAll(
            "nav a, .nav-links a"
        )
        .forEach(
            (link) => {
                const linkURL =
                    new URL(
                        link.href,
                        window.location.href
                    );

                const linkPage =
                    linkURL.pathname
                        .split("/")
                        .pop() ||
                    "index.html";

                const isActive =
                    linkPage ===
                    currentPage;

                link.classList.toggle(
                    "active",
                    isActive
                );

                if (
                    isActive
                ) {
                    link.setAttribute(
                        "aria-current",
                        "page"
                    );
                } else {
                    link.removeAttribute(
                        "aria-current"
                    );
                }
            }
        );
}


/* ==========================================================
   Initialize Footer
   ========================================================== */

function initializeFooter() {
    const yearElements =
        document.querySelectorAll(
            "#currentYear, [data-current-year]"
        );

    const currentYear =
        String(
            new Date().getFullYear()
        );

    yearElements.forEach(
        (element) => {
            element.textContent =
                currentYear;
        }
    );
}


/* ==========================================================
   Page Cleanup
   ========================================================== */

function cleanupMetadataViewer() {
    releaseOriginalImageURL();

    metadataState.originalImage =
        null;

    metadataState.reportData =
        null;
}


/* ==========================================================
   Keyboard Shortcuts
   ========================================================== */

function initializeMetadataKeyboardShortcuts() {
    if (
        document.body.dataset
            .metadataKeyboardBound ===
            "true"
    ) {
        return;
    }

    document.body.dataset
        .metadataKeyboardBound =
        "true";

    document.addEventListener(
        "keydown",
        (event) => {
            const activeElement =
                document.activeElement;

            const isTyping =
                activeElement &&
                (
                    activeElement.tagName ===
                        "INPUT" ||
                    activeElement.tagName ===
                        "TEXTAREA" ||
                    activeElement.tagName ===
                        "SELECT" ||
                    activeElement
                        .isContentEditable
                );

            if (
                isTyping
            ) {
                return;
            }

            if (
                event.key === "Enter" &&
                metadataState.originalFile &&
                !metadataState.isProcessing
            ) {
                event.preventDefault();

                analyzeSelectedMetadata();
            }

            if (
                event.key === "Escape" &&
                metadataState.originalFile &&
                !metadataState.isProcessing
            ) {
                resetMetadataViewer();
            }
        }
    );
}


/* ==========================================================
   Additional Event Initialization
   ========================================================== */

function initializeMetadataFinalEvents() {
    initializeMetadataKeyboardShortcuts();

    window.addEventListener(
        "beforeunload",
        cleanupMetadataViewer
    );

    window.addEventListener(
        "pagehide",
        cleanupMetadataViewer
    );
}


/* ==========================================================
   Run Final Metadata Initialization
   ========================================================== */

if (
    document.readyState ===
        "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeMetadataFinalEvents,
        {
            once:
                true
        }
    );
} else {
    initializeMetadataFinalEvents();
}