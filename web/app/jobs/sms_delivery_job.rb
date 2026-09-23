class SmsDeliveryJob < ApplicationJob
  retry_on SmsGateway::DeliveryError, wait: 2.seconds, attempts: 3

  def perform(to, body)
    SmsGateway.deliver(to:, body:)
  end
end
