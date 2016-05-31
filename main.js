function getUrl() {
  return new Promise((res)=> {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      res(tabs[0].url);
    });
  })
}
//grab the data questions and all from page and store
function prepareQuestions() {
  return new Promise((res)=>{
    console.log('Grabbing data and preparing page..');
    chrome.tabs.executeScript({file:"prepare_questions.js"}, function(data) {
      getUrl().then((url)=> {
        chrome.storage.local.get('questions',(items)=>{
          if (items.questions.url && url !== items.questions.url)
            items.questions = {} //reset the object;
          items.questions.url = url;
          items.questions.data = data[0];
          chrome.storage.local.set({questions:items.questions});
          res(items.questions);
        })
      });
    });
  });
}
function runSearchGoogle(questions) {
  console.log(questions);
  return new Promise((res)=> {
    var counter = 0;
    if (questions.google_counter) counter = questions.google_counter;
    questionsObj = questions.data;

    if (counter >= questionsObj.length) {
      console.log('\ndone bruh.');
      return;
    }
    console.log(counter+'. Searching question: '+questionsObj[counter].question);
    searchGoogle(questionsObj[counter++]);
    questions.google_counter = counter;
    chrome.storage.local.set({questions:questions});
    res(questions);
  })
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
      chrome.tabs.sendMessage(tab.id, {
        id: questionsObj.id,
        question: questionsObj.question
      });
    });
  })
}
//listen for the google result
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
    flagQuestion(googleGold.id, false);
    // runSearchGoogle();
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
        // runSearchGoogle(); //DO THE NEXT QUESTION :DD
        console.log('got answer: '+googleGold.answer);
        flagQuestion(googleGold.id, true);
        recordEzPzAnswer(answerId);
      });
    });
  });
}
function checkChoices(gold) {
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
function flagQuestion(questionId, success) {
  chrome.tabs.executeScript({file:"mark_question.js", allFrames: true}, function(d) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('PLS!');
      chrome.tabs.sendMessage(tabs[0].id,{
        questionId: questionId,
        success: success
      });
    });
  });
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

prepareQuestions().then(runSearchGoogle);
