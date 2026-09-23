class Answer < ApplicationRecord
  belongs_to :invitation

  validates :question_index, uniqueness: { scope: :invitation_id }
  validates :duration_ms, :byte_size, numericality: { greater_than: 0 }
end
