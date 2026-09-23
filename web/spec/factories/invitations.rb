FactoryBot.define do
  factory :invitation do
    transient do
      candidate_name { nil }
      candidate_email { nil }
      template_title { nil }
    end

    organization
    interview_template { association :interview_template, organization:, **{ title: template_title }.compact }
    # An existing candidate is reused, so a test can hand an interview to its signed-in candidate.
    candidate do
      organization.users.find_by(email: candidate_email) ||
        association(:user, :candidate, organization:, **{ name: candidate_name, email: candidate_email }.compact)
    end
    invited_by { association :user, :recruiter, organization: }
    status { "pending" }

    trait :opened do
      status { "opened" }
    end

    trait :completed do
      status { "completed" }
      completed_at { Time.current }
    end
  end
end
