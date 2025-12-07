import imageCompression from "browser-image-compression";

let tokenClient;
let accessToken = null;
const API_KEY = "AIzaSyC3GV31SpenqBw8HCxhwZSZqouFWk5JgLY";

/**
 * Initialize GIS token client
 */
export const initGIS = (clientId) => {
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (tokenResponse) => {
        accessToken = tokenResponse.access_token;
        resolve(accessToken);
      },
    });
  });
};

/**
 * Request access token interactively
 */
export const requestAccessToken = async () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject("GIS not initialized");
    tokenClient.requestAccessToken();
    const checkToken = setInterval(() => {
      if (accessToken) {
        clearInterval(checkToken);
        resolve(accessToken);
      }
    }, 100);
  });
};

/**
 * Upload a file to a specific Google Drive folder
 */
export const uploadToDrive = async (file, folderId, filename) => {
  if (!accessToken) {
    await requestAccessToken();
  }

  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  });

  const finalName = filename || compressedFile.name;

  // 1️⃣ Search for existing file with same name in folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${finalName}' and '${folderId}' in parents&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const searchData = await searchRes.json();
  let fileId;

  if (searchData.files && searchData.files.length > 0) {
    // 2️⃣ File exists → update it
    fileId = searchData.files[0].id;
    const metadata = {
      name: finalName,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", compressedFile);

    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
  } else {
    // 3️⃣ File doesn't exist → create new
    const metadata = { name: finalName, parents: [folderId] };
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", compressedFile);

    const createRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );

    const createData = await createRes.json();
    fileId = createData.id;
  }

  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
};

