var map;
var geocoder;
var baseIcon;
var selected = -1;
var numberOfResultsPerRequest = 10;
var busy = false;
var pending = false;
var factual_busy = false;
var factual_pending = false;
var loadTill;	//How many resultls we've already loaded
var entryForMap;	//Stores the results from same query keywords for displaying markers on the map, will be appended after loadMoreElements()
var infowindow;
var markersArray = [];
var shadow;
var citymedia_ip = "127.0.0.1"; // required by citysearch api
var currentLatForCalDistance;
var currentLngForCalDistance;
var currentLng1;
var currentLat1;
var currentLng2;
var currentLat2;
var infowindowIsOpen = false;
var adjusting_bounding = false;

var socialLinkImages = {"foursquare":{"image":"<img height='22px' src='http://playfoursquare.s3.amazonaws.com/press/logo/icon-36x36.png' />","get":"url","display":["checkinsCount"],"ping":0},
						"yelp":{"image":"<img height='35px' src='yelplogo.jpg' />","get":"url","display":["checkinsCount"],"ping":1},
						"gowalla":{"image":"<img height='24px' src='http://static.gowalla.com/gowalla-connect-buttons/button-gowalla_connect-24ool.png' />","get":"url","display":["checkinsCount"],"ping":0},
						"loopt":{"image":"<img height='24px' src='looptLogo.jpeg' />","get":"url","display":["checkinsCount"],"ping":0},
						"allmenus":{"image":"<img height='28px' src='allmenusLogo.png' />","get":"url","display":["checkinsCount"],"ping":0},
						"citysearch":{"image":"<img height='20px' src='cityLogo.png' />","get":"url","display":["checkinsCount"],"ping":2 , "api_endpoint":"http://api.citygridmedia.com/content/places/v2/detail?listing_id=%LISTING_ID%&client_ip=%CLIENT_IP%&publisher=10000001170&format=json"},
						"yahoolocal":{"image":"<img height='22px' src='yahooLogo.png' />","get":"url","display":["checkinsCount"],"ping":0},
						"yp":{"image":"<img height='24px' src='ypLogo.jpg' />","get":"url","display":["checkinsCount"],"ping":0}
					  };

function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
	  var rv = -1; // Return value assumes failure.
	  if (navigator.appName == 'Microsoft Internet Explorer')
	  {
	    var ua = navigator.userAgent;
	    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	    if (re.exec(ua) != null)
	      rv = parseFloat( RegExp.$1 );
	  }
	  return rv;
}
function checkVersion()
{
	  //var msg = "You're not using Internet Explorer.";
	  var ver = getInternetExplorerVersion();
	  var msg = "";
	  if ( ver > -1 )
	  {
	    if ( ver < 9.0 ) 
	    {	
	    	msg = "You should upgrade your copy of Internet Explorer. OmniPlaces.com is available to users who use the following browsers: Chrome v5 or higher, Firefox v3/4, Safari v5 for Mac and Internet Explorer v9.";
	    	alert( msg );
	    }
	  }
}

//generate icons for markers on the map
function markerIcon(index) {
	/*if(index>=26)//If we have more than 26 markers, those after 26th will have identical icons
		return "http://www.google.com/mapfiles/marker.png";	
	else{
		var letter = String.fromCharCode("A".charCodeAt(0) + index);
		return "http://www.google.com/mapfiles/marker" + letter + ".png";
	}*/
	
	return "marker.png";
}

//generate icons for entries on the list
function markerIcon2(index) { 
	if(index>=26)//If we have more than 26 entries, those after 26th will have identical icons
		return "http://www.google.com/mapfiles/circle.png";	
	else{
		var letter = String.fromCharCode("A".charCodeAt(0) + index);
		return "http://www.google.com/mapfiles/circle" + letter + ".png";
	}
}

//Add a marker on the map
function addMarker(values, markerIcon) {
	var point = new google.maps.LatLng(convertToDegree(values[8]),convertToDegree( values[9]));
	var marker = new google.maps.Marker({
			icon: markerIcon,
			shadow: shadow,
			position: point,
			title:values[1]
	});

	google.maps.event.addListener(marker, "click", function () {
		//marker.openInfoWindowHtml(genText(values));
		infowindow.setContent(genText(values));
		infowindow.open(map, this);
		infowindowIsOpen = true;
		//queryFactual(values[11], marker);
	});
	marker.setMap(map);	
	markersArray.push(marker);
	return marker;
}

function getReviewPluralOrSingular(count)
{
	if (count < 2)
		return "&nbsp;review";
	else
		return "&nbsp;reviews";
}

