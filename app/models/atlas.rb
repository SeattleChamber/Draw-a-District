class Atlas

  def self.districts_by_coordinates(coords)
    polygon_array = Atlas.define_districts
    # checks to see which district a point is in
    # iterate on each district in define_district
    district_found = "no district"

    polygon_array.each do |polygon|
      # check to see if a specific polygon contains the coordinate set
      if polygon[1].contains_point? Pinp::Point.new(*coords)
        # return the district name associated with the polygon if it does
        # this logic will need to change if @polygon_array is changed to a hash
        district_found = polygon[0]
      end
    end
    return district_found
  end

  private

  def self.define_districts
    # associates a pinp objects with their district names and creates an array
    polygon_array = [] # make this into a hash
    District.all.each do |district|
      new_district = Atlas.polygon(district.bounds)
      polygon_array << [district.name, new_district]
    end
    return polygon_array
  end

  def self.polygon(points)
    # creates a pinp object out of a set of perimeter coordiantes
    perimeter = []
    points.each do |coordinate_set|
     perimeter << Pinp::Point.new(coordinate_set[0], coordinate_set[1])
    end
    pgon = Pinp::Polygon.new perimeter
    return pgon
  end

end
