function findAnswer(el) {
  while(el.innerText == '') {
    if (el.tagName == "BODY") throw "No text found in body at all."
    el = el.parentNode;
  }
  return el.innerText;
}
question_id = 0;
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
  if (!el.dataset.questionId) {
    el.style.outline = "3px dotted peachpuff";
    el.setAttribute('data-question-id',question_id);
  }
  return {
    id: question_id++,
    text: text
  }
}
function appendElement(results,question,answer) {
  for (var i=0; i<results.length;i++) {
    if (question.text == results[i].question) {
      results[i].answers.push(answer)
      return;
    }
  }
  results.push({
    id: question.id,
    question: question.text,
    answers: [answer]
  });
  return;
}

answerButtons = document.querySelectorAll('input[type="radio"]');
results = []; //initialize array of results

for (var i=0; i<answerButtons.length; i++) {
  answerButtons[i].setAttribute('data-answer-id',i)
  const answer = {
    id: i,
    text: findAnswer(answerButtons[i])
  }
  const question = findQuestion(answerButtons[i]);

  appendElement(results,question,answer);
}

/* RESULTS FORMAT
  [
    {
      id: int, //unique id for data-question-id
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
