function getUrl() {
  return new Promise((res)=> {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      res(tabs[0].url);
    });
  })
}
function getQuestions() {
  return new Promise((res)=> {
    chrome.storage.local.get('questions',(items)=>{
      res(items.questions)
    });
  })
}
//grab the data questions and all from page and store
function prepareQuestions() {
  return executePrepareQuestionsScript().then(doPrepareQuestions)
}
function executePrepareQuestionsScript() {
  return new Promise((res)=>{
    console.log('Grabbing data and preparing page..');
    status('Grabbing data and preparing page..');
    chrome.tabs.executeScript({file:"prepare_questions.js"},(data)=>res(data));
  });
}
function doPrepareQuestions(data) {
  return new Promise((res)=>{
    getUrl().then((url)=> {
      chrome.storage.local.get('questions',(items)=>{
        if (items.questions.url && url !== items.questions.url)
          items.questions = {} //reset the object;
        items.questions.url = url;
        items.questions.data = data[0];
        chrome.storage.local.set({questions:items.questions});
        setStats(items.questions);
        res(items.questions);
      })
    });
  });
}
function runSearchGoogle(questions) {
  console.log(questions);
  var counter = parseInt(getDOMCounter());
  if (isNaN(counter))
    if (questions.google_counter)
      counter = questions.google_counter;
    else
      counter = 0;
  else
    if (questions.google_counter != counter)
      counter--;
    else
      counter;
  questionsObj = questions.data;

  if (counter > questionsObj.length) {
    console.log('\ndone bruh.');
    status('done bruh');
    return;
  }
  console.log(counter+'. Searching question: '+questionsObj[counter].question);
  status('Searching question '+(counter+1)+': '+questionsObj[counter].question);
  searchGoogle(questionsObj[counter]);
  questions.google_counter = counter;
  chrome.storage.local.set({questions:questions});
  return Promise.resolve(questions);
}
//lol
function incrementGoogleCounter(questions) {
  return new Promise((res)=> {
    setStats(questions)
    questions.google_counter++;
    setDOMCounter(questions.google_counter);
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
