"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    initializeMobileNavigation();
    initializeImageUpload();
    initializeFooterYear();
});

/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    if (!themeToggle || !themeIcon) {
        return;
    }

    const savedTheme = localStorage.getItem("imagetools-theme");
    const preferredTheme = getPreferredTheme();
    const initialTheme = savedTheme || preferredTheme;

    applyTheme(initialTheme, themeIcon);

    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "dark";

        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(nextTheme, themeIcon);
        localStorage.setItem("imagetools-theme", nextTheme);
    });
}

function getPreferredTheme() {
    const prefersLight = window.matchMedia(
        "(prefers-color-scheme: light)"
    ).matches;

    return prefersLight ? "light" : "dark";
}

function applyTheme(theme, themeIcon) {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "light") {
        themeIcon.textContent = "☀";
        themeIcon.parentElement?.setAttribute(
            "aria-label",
            "Switch to dark theme"
        );
        themeIcon.parentElement?.setAttribute(
            "title",
            "Switch to dark theme"
        );
    } else {
        themeIcon.textContent = "☾";
        themeIcon.parentElement?.setAttribute(
            "aria-label",
            "Switch to light theme"
        );
        themeIcon.parentElement?.setAttribute(
            "title",
            "Switch to light theme"
        );
    }
}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function initializeMobileNavigation() {
    const menuButton = document.getElementById("mobileMenuButton");
    const mobileNavigation = document.getElementById("mobileNavigation");

    if (!menuButton || !mobileNavigation) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen = mobileNavigation.classList.toggle("is-open");

        menuButton.classList.toggle("is-active", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    mobileNavigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            closeMobileNavigation(menuButton, mobileNavigation);
        });
    });

    document.addEventListener("click", (event) => {
        const clickedInsideMenu =
            mobileNavigation.contains(event.target) ||
            menuButton.contains(event.target);

        if (!clickedInsideMenu) {
            closeMobileNavigation(menuButton, mobileNavigation);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileNavigation(menuButton, mobileNavigation);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileNavigation(menuButton, mobileNavigation);
        }
    });
}

function closeMobileNavigation(menuButton, mobileNavigation) {
    mobileNavigation.classList.remove("is-open");
    menuButton.classList.remove("is-active");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function initializeImageUpload() {
    const uploadZone = document.getElementById("uploadZone");
    const imageInput = document.getElementById("imageInput");
    const browseButton = document.getElementById("browseButton");
    const heroUploadButton = document.getElementById("heroUploadButton");

    const selectedFile = document.getElementById("selectedFile");
    const selectedImagePreview = document.getElementById(
        "selectedImagePreview"
    );
    const selectedFileName = document.getElementById("selectedFileName");
    const selectedFileInformation = document.getElementById(
        "selectedFileInformation"
    );

    const removeFileButton = document.getElementById("removeFileButton");
    const continueButton = document.getElementById("continueButton");

    if (
        !uploadZone ||
        !imageInput ||
        !selectedFile ||
        !selectedImagePreview ||
        !selectedFileName ||
        !selectedFileInformation
    ) {
        return;
    }

    let currentPreviewUrl = null;
    let currentFile = null;

    const openFilePicker = () => {
        imageInput.click();
    };

    uploadZone.addEventListener("click", (event) => {
        const clickedInteractiveElement = event.target.closest(
            "button, a, input"
        );

        if (!clickedInteractiveElement) {
            openFilePicker();
        }
    });

    uploadZone.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
        }
    });

    browseButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        openFilePicker();
    });

    heroUploadButton?.addEventListener("click", () => {
        uploadZone.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        window.setTimeout(openFilePicker, 350);
    });

    imageInput.addEventListener("change", () => {
        const [file] = imageInput.files;

        if (file) {
            processSelectedFile(file);
        }
    });

    uploadZone.addEventListener("dragenter", (event) => {
        preventDefaultDragBehaviour(event);
        uploadZone.classList.add("is-dragover");
    });

    uploadZone.addEventListener("dragover", (event) => {
        preventDefaultDragBehaviour(event);
        uploadZone.classList.add("is-dragover");
    });

    uploadZone.addEventListener("dragleave", (event) => {
        preventDefaultDragBehaviour(event);

        const nextElement = event.relatedTarget;

        if (!nextElement || !uploadZone.contains(nextElement)) {
            uploadZone.classList.remove("is-dragover");
        }
    });

    uploadZone.addEventListener("drop", (event) => {
        preventDefaultDragBehaviour(event);
        uploadZone.classList.remove("is-dragover");

        const files = Array.from(event.dataTransfer?.files || []);

        if (files.length === 0) {
            return;
        }

        processSelectedFile(files[0]);
    });

    removeFileButton?.addEventListener("click", () => {
        resetSelectedFile();
    });

    continueButton?.addEventListener("click", (event) => {
        if (!currentFile) {
            event.preventDefault();
            showUploadError("Please select an image first.");
            return;
        }

        try {
            storeSelectedImage(currentFile);
        } catch (error) {
            console.error("Could not store selected image:", error);
        }
    });

    function processSelectedFile(file) {
        clearUploadError();

        const validationResult = validateImageFile(file);

        if (!validationResult.valid) {
            resetSelectedFile();
            showUploadError(validationResult.message);
            return;
        }

        currentFile = file;

        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
        }

        currentPreviewUrl = URL.createObjectURL(file);

        selectedImagePreview.src = currentPreviewUrl;
        selectedImagePreview.alt = `Preview of ${file.name}`;

        selectedFileName.textContent = file.name;
        selectedFileInformation.textContent = buildFileInformation(file);

        selectedFile.hidden = false;

        selectedFile.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function resetSelectedFile() {
        currentFile = null;

        imageInput.value = "";

        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = null;
        }

        selectedImagePreview.src = "";
        selectedImagePreview.alt = "Selected image preview";

        selectedFileName.textContent = "";
        selectedFileInformation.textContent = "";

        selectedFile.hidden = true;

        clearUploadError();

        removeStoredImage();
    }
}

