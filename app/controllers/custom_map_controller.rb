class CustomMapController < ApplicationController

  def new
    #render layout: false
  end

  def create
    @bounds = params[:thing]
  end

  def show
  end

  def index
  end
end
