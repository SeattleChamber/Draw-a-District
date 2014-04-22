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
    @map = CustomMap.find(params[:id])
  end

  def index
    @maps = CustomMap.all
  end

end
