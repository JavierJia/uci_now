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

    this.markersArray = [];

    var iconbase = 'http://www.google.com/mapfiles/ms/micons/';
    this.marker_icons = {
      urhere: {
        icon: iconbase + 'red-dot.png',
      },
      websoc:{
        icon: iconbase + 'info.png',
      },
      seminar:{
        icon: iconbase + 'arts.png',
      },
    }

    this.clickedmarker = this.create_marker(this.dbh_position,"U",
      'U R HERE<br>@' + this.dbh_position, this.marker_icons.urhere);

    // Events Handler
    var _this = this;
    google.maps.event.addListener(_this.map, 'click', function(e){
      console.log('[map.js] click_onmap @' + e.latLng);
      if(_this.clickedmarker){
        _this.clickedmarker.setPosition(e.latLng);
      }else{
        _this.clickedmarker = _this.create_marker(e.latLng,"U",'U R HERE<br>@' + e.latLng);
      }
      _this.map.setCenter(_this.clickedmarker.position);
      _this.send_click_query(e.latLng);
    });
  };

  Map.prototype.create_marker = function(position,title,content,icontype){
    var marker = new google.maps.Marker({
        position: position,
        title: title,
        icon: icontype.icon});

    var infowindow = new google.maps.InfoWindow({
      content: content
    });

    this.markersArray.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(this.map,marker);
    });
    // To add the marker to the map, call setMap();
    marker.setMap(this.map);
    return marker;
  }

  Map.prototype.send_click_query = function(latLng){
    var date = $('#datepicker').val();
    this.socket.send({ action: 'click', date: date, lat: latLng.lat(),lng: latLng.lng()});
  }

  Map.prototype.clear_all_makers = function(){
    var _this = this;
    for (var i = 1; i < _this.markersArray.length; i++ ) {
      _this.markersArray[i].setMap(null);
    }
    this.markersArray = [this.markersArray[0]];
  }

  Map.prototype.receive_msg = function(obj){
    var _this = this;
    var string = JSON.stringify(obj);
    this.clear_all_makers();
    console.log('[map.js] receive_msg:'+string);
    if(obj.websoc){
      $.each(obj.websoc, function (i, item) {
        console.log('[map.js] creat websoc marker ineach');
        if(i < 100){
          item = $.parseJSON(item.replace(/d/g,'').replace(/d /g,' '));
          console.log('[map.js] item:' + item.lat + ',' + item.lng);
          _this.create_marker(new google.maps.LatLng(item.lat,item.lng),'class',
            '<b>ClassName</b>:'+ item.name  +
            '<br><b>Instructor</b>:' + item.instructor + 
            '<br><b>Room</b>:' + item.location +
            '<br><b>Time</b>:' + item.time + 
            '<br><b>Every</b>:' + item.loop,
            _this.marker_icons.websoc);
        }
      });
    }
    if(obj.seminar){
      $.each(obj.seminar, function (i, item) {
        console.log('[map.js] creat seminar marker ineach');
        if(i < 100){
          console.log('[map.js] item:' + item.replace(/d,/g,',').replace(/d /g,' '));
          item = $.parseJSON(item.replace(/d,/g,',').replace(/d /g,' '));
          _this.create_marker(new google.maps.LatLng(item.lat,item.lng),'class',
            '<b>Title</b>:'+ item.title  +
            '<br><b>Time</b>:' + item.starthour + ':' + item.startmin + ' - ' + item.endhour + ':' + item.endmin + 
            '<br><b>Room</b>:' + item.location +
            '<br><b>Contact</b>:' + item.contact + 
            '<br><b>Description</b>:' + item.description,
            _this.marker_icons.seminar);
        }
      });
    }
  }

  return Map;
}
)();