function preventDefaultDragBehaviour(event) {
    event.preventDefault();
    event.stopPropagation();
}

/* =========================================================
   FILE VALIDATION
   ========================================================= */

function validateImageFile(file) {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const maximumFileSize = 20 * 1024 * 1024;

    if (!file) {
        return {
            valid: false,
            message: "No file was selected."
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            message: "Please select a JPG, PNG, or WebP image."
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            message: "The selected file is empty."
        };
    }

    if (file.size > maximumFileSize) {
        return {
            valid: false,
            message: "The selected image must be smaller than 20 MB."
        };
    }

    return {
        valid: true,
        message: ""
    };
}

function buildFileInformation(file) {
    const formattedSize = formatFileSize(file.size);
    const formattedType = getFriendlyFileType(file.type);

    return `${formattedType} • ${formattedSize}`;
}

function getFriendlyFileType(mimeType) {
    const fileTypes = {
        "image/jpeg": "JPG",
        "image/png": "PNG",
        "image/webp": "WebP"
    };

    return fileTypes[mimeType] || "Image";
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return "Unknown size";
    }

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const size = bytes / Math.pow(1024, unitIndex);

    const roundedSize =
        unitIndex === 0
            ? Math.round(size)
            : size >= 10
              ? size.toFixed(1)
              : size.toFixed(2);

    return `${roundedSize} ${units[unitIndex]}`;
}

/* =========================================================
   UPLOAD ERROR MESSAGE
   ========================================================= */

function showUploadError(message) {
    const uploadZone = document.getElementById("uploadZone");

    if (!uploadZone) {
        return;
    }

    let errorMessage = document.getElementById("uploadErrorMessage");

    if (!errorMessage) {
        errorMessage = document.createElement("p");
        errorMessage.id = "uploadErrorMessage";
        errorMessage.setAttribute("role", "alert");

        Object.assign(errorMessage.style, {
            maxWidth: "840px",
            margin: "16px auto 0",
            padding: "12px 16px",
            border: "1px solid rgba(239, 68, 68, 0.28)",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.08)",
            color: "#f87171",
            fontSize: "0.9rem",
            fontWeight: "700",
            textAlign: "center"
        });

        uploadZone.insertAdjacentElement("afterend", errorMessage);
    }

    errorMessage.textContent = message;
}

function clearUploadError() {
    document.getElementById("uploadErrorMessage")?.remove();
}

/* =========================================================
   TEMPORARY FILE STORAGE
   ========================================================= */

function storeSelectedImage(file) {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        try {
            sessionStorage.setItem(
                "imagetools-selected-image",
                reader.result
            );

            sessionStorage.setItem(
                "imagetools-selected-image-name",
                file.name
            );

            sessionStorage.setItem(
                "imagetools-selected-image-type",
                file.type
            );

            sessionStorage.setItem(
                "imagetools-selected-image-size",
                String(file.size)
            );
        } catch (error) {
            console.warn(
                "The image could not be stored in sessionStorage.",
                error
            );
        }
    });

    reader.addEventListener("error", () => {
        console.warn("The selected image could not be read.");
    });

    reader.readAsDataURL(file);
}

function removeStoredImage() {
    sessionStorage.removeItem("imagetools-selected-image");
    sessionStorage.removeItem("imagetools-selected-image-name");
    sessionStorage.removeItem("imagetools-selected-image-type");
    sessionStorage.removeItem("imagetools-selected-image-size");
}

/* =========================================================
   FOOTER YEAR
   ========================================================= */

function initializeFooterYear() {
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }
}