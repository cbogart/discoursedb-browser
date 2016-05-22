


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
       } /*else if (url.indexOf("?") > -1) {
           params = {};
           url.split("?")[1].split("&").forEach(function(eq) {
               var kv = eq.split("=");
               params[kv[0]] = kv[1];
           });
           return {
               url : url,
               core_url : url.split("?")[0],
               parameterHash: params,
               parameterNames: Object.keys(params)
           }
       } */else {
           return {
               url : url,
               parameterNames : []
           }
       }
}
$(function () {
    $("table").stickyTableHeaders();
});

// https://github.com/janl/mustache.js/blob/master/mustache.js#L82
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }


var base_url = "http://localhost:5280";

function actuator(itemname, fullurl) {
    if (itemname.startsWith("chk:")) {
         var humanname = itemname.split(":")[1];
         var nicename = name2token(humanname);
         if (!(nicename in $.showParameters.checkhandlers)) {
             $("#checkHandlingArea").append('<div class="checkContainer"> ' + 
                 humanname + ': <input class="checkToggle checkButtons" value="Toggle Checkboxes" nicename="' + nicename + '" type=button>' +
                 '<input class="checkActivate checkButtons veryVisibleButton" disabled="true" value="Submit Checkboxes" nicename="' + nicename + '" type=button></div>');
             $.showParameters.checkhandlers[nicename] = 1;
         }
         return "<div class='checkContainer'><input class='" + 
                nicename + " checkmark' value='on' nicename='" + nicename + "' desturl='" + fullurl + "' type=checkbox></input>" + humanname + "</div>";
    } else {
         var enabled = (fullurl.length > 0) ? "" : "disabled";
         return "<input " + enabled + " class='actions' id='go_" + itemname + "' value='" + itemname + "' desturl='" + fullurl + "' type=submit></input>";
    }
}

/*
 * from a _links section, generate html that links to or queries those links
 */
function links(l) {
    var html = "";
    try {
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
                   html += p + ": <input id='param_" + item + "_" + p + "' desturl='" + fullurl + "' type=text></input>";
               });
               html += actuator(item,fullurl);
               html += "</div>";
           } else {
               html +=  actuator(item,fullurl);
           }
        });
    } catch (e) {
        html = "(no links)";
        console.log(e);
    }
    return html;
}

function name2token(name) {
    return name.replace(/[^\w]/g, '');
}

/*
 * When user clicks a link (created by links() function),
 * set the url and parameters and issue the rest request
 */
$(function() {
  window.onpopstate = function(event) {
    $.showParameters = event.state;
    console.log("Popstate! " + $.showParameters.url);
    $.showParameters.checkhandlers = {};
    loadPage();
  };
  $(document).on('click', '.checkToggle', function(event) {
    var nicename = $(event.target).attr("nicename");
    console.log("Toggling everything with class " + nicename);
    $("." + nicename).each(function(i,chkbox) {
        console.log("Toggling " + chkbox);
        $(chkbox).attr("checked", !$(chkbox).attr("checked"));
    });
  });
  $(document).on('click', '.checkmark', function(event) {
    var nicename = $(event.target).attr("nicename");
    var anychecked = false;
    console.log("Maybe enabling button: checking " + "."+nicename);
    $("." + nicename).each(function(i,chkbox) {
        console.log("checking " + chkbox);
        anychecked = anychecked || $(chkbox).prop("checked");
    });
    console.log("  anychecked=" + anychecked);
    $(".checkActivate[nicename='" + nicename + "']").prop("disabled", !anychecked);
  });
  $(document).on('click', '.checkActivate', function(event) {
    var nicename = $(event.target).attr("nicename");
    postUrls = [];
    $("." + nicename).each(function(i,chkbox) {
        console.log("Adding " + $(chkbox) + " if appropriate");
        if (chkbox.checked) {
            postUrls.push(chkbox.getAttribute("desturl"));
        }
    });
    loadMultiplePages(postUrls);
  });
  $(document).on('click', '.actions', function(event) {
    var btn = $(event.target);
    if (btn.is("[hist]")) {
         var backsteps = parseInt(btn.attr("hist")) - (parseInt($.showParameters.breadcrumbs.length)-1);
         if (backsteps < 0) {
             window.history.go(backsteps);
         }
    } else { 
        console.log("CLICK", btn);
        var parts = url_parts(btn.attr("desturl"));
        console.log("url = ", parts.url);
        if (!parts.url.startsWith(base_url)) {
            window.open(parts.url, "_external");
            return;
        }
        $.showParameters.breadcrumbs.push(parts.url); 
        $.showParameters.url = parts.url;
        //window.history.pushState({url: parts.url, crumbs: $.showParameters.breadcrumbs }, "");
        window.history.pushState($.showParameters,""); 
        $.showParameters.parameters = { }
        $.showParameters.checkhandlers = {};
         parts.parameterNames.forEach(function(p) {
            var inputid = "#go_" + btn.val();
            var paramid = "#param_" + btn.val() + "_" + p;
            console.log("paramid = ", paramid);
            $.showParameters.parameters[p] = $(paramid).val();
            console.log("paramid contains " ,$(paramid).val());
         });
         console.log("params = ", $.showParameters.parameters);
         loadPage();
     }
  });
});

/* 
 * Return html code for the block of info about what page we're showing
 */
