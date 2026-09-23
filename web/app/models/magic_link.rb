class MagicLink < ApplicationRecord
  TTL = 7.days

  belongs_to :user
  belongs_to :invitation, optional: true

  has_secure_token :token, length: 32

  before_validation { self.expires_at ||= TTL.from_now }

  scope :usable, -> { where(used_at: nil).where("expires_at > ?", Time.current) }

  def use! = update!(used_at: Time.current)
end
