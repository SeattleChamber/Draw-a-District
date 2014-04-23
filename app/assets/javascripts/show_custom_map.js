window.onload = function() {
  handler = Gmaps.build('Google');
  handler.buildMap({ provider: {}, internal: {id: 'custom_map'}}, function(){
    var poly = handler.addPolygons(
    [
      gon.formatted_bounds
    ],
    { strokeColor: '#FF0000'}
  );
    handler.getMap().setZoom(11);
  });
}
