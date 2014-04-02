class Address
  include Mongoid::Document
  field :text, type: String
  field :lat, type: String
  field :long, type: String
  field :district, type: String
  field :user_id, type: Integer

  def self.import(file)
    CSV.foreach(file.path, headers: true) do |row|
      Address.create! row.to_hash
    end
  end

end
