class WelcomeController < ApplicationController

  def home
    @addresses = Address.all
    @hash = Gmaps4rails.build_markers(@addresses) do |address, marker|
      marker.lat address.to_coordinates[0]
      marker.lng address.to_coordinates[1]
    end
  end

end
