import React, { useState } from 'react';
import { downloadFile } from '../utils/commons';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import { MediaType } from '../constants/commons-const';
import { PDFViewer, PdfFocusProvider } from '@llamaindex/pdf-viewer';
import '@llamaindex/pdf-viewer/index.css';

const PDFBox = ({ slide }) => {
  const file = {
    id: slide.description,
    url: slide.src,
  };

  return (
    <PdfFocusProvider>
      <PDFViewer file={file} containerClassName="pdfViewer" />
    </PdfFocusProvider>
  );
};

const LightboxMedia = ({ openLightbox, setOpenlightbox, medias, indexMedia }) => {
  const [idx, setidx] = useState(indexMedia);

  // Custom render slide
  const render = ({ slide }) => {
    if (slide.type === MediaType.PDF) {
      return <PDFBox key={slide.description} slide={slide} />;
    }
    // fallback: để lightbox render mặc định
    return undefined;
  };

  const handleDownload = () => {
    const currentMedia = medias[idx];
    if (currentMedia) {
      downloadFile(currentMedia.src, currentMedia.description);
    }
  };

  const plugins = [Video, Fullscreen, Zoom, Captions];
  if (medias.length > 1) plugins.splice(1, 0, Thumbnails);

  return (
    <>
      <Lightbox
        open={openLightbox}
        close={() => setOpenlightbox(false)}
        slides={medias}
        index={indexMedia}
        plugins={plugins}
        captions={{ descriptionTextAlign: 'center' }}
        render={{
          slide: render,
          controls: () =>
            openLightbox && medias.length > 0 ? (
              <button
                type="button"
                title="Download"
                aria-label="Download"
                className="yarl__button"
                onClick={handleDownload}
                style={{ position: 'absolute', top: '7px', right: '202px' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width={24}
                  height={24}
                  aria-hidden="true"
                  focusable="false"
                  className="yarl__icon"
                >
                  <g fill="currentColor">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z" />
                  </g>
                </svg>
              </button>
            ) : null,
          ...(medias.length <= 1 && {
            buttonPrev: () => null,
            buttonNext: () => null,
          }),
        }}
        on={{
          view: ({ index }) => setidx(index),
        }}
        controller={{
          closeOnPullDown: true,
          closeOnBackdropClick: true,
          disableSwipeNavigation: medias.length <= 1,
        }}
      />
    </>
  );
};

export default LightboxMedia;
