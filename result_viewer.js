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

wjr.IOF.friendlyStatuses = {
	'OK': '',
	'Inactive': 'Inactive',
	'DidNotStart': 'DNS',
	'Active': 'In Progress',
	'Finished': 'Unofficial',
	'MisPunch': 'MP',
	'DidNotFinish': 'DNF',
	'Disqualified': 'DSQ',
	'NotCompeting': 'NC',
	'SportWithdr': 'Sport Withdrawal',
	'OverTime': 'Over Time',
	'Moved': 'Moved',
	'MovedUp': 'Moved Up',
	'Cancelled': 'Cancelled'
};
	
wjr.IOF.Result = function(time, position, status, scores, person) {
	if(time != null && !isNaN(time)) {
		this.time = time;
		this.hours = zeroFill((time - time % 3600) / 3600, 2);
		this.minutes = zeroFill((time - time % 60) / 60 - this.hours * 60, 2);
		this.seconds = zeroFill(time % 60, 2);
	} else {
		this.time = this.hours = this.minutes = this.seconds = null;
	}
	this.status = status;
	this.friendlyStatus = wjr.IOF.friendlyStatuses[status];
	this.position = position;
	this.scores = scores;
	this.person = person;
}

wjr.IOF.Person = function(id, givenName, familyName, profileUrl) {
	this.id = id;
	this.givenName = givenName;
	this.familyName = familyName;
	this.profileUrl = profileUrl;
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
			var personProfileUrl = person.children("Contact[type='WebAddress']").text();
			var personId = person.children("Id").text();
			var resultTime = parseInt(element.children("Result").children("Time").text());
			var resultStatus = element.children("Result").children("Status").text();
			var resultPosition = element.children("Result").children("Position").text();
			var resultScores = {};
			element.children("Result").children("Score").each(function(index, element) {
				resultScores[$(element).attr("type")] = $(element).text();
			});
			results.push(new wjr.IOF.Result(resultTime, resultPosition, resultStatus, resultScores, new wjr.IOF.Person(personId, personGivenName, personFamilyName, personProfileUrl)));
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

// Fix CORS for IE8/9

(function( jQuery ) {
  // Create the request object
  // (This is still attached to ajaxSettings for backward compatibility)
  jQuery.ajaxSettings.xdr = function() {
    return (window.XDomainRequest ? new window.XDomainRequest() : null);
  };

  // Determine support properties
  (function( xdr ) {
    jQuery.extend( jQuery.support, { iecors: !!xdr });
  })( jQuery.ajaxSettings.xdr() );

  // Create transport if the browser can provide an xdr
  if ( jQuery.support.iecors ) {

    jQuery.ajaxTransport(function( s ) {
      var callback;

      return {
        send: function( headers, complete ) {
          var xdr = s.xdr();

          xdr.onload = function() {
            var headers = { 'Content-Type': xdr.contentType };
            complete(200, 'OK', { text: xdr.responseText }, headers);
          };
          
          // Apply custom fields if provided
					if ( s.xhrFields ) {
            xhr.onerror = s.xhrFields.error;
            xhr.ontimeout = s.xhrFields.timeout;
					}

          xdr.open( s.type, s.url );

          // XDR has no method for setting headers O_o

          xdr.send( ( s.hasContent && s.data ) || null );
        },

        abort: function() {
          xdr.abort();
        }
      };
    });
  }
})( jQuery );
