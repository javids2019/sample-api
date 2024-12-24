const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 4000;
app.use(express.json());

// This will enable CORS for all routes
app.use(bodyParser.json());

// Load environment variables from .env file
dotenv.config();

const imagesFolder = process.env.REACT_IMAGE_STORE_LOCATION_URL || './public/files/'; // "./public/files/";
const key_id = process.env.AJ_RAZORPAY_KEY_ID || 'rzp_live_ZDmFUssbqr7kRa';
const key_secret = process.env.AJ_RAZORPAY_SECRET || 'ZeJJLLvDTN93mPrRyBu7dd7z';
 

// List of allowed origins
const allowedOrigins = [
  "http://localhost:3000", // React app running locally
  "https://aj-smile-foundation.com", 
  "https://sample-api-psi.vercel.app"
];


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
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false, // use SSL
  auth: {
    user: 'smtp@mailtrap.io',
    pass: '197411ce806aa978c5654897a92e34de',
  }
});

// Configure the mailoptions object

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Node.js server!' });
});


// Ensure the images folder exists
try {
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder, { recursive: true });
  }
  console.log('Directory created successfully!');
} catch (err) {
  console.error('Error creating directory:', err);
}



// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //cb(null, process.env.REACT_IMAGE_STORE_LOCATION_URL); // Specify upload directory
    cb(null, imagesFolder); // Specify upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // Customize file name
  },
});

const upload = multer({ dest: '/tmp/' });

const convertBase64Image = (filePath, base64Image) => {
  fs.writeFile(filePath, base64Image, function(err) {
    console.log('File created');
});
}

app.post('/api/file-upload', upload.single('image'), (req, res) => {
  //const _filePath = '../files/' + Date.now() + '.png';
  const tempPath = req.file.path;
  const targetPath = path.join('/tmp', req.file.originalname);
   const fileUrl = `https://sample-api-psi.vercel.app/tmp/${req.file.filename}`;
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

app.get('/tmp/:filename', (req, res) => {
    const filePath = path.join('/tmp', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.post("/api/upload", (req, res) => {
  try {
    const _filePath = imagesFolder + Date.now() + '.png';
    convertBase64Image(_filePath, req?.body?.image);
 

    if (!req.body.image) {
      return res.status(400).send({ message: "Please upload an image!" });
    }
    res.status(200).send({
      message: "Image uploaded successfully!",
      filePath: _filePath,
    });
    
  } 
  catch (error) {
    console.log('Error', error);
  }


  // res.send({ message: "File uploaded successfully!" , filePath: `/files/${req.file.filename}` });
});


app.post("/api/uploadBase64", (req, res) => {
  const { base64 , filename } = req.body;
 
  if (!base64 || !filename) {
    return res.status(400).send({ message: "Invalid request. Base64 or filename missing!" });
  }

  // Extract the Base64 part (remove `data:image/png;base64,` prefix)
  const base64Data = base64.split(";base64,").pop();
 
  // Save file to the `uploads` directory
  const filePath = imagesFolder + filename;
  console.log(filePath);
  fs.writeFile(filePath, base64Data, { encoding: "base64" }, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).send({ message: "Failed to save file!" });
    }

    res.send({ message: "File uploaded successfully!", filePath: filePath });
  });
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

 
