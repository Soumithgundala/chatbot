from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from .database import Base

# Note: The models are defined in a way that is database-agnostic.
# SQLAlchemy handles the conversion to the specific SQL dialect (like MySQL).

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    age = Column(Integer)
    gender = Column(String(50))
    state = Column(String(255))
    street_address = Column(String(255))
    postal_code = Column(String(50))
    city = Column(String(255))
    country = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    traffic_source = Column(String(255))
    created_at = Column(DateTime)

class DistributionCenter(Base):
    __tablename__ = "distribution_centers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    cost = Column(Float)
    category = Column(String(255))
    name = Column(String(255))
    brand = Column(String(255))
    retail_price = Column(Float)
    department = Column(String(255))
    sku = Column(String(255))
    distribution_center_id = Column(Integer, ForeignKey("distribution_centers.id"))

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(255))
    gender = Column(String(50))
    created_at = Column(DateTime)
    returned_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    num_of_item = Column(Integer)

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    created_at = Column(DateTime)
    sold_at = Column(DateTime, nullable=True)
    cost = Column(Float)
    product_category = Column(String(255))
    product_name = Column(Text) # Using Text for potentially long names
    product_brand = Column(String(255))
    product_retail_price = Column(Float)
    product_department = Column(String(255))
    product_sku = Column(String(255))
    product_distribution_center_id = Column(Integer, ForeignKey("distribution_centers.id"))

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"))
    status = Column(String(255))
    created_at = Column(DateTime)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    sale_price = Column(Float)