import { destinations, routeFromHash, routeHash } from "./routes.mjs";
import { destinationView } from "./views.mjs";

const mainContent = document.querySelector("#main-content");
const routeLabel = document.querySelector("#route-label");
const navigationRegions = [...document.querySelectorAll("[data-navigation]")];

function navigationLink(destination) {
  return `<a class="navigation-item" href="${routeHash(destination.id)}" data-route="${destination.id}">
    <span class="navigation-glyph" aria-hidden="true">${destination.glyph}</span>
    <span>${destination.label}</span>
  </a>`;
}

function renderNavigation() {
  const navigationMarkup = destinations.map(navigationLink).join("");
  for (const navigation of navigationRegions) navigation.innerHTML = navigationMarkup;
}

function updateSelectedDestination(destinationId) {
  for (const link of document.querySelectorAll("[data-route]")) {
    const isCurrent = link.dataset.route === destinationId;
    link.classList.toggle("is-selected", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function renderRoute({ focusHeading = false } = {}) {
  const destination = routeFromHash(window.location.hash);
  mainContent.innerHTML = destinationView(destination.id);
  routeLabel.textContent = destination.label;
  document.title = `${destination.label} — Studio5`;
  updateSelectedDestination(destination.id);
  if (focusHeading) mainContent.querySelector("h1")?.focus();
}

function focusAdjacentLink(event) {
  const activeLink = event.target.closest("[data-route]");
  if (!activeLink) return;
  const links = [...event.currentTarget.querySelectorAll("[data-route]")];
  const currentIndex = links.indexOf(activeLink);
  const indexByKey = {
    ArrowDown: (currentIndex + 1) % links.length,
    ArrowRight: (currentIndex + 1) % links.length,
    ArrowUp: (currentIndex - 1 + links.length) % links.length,
    ArrowLeft: (currentIndex - 1 + links.length) % links.length,
    Home: 0,
    End: links.length - 1,
  };
  if (!(event.key in indexByKey)) return;
  event.preventDefault();
  links[indexByKey[event.key]].focus();
}

renderNavigation();
for (const navigation of navigationRegions) navigation.addEventListener("keydown", focusAdjacentLink);

if (!window.location.hash) history.replaceState(null, "", routeHash("today"));
renderRoute();
window.addEventListener("hashchange", () => renderRoute({ focusHeading: true }));
