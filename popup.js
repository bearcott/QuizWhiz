function initializePage() {
  //insert styles
  chrome.tabs.insertCSS({
    file: "styles.css",
    // allFrames: true //all frames
  });
  //find questions using pattern of text->radio buttons
  grabQuestions();
}
var questionsObj;
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.gold)
    searchQuizlet(sender.tab.id, request.gold);
});

var COUNTER = 0;//lazylazylazylazy ://///////
function runSearchGoogle() {
  if (COUNTER > questionsObj.length) {
    alert('done bruh.')
    return;
  }
  searchGoogle(questionsObj[COUNTER++]);
}
function grabQuestions() {
  chrome.tabs.executeScript({file:"grab_questions.js"}, function(d) {
    questionsObj = d[0];
    runSearchGoogle();
  });
}
function searchGoogle(questionsObj) {
  // TODO: possibly a xss attack? double check bruh
  chrome.tabs.create({
    url:'https://www.google.com/#q=quizlet:'+questionsObj.question,
    active: false
  },(tab)=>{
    chrome.tabs.executeScript(tab.id,{
      file:"scout_google_links.js",
      allFrames: true,
      runAt:"document_idle"
    },()=>{
      chrome.tabs.sendMessage(tab.id, {question: questionsObj.question});
    });
  })
}
function searchQuizlet(id, gold) {
  chrome.tabs.remove(id); //dont need this tab no more
  chrome.tabs.create({
    url:gold.url,
    active: false
  },(tab)=>{
    chrome.tabs.executeScript(tab.id,{
      file:"plunder_quizlet.js",
      allFrames: true,
      runAt:"document_idle"
    },()=>{
      chrome.tabs.sendMessage(tab.id, {gold: gold}, function(response) {
        runSearchGoogle(); //DO THE NEXT QUESTION :DD
        if (!response.answer) {
          console.log('cant find answer on quizlet..');
          return;
        }
        chrome.tabs.remove(tab.id); //dont need this tab no more
        gold.answer = response.answer;
        recordEzPzAnswer(gold);
      });
    });
  });
}
function recordEzPzAnswer(gold) {
  console.log(gold.answer);
  //parse the right answer
  var question = gold.question;
  var answerId = null;
  for (var i=0; i<questionsObj.length;i++) {
    const currQuestion = questionsObj[i];
    if (currQuestion.question != question) continue;
    for (var j=0; j<currQuestion.answers.length;j++) {
      const answer = currQuestion.answers[j].text.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
      const correctAns = gold.answer.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
      if (answer.indexOf(correctAns) != -1 || correctAns.indexOf(answer) != -1)
        answerId = currQuestion.answers[j].id;
    }
  }
  if (!answerId) {
    console.log("cant find answer, answer from quizlet: "+gold.answer)
    return;
  }

  chrome.tabs.executeScript({file:"record_ezpz_answer.js"}, function(d) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id,{
        answerId: answerId
      });
    });
    //done!
  });
}

initializePage();
