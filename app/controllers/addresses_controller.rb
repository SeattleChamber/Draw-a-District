class AddressesController < ApplicationController

  def import
    Address.import(params[:file])
    redirect_to root_url, notice: "CSV successfully imported."
  end

  def show
    @addresses = Address.all
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
      # @district.contains_point? Pinp::Point.new()
      redirect_to root_url, notice: "Saved successfuly!"
    end
  end

  private

  def address_params
    params.require(:address).permit(:text, :lat, :long, :district, :user_id)
  end

  def define_districts
    @polygon_array = []
    District.all.each do |district|
      new_district = district.make_polygon(district.bounds)
      polygon_array << [district.name, new_district]
    end
  end

  def make_polygon(points)
    points.each do |coordinate_set|
     perimeter << Pinp::Point.new(coordinate_set[0], coordinate_set[1])
    end
    pgon = Pinp::Polygon.new perimeter
    return pgon
  end
  
end
