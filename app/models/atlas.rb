class Atlas

  def define_districts
    @polygon_array = []
    District.all.each do |district|
      new_district = district.make_polygon(district.bounds)
      polygon_array << [district.name, new_district]
    end
  end

  def make_polygon(points)
    points.each do |coordinate_set|
     perimeter << Pinp::Point.new(coordinate_set[0], coordinate_set[1])
    end
    pgon = Pinp::Polygon.new perimeter
    return pgon
  end
  
end
