class Document
  include Mongoid::Document
  embedded_in :user, class_name: "User"
  embeds_many :addresses, class_name: "Address"
end
