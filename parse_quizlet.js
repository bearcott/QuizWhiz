function searchQuizlet(googleGold, counter) {
  if (typeof counter == 'undefined') counter = 0;
  else counter++;
  console.log(counter);
  if (counter >= 5 || counter >= googleGold.golds.length) { //quit after fifth attempt or when shit goes up
    console.log('exhausted all searches. skipping to next question');
    counter = 0;
    flagQuestion(googleGold.id, false);
    getQuestions().then(runSearchGoogle).then(incrementGoogleCounter);
    return;
  }
  if (!googleGold.golds[counter]) {
    console.log(counter,googleGold);
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
        chrome.tabs.remove(tab.id); //dont need this tab no more
        handleQuizletResponse(response,googleGold,counter);
      });
    });
  });
}
function handleQuizletResponse(response,googleGold,counter) {
  console.log('quizlet search results, attempt: '+counter,response);
  log('quizlet search results, attempt: '+counter,response);
  if (response.answer == false) {
    //if answer didn't exist
    console.log('cant find answer in index '+counter+' search result, trying again.');
    searchQuizlet(googleGold,counter);
    return;
  }
  const unrefinedAns = response.answer.toUpperCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/gi, '');
  if (unrefinedAns.length == 0) {
    console.log('answer field is empty on quizlet, trying again.');
    searchQuizlet(googleGold,counter);
    return;
  }
  googleGold.answer = unrefinedAns;
  const answerId = checkChoices(googleGold);
  if (!answerId) {
    console.log('cant find choice on answer sheet, trying again.');
    searchQuizlet(googleGold,counter);
    return;
  }
  counter = 0;
  getQuestions().then(runSearchGoogle).then(incrementGoogleCounter); //DO THE NEXT QUESTION :DD
  console.log('got answer: '+googleGold.answer);
  log('got answer: '+googleGold.answer);
  flagQuestion(googleGold.id, true);
  recordEzPzAnswer(answerId);
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
    log("Can't bubble in the answer, Quizlet Says: "+gold.answer);
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
