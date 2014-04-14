class AddressesController < ApplicationController

  def import
    Address.import(params[:file])
    redirect_to addresses_path, notice: "CSV successfully imported."
  end

  def show
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
    params.require(:address).permit(:text, :lat, :long, :district, :user_id)
  end

end
