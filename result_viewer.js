function zeroFill(number, width) {
	width -= number.toString().length;
	if (width > 0) {
		return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
	}
	return number;
}

// Sample: http://whyjustrun.ca/iof/3.0/events/746/result_list.xml
var wjr = {};
wjr.IOF = {};
wjr.IOF.Event = function(id, name, startTime) {
	this.id = id;
	this.name = name;
	this.startTime = startTime;
}
	
wjr.IOF.Course = function(id, name, results) {
	this.id = id;
	this.name = name;
	this.results = ko.observableArray(results);
}
	
wjr.IOF.Result = function(time, position, person) {
	if(time != null && !isNaN(time)) {
		this.time = time;
		this.hours = zeroFill((time - time % 3600) / 3600, 2);
		this.minutes = zeroFill((time - time % 60) / 60 - this.hours * 3600, 2);
		this.seconds = zeroFill(time % 60, 2);
	} else {
		this.time = this.hours = this.minutes = this.seconds = null;
	}
	
	this.position = position;
	this.person = person;
}

wjr.IOF.Person = function(id, givenName, familyName) {
	this.id = id;
	this.givenName = givenName;
	this.familyName = familyName;
}

wjr.IOF.loadResultsList = function(xml) {
	var resultList = $(xml.documentElement);
	var event = resultList.children("Event").first();
	var references = resultList.children("References").first();
	var classes = {};
	references.children("Class").each(function(index, element) {
		classes[$(element).children("Id").text()] = $(element).children("Name").text();
	})
	var courses = [];
	resultList.children('ClassResult').each(function(index, element) {
		element = $(element);
		var courseId = element.children("Class").attr("idref");
		var courseName = classes[courseId];
		var results = [];
		element.children('PersonResult').each(function(index, element) {
			element = $(element);
			var person = element.children("Person").first();
			var personGivenName = person.children("Name").children("Given").text();
			var personFamilyName = person.children("Name").children("Family").text();
			var personId = person.children("Id").text();
			// TODO-RWP Process resultTime
			var resultTime = parseInt(element.children("Result").children("Time").text());
			var resultPosition = element.children("Result").children("Position").text();
			results.push(new wjr.IOF.Result(resultTime, resultPosition, new wjr.IOF.Person(personId, personGivenName, personFamilyName)));
		});
		courses.push(new wjr.IOF.Course(courseId, courseName, results));
	})
	// TODO-RWP startTime
	return [new wjr.IOF.Event(event.children("Id").text(), event.children("Name").text(), null), courses];
}

$(function() {
	var createResultList = function(element, url) {
		var viewModel = {
			event : ko.observable(),
			courses : ko.observableArray()
		};
		
		ko.applyBindings(viewModel, element);
	
		$.ajax({
			type: "GET",
			url: url,
			dataType: "xml",
			cache: false,
			data: {
			},
			beforeSend: function() {
				
			},
			complete: function(jqXHR, textStatus) {
				
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert("Loading results failed :(");
			},
			success: function(xml)
			{
				result = wjr.IOF.loadResultsList(xml);
				viewModel.event(result[0]);
				viewModel.courses(result[1])
			}
		});
	}
	
	function loadResultList(index, element) {
		createResultList(element, this.getAttribute("data-result-list-url"));
	}
	
	$(".result-list").each(loadResultList);
});