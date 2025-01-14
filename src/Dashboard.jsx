import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { Bar } from "react-chartjs-2";
import a1Logo from "./assets/images/a1.png";
import { saveAs } from 'file-saver'; // You'll need to install this package

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ThresholdingPanel() {
  const [sliderValue, setSliderValue] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [thresholdedImage, setThresholdedImage] = useState(null);
  const [modifiedHistogramData, setModifiedHistogramData] = useState(
    Array(256).fill(0)
  );
  const [originalHistogramData, setOriginalHistogramData] = useState(
    Array(256).fill(0)
  );

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        setIsUploaded(true);
        setThresholdedImage(null); // Reset thresholded image on new upload
        setModifiedHistogramData(Array(256).fill(0)); // Reset histogram
        calculateOriginalHistogram(reader.result); // Calculate original histogram
      };
      reader.readAsDataURL(file);
    }
  };

  const exportEditedImage = (imageDataUrl) => {
    fetch(imageDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        saveAs(blob, 'edited_image.jpg'); // Specify the name of the exported file
      });
  };

  const exportAsJPG = () => {
    // Assuming you have a canvas element with the ID 'canvas' where the chart is rendered
    const canvas = document.getElementById('canvas'); // Adjust this to your canvas ID or method of obtaining the image
    if (canvas) {
      canvas.toBlob((blob) => {
        saveAs(blob, 'exported_image.jpg'); // Name of the file
      }, 'image/jpeg');
    }
  };

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
  };

  const handleReset = () => {
    setThresholdedImage(null); // Reset to original image
    setSliderValue(0); // Reset slider value
    setModifiedHistogramData(Array(256).fill(0)); // Reset histogram
  };

  const calculateOriginalHistogram = (imageSrc) => {
    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Create a new histogram array for the original image
      const newOriginalHistogram = Array(256).fill(0);

      // Calculate histogram
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // Calculate average for RGB
        newOriginalHistogram[Math.floor(avg)]++; // Increment histogram for the average value
      }

      // Update original histogram data
      setOriginalHistogramData(newOriginalHistogram);
    };
  };

  const handleApplyThreshold = () => {
    if (uploadedImage) {
      const image = new Image();
      image.src = uploadedImage;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = sliderValue;

        // Create a new histogram array
        const newHistogram = Array(256).fill(0);

        // Apply thresholding and calculate histogram
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // Calculate average for RGB
          const value = avg >= threshold ? 255 : 0; // Set to white or black based on threshold

          // Update pixel values after thresholding
          data[i] = value; // Red
          data[i + 1] = value; // Green
          data[i + 2] = value; // Blue

          // Increment histogram based on thresholded value (0 or 255)
          newHistogram[value === 255 ? 255 : 0]++; // Increment the histogram for black or white
        }

        // Update the canvas with the thresholded image
        ctx.putImageData(imageData, 0, 0);
        setThresholdedImage(canvas.toDataURL());

        // Update histogram data
        setModifiedHistogramData(newHistogram);
      };
    }
  };

  const handleUploadAgain = () => {
    setUploadedImage(null);
    setIsUploaded(false);
    setSliderValue(0);
    setThresholdedImage(null); // Reset thresholded image on new upload
    setModifiedHistogramData(Array(256).fill(0)); // Reset histogram
    setOriginalHistogramData(Array(256).fill(0));
  };

  // Chart.js Data Setup
  const originalChartData = {
    labels: Array.from({ length: 256 }, (_, i) => i), // Labels for 0-255
    datasets: [
      {
        label: "Original Histogram",
        data: originalHistogramData,
        backgroundColor: "rgba(54, 162, 235, 0.6)", // Different color for original histogram
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const modifiedChartData = {
    labels: Array.from({ length: 256 }, (_, i) => i), // Labels for 0-255
    datasets: [
      {
        label: "Modified Histogram",
        data: modifiedHistogramData,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-gray-100 h-screen flex justify-between">
      {/* Sidebar */}
      <div className="flex flex-col items-start bg-white rounded-r-lg shadow-lg p-2 space-y-5 w-18">
        <div className="flex items-center justify-center rounded-md bg-white-600 p-4 text-white transition-all">
          <img src={a1Logo} alt="Logo" className="h-8 w-8" />
        </div>
        <div className="flex flex-col items-start space-y-9 w-full">
          <ul className="flex flex-col space-y-6 w-full">
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
                />
              </svg>
            </li>
            {/* Sidebar Items */}
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            </li>
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </li>
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </li>
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0v1.5m0-1.5h-1.5M21 3h1.5m-1.5 0v11.25A2.25 2.25 0 0116.5 18h-2.25m4.5-1.5v-9m-5.25 10.5h-4.5m4.5 0V20.25m0-1.5h-1.5m1.5 0V20.25m0-8.25h-1.5"
                />
              </svg>
            </li>
            <li className="p-5 rounded-md hover:bg-blue-100 transition-all cursor-pointer flex items-center w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-4 flex-col">
        <div className="w-full h-[85vh] flex items-center justify-center relative flex-grow">
          {isUploaded ? (
            <div className="flex w-full h-full space-x-6">
              {/* First container for the uploaded image */}
              <div className="w-1/2 h-full p-4 border border-gray-200 rounded-md flex items-center justify-center">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="object-contain w-full h-full"
                />
              </div>

              {/* Second container for the thresholded image */}
              <div className="w-1/2 h-full p-4 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                {thresholdedImage ? (
                  <img
                    src={thresholdedImage}
                    alt="Thresholded"
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span>No threshold applied</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <label
                htmlFor="cover-photo"
                className="block text-l font-medium leading-6 text-gray-900"
              >
                Upload Photo Here
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-400 px-40 py-20">
                <div className="text-center">
                  <PhotoIcon
                    aria-hidden="true"
                    className="mx-auto h-28 w-28 text-gray-300"
                  />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-bold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Again button */}
      </div>

      {/* Control panel */}
      <div className="flex flex-col items-start bg-white shadow-lg p-6 w-96 justify-normal">
        <div className="flex justify-between w-full mb-2">
          <p className="text-2xl font-bold text-gray-700">Control Panel</p>
          <button
            id="dropdownMenuIconButton"
            data-dropdown-toggle="dropdownDots"
            className="p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none"
            type="button"
            onClick={() => {
              const dropdown = document.getElementById("dropdownDots");
              dropdown.classList.toggle("hidden");
            }}
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 4 15"
            >
              <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        <div
          id="dropdownDots"
          className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44"
        >
          <ul
            className="py-2 text-sm text-gray-700"
            aria-labelledby="dropdownMenuIconButton"
          >
            <li>
        <a
          href="#"
          className="block px-4 py-2 hover:bg-gray-100"
          onClick={() => {
            const editedImageDataUrl = document.getElementById('editedImage').src; // Adjust this to get your edited image source
            exportEditedImage(editedImageDataUrl);
          }} // Call the export function when clicked
        >
          Export as JPG
        </a>
      </li>
          </ul>
        </div>

        {/* Slider */}
        <label
          htmlFor="threshold-slider"
          className="text-md font-medium text-gray-700 mt-2 mb-4 text-left"
        >
          Threshold ({sliderValue})
        </label>
        <input
          type="range"
          id="threshold-slider"
          min="0"
          max="255"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full mb-4"
        />
        <button
          onClick={handleApplyThreshold}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 mb-4"
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-400 mb-4"
        >
          Reset
        </button>

        {/* Histogram */}
        <h2 className="text-xl font-bold text-gray-700 mt-2 mb-4 text-left">
          Histogram
        </h2>
        <div
          className="flex flex-col h-96 w-full border border-gray-300 rounded-md mb-1 overflow-y-auto"
          style={{ height: "600px" }}
        >
          {/* Original Histogram */}
          <div className="flex-1">
            <Bar
              data={originalChartData}
              options={{ maintainAspectRatio: false }}
            />
          </div>
          {/* Modified Histogram */}
          <div className="flex-1">
            <Bar
              data={modifiedChartData}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {isUploaded && (
          <button
            onClick={handleUploadAgain}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-500 w-full flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
