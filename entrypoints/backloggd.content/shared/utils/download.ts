/**
 * Creates a Blob from the provided content and triggers a browser download.
 *
 * @param content - The string content to download.
 * @param filename - The filename for the downloaded file.
 * @param mimeType - The MIME type for the Blob.
 */
export const triggerBlobDownload = (
  content: string,
  filename: string,
  mimeType: string,
): void => {
  // 1. Create a Blob with the correct MIME type
  const blob = new Blob([content], { type: mimeType });

  // 2. Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();

  // 3. Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
