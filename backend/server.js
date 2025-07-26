const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Initialize Express app
const app = express();
const port = 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Data Storage ---
const data = {
    products: [],
    orders: [],
    orderItems: [],
    inventoryItems: [],
    users: [],
    distributionCenters: [],
};

// --- Helper function to load CSV data ---
const loadCSVData = (filePath, dataKey) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found at: ${filePath}`));
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => data[dataKey].push(row))
            .on('end', () => {
                console.log(`${path.basename(filePath)} (${data[dataKey].length} rows) loaded successfully.`);
                resolve();
            })
            .on('error', reject);
    });
};

// --- Logic Functions to Answer Questions ---

function getOrderStatus(orderId) {
    const order = data.orders.find(o => o.order_id === orderId);
    return order ? `The status for order ID ${orderId} is: ${order.status}.` : `Sorry, I could not find any information for order ID ${orderId}.`;
}

function getTopSellingProducts(n = 5) {
    const productCounts = data.orderItems.reduce((acc, item) => {
        acc[item.product_id] = (acc[item.product_id] || 0) + 1;
        return acc;
    }, {});
    const sortedProducts = Object.keys(productCounts).sort((a, b) => productCounts[b] - productCounts[a]);
    const topProductIds = sortedProducts.slice(0, n);
    const productDetails = topProductIds.map(id => data.products.find(p => p.id === id));
    let response = `Here are the top ${n} selling products:\n`;
    productDetails.forEach((p, index) => {
        if (p) { response += `${index + 1}. ${p.name}\n`; }
    });
    return response;
}

function getProductStockLevel(productNameQuery) {
    const product = data.products.find(p => p.name.toLowerCase().includes(productNameQuery.toLowerCase()));
    if (!product) {
        return `Sorry, I could not find a product named "${productNameQuery}".`;
    }
    const stockCount = data.inventoryItems.filter(item => item.product_id === product.id && !item.sold_at).length;
    return `There are ${stockCount} units of "${product.name}" left in stock.`;
}

function getProductPrice(productNameQuery) {
    const product = data.products.find(p => p.name.toLowerCase().includes(productNameQuery.toLowerCase()));
    if (!product) {
        return `Sorry, I could not find a product named "${productNameQuery}".`;
    }
    return `The price of "${product.name}" is $${parseFloat(product.retail_price).toFixed(2)}.`;
}

function countItemsByStatus(statusQuery) {
    const count = data.orders.filter(o => o.status.toLowerCase() === statusQuery.toLowerCase()).length;
    return `There are ${count} orders with the status "${statusQuery}".`;
}

// --- Main API Endpoint ---
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    let botResponse = "I'm sorry, I don't understand that question yet. Please try asking about top products, order status, or stock levels.";

    // --- Intent Recognition Engine ---
    
    // Order Status: "status of order 12345"
    if (userMessage.startsWith('status of order')) {
        const match = userMessage.match(/\d+/);
        if (match) {
            botResponse = getOrderStatus(match[0]);
        } else {
            botResponse = "Please provide an order ID to check the status (e.g., 'status of order 12345').";
        }
    // Top Selling: "top 5 selling products"
    } else if (userMessage.includes('top') && userMessage.includes('selling')) {
        const match = userMessage.match(/\d+/);
        const count = match ? parseInt(match[0]) : 5;
        botResponse = getTopSellingProducts(count);
    // Stock Level: "how many classic t-shirts are in stock"
    } else if (userMessage.startsWith('how many') && (userMessage.includes('in stock') || userMessage.includes('left'))) {
        const productNameMatch = userMessage.match(/how many (.*) (are in stock|are left)/);
        if (productNameMatch && productNameMatch[1]) {
            botResponse = getProductStockLevel(productNameMatch[1].trim());
        }
    // Product Price: "what is the price of classic t-shirt?"
    } else if (userMessage.startsWith('what is the price of')) {
        // FIXED: Remove punctuation from the end of the query
        const productName = userMessage.replace('what is the price of', '').replace(/[?.!]/g, '').trim();
        botResponse = getProductPrice(productName);
    // Count by Status: "how many orders are cancelled?"
    } else if (userMessage.startsWith('how many orders are')) {
        // FIXED: Remove punctuation from the end of the query
        const status = userMessage.replace('how many orders are', '').replace(/[?.!]/g, '').trim();
        botResponse = countItemsByStatus(status);
    }

    res.json({ response: botResponse });
});

// --- Start Server and Load All Data ---
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    try {
        const dataBasePath = '../data/archive/archive';
        await loadCSVData(path.join(dataBasePath, 'products.csv'), 'products');
        await loadCSVData(path.join(dataBasePath, 'orders.csv'), 'orders');
        await loadCSVData(path.join(dataBasePath, 'order_items.csv'), 'orderItems');
        await loadCSVData(path.join(dataBasePath, 'inventory_items.csv'), 'inventoryItems');
        await loadCSVData(path.join(dataBasePath, 'users.csv'), 'users');
        await loadCSVData(path.join(dataBasePath, 'distribution_centers.csv'), 'distributionCenters');
        console.log('All data loaded and ready. Chatbot logic is online.');
    } catch (error) {
        console.error('FATAL: Failed to load CSV data:', error);
    }
});
