export function renderMessage(text) {
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

// transition from display none and opacity 0
// to display block and opacity 1 with proper animation
// function handleCLick(e) {
//   const { x, y, width, height } = e.target.getBoundingClientRect();

//   const xPopup = x;
//   const yPopup = y + height;

//   element.style.top = `${yPopup}px`;
//   element.style.left = `${xPopup}px`;

//   if (element.classList.contains('fade')) {
//     element.ontransitionend = () => {
//       element.classList.remove('block');
//     };
//   } else {
//     element.ontransitionend = null;
//     element.classList.add('block');
//   }

//   requestAnimationFrame(() => {
//     element.classList.toggle('fade');
//   });
// }
