chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (typeof request.answerId != 'undefined') {
    const buttons = document.querySelectorAll('input[type="radio"]');
    for (var i=0; i<buttons.length;i++)
      if (buttons[i].hasAttribute('data-answer-id') && buttons[i].dataset.answerId == request.answerId)
        buttons[i].click(); //CLICK THE BUTTON AND ANSWER IT BICH AEYE
  }
});
