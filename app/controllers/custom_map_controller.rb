class CustomMapController < ApplicationController

  def new
    #render layout: false
    @map = CustomMap.new
  end

  def create
    @map = CustomMap.new(name: params[:custom_map][:name], bounds: params[:custom_map][:bounds].values)
    if @map.save
      redirect_to root_url, notice: "Map saved successfully!"
    end
  end

  def show
  end

  def index
  end

  private

  def custom_map_params
    params.require(:custom_map).permit(:name, :bounds)
  end

end
