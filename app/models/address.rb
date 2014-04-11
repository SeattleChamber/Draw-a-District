class Address
  include Mongoid::Document
  field :text, type: String
  field :coordinates, type: Array
  field :lat, type: String
  field :long, type: String
  field :district, type: String
  field :user_id, type: Integer
  include Geocoder::Model::Mongoid
  geocoded_by :text               # can also be an IP address
  after_validation :geocode          # auto-fetch coordinates

  def self.import(file)
    CSV.foreach(file.path, headers: true) do |row|
      address = Address.create row.to_hash
      address.district = Atlas.districts_by_coordinates(address.to_coordinates)
      address.save!
    end
  end


end
