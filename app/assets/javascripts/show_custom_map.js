window.onload = function() {
  handler = Gmaps.build('Google');
  handler.buildMap({ provider: {}, internal: {id: 'custom_map'}}, function(){
    var polygon = handler.addPolygons(
    [
      gon.formatted_bounds
    ],
    { strokeColor: '#FF0000'}
  );
    handler.bounds.extendWith(polygon);
    handler.fitMapToBounds();
    handler.getMap().setZoom(13);
  });
}
