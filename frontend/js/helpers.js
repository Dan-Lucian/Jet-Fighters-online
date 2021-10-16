export function showMessage(text) {
  const message = document.createElement('div');

  message.innerHTML = text;
  message.className = 'pop-up-message';
  document.body.append(message);

  requestAnimationFrame(() => message.classList.add('pop-up-message--fade-in'));
  setTimeout(() => {
    message.ontransitionend = () => message.remove();
    message.classList.remove('pop-up-message--fade-in');
  }, 2000);
}

export function isInputValid(inputValue, regexString) {
  const regex = new RegExp(regexString);
  if (inputValue.match(regex)) {
    return true;
  }
  return false;
}

export function loadImage(imageUrl) {
  const img = new Image();
  img.src = imageUrl;
  return img;
}

export function getRandomInt(min, max) {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}
