DrawADistrict::Application.routes.draw do
  root to: "addresses#index"
  resources :addresses do
    collection { post :import }
  end
end
