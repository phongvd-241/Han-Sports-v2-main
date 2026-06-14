import { useEffect, useState } from "react";

function withRetryToken(src) {
  if (!src) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}retry=${Date.now()}`;
}

export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  loading = "lazy",
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setFailed(!src);
  }, [src]);

  const handleError = () => {
    if (retryCount === 0 && src) {
      setRetryCount(1);
      setCurrentSrc(withRetryToken(src));
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center text-text-muted ${fallbackClassName}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 44 }}>image_not_supported</span>
        <span className="mt-1 text-xs font-medium">Ảnh đang được cập nhật</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={handleError}
    />
  );
}
