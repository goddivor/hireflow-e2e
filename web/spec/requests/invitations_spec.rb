require "rails_helper"

RSpec.describe "Invitations", type: :request do
  let(:organization) { create(:organization) }
  let(:recruiter) { create(:user, :recruiter, organization:) }
  let!(:template) { create(:interview_template, organization:) }

  def sign_in(user)
    post "/o/#{user.organization.slug}/login", params: { email: user.email, password: "correct-horse-battery" }
  end

  describe "POST /o/:org/invitations" do
    let(:params) do
      { invitation_form: { name: "Grace Hopper", email: "grace@example.test", phone: "+15550001234", interview_template_id: template.id } }
    end

    before { sign_in(recruiter) }

    it "creates the candidate and emails a magic link once the data is committed" do
      expect {
        post "/o/#{organization.slug}/invitations", params:
      }.to change(Invitation, :count).by(1).and have_enqueued_mail(UserMailer, :interview_invitation)

      invitation = Invitation.last
      expect(invitation.candidate).to have_attributes(name: "Grace Hopper", role: "candidate", phone: "+15550001234")
      expect(invitation.candidate.magic_links.usable.sole.invitation).to eq(invitation)
    end

    it "refuses a template from another tenant" do
      foreign = create(:interview_template)
      post "/o/#{organization.slug}/invitations", params: params.deep_merge(invitation_form: { interview_template_id: foreign.id })

      expect(response).to have_http_status(:unprocessable_content)
      expect(Invitation.count).to eq(0)
    end

    it "does not turn a team member into a candidate" do
      post "/o/#{organization.slug}/invitations", params: params.deep_merge(invitation_form: { email: recruiter.email })

      expect(response).to have_http_status(:unprocessable_content)
      expect(recruiter.reload.role).to eq("recruiter")
    end
  end

  describe "GET /o/:org/invitations" do
    it "lists only the current tenant's invitations" do
      create(:invitation, organization:, candidate_name: "Mine")
      create(:invitation, candidate_name: "Theirs")
      sign_in(recruiter)

      get "/o/#{organization.slug}/invitations"

      expect(response.body).to include("Mine")
      expect(response.body).not_to include("Theirs")
    end

    it "treats a session from another tenant as a guest" do
      sign_in(create(:user, :recruiter))
      get "/o/#{organization.slug}/invitations"

      expect(response).to redirect_to("/o/#{organization.slug}/login")
    end
  end
end
