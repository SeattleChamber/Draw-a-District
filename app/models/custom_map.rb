class CustomMap
  include Mongoid::Document
  embeds_many :custom_districts
end
