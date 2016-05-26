chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.gold) {
    const answer = searchForText(request.gold);
    sendResponse({answer: answer});
  }
});
function searchForText(gold) {
  var words = document.querySelectorAll('span');
  for (var i = 0; i<words.length;i++)
    if (words[i].innerText.indexOf(gold.keywords) != -1)
      return findAnswer(words[i]);
  return false;
}
function findAnswer(ore) {
  const rootOre = ore;
  while (ore.tagName !== "BODY") {
    ore = ore.parentNode;
    const answer = getAnswerInChildren(ore, rootOre);
    if (answer) return answer.innerText;
  }
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