function addToReviewList(payload)
{
	var Dom = YAHOO.util.Dom;
	var list = Dom.get("social-reviews-list"),
			items = Dom.getChildren(list),
		    nItemNumber = (items.length + 1),
			fragment = Dom.get("social-reviews-container").ownerDocument.createElement("div");
	
	if (nItemNumber == 1)
	{
		fragment.innerHTML = '<li id ="li-'+ nItemNumber +'">' + "<b>Reviews:</b>"  +'</li>';
		list.appendChild(fragment.firstChild);
		nItemNumber++;	
	}
	
	fragment.innerHTML = '<li id ="li-'+ nItemNumber +'">' + payload  +'</li>';
	list.appendChild(fragment.firstChild);
}

function prepareYelpReviewItem(response, item_url)
{
	var html="<ul class=\"city_search_reviews\"><li class=\"review_list_item_profile\"><img src="+response.user.image_url+" alt=\""+response.user.name +"\"></li><li class=\"review_list_item_except\"><p><img src=\""+ response.rating_image_url +"\" alt=\"Yelp Rating\"><br>"+response.excerpt+"<a href=\""+item_url+"#hrid:"+response.id+"\" target=\"_blank\">read more</a>.</p> </li><li class=\"review_list_item_poster\">Posted by <a href=\"http://www.yelp.com/user_details?userid="+response.user.id+"\" target=\"_blank\">"+response.user.name+"</a> on <a href=\"http://www.yelp.com\" target=\"_blank\">Yelp.com</a></li></ul>";
	return html;
}

function prepareCitySearchReviewItem(response, item_url)
{
	var html="<ul class=\"city_search_reviews\"><li class=\"review_list_item_profile\"><img src=\"http://media3.px.yelpcdn.com/static/201012161986305257/img/gfx/blank_user_medium.gif\" alt=\""+response.review_author +"\"></li><li class=\"review_list_item_except\"><p><img src=\"images/citysearch/ratings/"+response.review_rating+".gif\" alt=\"CitySearch Rating\"><br>"+response.review_text+"<a href=\""+response.review_url+"\" target=\"_blank\">read more</a>.</p> </li><li class=\"review_list_item_poster\">Posted by <a href=\""+response.review_url+"\" target=\"_blank\">"+response.review_author+"</a> on <a href=\"http://www.citysearch.com\" target=\"_blank\">CitySearch.com</a></li></ul>";
	return html;
}

function displaySocialData(response, socialnamespace)
{
	if (socialnamespace == "yelp")
	{	
		var socialElementName = "loadSocial-"+ socialnamespace +"-payload";
		var loadSocialLinkData = document.getElementById(socialElementName);
		
		var htmlTemp = "";	
		//http://www.yelp.com/developers/documentation/v2/business
		if(response.rating_img_url)
		{
			loadSocialLinkData.innerHTML = "<a href="+response.url+" target=\"_blank\" style='text-decoration:none'><img src="+response.rating_img_url+" style=\"padding-bottom: 2px; vertical-align: middle;\"\>&nbsp;"+ response.review_count + getReviewPluralOrSingular(response.review_count)+"</a>";

			for ( var iter = 0; iter < response.reviews.length; ++iter)
			{			
				var temp = prepareYelpReviewItem(response.reviews[iter], response.url );
				addToReviewList( temp );
			}			
		}
		else
		{
			//loadSocialLinkData.innerHTML = "<span style='font-weight:bold;color:#FF3900;'>Oops! No ratings yet</span>"
		}		
	}
	else if 
	(socialnamespace == "citysearch")
	{
		var socialElementName = "loadSocial-"+ socialnamespace +"-payload";
		var loadSocialLinkData = document.getElementById(socialElementName);
				
		if (response.locations.length > 0 &&response.locations[0].review_info.overall_review_rating != null)
		{								
			loadSocialLinkData.innerHTML = "<a href="+response.locations[0].urls.profile_url+" target=\"_blank\" style='text-decoration:none'><img src='images/citysearch/ratings/"+response.locations[0].review_info.overall_review_rating+".gif' style=\"padding-bottom: 2px; vertical-align: middle;\">&nbsp;"
										+ response.locations[0].review_info.total_user_reviews + getReviewPluralOrSingular(response.locations[0].review_info.total_user_reviews)+"</a>";

			for(var iter = 0; iter < response.locations[0].review_info.total_user_reviews_shown; ++iter)
			{		
				var temp = prepareCitySearchReviewItem(response.locations[0].review_info.reviews[iter], response.locations[0].urls.profile_url );
				addToReviewList(temp);
			}
		}
		else
		{
			if (response.locations[0].review_info.total_user_reviews != 0)
			{
				loadSocialLinkData.innerHTML = "&nbsp;<a href="+response.locations[0].urls.profile_url+" target=\"_blank\" style=\"padding-bottom: 2px; text-decoration:none; vertical-align: middle;\">&nbsp;"+ response.locations[0].review_info.total_user_reviews + getReviewPluralOrSingular(response.locations[0].review_info.total_user_reviews)+"</a>";
			}
		}	
	}	
}

