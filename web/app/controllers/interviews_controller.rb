class InterviewsController < ApplicationController
  before_action :require_user
  before_action -> { require_role(:candidate) }
  before_action :set_invitation, only: %i[show submit]

  def index
    @invitations = current_user.invitations.includes(:interview_template).order(created_at: :desc)
  end

  def show
  end

  def submit
    if @invitation.all_answered?
      @invitation.complete!
      redirect_to org_interviews_path, notice: "Thank you! Your interview was submitted."
    else
      redirect_to org_interview_path(@invitation), alert: "Answer every question before submitting."
    end
  end

  private

  def set_invitation
    @invitation = current_user.invitations.find(params[:id])
  end
end
