class DocumentsController < ApplicationController

  def index
    @documents = Document.all
    @maps = CustomMap.all
  end

  def show
    @document = Document.find(params[:id])
    @error_queue = []
    @addresses = []
    @document.addresses.each do |address|
      if address.district == "erro"
        @error_queue.push(address)
      else
        @addresses.push(address)
      end
    end
    @hash = Gmaps4rails.build_markers(@addresses) do |address, marker|
      if address.district == "erro"
        @error_queue.push(address)
      else
        marker.lat address.to_coordinates[0]
        marker.lng address.to_coordinates[1]
        marker.infowindow render_to_string(:partial => "/addresses/tooltips", :locals => { :object => address})
      end
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

  def destroy
    @document = Document.find(params[:id])
    if current_user.admin == true
      @document.destroy!
      redirect_to :root, notice: 'Document Deleted'
    else
      flash[:notice] = "You do not have sufficient permissions to do that."
    end
  end

end
