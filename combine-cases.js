const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");

const casesDir = "./cases";
const outputFile = "./cases.json";

async function combineCases() {
  try {
    const combinedCases = [];
    const caseFolders = fs
      .readdirSync(casesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const caseName of caseFolders) {
      const caseFilePath = path.join(casesDir, caseName, "case.json");

      if (fs.existsSync(caseFilePath)) {
        const caseData = JSON.parse(fs.readFileSync(caseFilePath, "utf8"));

        // Update image paths in the original caseData (as before)
        updateImagePaths(caseData, caseName);

        // Add id, lastupdated, and images
        const images = await getCaseImages(caseName); // Get image data
        const updatedCaseData = {
          id: caseName,
          images: images,
          ...caseData, // Merge the original case data
        };

        combinedCases.push(updatedCaseData);
      } else {
        console.warn(`case.json not found in ${caseName}`);
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(combinedCases, null, 2));
    console.log(`Combined cases saved to ${outputFile}`);
  } catch (error) {
    console.error("Error combining cases:", error);
    process.exit(1);
  }
}

function updateImagePaths(obj, caseName) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      if (
        obj[key].startsWith("./") &&
        (obj[key].endsWith(".png") ||
          obj[key].endsWith(".jpg") ||
          obj[key].endsWith(".jpeg") ||
          obj[key].endsWith(".gif") ||
          obj[key].endsWith(".svg"))
      ) {
        obj[key] = `/cases/${caseName}/${obj[key].substring(2)}`;
      }
    } else if (typeof obj[key] === "object") {
      updateImagePaths(obj[key], caseName);
    }
  }
}

async function getCaseImages(caseName) {
  const imagesDir = path.join(casesDir, caseName);
  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(png|jpg|jpeg|gif|svg)$/i.test(file)); // Filter for image files

  const imageData = [];
  for (const imageFile of imageFiles) {
    const imagePath = path.join(imagesDir, imageFile);
    try {
      const dimensions = await sizeOf(imagePath); // Get image dimensions
      imageData.push({
        path: `/cases/${caseName}/${imageFile}`,
        width: dimensions.width,
        height: dimensions.height,
      });
    } catch (err) {
      console.error(`Error getting dimensions for ${imagePath}:`, err);
    }
  }
  return imageData;
}

combineCases();
