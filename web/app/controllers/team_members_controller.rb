class TeamMembersController < ApplicationController
  before_action :require_user
  before_action -> { require_role(:admin) }

  def index
    @members = current_organization.users.where(role: %w[admin recruiter]).order(:name)
    @member = User.new
  end

  def create
    @member = current_organization.users.new(
      params.expect(user: %i[name email]).merge(role: "recruiter", password: SecureRandom.base58(24))
    )
    if @member.save
      UserMailer.welcome_recruiter(@member.magic_links.create!).deliver_later
      redirect_to org_team_members_path, notice: "#{@member.name} was added and will get a sign-in link by email."
    else
      @members = current_organization.users.where(role: %w[admin recruiter]).order(:name)
      render :index, status: :unprocessable_content
    end
  end
end
