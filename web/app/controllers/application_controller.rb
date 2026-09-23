class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  before_action :set_organization

  helper_method :current_organization, :current_user

  rescue_from ActiveRecord::RecordNotFound, with: -> { render "errors/not_found", status: :not_found }

  private

  attr_reader :current_organization

  def set_organization
    @current_organization = Organization.find_by!(slug: params[:org])
  end

  def default_url_options = { org: params[:org] }

  # A session belongs to one organization: a user signed in to tenant A is a guest in tenant B.
  def current_user
    return @current_user if defined?(@current_user)

    @current_user = current_organization.users.find_by(id: session[:user_id])
  end

  def sign_in(user)
    reset_session
    session[:user_id] = user.id
  end

  def require_user
    redirect_to org_login_path unless current_user
  end

  def require_role(*roles)
    return if roles.map(&:to_s).include?(current_user.role)

    render "errors/forbidden", status: :forbidden
  end

  def require_staff = require_role(:admin, :recruiter)
end
