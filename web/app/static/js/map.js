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
        _this.clickedmarker.setPosition(e.latLng);
      }else{
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
    this.socket.send({ action: 'click', date: date, lat: latLng.lat(),lng: latLng.lng(), });
  }

  Map.prototype.receive_msg = function(obj){
    var string = JSON.stringify(obj);
    console.log('[map.js] receive_msg:'+string);
  }

  return Map;
}
)();
