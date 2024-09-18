
// https://stackoverflow.com/a/13382873
const getScrollbarWidth = () => {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
};


const scrollbarVisible = (element: HTMLElement) => (
  element.scrollHeight > element.clientHeight
);


// from https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/

let counter = 0;

export const unBlockedBody = () => {
  counter -= 1;

  if (counter) return;
  const { style } = document.body;
  style.paddingRight = '';
  style.overflow = '';
  style.backgroundColor = '';
};

export const blockedBody = () => {
  counter += 1;

  if (counter === 1) {
    const { style } = document.body;

    if (scrollbarVisible(document.body)) {
      const width = getScrollbarWidth();
      style.paddingRight = `${width}px`;
      style.backgroundColor = '#f1f4fc'; // 'whitesmoke';
    }

    style.overflow = 'hidden';
  }

  return () => unBlockedBody();
};
