class District
  include Mongoid::Document
  field :name, type: String
  field :bounds, type: Array
  validates_uniqueness_of :name

end
