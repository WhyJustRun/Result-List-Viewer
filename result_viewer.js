// Sample: http://whyjustrun.ca/iof/3.0/events/746/result_list.xml
var wjr = {};
wjr.IOF = {};
wjr.IOF.Event = function(id, name, startTime, courses) {
	this.id = id;
	this.name = name;
	this.startTime = startTime;
	this.courses = [];
}
	
wjr.IOF.Course = function(id, name, results) {
	this.id = id;
	this.name = name;
	this.results = [];
}
	
wjr.IOF.Result = function(time, person) {
	this.time = time;
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
	var courses = [];
	resultList.each('ClassResult', function(index, element) {
		var courseId = element.children("Class").attr("idref");
		var courseName = courseId; // NOTE-RWP Temporary
		var results = [];
		element.each('PersonResult', function(index, element) {
			var person = element.children("Person").item(0);
			var personGivenName = person.children("Name > Given").text();
			var personFamilyName = person.children("Name > Family").text();
			var personId = person.children("Id").text();
			// TODO-RWP Process resultTime
			var resultTime = element.children("Result > Time").text();
			var resultPosition = element.children("Result > Position").text();
			results.push(new wjr.IOF.Result(resultTime, new wjr.IOF.Person(personId, personGivenName, personFamilyName)));
		});
		courses.push(new wjr.IOF.Course(courseId, courseName, results));
	})
	// TODO-RWP startTime
	return new wjr.IOF.Event(event.children("Id").text(), event.children("Name").text(), nil, courses);
}

$(function() {
	var createResultsList = function(id, url) {
		var viewModel = {
			event : ko.observable()
		};
		
		ko.applyBindings(viewModel);
	
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
				viewModel.event = wjr.IOF.loadResultsList(xml);
			}
		});
	}
	
	function loadResultsList() {
		loadResultFromUrl(this.attr("id"), this.attr("data-results-list-url"));
	}
	
	$("results-list").each(loadResultsList());
});