import React, { useEffect, useRef, useState } from 'react';
import { SlideshowLightbox } from 'lightbox.js-react';
import { MediaType } from '../constants/commons-const';
import { useTheme } from '@mui/material';

const ImageCanvas = ({ dataUrl, width, height, styleCustom, openLightbox }) => {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const imageRef = useRef(new Image());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    // Xử lý load ảnh
    const handleImageLoad = () => {
      // Tính toán kích thước ảnh sau khi resize
      let newWidth = image.width;
      let newHeight = image.height;

      // Giảm kích thước nếu vượt quá maxWidth
      if (newWidth > width) {
        const ratio = width / newWidth;
        newWidth = width;
        newHeight *= ratio;
      }

      // Điều chỉnh canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Vẽ ảnh với chất lượng tối ưu
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
    };

    // Xử lý lỗi load ảnh
    const handleImageError = () => {
      console.error('Lỗi load ảnh:', src);
    };

    // Đăng ký sự kiện
    image.addEventListener('load', handleImageLoad);
    image.addEventListener('error', handleImageError);

    // Load ảnh
    image.src = dataUrl;

    // Cleanup
    return () => {
      image.removeEventListener('load', handleImageLoad);
      image.removeEventListener('error', handleImageError);
    };
  }, [dataUrl, width]);

  const onOpenLightbox = () => {
    if (openLightbox) {
      setIsOpen(true);
    }
  };

  const medias = [
    {
      type: MediaType.IMAGE,
      src: dataUrl,
      thumbnail: dataUrl,
      alt: 'image',
    },
  ];

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: width,
          height: height,
          objectFit: 'cover',
          cursor: openLightbox ? 'pointer' : 'inherit',
          ...styleCustom,
        }}
        onClick={onOpenLightbox}
      />

      <div style={{ position: 'fixed' }}>
        <SlideshowLightbox
          theme="lightbox"
          images={medias}
          startingSlideIndex={0}
          showThumbnails={false}
          open={isOpen}
          lightboxIdentifier="lbox1"
          onClose={() => {
            setIsOpen(false);
          }}
          downloadImages
          iconColor={theme.palette.grey[400]}
          imgAnimation="fade"
          // animateThumbnails
          roundedImages
          modalClose="clickOutside"
          lightboxImgClass="slideItem"
        />
      </div>
    </>
  );
};

export default ImageCanvas;