function displayFactualData(response, marker)
{
	//alert(citymedia_ip);
	var socialLink_Inventry = {"foursquare":{"seen":0},
						"yelp":{"seen":0},
						"gowalla":{"seen":0},
						"loopt":{"seen":0},
						"allmenus":{"seen":0},
						"citysearch":{"seen":0},
						"yahoolocal":{"seen":0},
						"yp":{"seen":0},
					  };
	var loadSocial = document.getElementById('loadSocial');
	var loadMoreLinks = document.getElementById('loadMoreLinks');
	loadSocial.removeAttribute("class");
		
	//dirty solustion for now: display yelp's rating first
	for (var iter = 0; iter < response.response.included_rows; ++iter )
	{
		if ( socialLinkImages[response.response.data[iter].namespace] != null 
			    && socialLinkImages[response.response.data[iter].namespace].ping != 0 
				&& socialLink_Inventry[response.response.data[iter].namespace].seen == 0 )
		{
			socialLink_Inventry[response.response.data[iter].namespace].seen = 1;
			var link_namespace = response.response.data[iter].namespace;
			var image_url = socialLinkImages[response.response.data[iter].namespace].image;
			var displaySocialText_Priority = "<table class='social-links'><tr><td><div id='loadSocial-"+ link_namespace +"-link'><a href=\""+ response.response.data[iter].url +"\" target=\"_blank\">" + image_url + "</a></div></td> <td><div id='loadSocial-"+ link_namespace +"-payload'></div></td></tr></table>";
			loadSocial.innerHTML += displaySocialText_Priority;
			
			if ( socialLinkImages[response.response.data[iter].namespace].ping == 1 ) {
				YUI().use("jsonp", "node",function (Y) {						
						//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
						var url = "http://demo.bimaple.com/"+link_namespace+"_o_one_jsonp?url="+response.response.data[iter].url+"&callback={callback}";
						//var url     = "http://example.com/service.php?callback={callback}",
						service = new Y.JSONPRequest(url, {
						on: {
							success: displaySocialData
						},
						timeout: 1500,          // 1 second timeout
						args: [link_namespace] // e.g. handleJSONP(data, date, number)
					});
					service.send();
				});
			}
			else {
						
					YUI().use("jsonp", "node",function (Y) {
						//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
						var url =  socialLinkImages[response.response.data[iter].namespace].api_endpoint + "&callback={callback}&review_count=3";
						url = url.replace(/%CLIENT_IP%/, citymedia_ip);
						var re = new RegExp("/[0-9]+/");
						var listing_id = String(re.exec(response.response.data[iter].url));
						listing_id = listing_id.substring(1,listing_id.length - 1);
						url = url.replace(/%LISTING_ID%/, listing_id);
						//var url     = "http://example.com/service.php?callback={callback}",
						service = new Y.JSONPRequest(url, {
						on: {
							success: displaySocialData
						},
						timeout: 1500,          // 1 second timeout
						args: [link_namespace] // e.g. handleJSONP(data, date, number)
					});
					service.send();
				});
			}			
		}
	}

	var displaySocialText_Priority = "<table id='moreLinks-table' class='social-links'><tr id='moreLinks-table-row'>";
	//var displaySocialText_MoreLinks = "<div id='moreLinks'";
	
	var good_links_counter = 0;
	for (var iter = 0; iter < response.response.included_rows; ++iter )
	{
		if (response.response.data[iter].namespace in socialLinkImages)
		{
			if(socialLink_Inventry[response.response.data[iter].namespace].seen == 0)
			{
				var link_namespace = response.response.data[iter].namespace;
				var image_url = socialLinkImages[response.response.data[iter].namespace].image;
				
				socialLink_Inventry[response.response.data[iter].namespace].seen = 1;

				displaySocialText_Priority += "<td><div id='loadSocial-"+ link_namespace +"-link' class='priorityIcon'><a href=\""+ response.response.data[iter].url +"\" target=\"_blank\">" + image_url + "</a></div> <div id='loadSocial-"+ link_namespace +"-payload'></div></td>";
				good_links_counter++;
			}
		}
		else
		{
			//displaySocialText_MoreLinks += "<span class='moreSocialLinks'> &middot;</span><a class='moreSocialLinks' href=\""+response.response.data[iter].url +"\" target=\"_blank\">" + response.response.data[iter].namespace+ "</a><BR>";
		}		
	}
	displaySocialText_Priority += "</tr></table>";//<div id='moreButton'><a class='clickForMore' href='#' onClick='showMoreLinks()'>>> Click for more references</a></div>";
		
	loadSocial.innerHTML += displaySocialText_Priority;
	//displaySocialText_MoreLinks += "</div>";
	
	//Display noisy links like manta, loopt, fwix, etc
 	//if (good_links_counter < 2)
	//{	
		//loadSocial.innerHTML += displaySocialText_MoreLinks;
	//}
	
	document.getElementById('loadSocial').style.marginBottom = "0px";
		
	factual_busy = false;
	if(factual_pending)
	{
		factual_pending = false;
	}
}

