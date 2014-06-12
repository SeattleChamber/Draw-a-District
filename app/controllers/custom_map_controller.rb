class CustomMapController < ApplicationController

  def new
    render layout: false
    gon.push({
      :authenticity_token => @authenticity_token
      })
    @map = CustomMap.new
  end

  def create
    @map = CustomMap.new(name: params[:custom_map][:name], bounds: params[:custom_map][:bounds].values)
    @map.save
    render json: @map.to_json
  end

  def show
    @map = CustomMap.find(params[:id])
    bounds = @map.bounds
    @formatted_bounds = []
    bounds.each do |coords|
      @formatted_bounds << {lat: coords[0].to_f, lng: coords[1].to_f}
    end
    gon.push({
      :formatted_bounds => @formatted_bounds
    })
    @document = Document.find(params[:document]) rescue nil
    @addresses = @document.addresses rescue nil
  end

  def edit
    @map = CustomMap.find(params[:id])
  end

  def update
    @map = CustomMap.find(params[:id])
    if @map.update(map_params)
      redirect_to custom_map_path(@map.id)
      flash[:notice] = "Name changed!"
    end
  end

  def index
    @maps = CustomMap.all
  end

  private

  def map_params
    params.require(:custom_map).permit(:name, :bounds)
  end

end
