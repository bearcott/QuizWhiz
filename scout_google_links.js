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
//now find the best match by ranking them
//gold ore is always in the form of:
/*{
 *  url: string
 *  keywords: string
 *}
*/
function panTheGold(req) {
  const ore = document.body.querySelectorAll('h3 a');
  if (ore.length == 0) throw "no links found."
  const golds = [];
  for (var i=0; i<ore.length; i++) {
    const bolds = findBold(ore[i]);
    const keywords = findBestKeywords(bolds);
    console.log(bolds);
    const refinedOre = {
      url: ore[i].href,
      keywords: keywords
    }
    insertSorted(golds,refinedOre);
  }
  sendResponse({
    id: req.id,
    question: req.question,
    golds: golds
  });
}
function findBestKeywords(bolds) {
  var max = '';
  for (var i=0;i<bolds.length;i++)
    if (bolds[i].length > max.length)
      max = bolds[i];
  return max;
}
function insertSorted(golds,refinedOre) {
  if (golds.length == 0)
    golds.push(refinedOre);
  for (var i=0; i<golds.length;i++) {
    if (golds[i].keywords.length <= refinedOre.keywords.length) {
      golds = golds.splice(i,0,refinedOre);
      return;
    }
  }
}
function sendResponse(googleGold) {
  console.log(googleGold);
  chrome.runtime.sendMessage({googleGold: googleGold});
}