function prepare_pageinfo(result) {
    var html = "";
    if ("page" in result) {
        if ("first" in result._links) {
            html += actuator("|<", result._links.first.href);
            delete result._links["first"];
        } else {
            html += actuator("|<","");
        }
        html += "&nbsp;"
        if ("prev" in result._links) {
            html += actuator("<", result._links.prev.href);
            delete result._links["prev"];
        } else {
            html += actuator("<","");
        }
        html += "&nbsp;"
        if ("next" in result._links) {
            html += actuator(">", result._links.next.href);
            delete result._links["next"];
        } else {
            html += actuator(">","");
        }
        html += "&nbsp;"
        if ("last" in result._links) {
            html += actuator(">|", result._links.last.href);
            delete result._links["last"];
        } else {
            html += actuator(">|","");
        }
        if ("self" in result._links) {
            delete result._links["self"];
        }
        html += "&nbsp;"
        html += "Page " + (1+result["page"]["number"]) + " of " + result["page"]["totalPages"] ;
        //Object.keys(result["page"]).forEach(function(i) { html += "<span class='pageinfo'>" + i + ": " + result["page"][i] + "</span>"; } );
    }
    return [result, html];
}


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
            if (k != "_links" && (k != "page" || !("number" in result[k]))) {
               keys += k;
               items[0][k] = result[k]; 
            }
        });
    }

    var html = "";
    if (is_list_of_objects(items)) {
        if (items.length == 0) { return "(no data)"; }
        var columns = key_union(items);
     
        html = '<table id=stickyheaders width=100% border=1><thead class="tableFloatingHeaderOriginal"><tr>';
        columns.forEach(function(entry) { html += "<th>" + entry + "</th>"; });
        html += "</tr></thead><tbody>\n";
        items.forEach(function(item) {
             if (item != "_links") {
               html += "<tr>";
               columns.forEach(function(col) {
                   if (col == "_links") {
                    html += "<td>" + links(item[col]) + "</td>";
                   } else if (col == "content" || col == "body" || col == "text") {
                    html += "<td><pre>" + escapeHtml(item[col]) + "</pre></td>";
                   } else {
                    html += "<td>" + pretty_print(item[col]) + "</td>";
                 }
               });
               html += "</tr>\n";
             }
        });
        html += "</tbody></table>";
    } else if (items != null && items instanceof Array && items.length == 1) {
        html += items[0];
    } else if (items != null && items instanceof Array) {
        html = "<table border=1>";
        Object.keys(items).forEach(function(k) {
            html += "<tr><td>" + items[k] + "</td></tr>";
        });
        html += "</table>\n";
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
    if (columns.indexOf("_links") > -1) {
        columns = ["_links"].concat(columns.filter(e => e !== '_links'));
    }
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
   parameters: {},
   checkhandlers: {},
}
window.history.replaceState($.showParameters,""); 


function showHistory() {
   //window.alert("History length " + window.history.length);
}

/*
 *  To do:  wrap result to abstract away singleton vs embedded list
 *          method that extends each row by some named _link
 *          special case for 2-way link
 */

function displayBreadcrumbs() {
        var bc = -1;
        $("#breadcrumbs").html($.showParameters.breadcrumbs.map(function(b) {
            bc = bc + 1;
            return "<button hist=" + bc + " class='actions crumb' desturl='" + b + "'>"
             + b.slice(base_url.length).replace("\?","<br/>") + "</button>"; 
        }));
}

function loadPage() {
   showHistory();
   var returnData = "";
   $("#theQueryUrl").val($.showParameters.url);
   $("#output").html("Waiting for response from server.....");
   $("#checkHandlingArea").html("");
   $.getJSON($.showParameters.url, $.showParameters.parameters).done(function(result) {
        if (!("_links" in result)) { result._links = {}; }

        [result, pagination] = prepare_pageinfo(result);
        //$("#output").html(links(result._links) + pageinfo(result) + maketable(result));
        $("#output").html(links(result._links) + pagination + maketable(result));
        //$("#searching").html(links(result._links) + pageinfo(result) + maketable(result));
        displayBreadcrumbs();      
        $(window).trigger('resize.stickyTableHeaders');
   })
   .fail(function(x, textStatus, error) { $("#output").html(textStatus + "<br>" + error); });
};

function loadMultiplePages(urls) {
   console.log("LMP " + urls);
   $("#output").html("" + urls.length + " actions being submitted... please wait");
   $("#checkHandlingArea").html("");
   if (urls.length > 1) {
      console.log("A" + urls.length);
      $.getJSON(urls[0]).done(function(result) {
        console.log("B" + urls.length);
        loadMultiplePages(urls.slice(1));
        console.log("C" + urls.length);
      });
      console.log("D" + urls.length);
   } else {
      console.log("E" + urls.length);
      $.showParameters.url = urls[0];
      $.showParameters.parameters = {};
      $.showParameters.checkhandlers = {};
      $.showParameters.breadcrumbs.push($.showParameters.url);
      loadPage();
      console.log("F" + urls.length);
   }
}

function resetShowParameters(url) {
   $.showParameters.url = url;
   $.showParameters.parameters = {};
   $.showParameters.breadcrumbs = [$.showParameters.url];
   $.showParameters.checkhandlers = {};
}

$("#stats").click(function() {
   resetShowParameters(base_url + "/browsing/stats");
   loadPage();
});
$("#go").click(function() {
   resetShowParameters($('#theQueryUrl').val());
   loadPage();
});

loadPage();
