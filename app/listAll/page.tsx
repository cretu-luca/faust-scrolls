"use client";
import React, { useEffect, useState } from "react";

const ListAll = () => {
  const [libraryEntries, setLibraryEntries] = useState([]);

  useEffect(() => {
    const storedEntries = localStorage.getItem("libraryEntries");
    if (storedEntries) {
      setLibraryEntries(JSON.parse(storedEntries));
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Faust's Library Entries</h1>

      {libraryEntries.length === 0 ? (
        <p>No entries found in the library.</p>
      ) : (
        <div className="space-y-4">
          {libraryEntries.map((entry, index) => (
            <div key={index} className="border p-4 rounded">
              <p>
                <strong>Title:</strong> {entry.title}
              </p>
              <p>
                <strong>Author:</strong> {entry.author}
              </p>
              <p>
                <strong>Domain:</strong> {entry.domain}
              </p>
              <p>
                <strong>Citations:</strong> {entry.citations}
              </p>
              <p>
                <strong>Year:</strong> {entry.yearOfPublication}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListAll;
