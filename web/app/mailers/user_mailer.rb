class UserMailer < ApplicationMailer
  def interview_invitation(magic_link)
    @link = magic_link
    @invitation = magic_link.invitation
    @url = magic_url(magic_link)
    mail to: magic_link.user.email, subject: "#{@invitation.organization.name} invited you to an interview"
  end

  def sign_in_link(magic_link)
    @link = magic_link
    @url = magic_url(magic_link)
    mail to: magic_link.user.email, subject: "Your Hireflow sign-in link"
  end

  def welcome_recruiter(magic_link)
    @link = magic_link
    @url = magic_url(magic_link)
    mail to: magic_link.user.email, subject: "You have been added to #{magic_link.user.organization.name} on Hireflow"
  end

  private

  def magic_url(magic_link) = org_magic_url(org: magic_link.user.organization.slug, token: magic_link.token)
end
