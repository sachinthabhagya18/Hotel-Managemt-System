// 'use client'
// import "react-responsive-carousel/lib/styles/carousel.min.css";
// import { Carousel } from 'react-responsive-carousel';

// export default function RoomTypeImages(images){
// return (
//     <Carousel showThumbs={false}>
//       {images.map((img, index) => (<div>
//           <img 
//             src={img.image} />
//         </div>
//       ))}
//     </Carousel>
//     );
// }


'use client'
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';

export default function RoomTypeImages({ images = [] }) {
  return (
    <Carousel showThumbs={false}>
      {images.map((img, index) => (
        <div key={index}>
          <img 
            src={img.image} 
            alt={`Room image ${index + 1}`}
          />
        </div>
      ))}
    </Carousel>
  );
} 