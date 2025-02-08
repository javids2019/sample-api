const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const multer = require('multer');
const { createBlob } = require('@vercel/blob');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 4000;
app.use(express.json());

// This will enable CORS for all routes
app.use(bodyParser.json());

// Load environment variables from .env file
dotenv.config();


const key_id = process.env.AJ_RAZORPAY_KEY_ID || 'rzp_live_ZDmFUssbqr7kRa';
const key_secret = process.env.AJ_RAZORPAY_SECRET || 'ZeJJLLvDTN93mPrRyBu7dd7z';
 

// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000", // React app running locally
  "https://aj-smile-foundation.com", 
  "https://www.aj-smile-foundation.com",  
  "https://sample-api-psi.vercel.app"
];

try
{
 const destinationDir = path.join('/tmp', 'images');
if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true }); // Create the directory if it doesn't exist
   }
}
catch (err) {
    console.error('Error creating directory:', err);
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // If the origin is in the list, allow the request
      return callback(null, true);
    } else {
      // Otherwise, block the request
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  secure: false,
  auth: {
    user: 'ae9f3a6056fc22',
    pass: '3c1446d52329e8',
  }
});

// Configure the mailoptions object

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Node.js server!' });
}); 
const upload = multer();
const upload1 = multer({ dest: '/tmp/' });



app.post('/api/send-whatsup-message', async (req, res) => {
  try {
const accountSid = 'ACeb65ad384009fac9268f2453313220f5';
const authToken = 'c1aea91c9bdd187402b9e213303a2805';
console.log('client started ');
const client = require('twilio')(accountSid, authToken);
console.log('client created ');

client.messages
.create({
    from: req.body.from,
    body: req.body.html,
    to: req.body.to
})
.then(message => console.log(message.sid))
.done();
   


  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: JSON.stringify(error) });
  }
});


app.post('/api/send-whatsup-message2', async (req, res) => {
  try {
    const accountSid = 'ACeb65ad384009fac9268f2453313220f5';
    const authToken = 'c1aea91c9bdd187402b9e213303a2805';
    console.log('client started ');
    const client = require('twilio')(accountSid, authToken);
    console.log('client created ');
    console.log('Request data ', req.body);
    console.log('Request req.body.donarName ', req.body.donarName);
    console.log('Request req.body.receiptNumber ', req.body.receiptNumber);
   
    client.messages
      .create({    
        body: req.body.html,
        contentSid: "HX333fb47d5bfe525687662771481dc1e1",
        contentVariables: JSON.stringify({
          1: req.body.donarName,
          2: req.body.receiptNumber,
          3: req.body.donationDate,
          4: req.body.donationAmount,
          5: req.body.paymentMethod,
          6: req.body.purposeofDonation
        }),
        to: req.body.to,
        from: 'whatsapp:+919791994147'
      })
      .then(message => console.log(message.sid));

  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: JSON.stringify(error) });
  }
});

app.post('/api/file-upload', upload.single('image'), async (req, res) => {
    try {
        // Get the file from the request
        const file = req.file;

        // Upload the file to Vercel Blob
        const blob = await createBlob({
            data: file.buffer, // File data (binary)
            contentType: file.mimetype, // MIME type (e.g., image/png)
            access: 'public', // Set access level (e.g., public or private)
        });

        console.log('Blob uploaded successfully:', blob);

        // Send the blob URL as a response
        res.status(200).json({ filePath: blob.url });
    } catch (error) {
        console.error('Error uploading blob:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

app.post('/api/file-upload1', upload1.single('image'), (req, res) => { 
  const tempPath = req.file.path;
  const targetPath = path.join('/images', req.file.filename);
   const fileUrl = `https://sample-api-psi.vercel.app/images/${req.file.filename}`;
    // Move the file to its final destination
    fs.rename(tempPath, targetPath, (err) => {
        if (err) {
            console.error('Error moving file:', err);
            return res.status(500).send('File upload failed');
        }
        console.log('File uploaded to:', targetPath);
        // res.send('File uploaded successfully');
        res.json({ filePath: fileUrl });
    }); 
});

app.get('/images/:filename', (req, res) => {
    const filePath = path.join('/images', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});
  
app.post('/api/send-mail', async (req, res) => {
  try {

    const mailOptions = {
      from: `"${req.body.from.name}" <${req.body.from.email}>`,
      to: `"${req.body.to[0].name}" <${req.body.to[0].email}>`,    
      subject: req.body.subject,
      html: req.body.html
    };

    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(200).json('Email sent successfully');
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: JSON.stringify(error) });
  }
});

 
// Replace with your Razorpay credentials
const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

app.post('/api/create-order', async (req, res) => {
  const { amount } = req.body;

  try {
      const options = {
          amount, // Amount in paise (₹500.00 => 50000)
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).send('Error creating Razorpay order');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});

 
