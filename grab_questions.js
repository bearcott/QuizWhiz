function findAnswer(el) {
  while(el.innerText == '') {
    if (el.tagName == "BODY") throw "No text found in body at all."
    el = el.parentNode;
  }
  return el.innerText;
}
function findQuestion(el) {
  var text = "";
  var size = 0;
  var counter = 0;
  while (counter < 3) {
    el = el.parentNode;
    if (el.tagName == "BODY") throw "No text found in body at all."
    if (el.innerText !== '' && el.innerText.length > size) {
      if (counter == 2) //only filter out the last result
        text = el.innerText.replace(text,'');
      else
        text = el.innerText;
      size = el.innerText.length;
      counter++;
    }
  }
  return text;
}
function appendElement(results,question,answer,id) {
  for (var i=0; i<results.length;i++) {
    if (question == results[i].question) {
      results[i].answers.push({
        id: id,
        text: answer
      })
      return;
    }
  }
  results.push({
    question: question,
    answers: [{
      id: id,
      text: answer
    }]
  });
  return;
}

const answerButtons = document.querySelectorAll('input[type="radio"]');
var results = []; //initialize array of results

for (var i=0; i<answerButtons.length; i++) {
  answerButtons[i].setAttribute('data-answer-id',i)
  const answer = findAnswer(answerButtons[i]);
  const question = findQuestion(answerButtons[i]);
  appendElement(results,question,answer,i);
}

/* RESULTS FORMAT
  [
    {
      question: string,
      answers: [
        {
          id: int, //this is the unique number set to data-answer-id
          text: string
        }
      ],
    }
  ]
*/
console.log(results);
results;