function showMoreLinks()
{
	var element = document.getElementById( 'moreLinks' );
	element.style.display="";
	element = document.getElementById( 'moreButton' );
	element.style.display="none";

}

//Send query to the Factual broker
function queryFactual(factualId, marker)
{
	if(factual_busy)
	{
		factual_pending = true;
			return;
	}
	
	YUI().use("jsonp", "node",function (Y) {
		//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
		var url = "http://demo.bimaple.com/factual_o_one_jsonp?factual_id="+factualId+"&callback={callback}";

		service = new Y.JSONPRequest(url, {
			on: {
		        success: displayFactualData,
		    },
		    timeout: 3000,          // 3 second timeout
		    args: [marker] // e.g. handleJSONP(data, date, number)
		});
		service.send();
	});
	factual_busy = true;
}

//Bind a marker with corresponding entry
function bindEntryMarker(entry, marker, values) {
	handleEvent(entry, "click", function(){
		infowindow.setContent(genText(values));
		infowindow.open(map, marker);
		infowindowIsOpen = true;
		//queryFactual(values[11], marker);
});
}

//Generate text to display above the marker after clicked
function genText(record) {
		
	var source_address = document.getElementById('location').value;	
	var dest_address = record[2] + "+" + record[3] + "+" + record[4] + "+"+ record[5]; 	
	var html = "<div class='infoWindowTitle'>" + record[1]	//record[1]:title
	+ "</div>"
	+ "<a href='http://maps.google.com/maps?saddr="+source_address+"&daddr="+dest_address+"' target='_blank'><button id='getdirections'>Get Directions</button></a>"	
	+ "<div style='margin: 5px 0 2px 0;'><span style='font-size: 12pt;color: #086ca2; line-height:130%'>" 
	+ record[2] + "<br>" 	//record[2]:street address
	+ record[3] + ", " + record[4] + " " + record[5]  
	+"<br>";
	
	if (record[6] != "")
	{
		html+= "Tel: <a href='tel:"+record[6]+"' style='text-decoration: none;'>" + record[6] + "</a><br>";
	}
	 
	html+= "</span></div>";
		
	return html;	
} 


//Generate text to display below an entry on the list
function genTextG(record, regG) {	
        var texts = record[7];
	return "<div style='color:#4d4d4d'>" + (highlight(textPreview(texts.replace(/~/g," "), regG, 10, 150, 150),regG,"highlight","highlight1")+"<br>")+"</div>"	//record[5]:Catagories
	+ highlight(textPreview(record[2], regG, 10, 150, 150),regG,"highlight","highlight1")+"<br>" 	//record[2]:street address
	+ record[3] + ", " + record[4] + " " + record[5] + "<br>"
	+ "<a href='tel:"+record[6]+"' style='text-decoration: none;'>" + highlight( record[6], regG, "highlight","highlight1")+ "<br>"; //record[3]:phone number
}

//Convert the unit of longitude and latitude from radius to degree
function convertToDegree(radians) {
	return radians;
	//return degree = radians * 180 / 3.1415926;
}

function map_div_element_resize(){  
	var divelem = document.getElementById("map_canvas");  
	var htmlheight = document.getElementById("yui-gen8").style.height;
	divelem.style.height = htmlheight;
}

function clearOverlays() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
	}
	markersArray.length = 0;
}

function displayMarkers() {
        adjusting_bounding = true;
	clearOverlays();
/*	map.setCenter(home);
	map.setZoom(16);

	var mbr = new google.maps.LatLngBounds(map.getCenter(), map.getCenter());
*/	var mbr2 = new google.maps.LatLngBounds(map.getCenter(), map.getCenter());
	
	var i = 0;

	//Add markers to the map
	for(var k in entryForMap){
		var icon = markerIcon(i);
		var marker = addMarker(entryForMap[k], icon);
		
		//entryForMap[k][14] = marker;
		mbr2.extend(new google.maps.LatLng(convertToDegree(entryForMap[k][8]), convertToDegree(entryForMap[k][9])) );
		bindEntryMarker(document.getElementById(k), marker, entryForMap[k]);
		i++;
	}

	//Adjust the map range to contain every marker
	while((!map.getBounds().contains(mbr2.getNorthEast()) || !map.getBounds().contains(mbr2.getSouthWest())) && map.getZoom() > 9)
	{
		//map.zoomOut(map.getCenter(), true);
		map.setZoom(map.getZoom() - 1);
	}

	//map.setZoom(map.getZoom() - 1);

}

/*
function boundMarkers(centerLat, centerLng){

	map.setZoom(map.getZoom() - 1);
//	while((!map.getBounds().contains(mbr2.getNorthEast()) || !map.getBounds().contains(mbr2.getSouthWest())) && map.getZoom() > 9)
//	{
		//map.zoomOut(map.getCenter(), true);
//		map.setZoom(map.getZoom() - 1);
//	}
}
*/

