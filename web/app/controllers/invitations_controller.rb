class InvitationsController < ApplicationController
  SORTS = {
    "candidate" => "users.name",
    "template" => "interview_templates.title",
    "status" => "invitations.status",
    "sent" => "invitations.created_at"
  }.freeze

  before_action :require_user
  before_action :require_staff

  def index
    @sort = SORTS.key?(params[:sort]) ? params[:sort] : "sent"
    @direction = params[:direction] == "asc" ? "asc" : "desc"
    @invitations = current_organization.invitations
      .joins(:candidate, :interview_template)
      .includes(:candidate, :interview_template)
      .order(Arel.sql("#{SORTS.fetch(@sort)} #{@direction}"), id: :desc)
    @invitations = @invitations.where(status: params[:status]) if Invitation::STATUSES.include?(params[:status])
    if params[:q].present?
      query = "%#{Invitation.sanitize_sql_like(params[:q].strip.downcase)}%"
      @invitations = @invitations.where("lower(users.name) LIKE :q OR users.email LIKE :q", q: query)
    end
  end

  def new
    @form = InvitationForm.new
    @templates = current_organization.interview_templates.order(:title)
  end

  def create
    @form = InvitationForm.new(params.expect(invitation_form: %i[name email phone interview_template_id]))
    @templates = current_organization.interview_templates.order(:title)
    invitation = @form.save(organization: current_organization, invited_by: current_user)
    if invitation
      redirect_to org_invitations_path, notice: "Invitation sent to #{invitation.candidate.email}."
    else
      render :new, status: :unprocessable_content
    end
  end
end
