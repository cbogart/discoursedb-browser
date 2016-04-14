
/*
 * separate true url from bracketed syntax at the end listing REST parameters
 * i.e.  http://abc/def/{?thi,asdf} ->
 *     { url: http://abc/def/      parameterNames:[thi,asdf]  }
 */
function url_parts(url) {
       var curly = url.indexOf("{");
       if (curly > -1) {
           return {
               url : url.substring(0, curly),
               parameterNames : url.substring(curly+2,url.length-1).split(",")
           }
       } else {
           return {
               url : url,
               parameterNames : []
           }
       }
}

var base_url = "localhost";

/*
 * from a _links section, generate html that links to or queries those links
 */
function links(l) {
    var html = "";
    Object.keys(l).forEach(function(item) {
       var fullurl = l[item].href;
       var parts = url_parts(fullurl);
       var href2 = l[item].href.split("/").slice(3,99).join("/");
       if (parts.parameterNames.length > 0) { 
           html += "<div class='act'>";
           parts.parameterNames.forEach(function (p) {
               html += p + ": <input id='param_" + item + "_" + p + "' desturl='" + fullurl + "' type=text></input>";
           });
           html += "<input class='actions' id='go_" + item + "' value='" + item + "' desturl='" + fullurl + "' type=submit></input>";
           html += "</div>";
       } else {
           html += "<input class='actions' id='go_" + item + "' value='" + item + "' desturl='" + fullurl + "' type=submit></input>";
       }
    });
    return html;
}

/*
 * When user clicks a link (created by links() function),
 * set the url and parameters and issue the rest request
 */
$(function() {
  $(document).on('click', '.actions', function(event) {
    var btn = $(event.target);
    console.log("CLICK", btn);
    var parts = url_parts(btn.attr("desturl"));
    console.log("url = ", parts.url);
    $.showParameters.url = parts.url;
    $.showParameters.parameters = { }
    parts.parameterNames.forEach(function(p) {
        var inputid = "#go_" + btn.val();
        var paramid = "#param_" + btn.val() + "_" + p;
        console.log("paramid = ", paramid);
        $.showParameters.parameters[p] = $(paramid).val();
        console.log("paramid contains " ,$(paramid).val());
    });
    console.log("params = ", $.showParameters.parameters);
    loadPage();
  });
});

/* 
 * Return html code for the block of info about what page we're showing
 */
function pageinfo(result) {
    var html = "";
    if ("page" in result) {
        Object.keys(result["page"]).forEach(function(i) { html += "<span class='pageinfo'>" + i + ": " + result["page"][i] + "</span>"; } );
    }
    return html;
}

/*
 * Turn the main body of returned rest results into a table
 */
function maketable(result) {
    var keys = 0;
    var items = 0;
    if ("_embedded" in result) {
        keys = Object.keys(result._embedded);
        items = result._embedded[keys[0]];
    } else {
        items = [{}];
        keys = [];
        Object.keys(result).forEach(function(k) {
            if (k != "_links") {
               keys += k;
               items[0][k] = result[k]; 
            }
        });
    }
    if (items.length == 0) { return "(no data)"; }
    var columns = Object.keys(items[0]);
    var html = "<table border=1><tr>";
    columns.forEach(function(entry) { html += "<th>" + entry + "</th>"; });
    html += "</tr>\n";
    items.forEach(function(item) {
         if (item != "_links") {
         html += "<tr>";
         columns.forEach(function(col) {
             if (col != "_links") {
              html += "<td>" + item[col] + "</td>";
             } else {
              html += "<td>" + links(item[col]) + "</td>";
             }
         });
         html += "</tr>\n";
         }
    });
    return html;
}

$.showParameters = {
   url: "http://" + base_url + ":8080/discourseParts/",
   parameters: {}
}

/*
 *  To do:  wrap result to abstract away singleton vs embedded list
 *          method that extends each row by some named _link
 *          special case for 2-way link
 */

function loadPage() {
   var returnData = "";
   $("#theQueryUrl").val($.showParameters.url);
   $.getJSON($.showParameters.url, $.showParameters.parameters, function(result) {
        $("#output").html(maketable(result) + links(result._links) + pageinfo(result));
        $("#searching").html(maketable(result) + links(result._links) + pageinfo(result));
   });

};

$("#dp").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/discourseParts";
   $.showParameters.parameters = {};
   loadPage();
});
$("#dpPlus").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/discourseParts";
   $.showParameters.parameters = {};
   $.showParameters.followon = ["discourseToDiscourseParts"];
   loadPage();
});
$("#cont").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/contributions/";
   $.showParameters.parameters = {};
   loadPage();
});
$("#user").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/users/";
   $.showParameters.parameters = {};
   loadPage();
});
$("#features").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/features/";
   $.showParameters.parameters = {};
   loadPage();
});
$("#nonDegenerate").click(function() {
   console.log("X");
   $.showParameters.url = "http://" + base_url + ":8080/discourseParts/search/findAllNotAnnotatedWithType";
   $.showParameters.parameters = { "type": "Degenerate", "size": "5" };
   loadPage();
});
$("#repos").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/discourseParts/";
   $.showParameters.continuation = ["annotationAggregate", "annotationInstances", "features"]
   loadPage();
});
$("#annotationInstances").click(function() {
   $.showParameters.url = "http://" + base_url + ":8080/annotationInstances";
   $.showParameters.parameters = {};
   loadPage();
});
$("#go").click(function() {
   $.showParameters.url = $('#theQueryUrl').val();
   $.showParameters.parameters = {};
   $.showParameters.followon = [];
   loadPage();
});

loadPage();
