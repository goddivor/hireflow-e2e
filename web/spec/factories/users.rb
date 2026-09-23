FactoryBot.define do
  factory :user do
    organization
    sequence(:name) { |n| "Test User #{n}" }
    sequence(:email) { |n| "user#{n}-#{SecureRandom.hex(3)}@hireflow.test" }
    password { "correct-horse-battery" }
    role { "recruiter" }

    trait :admin do
      role { "admin" }
      sequence(:name) { |n| "Admin #{n}" }
    end

    trait :recruiter do
      role { "recruiter" }
      sequence(:name) { |n| "Recruiter #{n}" }
    end

    trait :candidate do
      role { "candidate" }
      sequence(:name) { |n| "Candidate #{n}" }
      # Random, not a sequence: sequences restart with the server, and a shared UAT database outlives it.
      phone { format("+1555%07d", SecureRandom.random_number(10**7)) }
    end
  end
end
