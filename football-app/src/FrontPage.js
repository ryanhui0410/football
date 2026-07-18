import React, { useState, useEffect } from "react";

const images = [
  "/football1.jpeg",
  "/football2.jpeg",
  "/football3.jpeg",
  "/football4.jpeg"
];

function FrontPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // change every 3 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#000" }}>
      <img
        src={images[index]}
        alt={`Slide ${index}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />
    </div>
  );
}

export default FrontPage;
