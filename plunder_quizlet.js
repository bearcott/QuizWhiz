chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.gold) {
    sendResponse(searchForText(request.gold));
  }
});
function searchForText(gold) {
  var words = document.querySelectorAll('span');
  for (var i = 0; i<words.length;i++) {
    const alphanumGold = gold.keywords.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
    const alphanumWord = words[i].innerText.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
    if (alphanumWord.indexOf(alphanumGold) != -1) {
      return {
        question: words[i].innerText,
        answer: findAnswer(words[i])
      };
    }
  }
  return {
    question: false,
    answer: false
  }
}
function findAnswer(ore) {
  const rootOre = ore;
  while (ore.tagName !== "BODY") {
    ore = ore.parentNode;
    const answer = getAnswerInChildren(ore, rootOre);
    if (answer) return answer.innerText;
  }
  return false;
}
function getAnswerInChildren(ore, rootOre) {
  if (ore.children.length == 0)
    if (ore.tagName == "SPAN" && ore.innerText != rootOre.innerText)
      return ore;
    else
      return false;

  for (var i=0; i<ore.children.length; i++) {
    const answer = getAnswerInChildren(ore.children[i], rootOre);
    if (answer) return answer;
  }
}
