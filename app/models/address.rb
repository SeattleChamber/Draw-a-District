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
  require 'pinp'

  def initialize
    # these should have the coordinate sets in them 
    @district1a = []
    @district1b = []
    @district1c = []
    @district2 = []
    @district3a = []
    @district3b = []
    @district3c = []
    @district3d = []
    @district4a = []
    @district4b = []
    @district5 = []
    @district6 = []
    @district7 = []
  end

  def self.import(file)
    CSV.foreach(file.path, headers: true) do |row|
      Address.create! row.to_hash
    end
  end

  def district1
  end

  def district2
  end

  def district3
  end

  def district4
  end

  def district5
  end

  def district6
  end

  def district7
  end

  def make_polygon(points)
    points.each do |coordinate_set|
      perimeter << Pinp::Point.new(coordinate_set[0], coordinate_set[1])
    end
    @pgon = Pinp::Polygon.new perimeter
  end

end
