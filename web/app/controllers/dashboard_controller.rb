class DashboardController < ApplicationController
  before_action :require_user

  def show
    return redirect_to(org_interviews_path) if current_user.candidate?

    @counts = current_organization.invitations.group(:status).count
    @template_count = current_organization.interview_templates.count
  end
end
