require "rails_helper"

RSpec.describe "Seed endpoint", type: :request do
  let(:token) { "spec-seed-token" }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  before { allow(Rails.configuration.x).to receive(:seed_token).and_return(token) }

  describe "POST /test_support/tenants" do
    it "creates a tenant with one user per role" do
      post "/test_support/tenants", params: { name: "Spec Tenant" }, headers:, as: :json

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      organization = Organization.find_by!(slug: body["slug"])
      expect(organization.name).to eq("Spec Tenant")
      expect(organization.users.pluck(:role)).to contain_exactly("admin", "recruiter", "candidate")
      expect(body.dig("users", "candidate", "phone")).to match(/\A\+1555\d{7}\z/)
      expect(MagicLink.usable.find_by(token: body["candidate_sign_in_token"]).user.role).to eq("candidate")
    end

    it "answers 404 without the token, so the endpoint does not reveal itself" do
      post "/test_support/tenants", params: { name: "Nope" }, as: :json

      expect(response).to have_http_status(:not_found)
      expect(Organization.count).to eq(0)
    end

    it "answers 404 with a wrong token" do
      post "/test_support/tenants", headers: { "Authorization" => "Bearer wrong" }, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it "stays closed when no token is configured" do
      allow(Rails.configuration.x).to receive(:seed_token).and_return(nil)
      post "/test_support/tenants", headers: { "Authorization" => "Bearer " }, as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /test_support/records" do
    let(:organization) { create(:organization) }

    it "builds a record from a factory with traits, inside the given tenant" do
      post "/test_support/records",
        params: { organization: organization.slug, factory: "invitation", traits: ["completed"], attributes: { candidate_name: "Ada" } },
        headers:, as: :json

      expect(response).to have_http_status(:created)
      invitation = Invitation.find(response.parsed_body["id"])
      expect(invitation).to have_attributes(organization:, status: "completed")
      expect(invitation.candidate).to have_attributes(name: "Ada", organization:)
      expect(invitation.interview_template.organization).to eq(organization)
    end

    it "refuses factories outside the allow-list" do
      post "/test_support/records", params: { organization: organization.slug, factory: "user" }, headers:, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("unknown factory user")
    end
  end
end
