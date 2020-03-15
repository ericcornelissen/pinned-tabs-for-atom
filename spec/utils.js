'use babel';

export function simulateClick(el) {
  let event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(event);
}
