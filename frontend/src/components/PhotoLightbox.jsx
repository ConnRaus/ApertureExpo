import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";

export function PhotoLightbox({ photos, selectedIndex, onClose }) {
  const slides = photos.map((photo) => ({
    src: photo.s3Url,
    title: photo.title,
    description: photo.description,
  }));

  return (
    <Lightbox
      open={selectedIndex >= 0}
      close={onClose}
      index={selectedIndex}
      slides={slides}
      plugins={[Thumbnails, Zoom, Counter]}
      carousel={{
        finite: false,
        preload: 3,
        padding: "16px",
      }}
      animation={{ fade: 300 }}
      controller={{ closeOnBackdropClick: true }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : undefined,
        buttonNext: slides.length <= 1 ? () => null : undefined,
      }}
    />
  );
}
