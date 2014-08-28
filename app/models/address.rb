class Address
  include Mongoid::Document
  embedded_in :addresser, class_name: "Document", inverse_of: :addresses
  field :cust_id, type: String
  field :text, type: String
  field :coordinates, type: Array
  field :district, type: String
  field :user_id, type: Integer
  field :name, type: String
  include Geocoder::Model::Mongoid
  geocoded_by :text               # can also be an IP address
  after_validation :geocode          # auto-fetch coordinates

  def self.import(file)
    return false if file.blank?
    name = file.original_filename
    @document = Document.create!
    @document.name = name
    @document.save!
    CSV.foreach(file.path, headers: true) do |row|
      hash = row.to_hash
      address = @document.addresses.build(hash.slice("text"))
      address.geocode
      address.district = Atlas.districts_by_coordinates(address.to_coordinates).gsub(/\D\z/, '')
      address.cust_id = hash.slice("cust_id").values.join
      address.name = hash.slice("company_nm").values.join
      address.save!
      sleep 1
    end
  end
end
