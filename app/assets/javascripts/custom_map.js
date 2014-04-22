function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(47.6130284,-122.3420645),
    zoom: 8
  };

  var map = new google.maps.Map(document.getElementById("map-canvas"),
      mapOptions);

  // Try W3C Geolocation (Preferred)
  if(navigator.geolocation) {
    browserSupportFlag = true;
    navigator.geolocation.getCurrentPosition(function(position) {
      initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      map.setCenter(initialLocation);
    }, function() {
      handleNoGeolocation(browserSupportFlag);
    });
  }
  // Browser doesn't support Geolocation
  else {
    browserSupportFlag = false;
    handleNoGeolocation(browserSupportFlag);
  }

  function handleNoGeolocation(errorFlag) {
    if (errorFlag == true) {
      alert("Geolocation service failed.");
      initialLocation = seattle;
    } else {
      alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
      initialLocation = siberia;
    }
    map.setCenter(initialLocation);
  }

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    }
  });
  drawingManager.setMap(map);
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    polyset = [];
    var array = event.overlay.getPath().getArray();
    var length = array.length;
    for (var i = 0; i < length; i++) {
      var empty = [];
      empty.push(array[i].k);
      empty.push(array[i].A);
      polyset.push(empty);
    }
    console.log(polyset)
    $.post("/custom_map", {thing: polyset})
  });
}
google.maps.event.addDomListener(window, 'load', initialize);
