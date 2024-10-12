export function getElementById<T extends HTMLElement>(elementId: string): T {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Missing required element with ID: ${elementId}`);
  }
  return element as T;
}
