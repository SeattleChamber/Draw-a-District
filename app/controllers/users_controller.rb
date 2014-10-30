class UsersController < ApplicationController
  before_action :authenticate_user!

  def list
    if current_user.admin == true
      @users = User.all
    end
  end

  def destroy
    @user = User.find(params[:id])
    if current_user.admin == true
      @user.destroy!
      redirect_to :root, notice: 'User access revoked.'
    else
      flash[:notice] = "You do not have sufficient permissions to do that."
    end
  end

end