//This function is not in use any more
function bindEntry2(i) {
	handleEvent(document.getElementById("entry_" + i), "click", function(){onselect();});
}


function getExactOrFuzzyMatchBooleanArray(values, matchingKeywords)
{
	var ed = new Array();
	//Tell if it's exact match or fuzzy match
	for (var iter = 0; iter < matchingKeywords.length; iter++)
	{
		var keyword = matchingKeywords[iter].toLowerCase();
		if(searchIndex(keyword, values) == -1)
		{
			ed[iter]=1;
		}
		else
		{
			ed[iter]=0;
		}
	}
	return ed;
}

function getHtmlOfSearchResultItem(searchResultItem, nItemNumber, values)
{
	var resultHitTitle = searchResultItem.record[1];
	var matchingKeywords = searchResultItem.matching_prefix;
	var resultHitData =  searchResultItem.record;
	var ed = getExactOrFuzzyMatchBooleanArray(values, matchingKeywords);
	var regex = prepareRegex(matchingKeywords, ed); //Prepare regular expression for highlighting
	
	var html = "<li id='entry_" + nItemNumber;// + "' onmouseover='shakeMarker(" + nItemNumber + ")' " + "onmouseout='shakeMarker(" + nItemNumber + ")' ";
	html += "' class='entry'>";
	html += "<table style='width:310px; margin:10px 0 0 0'><tr valign='top'><td style='width:25px;'>";
	// add image marker
	var resultListIcon = markerIcon(nItemNumber);
	html += "<div class='result-list-map-icon'><img src='"+resultListIcon+"'>&nbsp;</div>";
	html += "</td><td>"
		
	// add primary title div
	//html += "<div class='result-list-primary-title'>";
	var distance = calculateHaversineDistanceBetweenTwoCoordinates(currentLatForCalDistance, currentLngForCalDistance, resultHitData[8], resultHitData[9]);
	html += "<div class='result-list-primary-title'>" + highlight(resultHitTitle, regex, "highlight","highlight1") + "<span class='distance'>" + distance + " mi</span>" + "</div>";
	//html += "</td><td style='text-align: right; font-weight: bold;'>";
	
	// add secondary details div (address, phone number, etc)
	html += "<div class='result-list-secondary-details'>";
	html += genTextG(resultHitData, regex);
	html += "</td></tr></table>";
	html += "</div>";
			
	html += "</li>";
	return html;
}

function shakeMarker(i)
{
	if (markersArray[i].getAnimation() != null) {
		markersArray[i].setAnimation(null);
	} else {
		markersArray[i].setAnimation(google.maps.Animation.BOUNCE);
	}
}

function setLocation(){
	infowindow.close();
	infowindowIsOpen = false;
	document.getElementById("setLoc").style.display = "none";
	document.getElementById("changeLoc").style.display = "";
	slideLeft('slider');
	if(document.getElementById("slider").value != "")
	{
		document.getElementById("location").innerHTML = "near " + document.getElementById("slider").value;
		locationChangeEvent();
	}
}

function confirmTheSuggestion(info) {

	infowindow.close();
	infowindowIsOpen = false;
	document.getElementById("searchText").value = info.split('@')[0];
	document.getElementById("location").innerHTML = "near " + info.split('@')[1];
	var lat = parseFloat(info.split('@')[2]);
	var lng = parseFloat(info.split('@')[3]);
	if(busy)pending =true;
	else {
		var home = new google.maps.LatLng(lat, lng);

		locationChangeEventWithLatLng(home);
	}
}

