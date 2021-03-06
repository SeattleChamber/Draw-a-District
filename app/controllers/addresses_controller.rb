class AddressesController < ApplicationController
  before_action :authenticate_user!

  def import
    @address = Address.import(params[:file])
    if @address == false
      redirect_to documents_path, notice: "Input field cannot be blank. Please select a spreadsheet and try again."
    else
      redirect_to documents_path, notice: "CSV successfully imported."
    end
  end

  def index
    @addresses = Address.all
    @hash = Gmaps4rails.build_markers(@addresses) do |address, marker|
      marker.lat address.to_coordinates[0]
      marker.lng address.to_coordinates[1]
    end
    gon.push({
      :hash => @hash
    })
    respond_to do |format|
      format.html
      format.csv { render text: @addresses.to_csv }
      format.xls { send_data @addresses.to_csv(col_sep: "\t") }
    end
  end
end
