class District
  include Mongoid::Document
  field :name, type: String
  field :bounds, type: Array
  validates_uniqueness_of :name

  def make_polygon(points)
    points.each do |coordinate_set|
     perimeter << Pinp::Point.new(coordinate_set[0], coordinate_set[1])
    end
    pgon = Pinp::Polygon.new perimeter
    return pgon
  end
end
