class Address
  include Mongoid::Document
  embedded_in :addresser, class_name: "Document", inverse_of: :addresses
  field :text, type: String
  field :coordinates, type: Array
  field :district, type: String
  field :user_id, type: Integer
  include Geocoder::Model::Mongoid
  geocoded_by :text               # can also be an IP address
  after_validation :geocode          # auto-fetch coordinates

  def self.import(file)
    name = file.original_filename
    @document = Document.create!
    @document.name = name
    @document.save!
    CSV.foreach(file.path, headers: true) do |row|
      hash = row.to_hash
      address = @document.addresses.build(hash)
      address.geocode
      address.district = Atlas.districts_by_coordinates(address.to_coordinates)
      address.save!
    end
  end

  def self.to_csv(options)
    CSV.generate(options) do |csv|
      csv << column_names
      all.each do |address|
        csv << address.attributes.values_at(*column_names)
      end
    end
  end

  def self.column_names
    self.fields.collect { |field| field[0] }
  end

end
