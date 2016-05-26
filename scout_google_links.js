function findBold(ore) {
  while (ore.tagName !== "BODY") {
    ore = ore.parentNode;
    const bold = getBoldChildren(ore);
    if (bold) return bold;
  }
}
function getBoldChildren(ore) {
  if (ore.children.length == 0)
    return false;
  var bold = [];
  for (var i=0; i<ore.children.length; i++) {
    if (ore.children[i].tagName == "EM" || ore.children[i].tagName == "B")
      bold.push(ore.children[i].innerText);
    const children = getBoldChildren(ore.children[i])
    if (children) bold = bold.concat(children);
  }
  return (bold.length == 0) ? false : bold;
}
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.question) {
    waitDomReady(request);
  }
});
//to start, ensure the dom is loaded because chrome is weird..
//document_end and document_idle only sometimes work unless we do this.
function waitDomReady(req) {
  const waitDomReady = setInterval(function() {
    if (document.readyState !== "complete") return;
    else clearInterval(waitDomReady);

    document.body.style.border = '40px solid red'
    console.log('here');
    waitForOre(req);
  }, 10);
}
//now wait for the search results to show up. (once one shows up the rest will)
function waitForOre(req) {
  const wait = setInterval(function() {
    if (document.body.querySelectorAll('h3 a').length == 0) return;
    else clearInterval(wait);

    panTheGold(req);
  }, 10);
}
//now find the best match
function panTheGold(req) {
  const ore = document.body.querySelectorAll('h3 a');
  if (ore.length == 0) throw "no links found."
  var bestNode = ore[0];
  var keywords = '';
  for (var i=0; i<ore.length; i++) {
    const bold = findBold(ore[i]);
    for (var j=0; j<bold.length; j++) {
      if (bold[j].split(' ').length > keywords.split(' ').length) {
        keywords = bold[j];
        bestNode = ore[i];
        break;
      }
    }
  }
  sendResponse({
    question: req.question,
    keywords: keywords,
    url: bestNode.href
  });
}
function sendResponse(gold) {
  console.log(gold);
  chrome.runtime.sendMessage({gold: gold});
}
