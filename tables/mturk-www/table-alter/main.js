$(function() {
  var VERSION = "5.2";
  
  $('#content').html(['<div id=webpage class=column>&nbsp;</div>',
    '<div id=wrapper class=column>',
    '<div id=instruction>',
    '<div id=hidingInstruction class=hidden><button type=button class=floatButton id=showInstructionButton>Show Instructions</button></div>',
    '<div id=showingInstruction>',
    '<h2>Task: Answer the question using the information from the table.</h2>',
    '<button type=button class=floatButton id=hideInstructionButton disabled>Loading ...</button>',
    '<ul>',
      '<li>The tables were generated by shuffling the cells in some original table. Assume that each table presents data from a fictional world.</li>',
      '<li>As such, some questions may sound a little strange (e.g., asking for <em>the city</em> but many cities fit the criteria). Please answer according to the intent of the question.</li>',
      '<li>If the question really cannot be answered (e.g., when the main entity in the question is missing from the table, or when the table does not make sense), briefly describe the reason in the <strong>second box</strong> and leave the answer box blank.</li>',
      '<li>We <strong>manually</strong> review the answers and check some of the answers with the gold standard. We use answers from other workers to detect suspicious submissions, but will not reject your work as long as it correctly follows the instructions.</li>',
    '</ul>',
    '<h2>Answer Format</h2>',
    '<ul>',
      '<li>If the answer appears in the table, please <strong>copy and paste</strong> to avoid typos.</li>',
      '<li><strong>Do not</strong> add punctuation marks or elaboration to the answers: use <span class=whitebox>Paris</span> instead of <span class=redbox>Paris.</span> or <span class=redbox>Paris because it is in France</span>.</li>',
      '<li>If the answer is a <strong>number</strong>, please enter the number directly (e.g., <span class=whitebox>13</span>). <strong>Do not</strong> spell out the number (e.g., <span class=redbox>thirteen</span>), except when it is a <a target=_blank href="https://en.wikipedia.org/wiki/Thirteen_%282003_film%29">name</a>.</li>',
      '<li>If the answer is a <strong>list</strong> or has <strong>multiple parts</strong>, use multiple lines with <strong>one answer per line</strong> (e.g., <span class=whitebox>Paris</span> <kbd>Enter</kbd> <span class=whitebox>Madrid</span>, not <span class=redbox>Paris and Madrid</span>).</li>',
    '</ul>',
    '<h2>Tools</h2>',
    '<ul>',
      '<li><strong><kbd>Ctrl</kbd> (or <kbd>&#8984;</kbd>) + click on a table cell:</strong> copy cell content to the answer box.</li>',
      '<li><strong>Hold <kbd>Shift</kbd> + paint on table cells:</strong> highlight cells and display statistics in the box above.</li>',
      '<li><strong>Click on table header:</strong> sort the table by that column. (Note: does not work well on dates.)</li>',
    '</ul>',
    '<p><em>If you have any problems or suggestions, please leave a comment or <a href="mailto:percyliangmturk@gmail.com?subject=%5BMTurk%5D%20table-alter" id=email>contact us</a>.</em></p>',
    '</div></div>',
    '<div id=warning>Preview Mode<br>Please accept the HIT to start working.</div>',
    '<div id=answerForm><div id=questionWrapper>&nbsp;</div>',
    '<div id=navbar class=centerize>',
    '<input type=hidden id=assignmentId name=assignmentId>',
    '<button id=prevButton type=button>Previous</button> <span id=qNum>&nbsp;</span> <button id=nextButton type=button>Next</button> ',
    '<button id=submitButton type=button class=hidden disabled><strong>Submit</strong></button>',
    '</div>',
    '<div id=usedReasons class=hidden><p>Used reasons (<kbd>Ctrl</kbd> + click to copy):</p><ul></ul></div>',
    '<p id=incompleteWarning class="red hidden"><strong>Error:</strong> Please answer all questions (Missing question <span id=missingQuestions>&nbsp;</span>)</p>',
    '</div></div>'].join(''));

  var questionDivs = [], tableDivs = [], formElements = [], currentQuestion = 0;

  ////////////////////////////////////////////////////////////////
  // Form submission

  function clean(text, cleanNewlines) {
    var answer = [];
    text.split(/\n/).forEach(function (x) {
      x = x.replace(/\s+/g, ' ').replace(/^ | $/g, '');
      if (x.length) answer.push(x);
    });
    return answer.join(cleanNewlines ? " " : "\n");
  }

  var iWillSubmit = false;

  $('#submitButton').click(function () {
    iWillSubmit = true;
    $('#submitButton').closest('form').submit();
  });
  
  $('#submitButton').keyup(function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13 || keyCode === 32) {
      iWillSubmit = true;
      $('#submitButton').closest('form').submit();
    }
  });

  $('#submitButton').closest('form').submit(function() {
    if (!iWillSubmit) return false;
    // Check if all text fields are filled.
    var missingQuestions = [];
    for (var i = 0; i < questionDivs.length; i++) {
      var a = formElements[i].a, b = formElements[i].b;
      a.val(clean(a.val()));
      b.val(clean(b.val(), true));
      if ((!a.prop('disabled') && !a.val().length) ||
          (!b.prop('disabled') && !b.val().length)) {
        missingQuestions.push(i + 1);
      }
    }
    if (!missingQuestions.length) {
      $('#incompleteWarning').hide();
      $('#submitButton').prop('disabled', true);
      return true;
    } else {
      $('#missingQuestions').text(missingQuestions.join(', '));
      $('#incompleteWarning').show();
      return false;
    }
  });

  function gatherUsedReasons() {
    $('#usedReasons').hide();
    $('#usedReasons ul').empty();
    for (var i = 0; i < questionDivs.length; i++) {
      var b = formElements[i].b;
      if (!b.prop('disabled')) {
        b.val(clean(b.val(), true));
        var reason = b.val(), used = false;
        if (!reason.length) continue;
        $('#usedReasons ul li').each(function (_, x) {
          if ($(x).text() === reason) { used = true; return false; }
        });
        if (!used) {
          $('#usedReasons').show();
          $('<li>').text(reason).appendTo('#usedReasons ul')
            .click(function (event) {
              if (!event.ctrlKey) return;
              formElements[currentQuestion].cb.click();
              var reasonBox = formElements[currentQuestion].b;
              reasonBox.val(clean(reasonBox.val() + ' ' + $(this).text()));
            });
        }
      }
    }

  }

  ////////////////////////////////////////////////////////////////
  // Instructions

  function toggleInstructions(state) {
    $("#showingInstruction").toggle(!!state);
    $("#hidingInstruction").toggle(!state);
  }

  $("#showInstructionButton").click(function () {
    toggleInstructions(true);
  });

  $("#hideInstructionButton").click(function () {
    toggleInstructions(false);
  });

  ////////////////////////////////////////////////////////////////
  // Navigation

  function goToQuestion(questionNum) {
    $('.question, .table').hide();
    questionDivs[questionNum].show();
    tableDivs[questionNum].show();
    $('html, body').scrollTop(0);
    $('#qNum').text('' + (questionNum + 1) + ' / ' + questionDivs.length);
    $('#prevButton').prop('disabled', questionNum === 0);
    $('#nextButton').toggle(questionNum !== questionDivs.length - 1);
    $('#submitButton').toggle(questionNum === questionDivs.length - 1);
    currentQuestion = questionNum;
    $('#qNum').trigger('questionChanged');
    var a = formElements[currentQuestion].a, b = formElements[currentQuestion].b;
    if (!a.prop('disabled')) a.focus();
    if (!b.prop('disabled')) b.focus();
    gatherUsedReasons();
  }

  $('#prevButton').click(function () {
    goToQuestion(currentQuestion - 1);
  });
  
  $('#nextButton').click(function () {
    goToQuestion(currentQuestion + 1);
  });

  ////////////////////////////////////////////////////////////////
  // Load data

  function getNumber(x) {
    var result = /^[0-9,.]*/.exec(x);
    if (result === null) return null;
    result = result[0].replace(/,/g, '');
    if (result === '') return null;
    return +result;
  }

  function constructTable(tableData, sprite, tableInfoBox, answerRadio, answerBox, actionVal) {
    var table = $('<table>'), header, originalRowOrder = [], currentRow, i, j;
    // First row is a header
    for (i = 0; i < tableData.length; i++) {
      currentRow = $('<tr>');
      for (j = 0; j < tableData[0].length; j++) {
        $(i === 0 ? '<th>' : '<td>')
          .html(sprite[tableData[i][j]])
          .appendTo(currentRow);
      }
      if (i == 0)
        header = currentRow;
      originalRowOrder.push(currentRow);
    }
    // Restore order
    function restoreOrder() {
      table.empty().append(header);
      originalRowOrder.forEach(function (x) {
        table.append(x);
      });
      header.children().removeClass('selected');
      restoreRowOrderButton.prop('disabled', true);
      sortInfoSpan.text('(original order)');
      actionVal.val(actionVal.val() + 'O;');
    }
    var restoreRowOrderButton = $('<button>').text('Restore row order')
      .appendTo(tableInfoBox).click(restoreOrder);
    tableInfoBox.append(' ');
    var sortInfoSpan = $('<span>').appendTo(tableInfoBox);
    restoreOrder();
    // Sort
    table.on("click", "th", function (event) {
      // Stable Sort
      j = $(this).index();
      var sortedIndices = [], rows = table.find('tr').get();
      for (i = 1; i < rows.length; i++) sortedIndices.push(i);
      sortedIndices.sort(function (a, b) {
        var textA = table.find('tr:eq(' + a + ') td:eq(' + j + ')').text();
        var textB = table.find('tr:eq(' + b + ') td:eq(' + j + ')').text();
        var numA = getNumber(textA), numB = getNumber(textB);
        // Put numbers first
        if (numA !== null) {
          if (numB === null) return -1;
          if (numA != numB) return numA - numB;
        } else {
          if (numB !== null) return 1;
        }
        return textA > textB ? 1 : textA < textB ? -1 : a - b;
      });
      table.empty().append(header);
      sortedIndices.forEach(function (a) {
        table.append(rows[a]); 
      });
      header.children().removeClass('selected');
      $(this).addClass('selected');
      restoreRowOrderButton.prop('disabled', false);
      sortInfoSpan.text('(ordered by column ' + (j+1) + ')');
      actionVal.val(actionVal.val() + 'S' + j + ';');
    });
    // Selection
    tableInfoBox.append(' ');
    var computeInfoText = $('<span>').appendTo(tableInfoBox);
    function computeSelected() {
      var count = 0; sum = 0, numbers = [];
      table.find('td.selected').get().forEach(function (x) {
        count++;
        var num = getNumber($(x).text().replace(/^[^0-9]*/, ''));
        if (num !== null) {
          numbers.push(num);
          sum += num;
        }
      });
      if (count == 0)
        computeInfoText.text('').attr('title', null);
      else {
        computeInfoText.text('count = ' + count + ' | sum = ' + sum + ' (hover for details)');
        computeInfoText.attr('title', 'sum = ' + (numbers.length ? numbers.join(' + ') : '(none)'));
      }
    }
    var shiftSelecting = false;
    table.on("mousedown", "td", function (event) {
      if (event.ctrlKey) {
        answerRadio.click();
        var originalAnswer = answerBox.val();
        if (originalAnswer.length && originalAnswer[originalAnswer.length - 1] !== '\n')
          originalAnswer += '\n';
        answerBox.val(originalAnswer + clean($(this).text(), true) + '\n');
        actionVal.val(actionVal.val() + 'C' + $(this).parent().index() + '-' + $(this).index() + ';');
        event.preventDefault();
      } else if (event.shiftKey) {
        $(this).toggleClass('selected');
        shiftSelecting = $(this).hasClass('selected');
        computeSelected();
        actionVal.val(actionVal.val() + 'X' + $(this).parent().index() + '-' + $(this).index() + ';');
        event.preventDefault();
      }
    });
    table.on("mouseenter", "td", function (event) {
      if (event.shiftKey && event.buttons > 0) {
        $(this).toggleClass('selected', shiftSelecting);
        computeSelected();
        actionVal.val(actionVal.val() + 'X' + $(this).parent().index() + '-' + $(this).index() + ';');
        event.preventDefault();
      }
    });
    return table;
  }

  function newHidden(name, index) {
    return $('<input type=hidden>').attr('name', name + index);
  }

  function populateDatum(datum, index) {
    var answerRadio, answerBox, reasonRadio, reasonBox, actionVal;
    questionDivs.push(
      $('<div class=question>').appendTo('#questionWrapper').hide()
        .append($('<fieldset>')
          .append(newHidden('id', index).val(datum.id))
          .append(newHidden('title', index).val(datum.metadata.title))
          .append(newHidden('url', index).val(datum.metadata.url))
          .append(newHidden('tableid', index).val(datum.metadata.tableIndex))
          .append(newHidden('question', index).val(datum.question))
          .append(newHidden('alterIndex', index).val(datum.alterIndex))
          .append(newHidden('otherAlterIndices', index).val(datum.retained.otherAlterIndices))
          .append(newHidden('score', index).val(datum.retained.score))
          .append(actionVal = newHidden('actions', index).val(''))
          .append($('<h2>Question</h2>'))
          .append($('<div class=questionText>').text(datum.question).addClass('q' + index))
          .append($('<p>')
            .append($('<label>').attr('for', 'c' + index + 'a')
              .append(answerRadio = $('<input type=radio value=a checked=checked disabled>')
                .attr('name', 'c' + index).attr('id', 'c' + index + 'a')
                .change(function () {
                  reasonBox.prop('disabled', true);
                  answerBox.prop('disabled', false).focus();
                }))
              .append('The answer is:')))
          .append(answerBox = $('<textarea class=answerBox disabled rows=4>').attr('name', 'a' + index).attr('id', 'a' + index))
          .append($('<p>')
            .append($('<label>').attr('for', 'c' + index + 'b')
              .append(reasonRadio = $('<input type=radio value=b disabled>')
                .attr('name', 'c' + index).attr('id', 'c' + index + 'b')
                .change(function () {
                  answerBox.prop('disabled', true);
                  reasonBox.prop('disabled', false).focus();
                }))
              .append('Cannot be answered because:')))
          .append(reasonBox = $('<textarea class=reasonBox disabled rows=2>').attr('name', 'b' + index).attr('id', 'b' + index))
          ));
    var tableInfoBox = $('<div class=table-info>');
    var table = constructTable(datum.table, datum.sprite,
        tableInfoBox, answerRadio, answerBox, actionVal).addClass('q' + index);
    tableDivs.push(
      $('<div class=table>').hide()
        .append(tableInfoBox)
        .append($('<div class=table-lower>')
          .append($('<h2>').append('Page Title: ')
            .append($('<a target=_blank>').attr('href', datum.metadata.url)
              .text(datum.metadata.title)))
        .append(table)).appendTo('#webpage'));
    formElements.push(
      {'ca': answerRadio, 'a': answerBox, 'cb': reasonRadio, 'b': reasonBox});
  }

  function populateData(data) {
    $('#webpage, #questionWrapper').empty();
    data.forEach(populateDatum);
    // Show / Hide instructions
    $("#hideInstructionButton").text("Hide").prop('disabled', false);
    toggleInstructions(false);
    if (docCookies.getItem("percyTableSeenInstruction") != VERSION) {
      toggleInstructions(true);
      docCookies.setItem("percyTableSeenInstruction", VERSION);
    }
    if ($('#assignmentId').val() === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
      toggleInstructions(true);
    } else {
      $('.question textarea.answerBox, .question input, #submitButton').prop('disabled', false);
      $('#warning').hide();
    }
    goToQuestion(0);
  }

  populateData(QUESTIONS);

});
