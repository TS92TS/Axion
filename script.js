/* ============================================
   INVENTORY PAGE ENGINE
   ============================================ */

// Master entries array — built once from cars.js, never mutated
let inventoryEntries = [];

// Current filter and sort selections
const inventoryState = {
  make: "all",
  fuelType: "all",
  sort: "featured",
};

function initializeInventoryPage() {
  // Pre-process each car: extract display values and numeric
  // equivalents for sorting, all in one pass
  inventoryEntries = Object.entries(cars).map(([id, car]) => ({
    id,
    car,
    fuelType:
      car.specs.engine.find((s) => s.label === "Fuel Type")?.value ?? "—",
    transmission:
      car.specs.drivetrain.find((s) => s.label === "Transmission")?.value ??
      "—",
    priceValue: parseFloat(car.price.replace(/[^0-9.]/g, "")),
    mileageValue: parseFloat(car.mileage.replace(/[^0-9.]/g, "")),
  }));

  buildFilterPills();
  bindSortControl();
  bindClearFilters();
  applyFiltersAndSort();
}

/* --- Filter pills (Make + Fuel Type) --- */

function buildFilterPills() {
  // Filter options derived from data — adding a new make or fuel type
  // to cars.js automatically populates them here
  const makes = [...new Set(inventoryEntries.map((e) => e.car.make))];
  const fuelTypes = [...new Set(inventoryEntries.map((e) => e.fuelType))];

  document.getElementById("filter-make").innerHTML = renderPills(
    "make",
    "All Makes",
    makes,
  );
  document.getElementById("filter-fuel").innerHTML = renderPills(
    "fuel",
    "All Fuels",
    fuelTypes,
  );

  // Single delegated listener handles all filter button clicks
  document.querySelectorAll(".filter-options").forEach((group) => {
    group.addEventListener("click", handleFilterClick);
  });
}

function renderPills(kind, allLabel, options) {
  return `
    <button class="filter-btn" role="radio" aria-checked="true"  data-${kind}="all">${allLabel}</button>
    ${options
      .map(
        (opt) =>
          `<button class="filter-btn" role="radio" aria-checked="false" data-${kind}="${opt}">${opt}</button>`,
      )
      .join("")}
  `;
}

function handleFilterClick(e) {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;

  const group = btn.parentElement;
  const kind = btn.dataset.make !== undefined ? "make" : "fuel";
  const value = btn.dataset[kind];

  // Update visual + ARIA state across the group
  group
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.setAttribute("aria-checked", "false"));
  btn.setAttribute("aria-checked", "true");

  // Update internal state — note: data-fuel maps to inventoryState.fuelType
  if (kind === "make") inventoryState.make = value;
  if (kind === "fuel") inventoryState.fuelType = value;

  applyFiltersAndSort();
}

/* --- Sort dropdown --- */

function bindSortControl() {
  const select = document.getElementById("sort-select");
  select.value = inventoryState.sort;
  select.addEventListener("change", () => {
    inventoryState.sort = select.value;
    applyFiltersAndSort();
  });
}

/* --- Clear filters --- */

function bindClearFilters() {
  document
    .getElementById("clear-filters")
    .addEventListener("click", resetFilters);
}

function resetFilters() {
  inventoryState.make = "all";
  inventoryState.fuelType = "all";
  inventoryState.sort = "featured";

  // Reset all filter pill states
  document.querySelectorAll(".filter-options").forEach((group) => {
    group.querySelectorAll(".filter-btn").forEach((btn) => {
      const isAllPill =
        btn.dataset.make === "all" || btn.dataset.fuel === "all";
      btn.setAttribute("aria-checked", isAllPill ? "true" : "false");
    });
  });

  document.getElementById("sort-select").value = "featured";

  applyFiltersAndSort();
}

/* --- Filtering, sorting, rendering --- */

function applyFiltersAndSort() {
  let results = [...inventoryEntries];

  if (inventoryState.make !== "all") {
    results = results.filter((e) => e.car.make === inventoryState.make);
  }
  if (inventoryState.fuelType !== "all") {
    results = results.filter((e) => e.fuelType === inventoryState.fuelType);
  }

  const sorters = {
    "price-asc": (a, b) => a.priceValue - b.priceValue,
    "price-desc": (a, b) => b.priceValue - a.priceValue,
    "year-desc": (a, b) => b.car.year - a.car.year,
    "mileage-asc": (a, b) => a.mileageValue - b.mileageValue,
  };
  if (sorters[inventoryState.sort]) {
    results.sort(sorters[inventoryState.sort]);
  }

  renderCards(results);
  updateResultCount(results.length, inventoryEntries.length);
  updateClearVisibility();
}

