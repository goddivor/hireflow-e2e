class MagicLinksController < ApplicationController
  layout "auth"

  SENT_NOTICE = "If that email belongs to an account, a sign-in link is on its way."

  def create
    user = current_organization.users.find_by(email: params[:email].to_s.strip.downcase)
    UserMailer.sign_in_link(user.magic_links.create!).deliver_later if user
    # Same answer either way, so the form cannot be used to probe which emails have accounts.
    redirect_to org_login_path, notice: SENT_NOTICE
  end

  def show
    link = MagicLink.usable.joins(:user).find_by(token: params[:token], users: { organization_id: current_organization.id })
    return render(:expired, status: :gone) unless link

    link.use!
    link.invitation&.update!(status: "opened") if link.invitation&.status == "pending"
    user = link.user

    if user.candidate?
      start_phone_verification(user, return_to: link.invitation ? org_interview_path(link.invitation) : org_interviews_path)
    else
      sign_in(user)
      redirect_to org_dashboard_path
    end
  end

  private

  # Candidates prove they hold the phone number on file before the session starts.
  def start_phone_verification(user, return_to:)
    reset_session
    session[:pending_user_id] = user.id
    session[:return_to] = return_to
    SmsDeliveryJob.perform_later(user.phone, "Your Hireflow code is #{SmsCode.issue_for(user)}. It expires in 10 minutes.")
    redirect_to org_verify_phone_path
  end
end
