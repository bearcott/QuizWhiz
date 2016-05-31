function initializePage() {
  //insert styles
  // chrome.tabs.insertCSS({
  //   file: "styles.css",
  //   // allFrames: true //all frames
  // });
  //find questions using pattern of text->radio buttons
  grabQuestions();
}
var questionsObj;
function grabQuestions() {
  chrome.tabs.executeScript({file:"grab_questions.js"}, function(d) {
    questionsObj = d[0];
    console.log(d[0]);
    runSearchGoogle();
  });
}
var COUNTER = 0;//lazylazylazylazy ://///////
function runSearchGoogle() {
  if (COUNTER >= questionsObj.length) {
    console.log('\ndone bruh.');
    return;
  }
  console.log(COUNTER+'. Searching question: '+questionsObj[COUNTER].question);
  searchGoogle(questionsObj[COUNTER++]);
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
chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
  if (request.googleGold) {
    chrome.tabs.remove(sender.tab.id); //dont need google search tab no more
    console.log('Google search results',request.googleGold);
    runSearchQuizlet(request.googleGold);
  }
});
var QUIZLET_COUNTER = 0;//lazylazylazylazy ://///////
function runSearchQuizlet(googleGold) {
  if (QUIZLET_COUNTER >= 5 || QUIZLET_COUNTER >= googleGold.golds.length) { //quit after fifth attempt or when shit goes up
    console.log('exhausted all searches. skipping to next question');
    QUIZLET_COUNTER = 0;
    runSearchGoogle();
    return;
  }
  searchQuizlet(googleGold, QUIZLET_COUNTER++);
}
function searchQuizlet(googleGold, counter) {
  if (!googleGold.golds[counter]) {
    console.log(counter);
    throw "google search query not found"
  }
  chrome.tabs.create({
    url:googleGold.golds[counter].url,
    active: false
  },(tab)=>{
    chrome.tabs.executeScript(tab.id,{
      file:"plunder_quizlet.js",
      allFrames: true,
      runAt:"document_idle"
    },()=>{
      chrome.tabs.sendMessage(tab.id, {gold: googleGold.golds[counter]}, function(response) {
        console.log('quizlet search results, attempt: '+counter,response);
        chrome.tabs.remove(tab.id); //dont need this tab no more
        if (response.answer == false) {
          //if answer didn't exist
          console.log('cant find answer in index '+counter+' search result, trying again.');
          runSearchQuizlet(googleGold);
          return;
        }
        const unrefinedAns = response.answer.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
        if (unrefinedAns.length == 0) {
          console.log('answer field is empty on quizlet, trying again.');
          runSearchQuizlet(googleGold);
          return;
        }
        googleGold.answer = unrefinedAns;
        const answerId = checkChoices(googleGold);
        if (!answerId) {
          console.log('cant find choice on answer sheet, trying again.');
          runSearchQuizlet(googleGold);
          return;
        }
        QUIZLET_COUNTER = 0;
        runSearchGoogle(); //DO THE NEXT QUESTION :DD
        recordEzPzAnswer(answerId);
      });
    });
  });
}
function checkChoices(gold) {
  console.log(gold.answer);
  //parse the right answer
  var question = gold.question;
  var answerId = null;
  const lengthPercent = 0.5; //answer length threshold
  for (var i=0; i<questionsObj.length;i++) { // dumb way to find the current qestion again
    const currQuestion = questionsObj[i];
    if (currQuestion.question != question) continue;
    for (var j=0; j<currQuestion.answers.length;j++) {
      const answer = currQuestion.answers[j].text.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
      //if the answer lengths are too different
      if (answer.length/gold.answer.length < lengthPercent || gold.answer.length/answer.length < lengthPercent)
        continue;
      //if u cant find one answer in the other and vice versa
      if (answer.indexOf(gold.answer) == -1 && gold.answer.indexOf(answer) == -1)
        continue;
      answerId = currQuestion.answers[j].id;
    }
  }
  if (!answerId) {
    console.log("Can't bubble in the answer, Quizlet Says: "+gold.answer);
    return false;
  }
  return answerId;
}
function recordEzPzAnswer(answerId) {
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
