export function showMessage(text) {
  const message = document.createElement('div');

  message.innerHTML = text;
  message.className = 'pop-up-message';
  document.body.append(message);

  setTimeout(() => message.classList.add('pop-up-message--fade-in'));
  setTimeout(() => {
    message.ontransitionend = () => message.remove();
    message.classList.remove('pop-up-message--fade-in');
  }, 1500);
}

export function isInputValid(inputValue, regexString) {
  const regex = new RegExp(regexString);
  if (inputValue.match(regex)) {
    return true;
  }
  return false;
}
