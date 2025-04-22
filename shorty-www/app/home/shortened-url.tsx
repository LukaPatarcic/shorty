import { useState } from "react";
import { Link } from "react-router";

export function ShortenedUrl(props: { shortenedUrl: string, setError: (error: string) => void }) {
    const { shortenedUrl, setError } = props;
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);

    // Extract the code from the shortened URL
    const code = shortenedUrl.split('/').pop();

    const handleCopy = async () => {
        try {
            // Create a temporary input element
            const tempInput = document.createElement('input');
            tempInput.value = shortenedUrl;
            document.body.appendChild(tempInput);
            
            // Select the text
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            
            // Copy the text
            document.execCommand('copy');
            
            // Remove the temporary element
            document.body.removeChild(tempInput);
            
            // Show tooltip
            setShowCopyTooltip(true);
            setTimeout(() => setShowCopyTooltip(false), 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    return (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Your shortened URL:</p>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    readOnly
                    value={shortenedUrl}
                    className="flex-1 p-2 text-black bg-white border border-gray-300 rounded-md"
                />
                <div className="relative flex items-center space-x-2">
                    <button
                        onClick={handleCopy}
                        className="px-4 cursor-pointer py-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                        Copy
                    </button>
                    <Link
                        to={`/stats/${code}`}
                        className="px-4 cursor-pointer py-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                        Stats
                    </Link>
                    {showCopyTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded">
                            Copied!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}