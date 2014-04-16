DrawADistrict::Application.routes.draw do
  devise_for :users
  root to: "addresses#index"
  resources :addresses do
    collection { post :import }
  end
end
