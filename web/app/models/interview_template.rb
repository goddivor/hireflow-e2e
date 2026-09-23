class InterviewTemplate < ApplicationRecord
  belongs_to :organization
  has_many :invitations, dependent: :restrict_with_error

  validates :title, presence: true
  validate :has_questions

  def questions=(value)
    super(Array(value).map { |q| q.to_s.strip }.reject(&:empty?))
  end

  private

  def has_questions
    errors.add(:questions, "need at least one question") if questions.blank?
  end
end
