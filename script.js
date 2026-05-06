// 1. Grab all the elements
// We use Array.from() to turn the Nodelist into a true Array, making it easier to find index numbers
const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');

// 2. State Management: Keep track of which image we are viewing
let currentIndex = 0;

// 3. Helper Function: Show a specific image based on its index number
function showLightboxImage(index) {
  // If we go past the last image, loop back to the first one (0)
  if (index >= galleryImages.length) {
    currentIndex = 0;
  } 
  // If we go backwards past the first image, loop to the very last one
  else if (index < 0) {
    currentIndex = galleryImages.length - 1;
  } 
  // Otherwise, just use the index provided
  else {
    currentIndex = index;
  }
  
  // Swap the source
  lightboxImg.src = galleryImages[currentIndex].src;
}

// 4. Open the lightbox when any gallery image is clicked
galleryImages.forEach((image, index) => {
  image.addEventListener('click', () => {
    showLightboxImage(index); // Show the specific image clicked
    lightbox.classList.add('active'); // Turn on the overlay
  });
});

// 5. Navigation Listeners
nextBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // STOPS the click from hitting the dark background
  showLightboxImage(currentIndex + 1);
});

prevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showLightboxImage(currentIndex - 1);
});

// 6. Close the lightbox
closeBtn.addEventListener('click', () => {
  lightbox.classList.remove('active');
});

lightbox.addEventListener('click', (e) => {
  // Only close if they clicked the dark background, not the image itself
  if (e.target !== lightboxImg && e.target !== prevBtn && e.target !== nextBtn) {
    lightbox.classList.remove('active');
  }
});

// --- SENIOR DEV TOUCH: Keyboard Support ---
document.addEventListener('keydown', (e) => {
  // Only listen for keys if the lightbox is actually open
  if (lightbox.classList.contains('active')) {
    if (e.key === 'ArrowRight') showLightboxImage(currentIndex + 1);
    if (e.key === 'ArrowLeft') showLightboxImage(currentIndex - 1);
    if (e.key === 'Escape') lightbox.classList.remove('active');
  }
});