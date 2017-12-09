var quarterStartDate, quarterEndDate, countOfDaysInMonth, countOfWeeksInQuarter, usedWeeks = {}, marks, userId;

countOfWeeksInQuarter = {
	'21': 9,
	'23': 7,
	'24': 11,
	'25': 9
};

quarterStartDate = {
	21: '2017-08-28',
	23: '2017-11-06',
	24: '2018-01-08',
	25: '2018-04-02'
};

quarterEndDate = {
	21: '2017-10-23',
	23: '2017-12-18',
	24: '2018-03-19',
	25: '2018-05-28'
};

countOfDaysInMonth = {
	1: 31,
	2: 28,
	3: 31,
	4: 30,
	5: 31,
	6: 30,
	7: 31,
	8: 31,
	9: 30,
	10: 31,
	11: 30,
	12: 31
};

function deleteSpaces(str) {
	str = String(str);

	var start = 0, end = str.length - 1;

	while ((start < str.length) && ((str[start] == ' ') || (str[start] == '\n')))
		start++;

	while ((end >= start) && ((str[end] == ' ') || (str[end] == '\n')))
		end--;

	return str.substring(start, end + 1);
}

function getDayNumber(date) {
	var year = +date.substring(0, 4), month = +date.substring(5, 7), day = +date.substring(8, 10), sum = 0;

	for (var i = 1; i < month; i++)
		sum += countOfDaysInMonth[i];

	if (year == 2018)
		return 1000 + sum + day;
	else
		return sum + day;
}

function updateId() {
	$.ajax({
		method: 'GET',
		async: false,
		url: 'https://schools.by/',
		data: {},
		dataType: 'html',
		success: function(answer) {
			var href = $('b.name > a', answer).attr('href');

			if (href.match(/\d+/g) != null)
				userId = href.match(/\d+/g)[0];
		},
		error: function(error) {
			console.log('error: ', error);
			userId = 'error';
		}
	});
}

function getMarks(numberOfQuarter, startDate) {
	var curDate;

	userId = '';
	updateId();

	if (userId == '')
		return 1;

	curDate = quarterStartDate[numberOfQuarter];

	while (getDayNumber(curDate) <= getDayNumber(quarterEndDate[numberOfQuarter])) {
		$.ajax({
			method: 'GET',
			url: 'https://lyceum.schools.by/pupil/' + userId + '/dnevnik/quarter/' + numberOfQuarter + '/week/' + curDate,
			data: {},
			dataType: 'html',
			success: function(answer) {
				var dom = $.parseHTML(answer), tables = $('table.db_table', dom);

				for (var i = 0; i < tables.length; i++) {
					var tr = $('table[id="' + tables[i].id + '"] > tbody > tr', dom);

					for (var curTr = 0; curTr < tr.length; curTr++) {
						var subjectName = "", mark = "", mark1 = "";
						subjectName = deleteSpaces($('table[id="' + tables[i].id + '"] > tbody > tr:eq(' + curTr + ')', dom).children('.lesson').text());
						mark = deleteSpaces($('table[id="' + tables[i].id + '"] > tbody > tr:eq(' + curTr + ')', dom).children('.mark').text());

						if (subjectName.indexOf('.') != -1)
							subjectName = deleteSpaces(subjectName.substring(subjectName.indexOf('.') + 1));

						if (mark.indexOf(' ') != -1)
							mark = deleteSpaces(mark.substring(0, mark.indexOf(' ')));

						if (mark.match(/\d/) == null)
							mark = '';

						if (mark.indexOf('/') != -1) {
							mark1 = mark.substring(mark.indexOf('/') + 1, mark.length);
							mark = mark.substring(0, mark.indexOf('/'));
						}

						if (marks[subjectName] == undefined)
							marks[subjectName] = [ ];

						if (mark != '')
							marks[subjectName].push(mark);

						if (mark1 != '')
							marks[subjectName].push(mark);
					}
				}

				usedWeeks[startDate]++;
			},
			error: function(error) {
				console.log('error: ', error);
			}
		});

		var year = +curDate.substring(0, 4), month = +curDate.substring(5, 7), day = +curDate.substring(8, 10);

		day += 7;

		if (day > countOfDaysInMonth[month]) {
			day -= countOfDaysInMonth[month];
			month++;
		}
		
		if (month > 12) {
			month -= 12;
			year++;
		}

		if (month < 10)
			curDate = year + '-0' + month + '-';
		else
			curDate = year + '-' + month + '-';
		
		if (day < 10)
			curDate += '0' + day;
		else
			curDate += day;
	}

	return 0;
}

function showMarks(numberOfQuarter) {
	var startDate = new Date();

	$('.menuItem').unbind('click');
	$('#subjectTable').html('');
	$('#errorMessage').hide();

	usedWeeks[startDate] = 0;
	numberOfQuarter = String(numberOfQuarter);
	marks = {};
	var resp = getMarks(numberOfQuarter, startDate);

	if (resp == 1) {
		$('#errorMessage').text('Войдите в учетную запись на schools.by');
		$('#errorMessage').show();

		return;
	}

	function f() {
		if (usedWeeks[startDate] != countOfWeeksInQuarter[numberOfQuarter])
			setTimeout(f, 50);
		else {
			console.log(marks);
			var keys = Object.keys(marks);

			for (var i = 0; i < keys.length; i++) {
				if (keys[i] != '') {
					var sum = 0;

					for (var j = 0; j < marks[keys[i]].length; j++)
						sum += +marks[keys[i]][j];

					var average;

					if (marks[keys[i]].length > 0)
						average = Math.round((sum / marks[keys[i]].length) * 100) / 100;
					else
						average = '-';

					$('#subjectTable').prepend('<tr>\n<th scope="row">' + String(keys.length - i) + 
						'</th>\n<td>' + keys[i] + '</td>\n<td>' + average + '</td>\n<td>' + marks[keys[i]].join(', ') + '</td>\n</tr>');
				}
			}

			updEvents();
		}
	}
	
	f();
}

function updEvents() {
	$('#q21').click(function() { showMarks('21'); });
	$('#q23').click(function() { showMarks('23'); });
	$('#q24').click(function() { showMarks('24'); });
	$('#q25').click(function() { showMarks('25'); });
}

updEvents();
$('#errorMessage').hide();