'use babel';

export function simulateClick(el) {
  let event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(event);
}

export function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
