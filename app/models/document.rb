class Document
  include Mongoid::Document
  field :name, type: String
  embeds_many :addresses, class_name: "Address", inverse_of: :addresser

  def to_csv(options = {})
    CSV.generate(options) do |csv|
      csv << ["CUST_ID", "COMPANY_NM" "ADDRESS", "COORDINATES", "DISTRICT"]
      addresses.each do |address|
        csv << [address.cust_id, address.name, address.text, address.coordinates, address.district]
      end
    end
  end

end
