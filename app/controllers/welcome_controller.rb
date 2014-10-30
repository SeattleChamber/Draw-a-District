class WelcomeController < ApplicationController

  def home
    if current_user && current_user.admin == true
      flash[:notice] = "Welcome Admin User: #{current_user.email}"
      redirect_to documents_path
    elsif current_user
      redirect_to documents_path
    else
      render layout: "headless"
    end
  end

end
