class Document
  include Mongoid::Document
  field :name, type: String
  embeds_many :addresses, class_name: "Address", inverse_of: :addresser

  def to_csv(options = {})
    CSV.generate(options) do |csv|
      csv << ["address", "coordinates", "district"]
      addresses.each do |address|
        csv << [address.text, address.coordinates, address.district]
      end
    end
  end

end
