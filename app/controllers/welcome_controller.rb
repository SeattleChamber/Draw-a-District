class WelcomeController < ApplicationController

  def home
    if current_user
      redirect_to addresses_path
    else
      render layout: "headless"
    end
  end

end
