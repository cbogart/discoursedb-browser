
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

var base_url = "http://localhost:8080";

/*
 * from a _links section, generate html that links to or queries those links
 */
function links(l) {
    var html = "";
    Object.keys(l).forEach(function(item) {
       var fullurl = l[item].href;
       var parts = url_parts(fullurl);
       var href2 = l[item].href.split("/").slice(3).join("/");
       if (parts.parameterNames.length > 0) { 
           html += "<div class='act'>";
           parts.parameterNames.forEach(function (p) {
               if (parts.url == $.showParameters.url) {
                   v = $.showParameters.parameters[item] || "";
               } else {
                   v = "";
               }
               html += p + ": <input value='" + v + "' id='param_" + item + "_" + p + "' desturl='" + fullurl + "' type=text></input>";
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
    $.showParameters.breadcrumbs.push(parts.url); 
    $.showParameters.url = parts.url;
    $.showParameters.parameters = { }
    if (btn.is("[hist]")) {
         $.showParameters.breadcrumbs = $.showParameters.breadcrumbs.slice(0,+btn.attr("hist")+1);
    }
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

    var html = "";
    if (is_list_of_objects(items)) {
        if (items.length == 0) { return "(no data)"; }
        var columns = key_union(items);
     
        html = "<table width=100% border=1><tr>";
        columns.forEach(function(entry) { html += "<th>" + entry + "</th>"; });
        html += "</tr>\n";
        items.forEach(function(item) {
             if (item != "_links") {
             html += "<tr>";
             columns.forEach(function(col) {
                 if (col != "_links") {
                  html += "<td>" + pretty_print(item[col]) + "</td>";
                 } else {
                  html += "<td>" + links(item[col]) + "</td>";
                 }
             });
             html += "</tr>\n";
             }
        });
        html += "</table>";
    } else if (typeof items == "object" && items != null) {
        html = "<table border=1>";
        Object.keys(items).forEach(function(k) {
            html += "<tr><td>" + k + "</td><td>" + items[k] + "</td></tr>";
        });
        html += "</table>\n";
    } else {
        html += items;
    }
    return html;
}

function pretty_print(entry) {
    if (is_list_of_objects(entry)) {
        var c = column_transform(entry);
        if (c instanceof Array) {
           return maketable({"_embedded": { "whatever": column_transform(entry) }});
        } else {
           return maketable({"_embedded": { "whatever": [column_transform(entry)] }});
        }

    } else if (typeof entry == "object" && entry != null) {
        return maketable({"_embedded": { "whatever": entry }});
    } else if (entry instanceof Array && entry.length == 1) {
        return entry[0];
    } else {
        return entry;
    }
}

function key_union(items) {
    // find union of all column headers in all rows
    // Stupid code: use underscore or lodash
    var columns = [];

    items.forEach(function(i) {
        Object.keys(i).forEach(function(k) {
            if (columns.indexOf(k) == -1) {
                columns.push(k);
            }
        })
    }); 
    return columns;
}

function is_list_of_objects(entry) { 
    return (entry instanceof Array && typeof entry[0] =="object" && entry[0] != null);
}

function column_transform(list_of_objects) {
    if (!is_list_of_objects(list_of_objects)) { return list_of_objects; }
 
    var keys = key_union(list_of_objects);
    if (keys.length == 2 && keys.indexOf("type") > -1) {
        var otherkey = keys[1-keys.indexOf("type")];
        var rv = {};
        list_of_objects.forEach(function(i) {
            var cols = column_transform(i[otherkey]);
            console.log("transformed ", cols, " from ", i[otherkey]);
            if (!(i["type"] in rv)) {
                rv[i["type"]] = [];
            }
            rv[i["type"]].push(cols);
        });
        return rv;
    } else {
        return list_of_objects;
    }
}


$.showParameters = {
   url: base_url + "/browsing/stats/",
   breadcrumbs: [base_url + "/browsing/stats/"],
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
        if (!("_links" in result)) { result._links = {}; }
        $("#output").html(links(result._links) + pageinfo(result) + maketable(result));
        $("#searching").html(links(result._links) + pageinfo(result) + maketable(result));
        var bc = -1;
        $("#breadcrumbs").html($.showParameters.breadcrumbs.map(function(b) {
            bc = bc + 1;
            return "<button hist=" + bc + " class='actions crumb' desturl='" + b + "'>"
             + b.slice(base_url.length).replace("\?","<br/>") + "</button>"; 
        }));
              
   });

};

$("#dp").click(function() {
   $.showParameters.url = base_url + "/discourseParts";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#stats").click(function() {
   $.showParameters.url = base_url + "/browsing/stats";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#cont").click(function() {
   $.showParameters.url = base_url + "/contributions/";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#user").click(function() {
   $.showParameters.url = base_url + "/users/";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#features").click(function() {
   $.showParameters.url = base_url + "/features/";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#nonDegenerate").click(function() {
   $.showParameters.url = base_url + "/discourseParts/search/findAllNotAnnotatedWithType";
   $.showParameters.parameters = { "type": "Degenerate", "size": "5" };
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#repos").click(function() {
   $.showParameters.url = base_url + "/browsing/repos?repoType=GITHUB_REPO&annoType=MATRIX_FACTORIZATION";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#annotationInstances").click(function() {
   $.showParameters.url = base_url + "/annotationInstances";
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});
$("#go").click(function() {
   $.showParameters.url = $('#theQueryUrl').val();
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   loadPage();
});

loadPage();