//Control the display on the list
function display(response, values) {
	/*
	var scores ="<br>";
	for(var k in titles)
	{
		scores += k + " : " + titles[k][0].s  + "<br>"
	}*/			
	// document.getElementById("debug").innerHTML = "<pre style='font-size: 9pt;'>" + responseText + "</pre>";
	// document.getElementById("debug").innerHTML = (response.t+response.t2)/1000.0+" milliseconds";
	// document.getElementById("debug1").innerHTML = "Searcher time: <font color=\"red\">"+(response.slave_search_max_time)+" milliseconds</font>";
	// document.getElementById("debug2").innerHTML = "MySQL time: <font color=\"red\">"+(response.mysql_time)+" milliseconds</font>";
	// document.getElementById("debug3").innerHTML = "<a class=\"tooltip\" href=\"#\"> Total time<span class=\"classic\">Searcher time + MySQL time + Apache time</span></a>: <font color=\"red\">"+(response.broker_time1)+ " milliseconds<br>" +response.times+"</font>";//+scores;

	if(response.suggestions)
	{
		var data = response.suggestions;
		var html = "";
		for(var i = 0; i < data.length; i++)
		{
			html += "<li style='width:310px; color:#034569; margin:10px 0 0 0'><div class='result-list-primary-title'>";
			html += "Search: " + data[i][0][0]+ "<br><span style='font-weight:bold'>@" + data[i][0][1] + "</span>";

			html += "<a id='"+data[i][0][0]+"@"+data[i][0][1]+"@"+data[i][2]+"@"+data[i][3]+"' style='color:#4d4d4d;font-size:16px;float:right;' href='#' onclick='confirmTheSuggestion(this.id);'>Confirm</a>";
			if(i != data.length-1)
				html += "<br><hr>";
			html += "</div></li>";
		}
		document.getElementById("result-container").innerHTML = "<ul id='result-list'>" + html + "</ul>";
		document.getElementById("loadMoreButton").innerHTML = "End of Results";
		
		busy = false;
		if(pending)
		{
			pending = false;
			query();
		}
	}
	else
	{
		entryForMap = new Array();
		if (response.results.length == 0)
		{
			document.getElementById("result-container").innerHTML = "";
			document.getElementById("loadMoreButton").innerHTML = "No Results";
		}
		else
		{		
			//document.getElementById("timer").innerHTML = "Searcher: " + response.searcher_time + "ms";
			//document.getElementById("timerForMysql").innerHTML = "MySQL: " + response.mysql_time + "ms";
			
			var html = "";
			html+="<ul id='result-list'>";
			for(var index = 0; index < response.results.length; index++)		
			{
				var searchResultItem = response.results[index];
				var nItemNumber = index;
				html += getHtmlOfSearchResultItem(searchResultItem, nItemNumber, values);
			}
			html+="</ul>";
			document.getElementById("result-container").innerHTML = html;
			
			for(var index = 0; index < response.results.length; index++)		
			{
				var resultHitTitle = response.results[index].record[1];
				var matchingKeywords = response.results[index].matching_prefix;
				var resultHitData =  response.results[index].record;
				var nItemNumber = index;
				
			//	var icon = markerIcon(nItemNumber);
			//	var marker = addMarker(resultHitData, icon);
			//	bindEntryMarker(document.getElementById("entry_" + nItemNumber), marker, resultHitData);
				entryForMap["entry_" +nItemNumber] = resultHitData;
			}
			if (response.results.length  < numberOfResultsPerRequest)
			{
				document.getElementById("loadMoreButton").innerHTML = "End of Results";
			}
			else
			{
				document.getElementById("loadMoreButton").innerHTML = "More";
			}
		}
		
		busy = false;
		if(pending)
		{
			pending = false;
			query();
		}
	
		displayMarkers();
		
//		if(response.larger && entryForMap["entry_0"])
//			boundMarkers(entryForMap["entry_0"][8], entryForMap["entry_0"][9]);
	}
}

function locationChangeEventWithLatLng(latLng)
{
	map.setCenter(latLng);
	map.setZoom(14);

	//Prepare the request sent to WSGI
	currentLatForCalDistance = latLng.lat();
	currentLngForCalDistance = latLng.lng();
	currentLat2 = map.getBounds().getNorthEast().lat();
	currentLng2 = map.getBounds().getNorthEast().lng();
	currentLat1 = map.getBounds().getSouthWest().lat();
	currentLng1 = map.getBounds().getSouthWest().lng();
	query();
}

function locationChangeEvent()
{
	if (infowindowIsOpen == true)
		return;
	if (document.getElementById("location").innerHTML == "")
		return;
		
	geocoder.geocode({'address': document.getElementById("location").innerHTML},
		function(results, status) {
			if (results)
			{
				locationChangeEventWithLatLng(results[0].geometry.location);
			}			
	});		
}

function mapChangedEvent()
{
	if(infowindowIsOpen == true)
		return;
	if(map.getBounds() != undefined)
	{
		currentLatForCalDistance = map.getCenter().lat();
		currentLngForCalDistance = map.getCenter().lng();
		currentLat2 = map.getBounds().getNorthEast().lat();
		currentLng2 = map.getBounds().getNorthEast().lng();
		currentLat1 = map.getBounds().getSouthWest().lat();
		currentLng1 = map.getBounds().getSouthWest().lng();
		query();
	}
}

