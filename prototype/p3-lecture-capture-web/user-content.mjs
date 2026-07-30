const USER_CONTENT_CLASS = "user-content";

function preservedText(value) {
  return value == null ? "" : String(value);
}

export function setUserText(element, value) {
  if (!element || typeof element.setAttribute !== "function") {
    throw new TypeError("A text element is required");
  }
  const text = preservedText(value);
  element.textContent = text;
  element.setAttribute("dir", "auto");
  element.classList?.add(USER_CONTENT_CLASS);
  return text;
}

export function createUserTextElement(document, value, tagName = "span") {
  const element = document.createElement(tagName);
  setUserText(element, value);
  return element;
}
