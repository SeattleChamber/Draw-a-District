class Document
  include Mongoid::Document
  field :name, type: String
  embeds_many :addresses, class_name: "Address", inverse_of: :addresser
end
