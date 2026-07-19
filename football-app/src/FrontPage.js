import React, { useState, useEffect } from "react";

const images = [
  "/football1.jpeg",
  "/football2.jpeg",
  "/football3.jpeg",
  "/football4.jpeg"
];

function FrontPage() {
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleImageError = (imgIndex) => {
    setImageErrors(prev => ({ ...prev, [imgIndex]: true }));
  };

  // 如果当前图片加载失败，显示备用文本
  if (imageErrors[index]) {
    return (
      <div style={{ width: "100%", height: "100vh", backgroundColor: "#222", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem" }}>
        ⚽ 图片加载失败，请检查文件是否存在
      </div>
    );
  }

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
        onError={() => handleImageError(index)}
      />
    </div>
  );
}

export default FrontPage;