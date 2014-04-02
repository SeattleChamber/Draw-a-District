class Address
  include Mongoid::Document
  field :text, type: String
  field :lat, type: String
  field :long, type: String
  field :district, type: String
end
