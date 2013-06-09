Map = (function() {
  function Map(socket, map){
    console.log('[map.js] init');
    this.socket = socket;
    this.geocoder = new google.maps.Geocoder();

    this.dbh_position = new google.maps.LatLng(33.64337,-117.841974);
    this.map = new google.maps.Map(document.getElementById("map-canvas"),
        { center: this.dbh_position,
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.HYBRID
        });

    this.clickedmarker = this.create_marker(this.dbh_position,"U",'U R HERE<br>@' + this.dbh_position);

    // Events Handler
    var _this = this;
    google.maps.event.addListener(_this.map, 'click', function(e){
      console.log('[map.js] click_onmap @' + e.latLng);
      if(_this.clickedmarker){
        console.log('[map.js] click if');
        _this.clickedmarker.setPosition(e.latLng);
      }else{
        console.log('[map.js] click else');
        _this.clickedmarker = _this.create_marker(e.latLng,"U",'U R HERE<br>@' + e.latLng);
      }
      _this.send_click_query(e.latLng);
    });
  };

  Map.prototype.create_marker = function(position,title,content){
    var marker = new google.maps.Marker({
      position: position,
      title: title
    })

    var infowindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(this.map,marker);
    });
    // To add the marker to the map, call setMap();
    marker.setMap(this.map);
    return marker;
  }

  Map.prototype.send_click_query = function(latLng){
    var date = $('#datepicker').val();
    
  }

  Map.prototype.receive_msg = function(obj){

  }

  return Map;
}
)();


// function initialize() {
// 	var dbh = new google.maps.LatLng(33.64337,-117.841974);
// 	var iccenter= new google.maps.LatLng(33.648192,-117.842339);
//     var mapOptions = {
//         center: dbh,
//         zoom: 18,
//         mapTypeId: google.maps.MapTypeId.HYBRID
//     };
//     map = new google.maps.Map(document.getElementById("map-canvas"),
//         mapOptions);

    
//     var marker = new google.maps.Marker({
//                 position: dbh ,
//                 title:"DBH"
//                });

//     var contentString = '<div id="content">'+
//       '<div id="siteNotice">'+
//       '</div>'+
//       '<h1 id="firstHeading" class="firstHeading">Donald Bren Hall</h1>'+
//       '<div id="bodyContent">'+
//       '<p><b>DBH</b>, '+ 
//       'Home of Computer Science' + 
//       'Heritage Site.</p>'+
//       '</div>'+
//       '</div>';

//     var infowindow = new google.maps.InfoWindow({
//       content: contentString
//     });

//     google.maps.event.addListener(marker, 'click', function() {
//     	infowindow.open(map,marker);
//     });
//     // To add the marker to the map, call setMap();
//     marker.setMap(map);

//     var clickedmarker;

//     google.maps.event.addListener(map, 'click', function(e) {
// 		geocoder.geocode(
//               {'latLng': e.latLng},
//               function(results, status) {
//                 if (status == google.maps.GeocoderStatus.OK) {
//                   if (results[0]) {
//                     if (clickedmarker) {
//                       clickedmarker.setPosition(e.latLng);
//                     } else {
//                       clickedmarker = new google.maps.Marker({
//                          position: e.latLng,
//                          map: map});
//                     }
//                     InfoWindow.setContent(results[0].formatted_address + ' @'+e.latLng);
//                     infowindow.open(map, clickedmarker);
//                   } else {
//                     console.log('No results found');
//                   }
//                 } else {
//                   	console.log('Geocoder failed due to: ' + status);
//                 }
//         });
// 	});

// }


// function current_location(){
//     if(navigator.geolocation) {
//     	console.log('getting position');
//         navigator.geolocation.getCurrentPosition(function(position) {
//             var pos = new google.maps.LatLng(position.coords.latitude,
//                                            position.coords.longitude);

//             var infowindow = new google.maps.InfoWindow({
//                 map: map,
//                 position: pos,
//                     content: 'Location found using HTML5.'
//                 });

//             map.setCenter(pos);
            
//         })
//     }else{
//     	console.log('failed to get current_location');
//     }
// }


