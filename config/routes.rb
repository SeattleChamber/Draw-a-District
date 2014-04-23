DrawADistrict::Application.routes.draw do
  devise_for :users
  root to: "welcome#home"
  resources :addresses do
    collection { post :import }
  end
  resources :custom_map
  resources :documents
end
