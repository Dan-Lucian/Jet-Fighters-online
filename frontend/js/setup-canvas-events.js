export function setupCanvasEvents() {
  const canvas = document.getElementById('canvas');

  canvas.addEventListener('click', onClick);
  function onClick() {
    console.log('canvas clicked');
  }
}
