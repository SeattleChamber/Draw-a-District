class CustomDistrict
  include Mongoid::Document
  embedded_in :custom_map
end
