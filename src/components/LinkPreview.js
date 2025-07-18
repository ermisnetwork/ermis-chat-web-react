import React, { useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import { Card, CardActionArea, CardMedia, CardContent, Typography, Stack } from '@mui/material';
import NoImage from '../assets/Images/no-image.png';

export default function LinkPreview({ linkPreview }) {
  const theme = useTheme();
  const [linkData, setLinkData] = useState({ image: '', title: '', description: '', url: '' });

  useEffect(() => {
    if (linkPreview) {
      let urlObject;
      try {
        urlObject = new URL(linkPreview.link_url);
      } catch {
        urlObject = null;
      }
      const data = {
        image: linkPreview.image_url && linkPreview.image_url.startsWith('https://') ? linkPreview.image_url : NoImage,
        title: linkPreview.title || (urlObject ? urlObject.hostname : ''), // Sử dụng hostname từ URL nếu không có title
        description: linkPreview.description || 'No description available', // Mô tả mặc định nếu ko có
        url: linkPreview.link_url,
      };

      setLinkData(data);
    }
  }, [linkPreview]);

  const onOpenLink = () => {
    window.open(linkData.url, '_blank');
  };

  return (
    <Card onClick={onOpenLink}>
      <CardActionArea>
        <CardMedia component="img" height="140" image={linkData.image} alt={linkData.title} />
        <CardContent>
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {linkData.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {linkData.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
