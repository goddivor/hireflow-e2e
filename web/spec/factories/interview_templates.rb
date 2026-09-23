FactoryBot.define do
  factory :interview_template do
    organization
    sequence(:title) { |n| "Backend Engineer #{n}" }
    questions { ["Tell us about yourself.", "Describe a bug you are proud of fixing."] }
  end
end
