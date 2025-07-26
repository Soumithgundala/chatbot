const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Corrected: require 'path' module
const csv = require('csv-parser');

// Initialize Express app
const app = express();
const port = 5001; // Using a different port than the default React port

// --- Middleware ---
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Allow the server to understand JSON

// --- Data Storage ---
let products = [];
let orders = [];
let orderItems = [];

// --- Helper function to load CSV data ---
const loadCSVData = (filePath, dataArray) => {
    return new Promise((resolve, reject) => {
        // Check if file exists before trying to read
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found at: ${filePath}`));
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => dataArray.push(row))
            .on('end', () => {
                console.log(`${path.basename(filePath)} loaded successfully.`);
                resolve();
            })
            .on('error', reject);
    });
};

// --- Chatbot Logic Functions ---

const getTopSellingProducts = (n = 5) => {
    if (orderItems.length === 0 || products.length === 0) {
        return "Sorry, product data is still loading or could not be found. Please try again in a moment.";
    }

    const productCounts = orderItems.reduce((acc, item) => {
        acc[item.product_id] = (acc[item.product_id] || 0) + 1;
        return acc;
    }, {});

    const sortedProducts = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]);
    const topProductIds = sortedProducts.slice(0, n);

    const productDetails = topProductIds.map(id => {
        return products.find(p => p.id === id);
    });

    let response = "Here are the top 5 selling products:\n";
    productDetails.forEach((p, index) => {
        if (p) {
            response += `${index + 1}. ${p.name}\n`;
        }
    });
    return response;
};

const getOrderStatus = (orderId) => {
    if (orders.length === 0) {
        return "Sorry, order data is still loading or could not be found. Please try again in a moment.";
    }
    const order = orders.find(o => o.order_id === orderId);
    return order ? `The status for order ID ${orderId} is: ${order.status}.` : `Sorry, I could not find any information for order ID ${orderId}.`;
};


// --- API Endpoint ---
app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    let botResponse = "I'm sorry, I don't understand. You can ask about 'top 5 selling products' or 'status of order id: 12345'.";

    // --- Simple Intent Recognition ---
    if (userMessage.includes('top') && userMessage.includes('selling')) {
        botResponse = getTopSellingProducts();
    } else if (userMessage.includes('status of order')) {
        const match = userMessage.match(/\d+/); // Find the first number in the string
        if (match) {
            const orderId = match[0];
            botResponse = getOrderStatus(orderId);
        } else {
            botResponse = "Please provide an order ID to check the status (e.g., 'status of order id 12345').";
        }
    }

    res.json({ response: botResponse });
});

// --- Start Server and Load Data ---
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    try {
        // *** CORRECTED FILE PATHS ***
        const dataBasePath = '../data/archive/archive';
        await loadCSVData(path.join(dataBasePath, 'products.csv'), products);
        await loadCSVData(path.join(dataBasePath, 'orders.csv'), orders);
        await loadCSVData(path.join(dataBasePath, 'order_items.csv'), orderItems);
        console.log('All data loaded and ready.');
    } catch (error) {
        console.error('Failed to load CSV data:', error);
        console.error("Please ensure the CSV files exist at 'chatbot/data/archive/archive/'");
    }
});
