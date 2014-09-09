class Atlas

  def self.initialize
    @polygon_array = Atlas.define_districts
  end

  def self.districts_by_coordinates(coords)
    self.initialize
    # checks to see which district a point is in
    # iterate on each district in define_district
    if coords != []
      district_found = "no districtt"
      @polygon_array.each do |polygon|

        # check to see if a specific polygon contains the coordinate set
        if polygon[1].contains_point? Pinp::Point.new(*coords)
          # return the district name associated with the polygon if it does
          district_found = polygon[0]
        end
      end
      return district_found
    else
      return "error"
    end
  end

  def self.in_custom_map(map, coords)
    polygon = Atlas.define_custom_bounds(map)
    if polygon.contains_point? Pinp::Point.new(*coords)
      return "yes"
    else
      return "no"
    end
  end

  private

  def self.define_custom_bounds(custom_map)
    formatted_bounds = custom_map.bounds.map {|set| [set[0].to_f, set[1].to_f] }
    polygon = self.polygon(formatted_bounds)
    return polygon
  end

  def self.define_districts
    # associates a pinp objects with their district names and creates an array
    polygon_array = []
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
