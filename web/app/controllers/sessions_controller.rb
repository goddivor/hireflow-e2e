class SessionsController < ApplicationController
  TOO_MANY = -> { redirect_to org_login_path, alert: "Too many attempts. Try again in a minute." }

  # Per email against guessing one account's password, per IP against spraying many accounts.
  # A tight per-IP limit alone locked out everyone behind one address: an office NAT, or the E2E
  # suite signing in a session per worker and role.
  rate_limit to: 10, within: 1.minute, only: :create, name: "per-email", by: -> { params[:email].to_s.strip.downcase }, with: TOO_MANY
  rate_limit to: 100, within: 1.minute, only: :create, name: "per-ip", with: TOO_MANY

  def new
    redirect_to org_dashboard_path if current_user
  end

  def create
    user = current_organization.users.find_by(email: params[:email].to_s.strip.downcase)
    if user&.staff? && user.authenticate(params[:password].to_s)
      sign_in(user)
      redirect_to org_dashboard_path
    else
      flash.now[:alert] = "Wrong email or password."
      render :new, status: :unprocessable_content
    end
  end

  def destroy
    reset_session
    redirect_to org_login_path, notice: "You have been signed out."
  end
end