//Send query to the broker
function query() {
	
	if ( currentLngForCalDistance == undefined || currentLatForCalDistance == undefined)
	{
		locationChangeEvent();						
	}
	else
	{
		
		if (document.getElementById("searchText").value.length < 3)
			return;
			
		if(busy)
		{
			pending = true;
			return;
		}
		
		//Scroll back to the top when query keywords change
		/*
		var attributes = {
				scroll: { to: [0, 0] }
		};*/
		//var resultPane = layout.getUnitByPosition('left');
		//alert(document.getElementById("left1").scrollTop);
		//document.getElementById("left1").scrollTop = 0;
		//alert(document.getElementById("left1").scrollTop);
		//resultPane.scroll;
		//YAHOO.util.Event.on('demo-run', 'click', function() {
		//anim.animate();
		//});    		
		var url = "/query_rewriter_m1?"
						+ "&lb_lng=" + currentLng1
                                                + "&lb_lat=" + currentLat1
                                                + "&rt_lng=" + currentLng2
					        + "&rt_lat=" + currentLat2
                                                + "&q=";
		var valuestmp = document.getElementById("searchText").value.split(' ');
		var values = valuestmp;
		for (var i = 0; i < valuestmp.length; i++ )
		{
			if (valuestmp[i]=="")
				values.splice(i,i+1);
		}
		for(var i = 0; i < values.length; i++) {
			if(i)url += "+";
			values[i] = values[i].toLowerCase();
			url += values[i];
		}
		busy = true;
		
		loadTill = numberOfResultsPerRequest;
		url = url + "&limit=" + loadTill;
		url +="&confirmed=false";
		url +="&callback={callback}";
		//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
		//sendAjaxRequest(display, url, values);
		
		YUI().use("jsonp", "node",function (Y) {
				//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
				//var url = "http://demo.bimaple.com/factual_o_one_jsonp?factual_id="+factualId+"&callback={callback}";
				//var url     = "http://example.com/service.php?callback={callback}",
		    	service = new Y.JSONPRequest(url, {
		    	on: {
		            success: display
		        },
		        timeout: 3000,          // 3 second timeout
		        args: [values] // e.g. handleJSONP(data, date, number)
		    });
		    service.send();
		});			
		//sendJsonRequest('JSONscript', url, values);
		
		//alert(result_list_container_scrolled);
		//document.getElementById("result-container").innerHTML = "";
		document.getElementById("loadMoreButton").innerHTML = "Loading...";
	}
}


function initialize() {
	
	var input = document.getElementById('location');
		function successFunction(position) {
			var lat = position.coords.latitude;
		    var longitude = position.coords.longitude;
		    var geocoder = new google.maps.Geocoder(); 
		    var latlng = new google.maps.LatLng(lat,longitude);
		      
		    geocoder.geocode({'latLng': latlng}, function(results, status){
		        if (status == google.maps.GeocoderStatus.OK) 
		        { 
					if(results[0])  
					{
						var hasLoc = false;
						var components = results[0].address_components;
						for(var i = 0; i < components.length; i++)
						{
							if(components[i].types[0] == "locality")
							{
								input.innerHTML = "near " + components[i]["long_name"];
								hasLoc = true;
								break;
							}
						}
						if(!hasLoc)
							input.innerHTML = "near " + results[0].formatted_address;
							
						locationChangeEventWithLatLng(latlng);
					}
					else
					{
						input.innerHTML = "near San Francisco";
						locationChangeEvent();
						//alert("No results found");
					}
		        }
		        else
		        {
		        	input.innerHTML = "near San Francisco";
		        	locationChangeEvent();
		           	//alert("Geocoder failed due to:  "  +status) ;
		        } 
		    });
		}

	    function errorFunction(position) {
	    	input.innerHTML = "near San Francisco";
	    	locationChangeEvent();
	        //alert('Error!');
	    }

	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
        
    } 
	else {
		input.innerHTML = "near San Francisco";
		locationChangeEvent();
	   //alert('Geolocation is required for this page, but your browser doesn&apos;t support it. Try it with a browser that does, such as Opera 10.60.');
	}
	
}

function load()
{
	checkVersion();
	map_div_element_resize();
		
	
	geocoder = new google.maps.Geocoder();
	infowindow = new google.maps.InfoWindow();
	
	var latlng = new google.maps.LatLng(33.679111, -117.841094);
	var myOptions = {
	//	zoom: 8,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map_canvas"),
		myOptions);
		
		
	handleEvent(document.getElementById("searchText"), "keyup", query);
        handleEvent(document.getElementById("slider"), "keyup", function(event){if(event.keyCode==13)setLocation();});
	//handleEvent(document.getElementById("location"), "keyup", locationChangeEvent);
	//handleEvent(document.getElementById("loadMoreButton"), "click", loadMoreElements);
	//handleEvent(document.getElementById("loadMoreButton"), "onmouseover", loadMoreElements);

	google.maps.event.addListener(map, 'idle', function() {
		adjusting_bounding = false;
		mapChangedEvent();
	});
	google.maps.event.addListener(infowindow, 'closeclick', function() {
		infowindowIsOpen = false;
	});
	
	shadow = new google.maps.MarkerImage('http://www.google.com/mapfiles/shadow50.png',
      // The shadow image is larger in the horizontal dimension
      // while the position and offset are the same as for the main image.
      new google.maps.Size(37, 32),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 33));
	
	initialize();
	//Refresh map every 100 millisecond
	//window.setInterval(display2, 100);
}

