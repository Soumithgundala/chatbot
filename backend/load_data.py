import pandas as pd
from sqlalchemy.orm import sessionmaker
from database import engine, Base
from models import User, DistributionCenter, Product, Order, OrderItem, InventoryItem
import logging
import re

# Setup logging to see the progress
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define the path to your data files
DATA_PATH = '../data/archive/archive/'

def clean_and_load(file_path, model, session, chunk_size=10000):
    """Reads a CSV in chunks, cleans data, and loads it into the database."""
    logging.info(f"Processing file: {file_path}")
    
    # Use an iterator to handle large files efficiently
    chunk_iterator = pd.read_csv(file_path, chunksize=chunk_size, on_bad_lines='warn', iterator=True)
    
    for i, chunk in enumerate(chunk_iterator):
        # --- Data Cleaning ---
        # Standardize column names (lowercase, remove leading/trailing spaces)
        chunk.columns = [re.sub(r'[^a-zA-Z0-9_]', '', col.lower().strip()) for col in chunk.columns]
        
        # Handle date columns, coercing errors to NaT (Not a Time)
        for col in chunk.columns:
            if 'at' in col: # A simple heuristic for date columns
                chunk[col] = pd.to_datetime(chunk[col], errors='coerce')
        
        # Replace pandas NaT with None for database compatibility
        chunk = chunk.where(pd.notnull(chunk), None)
        
        # Convert dataframe to a list of dictionaries for bulk insertion
        data_to_load = chunk.to_dict(orient='records')
        
        try:
            session.bulk_insert_mappings(model, data_to_load)
            session.commit()
            logging.info(f"Chunk {i+1} for {model.__tablename__} loaded successfully.")
        except Exception as e:
            session.rollback()
            logging.error(f"Error loading chunk {i+1} for {model.__tablename__}: {e}")
            logging.error("Some rows in this chunk may not have been loaded.")


def main():
    """Main function to create tables and load all data."""
    logging.info("--- Starting Database Ingestion ---")
    
    try:
        # This command connects to the database and creates all tables defined in models.py
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logging.info("Tables created successfully (if they didn't exist).")
    except Exception as e:
        logging.error(f"Could not create tables. Please check DB connection in .env file. Error: {e}")
        return

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Load data in an order that respects foreign key relationships
        # For example, 'distribution_centers' must exist before 'products' that reference it.
        clean_and_load(f'{DATA_PATH}distribution_centers.csv', DistributionCenter, session)
        clean_and_load(f'{DATA_PATH}users.csv', User, session)
        clean_and_load(f'{DATA_PATH}products.csv', Product, session)
        clean_and_load(f'{DATA_PATH}orders.csv', Order, session)
        clean_and_load(f'{DATA_PATH}inventory_items.csv', InventoryItem, session)
        clean_and_load(f'{DATA_PATH}order_items.csv', OrderItem, session)
        
        logging.info("--- All data has been successfully loaded into the database! ---")
    except Exception as e:
        logging.error(f"An error occurred during the data loading process: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
