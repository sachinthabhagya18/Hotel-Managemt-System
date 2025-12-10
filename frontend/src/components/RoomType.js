import Link from "next/link";

export default function RoomType({ item }) {
  const imgs = item.room_type_imgs;
  const first_image = imgs[0]?.image || 'https://placehold.co/600x400';

  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm">
        <img
          src={first_image}
          className="card-img-top"
          alt={item.title}
        />
        <div className="card-body">
          <h5 className="card-title">{item.title}</h5>
          <p className="card-text">
            Perfect for solo travelers. Comes with a single bed, free WiFi, and attached bathroom.
          </p>
        </div>
        <div className="card-footer text-center">
          <Link href={`/room_type/${item.uuid}`} className="btn btn-primary">
            View More
          </Link>
        </div>
      </div>
    </div>
  );
}