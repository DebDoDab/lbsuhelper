function getQuarterNumber(date) {
	var cur = Number(date.substring(0, 2)) + Number(date.substring(3, 5)) * 50;

	if ((cur >= 428) && (cur <= 529))
		return 21;
	else if ((cur >= 556) && (cur <= 624))
		return 23;
	else if ((cur >= 58) && (cur <= 175))
		return 24;
	else
		return 25;
}

function deleteSpaces(str) {
	str = String(str);

	var start = 0, end = str.length - 1;

	while ((start < str.length) && ((str[start] == ' ') || (str[start] == '\n')))
		start++;

	while ((end >= start) && ((str[end] == ' ') || (str[end] == '\n')))
		end--;

	return str.substring(start, end + 1);
}

chrome.extension.onMessage.addListener(function(request, sender, callback){
	if (request.cmd == 'getMarks') {
		console.log("Start collecting subjectinfo");

		if (window.location.href.indexOf("#dnevnik") == -1)
			document.querySelectorAll('[href="#dnevnik"]')[0].click();

		var pupilId = document.querySelectorAll('div.grid_pst_c > div.pp_line > b')[1].innerHTML, quarterId = request.quarterId, 
			selectedId = [], tmp = 0, marks = {};

		setTimeout(function() {document.querySelectorAll('[quarter_id="' + request.quarterId + '"]')[0].click();}, 350);

		function update(callbackFunction) {
			var switches = document.querySelectorAll('div.db_period > p > a');

			for (var cur = 0; cur < switches.length; cur++) {
				if ((switches[cur].id.substring(20, 22) == quarterId) && (selectedId.indexOf(switches[cur].id) == -1)) {
					switches[cur].click();
					selectedId.push(switches[cur].id);
				}
			}

			tmp++;

			if (tmp < 40)
				setTimeout(update, 100, callbackFunction);
			else {
				var tables = document.querySelectorAll('table.db_table');

				for (var i = 0; i < tables.length; i++) {
					if (getQuarterNumber(tables[i].id.substring(9, 17)) == quarterId) {
						var tr = document.querySelectorAll('table[id="' + tables[i].id + '"] > tbody > tr'); //document.querySelectorAll('table[id="' + 'db_table_23.10.17' + '"] > tbody > tr')

						for (var curTr = 0; curTr < tr.length; curTr++) {
							var subjectName = "", mark = "", mark1 = "";

							for (var j = 0; j < tr[curTr].childNodes.length; j++) {
								if (!('classList' in tr[curTr].childNodes[j]))
									continue;

								if (tr[curTr].childNodes[j].classList.contains('lesson'))
									subjectName = deleteSpaces(tr[curTr].childNodes[j].childNodes[1].innerHTML.substring(2));

								if (tr[curTr].childNodes[j].classList.contains('mark')) {
									if (tr[curTr].childNodes[j].classList.contains('noted_lesson'))
										mark = deleteSpaces(tr[curTr].childNodes[j].childNodes[1].innerHTML.substring(0, tr[curTr].childNodes[j].childNodes[1].innerHTML.indexOf('<'))); 
									else
										mark = deleteSpaces(tr[curTr].childNodes[j].childNodes[1].innerHTML); 

									if (mark.indexOf('/') != -1) {
										mark1 = mark.substring(mark.indexOf('/') + 1, mark.length);
										mark = mark.substring(0, mark.indexOf('/'));
									}
								}
							}

							if (marks[subjectName] == undefined)
								marks[subjectName] = [ ];

							if (mark != "")
								marks[subjectName].push(mark);

							if (mark1 != "")
								marks[subjectName].push(mark);
						}
					}
				}

				for (var i in marks) {
					if (i == '')
						continue;

					var sum = 0, average = '';

					for (var j = 0; j < marks[i].length; j++)
						sum += +marks[i][j];

					if (marks[i].length != 0)
						average = +(sum / marks[i].length);

					console.log(i + ' : ' + average);
				}

				console.log(marks);
				callbackFunction(marks);
			}
		}

		setTimeout(update, 400, callback);

		return true;
	}
});