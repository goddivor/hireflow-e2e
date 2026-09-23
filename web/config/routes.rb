Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  scope "o/:org", as: :org do
    get "/", to: "dashboard#show", as: :dashboard
    get "login", to: "sessions#new"
    post "login", to: "sessions#create"
    delete "logout", to: "sessions#destroy"
    post "sign_in_link", to: "magic_links#create"
    get "magic/:token", to: "magic_links#show", as: :magic
    get "verify_phone", to: "phone_verifications#new"
    post "verify_phone", to: "phone_verifications#create"

    resources :team_members, path: "team", only: %i[index create]
    resources :interview_templates, path: "templates", except: :show
    resources :invitations, only: %i[index new create]
    resources :interviews, path: "my/interviews", only: %i[index show] do
      post :submit, on: :member
      resources :answers, only: :create
    end
  end

  # Test data for the E2E suite. Never drawn in production; also requires SEED_TOKEN (TestSupport::BaseController).
  if Rails.env.local? || Rails.env.uat?
    namespace :test_support do
      post "tenants", to: "seeds#tenant"
      post "records", to: "seeds#record"
    end
  end
end
