import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 8000;
const mongoClient = new MongoClient(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoClient.connect(err => {
    if (err) {
        console.log('Failed to connect to MongoDB', err);
        return;
    }
    console.log('Connected to MongoDB');
});

// Access the database
const db = mongoClient.db('yourDatabaseName');
const usersCollection = db.collection('users');

app.post('/create', async (req, res) => {

    const { country, service, address } = req.body;
    console.log(country,service,address)
    const apiUrl = `https://${process.env.API_DOMAIN}/v1/user/buy/activation/${country}/any/${service}`;
    const apiHeaders = {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json',
    };

    try {
        const apiResponse = await fetch(apiUrl, { headers: apiHeaders });
        const data = await apiResponse.json();

        if (apiResponse.ok) {
            // Extract the phone number from the API response
            const { phone } = data;

            const orderData = {
                phoneNumber: phone,
                country,
                service,
                otherDetails: data
            };


            // Update or insert the document based on address
            await usersCollection.updateOne(
                { address: address },
                { $push: { orders: orderData } },
                { upsert: true }
            );

            return res.json(data);
        } else {
            res.status(apiResponse.status).json({ message: 'Failed to fetch data from API', details: data });
        }
    } catch (error) {
        console.error("API access error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// app.get('/orders', async (req, res) => {
//     const { phoneNumber, address } = req.query;

//     try {
//         const user = await usersCollection.findOne({ address: address, "orders.phoneNumber": phoneNumber });
//         if (user) {
//             const order = user.orders.find(order => order.phoneNumber === phoneNumber);
//             res.status(200).json(order);
//         } else {
//             res.status(404).json({ message: "No order found for the provided phone number at the given address." });
//         }
//     } catch (error) {
//         console.error("Database access error:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

app.post('/orders', async (req, res) => {
    const { address } = req.body;

    if (!address) {
        return res.status(400).json({ message: "Address is required." });
    }

    try {
        const user = await usersCollection.find({ "address": address }).toArray();
        if (user.length) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "No user found with the provided address." });
        }
    } catch (error) {
        console.error("Database access error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.delete('/delete-order', async (req, res) => {
    const { address, phoneNumber } = req.body;

    if (!address || !phoneNumber) {
        return res.status(400).json({ message: "Address and phone number required." });
    }

    try {
        // Assuming each address can have multiple orders, including multiple phone numbers
        const result = await usersCollection.updateOne(
            { address },
            { $pull: { orders: { phoneNumber } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "No order found with the given phone number to delete." });
        }

        res.status(200).json({ message: "Order deleted successfully." });
    } catch (error) {
        console.error("Database access error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Route to check the order status with 5sim API based on the provided id
app.post('/check-order', async (req, res) => {
    const { id } = req.body;  // Extract id from request body
        console.log(id)
    if (!id) {
        return res.status(400).json({ message: "Phone number is required." });
    }

    try {
        // Search the database for a user with the given phone number in any of their orders
        const user = await usersCollection.findOne({ "orders.phoneNumber": id });

        if (!user) {
            return res.status(404).json({ message: "No user found with the provided phone number." });
        }
        
        // Find the order with the given phone number
        const order = user.orders.find(order => order.phoneNumber === id);

        if (!order) {
            return res.status(404).json({ message: "No order found with the provided phone number." });
        }

        // Extract the ID from the order's otherDetails
        const orderId = order.otherDetails.id;
        console.log(orderId )
        // Call the 5sim API using the orderId
        const apiUrl = `https://5sim.net/v1/user/check/${orderId}`;
        const apiHeaders = {
            'Authorization': `Bearer ${process.env.API_KEY}`,
            'Accept': 'application/json',
        };
        let smsLength = 0;
        const apiResponse = await fetch(apiUrl, { headers: apiHeaders });
        const data = await apiResponse.json();
        if (apiResponse.ok) {
            // Ensure the data.sms array exists and has at least one item
            if (data.sms && data.sms.length > 0 && data.sms[0].text !== "") {
                smsLength = 1;
            } else {
                smsLength = 0;

            }
            // Return the 5sim API response along with the order details
            res.status(200).json({ data, orderDetails: order, smsLength });
        } else {
            // Handle errors from the 5sim API
            res.status(apiResponse.status).json({ message: 'Failed to fetch data from 5sim API', details: data });
        }
    } catch (error) {
        console.error("Error during processing:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.post('/generate-email', async (req, res) => {
    const { address } = req.body;
    
    if (!address) {
        return res.status(400).json({ message: "Address is required." });
    }

    try {
        // Generate a random email from 1secmail API
        const apiUrl = 'https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1';
        const apiResponse = await fetch(apiUrl);
        const mailData = await apiResponse.json();

        if (!apiResponse.ok) throw new Error('Failed to fetch email from 1secmail.');

        // Save or update the user's mailbox in the MongoDB
        // Use $push to add the new mailbox to an existing array
        const updateResult = await usersCollection.updateOne(
            { address: address },
            { $push: { mailboxes: { $each: mailData } } },  // Assuming mailData is an array and pushing each element
            { upsert: true }
        );

        console.log(updateResult);

        // Check if the update was successful
        if (updateResult.matchedCount === 0 && updateResult.upsertedCount === 0) {
            throw new Error('Failed to update user data.');
        }

        // Return the mailbox data along with a success message
        res.status(200).json({ message: "Mailbox generated successfully.", mailbox: mailData });
    } catch (error) {
        console.error("Error during mailbox generation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.post('/get-emails', async (req, res) => {
    const { id } = req.body;
    console.log(id)
    if (!id) {   
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        // Split the email address into login and domain
        const [login, domain] = id.split('@');

        if (!login || !domain) {
            return res.status(400).json({ message: "Invalid email address format." });
        }

        // Construct the API URL with the extracted login and domain
        const apiUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;

        // Fetch messages from 1secmail API
        const apiResponse = await fetch(apiUrl);
        const messages = await apiResponse.json();
        console.log(messages)
        if (!apiResponse.ok) {
            throw new Error('Failed to fetch messages from 1secmail.');
        }

        // Return the messages to the client
        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});