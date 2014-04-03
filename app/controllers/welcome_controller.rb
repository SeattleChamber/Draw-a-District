class WelcomeController < ApplicationController

  def home
    @addresses = Address.all
    @hash = Gmaps4rails.build_markers(@addresses) do |address, marker|
      marker.lat address.lat
      marker.lng address.long
    end
  end

end
