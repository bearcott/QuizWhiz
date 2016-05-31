chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (typeof request.questionId != 'undefined') {
    console.log('wat');
    //lmao literally every element on the page xfxdxdxd
    const everything = document.querySelectorAll('*');
    for (var i=0; i<everything.length;i++) {
      if (everything[i].hasAttribute('data-question-id')) {
        console.log(everything[i].dataset.questionId, request.questionId);
      }
      if (everything[i].hasAttribute('data-question-id') && everything[i].dataset.questionId == request.questionId) {
        console.log('lmao');
        if (request.success)
          everything[i].style.outline = "3px dotted chartreuse";
        else
          everything[i].style.outline = "3px dotted crimson";
      }
    }
  }
});
