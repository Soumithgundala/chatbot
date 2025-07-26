import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the database URL from the environment variable
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable set. Please create a .env file.")

# Create the SQLAlchemy engine for MySQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a sessionmaker to generate database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models (the tables in our database)
Base = declarative_base()

# Dependency function to get a database session for each API request
# We will use this in Milestone 2
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()