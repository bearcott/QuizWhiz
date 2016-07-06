//start the script
prepareQuestions().then(runSearchGoogle);

//listen for results from google stream then start quizlet search
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
  if (!request.googleGold) return;

  chrome.tabs.remove(sender.tab.id); //dont need google search tab no more
  console.log('Google search results',request.googleGold);
  searchQuizlet(request.googleGold);
});

//dom interaction
function docSelector(query) {
  const obj = document.querySelectorAll(query);
  return {
    one : ()=>{
      return obj[0];
    },
    each : (callback)=> {
      for (var i=0;i<obj.length;i++)
        callback(obj[i]);
    }
  }
}

function status(message) {
  docSelector('.status').each((el)=>{
    el.innerText = message;
  });
  log(message);
}
function setStats(questions) {
  docSelector('.count').each((el)=>{
    el.innerText = questions.data.length;
  });
  docSelector('.complete').each((el)=>{
    el.innerText = questions.google_counter+1;
  });
  docSelector('.score').each((el)=>{
    el.innerText = questions.data.length;
  });
}
function log(text) {
  const node = document.createElement('p');
  node.innerHTML = text;
  const parent = docSelector('.log .content').one();
  parent.appendChild(node);
}
function setDOMCounter(count) {
  docSelector('.question_number').one().value = count;
}
function getDOMCounter() {
  docSelector('.question_number').one().blur();
  return docSelector('.question_number').one().value;
}
docSelector('.reset').one().onclick = function() {
  setDOMCounter(1);
}