function renderCards(entries) {
  const container = document.getElementById("inventory-container");

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="inventory-empty">
        <p class="inventory-empty__text">No vehicles match the current filters.</p>
        <button class="btn btn--secondary" type="button" id="empty-reset">
          Clear Filters
        </button>
      </div>`;
    document
      .getElementById("empty-reset")
      .addEventListener("click", resetFilters);
    return;
  }

  container.innerHTML = entries
    .map(
      ({ id, car, fuelType, transmission }) => `
      <article class="car-feature">
        <figure class="car-image">
          <img
            class="large-image"
            src="${car.heroImage}"
            alt="${car.year} ${car.make} ${car.model}"
            loading="lazy"
          />
        </figure>
        <h3>${car.make} ${car.model}</h3>
        <ul class="car-specs">
          <li><span>Year</span>${car.year}</li>
          <li><span>Mileage</span>${car.mileage}</li>
          <li><span>Fuel Type</span>${fuelType}</li>
          <li><span>Transmission</span>${transmission}</li>
          <li><span>Price</span>${car.price}</li>
        </ul>
        <a href="./details.html?car=${id}" class="btn btn--elevated btn--block">View Details</a>
      </article>`,
    )
    .join("");
}

function updateResultCount(visible, total) {
  const noun = total === 1 ? "vehicle" : "vehicles";
  const text =
    visible === total
      ? `${total} ${noun}`
      : `Showing ${visible} of ${total} ${noun}`;
  document.getElementById("result-count-text").textContent = text;
}

function updateClearVisibility() {
  const isFiltered =
    inventoryState.make !== "all" ||
    inventoryState.fuelType !== "all" ||
    inventoryState.sort !== "featured";
  document.getElementById("clear-filters").hidden = !isFiltered;
}

/* ============================================
   DYNAMIC DETAILS PAGE ENGINE
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();

  if (document.getElementById("dynamic-model") !== null) {
    initializeDetailsPage();
  } else if (document.getElementById("inventory-container") !== null) {
    initializeInventoryPage();
  }
});

/* ============================================
   MOBILE NAVIGATION TOGGLE
   ============================================ */

function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  if (!toggle) return;

  const header = toggle.closest(".site-nav");
  const nav    = document.getElementById("nav-menu");

  function openNav() {
    header.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
  }

  function closeNav() {
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  }

  // Toggle on button click
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle.getAttribute("aria-expanded") === "true" ? closeNav() : openNav();
  });

  // Close when a nav link is selected
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeNav);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) closeNav();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });
}

function injectSpecs(elementId, specsArray) {
  const container = document.getElementById(elementId);
  if (!container || !specsArray) return;

  container.innerHTML = specsArray
    .map(
      ({ label, value }) => `
      <div class="spec-row">
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>`,
    )
    .join("");
}

function initializeDetailsPage() {
  const carId = new URLSearchParams(window.location.search).get("car");

  if (!carId || !cars[carId]) {
    window.location.href = "./inventory.html";
    return;
  }

  const car = cars[carId];

  document.getElementById("dynamic-make").textContent = car.make;
  document.getElementById("dynamic-model").textContent = car.model;
  document.getElementById("dynamic-price").textContent = car.price;
  document.getElementById("dynamic-desc-heading").innerHTML =
    `About this <em>${car.year} ${car.make} ${car.model}</em>`;
  document.getElementById("dynamic-desc-text").textContent = car.description;
  document.getElementById("dynamic-form-lead").textContent =
    `Register your interest in the ${car.make} ${car.model}. A dedicated advisor will be in touch shortly.`;

  // Responsive hero image — swap in mobile-optimised crop on smaller viewports
  const heroSection = document.getElementById("dynamic-hero-section");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  function updateHeroBackground() {
    const useMobile = mobileQuery.matches && car.heroImageMobile;
    const imageToUse = useMobile ? car.heroImageMobile : car.heroImage;
    heroSection.style.backgroundImage = `
    linear-gradient(to top, var(--color-bg-base) 0%, transparent 80%),
    url('${imageToUse}')
  `;
  }

  updateHeroBackground();
  mobileQuery.addEventListener("change", updateHeroBackground);

  // Gallery
  document.getElementById("dynamic-gallery").innerHTML = car.gallery
    .map(
      ({ src, alt, isFeatured }) => `
      <figure class="gallery-item${isFeatured ? " gallery-item--featured" : ""}">
        <img src="${src}" alt="${alt}" loading="lazy" />
      </figure>`,
    )
    .join("");

  // Highlights bar
  document.getElementById("dynamic-highlights").innerHTML = car.highlights
    .map(
      ({ label, value }) =>
        `<p class="spec-highlight"><span>${label}</span>${value}</p>`,
    )
    .join("");

  // Spec accordion sections
  [
    "performance",
    "drivetrain",
    "engine",
    "features",
    "configuration",
    "other",
  ].forEach((section) => injectSpecs(`spec-${section}`, car.specs[section]));

  initLightbox();
}

/*=======
 Why-item mobile fix
=======*/

document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.why-item');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          'is-focused',
          entry.isIntersecting
        );
      });
    },
    {
      root: null,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    }
  );

  items.forEach((item) => observer.observe(item));
});

/* ============================================
   LIGHTBOX
   ============================================ */

function initLightbox() {
  const galleryImages = [...document.querySelectorAll(".gallery-item img")];
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  let currentIndex = 0;

  function showImage(index) {
    // Wraps cleanly in both directions without branching
    currentIndex =
      ((index % galleryImages.length) + galleryImages.length) %
      galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
  }

  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add("active");
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  // Open on gallery image click
  galleryImages.forEach((img, i) => {
    img.addEventListener("click", () => openLightbox(i));
  });

  // Navigation
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex + 1);
  });
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showImage(currentIndex - 1);
  });

  // Close triggers
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (
      e.target !== lightboxImg &&
      e.target !== prevBtn &&
      e.target !== nextBtn
    ) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    const actions = {
      ArrowRight: () => showImage(currentIndex + 1),
      ArrowLeft: () => showImage(currentIndex - 1),
      Escape: closeLightbox,
    };
    actions[e.key]?.();
  });
}