class SmsCode < ApplicationRecord
  TTL = 10.minutes
  MAX_ATTEMPTS = 5

  belongs_to :user

  scope :usable, -> { where(used_at: nil).where("expires_at > ?", Time.current).where("attempts < ?", MAX_ATTEMPTS) }

  # Returns the plain code, which is never stored: only its digest is.
  def self.issue_for(user)
    code = format("%06d", SecureRandom.random_number(1_000_000))
    user.sms_codes.where(used_at: nil).update_all(used_at: Time.current)
    user.sms_codes.create!(code_digest: BCrypt::Password.create(code, cost: BCrypt::Engine::MIN_COST), expires_at: TTL.from_now)
    code
  end

  def verify(code)
    increment!(:attempts)
    return false unless BCrypt::Password.new(code_digest) == code.to_s.strip

    update!(used_at: Time.current)
  end
end
