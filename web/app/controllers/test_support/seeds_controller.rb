module TestSupport
  # Creates E2E test data from the RSpec factories. Only routed outside production, and refuses
  # every request unless SEED_TOKEN is set and sent as a bearer token.
  class SeedsController < ActionController::API
    PASSWORD = "correct-horse-battery".freeze
    FACTORIES = %w[interview_template invitation].freeze

    before_action :authenticate

    def tenant
      organization = FactoryBot.create(:organization, **params.permit(:name, :slug).to_h.symbolize_keys)
      users = %w[admin recruiter candidate].index_with do |role|
        FactoryBot.create(:user, role.to_sym, organization:, password: PASSWORD)
      end
      render status: :created, json: {
        slug: organization.slug,
        name: organization.name,
        users: users.transform_values { |user| user_json(user) },
        candidate_sign_in_token: users["candidate"].magic_links.create!.token
      }
    end

    def record
      factory = params.require(:factory)
      return render(status: :unprocessable_content, json: { error: "unknown factory #{factory}" }) unless FACTORIES.include?(factory)

      organization = Organization.find_by!(slug: params.require(:organization))
      traits = Array(params[:traits]).map(&:to_sym)
      attributes = params.fetch(:attributes, {}).permit!.to_h.symbolize_keys
      record = FactoryBot.create(factory.to_sym, *traits, organization:, **attributes)
      render status: :created, json: record.as_json
    end

    private

    def authenticate
      token = Rails.configuration.x.seed_token
      provided = request.authorization.to_s.delete_prefix("Bearer ")
      head :not_found unless token.present? && ActiveSupport::SecurityUtils.secure_compare(provided, token)
    end

    def user_json(user) = { id: user.id, name: user.name, email: user.email, phone: user.phone, password: PASSWORD }
  end
end
