export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

/**
 * Get max scroll top for given container
 * @param container {element|Window}
 * @returns {number}
 */
export function getMaxScrollTop(container: HTMLElement | Window = window): number {
  if (container instanceof Window) return document.body.offsetHeight - window.innerHeight;
  return container.scrollHeight - container.clientHeight;
}