//Load more results, very similar to function query()
function loadMoreElements(){
	if (document.getElementById("loadMoreButton").innerHTML == "End of Results"
	    || document.getElementById("loadMoreButton").innerHTML == "Waiting for location ...")
		return;
		
	if (document.getElementById("searchText").value.length < 3)
		return;
	if(busy)
	{
		pending = true;
		return;
	}
	
	//Prepare the request sent to WSGI
	var url = "/query_rewriter_m1?fuzzy=1&type=2&start=0"
                                                + "&lb_lng=" + currentLng1
                                                + "&lb_lat=" + currentLat1
                                                + "&rt_lng=" + currentLng2
                                                + "&rt_lat=" + currentLat2
                                                + "&q=";
	var values = document.getElementById("searchText").value.split(' ');

	for(var i = 0; i < values.length; i++) {
		if(i)url += "+";
		values[i] = values[i].toLowerCase();
		url += values[i];
	}
	busy = true;

	//for more elements
	loadTill += numberOfResultsPerRequest;
	url += "&limit=" + loadTill;
        url +="&confirmed=true";
	url +="&callback={callback}";
	
//	sendAjaxRequest(displayMore, url, values);
	YUI().use("jsonp", "node",function (Y) {
			//Send the request. The function sendAjaxRequest() is in acunit.js, will call display() back
			//var url = "http://demo.bimaple.com/factual_o_one_jsonp?factual_id="+factualId+"&callback={callback}";
			//var url     = "http://example.com/service.php?callback={callback}",
    		service = new Y.JSONPRequest(url, {
	    	on: {
	            success: displayMore
	        },
	        timeout: 3000,          // 3 second timeout
	        args: [values] // e.g. handleJSONP(data, date, number)
	    });
		service.send();
	});
}

//Display the results that loaded newly. Similar to display() + onselect()
function displayMore(response, values) {

	if (response.results.length == 0)
	{
		document.getElementById("loadMoreButton").innerHTML = "End of Results";
	}
	else
	{
		//document.getElementById("timer").innerHTML = "Searcher: " + response.searcher_time + "ms";
		//document.getElementById("timerForMysql").innerHTML = "MySQL: " + response.mysql_time + "ms";
		
		var Dom = YAHOO.util.Dom;
		var list = Dom.get("result-list");
		
		for(var index = 0; index < response.results.length; index++)
		{
			var items = Dom.getChildren(list),
	 		nItemNumber = items.length,
			fragment = Dom.get("result-container").ownerDocument.createElement("div");
	
			var searchResultItem = response.results[index];
			
			var html = getHtmlOfSearchResultItem(searchResultItem, nItemNumber, values);
			
			fragment.innerHTML = html;//'<li id ="li-'+ nItemNumber +'">List Item ' + nItemNumber + '</li>';
	 
			list.appendChild(fragment.firstChild);
				
			var resultHitData =  searchResultItem.record;
		//	var icon = markerIcon(nItemNumber);
		//	var marker = addMarker(resultHitData, icon);
		//	bindEntryMarker(document.getElementById("entry_" +nItemNumber), marker, resultHitData);
			entryForMap["entry_" +nItemNumber] = resultHitData;
		}
		if (response.results.length  < numberOfResultsPerRequest)
		{
			document.getElementById("loadMoreButton").innerHTML = "End of Results";
		}
		else
		{
			document.getElementById("loadMoreButton").innerHTML = "More";
		}
	}
			
	busy = false;
	if(pending)
	{
		pending = false;
		loadMoreElements();
	}	
	displayMarkers();
}

function calculateHaversineDistanceBetweenTwoCoordinates(latitude1,longitude1,latitude2,longitude2)
	{
		try
		{
			var radius = 6371; // radius of earth in kms
			var dLat = degreeToRadian(latitude2-latitude1);
			var dLon = degreeToRadian(longitude2-longitude1);
			var lat1 = degreeToRadian(latitude1);
			var lat2 = degreeToRadian(latitude2);
			var alpha = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
			var angularDistance = 2 * Math.atan2(Math.sqrt(alpha), Math.sqrt(1-alpha)); 
			var distanceInKilometers = radius * angularDistance;
			var distanceInMiles = distanceInKilometers * 0.6214; 
			distanceInKilometers = Math.round(distanceInKilometers*100)/100;
			distanceInMiles = Math.round(distanceInMiles*100)/100;	
			
			return distanceInMiles;			
		}
		catch (error)
		{
		}
	}
	
/*
	Convert degree value to radian value using the formula : radian = degree*PI/180
*/

function degreeToRadian(degreeValue)
{
  return degreeValue * Math.PI / 180;
}

/*
function moveOnTw(element){
	element.setAttribute("style", "position:fixed; top:5px; right:-26px;");
}
function moveOnFb(element){
	element.setAttribute("style", "position:fixed; top:28px; right:-15px; overflow:hidden");
}
function moveOnLi(element){
	element.setAttribute("style", "position:fixed; top:50px; right:-12px;");
}
function moveOutTw(element){
	element.setAttribute("style", "position:fixed; top:5px; right:-92px;");
}
function moveOutFb(element){
	element.setAttribute("style", "position:fixed; top:28px; right:-72px; overflow:hidden");
}
function moveOutLi(element){
	element.setAttribute("style", "position:fixed; top:50px; right:-74px;");
}*/

