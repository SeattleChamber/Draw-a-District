class Document
  include Mongoid::Document
  field :name, type: String
  embeds_many :addresses, class_name: "Address", inverse_of: :addresser

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
