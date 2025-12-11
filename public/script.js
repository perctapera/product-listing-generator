// DOM Elements
const descInput = document.getElementById("descriptionInput");
const charCount = document.getElementById("charCount");
const generateBtn = document.getElementById("generateBtn");
const generateImageBtn = document.getElementById("generateImageBtn");
const generateVideoBtn = document.getElementById("generateVideoBtn");
const statusEl = document.getElementById("status");
const statusIcon = document.getElementById("status-icon");
const modelSelect = document.getElementById("modelSelect");
const imageModelSelect = document.getElementById("imageModelSelect");
const videoModelSelect = document.getElementById("videoModelSelect");

const titleOutput = document.getElementById("titleOutput");
const tagsOutput = document.getElementById("tagsOutput");
const descriptionOutput = document.getElementById("descriptionOutput");

const imageEl = document.getElementById("generatedImage");
const imageContainer = document.getElementById("imageContainer");
const imagePlaceholder = imageContainer.querySelector(".media-placeholder");
const downloadImageBtn = document.getElementById("downloadImageBtn");

const videoEl = document.getElementById("generatedVideo");
const videoContainer = document.getElementById("videoContainer");
const videoPlaceholder = videoContainer.querySelector(".media-placeholder");
const downloadVideoBtn = document.getElementById("downloadVideoBtn");

// Character count functionality
descInput.addEventListener("input", () => {
  const count = descInput.value.length;
  charCount.textContent = count;
});

// Show loading state
function showLoading(message) {
  statusEl.textContent = message;
  statusIcon.classList.remove("hidden");
}

// Hide loading state
function hideLoading(message) {
  statusEl.textContent = message || "";
  statusIcon.classList.add("hidden");
}

// Generate all content
generateBtn.addEventListener("click", async () => {
  const description = descInput.value.trim();
  if (!description) {
    statusEl.textContent = "Please paste a product description first.";
    return;
  }

  generateBtn.disabled = true;
  showLoading("Generating title, tags, and description...");

  titleOutput.textContent = "";
  tagsOutput.textContent = "";
  descriptionOutput.textContent = "";

  try {
    const selectedModel = modelSelect.value;
    
    const res = await fetch("/api/generate-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        description,
        model: selectedModel
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      hideLoading("Error: " + (err.error || res.statusText));
      return;
    }

    const data = await res.json();

    titleOutput.textContent = data.title || "";
    tagsOutput.textContent = (data.tags || []).join(", ");
    descriptionOutput.textContent = data.description || "";

    hideLoading("Text generation complete! ✓");
  } catch (error) {
    console.error(error);
    hideLoading("Network or server error during text generation.");
  } finally {
    generateBtn.disabled = false;
  }
});

// Generate image
generateImageBtn.addEventListener("click", async () => {
  const description = descInput.value.trim();
  if (!description) {
    statusEl.textContent = "Please paste a product description first.";
    return;
  }

  generateImageBtn.disabled = true;
  showLoading("Generating image...");

  // Reset image view
  if (imagePlaceholder) imagePlaceholder.style.display = "block";
  imageEl.style.display = "none";
  imageEl.src = "";
  downloadImageBtn.disabled = true;

  try {
    const selectedImageModel = imageModelSelect.value;
    
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        description,
        model: selectedImageModel
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      hideLoading("Error: " + (err.error || res.statusText));
      generateImageBtn.disabled = false;
      return;
    }

    const data = await res.json();
    if (!data.imageUrl) {
      hideLoading("No image URL returned.");
      generateImageBtn.disabled = false;
      return;
    }

    // Show image
    if (imagePlaceholder) imagePlaceholder.style.display = "none";
    imageEl.src = data.imageUrl;
    imageEl.style.display = "block";

    // Enable download button
    downloadImageBtn.disabled = false;
    downloadImageBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = data.imageUrl;
      a.download = "generated-product-image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    hideLoading("Image generation complete! ✓");
  } catch (error) {
    console.error(error);
    hideLoading("Network or server error during image generation.");
  } finally {
    generateImageBtn.disabled = false;
  }
});

// Generate video
generateVideoBtn.addEventListener("click", async () => {
  const description = descInput.value.trim();
  if (!description) {
    statusEl.textContent = "Please paste a product description first.";
    return;
  }

  generateVideoBtn.disabled = true;
  showLoading("Generating video... This may take a minute or two.");

  // Reset video view
  if (videoPlaceholder) videoPlaceholder.style.display = "block";
  videoEl.style.display = "none";
  videoEl.src = "";
  downloadVideoBtn.disabled = true;

  try {
    const selectedVideoModel = videoModelSelect.value;
    
    const res = await fetch("/api/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        description,
        model: selectedVideoModel
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      hideLoading("Error: " + (err.error || res.statusText));
      generateVideoBtn.disabled = false;
      return;
    }

    const data = await res.json();
    if (!data.videoUrl) {
      hideLoading("No video URL returned.");
      generateVideoBtn.disabled = false;
      return;
    }

    // Show video
    if (videoPlaceholder) videoPlaceholder.style.display = "none";
    videoEl.src = data.videoUrl;
    videoEl.style.display = "block";

    // Enable download button
    downloadVideoBtn.disabled = false;
    downloadVideoBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = data.videoUrl;
      a.download = "generated-product-video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    hideLoading("Video generation complete! ✓");
  } catch (error) {
    console.error(error);
    hideLoading("Network or server error during video generation.");
  } finally {
    generateVideoBtn.disabled = false;
  }
});

// Copy buttons
document.querySelectorAll(".copy-btn").forEach((btn) => {
  // skip download buttons which also have copy-btn class
  if (btn.id === "downloadImageBtn" || btn.id === "downloadVideoBtn") return;

  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const el = document.getElementById(targetId);
    const text = el.textContent || "";
    if (!text.trim()) return;

    navigator.clipboard.writeText(text).then(
      () => {
        const oldHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => (btn.innerHTML = oldHTML), 1500);
      },
      () => {
        alert("Failed to copy.");
      }
    );
  });
});
