
var base_url = "http://127.0.0.1:5280/"

URITemplate.prototype.variables = function() {
  return [].concat.apply([], this.parts.map( p =>  (p.variables || []).map(v => v.name )));
}

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail());
  $.access_token = googleUser.getAuthResponse().id_token;
  var dt = new Date().toLocaleString();
  $("#currentuser").html("Current user: " + profile.getName() + ".  time=" + dt + " id=" + profile.getId() + " email " + profile.getEmail() + "// " + $.access_token + "// " + base_url + 'browsing/tokensigningoogle');
  $.ajax({
     type: "POST",
     headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
	},
     url: base_url + 'browsing/tokensigningoogle',
     data: 'idtoken=' + $.access_token,
     success: function(succ) {
        console.log('Signed in ');
     }
  }).fail(function(fl) { console.log("FAIL"); console.log(fl); });
  /*var xhr = new XMLHttpRequest();
  xhr.open('POST', base_url + 'browsing/tokensigningoogle');
        xhr.setRequestHeader('Content-Type',
                'application/x-www-form-urlencoded');
        xhr.onload = function() {
            console.log('Signed in as: ' + xhr.responseText);
        };
        xhr.send('idtoken=' + $.access_token);
	*/
}

$.openIdGetJson_deprecated = function(theUrl, theParameters, theSucces, theError) {
   return $.ajax({
      url: theUrl, type: 'GET', dataType: 'json',
      success: theSuccess, error: theError,
      beforeSend: function (xhr) {
          xhr.setRequestHeader("Authorization", "BEARER " + $.access_token);  
      }
   });
}

$.postJSON = function(url, data, callback) {
    return jQuery.ajax({
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    'type': 'POST',
    'url': url,
    'data': JSON.stringify(data),
    'dataType': 'json',
    'success': callback
    });
};

$.postFileUpload = function(url, that, callback) {
    return jQuery.ajax({
    headers: {
        'Accept': 'multipart/form-data',
        'Content-Type': 'multipart/form-data'
    },
    'type': 'POST',
    'url': url,
    'data': new FormData(that),
    'success': callback
    });
};

/*
 * separate true url from bracketed syntax at the end listing REST parameters
 * i.e.  http://abc/def/{?thi,asdf} ->
 *     { url: http://abc/def/      parameterNames:[thi,asdf]  }
 */
