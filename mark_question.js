chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (typeof request.questionId != 'undefined') {
    //lmao literally every element on the page xfxdxdxd
    const everything = document.querySelectorAll('*');
    for (var i=0; i<everything.length;i++) {
      if (everything[i].hasAttribute('data-question-id') && everything[i].dataset.questionId == request.questionId) {
        if (request.success)
          everything[i].style.outline = "3px dotted springgreen";
        else
          everything[i].style.outline = "3px dotted tomato";
      }
    }
  }
});
