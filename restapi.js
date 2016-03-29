
function links(l) {
    var html = "<select id='selector'>\n";
    Object.keys(l).forEach(function(item) {
       var selected = "";
       if (item == "self") { selected = " selected "; }
       html += "<option value='" + l[item].href + "'" + selected + ">" + item + "</option>\n";
    });
    html += "</select>\n";
    return html;
}

$(function() {
  $(document).on('change', '#selector', function(event) {
    var option = event.target.selectedOptions[0];
    console.log("SELECTOR CHANGED: " + option.text + " / " + option.value);
    $.showParameters.url = option.value;
    loadPage();
  });
});

function pageinfo(result) {
    var html = "";
    if ("page" in result) {
        Object.keys(result["page"]).forEach(function(i) { html += "<span class='pageinfo'>" + i + ": " + result["page"][i] + "</span>"; } );
    }
    return html;
}

function maketable(result) {
    var keys = 0;
    var items = 0;
    if ("_embedded" in result) {
        keys = Object.keys(result._embedded);
        items = result._embedded[keys[0]];
    } else {
        keys = Object.keys(result);
        items = [result];
    }
    if (items.length == 0) { return "(no data)"; }
    var columns = Object.keys(items[0]);
    var html = "<table border=1><tr>";
    columns.forEach(function(entry) { html += "<th>" + entry + "</th>"; });
    html += "</tr>\n";
    items.forEach(function(item) {
         html += "<tr>";
         columns.forEach(function(col) {
             if (col != "_links") {
              html += "<td>" + item[col] + "</td>";
             } else {
              html += "<td>" + links(item[col]) + "</td>";
             }
         });
         html += "</tr>\n";
    });
    return html;
}

$.showParameters = {
   url: "http://localhost:8080/discourseParts/"
}

/*
 *  To do:  wrap result to abstract away singleton vs embedded list
 *          method that extends each row by some named _link
 *          special case for 2-way link
 */

function loadPage() {
   var returnData = "";
   $.getJSON($.showParameters.url, function(result) {
        $("#output").html(maketable(result) + links(result._links) + pageinfo(result));
   });

};

$("#dp").click(function() {
   $.showParameters.url = "http://localhost:8080/discourseParts";
   loadPage();
});
$("#dpPlus").click(function() {
   $.showParameters.url = "http://localhost:8080/discourseParts";
   $.showParameters.followon = ["discourseToDiscourseParts"];
   loadPage();
});
$("#cont").click(function() {
   $.showParameters.url = "http://localhost:8080/contributions";
   loadPage();
});
$("#user").click(function() {
   $.showParameters.url = "http://localhost:8080/users";
   loadPage();
});

loadPage();
