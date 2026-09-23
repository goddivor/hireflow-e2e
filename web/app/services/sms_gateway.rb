require "net/http"

# Sends text messages through an HTTP gateway. UAT and CI point SMS_GATEWAY_URL at the local SMS sink
# (sms-sink/ at the repository root); production would point it at the real provider.
class SmsGateway
  class DeliveryError < StandardError; end

  cattr_accessor :deliveries, default: []

  def self.deliver(to:, body:)
    url = Rails.configuration.x.sms_gateway_url
    return deliveries << { to:, body: } if url.blank?

    response = Net::HTTP.post(URI.join(url, "/messages"), { to:, body: }.to_json, "Content-Type" => "application/json")
    raise DeliveryError, "SMS gateway answered #{response.code}" unless response.is_a?(Net::HTTPSuccess)
  end
end
