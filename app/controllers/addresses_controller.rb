class AddressesController < ApplicationController
  before_action :authenticate_user!

  def import
    Address.import(params[:file], current_user)
    redirect_to addresses_path, notice: "CSV successfully imported."
  end

  def index
    @addresses = current_user.addresses
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

  def new
    @address = Address.new
  end

  def create
    @address = Address.new(address_params)
    if @address.save
      redirect_to root_url, notice: "Saved successfuly!"
    end
  end

  private

  def address_params
    params.require(:address).permit(:text, :lat, :long, :district)
  end

end
