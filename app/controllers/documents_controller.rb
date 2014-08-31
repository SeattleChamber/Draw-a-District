class DocumentsController < ApplicationController

  def index
    @documents = Document.all
    @maps = CustomMap.all
  end

  def show
    @document = Document.find(params[:id])
    @addresses = @document.addresses
    @hash = Gmaps4rails.build_markers(@addresses) do |address, marker|
      marker.lat address.to_coordinates[0]
      marker.lng address.to_coordinates[1]
      marker.infowindow render_to_string(:partial => "/addresses/tooltips", :locals => { :object => address})
    end
    gon.push({
      :hash => @hash
    })
    respond_to do |format|
      format.html
      format.csv { render text: @document.to_csv }
      format.xls { send_data @document.to_csv(col_sep: "\t") }
    end
  end

end
