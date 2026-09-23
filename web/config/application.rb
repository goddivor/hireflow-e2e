require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

module Hireflow
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.generators.system_tests = nil

    config.action_mailer.default_url_options = { host: ENV.fetch("APP_HOST", "localhost:3000") }
    config.x.sms_gateway_url = ENV["SMS_GATEWAY_URL"]
    config.x.seed_token = ENV["SEED_TOKEN"]
  end
end
