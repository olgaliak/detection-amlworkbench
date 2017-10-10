import * as azure from 'azure-storage';

const SUBSCRIPTION_KEY = '<YOUR AZURE API MANAGEMENT SUBSCRIPTION KEY>';
const API_HOST = '<YOUR AZURE API MANAGEMENT API>';
const AZURE_STORAGE_ACCOUNT = '<YOUR AZURE STORAGE ACCOUNT>';
const AZURE_STORAGE_ACCESS_KEY = '<YOUR AZURE STORAGE ACCOUNT ACCESS KEY>';
const TENSORFLOW_AUTHORIZATION_BEARER = '<YOUR TENSORFLOW AUTH BEARER KEY>';

/*
 * Create a blob storage URL
 * @param {string} containerName 
 * @param {string} filename 
 */
export function generateAzureBlobURL(containerName, filename) {
  const url = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${filename}`;
  return url;
}

export async function getBlobService() {
  try {
    const blobService = new azure.BlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    return blobService;
  } catch (err) {
    console.error(err);
    window.localStorage.clear();
    return null;
  }
}

/**
 * @returns {Promise<Container[]>}
 */
export async function getContainers() {
  const blobService = await getBlobService();
  if (!blobService) {
    return [];
  }

  try {
    let continuationToken;
    let containers = [];
    const fetchListSegment = token =>
      new Promise((resolve, reject) => {
        blobService.listContainersSegmented(token, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
      });
    do {
      const listContainerResult = await fetchListSegment(continuationToken);
      continuationToken = listContainerResult.continuationToken;
      containers = [...containers, ...listContainerResult.entries];
    } while (continuationToken);
    return containers;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Given the container, return the list of blobs in the container
 * @param {string} container 
 * @return {Array<Blob>}
 */
export async function getBlobs(container) {
  const blobService = await getBlobService();
  if (!blobService) {
    return [];
  }

  try {
    let continuationToken;
    let blobs = [];
    const fetchListSegment = token =>
      new Promise((resolve, reject) => {
        blobService.listBlobsSegmented(container, token, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
      });
    do {
      const listBlobResult = await fetchListSegment(continuationToken);
      continuationToken = listBlobResult.continuationToken;
      blobs = [...blobs, ...listBlobResult.entries];
    } while (continuationToken);

    // only return images
    return blobs.filter(blob => /\.(gif|jpg|jpeg|tiff|png)$/i.exec(blob.name));
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * @param {string} fileurl - full url to the image to be processed
 * @returns {Array<Labels>}
 */
export async function tensorflow(fileurl) {
  return fetch(`${API_HOST}/tensorflow/`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      Authorization: TENSORFLOW_AUTHORIZATION_BEARER,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Trace': 'true',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify({
      input: fileurl,
    }),
  })
    .then(response => response.json())
    .then((body) => {
      const jsonBody = JSON.parse(body);
      const parsed = { output: JSON.parse(jsonBody.output) };
      const labels = parsed.output.map((label) => {
        const x = Number.parseInt(label[0], 10);
        const y = Number.parseInt(label[2], 10);
        const width = Number.parseInt(label[1] - label[0], 10);
        const height = Number.parseInt(label[3] - label[2], 10);
        const text = 'TensorFlow';
        const score = Number.parseFloat('0.000');
        const color = 'orange';
        return { x, y, width, height, text, score, color };
      });

      return labels;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}

/**
 * @param {string} filename - filename of file in 'data' container
 * @returns {Array<Label>}
 */
export async function cntk(filename) {
  return fetch(`${API_HOST}/tensorflow/`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Trace': 'true',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify({
      filename,
    }),
  })
    .then(response => response.json())
    .then((body) => {
      const labels = body.map((label) => {
        const x = label.box[0];
        const y = label.box[1];
        const width = label.box[2] - label.box[0];
        const height = label.box[3] - label.box[1];
        const text = label.label || 'CNTK';
        const score = Number.parseFloat(label.score);
        const color = 'blue';
        return { x, y, width, height, text, score, color };
      });

      return labels;
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}
