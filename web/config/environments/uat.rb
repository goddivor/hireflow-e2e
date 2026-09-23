require_relative "production"

# The environment the E2E suite runs against: production settings, plain HTTP, real SMTP to Mailpit,
# and the token-protected seed endpoint (see config/routes.rb).
Rails.application.configure do
  config.assume_ssl = false
  config.force_ssl = false
  config.secret_key_base = ENV.fetch("SECRET_KEY_BASE")
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address: ENV.fetch("SMTP_HOST", "localhost"),
    port: ENV.fetch("SMTP_PORT", 1025).to_i
  }
  config.action_mailer.raise_delivery_errors = true
end
