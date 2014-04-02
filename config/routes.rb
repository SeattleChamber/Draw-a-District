DrawADistrict::Application.routes.draw do
  root to: "welcome#home"
  resources :addresses do
    collection { post :import }
  end
end