function url_parts(url) {
       var template = new URITemplate(url);
       return {
         url : template.expand({}),
         parameterNames : template.variables()
       }
/*       var curly = url.indexOf("{");
       if (curly > -1) {
           return {
               url : url.substring(0, curly),
               parameterNames : url.substring(curly+2,url.length-1).split(",")
           }
       }

       /*else if (url.indexOf("?") > -1) {
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
       } *\/
       else {
           return {
               url : url,
               parameterNames : []
           }
       }*/
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



function persistChecks() {
}

function check_div_id(nicename) { return "checkDiv" + nicename; }

function insert_group_check_div(nicename, color, humanname, param_id, content) {
  if (!(nicename in $.showParameters.checkhandlers)) {
      $("#checkHandlingArea").append('<div id="' + check_div_id(nicename) + '" class="checkContainer"' + color + '> ' +
          humanname + ': ' +
          '<input class="checkToggle checkButtons" value="Toggle Checkboxes" nicename="' + nicename + '" type=button>' +
          '<input class="checkActivate checkButtons veryVisibleButton" disabled="true" value="Submit Checkboxes" nicename="' + nicename + '" type=button>' +
          "</div>");
      $.showParameters.checkhandlers[nicename] = 1;
  }
  if (!("checkhandlerParams" in $.volitile)) { $.volitile.checkhandlerParams = {}; }
  if (!(param_id in $.volitile.checkhandlerParams)) {
    $("#" + check_div_id(nicename)).append(content);   // NOT RIGHT -- put inside DIV
    $.volitile.checkhandlerParams[param_id] = 1;
  }
}

function parameter_input(paramname, itemname, fullurl) {
  var humanname = itemname;
  var nicename = name2token(humanname);
  var color = ' style="background: ' + hashColor(nicename,true) + '" ';
  var buttoncolor = ' style="background: ' + hashColor(nicename,false) + '" ';
  var param_id = "param_" + nicename + "_" + paramname;
  if (itemname.startsWith("chk:")) {
    humanname = itemname.split(":")[1];
    nicename = name2token(humanname);
    color = ' style="background: ' + hashColor(nicename,true) + '" ';
    buttoncolor = ' style="background: ' + hashColor(nicename,false) + '" ';
    param_id = "param_" + nicename + "_" + paramname;
    insert_group_check_div(nicename, color, humanname, param_id,
      paramname + ": <input id='" + param_id + "' desturl='" + fullurl + "' type=text></input>"
    );
    return "";
  } else if (paramname.startsWith("file_")) {
    return paramname + ": <input id='" + param_id + "' name='" + paramname + "' desturl='" + fullurl + "' type=file></input>";
  } else {
    return paramname + ": <input id='" + param_id + "' desturl='" + fullurl + "' type=text></input>";
  }
}

function actuator(itemname, fullurl) {
    if (itemname.startsWith("chk:")) {
         var humanname = itemname.split(":")[1];
         var nicename = name2token(humanname);
         var color = ' style="background: ' + hashColor(nicename,true) + '" ';
         var buttoncolor = ' style="background: ' + hashColor(nicename,false) + '" ';
         insert_group_check_div(nicename, color, humanname, "", "");
         return "<div class='checkContainer'" + color + "'><input class='" +
                nicename + " checkmark' value='on' nicename='" + nicename + "' desturl='" + fullurl + "' type=checkbox></input>" + humanname + "</div>";
    } else {
         var enabled = (fullurl.length > 0) ? "" : "disabled";
         if (false && itemname == "Upload") {
           return
             "<input " + enabled + " class='actions myButtonTight' type='file' " +
             " id='go_" + itemname + "' value='" + itemname + "'" +
             " desturl='" + fullurl + "'></input>";
         } else {
           return "<input " + enabled + " class='actions myButtonTight' type=submit " +
             " id='go_" + itemname + "' value='" + itemname +
             "'  desturl='" + fullurl + "'></input>";
         }
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
           if (parts.parameterNames.length > 0) {
               var chk = item.startsWith("chk:");
               if (!chk) { html += "<div class='act'>"; }
               html += "<form class='uploadform' id='form_" + item + "' enctype='multipart/form-data' method=POST>";
               parts.parameterNames.forEach(function (p) {
                   html += parameter_input(p, item, fullurl);
               });
               html += actuator(item,fullurl);
               html += "</form>";
               if (!chk) { html += "</div>"; }
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

function savecookielist(l) {
    if (l.length == 0) {
        document.cooke="cks=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } else {
        document.cookie = "cks=" + encodeURIComponent(l.join(",")) + "; path=/";
    }
}

function loadcookielist() {
    var cks = document.cookie.split(";");
    for (var i = 0; i< cks.length; i++) {
        if ($.trim(cks[i]).startsWith("cks=")) {
            ck = $.trim(cks[i]);
            return decodeURIComponent(ck.substring(4,ck.length)).split(",");
        }
    }
    return [];
}

/*
 *  Enable or disable buttons and checkmarks so the user can only
 *  touch controls that will do something useful.
 *
 *  checkmark = the check boxes next to each row
 *  nicename = determines the color and function of a coordinated set of checkboxes and top-of-form stuff
 *  toggle = the button that inverts state of all checkboxes of a particular color
 *  activate = button that submits the form for all checkboxes of that matching color.
 */
function enableIfAppropriate(nicename) {
    var anychecked = false;
    console.log("Maybe enabling button: checking " + "."+nicename);
    $("." + nicename).each(function(i,chkbox) {
        console.log("checking " + chkbox);
        anychecked = anychecked || $(chkbox).prop("checked");
    });
    console.log("  anychecked=" + anychecked);
    if (anychecked) {
      // Hide all check, toggle, and activates EXCEPT for this "nicename" category
      $(".checkmark").prop("disabled", true);
      $(".checkToggle").prop("disabled", true);
      $(".checkActivate").prop("disabled", true);
      $("." + nicename).prop("disabled", false);
      $(".checkToggle[nicename='" + nicename + "']").prop("disabled", false);
    } else {
      // Otherwise, activate all checks and toggles (but, not activate)
      $(".checkToggle").prop("disabled", false);
      $(".checkmark").prop("disabled", false);
    }
    $(".checkActivate[nicename='" + nicename + "']").prop("disabled", !anychecked);
}

function insertParameters(url, params) {
  var t = new URITemplate(url);
  return t.expand(params);
}

function substituteParameters(desturl, itemname) {
  var parts = url_parts(desturl);
  parameters = {};
  parts.parameterNames.forEach(function(p) {
      var paramid = "#param_" + itemname + "_" + p;
      parameters[p] = $(paramid).val();
   });
   return parameters;
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
    $.showParameters.action = "";
    loadPage();
  };
  $(document).on('keydown', '#theQueryUrl', function(event) {
      if (event.keyCode == 13) {
          $("#queryUrlForm").submit();
          return false;
      }
  });
  $(document).on('click', '.checkToggle', function(event) {
    var nicename = $(event.target).attr("nicename");
    console.log("Toggling everything with class " + nicename);
    $("." + nicename).each(function(i,chkbox) {
        console.log("Toggling " + chkbox);
        $(chkbox).attr("checked", !$(chkbox).attr("checked"));
    });
    enableIfAppropriate(nicename);
  });
  $(document).on('click', '.checkmark', function(event) {
    var nicename = $(event.target).attr("nicename");
    enableIfAppropriate(nicename);
  });
  $(document).on('click', '.checkActivate', function(event) {
    var btn = $(event.target);
    var nicename = btn.attr("nicename");
    postUrls = [];
    $("." + nicename).each(function(i,chkbox) {
        console.log("Adding " + $(chkbox) + " if appropriate");
        if (chkbox.checked) {
            var parts = url_parts(chkbox.getAttribute("desturl"));
            console.log("URL PART IS " + parts.url)
            postUrls.push([parts.url,
              substituteParameters(chkbox.getAttribute("desturl"), nicename)]);
        }
    });
    loadMultiplePages(postUrls);
  });
  $(document).on('submit', '.uploadform', function(event) {
    event.preventDefault();
    var form = this;
    $(this).ajaxSubmit({
      target: '#output',
      success: function (result, statusText, xhr, $form) {
           if (!("_links" in result)) { result._links = {}; }

           [result, pagination] = prepare_pageinfo(result);
           $("#output").html("<b>Upload status: " + statusText + "!" +
              "</b><br/>" + links(result._links) + pagination + maketable(result));
           displayBreadcrumbs();
           $(window).trigger('resize.stickyTableHeaders');
      }
    });
/*
    $.postJSON($(this).attr('action'), $(this), function (result) {
         if (!("_links" in result)) { result._links = {}; }

         [result, pagination] = prepare_pageinfo(result);
         $("#output").html(links(result._links) + pagination + maketable(result));
         displayBreadcrumbs();
         $(window).trigger('resize.stickyTableHeaders');
    })
    .fail(function(jqXHR, textStatus, error) {
        $("#output").html(textStatus + "<br>" + error );
    });
*/
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
        if (!parts.url.startsWith(base_url) || parts.url.indexOf("/brat/index") > -1) { 
            window.open(parts.url, "_external");
            return;
        }
        $.showParameters.breadcrumbs.push(parts.url);
        $.showParameters.url = parts.url;
        //window.history.pushState({url: parts.url, crumbs: $.showParameters.breadcrumbs }, "");
        window.history.pushState($.showParameters,"");
        $.showParameters.parameters = substituteParameters(btn.attr("desturl"), btn.val());
        $.showParameters.action = btn.attr("id");
        $.showParameters.checkhandlers = {};
/*         parts.parameterNames.forEach(function(p) {
            var inputid = "#go_" + btn.val();
            var paramid = "#param_" + btn.val() + "_" + p;
            console.log("paramid = ", paramid);
            $.showParameters.parameters[p] = $(paramid).val();
            console.log("paramid contains " ,$(paramid).val());
         });
         console.log("params = ", $.showParameters.parameters);*/
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
    var html1 = "";
    var html2 = "";
    if ("_embedded" in result) {
        keys = Object.keys(result._embedded);
        items = result._embedded[keys[0]];
        html2 = do_maketable(result, keys, items, "embedded");
    }
        items = [{}];
        keys = [];
        Object.keys(result).forEach(function(k) {
            if (k != "_embedded" && k != "_links" && (k != "page" || !("number" in result[k]))) {
               keys += k;
               items[0][k] = result[k];
            }
        });
    html1 = do_maketable(result, keys, items, "entity");
    return html1 + "<p>" + html2;
}

function do_maketable(result, keys, items, tablestyle) {
    var html = "";
    if (is_list_of_objects(items)) {
        if (items.length == 0) { return "(no data)"; }
        var columns = key_union(items);

        html = '<table id=stickyheaders class="' + tablestyle + ' responstable" width=100% border=1><thead class="tableFloatingHeaderOriginal"><tr>';
        columns.forEach(function(entry) {
            html += "<th class='tableCol" + entry + "' >" + entry + "</th>";
        });
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

$.volitile = { }
$.showParameters = {
   url: base_url + "/browsing/stats/",
   breadcrumbs: [base_url + "/browsing/stats/"],
   parameters: {},
   checkhandlers: {}
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
   $.volitile = {};
   showHistory();
   var returnData = "";
   $("#theQueryUrl").val($.showParameters.url);
   console.log("Showparameters action = " + $.showParameters.action);
   if ($.showParameters.action == "go_Download") {
     $("#output").html("Waiting for response from server.....");
     $("#checkHandlingArea").html("");
     window.open(
       (new URITemplate($.showParameters.url)).expand($.showParameters.parameters),
      "_blank");
      $("#output").html("Your download has completed.");
      window.history.go(-1);
      $.showParameters.action = "";
   } else if ($.showParameters.action == "go_Upload") {

      var url = ((new URITemplate($.showParameters.url)).expand($.showParameters.parameters)).toString();
      $("#form_Upload").attr("action", url);
      $("#form_Upload").submit();


      //$("#output").html("Waiting for response from server.....");
      //$("#checkHandlingArea").html("");
      $.showParameters.action = "";
   } else  {
     $("#output").html("Waiting for response from server.....");
     $("#checkHandlingArea").html("");
     $.getJSON($.showParameters.url, $.showParameters.parameters, function(result) {
          if (!("_links" in result)) { result._links = {}; }

          [result, pagination] = prepare_pageinfo(result);
          $("#output").html(links(result._links) + pagination + maketable(result));
          displayBreadcrumbs();
          $(window).trigger('resize.stickyTableHeaders');
     }, function(jqXHR, textStatus, error) {
         var msg = "";
         try {
           msg = $.parseJSON(jqXHR.responseText).message;
         } catch (e) {
           msg = jqXHR.responseText + " error: " + e;
         }
         $("#output").html(textStatus + "<br>" + error + "<br><b>" + msg + "</b>" + " <br><table border=1><tr><td> " + jqXHR.responseText  + "</td></tr></table>");
     });
   }
};

function loadMultiplePages(urls) {
   console.log("LMP " + urls);
   $("#output").html("" + urls.length + " actions being submitted... please wait");
   $("#checkHandlingArea").html("");
   if (urls.length > 1) {
      console.log("A" + urls.length);
      $.getJSON(urls[0][0], urls[0][1], function(result) {
        console.log("B" + urls.length);
        loadMultiplePages(urls.slice(1));
        console.log("C" + urls.length);
      }, function() {} );
      console.log("D" + urls.length);
   } else {
      console.log("E" + urls.length);
      window.history.pushState($.showParameters,"");
      $.showParameters.url = urls[0][0];
      $.showParameters.parameters = urls[0][1];
      $.showParameters.checkhandlers = {};
      $.showParameters.breadcrumbs.push($.showParameters.url);
      loadPage();
      console.log("F" + urls.length);
   }
}

// String hash from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery

function stringHash (s) {
  var hash = 0, i, chr, len;
  if (s.length === 0) return hash;
  for (i = 0, len = s.length; i < len; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

//Return a color unique for this key, brigher if selected.
//Of course the color can't really be unique because there are more keys
//in the world than colors; but the algorithm tries to make similar strings
//come out different colors so they can be distinguished in a chart or graph"""
function hashColor(key, selected) {

    function tw(t) { return t ^ (t << (t % 5)) ^ (t << (6 + (t % 7))) ^ (t << (13 + (t % 11))); }
    function hex2(t) { return ("00"+t.toString(16)).substr(-2); }
    var theHash = tw(stringHash(key) % 5003)
    var ifsel = selected?0x80:0x00;
    r = ifsel | (theHash & 0x7f);
    g = ifsel | ((theHash >> 8) & 0x7F);
    b = ifsel | ((theHash >> 16) & 0x7F);
    return "#" + hex2(r) + hex2(g) + hex2(b);
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
$("#lsExport").click(function() {
   resetShowParameters(base_url + "/browsing/lightsideExports");
   loadPage();
});
$("#bratExport").click(function() {
   resetShowParameters(base_url + "/browsing/bratExports");
   loadPage();
});
$("#go").click(function() {
   resetShowParameters($('#theQueryUrl').val());
   loadPage();
});

loadPage();
