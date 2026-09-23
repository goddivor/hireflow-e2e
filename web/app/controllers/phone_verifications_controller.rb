class PhoneVerificationsController < ApplicationController
  layout "auth"

  before_action :set_pending_user

  def new
  end

  def create
    sms_code = @pending_user.sms_codes.usable.order(:created_at).last
    if sms_code&.verify(params[:code])
      return_to = session[:return_to]
      sign_in(@pending_user)
      redirect_to return_to || org_interviews_path
    else
      flash.now[:alert] = "That code is not valid. Check the latest text message and try again."
      render :new, status: :unprocessable_content
    end
  end

  private

  def set_pending_user
    @pending_user = current_organization.users.find_by(id: session[:pending_user_id])
    redirect_to org_login_path, alert: "Open the link from your email again." unless @pending_user
  end
end
