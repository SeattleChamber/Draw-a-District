class AddressesController < ApplicationController

  def import
    Address.import(params[:file])
    redirect_to root_url, notice: "CSV successfully imported."
  end

  def show
    @addresses = Address.all
    respond_to do |format|
      format.html
      format.csv { send_data @addresses.to_csv }
    end
  end

  def index
    @addresses = Address.all
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
