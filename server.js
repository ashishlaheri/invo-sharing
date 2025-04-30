const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const port = process.env.PORT || 8080;

// Connect to Azure Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'uploads';
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

app.use(express.static('public'));
app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  const blobName = req.file.originalname;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadFile(req.file.path);
  res.send('File uploaded successfully to Azure Storage!');
});

// List files with download URLs
app.get('/files', async (req, res) => {
  try {
    const fileList = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      fileList.push({
        name: blob.name,
        url: blockBlobClient.url
      });
    }
    res.json(fileList);
  } catch (error) {
    console.error('Error listing blobs:', error.message);
    res.status(500).send('Failed to retrieve file list');
  }
});


// ✅ Only ONE listener — required for Azure
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
