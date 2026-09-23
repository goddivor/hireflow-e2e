class User < ApplicationRecord
  ROLES = %w[admin recruiter candidate].freeze

  belongs_to :organization
  has_many :magic_links, dependent: :destroy
  has_many :sms_codes, dependent: :destroy
  has_many :invitations, foreign_key: :candidate_id, dependent: :destroy, inverse_of: :candidate

  has_secure_password

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { scope: :organization_id }
  validates :role, inclusion: { in: ROLES }
  validates :phone, presence: true, format: { with: /\A\+\d{8,15}\z/ }, if: :candidate?

  ROLES.each { |role| define_method(:"#{role}?") { self.role == role } }

  def staff? = admin? || recruiter?
end
