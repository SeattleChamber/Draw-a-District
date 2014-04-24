jQuery(document).ready(function() {

  $(".ajax-create").click(function() {
    var update = $(".update")
    var name = $(".name")
    $.ajax({
      url: $(this).attr("href"),
      type: 'PATCH',
      data: {custom_map: {name: data.name}},
      dataType: 'json',
      success: function(data, textStatus, xhr) {
        console.log(textStatus)
        update.remove();
        name.append(data.body)
      },
      error: function(xhr, textStatus, errorThrown) {
        alert("Something went wrong.");
      }
    });
    return false
  });
});
